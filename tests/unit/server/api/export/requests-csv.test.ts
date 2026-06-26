import { describe, expect, it, vi } from 'vitest';

import {
    buildJsonApiExportParams,
    buildExportFieldSelection,
    buildExportForwardHeaders,
    buildExportHeaders,
    buildFixedExportHeaders,
    buildDrupalFieldValueResolvers,
    canExportInternalStatusAttributes,
    collectFacilityLabels,
    deriveStatusAttributeColumns,
    drupalFieldHeaderLabel,
    expandManagementRelationshipIncludes,
    formatDrupalFieldValue,
    formatExportRow,
    fetchAttributeResolutionContext,
    formatStatusNotes,
    mapExportSortToJsonApi,
    nextExportOffset,
    normalizeExportFieldFilter,
    normalizeStatusNoteTimestamp,
    resolveAuthorizedExportJurisdictionScope,
    resolveExportJurisdictionScope,
    resolveJsonApiExportFieldOptions,
    resolveManagementFieldColumnContext,
    resolveScopedExportOrgGroupIds,
    resolveDrupalFieldColumns,
    resolveStatusAttributesForExport,
    shouldAbortExportForStaleSession,
    transformJsonApiRequestForExport
} from '~/server/api/export/requests-csv.get';

vi.mock('#imports', () => ({
    // Mirror the production secure-by-default: TLS verification on. Tests
    // that need to exercise the dev-with-self-signed-cert path should
    // override per-test instead of normalising `false` here.
    useRuntimeConfig: () => ({ public: {}, proxy: { rejectUnauthorized: true } })
}));

describe('requests-csv export field selection', () => {
    it('maps dashboard export sort keys to JSON:API sort paths', () => {
        expect(mapExportSortToJsonApi('-nid')).toBe('-drupal_internal__nid');
        expect(mapExportSortToJsonApi('updated')).toBe('changed');
        expect(mapExportSortToJsonApi('-service_code')).toBe('-field_category.field_service_code');
        expect(mapExportSortToJsonApi('status')).toBe('field_status.field_open311_mapping');
        expect(mapExportSortToJsonApi('unknown')).toBe('created');
    });

    it('adds internal status definitions to request attribute export labels', async () => {
        const fetchJsonApi = vi.fn(async (path: string) => {
            if (path.startsWith('/jsonapi/taxonomy_term/service_category')) {
                return {
                    data: [
                        {
                            attributes: {
                                field_service_definition: JSON.stringify([
                                    { code: 'anzahl', description: 'Anzahl', datatype: 'number', order: 0 }
                                ])
                            }
                        }
                    ]
                };
            }
            if (path.startsWith('/jsonapi/taxonomy_term/internal_status')) {
                return {
                    data: [
                        {
                            attributes: {
                                field_status_definition: JSON.stringify([
                                    {
                                        code: 'radbuegel_systemskizze',
                                        description: 'Welche Systemskizze wird montiert?',
                                        datatype: 'imagelist',
                                        media_type: 'catalog_image',
                                        media_group: 'radbuegel_bautypen',
                                        order: 1
                                    }
                                ])
                            }
                        }
                    ]
                };
            }
            if (path.startsWith('/jsonapi/media/catalog_image')) {
                return {
                    data: [
                        {
                            id: '3807faf3-a111-40a8-aec4-c87bcf458673',
                            attributes: { name: 'Anlehnbügel 7b' }
                        }
                    ]
                };
            }
            return { data: [] };
        });

        const context = await fetchAttributeResolutionContext('19', fetchJsonApi as any);

        expect(context.orderedCodes).toEqual(['anzahl', 'radbuegel_systemskizze']);
        expect(context.labels.get('radbuegel_systemskizze')).toBe('Welche Systemskizze wird montiert?');
        expect(context.valueResolvers.get('radbuegel_systemskizze')?.get('3807faf3-a111-40a8-aec4-c87bcf458673')).toBe('Anlehnbügel 7b');
        expect(fetchJsonApi).toHaveBeenCalledWith(
            expect.stringContaining('/jsonapi/taxonomy_term/internal_status?'),
            15000
        );
    });

    it('advances pagination by actual received rows, not requested batch size', () => {
        expect(nextExportOffset(0, 50)).toBe(50);
        expect(nextExportOffset(50, 50)).toBe(100);
        expect(nextExportOffset(150, 25)).toBe(175);
    });

    it('builds JSON:API export params with IN, NOT IN, search, and sparse fields', () => {
        const params = buildJsonApiExportParams({
            limit: 100,
            offset: 200,
            sort: '-service_code',
            jurisdictionIds: ['19', '20'],
            status: 'open,closed',
            excludeStatus: 'archived',
            serviceCode: 'rad.buegel',
            excludeServiceCode: 'trash',
            dateFrom: '2026-05-01',
            dateTo: '2026-05-07',
            search: 'test@example.com',
            fieldStatus: undefined,
            excludeFieldStatus: undefined,
            fieldCategory: undefined,
            excludeFieldCategory: undefined,
            fieldHazardLevel: '3,4',
            fieldFacility: 'bike-rack',
            fieldDistrict: '7',
            fieldSublocality: '11',
            orgGroupIds: ['4'],
            fullTier: false,
            fieldOptions: {
                includeDistrict: true,
                includeSublocality: true
            }
        });

        expect(params.get('page[limit]')).toBe('100');
        expect(params.get('page[offset]')).toBe('200');
        expect(params.get('sort')).toBe('-field_category.field_service_code');
        expect(params.get('fields[node--service_request]')).toContain('field_request_attributes');
        expect(params.get('fields[node--service_request]')).toContain('field_district');
        expect(params.get('include')).toContain('field_district');
        expect(params.get('fields[node--service_request]')).not.toContain('field_facility');
        expect(params.get('filter[field-jurisdiction][condition][operator]')).toBe('IN');
        expect(params.get('filter[field-jurisdiction][condition][value][0]')).toBe('19');
        expect(params.get('filter[field-jurisdiction][condition][value][1]')).toBe('20');
        expect(params.get('filter[status-mapping][condition][operator]')).toBe('IN');
        expect(params.get('filter[status-mapping-not][condition][operator]')).toBe('NOT IN');
        expect(params.get('filter[category-code][condition][value]')).toBe('rad.buegel');
        expect(params.get('filter[category-code-not][condition][operator]')).toBe('NOT IN');
        expect(params.get('filter[created-before][condition][value]')).toBe('2026-05-07T23:59:59');
        expect(params.get('filter[email][condition][value]')).toBe('test@example.com');
        expect(params.get('filter[phone][condition][memberOf]')).toBe('search');
        expect(params.get('filter[field-organisation][condition][value]')).toBe('4');
    });

    it('includes district relationship data for unfiltered JSON:API exports', () => {
        const params = buildJsonApiExportParams({
            limit: 100,
            offset: 0,
            sort: '-created',
            jurisdictionIds: ['19'],
            orgGroupIds: [],
            fullTier: false,
            fieldOptions: {
                includeDistrict: true
            }
        });

        expect(params.get('fields[node--service_request]')).toContain('field_district');
        expect(params.get('include')?.split(',')).toContain('field_district');
        expect(params.get('fields[taxonomy_term--district]')).toBe('drupal_internal__tid,name');
        expect(params.has('filter[field-district][condition][value]')).toBe(false);
    });

    it('omits optional geo relationships when the jurisdiction settings do not expose them', () => {
        const params = buildJsonApiExportParams({
            limit: 100,
            offset: 0,
            sort: '-created',
            jurisdictionIds: ['19'],
            fieldDistrict: '7',
            fieldSublocality: '11',
            orgGroupIds: [],
            fullTier: false
        });

        expect(params.get('fields[node--service_request]')).not.toContain('field_district');
        expect(params.get('fields[node--service_request]')).not.toContain('field_sublocality');
        expect(params.get('include')?.split(',')).not.toContain('field_district');
        expect(params.get('include')?.split(',')).not.toContain('field_sublocality');
        expect(params.has('fields[taxonomy_term--district]')).toBe(false);
        expect(params.has('fields[taxonomy_term--sublocality]')).toBe(false);
        expect(params.get('filter[unsupported-field-district][condition][path]')).toBe('drupal_internal__nid');
        expect(params.get('filter[unsupported-field-district][condition][value]')).toBe('0');
        expect(params.get('filter[unsupported-field-sublocality][condition][path]')).toBe('drupal_internal__nid');
        expect(params.get('filter[unsupported-field-sublocality][condition][value]')).toBe('0');
    });

    it('does not let the slug widen the numeric jurisdiction settings scope', async () => {
        const localFetch = vi.fn(async (path: string) => {
            if (path.includes('jurisdiction=19')) {
                return {
                    jurisdiction: { id: 19, taxonomyJurisdictionId: 19 }
                };
            }
            if (path.includes('jurisdiction=bonn-mobility')) {
                throw new Error('slug settings should not be fetched when jurisdiction_id is present');
            }
            return {};
        });

        const scope = await resolveExportJurisdictionScope('19', 'bonn-mobility', localFetch);

        expect(scope.requestJurisdictionIds).toEqual(['19']);
        expect(scope.taxonomyJurisdictionIds).toEqual(['19']);
        expect(localFetch).toHaveBeenCalledTimes(1);
    });

    it('authorizes export jurisdiction scope against user jurisdiction memberships', () => {
        expect(resolveAuthorizedExportJurisdictionScope(['19'], [
            { id: '19', type: 'jur', label: 'Bonn', roles: [{ id: 'jur-editorial' }] },
            { id: '2', type: 'org', label: 'Department' }
        ])).toEqual({
            allowed: true,
            authorizedJurisdictionIds: ['19'],
            forbiddenJurisdictionIds: []
        });
    });

    it('rejects export jurisdiction scope outside the user memberships', () => {
        expect(resolveAuthorizedExportJurisdictionScope(['20'], [
            { id: '19', type: 'jur', label: 'Bonn', roles: [{ id: 'jur-editorial' }] }
        ])).toEqual({
            allowed: false,
            authorizedJurisdictionIds: [],
            forbiddenJurisdictionIds: ['20'],
            reason: 'out_of_scope'
        });
    });

    it('rejects partially out-of-scope export jurisdiction requests without narrowing silently', () => {
        expect(resolveAuthorizedExportJurisdictionScope(['19', '20'], [
            { id: '19', type: 'jur', label: 'Bonn', roles: [{ id: 'jur-editorial' }] }
        ])).toEqual({
            allowed: false,
            authorizedJurisdictionIds: ['19'],
            forbiddenJurisdictionIds: ['20'],
            reason: 'out_of_scope'
        });
    });

    it('rejects jurisdiction memberships without elevated dashboard group roles', () => {
        expect(resolveAuthorizedExportJurisdictionScope(['19'], [
            { id: '19', type: 'jur', label: 'Bonn', roles: [{ id: 'jur-member' }] }
        ], ['authenticated'])).toEqual({
            allowed: false,
            authorizedJurisdictionIds: [],
            forbiddenJurisdictionIds: ['19'],
            reason: 'out_of_scope'
        });
    });

    it('keeps global dashboard export roles cross-jurisdiction', () => {
        expect(resolveAuthorizedExportJurisdictionScope(['20'], [
            { id: '19', type: 'jur', label: 'Bonn' }
        ], ['administrator'])).toEqual({
            allowed: true,
            authorizedJurisdictionIds: ['20'],
            forbiddenJurisdictionIds: []
        });

        expect(resolveAuthorizedExportJurisdictionScope(['20'], [
            { id: '19', type: 'jur', label: 'Bonn' }
        ], ['editorial_board'])).toEqual({
            allowed: true,
            authorizedJurisdictionIds: ['20'],
            forbiddenJurisdictionIds: []
        });
    });

    it('allows site moderators only for their explicit jurisdiction groups', () => {
        expect(resolveAuthorizedExportJurisdictionScope(['19'], [
            { id: '19', type: 'jur', label: 'Bonn' }
        ], ['moderator'])).toEqual({
            allowed: true,
            authorizedJurisdictionIds: ['19'],
            forbiddenJurisdictionIds: []
        });

        expect(resolveAuthorizedExportJurisdictionScope(['20'], [
            { id: '19', type: 'jur', label: 'Bonn' }
        ], ['moderator'])).toEqual({
            allowed: false,
            authorizedJurisdictionIds: [],
            forbiddenJurisdictionIds: ['20'],
            reason: 'out_of_scope'
        });
    });

    it('fails closed when no export jurisdiction can be resolved', () => {
        expect(resolveAuthorizedExportJurisdictionScope([], [
            { id: '19', type: 'jur', label: 'Bonn' }
        ], ['administrator'])).toEqual({
            allowed: false,
            authorizedJurisdictionIds: [],
            forbiddenJurisdictionIds: [],
            reason: 'no_requested_jurisdiction'
        });
    });

    it('keeps slug-only export scope working when it resolves to a user jurisdiction', async () => {
        const localFetch = vi.fn(async (path: string) => {
            expect(path).toContain('jurisdiction=bonn-mobility');
            return {
                jurisdiction: { id: 19, taxonomyJurisdictionId: 19 }
            };
        });

        const scope = await resolveExportJurisdictionScope('', 'bonn-mobility', localFetch);
        const access = resolveAuthorizedExportJurisdictionScope(scope.requestJurisdictionIds, [
            { id: '19', type: 'jur', label: 'Bonn', roles: [{ id: 'jur-editorial' }] }
        ]);

        expect(scope.requestJurisdictionIds).toEqual(['19']);
        expect(access.allowed).toBe(true);
        expect(access.authorizedJurisdictionIds).toEqual(['19']);
    });

    it('adds management relationship fields to full-tier JSON:API includes', () => {
        const params = buildJsonApiExportParams({
            limit: 100,
            offset: 0,
            sort: '-created',
            jurisdictionIds: ['19'],
            orgGroupIds: [],
            fullTier: true,
            managementRelationshipFields: [
                'field_service_provider',
                'field_attachment',
                'field_request_media'
            ]
        });

        const includes = params.get('include')?.split(',') || [];
        expect(includes).toContain('field_service_provider');
        expect(includes).toContain('field_attachment');
        expect(includes.filter(item => item === 'field_request_media')).toHaveLength(1);
    });

    it('keeps management relationship includes unique without expanding denylisted authors', () => {
        expect(expandManagementRelationshipIncludes([
            'field_internal_remark',
            'field_service_provider',
            'field_internal_remark'
        ])).toEqual([
            'field_internal_remark',
            'field_service_provider'
        ]);
    });

    it('does not add management relationship includes for non-full tiers', () => {
        const params = buildJsonApiExportParams({
            limit: 100,
            offset: 0,
            sort: '-created',
            jurisdictionIds: ['19'],
            orgGroupIds: [],
            fullTier: false,
            managementRelationshipFields: ['field_service_provider']
        });

        expect(params.get('include')?.split(',')).not.toContain('field_service_provider');
    });

    it('prefers explicit dashboard organisation scope for cross-organisation export roles', () => {
        expect(resolveScopedExportOrgGroupIds({
            groupFilter: '1',
            requestedOrgGroupIds: ['2', '3', '4'],
            userRoles: ['administrator'],
            userGroups: [
                { id: '19', type: 'jur', label: 'Bonn' },
                { id: '2', type: 'org', label: 'A' }
            ]
        })).toEqual(['2', '3', '4']);
    });

    it('intersects requested dashboard organisation scope for regular users', () => {
        expect(resolveScopedExportOrgGroupIds({
            groupFilter: '1',
            requestedOrgGroupIds: ['2', '3', '4'],
            userRoles: ['authenticated'],
            userGroups: [
                { id: '19', type: 'jur', label: 'Bonn' },
                { id: '2', type: 'org', label: 'A' }
            ]
        })).toEqual(['2']);
    });

    it('falls back to server-side user groups for legacy group-filtered exports', () => {
        expect(resolveScopedExportOrgGroupIds({
            groupFilter: '1',
            requestedOrgGroupIds: [],
            userRoles: ['administrator'],
            userGroups: [
                { id: '19', type: 'jur', label: 'Bonn' },
                { id: '2', type: 'org', label: 'A' }
            ]
        })).toEqual(['2']);
    });

    it('allows legacy all-organisation fallback only for cross-organisation roles without memberships', () => {
        expect(resolveScopedExportOrgGroupIds({
            groupFilter: '1',
            requestedOrgGroupIds: [],
            userRoles: ['administrator'],
            userGroups: [
                { id: '19', type: 'jur', label: 'Bonn' }
            ]
        })).toEqual([]);

        expect(resolveScopedExportOrgGroupIds({
            groupFilter: '1',
            requestedOrgGroupIds: [],
            userRoles: ['authenticated'],
            userGroups: [
                { id: '19', type: 'jur', label: 'Bonn' }
            ]
        })).toEqual(['0']);
    });

    it('prevents regular users from exporting arbitrary single organisation ids', () => {
        expect(resolveScopedExportOrgGroupIds({
            groupId: '9',
            groupFilter: '1',
            requestedOrgGroupIds: ['2', '3'],
            userRoles: ['authenticated'],
            userGroups: [
                { id: '2', type: 'org', label: 'A' }
            ]
        })).toEqual(['0']);
    });

    it('limits explicit organisation filter expansion for upstream JSON:API URLs', () => {
        const requestedIds = Array.from({ length: 300 }, (_, index) => String(index + 1));

        const scopedIds = resolveScopedExportOrgGroupIds({
            groupFilter: '1',
            requestedOrgGroupIds: requestedIds,
            userRoles: ['administrator'],
            userGroups: []
        });

        expect(scopedIds).toHaveLength(256);
        expect(scopedIds[0]).toBe('1');
        expect(scopedIds[255]).toBe('256');
    });

    it('omits the node sparse fieldset for full-tier JSON:API exports', () => {
        const params = buildJsonApiExportParams({
            limit: 100,
            offset: 0,
            sort: '-created',
            jurisdictionIds: ['19'],
            orgGroupIds: [],
            fullTier: true
        });

        expect(params.has('fields[node--service_request]')).toBe(false);
        expect(params.get('include')).toContain('field_status_notes.field_status_term');
    });

    it('builds proxy-compatible forwarding headers for session-backed exports', () => {
        expect(buildExportForwardHeaders(
            'SSESSabc=123',
            'csrf-token',
            'bonn-mobility.ddev.site'
        )).toEqual({
            'Accept': 'application/json',
            'X-Forwarded-Proto': 'https',
            'X-Forwarded-Host': 'bonn-mobility.ddev.site',
            'cookie': 'SSESSabc=123',
            'X-CSRF-Token': 'csrf-token'
        });
    });

    it('omits optional forwarding headers when no session context is present', () => {
        expect(buildExportForwardHeaders(undefined, '', '')).toEqual({
            'Accept': 'application/json',
            'X-Forwarded-Proto': 'https'
        });
    });

    it('uses forwarded host and proto for session token requests before CSRF is known', () => {
        expect(buildExportForwardHeaders(
            'SSESSabc=123',
            '',
            'bonn-mobility.ddev.site'
        )).toEqual({
            'Accept': 'application/json',
            'X-Forwarded-Proto': 'https',
            'X-Forwarded-Host': 'bonn-mobility.ddev.site',
            'cookie': 'SSESSabc=123'
        });
    });

    it('fails closed when a session-backed export receives anonymous-looking request data', () => {
        expect(shouldAbortExportForStaleSession(true, [
            { service_request_id: 'REQ-1', extended_attributes: {} }
        ])).toBe(true);
        expect(shouldAbortExportForStaleSession(true, [
            { service_request_id: 'REQ-1', extended_attributes: { escalated: false } }
        ])).toBe(true);
        expect(shouldAbortExportForStaleSession(true, [
            { service_request_id: 'REQ-1', extended_attributes: { drupal: { field_e_mail: [{ value: 'user@example.com' }] } } }
        ])).toBe(false);
        expect(shouldAbortExportForStaleSession(false, [
            { service_request_id: 'REQ-1', extended_attributes: {} }
        ])).toBe(false);
    });

    it('omitsOrgWhenFieldAbsent', () => {
        const selection = buildExportFieldSelection({
            orderedCodes: ['field_priority', 'field_status'],
            serviceDefinitionsLoaded: true
        });

        expect(selection.includeOrganisationColumn).toBe(false);
        expect(selection.requestFields).toBe('field_hazard_level,field_sentiment,field_ai_hazard_category');
    });

    it('includes organisation when the service definition exposes it', () => {
        const selection = buildExportFieldSelection({
            orderedCodes: ['field_status', 'field_organisation'],
            serviceDefinitionsLoaded: true
        });

        expect(selection.includeOrganisationColumn).toBe(true);
        expect(selection.requestFields).toBe('field_hazard_level,field_sentiment,field_ai_hazard_category,field_organisation');
    });

    it('omits organisation when service definitions cannot be loaded', () => {
        const selection = buildExportFieldSelection({
            orderedCodes: [],
            serviceDefinitionsLoaded: false
        });

        expect(selection.includeOrganisationColumn).toBe(false);
        expect(selection.requestFields).toBe('field_hazard_level,field_sentiment,field_ai_hazard_category');
    });

    it('keeps header and row columns aligned when organisation is omitted', () => {
        const headers = buildFixedExportHeaders(false);
        const row = formatExportRow({
            service_request_id: 'REQ-1',
            title: 'Broken light',
            description: 'Lamp is out',
            service_name: 'Lighting',
            service_code: 'lighting',
            status: 'open',
            address_string: 'Main Street 1',
            lat: 52.1,
            long: 13.1,
            requested_datetime: '2026-05-01T10:00:00Z',
            updated_datetime: '2026-05-01T11:00:00Z',
            media_url: 'https://example.test/image.jpg',
            organisation: { label: 'Hidden Org' },
            extended_attributes: {
                drupal: {
                    field_hazard_level: [{ value: 2 }],
                    field_sentiment: [{ value: 'neutral' }],
                    field_ai_hazard_category: [{ value: 'lighting' }]
                },
                markaspot: {
                    nid: 123,
                    published: true,
                    district: { name: 'Center' },
                    status_notes: []
                },
                attributes: {}
            }
        }, [], ',', undefined, false).split(',');

        expect(headers).not.toContain('Organisation');
        expect(row).not.toContain('Hidden Org');
        expect(row).toHaveLength(headers.length);
        expect(row[headers.indexOf('Hazard Level')]).toBe('2');
    });

    it('neutralizes spreadsheet formulas with leading whitespace in server rows', () => {
        const row = formatExportRow({
            service_request_id: 'REQ-1',
            title: ' =HYPERLINK("https://example.com")',
            description: 'normal',
            service_name: 'Lighting',
            service_code: 'lighting',
            status: 'open',
            address_string: 'Main Street 1',
            lat: 52.1,
            long: 13.1,
            requested_datetime: '2026-05-01T10:00:00Z',
            updated_datetime: '2026-05-01T11:00:00Z',
            extended_attributes: {
                drupal: {},
                markaspot: {},
                attributes: {}
            }
        }, [], ',', undefined, false);

        expect(row).toContain('"\t =HYPERLINK(""https://example.com"")"');
    });

    it('normalizes direct export field filters against allowlists', () => {
        expect(normalizeExportFieldFilter('3,4', /^[0-4](,[0-4])*$/)).toBe('3,4');
        expect(normalizeExportFieldFilter(' 10 ', /^\d+(,\d+)*$/)).toBe('10');
        expect(normalizeExportFieldFilter('9', /^\d+(,\d+)*$/)).toBe('9');
        expect(normalizeExportFieldFilter('3,99', /^[0-4](,[0-4])*$/)).toBeUndefined();
        expect(normalizeExportFieldFilter('1'.repeat(65), /^\d+(,\d+)*$/)).toBeUndefined();
    });
});

describe('status notes serialization', () => {
    it('returns empty string when there are no notes', () => {
        expect(formatStatusNotes(undefined)).toBe('');
        expect(formatStatusNotes([])).toBe('');
    });

    it('renders one human-readable note per line', () => {
        expect(formatStatusNotes([
            { status_descriptive_name: 'New', status_note: 'Received', updated_datetime: '2026-05-16T10:00:00Z' },
            { status_descriptive_name: 'In Progress', status_note: 'Reviewing', updated_datetime: '2026-05-17T09:00:00Z' }
        ])).toBe('New: Received (2026-05-16)\nIn Progress: Reviewing (2026-05-17)');
    });

    it('omits missing parts without dangling separators', () => {
        expect(formatStatusNotes([{ status_descriptive_name: 'Closed' }])).toBe('Closed');
        expect(formatStatusNotes([{ status_note: 'note only', updated_datetime: '2026-05-16T00:00:00Z' }]))
            .toBe('note only (2026-05-16)');
    });

    it('falls back to the raw status code when the descriptive name is missing', () => {
        expect(formatStatusNotes([
            { status: 'open', status_note: 'received', updated_datetime: '2026-05-16T00:00:00Z' }
        ])).toBe('open: received (2026-05-16)');
    });

    it('appends resolved status attributes to status notes', () => {
        expect(formatStatusNotes([
            {
                status_descriptive_name: 'Umgesetzt / Beauftragt',
                status_note: 'Status wurde geändert.',
                updated_datetime: '2026-05-16T00:00:00Z',
                resolved_status_attributes: [
                    {
                        code: 'radbuegel_systemskizze',
                        label: 'Welche Systemskizze wird montiert?',
                        value: 'Anlehnbügel 7b'
                    }
                ]
            }
        ])).toBe('Umgesetzt / Beauftragt: Status wurde geändert. | Welche Systemskizze wird montiert?: Anlehnbügel 7b (2026-05-16)');
    });

    it('emits multi-line text rather than a JSON blob in the row', () => {
        const row = formatExportRow({
            service_request_id: 'REQ-2',
            extended_attributes: {
                drupal: {},
                markaspot: {
                    nid: 1,
                    published: true,
                    status_notes: [
                        { status_descriptive_name: 'New', status_note: 'Received', updated_datetime: '2026-05-16T10:00:00Z' },
                        { status_descriptive_name: 'In Progress', status_note: 'Reviewing', updated_datetime: '2026-05-17T09:00:00Z' }
                    ]
                },
                attributes: {}
            }
        }, [], ',', undefined, false);

        // The "\n" between notes forces escapeCsvValue() to quote the cell.
        expect(row).toContain('"New: Received (2026-05-16)\nIn Progress: Reviewing (2026-05-17)"');
        expect(row).not.toContain('[{');
    });

    it('neutralizes a formula on a later line of a multi-line status-notes cell', () => {
        const row = formatExportRow({
            service_request_id: 'REQ-3',
            extended_attributes: {
                drupal: {},
                markaspot: {
                    nid: 1,
                    published: true,
                    status_notes: [
                        { status_descriptive_name: 'New', status_note: 'ok', updated_datetime: '2026-05-16T10:00:00Z' },
                        // Empty status -> the line starts with the note text.
                        { status_note: '=HYPERLINK("http://evil")', updated_datetime: '2026-05-17T09:00:00Z' }
                    ]
                },
                attributes: {}
            }
        }, [], ',', undefined, false);

        // The second line carries a formula prefix and must be tab-guarded.
        expect(row).toContain('\t=HYPERLINK');
    });

    it('neutralizes a formula after a bare CR separator (legacy line terminator)', () => {
        // A lone \r as the line terminator used to slip past a \n-only split,
        // re-enabling formula injection in spreadsheets that honour \r.
        const row = formatExportRow({
            service_request_id: 'REQ-4',
            description: 'first line\r=HYPERLINK("http://evil")'
        }, [], ',', undefined, false);

        expect(row).toContain('\t=HYPERLINK');
    });

    it('neutralizes a tab-prefixed formula in input data', () => {
        // Tab-leading inputs must still be caught by the FORMULA_PREFIXES
        // regex (which allows leading whitespace) and gain an extra guard tab.
        const row = formatExportRow({
            service_request_id: 'REQ-5',
            title: '\t=HYPERLINK("http://evil")'
        }, [], ',', undefined, false);

        expect(row).toContain('\t\t=HYPERLINK');
    });
});

describe('status attribute export resolution', () => {
    it('resolves imagelist status attributes to media labels', () => {
        const result = resolveStatusAttributesForExport(
            { radbuegel_systemskizze: '3807faf3-a111-40a8-aec4-c87bcf458673' },
            [
                {
                    code: 'radbuegel_systemskizze',
                    description: 'Welche Systemskizze wird montiert?',
                    datatype: 'imagelist',
                    order: 1,
                    media_type: 'catalog_image',
                    media_group: 'radbuegel_bautypen'
                }
            ],
            new Map([['3807faf3-a111-40a8-aec4-c87bcf458673', 'Anlehnbügel 7b']])
        );

        expect(result).toEqual([
            {
                code: 'radbuegel_systemskizze',
                label: 'Welche Systemskizze wird montiert?',
                value: 'Anlehnbügel 7b'
            }
        ]);
    });

    it('allows internal status attribute export only for dashboard roles', () => {
        expect(canExportInternalStatusAttributes(['anonymous'])).toBe(false);
        expect(canExportInternalStatusAttributes(['authenticated'])).toBe(false);
        expect(canExportInternalStatusAttributes(['tenant_admin'])).toBe(true);
        expect(canExportInternalStatusAttributes(['moderator'])).toBe(true);
        expect(canExportInternalStatusAttributes(['authenticated'], [
            {
                type: 'jur',
                roles: [{ id: 'jur-tenant_admin' }]
            }
        ])).toBe(true);
        expect(canExportInternalStatusAttributes(['authenticated'], [
            {
                id: '19',
                type: 'jur',
                roles: [{ id: 'jur-tenant_admin' }]
            }
        ], ['19'])).toBe(true);
        expect(canExportInternalStatusAttributes(['authenticated'], [
            {
                id: '20',
                type: 'jur',
                roles: [{ id: 'jur-tenant_admin' }]
            }
        ], ['19'])).toBe(false);
        expect(canExportInternalStatusAttributes(['authenticated'], [
            {
                id: '99',
                type: 'org',
                roles: [{ id: 'org-admin' }]
            }
        ], ['19'])).toBe(false);
    });
});

describe('full-tier complete-entity columns', () => {
    const sample = [
        {
            extended_attributes: {
                drupal: {
                    field_service_provider: { target_id: 1, label: 'DWP' },
                    field_hazard_level: [{ value: 2 }],
                    field_phone: [{ value: '030-1' }]
                }
            }
        },
        {
            extended_attributes: {
                drupal: {
                    field_service_provider: { target_id: 1, label: 'DWP' },
                    field_priority: [{ value: 'high' }]
                }
            }
        }
    ];

    it('resolves the sorted union of drupal fields minus fixed columns for the full tier', () => {
        expect(resolveDrupalFieldColumns(sample, 'full')).toEqual([
            'field_phone', 'field_priority', 'field_service_provider'
        ]);
    });

    it('builds management column context from visible fields only', () => {
        const context = resolveManagementFieldColumnContext({
            fields: {
                field_phone: {
                    label: 'Telefon',
                    field_type: 'telephone',
                    display_settings: { region: 'content', weight: 10 }
                },
                field_attachment: {
                    label: 'Anlagen',
                    field_type: 'file',
                    display_settings: { region: 'content', weight: 20 }
                },
                field_sublocality: {
                    label: 'Stadtteil',
                    field_type: 'entity_reference',
                    display_settings: { region: 'content', weight: 15 }
                },
                field_hidden: {
                    label: 'Hidden',
                    field_type: 'string',
                    display_settings: { region: 'hidden' }
                },
                field_notes: {
                    label: 'Notes',
                    field_type: 'string',
                    display_settings: { region: 'content' }
                },
                field_author: {
                    label: 'Author',
                    field_type: 'entity_reference',
                    display_settings: { region: 'content' }
                },
                field_status_internal: {
                    label: 'Internal Status',
                    field_type: 'list_string',
                    display_settings: { region: 'content', weight: 30 },
                    settings: {
                        allowed_values: { pending: 'Pending review' }
                    }
                },
                field_status_internal_term: {
                    label: 'Internal Status',
                    field_type: 'entity_reference',
                    display_settings: { region: 'content', weight: 40 }
                }
            },
            field_groups: {
                group_hidden: {
                    region: 'hidden',
                    parent: null,
                    children: ['field_notes']
                }
            }
        });

        expect(context.visibleFieldKeys).toEqual([
            'field_phone',
            'field_attachment',
            'field_sublocality',
            'field_author',
            'field_status_internal',
            'field_status_internal_term'
        ]);
        expect(context.orderedFieldKeys).toEqual([
            'field_phone',
            'field_attachment',
            'field_status_internal',
            'field_status_internal_term'
        ]);
        expect(context.labels.get('field_phone')).toBe('Telefon');
        expect(context.relationshipFieldKeys).toEqual(['field_attachment', 'field_status_internal_term']);
        expect(context.valueResolvers.get('field_status_internal')?.get('pending')).toBe('Pending review');
    });

    it('derives optional JSON:API relationship capabilities from the management field contract', () => {
        const context = resolveManagementFieldColumnContext({
            fields: {
                field_phone: {
                    label: 'Phone',
                    field_type: 'telephone',
                    display_settings: { region: 'content' }
                },
                field_sublocality: {
                    label: 'Sublocality',
                    field_type: 'entity_reference',
                    display_settings: { region: 'content' }
                }
            }
        });

        expect(resolveJsonApiExportFieldOptions(context.visibleFieldKeys)).toEqual({
            includeDistrict: false,
            includeSublocality: true
        });
    });

    it('orders management columns by display weight before field name', () => {
        const context = resolveManagementFieldColumnContext({
            fields: {
                field_zeta: {
                    label: 'Zeta',
                    field_type: 'string',
                    display_settings: { region: 'content', weight: 30 }
                },
                field_alpha: {
                    label: 'Alpha',
                    field_type: 'string',
                    display_settings: { region: 'content', weight: 10 }
                },
                field_beta: {
                    label: 'Beta',
                    field_type: 'string',
                    display_settings: { region: 'content', weight: 10 }
                }
            }
        });

        expect(context.orderedFieldKeys).toEqual([
            'field_alpha',
            'field_beta',
            'field_zeta'
        ]);
    });

    it('keeps management form fields before sample-only fields even when the first batch has no value', () => {
        expect(resolveDrupalFieldColumns(sample, 'full', [
            'field_attachment',
            'field_status',
            'field_phone',
            'field_author'
        ])).toEqual([
            'field_attachment',
            'field_phone',
            'field_priority',
            'field_service_provider'
        ]);
    });

    it('returns no extra columns for non-full tiers', () => {
        expect(resolveDrupalFieldColumns(sample, 'moderator')).toEqual([]);
        expect(resolveDrupalFieldColumns(sample, 'anonymous')).toEqual([]);
    });

    it('ignores drupal keys without a field_ prefix', () => {
        const noisy = [{
            extended_attributes: {
                drupal: {
                    field_phone: [{ value: '1' }],
                    body: [{ value: 'description' }],
                    content_translation_outdated: [{ value: false }]
                }
            }
        }];
        expect(resolveDrupalFieldColumns(noisy, 'full')).toEqual(['field_phone']);
    });

    it('drops fields on the never-export denylist (defence-in-depth)', () => {
        // field_author resolves to the staff member's display name; even at
        // the full tier it must not appear in the CSV unless deliberately
        // re-enabled. The denylist is the Nuxt-layer second line of defence
        // alongside Drupal's ?full role gate.
        const withAuthor = [{
            extended_attributes: {
                drupal: {
                    field_phone: [{ value: '030-1' }],
                    field_author: { target_id: 7, label: 'Jane Editor' }
                }
            }
        }];
        const columns = resolveDrupalFieldColumns(withAuthor, 'full');
        expect(columns).not.toContain('field_author');
        expect(columns).toContain('field_phone');
    });

    it('builds curated headers for known fields and humanises the rest', () => {
        expect(drupalFieldHeaderLabel('field_service_provider')).toBe('Service Provider');
        expect(drupalFieldHeaderLabel('field_sp_attachment')).toBe('Service Provider Attachments');
        expect(drupalFieldHeaderLabel('field_custom_thing')).toBe('Custom Thing');
    });

    it('disambiguates duplicate export header labels without dropping fields', () => {
        expect(buildExportHeaders(
            ['ID'],
            ['field_status_internal_term', 'field_status_internal'],
            new Map([
                ['field_status_internal_term', 'Internal Status'],
                ['field_status_internal', 'Internal Status']
            ]),
            ['systemskizze'],
            new Map([['systemskizze', 'Internal Status']])
        )).toEqual([
            'ID',
            'Internal Status',
            'Internal Status (field_status_internal)',
            'Internal Status (systemskizze)'
        ]);
    });

    it('flattens every drupal value shape into a single cell', () => {
        expect(formatDrupalFieldValue([{ value: 'hello' }])).toBe('hello');
        expect(formatDrupalFieldValue({ target_id: 69, label: 'DWP' })).toBe('DWP');
        expect(formatDrupalFieldValue([{ target_id: 1, label: 'A' }, { target_id: 2, label: 'B' }])).toBe('A; B');
        expect(formatDrupalFieldValue({ target_id: 5 })).toBe('5');
        expect(formatDrupalFieldValue(null)).toBe('');
        expect(formatDrupalFieldValue([])).toBe('');
    });

    it('resolves scalar drupal field values through field-specific value maps', () => {
        const valueMap = new Map([
            ['bike-rack-1', 'Radbuegel 1'],
            ['high', 'High priority']
        ]);

        expect(formatDrupalFieldValue([{ value: 'bike-rack-1' }], valueMap)).toBe('Radbuegel 1');
        expect(formatDrupalFieldValue([{ value: 'high' }, { value: 'unknown' }], valueMap)).toBe('High priority; unknown');
        expect(formatDrupalFieldValue({ target_id: 'bike-rack-1' }, valueMap)).toBe('Radbuegel 1');
    });

    it('transforms internal remark relationships into readable CSV values', () => {
        const request = transformJsonApiRequestForExport({
            id: 'node-1',
            type: 'node--service_request',
            attributes: {
                request_id: 'REQ-1',
                title: 'Demo'
            },
            relationships: {
                field_internal_remark: {
                    data: [{ type: 'paragraph--internal_remark', id: 'remark-1' }]
                }
            }
        }, [
            {
                id: 'remark-1',
                type: 'paragraph--internal_remark',
                attributes: {
                    created: '2026-05-27T10:00:00+00:00',
                    field_internal_remark_text: { value: '<p>Call back</p>' }
                }
            }
        ]);

        expect(formatDrupalFieldValue(request.extended_attributes?.drupal?.field_internal_remark)).toBe(
            '2026-05-27T10:00:00+00:00 - Call back'
        );
    });

    it('keeps district and sublocality export values separate', () => {
        const request = transformJsonApiRequestForExport({
            id: 'node-1',
            type: 'node--service_request',
            attributes: {
                request_id: 'REQ-1'
            },
            relationships: {
                field_district: {
                    data: { type: 'taxonomy_term--district', id: 'district-1' }
                },
                field_sublocality: {
                    data: { type: 'taxonomy_term--sublocality', id: 'sublocality-1' }
                }
            }
        }, [
            {
                id: 'district-1',
                type: 'taxonomy_term--district',
                attributes: {
                    drupal_internal__tid: 7,
                    name: 'Bezirk'
                }
            },
            {
                id: 'sublocality-1',
                type: 'taxonomy_term--sublocality',
                attributes: {
                    drupal_internal__tid: 11,
                    name: 'Stadtteil'
                }
            }
        ]);
        const headers = buildFixedExportHeaders(false);
        const row = formatExportRow(request, [], ',', undefined, false).split(',');

        expect(request.extended_attributes?.markaspot?.district?.name).toBe('Bezirk');
        expect(request.extended_attributes?.markaspot?.sublocality?.name).toBe('Stadtteil');
        expect(row[headers.indexOf('District')]).toBe('Bezirk');
        expect(row[headers.indexOf('Sublocality')]).toBe('Stadtteil');
    });

    it('appends generic drupal columns between fixed and attribute columns', () => {
        const drupalFieldKeys = ['field_phone', 'field_service_provider'];
        const headers = [
            ...buildFixedExportHeaders(false),
            ...drupalFieldKeys.map(drupalFieldHeaderLabel)
        ];
        const row = formatExportRow({
            service_request_id: 'REQ-9',
            extended_attributes: {
                drupal: {
                    field_phone: [{ value: '030-1234' }],
                    field_service_provider: { target_id: 69, label: 'DWP' }
                },
                markaspot: { nid: 9, published: true, status_notes: [] },
                attributes: {}
            }
        }, [], ',', undefined, false, drupalFieldKeys).split(',');

        expect(row).toHaveLength(headers.length);
        expect(row[headers.indexOf('Phone')]).toBe('030-1234');
        expect(row[headers.indexOf('Service Provider')]).toBe('DWP');
    });

    it('uses field-specific value resolvers for generic drupal CSV columns', () => {
        const drupalFieldKeys = ['field_facility'];
        const headers = [
            ...buildFixedExportHeaders(false),
            ...drupalFieldKeys.map(drupalFieldHeaderLabel)
        ];
        const row = formatExportRow({
            service_request_id: 'REQ-10',
            extended_attributes: {
                drupal: {
                    field_facility: [{ value: 'radbuegel-1' }]
                },
                markaspot: { nid: 10, published: true, status_notes: [] },
                attributes: {}
            }
        }, [], ',', undefined, false, drupalFieldKeys, new Map([
            ['field_facility', new Map([['radbuegel-1', 'Radbuegel Standort 1']])]
        ])).split(',');

        expect(row).toHaveLength(headers.length);
        expect(row[headers.indexOf('Facility')]).toBe('Radbuegel Standort 1');
    });

    it('resolves duplicate facility ids against each row jurisdiction', () => {
        const facilityLabelsByJurisdiction = new Map([
            ['19', new Map([['entrance', 'Bonn Entrance']])],
            ['20', new Map([['entrance', 'Beuel Entrance']])]
        ]);
        const rowForJurisdiction = (jurisdictionId: string) => formatExportRow({
            service_request_id: `REQ-${jurisdictionId}`,
            jurisdiction: { id: jurisdictionId, label: `Jurisdiction ${jurisdictionId}` },
            extended_attributes: {
                drupal: {
                    field_facility: [{ value: 'entrance' }]
                },
                markaspot: { nid: Number(jurisdictionId), published: true, status_notes: [] },
                attributes: {}
            }
        }, [], ',', undefined, false, ['field_facility'], buildDrupalFieldValueResolvers(
            new Map(),
            facilityLabelsByJurisdiction,
            { service_request_id: `REQ-${jurisdictionId}`, jurisdiction: { id: jurisdictionId } }
        )).split(',');

        const headers = [
            ...buildFixedExportHeaders(false),
            'Facility'
        ];

        expect(rowForJurisdiction('19')[headers.indexOf('Facility')]).toBe('Bonn Entrance');
        expect(rowForJurisdiction('20')[headers.indexOf('Facility')]).toBe('Beuel Entrance');
    });

    it('does not let slug settings overwrite explicit jurisdiction facility labels', () => {
        const labels = new Map<string, Map<string, string>>();

        collectFacilityLabels(labels, ['19'], {
            facilities: {
                items: [{ id: 'entrance', label: 'Bonn Entrance' }]
            }
        });
        collectFacilityLabels(labels, ['bonn-mobility', '19'], {
            facilities: {
                items: [{ id: 'entrance', label: 'Slug Entrance' }]
            }
        });

        expect(labels.get('19')?.get('entrance')).toBe('Bonn Entrance');
        expect(labels.get('bonn-mobility')?.get('entrance')).toBe('Slug Entrance');
    });

    it('keeps generic columns aligned and blank when a row has no drupal block', () => {
        // Mirrors the mid-stream session-expiry path: the header carries the
        // full-tier columns but a post-expiry row lacks the drupal block.
        const drupalFieldKeys = ['field_phone', 'field_service_provider'];
        const headers = [
            ...buildFixedExportHeaders(false),
            ...drupalFieldKeys.map(drupalFieldHeaderLabel)
        ];
        const row = formatExportRow({
            service_request_id: 'REQ-X',
            extended_attributes: {
                markaspot: { nid: 1, published: true, status_notes: [] },
                attributes: {}
            }
        }, [], ',', undefined, false, drupalFieldKeys).split(',');

        expect(row).toHaveLength(headers.length);
        expect(row[headers.indexOf('Phone')]).toBe('');
        expect(row[headers.indexOf('Service Provider')]).toBe('');
    });
});

describe('status attribute flat columns (issue #461)', () => {
    // Helper: build a minimal StatusAttributeResolutionContext from a map of
    // statusId -> definition arrays (mirrors the production structure).
    function makeContext(
        entries: [string, Array<{ code: string, description: string, order: number }>][]
    ) {
        return {
            definitionsByStatusId: new Map(
                entries.map(([id, defs]) => [
                    id,
                    defs.map(d => ({
                        code: d.code,
                        description: d.description,
                        datatype: 'string',
                        order: d.order
                    }))
                ])
            ),
            mediaNames: new Map<string, string>(),
            loaded: true
        };
    }

    it('returns empty codes and labels for an empty context (non-staff path)', () => {
        const emptyCtx = { definitionsByStatusId: new Map(), mediaNames: new Map(), loaded: false };
        const { codes, labels } = deriveStatusAttributeColumns(emptyCtx);
        expect(codes).toEqual([]);
        expect(labels.size).toBe(0);
    });

    it('derives ordered, de-duplicated codes across two status definitions sharing a code', () => {
        const ctx = makeContext([
            ['status-1', [
                { code: 'material', description: 'Material', order: 0 },
                { code: 'count', description: 'Anzahl', order: 1 }
            ]],
            ['status-2', [
                { code: 'count', description: 'Anzahl (duplicate)', order: 0 },
                { code: 'color', description: 'Farbe', order: 1 }
            ]]
        ]);

        const { codes, labels } = deriveStatusAttributeColumns(ctx);

        // 'count' appears in both statuses; first-appearance wins for both order and label
        expect(codes).toEqual(['material', 'count', 'color']);
        expect(labels.get('material')).toBe('Material');
        expect(labels.get('count')).toBe('Anzahl');
        expect(labels.get('color')).toBe('Farbe');
    });

    it('falls back to code as label when description is empty', () => {
        const ctx = {
            definitionsByStatusId: new Map([
                ['s1', [{ code: 'raw_code', description: '', datatype: 'string', order: 0 }]]
            ]),
            mediaNames: new Map<string, string>(),
            loaded: true
        };
        const { labels } = deriveStatusAttributeColumns(ctx);
        expect(labels.get('raw_code')).toBe('raw_code');
    });

    it('buildExportHeaders appends status-attribute columns after request-attribute columns', () => {
        const headers = buildExportHeaders(
            ['ID', 'Title'],
            [],
            new Map(),
            ['req_attr'],
            new Map([['req_attr', 'Request Attr']]),
            ['status_attr'],
            new Map([['status_attr', 'Status Attr']])
        );

        expect(headers).toEqual(['ID', 'Title', 'Request Attr', 'Status Attr']);
    });

    it('buildExportHeaders disambiguates a status-attr code that collides with a request-attr label', () => {
        const headers = buildExportHeaders(
            [],
            [],
            new Map(),
            ['shared'],
            new Map([['shared', 'Collision']]),
            ['shared_status'],
            new Map([['shared_status', 'Collision']])
        );

        // Second 'Collision' gets the code as disambiguator suffix
        expect(headers).toEqual(['Collision', 'Collision (shared_status)']);
    });

    it('buildExportHeaders adds no status columns when statusAttributeKeys is empty (non-staff)', () => {
        const headers = buildExportHeaders(
            ['ID'],
            [],
            new Map(),
            [],
            new Map(),
            [],
            new Map()
        );

        expect(headers).toEqual(['ID']);
    });

    it('formatExportRow emits the latest note values in the correct status-attr columns', () => {
        const statusAttributeKeys = ['material', 'count'];
        const req = {
            service_request_id: 'REQ-SA-1',
            extended_attributes: {
                drupal: {},
                markaspot: {
                    nid: 1,
                    published: true,
                    status_notes: [
                        {
                            status_descriptive_name: 'Old',
                            updated_datetime: '2026-05-10T08:00:00Z',
                            resolved_status_attributes: [
                                { code: 'material', label: 'Material', value: 'Holz' },
                                { code: 'count', label: 'Anzahl', value: '3' }
                            ]
                        },
                        {
                            status_descriptive_name: 'New',
                            updated_datetime: '2026-05-20T10:00:00Z',
                            resolved_status_attributes: [
                                { code: 'material', label: 'Material', value: 'Stahl' },
                                { code: 'count', label: 'Anzahl', value: '7' }
                            ]
                        }
                    ]
                },
                attributes: {}
            }
        };

        const allHeaders = buildExportHeaders(
            buildFixedExportHeaders(false),
            [], new Map(),
            [], new Map(),
            statusAttributeKeys,
            new Map([['material', 'Material'], ['count', 'Anzahl']])
        );

        const row = formatExportRow(req, [], ',', undefined, false, [], new Map(), statusAttributeKeys).split(',');

        expect(row).toHaveLength(allHeaders.length);
        expect(row[allHeaders.indexOf('Material')]).toBe('Stahl');
        expect(row[allHeaders.indexOf('Anzahl')]).toBe('7');
    });

    it('formatExportRow ignores an older note when a newer note also has resolved attributes', () => {
        const statusAttributeKeys = ['color'];
        const req = {
            service_request_id: 'REQ-SA-2',
            extended_attributes: {
                drupal: {},
                markaspot: {
                    nid: 2,
                    published: true,
                    status_notes: [
                        {
                            updated_datetime: '2026-06-01T12:00:00Z',
                            resolved_status_attributes: [{ code: 'color', label: 'Farbe', value: 'Rot' }]
                        },
                        {
                            updated_datetime: '2026-05-01T06:00:00Z',
                            resolved_status_attributes: [{ code: 'color', label: 'Farbe', value: 'Blau' }]
                        }
                    ]
                },
                attributes: {}
            }
        };

        const row = formatExportRow(req, [], ',', undefined, false, [], new Map(), statusAttributeKeys).split(',');
        const allHeaders = buildExportHeaders(
            buildFixedExportHeaders(false), [], new Map(), [], new Map(),
            statusAttributeKeys, new Map([['color', 'Farbe']])
        );

        // Newer note (June) wins
        expect(row[allHeaders.indexOf('Farbe')]).toBe('Rot');
    });

    it('formatExportRow emits empty string for a code absent in the latest note', () => {
        const statusAttributeKeys = ['material', 'size'];
        const req = {
            service_request_id: 'REQ-SA-3',
            extended_attributes: {
                drupal: {},
                markaspot: {
                    nid: 3,
                    published: true,
                    status_notes: [
                        {
                            updated_datetime: '2026-05-15T00:00:00Z',
                            resolved_status_attributes: [
                                { code: 'material', label: 'Material', value: 'Beton' }
                                // 'size' is absent
                            ]
                        }
                    ]
                },
                attributes: {}
            }
        };

        const row = formatExportRow(req, [], ',', undefined, false, [], new Map(), statusAttributeKeys).split(',');
        const allHeaders = buildExportHeaders(
            buildFixedExportHeaders(false), [], new Map(), [], new Map(),
            statusAttributeKeys, new Map([['material', 'Material'], ['size', 'Größe']])
        );

        expect(row[allHeaders.indexOf('Material')]).toBe('Beton');
        expect(row[allHeaders.indexOf('Größe')]).toBe('');
    });

    it('formatExportRow adds no status-attr cells when statusAttributeKeys is empty (non-staff gating)', () => {
        // No statusAttributeKeys = non-staff path; row length must not grow.
        const baseHeaders = buildFixedExportHeaders(false);
        const req = {
            service_request_id: 'REQ-SA-4',
            extended_attributes: {
                drupal: {},
                markaspot: {
                    nid: 4,
                    published: true,
                    status_notes: [
                        {
                            updated_datetime: '2026-05-01T00:00:00Z',
                            resolved_status_attributes: [{ code: 'material', label: 'Material', value: 'Holz' }]
                        }
                    ]
                },
                attributes: {}
            }
        };

        // Empty statusAttributeKeys — no 8th param or explicit []
        const row = formatExportRow(req, [], ',', undefined, false).split(',');
        expect(row).toHaveLength(baseHeaders.length);
    });

    it('exports the option name (not the raw key) for a singlevaluelist status attribute', () => {
        // resolveStatusAttributesForExport already resolves key->name before storing in
        // resolved_status_attributes.value; formatExportRow reads .value directly.
        const statusAttributeKeys = ['system'];
        const req = {
            service_request_id: 'REQ-SA-5',
            extended_attributes: {
                drupal: {},
                markaspot: {
                    nid: 5,
                    published: true,
                    status_notes: [
                        {
                            updated_datetime: '2026-05-16T00:00:00Z',
                            resolved_status_attributes: [
                                // value is already the resolved name, not the raw UUID/key
                                { code: 'system', label: 'Systemskizze', value: 'Anlehnbügel 7b' }
                            ]
                        }
                    ]
                },
                attributes: {}
            }
        };

        const row = formatExportRow(req, [], ',', undefined, false, [], new Map(), statusAttributeKeys).split(',');
        const allHeaders = buildExportHeaders(
            buildFixedExportHeaders(false), [], new Map(), [], new Map(),
            statusAttributeKeys, new Map([['system', 'Systemskizze']])
        );

        expect(row[allHeaders.indexOf('Systemskizze')]).toBe('Anlehnbügel 7b');
    });

    it('normalizeStatusNoteTimestamp returns empty string for falsy input', () => {
        expect(normalizeStatusNoteTimestamp('')).toBe('');
        expect(normalizeStatusNoteTimestamp(null)).toBe('');
        expect(normalizeStatusNoteTimestamp(undefined)).toBe('');
    });

    it('normalizeStatusNoteTimestamp returns numeric epoch string for a valid ISO date', () => {
        const ts = normalizeStatusNoteTimestamp('2026-05-20T10:00:00Z');
        expect(ts).toBe(String(Date.parse('2026-05-20T10:00:00Z')));
    });
});
