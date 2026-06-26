import { defineEventHandler, getQuery, setResponseHeader } from 'h3';
import type { ServerResponse } from 'http';
import { Agent } from 'https';
import { hasValidDrupalSession, isMinimalExtendedAttributes } from '../../utils/session';
import { getCanonicalHost } from '../../utils/host';
import {
    isValidAuthStatusResponse,
    extractRoles,
    GLOBAL_DASHBOARD_ROLES,
    INTERNAL_DASHBOARD_ROLES,
    ELEVATED_JURISDICTION_ROLES,
    getAccessibleJurisdictionIds,
    type AuthStatusGroup
} from '../../utils/auth-status';
import { checkExportRateLimit } from '../../utils/export-rate-limit';

/**
 * Server-side CSV export for service requests.
 *
 * Resolves dynamic attribute columns from service definitions first, then
 * streams CSV rows batch by batch (500 per batch) to keep memory constant
 * regardless of dataset size.
 *
 * Auth: forwards the browser session cookie for manager-level access,
 * falls back to GEOREPORT_API_KEY for anonymous/basic access.
 */

const BATCH_SIZE = 500;
const JSONAPI_EXPORT_BATCH_SIZE = Math.min(
    Math.max(parseInt(process.env.NUXT_JSONAPI_CSV_BATCH_SIZE || '100', 10), 1),
    BATCH_SIZE
);
const STATUS_DETAIL_CHUNK_SIZE = 50;
const MAX_EXPORT_ROWS = parseInt(process.env.NUXT_CSV_MAX_EXPORT_ROWS || '500000', 10);
const ALLOWED_DELIMITERS = new Set([',', ';', '\t']);
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.NUXT_CSV_EXPORT_RATE_LIMIT || '3', 10);
const PRE_AUTH_RATE_LIMIT_PER_MINUTE = parseInt(process.env.NUXT_CSV_EXPORT_PRE_AUTH_RATE_LIMIT || '30', 10);

/**
 * Role-based export limits.
 *
 * Protects the backend from expensive full exports by unauthorised users.
 * The highest matching tier wins: a user with administrator + moderator gets
 * the administrator limit.
 *
 * Only `full` is env-configurable (via NUXT_CSV_MAX_EXPORT_ROWS). Lower
 * tiers are hardcoded by design so an operator cannot accidentally raise
 * the moderator cap from the environment.
 */
const EXPORT_LIMITS = {
    /** administrator, editorial_board */
    full: MAX_EXPORT_ROWS,
    /** moderator */
    moderator: 50000,
    /** any other authenticated role */
    authenticated: 5000,
    /** no session */
    anonymous: 1000,
} as const;

/**
 * Determine the maximum number of rows a user may export based on their
 * Drupal roles. Returns both the limit and a tier label for observability.
 *
 * IMPORTANT: Role names (`administrator`, `editorial_board`, `moderator`,
 * `authenticated`) must match the IDs defined in user.role.* configuration.
 * If a role is renamed in Drupal, update this function and the unit tests
 * in tests/unit/server/resolve-export-tier.test.ts.
 */
export function resolveExportTier(roles: readonly string[]): { limit: number; tier: string } {
    if (roles.includes('administrator') || roles.includes('editorial_board')) {
        return { limit: EXPORT_LIMITS.full, tier: 'full' };
    }
    if (roles.includes('moderator')) {
        return { limit: EXPORT_LIMITS.moderator, tier: 'moderator' };
    }
    if (roles.includes('authenticated')) {
        return { limit: EXPORT_LIMITS.authenticated, tier: 'authenticated' };
    }
    return { limit: EXPORT_LIMITS.anonymous, tier: 'anonymous' };
}

/**
 * Build the https.Agent used for backend fetches. Extracted so both the
 * auth setup phase and the streaming phase share the same TLS config.
 */
function buildFetchAgent(config: ReturnType<typeof useRuntimeConfig>): Agent {
    const proxyConfig = (config as unknown as { proxy?: { rejectUnauthorized?: boolean } }).proxy;
    // Secure by default: TLS verification is on unless explicitly opted out via
    // runtime config (e.g. DDEV with a self-signed cert). Never default to
    // false in production — backend calls forward the session cookie and the
    // CSV payload, both MitM targets on the container network.
    return new Agent({ rejectUnauthorized: proxyConfig?.rejectUnauthorized ?? true });
}

function hasDrupalSessionCookie(event: Parameters<typeof hasValidDrupalSession>[0]): boolean {
    if (hasValidDrupalSession(event)) return true;
    const cookie = event.node.req.headers.cookie || '';
    return /(?:^|;\s*)S?SESS[^=]*=/.test(cookie);
}

interface GeoreportRequest {
    service_request_id?: string;
    title?: string;
    description?: string;
    service_name?: string;
    service_code?: string;
    status?: string;
    address_string?: string;
    lat?: number | string;
    long?: number | string;
    requested_datetime?: string;
    updated_datetime?: string;
    media_url?: string;
    jurisdiction?: { id?: string | number; label?: string; name?: string };
    organisation?: { label?: string; name?: string };
    organisations?: Array<{ label?: string; name?: string }>;
    status_notes?: string;
    extended_attributes?: {
        // `?fields=` tier: scalar fields only, shaped `[{ value }]`.
        // `?full` tier (administrator/editorial_board): every non-empty field;
        // entity references resolved to `{ target_id, label }`.
        drupal?: Record<string, unknown>;
        markaspot?: {
            nid?: string | number;
            published?: boolean;
            district?: { id?: string; tid?: string; name?: string; label?: string };
            sublocality?: { id?: string; tid?: string; name?: string; label?: string };
            status_notes?: Array<GeoreportStatusNote>;
        };
        attributes?: Record<string, string | number | boolean | null>;
    };
}

interface ResolvedStatusAttribute {
    code: string;
    label: string;
    value: string;
}

interface GeoreportStatusNote {
    status_note?: string;
    status_descriptive_name?: string;
    status?: string;
    updated_datetime?: string;
    resolved_status_attributes?: ResolvedStatusAttribute[];
}

interface ServiceDefinitionAttribute {
    code: string;
    description: string;
    datatype: string;
    order: number;
    variable?: boolean;
    values?: Array<{ key: string; name: string }>;
    media_type?: string;
    media_group?: string;
}

interface ParseServiceDefinitionOptions {
    includeNonVariable?: boolean;
}

interface ExportFieldSelectionContext {
    orderedCodes: readonly string[];
    serviceDefinitionsLoaded: boolean;
}

/**
 * Context for resolving attribute codes to human-readable labels and values.
 */
interface AttributeResolutionContext extends ExportFieldSelectionContext {
    /** attribute code -> human-readable label (from description field) */
    labels: Map<string, string>;
    /** attribute code -> Map<raw key, display name> for singlevaluelist/multivaluelist */
    valueResolvers: Map<string, Map<string, string>>;
    /** attribute codes sorted by order of first appearance in service definitions */
    orderedCodes: string[];
    /** whether service definitions were loaded successfully */
    serviceDefinitionsLoaded: boolean;
}

interface StatusAttributeResolutionContext {
    definitionsByStatusId: Map<string, ServiceDefinitionAttribute[]>;
    mediaNames: Map<string, string>;
    loaded: boolean;
}

interface ManagementFieldColumnContext {
    visibleFieldKeys: string[];
    orderedFieldKeys: string[];
    labels: Map<string, string>;
    relationshipFieldKeys: string[];
    valueResolvers: Map<string, Map<string, string>>;
    loaded: boolean;
}

interface ManagementFormModeSettingsResponse {
    fields?: Record<string, {
        label?: string
        field_type?: string
        display_settings?: { weight?: number, region?: string }
        settings?: {
            target_type?: string
            allowed_values?: Record<string, string> | Array<{ value: string | number, label: string }>
        }
    }>;
    field_groups?: Record<string, {
        region?: string
        parent?: string | null
        children?: string[]
    }>;
}

interface JsonApiResource {
    id: string;
    type: string;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, unknown>;
}

interface JsonApiCollectionResponse {
    data?: JsonApiResource[];
    included?: JsonApiResource[];
    meta?: { count?: number };
}

type JsonApiFetcher = <T>(path: string, timeout?: number) => Promise<T>;
type LocalFetcher = <T>(request: string, options?: Record<string, unknown>) => Promise<T>;

interface ExportJurisdictionScope {
    requestJurisdictionIds: string[];
    taxonomyJurisdictionIds: string[];
    facilityLabelsByJurisdiction: Map<string, Map<string, string>>;
}

interface MarkASpotSettingsResponse {
    jurisdiction?: {
        id?: string | number;
        taxonomyJurisdictionId?: string | number;
    };
    facilities?: {
        items?: Array<{
            id?: string
            label?: string
            name?: string
            active?: boolean
        }>
    };
}

interface GeoreportResponse {
    requests?: GeoreportRequest[];
    meta?: { total?: number };
    exposedRelationshipFields?: string[];
}

const FIXED_EXPORT_HEADERS_BEFORE_ORGANISATION = [
    'ID', 'Title', 'Description', 'Category', 'Service Code',
    'Status', 'Visibility', 'Address', 'District', 'Sublocality',
    'Latitude', 'Longitude',
    'Created', 'Updated', 'Media URL',
] as const;
const FIXED_EXPORT_HEADERS_AFTER_ORGANISATION = [
    'Hazard Level', 'Sentiment', 'AI Category', 'NID',
    'Status Notes',
] as const;
const FORMULA_PREFIXES = /^\s*[=+\-@]/;
const BASE_GEOREPORT_FIELDS = ['field_hazard_level', 'field_sentiment', 'field_ai_hazard_category'] as const;
const INTEGER_LIST_FILTER = /^\d+(,\d+)*$/;
const HAZARD_LEVEL_FILTER = /^[0-4](,[0-4])*$/;
const TOKEN_LIST_FILTER = /^[A-Za-z0-9_.:-]+(,[A-Za-z0-9_.:-]+)*$/;
const MAX_FIELD_FILTER_LENGTH = 64;
const MAX_ORG_GROUP_FILTER_IDS = 256;
const NO_MATCH_ORG_GROUP_ID = '0';
const NO_MATCH_NODE_ID = '0';
const SERVICE_REQUEST_JURISDICTION_PATH = 'field_jurisdiction.meta.drupal_internal__target_id';
const CROSS_ORGANISATION_EXPORT_ROLES = new Set(['moderator', 'administrator', 'editorial_board']);
const INTERNAL_STATUS_ORGANISATION_ROLES = new Set(['org-admin', 'org-moderator']);

interface JsonApiExportFieldOptions {
    includeDistrict?: boolean;
    includeSublocality?: boolean;
}

const DEFAULT_JSONAPI_EXPORT_FIELD_OPTIONS: Required<JsonApiExportFieldOptions> = {
    includeDistrict: false,
    includeSublocality: false,
};

const JSONAPI_EXPORT_BASE_NODE_FIELDS = [
    'drupal_internal__nid',
    'request_id',
    'title',
    'body',
    'created',
    'changed',
    'status',
    'field_geolocation',
    'field_address',
    'field_jurisdiction',
    'field_category',
    'field_status',
    'field_organisation',
    'field_request_media',
    'field_status_notes',
    'field_hazard_level',
    'field_sentiment',
    'field_request_attributes',
] as const;

const JSONAPI_EXPORT_BASE_INCLUDES = [
    'field_jurisdiction',
    'field_category',
    'field_status',
    'field_organisation',
    'field_request_media',
    'field_request_media.field_media_image',
    'field_request_media.thumbnail',
    'field_status_notes',
    'field_status_notes.field_status_term',
] as const;

const JSONAPI_EXPORT_INCLUDED_FIELDSETS: Record<string, string> = {
    'taxonomy_term--service_category': 'drupal_internal__tid,name,field_service_code,field_category_icon,field_category_hex',
    'taxonomy_term--service_status': 'drupal_internal__tid,name,field_status_hex,field_status_icon,field_open311_mapping',
    'taxonomy_term--internal_status': 'drupal_internal__tid,name,field_internal_status_code',
    'media--request_image': 'drupal_internal__mid,name,field_media_image,thumbnail,field_ai_hazard_category',
    'file--file': 'uri,filename',
    'paragraph--status': 'created,field_status_note,field_status_attributes,field_status_term',
    'paragraph--internal_remark': 'drupal_internal__id,created,field_internal_remark_text',
};

/**
 * Drupal field keys the `full`-tier export already surfaces through a dedicated
 * fixed column (or the resolved markaspot block). Excluded from the generic
 * per-field columns so the CSV never carries the same datum twice.
 */
const DRUPAL_FIELDS_RENDERED_ELSEWHERE = new Set<string>([
    'field_hazard_level',       // Hazard Level
    'field_sentiment',          // Sentiment
    'field_ai_hazard_category', // AI Category
    'field_organisation',       // Organisation
    'field_district',           // District
    'field_sublocality',        // (district pair)
    'field_category',           // Category / Service Code
    'field_status',             // Status
    'field_status_notes',       // Status Notes (resolved, multi-line)
    'field_geolocation',        // Latitude / Longitude
    'field_address',            // Address
    'field_request_media',      // Media URL
    'field_request_attributes', // dynamic attribute columns
]);

/**
 * Drupal field keys that MUST NEVER appear in any export, regardless of
 * tier. Defence-in-depth: the primary control is Drupal's ?full role gate,
 * but the Nuxt route maintains an independent denylist so a backend
 * misconfiguration or a future field rename cannot accidentally widen the
 * exposed surface. Document the GDPR / staff-confidentiality reason next
 * to each entry.
 */
const DRUPAL_FIELDS_NEVER_EXPORT = new Set<string>([
    // Resolves to the staff member's display name. Surfacing per-row authorship
    // in a downloadable CSV is intentional disclosure of internal identity;
    // gate it behind a deliberate decision rather than the generic expansion.
    'field_author',
]);

/** Human-readable CSV headers for known drupal fields in the full-tier export. */
const DRUPAL_FIELD_HEADER_LABELS: Record<string, string> = {
    field_attachment: 'Attachments',
    field_boilerplates_sp: 'Service Provider Boilerplate',
    field_service_provider: 'Service Provider',
    field_service_provider_status: 'Service Provider Status',
    field_service_provider_notes: 'Service Provider Notes',
    field_service_provider_feedback: 'Service Provider Feedback',
    field_service_provider_files: 'Service Provider Files',
    field_sp_attachment: 'Service Provider Attachments',
    field_hazard_category: 'Hazard Category',
    field_internal_remark: 'Internal Remarks',
    field_risk_score: 'Risk Score',
    field_priority: 'Priority',
    field_phone: 'Phone',
    field_first_name: 'First Name',
    field_last_name: 'Last Name',
    field_e_mail: 'E Mail',
    field_notes: 'Notes',
    field_status_internal: 'Internal Status',
    field_status_internal_term: 'Internal Status',
    field_facility: 'Facility',
    field_jurisdiction: 'Jurisdiction',
    field_approved: 'Approved',
    field_gdpr: 'GDPR Consent',
    field_notification: 'Notification Requested',
};

/**
 * Build a CSV header label for a drupal field machine name. Known fields get a
 * curated label; everything else is humanised (`field_foo_bar` -> `Foo Bar`).
 */
export function drupalFieldHeaderLabel(fieldName: string): string {
    const known = DRUPAL_FIELD_HEADER_LABELS[fieldName];
    if (known) return known;
    return fieldName
        .replace(/^field_/, '')
        .split('_')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Flatten a drupal field value into a single CSV cell.
 *
 * The `full`-tier API resolves entity references to `{ target_id, label }` and
 * scalar fields to `[{ value }]`. This collapses every shape to a string and
 * joins multi-value fields with "; ".
 */
export function formatDrupalFieldValue(raw: unknown, valueResolver?: Map<string, string>): string {
    if (raw == null) return '';
    if (Array.isArray(raw)) {
        return raw.map(value => formatDrupalFieldValue(value, valueResolver)).filter(value => value !== '').join('; ');
    }
    if (typeof raw === 'object') {
        // Precedence: a resolved reference's `label`, then a scalar item's
        // `value`, then a bare `target_id` (unresolvable / deleted entity).
        const obj = raw as Record<string, unknown>;
        if (obj.label != null) return String(obj.label);
        if (obj.value != null) {
            const value = String(obj.value);
            return valueResolver?.get(value) || value;
        }
        if (obj.target_id != null) {
            const value = String(obj.target_id);
            return valueResolver?.get(value) || value;
        }
        return '';
    }
    const value = String(raw);
    return valueResolver?.get(value) || value;
}

function isExportableDrupalFieldColumn(key: string): boolean {
    return key.startsWith('field_') &&
        !DRUPAL_FIELDS_RENDERED_ELSEWHERE.has(key) &&
        !DRUPAL_FIELDS_NEVER_EXPORT.has(key);
}

/**
 * Resolve the ordered set of generic drupal field columns for a full-tier
 * export. Starts with Drupal's management form-mode field contract when
 * available, then appends any additional non-empty fields discovered in the
 * first batch. Returns `[]` for any non-full tier.
 */
export function resolveDrupalFieldColumns(
    sample: readonly GeoreportRequest[],
    tier: string,
    managementFieldKeys: readonly string[] = []
): string[] {
    if (tier !== 'full') return [];
    const sampleKeys = new Set<string>();
    for (const req of sample) {
        const drupal = req.extended_attributes?.drupal;
        if (drupal && typeof drupal === 'object') {
            for (const key of Object.keys(drupal)) sampleKeys.add(key);
        }
    }
    const managedKeys = managementFieldKeys
        .filter(isExportableDrupalFieldColumn);
    const managed = new Set(managedKeys);
    const sampleOnly = [...sampleKeys]
        .filter(key => !managed.has(key))
        .filter(isExportableDrupalFieldColumn)
        .sort();
    return [...managedKeys, ...sampleOnly];
}

/**
 * Render status notes as human-readable multi-line text (one note per line).
 * `escapeCsvValue()` quotes any cell containing "\n", so Excel shows a
 * multi-line cell. Replaces the former single-cell JSON blob.
 */
export function formatStatusNotes(
    notes: GeoreportStatusNote[] | undefined
): string {
    if (!Array.isArray(notes) || notes.length === 0) return '';
    return notes
        .map((note) => {
            // Fall back to the raw status code, matching useCsvColumns.ts.
            const status = (note.status_descriptive_name || note.status || '').trim();
            const text = (note.status_note || '').trim();
            const date = (note.updated_datetime || '').split('T')[0];
            const attributes = note.resolved_status_attributes
                ?.filter(attr => attr.label && attr.value)
                .map(attr => `${attr.label}: ${attr.value}`)
                .join('; ');
            const head = [status, text].filter(Boolean).join(': ');
            const content = [head, attributes].filter(Boolean).join(' | ');
            return date ? `${content} (${date})`.trim() : content;
        })
        .filter(Boolean)
        .join('\n');
}

export function normalizeExportFieldFilter(
    value: unknown,
    allowedPattern: RegExp,
    maxLength = MAX_FIELD_FILTER_LENGTH
): string | undefined {
    const rawValue = Array.isArray(value) ? value[0] : value;
    if (rawValue === null || rawValue === undefined) return undefined;

    const filter = String(rawValue).trim();
    if (!filter || filter.length > maxLength || !allowedPattern.test(filter)) {
        return undefined;
    }

    return filter;
}

function normalizeExportFilterValues(value?: string): string[] {
    if (!value) return [];
    return uniqueValues(
        value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    );
}

function addJsonApiInFilter(
    params: URLSearchParams,
    key: string,
    path: string,
    values: readonly string[]
): void {
    const cleanValues = uniqueValues(values.map(String).filter(Boolean));
    if (cleanValues.length === 0) return;

    params.set(`filter[${key}][condition][path]`, path);
    if (cleanValues.length === 1) {
        params.set(`filter[${key}][condition][value]`, cleanValues[0]);
        return;
    }

    params.set(`filter[${key}][condition][operator]`, 'IN');
    cleanValues.forEach((value, index) => {
        params.set(`filter[${key}][condition][value][${index}]`, value);
    });
}

function addJsonApiNotInFilter(
    params: URLSearchParams,
    key: string,
    path: string,
    values: readonly string[]
): void {
    const cleanValues = uniqueValues(values.map(String).filter(Boolean));
    if (cleanValues.length === 0) return;

    params.set(`filter[${key}][condition][path]`, path);
    params.set(`filter[${key}][condition][operator]`, 'NOT IN');
    cleanValues.forEach((value, index) => {
        params.set(`filter[${key}][condition][value][${index}]`, value);
    });
}

function addJsonApiContainsSearch(params: URLSearchParams, query: string | undefined): void {
    const value = query?.trim();
    if (!value) return;

    params.set('filter[search][group][conjunction]', 'OR');
    [
        ['request-id', 'request_id'],
        ['title', 'title'],
        ['body', 'body.value'],
        ['address', 'field_address.address_line1'],
        ['email', 'field_e_mail'],
        ['phone', 'field_phone'],
    ].forEach(([key, path]) => {
        params.set(`filter[${key}][condition][path]`, path);
        params.set(`filter[${key}][condition][operator]`, 'CONTAINS');
        params.set(`filter[${key}][condition][value]`, value);
        params.set(`filter[${key}][condition][memberOf]`, 'search');
    });
}

function normalizeDateEnd(value: string | undefined): string | undefined {
    if (!value) return undefined;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59` : value;
}

export function mapExportSortToJsonApi(sort: string): string {
    const descending = sort.startsWith('-');
    const rawField = descending ? sort.slice(1) : sort;
    const fieldMap: Record<string, string> = {
        nid: 'drupal_internal__nid',
        service_request_id: 'drupal_internal__nid',
        request_id: 'request_id',
        created: 'created',
        updated: 'changed',
        service_code: 'field_category.field_service_code',
        category: 'field_category.field_service_code',
        status: 'field_status.field_open311_mapping',
        group: 'field_organisation.label',
        organisation: 'field_organisation.label',
    };
    const field = fieldMap[rawField] || 'created';
    return descending ? `-${field}` : field;
}

export interface JsonApiExportParamsOptions {
    limit: number;
    offset: number;
    sort: string;
    jurisdictionIds: readonly string[];
    status?: string;
    excludeStatus?: string;
    serviceCode?: string;
    excludeServiceCode?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    fieldStatus?: string;
    excludeFieldStatus?: string;
    fieldCategory?: string;
    excludeFieldCategory?: string;
    fieldHazardLevel?: string;
    fieldFacility?: string;
    fieldDistrict?: string;
    fieldSublocality?: string;
    orgGroupIds: readonly string[];
    fullTier: boolean;
    managementRelationshipFields?: readonly string[];
    fieldOptions?: JsonApiExportFieldOptions;
}

function normalizeJsonApiExportFieldOptions(
    fieldOptions: JsonApiExportFieldOptions | undefined
): Required<JsonApiExportFieldOptions> {
    return {
        ...DEFAULT_JSONAPI_EXPORT_FIELD_OPTIONS,
        ...(fieldOptions || {}),
    };
}

export function resolveJsonApiExportFieldOptions(
    managementFieldKeys: readonly string[]
): Required<JsonApiExportFieldOptions> {
    const fields = new Set(managementFieldKeys);
    return {
        includeDistrict: fields.has('field_district'),
        includeSublocality: fields.has('field_sublocality'),
    };
}

function getJsonApiExportNodeFields(fieldOptions: Required<JsonApiExportFieldOptions>): string[] {
    return [
        ...JSONAPI_EXPORT_BASE_NODE_FIELDS,
        ...(fieldOptions.includeDistrict ? ['field_district'] : []),
        ...(fieldOptions.includeSublocality ? ['field_sublocality'] : []),
    ];
}

function getJsonApiExportIncludes(fieldOptions: Required<JsonApiExportFieldOptions>): string[] {
    return [
        ...JSONAPI_EXPORT_BASE_INCLUDES,
        ...(fieldOptions.includeDistrict ? ['field_district'] : []),
        ...(fieldOptions.includeSublocality ? ['field_sublocality'] : []),
    ];
}

function addNoMatchNodeFilter(params: URLSearchParams, filterName: string): void {
    params.set(`filter[${filterName}][condition][path]`, 'drupal_internal__nid');
    params.set(`filter[${filterName}][condition][value]`, NO_MATCH_NODE_ID);
}

export function buildJsonApiExportParams(options: JsonApiExportParamsOptions): URLSearchParams {
    const fieldOptions = normalizeJsonApiExportFieldOptions(options.fieldOptions);
    const includeFields = new Set<string>(getJsonApiExportIncludes(fieldOptions));
    if (options.fullTier) {
        for (const includePath of expandManagementRelationshipIncludes(options.managementRelationshipFields || [])) {
            includeFields.add(includePath);
        }
    }

    const params = new URLSearchParams({
        'page[limit]': String(options.limit),
        'page[offset]': String(options.offset),
        'sort': mapExportSortToJsonApi(options.sort),
        'include': Array.from(includeFields).join(','),
    });

    for (const [type, fields] of Object.entries(JSONAPI_EXPORT_INCLUDED_FIELDSETS)) {
        params.set(`fields[${type}]`, fields);
    }
    if (fieldOptions.includeDistrict) {
        params.set('fields[taxonomy_term--district]', 'drupal_internal__tid,name');
    }
    if (fieldOptions.includeSublocality) {
        params.set('fields[taxonomy_term--sublocality]', 'drupal_internal__tid,name');
    }

    if (!options.fullTier) {
        params.set('fields[node--service_request]', getJsonApiExportNodeFields(fieldOptions).join(','));
    }

    addJsonApiInFilter(params, 'field-jurisdiction', SERVICE_REQUEST_JURISDICTION_PATH, options.jurisdictionIds);

    if (options.fieldStatus) {
        addJsonApiInFilter(params, 'field-status', 'field_status.meta.drupal_internal__target_id', normalizeExportFilterValues(options.fieldStatus));
    } else if (options.status) {
        addJsonApiInFilter(params, 'status-mapping', 'field_status.field_open311_mapping', normalizeExportFilterValues(options.status));
    }

    if (options.excludeFieldStatus) {
        addJsonApiNotInFilter(params, 'field-status-not', 'field_status.meta.drupal_internal__target_id', normalizeExportFilterValues(options.excludeFieldStatus));
    } else if (options.excludeStatus) {
        addJsonApiNotInFilter(params, 'status-mapping-not', 'field_status.field_open311_mapping', normalizeExportFilterValues(options.excludeStatus));
    }

    if (options.fieldCategory) {
        addJsonApiInFilter(params, 'field-category', 'field_category.meta.drupal_internal__target_id', normalizeExportFilterValues(options.fieldCategory));
    } else if (options.serviceCode) {
        addJsonApiInFilter(params, 'category-code', 'field_category.field_service_code', normalizeExportFilterValues(options.serviceCode));
    }

    if (options.excludeFieldCategory) {
        addJsonApiNotInFilter(params, 'field-category-not', 'field_category.meta.drupal_internal__target_id', normalizeExportFilterValues(options.excludeFieldCategory));
    } else if (options.excludeServiceCode) {
        addJsonApiNotInFilter(params, 'category-code-not', 'field_category.field_service_code', normalizeExportFilterValues(options.excludeServiceCode));
    }

    if (options.fieldDistrict) {
        if (fieldOptions.includeDistrict) {
            addJsonApiInFilter(params, 'field-district', 'field_district.meta.drupal_internal__target_id', normalizeExportFilterValues(options.fieldDistrict));
        } else {
            addNoMatchNodeFilter(params, 'unsupported-field-district');
        }
    }
    if (options.fieldSublocality) {
        if (fieldOptions.includeSublocality) {
            addJsonApiInFilter(params, 'field-sublocality', 'field_sublocality.meta.drupal_internal__target_id', normalizeExportFilterValues(options.fieldSublocality));
        } else {
            addNoMatchNodeFilter(params, 'unsupported-field-sublocality');
        }
    }
    if (options.fieldFacility) {
        addJsonApiInFilter(params, 'field-facility', 'field_facility', normalizeExportFilterValues(options.fieldFacility));
    }
    if (options.fieldHazardLevel) {
        addJsonApiInFilter(params, 'hazard-level', 'field_hazard_level', normalizeExportFilterValues(options.fieldHazardLevel));
    }
    if (options.orgGroupIds.length > 0) {
        addJsonApiInFilter(params, 'field-organisation', 'field_organisation.meta.drupal_internal__target_id', options.orgGroupIds);
    }

    if (options.dateFrom) {
        params.set('filter[created-after][condition][path]', 'created');
        params.set('filter[created-after][condition][operator]', '>=');
        params.set('filter[created-after][condition][value]', options.dateFrom);
    }
    if (options.dateTo) {
        params.set('filter[created-before][condition][path]', 'created');
        params.set('filter[created-before][condition][operator]', '<=');
        params.set('filter[created-before][condition][value]', normalizeDateEnd(options.dateTo) || options.dateTo);
    }

    addJsonApiContainsSearch(params, options.search);

    return params;
}

export function expandManagementRelationshipIncludes(fieldNames: readonly string[]): string[] {
    const includes = new Set<string>();
    for (const fieldName of fieldNames) {
        includes.add(fieldName);
    }
    return Array.from(includes);
}

function collectExposedManagementRelationshipFields(
    resources: readonly JsonApiResource[],
    managementRelationshipFields: readonly string[]
): string[] {
    const candidates = new Set(managementRelationshipFields);
    const exposed = new Set<string>();
    for (const resource of resources) {
        for (const fieldName of Object.keys(resource.relationships || {})) {
            if (candidates.has(fieldName)) {
                exposed.add(fieldName);
            }
        }
    }
    return Array.from(exposed);
}

export function resolveScopedExportOrgGroupIds(options: {
    groupId?: string;
    groupFilter?: string;
    requestedOrgGroupIds?: readonly string[];
    userRoles?: readonly string[];
    userGroups: readonly AuthStatusGroup[];
}): string[] {
    const canExportAcrossOrganisations = options.userRoles?.some(role => CROSS_ORGANISATION_EXPORT_ROLES.has(role)) === true;
    const userOrgGroupIds = uniqueValues(options.userGroups
        .filter(group => group.type !== 'jur' && group.id != null)
        .map(group => String(group.id)));
    const requestedOrgGroupIds = uniqueValues((options.requestedOrgGroupIds || [])
        .map(String)
        .filter(Boolean))
        .slice(0, MAX_ORG_GROUP_FILTER_IDS);

    if (options.groupId) {
        if (canExportAcrossOrganisations || userOrgGroupIds.includes(options.groupId)) {
            return [options.groupId];
        }
        return [NO_MATCH_ORG_GROUP_ID];
    }
    if (!options.groupFilter) return [];
    if (requestedOrgGroupIds.length > 0) {
        if (canExportAcrossOrganisations) return requestedOrgGroupIds;
        const allowedRequestedIds = requestedOrgGroupIds.filter(id => userOrgGroupIds.includes(id));
        return allowedRequestedIds.length > 0 ? allowedRequestedIds : [NO_MATCH_ORG_GROUP_ID];
    }

    if (userOrgGroupIds.length > 0) return userOrgGroupIds;
    return canExportAcrossOrganisations ? [] : [NO_MATCH_ORG_GROUP_ID];
}

export interface ExportJurisdictionAccessResult {
    allowed: boolean;
    authorizedJurisdictionIds: string[];
    forbiddenJurisdictionIds: string[];
    reason?: 'no_requested_jurisdiction' | 'out_of_scope';
}

export function resolveAuthorizedExportJurisdictionScope(
    requestedJurisdictionIds: readonly string[],
    userGroups: readonly AuthStatusGroup[],
    userRoles: readonly string[] = []
): ExportJurisdictionAccessResult {
    const requestedIds = uniqueValues(requestedJurisdictionIds
        .map(String)
        .filter(id => /^\d+$/.test(id)));

    if (requestedIds.length === 0) {
        return {
            allowed: false,
            authorizedJurisdictionIds: [],
            forbiddenJurisdictionIds: [],
            reason: 'no_requested_jurisdiction',
        };
    }

    if (userRoles.some(role => GLOBAL_DASHBOARD_ROLES.has(role))) {
        return {
            allowed: true,
            authorizedJurisdictionIds: requestedIds,
            forbiddenJurisdictionIds: [],
        };
    }

    const userJurisdictionIds = getAccessibleJurisdictionIds(userRoles, userGroups);

    const forbiddenJurisdictionIds = requestedIds.filter(id => !userJurisdictionIds.has(id));
    if (forbiddenJurisdictionIds.length > 0) {
        return {
            allowed: false,
            authorizedJurisdictionIds: requestedIds.filter(id => userJurisdictionIds.has(id)),
            forbiddenJurisdictionIds,
            reason: 'out_of_scope',
        };
    }

    return {
        allowed: true,
        authorizedJurisdictionIds: requestedIds,
        forbiddenJurisdictionIds: [],
    };
}

export function buildExportFieldSelection(context: ExportFieldSelectionContext): {
    requestFields: string;
    includeOrganisationColumn: boolean;
} {
    const includeOrganisationColumn = context.serviceDefinitionsLoaded && context.orderedCodes.includes('field_organisation');
    const fields = includeOrganisationColumn
        ? [...BASE_GEOREPORT_FIELDS, 'field_organisation']
        : [...BASE_GEOREPORT_FIELDS];

    return {
        requestFields: fields.join(','),
        includeOrganisationColumn,
    };
}

export function buildFixedExportHeaders(includeOrganisationColumn: boolean): string[] {
    return [
        ...FIXED_EXPORT_HEADERS_BEFORE_ORGANISATION,
        ...(includeOrganisationColumn ? ['Organisation'] : []),
        ...FIXED_EXPORT_HEADERS_AFTER_ORGANISATION,
    ];
}

function addUniqueHeader(headers: string[], seen: Set<string>, label: string, disambiguator?: string): void {
    const base = label.trim() || disambiguator || 'Column';
    if (!seen.has(base)) {
        seen.add(base);
        headers.push(base);
        return;
    }

    const suffix = disambiguator ? ` (${disambiguator})` : '';
    let index = 2;
    let candidate = suffix ? `${base}${suffix}` : `${base} ${index}`;
    while (seen.has(candidate)) {
        index += 1;
        candidate = suffix ? `${base}${suffix} ${index}` : `${base} ${index}`;
    }
    seen.add(candidate);
    headers.push(candidate);
}

export function buildExportHeaders(
    fixedHeaders: readonly string[],
    drupalFieldKeys: readonly string[],
    drupalFieldLabels: ReadonlyMap<string, string>,
    attributeKeys: readonly string[],
    attributeLabels: ReadonlyMap<string, string>,
    statusAttributeKeys: readonly string[] = [],
    statusAttributeLabels: ReadonlyMap<string, string> = new Map()
): string[] {
    const headers: string[] = [];
    const seen = new Set<string>();

    for (const header of fixedHeaders) {
        addUniqueHeader(headers, seen, header);
    }
    for (const key of drupalFieldKeys) {
        addUniqueHeader(headers, seen, drupalFieldLabels.get(key) || drupalFieldHeaderLabel(key), key);
    }
    for (const code of attributeKeys) {
        addUniqueHeader(headers, seen, attributeLabels.get(code) || code, code);
    }
    // Status-attribute columns (staff-only; empty array for non-staff — see deriveStatusAttributeColumns).
    for (const code of statusAttributeKeys) {
        addUniqueHeader(headers, seen, statusAttributeLabels.get(code) || code, code);
    }

    return headers;
}

function writeAndDrain(res: ServerResponse, chunk: string): Promise<void> {
    return new Promise((resolve) => {
        if (!res.write(chunk)) {
            res.once('drain', resolve);
        }
        else {
            resolve();
        }
    });
}

function escapeCsvValue(value: string | number | boolean | null | undefined, delimiter: string): string {
    if (value == null) return '';
    const str = String(value);
    // Defuse formula injection by prefixing dangerous content with a tab
    // (CWE-1236). Applied per line: multi-line cells (e.g. status notes) may
    // carry a formula prefix on a later line, not just at the cell start.
    // Splits on \r\n, \n, AND lone \r — a legacy/adversarial input may use
    // bare \r as a separator, which a \n-only split would let through.
    const safe = /[\r\n]/.test(str)
        ? str.split(/\r\n|\r|\n/).map(line => FORMULA_PREFIXES.test(line) ? `\t${line}` : line).join('\n')
        : (FORMULA_PREFIXES.test(str) ? `\t${str}` : str);
    if (safe.includes(delimiter) || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
        return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
}

export function nextExportOffset(currentOffset: number, rowsReceived: number): number {
    return currentOffset + Math.max(rowsReceived, 0);
}

/**
 * Parse service definition JSON from a taxonomy term's field_service_definition.
 * Returns an array of attribute definitions, or empty array on failure.
 */
function parseServiceDefinition(
    raw: unknown,
    options: ParseServiceDefinitionOptions = {}
): ServiceDefinitionAttribute[] {
    if (!raw) return [];
    // JSON:API returns text_long as { value, format, processed } or plain string
    const json = typeof raw === 'string' ? raw : (raw as Record<string, string>)?.value;
    if (!json) return [];
    const includeNonVariable = options.includeNonVariable ?? true;
    try {
        const parsed = JSON.parse(json);
        const attrs = Array.isArray(parsed) ? parsed : parsed?.attributes;
        return Array.isArray(attrs)
            ? attrs
                .filter(attr => includeNonVariable || attr?.variable !== false)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            : [];
    } catch {
        return [];
    }
}

function parseJsonField(value: unknown): Record<string, unknown> | null {
    if (!value) return null;
    const str = typeof value === 'string' ? value : (value as Record<string, string>)?.value;
    if (!str) return null;
    try {
        const parsed = JSON.parse(str);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed as Record<string, unknown>
            : null;
    } catch {
        return null;
    }
}

function jsonApiTextField(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        const text = value as { value?: unknown; processed?: unknown };
        return String(text.value || text.processed || '');
    }
    return String(value);
}

function formatJsonApiAddress(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return '';

    const address = value as {
        address_line1?: string;
        postal_code?: string;
        locality?: string;
    };
    return [
        address.address_line1,
        [address.postal_code, address.locality].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ');
}

function jsonApiRelationArray(resource: JsonApiResource, fieldName: string): Array<{ type: string; id: string; meta?: Record<string, unknown> }> {
    const data = (resource.relationships?.[fieldName] as { data?: unknown } | undefined)?.data;
    if (!data) return [];
    return (Array.isArray(data) ? data : [data])
        .filter((item): item is { type: string; id: string; meta?: Record<string, unknown> } =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as { type?: unknown }).type === 'string' &&
            typeof (item as { id?: unknown }).id === 'string'
        );
}

function jsonApiRelation(resource: JsonApiResource, fieldName: string): { type: string; id: string; meta?: Record<string, unknown> } | null {
    return jsonApiRelationArray(resource, fieldName)[0] || null;
}

function buildIncludedLookup(included: readonly JsonApiResource[]): Map<string, JsonApiResource> {
    return new Map(included.map(item => [`${item.type}:${item.id}`, item]));
}

function findIncludedResource(
    lookup: Map<string, JsonApiResource>,
    ref: { type: string; id: string } | null | undefined
): JsonApiResource | undefined {
    return ref ? lookup.get(`${ref.type}:${ref.id}`) : undefined;
}

function jsonApiResourceLabel(resource: JsonApiResource | undefined): string {
    const attrs = resource?.attributes || {};
    return String(attrs.label || attrs.name || attrs.title || attrs.filename || attrs.display_name || attrs.drupal_internal__id || '');
}

function stripHtmlToText(value: string): string {
    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, '\'')
        .split('\n')
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');
}

function jsonApiInternalRemarkValue(remark: JsonApiResource): { target_id: unknown, value?: string } {
    const parts = [
        remark.attributes?.created ? String(remark.attributes.created) : '',
        stripHtmlToText(jsonApiTextField(remark.attributes?.field_internal_remark_text)),
    ].filter(Boolean);

    return {
        target_id: remark.attributes?.drupal_internal__id || remark.id,
        ...(parts.length ? { value: parts.join(' - ') } : {}),
    };
}

function jsonApiRelationshipAsDrupalValue(
    resource: JsonApiResource,
    includedLookup: Map<string, JsonApiResource>,
    fieldName: string
): unknown {
    const refs = jsonApiRelationArray(resource, fieldName);
    if (!refs.length) return undefined;

    const values = refs.map((ref) => {
        const included = findIncludedResource(includedLookup, ref);
        if (fieldName === 'field_internal_remark' && included?.type === 'paragraph--internal_remark') {
            return jsonApiInternalRemarkValue(included);
        }

        const targetId = ref.meta?.drupal_internal__target_id || included?.attributes?.drupal_internal__id || ref.id;
        const label = jsonApiResourceLabel(included);
        return label
            ? { target_id: targetId, label }
            : { target_id: targetId };
    });

    return values.length === 1 ? values[0] : values;
}

function buildJsonApiDrupalFieldBlock(
    resource: JsonApiResource,
    includedLookup: Map<string, JsonApiResource>
): Record<string, unknown> {
    const attrs = resource.attributes || {};
    const fields: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(attrs)) {
        if (!key.startsWith('field_')) continue;
        fields[key] = Array.isArray(value) || (value && typeof value === 'object')
            ? value
            : [{ value }];
    }

    for (const fieldName of Object.keys(resource.relationships || {})) {
        if (!fieldName.startsWith('field_')) continue;
        const value = jsonApiRelationshipAsDrupalValue(resource, includedLookup, fieldName);
        if (value !== undefined) {
            fields[fieldName] = value;
        }
    }

    return fields;
}

export function transformJsonApiRequestForExport(resource: JsonApiResource, included: readonly JsonApiResource[]): GeoreportRequest {
    const attrs = resource.attributes || {};
    const includedLookup = buildIncludedLookup(included);
    const jurisdiction = findIncludedResource(includedLookup, jsonApiRelation(resource, 'field_jurisdiction'));
    const category = findIncludedResource(includedLookup, jsonApiRelation(resource, 'field_category'));
    const status = findIncludedResource(includedLookup, jsonApiRelation(resource, 'field_status'));
    const district = findIncludedResource(includedLookup, jsonApiRelation(resource, 'field_district'));
    const sublocality = findIncludedResource(includedLookup, jsonApiRelation(resource, 'field_sublocality'));
    const organisations = jsonApiRelationArray(resource, 'field_organisation')
        .map(ref => findIncludedResource(includedLookup, ref))
        .filter((item): item is JsonApiResource => Boolean(item))
        .map(item => ({
            label: jsonApiResourceLabel(item),
            name: jsonApiResourceLabel(item),
        }));

    const mediaUrls = jsonApiRelationArray(resource, 'field_request_media')
        .map(ref => findIncludedResource(includedLookup, ref))
        .filter((item): item is JsonApiResource => Boolean(item))
        .map((media) => {
            const imageRef = jsonApiRelation(media, 'field_media_image') || jsonApiRelation(media, 'thumbnail');
            const file = findIncludedResource(includedLookup, imageRef);
            return String(file?.attributes?.uri && typeof file.attributes.uri === 'object'
                ? (file.attributes.uri as Record<string, unknown>).url || ''
                : '');
        })
        .filter(Boolean);

    const statusNotes = jsonApiRelationArray(resource, 'field_status_notes')
        .map(ref => findIncludedResource(includedLookup, ref))
        .filter((item): item is JsonApiResource => Boolean(item))
        .map((note) => {
            const noteStatus = findIncludedResource(includedLookup, jsonApiRelation(note, 'field_status_term'));
            const statusName = jsonApiResourceLabel(noteStatus);
            return {
                status_note: jsonApiTextField(note.attributes?.field_status_note),
                status_descriptive_name: statusName,
                status: String(noteStatus?.attributes?.field_open311_mapping || statusName || ''),
                updated_datetime: note.attributes?.created ? String(note.attributes.created) : undefined,
            };
        })
        .filter(note => note.status_note || note.status_descriptive_name);

    const geolocation = attrs.field_geolocation as { lat?: unknown; lng?: unknown; lon?: unknown } | undefined;
    const categoryAttrs = category?.attributes || {};
    const statusAttrs = status?.attributes || {};
    const jurisdictionAttrs = jurisdiction?.attributes || {};
    const districtAttrs = district?.attributes || {};
    const sublocalityAttrs = sublocality?.attributes || {};
    const drupal = buildJsonApiDrupalFieldBlock(resource, includedLookup);
    const firstMediaWithHazard = jsonApiRelationArray(resource, 'field_request_media')
        .map(ref => findIncludedResource(includedLookup, ref))
        .find(media => media?.attributes?.field_ai_hazard_category);
    if (firstMediaWithHazard?.attributes?.field_ai_hazard_category != null) {
        drupal.field_ai_hazard_category = [{ value: firstMediaWithHazard.attributes.field_ai_hazard_category }];
    }

    return {
        service_request_id: String(attrs.request_id || attrs.drupal_internal__nid || resource.id),
        title: String(attrs.title || ''),
        description: jsonApiTextField(attrs.body),
        service_name: String(categoryAttrs.name || ''),
        service_code: String(categoryAttrs.field_service_code || categoryAttrs.drupal_internal__tid || ''),
        status: String(statusAttrs.field_open311_mapping || statusAttrs.name || ''),
        address_string: formatJsonApiAddress(attrs.field_address),
        lat: geolocation?.lat as string | number | undefined,
        long: (geolocation?.lng ?? geolocation?.lon) as string | number | undefined,
        requested_datetime: attrs.created ? String(attrs.created) : undefined,
        updated_datetime: attrs.changed ? String(attrs.changed) : undefined,
        media_url: mediaUrls.join(','),
        jurisdiction: jurisdiction
            ? {
                id: String(jurisdictionAttrs.drupal_internal__id || ''),
                label: String(jurisdictionAttrs.label || jurisdictionAttrs.name || ''),
            }
            : undefined,
        organisation: organisations[0],
        organisations: organisations.length ? organisations : undefined,
        extended_attributes: {
            drupal,
            markaspot: {
                nid: attrs.drupal_internal__nid as string | number | undefined,
                published: attrs.status !== false,
                district: district
                    ? {
                        id: String(districtAttrs.drupal_internal__tid || ''),
                        tid: String(districtAttrs.drupal_internal__tid || ''),
                        name: String(districtAttrs.name || ''),
                        label: String(districtAttrs.name || ''),
                    }
                    : undefined,
                sublocality: sublocality
                    ? {
                        id: String(sublocalityAttrs.drupal_internal__tid || ''),
                        tid: String(sublocalityAttrs.drupal_internal__tid || ''),
                        name: String(sublocalityAttrs.name || ''),
                        label: String(sublocalityAttrs.name || ''),
                    }
                    : undefined,
                status_notes: statusNotes,
            },
            attributes: (parseJsonField(attrs.field_request_attributes) || {}) as Record<string, string | number | boolean | null>,
        },
    };
}

function resolveExportAttributeValue(
    rawValue: unknown,
    definition?: ServiceDefinitionAttribute,
    mediaNames?: Map<string, string>
): string {
    if (rawValue == null || rawValue === '') return '';

    if (definition?.datatype === 'imagelist' && mediaNames) {
        if (Array.isArray(rawValue)) {
            return rawValue.map(value => mediaNames.get(String(value)) ?? String(value)).join(', ');
        }
        const resolved = mediaNames.get(String(rawValue));
        if (resolved) return resolved;
    }

    if (definition?.values?.length) {
        if (Array.isArray(rawValue)) {
            return rawValue
                .map(value => definition.values!.find(option => option.key === String(value))?.name ?? String(value))
                .join(', ');
        }
        const raw = String(rawValue);
        if (raw.includes(',')) {
            return raw
                .split(',')
                .map(value => definition.values!.find(option => option.key === value.trim())?.name ?? value.trim())
                .join(', ');
        }
        return definition.values.find(option => option.key === raw)?.name ?? raw;
    }

    return String(rawValue);
}

export function resolveStatusAttributesForExport(
    attributes: Record<string, unknown> | null | undefined,
    definitions: ServiceDefinitionAttribute[],
    mediaNames = new Map<string, string>()
): ResolvedStatusAttribute[] {
    if (!attributes) return [];

    return definitions
        .map((definition) => {
            const rawValue = attributes[definition.code];
            if (
                rawValue === undefined ||
                rawValue === null ||
                rawValue === '' ||
                (Array.isArray(rawValue) && rawValue.length === 0)
            ) {
                return null;
            }
            return {
                code: definition.code,
                label: definition.description || definition.code,
                value: resolveExportAttributeValue(rawValue, definition, mediaNames)
            };
        })
        .filter((item): item is ResolvedStatusAttribute => item !== null);
}

export function normalizeStatusNoteTimestamp(value: unknown): string {
    if (!value) return '';
    const parsed = Date.parse(String(value));
    return Number.isNaN(parsed) ? String(value) : String(parsed);
}

/**
 * Derive the ordered, de-duplicated list of status attribute codes and labels
 * from a StatusAttributeResolutionContext.
 *
 * Gating invariant: statusAttributeContext is only populated when
 * `includeInternalStatusAttributes` is true (staff). When the context is
 * empty (non-staff path), this returns {codes:[], labels: empty Map} and no
 * status-attribute columns appear in the export.
 */
export function deriveStatusAttributeColumns(context: StatusAttributeResolutionContext): {
    codes: string[];
    labels: Map<string, string>;
} {
    const codes: string[] = [];
    const seen = new Set<string>();
    const labels = new Map<string, string>();

    for (const definitions of context.definitionsByStatusId.values()) {
        for (const def of definitions) {
            if (!seen.has(def.code)) {
                seen.add(def.code);
                codes.push(def.code);
                labels.set(def.code, def.description || def.code);
            }
        }
    }

    return { codes, labels };
}

export function canExportInternalStatusAttributes(
    roles: readonly string[],
    groups: readonly AuthStatusGroup[] = [],
    allowedJurisdictionIds: readonly string[] = []
): boolean {
    if (roles.some(role => INTERNAL_DASHBOARD_ROLES.has(role))) return true;

    const allowedJurisdictions = new Set(allowedJurisdictionIds.map(String).filter(Boolean));

    return groups.some((group) => {
        if (!Array.isArray(group.roles)) return false;
        const matchesExportScope = allowedJurisdictions.size === 0 ||
            (group.type === 'jur' && group.id != null && allowedJurisdictions.has(String(group.id)));
        return matchesExportScope && group.roles.some(role => role.id && (
            ELEVATED_JURISDICTION_ROLES.has(role.id) ||
            INTERNAL_STATUS_ORGANISATION_ROLES.has(role.id)
        ));
    });
}

export function buildExportForwardHeaders(
    cookie: string | undefined,
    csrfToken: string,
    canonicalHost: string
): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Forwarded-Proto': 'https',
    };
    if (canonicalHost) {
        headers['X-Forwarded-Host'] = canonicalHost;
    }
    if (cookie) {
        headers.cookie = cookie;
    }
    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }
    return headers;
}

export function shouldAbortExportForStaleSession(hasSession: boolean, response: unknown): boolean {
    return hasSession && isMinimalExtendedAttributes(response);
}

function isManagementFieldGroupVisible(
    groupId: string,
    fieldGroups: NonNullable<ManagementFormModeSettingsResponse['field_groups']>,
    visited = new Set<string>()
): boolean {
    const group = fieldGroups[groupId];
    if (!group) return true;
    if (visited.has(groupId)) return true;
    if (group.region === 'hidden') return false;

    const parentId = group.parent || '';
    if (!parentId) return true;

    visited.add(groupId);
    return isManagementFieldGroupVisible(parentId, fieldGroups, visited);
}

function isManagementFieldVisible(
    fieldName: string,
    fields: NonNullable<ManagementFormModeSettingsResponse['fields']>,
    fieldGroups: NonNullable<ManagementFormModeSettingsResponse['field_groups']>
): boolean {
    const field = fields[fieldName];
    if (!field) return false;
    if (field.display_settings?.region === 'hidden') return false;

    const containerGroupIds = Object.entries(fieldGroups)
        .filter(([, group]) => group?.children?.includes(fieldName))
        .map(([groupId]) => groupId);
    if (!containerGroupIds.length) return true;

    return containerGroupIds.some(groupId => isManagementFieldGroupVisible(groupId, fieldGroups));
}

function buildAllowedValueResolver(allowedValues: unknown): Map<string, string> | undefined {
    if (!allowedValues) return undefined;
    const resolver = new Map<string, string>();

    if (Array.isArray(allowedValues)) {
        for (const item of allowedValues) {
            if (!item || typeof item !== 'object') continue;
            const value = (item as Record<string, unknown>).value;
            const label = (item as Record<string, unknown>).label;
            if (value == null || label == null) continue;
            resolver.set(String(value), String(label));
        }
    } else if (typeof allowedValues === 'object') {
        for (const [value, label] of Object.entries(allowedValues as Record<string, unknown>)) {
            if (label == null) continue;
            resolver.set(String(value), String(label));
        }
    }

    return resolver.size > 0 ? resolver : undefined;
}

function isRelationshipLikeManagementField(fieldType?: string): boolean {
    return [
        'entity_reference',
        'entity_reference_revisions',
        'file',
        'image',
    ].includes(fieldType || '');
}

function emptyManagementFieldColumnContext(): ManagementFieldColumnContext {
    return {
        visibleFieldKeys: [],
        orderedFieldKeys: [],
        labels: new Map(),
        relationshipFieldKeys: [],
        valueResolvers: new Map(),
        loaded: false,
    };
}

export function resolveManagementFieldColumnContext(
    response: ManagementFormModeSettingsResponse | undefined
): ManagementFieldColumnContext {
    const fields = response?.fields;
    if (!fields || typeof fields !== 'object') return emptyManagementFieldColumnContext();

    const fieldGroups = response.field_groups || {};
    const visibleFieldKeys: string[] = [];
    const orderedFieldKeys: string[] = [];
    const labels = new Map<string, string>();
    const relationshipFieldKeys: string[] = [];
    const valueResolvers = new Map<string, Map<string, string>>();

    for (const [fieldName] of Object.entries(fields)) {
        if (fieldName.startsWith('field_') && isManagementFieldVisible(fieldName, fields, fieldGroups)) {
            visibleFieldKeys.push(fieldName);
        }
    }

    const visibleEntries = Object.entries(fields)
        .filter(([fieldName]) => isExportableDrupalFieldColumn(fieldName))
        .filter(([fieldName]) => isManagementFieldVisible(fieldName, fields, fieldGroups))
        .sort(([fieldNameA, configA], [fieldNameB, configB]) => {
            const weightA = Number.isFinite(configA?.display_settings?.weight)
                ? Number(configA.display_settings.weight)
                : Number.MAX_SAFE_INTEGER;
            const weightB = Number.isFinite(configB?.display_settings?.weight)
                ? Number(configB.display_settings.weight)
                : Number.MAX_SAFE_INTEGER;
            if (weightA !== weightB) return weightA - weightB;
            return fieldNameA.localeCompare(fieldNameB);
        });

    for (const [fieldName, config] of visibleEntries) {
        orderedFieldKeys.push(fieldName);
        const label = typeof config?.label === 'string' ? config.label.trim() : '';
        const machineLabel = fieldName.replace(/^field_/, '');
        if (label && label !== fieldName && label !== machineLabel) {
            labels.set(fieldName, label);
        }
        if (isRelationshipLikeManagementField(config?.field_type)) {
            relationshipFieldKeys.push(fieldName);
        }
        const valueResolver = buildAllowedValueResolver(config?.settings?.allowed_values);
        if (valueResolver) {
            valueResolvers.set(fieldName, valueResolver);
        }
    }

    return { visibleFieldKeys, orderedFieldKeys, labels, relationshipFieldKeys, valueResolvers, loaded: true };
}

async function fetchManagementFieldColumnContext(
    localFetch: LocalFetcher,
    headers: Record<string, string>
): Promise<ManagementFieldColumnContext> {
    const fallback: ManagementFieldColumnContext = {
        visibleFieldKeys: [],
        orderedFieldKeys: [],
        labels: new Map(),
        relationshipFieldKeys: [],
        valueResolvers: new Map(),
        loaded: false,
    };

    try {
        const response = await localFetch<ManagementFormModeSettingsResponse>(
            '/api/mark-a-spot-form-mode-settings/node/service_request/management',
            {
                headers,
                timeout: 10000,
            }
        );
        return resolveManagementFieldColumnContext(response);
    } catch (err) {
        console.warn('[requests-csv] Failed to fetch management form field contract:', err instanceof Error ? err.message : err);
        return fallback;
    }
}

async function fetchMediaNamesForAttributes(
    attributes: ServiceDefinitionAttribute[],
    baseUrl: string,
    locale: string,
    headers: Record<string, string>,
    fetchAgent: Agent,
    signal: AbortSignal
): Promise<Map<string, string>> {
    const mediaNames = new Map<string, string>();
    const fetchedTypes = new Set<string>();

    for (const attr of attributes) {
        if (attr.datatype !== 'imagelist' || !attr.media_type) continue;
        const key = attr.media_group ? `${attr.media_type}|${attr.media_group}` : attr.media_type;
        if (fetchedTypes.has(key)) continue;
        fetchedTypes.add(key);

        try {
            const mediaParams = new URLSearchParams({
                [`fields[media--${attr.media_type}]`]: 'name',
                'page[limit]': '100',
            });
            if (attr.media_group) {
                mediaParams.set('filter[field_definition_group][value]', attr.media_group);
            }
            const mediaUrl = `${baseUrl}/jsonapi/media/${attr.media_type}?${mediaParams.toString()}`;
            const mediaResponse = await $fetch<{ data?: Array<{ id: string; attributes?: { name?: string } }> }>(mediaUrl, {
                method: 'GET',
                headers: { ...headers, 'Accept-Language': locale },
                agent: fetchAgent,
                signal,
                timeout: 15000,
            });

            for (const entity of mediaResponse?.data || []) {
                if (entity.id && entity.attributes?.name) {
                    mediaNames.set(entity.id, entity.attributes.name);
                }
            }
        } catch (mediaErr) {
            console.warn(`[requests-csv] Failed to fetch media type "${attr.media_type}":`, mediaErr instanceof Error ? mediaErr.message : mediaErr);
        }
    }

    return mediaNames;
}

async function fetchMediaNamesForAttributesViaJsonApi(
    attributes: ServiceDefinitionAttribute[],
    fetchJsonApi: JsonApiFetcher
): Promise<Map<string, string>> {
    const mediaNames = new Map<string, string>();
    const fetchedTypes = new Set<string>();

    for (const attr of attributes) {
        if (attr.datatype !== 'imagelist' || !attr.media_type) continue;
        const key = attr.media_group ? `${attr.media_type}|${attr.media_group}` : attr.media_type;
        if (fetchedTypes.has(key)) continue;
        fetchedTypes.add(key);

        try {
            const mediaParams = new URLSearchParams({
                [`fields[media--${attr.media_type}]`]: 'name',
                'page[limit]': '100',
            });
            if (attr.media_group) {
                mediaParams.set('filter[field_definition_group][value]', attr.media_group);
            }
            const mediaResponse = await fetchJsonApi<{ data?: Array<{ id: string; attributes?: { name?: string } }> }>(
                `/jsonapi/media/${attr.media_type}?${mediaParams.toString()}`,
                15000
            );

            for (const entity of mediaResponse?.data || []) {
                if (entity.id && entity.attributes?.name) {
                    mediaNames.set(entity.id, entity.attributes.name);
                }
            }
        } catch (mediaErr) {
            console.warn(`[requests-csv] Failed to fetch media type "${attr.media_type}" via proxy:`, mediaErr instanceof Error ? mediaErr.message : mediaErr);
        }
    }

    return mediaNames;
}

/**
 * Fetch service definitions from JSON:API and build resolution context.
 * Maps attribute codes to human-readable labels and value display names.
 */
export async function fetchAttributeResolutionContext(
    jurisdictionId: string,
    fetchJsonApi: JsonApiFetcher
): Promise<AttributeResolutionContext> {
    const labels = new Map<string, string>();
    const valueResolvers = new Map<string, Map<string, string>>();
    const orderedCodes: string[] = [];
    const seenCodes = new Set<string>();
    let serviceDefinitionsLoaded = false;

    try {
        const definitionValues: unknown[] = [];
        const jurisdictionKeys = uniqueValues(parseJurisdictionIds(jurisdictionId));
        const scopedJurisdictionKeys = jurisdictionKeys.length ? jurisdictionKeys : [''];

        for (const jurisdictionKey of scopedJurisdictionKeys) {
            const params = new URLSearchParams({
                'fields[taxonomy_term--service_category]': 'field_service_code,field_service_definition,name',
                'filter[status][value]': '1',
                'page[limit]': '200',
            });
            if (jurisdictionKey) {
                // Support both numeric IDs and slugs. Multi-jurisdiction export
                // fetches each jurisdiction separately so a value like "19,20"
                // never turns into a bogus field_slug filter.
                if (/^\d+$/.test(jurisdictionKey)) {
                    params.set('filter[field_jurisdiction.meta.drupal_internal__target_id]', jurisdictionKey);
                } else {
                    params.set('filter[field_jurisdiction.field_slug]', jurisdictionKey);
                }
            }
            const response = await fetchJsonApi<{ data?: Array<{ attributes?: Record<string, unknown> }> }>(
                `/jsonapi/taxonomy_term/service_category?${params.toString()}`,
                15000
            );

            for (const term of response?.data || []) {
                definitionValues.push(term.attributes?.field_service_definition);
            }
        }

        for (const jurisdictionKey of scopedJurisdictionKeys) {
            const params = new URLSearchParams({
                'fields[taxonomy_term--internal_status]': 'name,field_status_definition',
                'filter[status][value]': '1',
                'page[limit]': '200',
                'sort': 'weight,name',
            });
            if (jurisdictionKey) {
                if (/^\d+$/.test(jurisdictionKey)) {
                    params.set('filter[field_jurisdiction.meta.drupal_internal__target_id]', jurisdictionKey);
                } else {
                    params.set('filter[field_jurisdiction.field_slug]', jurisdictionKey);
                }
            }
            let response: { data?: Array<{ attributes?: Record<string, unknown> }> } | null = null;
            try {
                response = await fetchJsonApi<{ data?: Array<{ attributes?: Record<string, unknown> }> }>(
                    `/jsonapi/taxonomy_term/internal_status?${params.toString()}`,
                    15000
                );
            } catch (internalStatusErr) {
                console.warn('[requests-csv] Failed to fetch internal status definitions:', internalStatusErr instanceof Error ? internalStatusErr.message : internalStatusErr);
                continue;
            }

            for (const term of response?.data || []) {
                definitionValues.push(term.attributes?.field_status_definition);
            }
        }
        serviceDefinitionsLoaded = true;
        // Collect imagelist attributes during first pass to avoid re-parsing
        const imagelistAttrs: ServiceDefinitionAttribute[] = [];
        for (const rawDefinition of definitionValues) {
            const attrs = parseServiceDefinition(rawDefinition);
            for (const attr of attrs) {
                if (!attr.code || seenCodes.has(attr.code)) continue;
                seenCodes.add(attr.code);
                orderedCodes.push(attr.code);
                labels.set(attr.code, attr.description || attr.code);

                // Build value resolver for list types
                if (attr.values?.length) {
                    const valueMap = new Map<string, string>();
                    for (const v of attr.values) {
                        valueMap.set(String(v.key), v.name);
                    }
                    valueResolvers.set(attr.code, valueMap);
                }
                // Track imagelist attributes for media entity resolution
                if (attr.datatype === 'imagelist' && attr.media_type) {
                    imagelistAttrs.push(attr);
                }
            }
        }

        // Resolve imagelist attributes: fetch media entities by media_type to map UUID -> name
        // Group by media_type to avoid duplicate fetches
        const mediaTypeToAttrs = new Map<string, ServiceDefinitionAttribute[]>();
        for (const attr of imagelistAttrs) {
            const key = attr.media_group ? `${attr.media_type}|${attr.media_group}` : attr.media_type!;
            const existing = mediaTypeToAttrs.get(key) || [];
            existing.push(attr);
            mediaTypeToAttrs.set(key, existing);
        }

        // Fetch media entities for each media_type
        for (const [key, attrs] of mediaTypeToAttrs) {
            const [mediaType, mediaGroup] = key.split('|');
            try {
                const mediaParams = new URLSearchParams({
                    [`fields[media--${mediaType}]`]: 'name',
                    'page[limit]': '100',
                });
                if (mediaGroup) {
                    mediaParams.set('filter[field_definition_group][value]', mediaGroup);
                }
                const mediaResponse = await fetchJsonApi<{ data?: Array<{ id: string; attributes?: { name?: string } }> }>(
                    `/jsonapi/media/${mediaType}?${mediaParams.toString()}`,
                    15000
                );

                // Build UUID -> name map and assign to all imagelist attributes using this media_type
                const uuidToName = new Map<string, string>();
                for (const entity of mediaResponse?.data || []) {
                    if (entity.id && entity.attributes?.name) {
                        uuidToName.set(entity.id, entity.attributes.name);
                    }
                }
                for (const attr of attrs) {
                    valueResolvers.set(attr.code, uuidToName);
                }
            } catch (mediaErr) {
                console.warn(`[requests-csv] Failed to fetch media type "${mediaType}":`, mediaErr instanceof Error ? mediaErr.message : mediaErr);
            }
        }
    } catch (err) {
        // Non-fatal: fall back to raw codes if service definitions can't be loaded
        console.warn('[requests-csv] Failed to fetch service definitions:', err instanceof Error ? err.message : err);
    }

    return { labels, valueResolvers, orderedCodes, serviceDefinitionsLoaded };
}

function parseJurisdictionIds(value: string): string[] {
    return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

function uniqueValues(values: readonly string[]): string[] {
    return [...new Set(values.filter(Boolean))];
}

export function collectFacilityLabels(
    target: Map<string, Map<string, string>>,
    jurisdictionIds: readonly string[],
    settings: MarkASpotSettingsResponse | undefined
): void {
    const scopedLabels = new Map<string, string>();
    for (const item of settings?.facilities?.items || []) {
        if (!item?.id) continue;
        const label = item.label || item.name || item.id;
        scopedLabels.set(String(item.id), String(label));
    }
    if (scopedLabels.size === 0) return;

    for (const id of uniqueValues(jurisdictionIds.map(String).filter(Boolean))) {
        if (target.has(id)) continue;
        target.set(id, new Map(scopedLabels));
    }
}

export function buildDrupalFieldValueResolvers(
    managementResolvers: Map<string, Map<string, string>>,
    facilityLabelsByJurisdiction: Map<string, Map<string, string>>,
    request?: GeoreportRequest
): Map<string, Map<string, string>> {
    const resolvers = new Map(managementResolvers);
    const jurisdictionId = request?.jurisdiction?.id != null
        ? String(request.jurisdiction.id)
        : '';
    const scopedFacilityLabels = jurisdictionId
        ? facilityLabelsByJurisdiction.get(jurisdictionId)
        : undefined;
    const fallbackLabels = facilityLabelsByJurisdiction.size === 1
        ? Array.from(facilityLabelsByJurisdiction.values())[0]
        : undefined;
    const facilityLabels = scopedFacilityLabels || fallbackLabels;
    if (facilityLabels && facilityLabels.size > 0) {
        resolvers.set('field_facility', facilityLabels);
    }
    return resolvers;
}

export async function resolveExportJurisdictionScope(
    jurisdictionId: string,
    slug: string,
    localFetch: <T>(request: string, options?: Record<string, unknown>) => Promise<T>
): Promise<ExportJurisdictionScope> {
    const rawJurisdictionIds = parseJurisdictionIds(jurisdictionId);
    const requestJurisdictionIds = rawJurisdictionIds.filter(id => /^\d+$/.test(id));
    const taxonomyJurisdictionIds: string[] = [...requestJurisdictionIds];
    const facilityLabelsByJurisdiction = new Map<string, Map<string, string>>();
    const settingsKeys = rawJurisdictionIds.length > 0
        ? uniqueValues(rawJurisdictionIds)
        : uniqueValues([slug && slug !== 'export' ? slug : '']);

    for (const key of settingsKeys) {
        try {
            const params = new URLSearchParams({
                exclude: 'boundary',
                jurisdiction: key,
            });
            const settings = await localFetch<MarkASpotSettingsResponse>(
                `/api/mark-a-spot-settings?${params.toString()}`,
                { timeout: 5000 }
            );
            const resolvedJurisdictionId = settings?.jurisdiction?.id;
            const taxonomyJurisdictionId = settings?.jurisdiction?.taxonomyJurisdictionId || resolvedJurisdictionId;
            collectFacilityLabels(facilityLabelsByJurisdiction, [
                key,
                resolvedJurisdictionId != null ? String(resolvedJurisdictionId) : '',
                taxonomyJurisdictionId != null ? String(taxonomyJurisdictionId) : '',
            ], settings);
            if (resolvedJurisdictionId != null && /^\d+$/.test(String(resolvedJurisdictionId))) {
                requestJurisdictionIds.push(String(resolvedJurisdictionId));
            }
            if (taxonomyJurisdictionId != null && /^\d+$/.test(String(taxonomyJurisdictionId))) {
                taxonomyJurisdictionIds.push(String(taxonomyJurisdictionId));
            }
        } catch (err) {
            console.warn('[requests-csv] Failed to resolve export jurisdiction settings:', err instanceof Error ? err.message : err);
        }
    }

    return {
        requestJurisdictionIds: uniqueValues(requestJurisdictionIds),
        taxonomyJurisdictionIds: uniqueValues(taxonomyJurisdictionIds),
        facilityLabelsByJurisdiction,
    };
}

async function fetchStatusAttributeResolutionContext(
    jurisdictionIds: readonly string[],
    fetchJsonApi: JsonApiFetcher
): Promise<StatusAttributeResolutionContext> {
    const definitionsByStatusId = new Map<string, ServiceDefinitionAttribute[]>();
    let loaded = false;

    const scopedJurisdictionIds = uniqueValues(jurisdictionIds);
    if (!scopedJurisdictionIds.length) {
        return { definitionsByStatusId, mediaNames: new Map(), loaded };
    }

    try {
        const allDefinitions: ServiceDefinitionAttribute[] = [];
        for (const scopedJurisdictionId of scopedJurisdictionIds) {
            const params = new URLSearchParams({
                'fields[taxonomy_term--service_status]': 'name,field_status_definition',
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': scopedJurisdictionId,
                'page[limit]': '200',
                'sort': 'weight,name',
            });

            const response = await fetchJsonApi<{ data?: Array<JsonApiResource> }>(
                `/jsonapi/taxonomy_term/service_status?${params.toString()}`,
                15000
            );

            for (const status of response?.data || []) {
                const definitions = parseServiceDefinition(status.attributes?.field_status_definition, { includeNonVariable: false });
                if (!definitions.length) continue;
                definitionsByStatusId.set(status.id, definitions);
                allDefinitions.push(...definitions);
            }
        }

        loaded = true;
        const mediaNames = await fetchMediaNamesForAttributesViaJsonApi(allDefinitions, fetchJsonApi);
        return { definitionsByStatusId, mediaNames, loaded };
    } catch (err) {
        console.warn('[requests-csv] Failed to fetch status attribute definitions:', err instanceof Error ? err.message : err);
        return { definitionsByStatusId, mediaNames: new Map(), loaded };
    }
}

function buildRequestIdInFilterParams(requestIds: readonly string[], jurisdictionIds: readonly string[]): URLSearchParams {
    const params = new URLSearchParams({
        'fields[node--service_request]': 'request_id,field_status_notes',
        'fields[paragraph--status]': 'created,field_status_note,field_status_attributes,field_status_term',
        'fields[taxonomy_term--service_status]': 'name',
        'include': 'field_status_notes,field_status_notes.field_status_term',
        'page[limit]': String(Math.max(requestIds.length, 1)),
        'filter[request_id-filter][condition][path]': 'request_id',
        'filter[request_id-filter][condition][operator]': 'IN',
    });

    requestIds.forEach((requestId, index) => {
        params.set(`filter[request_id-filter][condition][value][${index}]`, requestId);
    });

    const numericJurisdictionIds = uniqueValues(jurisdictionIds.filter(id => /^\d+$/.test(id)));
    if (numericJurisdictionIds.length === 1) {
        params.set('filter[field_jurisdiction.meta.drupal_internal__target_id]', numericJurisdictionIds[0]);
    } else if (numericJurisdictionIds.length > 1) {
        params.set('filter[jurisdiction-filter][condition][path]', 'field_jurisdiction.meta.drupal_internal__target_id');
        params.set('filter[jurisdiction-filter][condition][operator]', 'IN');
        numericJurisdictionIds.forEach((id, index) => {
            params.set(`filter[jurisdiction-filter][condition][value][${index}]`, id);
        });
    }

    return params;
}

function extractRelationshipData(resource: JsonApiResource | undefined, fieldName: string): any {
    return (resource?.relationships?.[fieldName] as { data?: unknown } | undefined)?.data;
}

async function fetchStatusAttributesForRequests(
    requests: readonly GeoreportRequest[],
    statusContext: StatusAttributeResolutionContext,
    fallbackJurisdictionIds: readonly string[],
    fetchJsonApi: JsonApiFetcher
): Promise<Map<string, GeoreportStatusNote[]>> {
    const result = new Map<string, GeoreportStatusNote[]>();
    if (!statusContext.loaded || statusContext.definitionsByStatusId.size === 0) return result;

    const requestIds = requests
        .map(req => req.service_request_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (!requestIds.length) return result;

    const requestJurisdictionIds = uniqueValues([
        ...requests
            .map(req => req.jurisdiction?.id)
            .filter((id): id is string | number => id != null)
            .map(String),
        ...fallbackJurisdictionIds,
    ]);
    if (!requestJurisdictionIds.length) return result;

    for (let start = 0; start < requestIds.length; start += STATUS_DETAIL_CHUNK_SIZE) {
        const chunkIds = requestIds.slice(start, start + STATUS_DETAIL_CHUNK_SIZE);
        const params = buildRequestIdInFilterParams(chunkIds, requestJurisdictionIds);

        try {
            const response = await fetchJsonApi<{ data?: JsonApiResource[]; included?: JsonApiResource[] }>(
                `/jsonapi/node/service_request?${params.toString()}`,
                20000
            );

            const included = response?.included || [];
            const resourcesById = new Map(included.map(item => [`${item.type}:${item.id}`, item]));

            for (const node of response?.data || []) {
                const requestId = String(node.attributes?.request_id || '');
                if (!requestId) continue;

                const noteRefs = extractRelationshipData(node, 'field_status_notes');
                const noteRefsArray = Array.isArray(noteRefs) ? noteRefs : (noteRefs ? [noteRefs] : []);
                const statusNotes: GeoreportStatusNote[] = [];

                for (const noteRef of noteRefsArray) {
                    const noteId = (noteRef as { id?: string })?.id;
                    if (!noteId) continue;
                    const noteResource = resourcesById.get(`paragraph--status:${noteId}`);
                    const statusRef = extractRelationshipData(noteResource, 'field_status_term') as { id?: string } | null | undefined;
                    if (!statusRef?.id) continue;
                    const statusResource = resourcesById.get(`taxonomy_term--service_status:${statusRef.id}`);

                    const definitions = statusContext.definitionsByStatusId.get(statusRef.id);
                    const attributes = definitions?.length
                        ? resolveStatusAttributesForExport(
                                parseJsonField(noteResource?.attributes?.field_status_attributes),
                                definitions,
                                statusContext.mediaNames
                            )
                        : [];

                    const timestampKey = normalizeStatusNoteTimestamp(noteResource?.attributes?.created);
                    const note: GeoreportStatusNote = {
                        status_note: typeof noteResource?.attributes?.field_status_note === 'object'
                            ? String((noteResource.attributes.field_status_note as Record<string, unknown>)?.value || '')
                            : String(noteResource?.attributes?.field_status_note || ''),
                        status_descriptive_name: String(statusResource?.attributes?.name || ''),
                        status: String(statusResource?.attributes?.name || ''),
                        updated_datetime: timestampKey ? String(noteResource?.attributes?.created || '') : undefined,
                        ...(attributes.length && { resolved_status_attributes: attributes }),
                    };

                    if (note.status_note || note.status_descriptive_name || note.resolved_status_attributes?.length) {
                        statusNotes.push(note);
                    }
                }

                if (statusNotes.length) {
                    result.set(requestId, statusNotes);
                }
            }
        } catch (err) {
            console.warn('[requests-csv] Failed to fetch status attribute details:', err instanceof Error ? err.message : err);
        }
    }

    return result;
}

function enrichRequestsWithStatusAttributes(
    requests: readonly GeoreportRequest[],
    statusNotesByRequest: Map<string, GeoreportStatusNote[]>
): GeoreportRequest[] {
    if (statusNotesByRequest.size === 0) return [...requests];

    return requests.map((request) => {
        const requestId = request.service_request_id || '';
        const dashboardNotes = statusNotesByRequest.get(requestId);
        const notes = request.extended_attributes?.markaspot?.status_notes;
        if (!dashboardNotes?.length) {
            return request;
        }

        const byTimestamp = new Map(
            dashboardNotes
                .map(note => [normalizeStatusNoteTimestamp(note.updated_datetime), note] as const)
                .filter(([timestamp]) => Boolean(timestamp))
        );
        const enrichedNotes = Array.isArray(notes) && notes.length > 0
            ? notes.map((note) => {
                    const timestampKey = normalizeStatusNoteTimestamp(note.updated_datetime);
                    const dashboardNote = timestampKey ? byTimestamp.get(timestampKey) : undefined;
                    return dashboardNote?.resolved_status_attributes?.length
                        ? { ...note, resolved_status_attributes: dashboardNote.resolved_status_attributes }
                        : note;
                })
            : dashboardNotes;

        return {
            ...request,
            extended_attributes: {
                ...request.extended_attributes,
                markaspot: {
                    ...request.extended_attributes?.markaspot,
                    status_notes: enrichedNotes
                }
            }
        };
    });
}

export function formatExportRow(
    req: GeoreportRequest,
    attributeKeys: string[],
    delimiter: string,
    resolutionCtx: AttributeResolutionContext | undefined,
    includeOrganisationColumn: boolean,
    drupalFieldKeys: string[] = [],
    drupalFieldValueResolvers: Map<string, Map<string, string>> = new Map(),
    statusAttributeKeys: string[] = []
): string {
    const ext = req.extended_attributes?.drupal;
    // Typed view for the three scalar fields rendered as dedicated columns.
    const scalar = (ext || {}) as Record<string, Array<{ value?: string | number }> | undefined>;
    const ms = req.extended_attributes?.markaspot;
    // Human-readable, multi-line status notes (one note per line in the cell).
    const statusNotesStr = formatStatusNotes(ms?.status_notes);

    const district = ms?.district;
    const districtName = district?.name || district?.label || '';
    const sublocality = ms?.sublocality;
    const sublocalityName = sublocality?.name || sublocality?.label || '';

    // Fixed columns (superset of client-side getCsvColumns, adds Title/Description/Media URL)
    const organisationValue = req.organisations?.map(o => o.label || o.name).join(', ') || req.organisation?.label || req.organisation?.name;
    const fixedValues: (string | number | boolean | null | undefined)[] = [
        req.service_request_id,
        req.title,
        req.description,
        req.service_name,
        req.service_code,
        req.status,
        ms?.published === false ? 'unpublished' : 'published',
        req.address_string,
        districtName,
        sublocalityName,
        req.lat,
        req.long,
        req.requested_datetime,
        req.updated_datetime,
        req.media_url,
        ...(includeOrganisationColumn ? [organisationValue] : []),
        scalar.field_hazard_level?.[0]?.value,
        scalar.field_sentiment?.[0]?.value,
        scalar.field_ai_hazard_category?.[0]?.value,
        ms?.nid,
        statusNotesStr,
    ];

    // Generic complete-entity columns (full tier only; empty array otherwise).
    // Each cell flattens whatever shape the `?full` API returned for the field.
    const drupalValues = drupalFieldKeys.map(key =>
        formatDrupalFieldValue(ext?.[key], drupalFieldValueResolvers.get(key))
    );

    // Dynamic attribute columns with value resolution
    const attrs = req.extended_attributes?.attributes;
    const attrValues = attributeKeys.map((key) => {
        const rawValue = attrs?.[key];
        if (rawValue == null || rawValue === '') return '';
        // Resolve singlevaluelist/multivaluelist keys to display names
        const valueMap = resolutionCtx?.valueResolvers.get(key);
        if (valueMap) {
            const raw = String(rawValue);
            // Handle comma-separated keys (multivaluelist)
            if (raw.includes(',')) {
                return raw.split(',').map(k => valueMap.get(k.trim()) ?? k.trim()).join(', ');
            }
            return valueMap.get(raw) ?? raw;
        }
        return rawValue;
    });

    // Status-attribute columns: emit one cell per code from the MOST RECENT
    // status note that carries resolved_status_attributes.  Values are already
    // resolved option names (not raw keys) by enrichRequestsWithStatusAttributes.
    // statusAttributeKeys is [] for non-staff — no columns, no PII leak.
    let statusAttrValues: string[] = [];
    if (statusAttributeKeys.length > 0) {
        const notes = ms?.status_notes;
        let latestNote: GeoreportStatusNote | undefined;
        if (Array.isArray(notes)) {
            let latestTs = '';
            for (const note of notes) {
                if (!note.resolved_status_attributes?.length) continue;
                const ts = normalizeStatusNoteTimestamp(note.updated_datetime);
                if (!latestNote || ts > latestTs) {
                    latestNote = note;
                    latestTs = ts;
                }
            }
        }
        const latestAttrs = new Map<string, string>(
            latestNote?.resolved_status_attributes?.map(a => [a.code, a.value]) ?? []
        );
        statusAttrValues = statusAttributeKeys.map(code => latestAttrs.get(code) ?? '');
    }

    return [...fixedValues, ...drupalValues, ...attrValues, ...statusAttrValues]
        .map(v => escapeCsvValue(v, delimiter))
        .join(delimiter);
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const query = getQuery(event);

    // Parse query params with delimiter validation
    const jurisdictionId = String(query.jurisdiction_id || '');
    const rawDelimiter = String(query.delimiter || ',');
    const delimiter = ALLOWED_DELIMITERS.has(rawDelimiter) ? rawDelimiter : ',';
    const rawLocale = String(query.locale || 'en');
    const locale = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(rawLocale) ? rawLocale : 'en';
    const slug = String(query.slug || jurisdictionId || 'export');
    const status = query.status ? String(query.status) : undefined;
    const serviceCode = query.service_code ? String(query.service_code) : undefined;
    const excludeStatus = normalizeExportFieldFilter(query.exclude_status, TOKEN_LIST_FILTER, 256);
    const excludeServiceCode = normalizeExportFieldFilter(query.exclude_service_code, TOKEN_LIST_FILTER, 256);
    const dateFrom = query.date_from ? String(query.date_from) : undefined;
    const dateTo = query.date_to ? String(query.date_to) : undefined;
    const search = query.q ? String(query.q) : undefined;
    const sort = query.sort ? String(query.sort) : '-created';
    const fieldStatus = normalizeExportFieldFilter(query.field_status, INTEGER_LIST_FILTER);
    const excludeFieldStatus = normalizeExportFieldFilter(query.exclude_field_status, INTEGER_LIST_FILTER);
    const fieldCategory = normalizeExportFieldFilter(query.field_category, INTEGER_LIST_FILTER);
    const excludeFieldCategory = normalizeExportFieldFilter(query.exclude_field_category, INTEGER_LIST_FILTER);
    const rawFieldHazardLevel = query.field_hazard_level || query.hazard_level;
    const fieldHazardLevel = normalizeExportFieldFilter(rawFieldHazardLevel, HAZARD_LEVEL_FILTER);
    const fieldFacility = normalizeExportFieldFilter(query.field_facility, TOKEN_LIST_FILTER);
    const fieldDistrict = normalizeExportFieldFilter(query.field_district, INTEGER_LIST_FILTER);
    const fieldSublocality = normalizeExportFieldFilter(query.field_sublocality, INTEGER_LIST_FILTER);
    const groupFilter = query.group_filter ? String(query.group_filter) : undefined;
    const groupId = normalizeExportFieldFilter(query.group_id, INTEGER_LIST_FILTER);
    const orgGroupIds = normalizeExportFieldFilter(query.org_group_ids, INTEGER_LIST_FILTER, 2048);

    // Pre-auth limiter is intentionally IP-keyed. A fake SESS/SSESS cookie is
    // attacker-controlled until auth/status confirms it, so it must not create
    // a fresh rate-limit bucket before backend auth work runs.
    const preAuthRateResult = checkExportRateLimit(event, PRE_AUTH_RATE_LIMIT_PER_MINUTE, { strategy: 'ip' });
    if (!preAuthRateResult.allowed) {
        event.node.res.statusCode = 429;
        setResponseHeader(event, 'Content-Type', 'application/json');
        setResponseHeader(event, 'Retry-After', preAuthRateResult.retryAfterSeconds);
        return {
            error: 'export_rate_limited',
            retryAfterSeconds: preAuthRateResult.retryAfterSeconds,
        };
    }

    // Build backend base URL (internal Docker network for SSR)
    const apiBase = config.public.apiBase || config.public.geoReportApiBase;
    const baseUrl = String(apiBase).replace(/\/+$/, '');

    // Determine auth: session cookie or API key
    const hasSession = hasDrupalSessionCookie(event);

    const requestCookie = event.node.req.headers.cookie || undefined;
    const canonicalHost = getCanonicalHost(event.node.req.headers.host);

    // When using session auth, Drupal's REST endpoints require a valid
    // X-CSRF-Token header (even for GET requests on routes with
    // _csrf_request_header_token). Fetch one from Drupal's /session/token
    // endpoint using the forwarded session cookie.
    let csrfToken = '';
    let userRoles: string[] = [];
    let userGroups: AuthStatusGroup[] = [];
    let userUid = '';
    let authStatusFallback = false;
    const sharedFetchAgent = buildFetchAgent(config);
    if (hasSession) {
        const sharedHeaders = { cookie: event.node.req.headers.cookie || '' };
        try {
            const token = await $fetch<string>(`${baseUrl}/session/token`, {
                headers: buildExportForwardHeaders(requestCookie, '', canonicalHost),
                agent: sharedFetchAgent,
                timeout: 5000,
            });
            csrfToken = token || '';
        } catch (e) {
            console.warn('[requests-csv] Failed to fetch CSRF token, continuing with session cookie:', e instanceof Error ? e.message : e);
        }

        try {
            const authStatus = await event.$fetch<unknown>('/api/auth/status', {
                headers: sharedHeaders,
                timeout: 5000,
            });
            if (isValidAuthStatusResponse(authStatus)) {
                userRoles = extractRoles(authStatus);
                if (String(authStatus.user?.uid ?? '') === '1' && !userRoles.includes('administrator')) {
                    userRoles.push('administrator');
                }
                userGroups = Array.isArray(authStatus.user?.groups) ? authStatus.user.groups : [];
                userUid = String(authStatus.user?.uid ?? '');
            } else {
                authStatusFallback = true;
                console.error('[requests-csv] auth/status returned invalid shape, falling back to anonymous tier');
            }
        }
        catch (e) {
            authStatusFallback = true;
            // Use error level (not warn) so transient Drupal outages are
            // visible in monitoring. A failure here silently downgrades the
            // user to the anonymous tier.
            console.error('[requests-csv] Failed to fetch CSRF token / auth status:', e instanceof Error ? e.message : e);
        }
    }

    // Resolve export tier from user's Drupal roles. Unauthenticated users
    // and users whose auth/status call failed fall into the 'anonymous' tier.
    const { limit: tierLimit, tier } = resolveExportTier(userRoles);

    // Surface the fallback via a response header so the frontend can show
    // "tier check failed" instead of silently capping at 1000 rows.
    if (authStatusFallback) {
        setResponseHeader(event, 'X-Export-Tier-Fallback', 'auth_status_failed');
        // Structured-log the fallback as a warning so monitoring catches it
        // even when the response headers are not collected (the upstream
        // error log already records the underlying cause).
        console.warn('[requests-csv] auth/status fallback active — export proceeds at anonymous tier', {
            timestamp: new Date().toISOString(),
        });
    }

    // Build request headers (forward session cookie + CSRF token when available).
    // Keep this aligned with server/api/[...path].ts: Drupal derives the session
    // cookie name from the forwarded host/proto. Without these headers, direct
    // export fetches silently lose the authenticated session and private field
    // access falls back to Drupal's anonymous surface.
    const buildHeaders = (): Record<string, string> => {
        return buildExportForwardHeaders(requestCookie, csrfToken, canonicalHost);
    };

    // AbortController for cancelling upstream fetches on client disconnect
    const abortController = new AbortController();
    event.node.req.on('close', () => { abortController.abort(); });

    const localFetch = event.$fetch as unknown as LocalFetcher;
    const fetchJsonApiWithSession: JsonApiFetcher = (path, timeout = 15000) =>
        localFetch(`/api${path}`, {
            headers: { ...buildHeaders(), 'Accept-Language': locale },
            timeout,
        });

    try {
        if (!hasSession || authStatusFallback || userRoles.length === 0) {
            event.node.res.statusCode = 401;
            setResponseHeader(event, 'Content-Type', 'application/json');
            return {
                error: 'export_auth_required',
                message: 'Please log in again.',
            };
        }

        // Authenticated limiter is keyed by verified Drupal uid when possible.
        // This preserves per-user export limits for shared office IPs while the
        // pre-auth IP bucket above absorbs fake-cookie floods.
        const rateResult = checkExportRateLimit(event, RATE_LIMIT_PER_MINUTE, {
            key: userUid ? `user:${userUid}` : undefined,
        });
        if (!rateResult.allowed) {
            event.node.res.statusCode = 429;
            setResponseHeader(event, 'Content-Type', 'application/json');
            setResponseHeader(event, 'Retry-After', rateResult.retryAfterSeconds);
            return {
                error: 'export_rate_limited',
                retryAfterSeconds: rateResult.retryAfterSeconds,
            };
        }

        const exportJurisdictionScope = await resolveExportJurisdictionScope(jurisdictionId, slug, localFetch);
        const jurisdictionAccess = resolveAuthorizedExportJurisdictionScope(
            exportJurisdictionScope.requestJurisdictionIds,
            userGroups,
            userRoles
        );
        if (!jurisdictionAccess.allowed) {
            event.node.res.statusCode = 403;
            setResponseHeader(event, 'Content-Type', 'application/json');
            return {
                error: 'export_jurisdiction_forbidden',
                message: 'You do not have access to export this jurisdiction.',
            };
        }

        const scopedJurisdictionIds = jurisdictionAccess.authorizedJurisdictionIds;
        const scopedTaxonomyJurisdictionIds = exportJurisdictionScope.taxonomyJurisdictionIds;

        // Step 1: Resolve attribute columns from service definitions (no request data needed)
        const resolutionCtx = await fetchAttributeResolutionContext(
            scopedTaxonomyJurisdictionIds.join(',') || jurisdictionId,
            fetchJsonApiWithSession
        );
        const attributeKeys = resolutionCtx.orderedCodes;
        const exportFieldSelection = buildExportFieldSelection(resolutionCtx);

        const scopedOrgGroupIds = resolveScopedExportOrgGroupIds({
            groupId,
            groupFilter,
            requestedOrgGroupIds: normalizeExportFilterValues(orgGroupIds),
            userRoles,
            userGroups,
        });

        // Resolve management form-mode before fetching rows so JSON:API only
        // requests optional relationships that the tenant actually exposes.
        // Full-tier exports additionally use it for staff-only field labels.
        const managementFieldColumnContext = await fetchManagementFieldColumnContext(localFetch, buildHeaders());
        const jsonApiExportFieldOptions = resolveJsonApiExportFieldOptions(
            managementFieldColumnContext.visibleFieldKeys
        );

        // Fetch a single batch from Drupal JSON:API through the local Nuxt
        // proxy. The proxy is the jurisdiction and private-field guard for
        // management reads, so the export does not bypass dashboard access.
        const fetchBatch = async (
            offset: number,
            safeManagementRelationshipFields: readonly string[] = []
        ): Promise<GeoreportResponse> => {
            const params = buildJsonApiExportParams({
                limit: JSONAPI_EXPORT_BATCH_SIZE,
                offset,
                sort,
                jurisdictionIds: scopedJurisdictionIds,
                status,
                excludeStatus,
                serviceCode,
                excludeServiceCode,
                dateFrom,
                dateTo,
                search,
                fieldStatus,
                excludeFieldStatus,
                fieldCategory,
                excludeFieldCategory,
                fieldHazardLevel,
                fieldFacility,
                fieldDistrict,
                fieldSublocality,
                orgGroupIds: scopedOrgGroupIds,
                fullTier: tier === 'full',
                managementRelationshipFields: safeManagementRelationshipFields,
                fieldOptions: jsonApiExportFieldOptions,
            });
            const response = await fetchJsonApiWithSession<JsonApiCollectionResponse>(
                `/jsonapi/node/service_request?${params.toString()}`,
                30000
            );
            const included = response.included || [];
            const data = response.data || [];
            return {
                requests: data.map(resource => transformJsonApiRequestForExport(resource, included)),
                meta: { total: response.meta?.count },
                exposedRelationshipFields: collectExposedManagementRelationshipFields(
                    data,
                    managementFieldColumnContext.relationshipFieldKeys
                ),
            };
        };

        // Step 2: Fetch first batch with meta
        let firstBatch = await fetchBatch(0);
        const safeManagementRelationshipFields = firstBatch.exposedRelationshipFields || [];
        if (tier === 'full' && safeManagementRelationshipFields.length > 0) {
            firstBatch = await fetchBatch(0, safeManagementRelationshipFields);
        }
        const total = firstBatch.meta?.total ?? firstBatch.requests?.length ?? 0;

        // Resolve the generic complete-entity columns for the full tier from
        // Drupal's management form-mode contract first, then the first batch
        // as a fallback for fields that are readable but not on the form.
        const drupalFieldColumns = resolveDrupalFieldColumns(
            firstBatch.requests || [],
            tier,
            managementFieldColumnContext.orderedFieldKeys
        );

        // Step 3: Enforce role-based export limit.
        // Full access tiers (administrator/editorial_board) get the global cap.
        // Lower tiers get progressively smaller limits to protect the backend
        // from expensive exports by less privileged users.
        //
        // The 413 body contains only structured fields so the client can
        // localise the message. We omit `total` here: exposing exact dataset
        // sizes lets an attacker enumerate counts by probing filter combos.
        if (total > tierLimit) {
            event.node.res.statusCode = 413;
            setResponseHeader(event, 'Content-Type', 'application/json');
            return {
                error: 'export_limit_exceeded',
                tier,
                limit: tierLimit,
            };
        }

        if (abortController.signal.aborted) {
            event.node.res.statusCode = 499;
            event.node.res.end();
            return;
        }

        // The authorization gate above fails closed for any forbidden requested
        // jurisdiction. Keep these raw request IDs aligned with that invariant;
        // do not change to partial-allow without re-scoping status attributes too.
        let includeInternalStatusAttributes = hasSession &&
            canExportInternalStatusAttributes(userRoles, userGroups, exportJurisdictionScope.requestJurisdictionIds);
        let statusAttributeContext: StatusAttributeResolutionContext = {
            definitionsByStatusId: new Map(),
            mediaNames: new Map(),
            loaded: false,
        };
        if (includeInternalStatusAttributes) {
            statusAttributeContext = await fetchStatusAttributeResolutionContext(
                exportJurisdictionScope.taxonomyJurisdictionIds,
                fetchJsonApiWithSession
            );
        }
        const enrichBatchWithInternalStatusAttributes = async (requests: GeoreportRequest[]): Promise<GeoreportRequest[]> => {
            if (!includeInternalStatusAttributes || !statusAttributeContext.loaded) return requests;
            const details = await fetchStatusAttributesForRequests(
                requests,
                statusAttributeContext,
                exportJurisdictionScope.requestJurisdictionIds,
                fetchJsonApiWithSession
            );
            return enrichRequestsWithStatusAttributes(requests, details);
        };

        // Step 4: Write response headers + CSV header row
        const dateStr = new Date().toISOString().split('T')[0];
        const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
        setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
        setResponseHeader(event, 'Content-Disposition', `attachment; filename="requests-${safeSlug}-${dateStr}.csv"`);
        setResponseHeader(event, 'Cache-Control', 'private, no-store, max-age=0');
        setResponseHeader(event, 'Pragma', 'no-cache');
        setResponseHeader(event, 'Expires', '0');
        setResponseHeader(event, 'X-Export-Total', String(total));

        const res = event.node.res;

        // Derive status-attribute column set from the resolution context.
        // statusAttributeContext is only populated when includeInternalStatusAttributes
        // is true (staff gate above), so non-staff always get codes: [].
        const { codes: statusAttributeCodes, labels: statusAttributeLabels } =
            deriveStatusAttributeColumns(statusAttributeContext);

        // Fixed header columns (superset of client-side getCsvColumns)
        const fixedHeaders = buildFixedExportHeaders(exportFieldSelection.includeOrganisationColumn);
        const allHeaders = buildExportHeaders(
            fixedHeaders,
            drupalFieldColumns,
            managementFieldColumnContext.labels,
            attributeKeys,
            resolutionCtx.labels,
            statusAttributeCodes,
            statusAttributeLabels
        );
        const headerRow = allHeaders.map(h => escapeCsvValue(h, delimiter)).join(delimiter);

        // Write BOM + header
        await writeAndDrain(res, '\uFEFF' + headerRow + '\r\n');

        // Step 5: Stream rows batch by batch (O(BATCH_SIZE) memory instead of O(total))
        const firstRequests = await enrichBatchWithInternalStatusAttributes(firstBatch.requests || []);
        for (const req of firstRequests) {
            const drupalFieldValueResolvers = buildDrupalFieldValueResolvers(
                managementFieldColumnContext.valueResolvers,
                exportJurisdictionScope.facilityLabelsByJurisdiction,
                req
            );
            await writeAndDrain(res, formatExportRow(req, attributeKeys, delimiter, resolutionCtx, exportFieldSelection.includeOrganisationColumn, drupalFieldColumns, drupalFieldValueResolvers, statusAttributeCodes) + '\r\n');
        }

        let offset = nextExportOffset(0, firstRequests.length);
        while (offset < total && !abortController.signal.aborted) {
            const batch = await fetchBatch(offset, safeManagementRelationshipFields);

            const requests = await enrichBatchWithInternalStatusAttributes(batch.requests || []);
            if (requests.length === 0) break;
            for (const req of requests) {
                const drupalFieldValueResolvers = buildDrupalFieldValueResolvers(
                    managementFieldColumnContext.valueResolvers,
                    exportJurisdictionScope.facilityLabelsByJurisdiction,
                    req
                );
                await writeAndDrain(res, formatExportRow(req, attributeKeys, delimiter, resolutionCtx, exportFieldSelection.includeOrganisationColumn, drupalFieldColumns, drupalFieldValueResolvers, statusAttributeCodes) + '\r\n');
            }
            offset = nextExportOffset(offset, requests.length);
        }

        // Audit trail: a full-tier export surfaces the complete service
        // request entity incl. citizen PII — record who exported what
        // (GDPR Art. 30 records of processing, GoBD audit chain).
        // `roles` is the value that drove the tier decision, kept here so a
        // later "why was this export allowed?" question can be answered
        // without replaying the auth/status call. `authStatusFallback` is
        // surfaced so an export at the anonymous tier driven by a transient
        // outage is distinguishable from a genuinely anonymous one.
        console.info('[requests-csv] Export completed', {
            uid: userUid || 'anonymous',
            tier,
            roles: userRoles,
            authStatusFallback,
            jurisdiction: jurisdictionId || null,
            rows: total,
            completeEntity: drupalFieldColumns.length > 0,
            timestamp: new Date().toISOString(),
        });

        res.end();
        return;
    }
    catch (err) {
        if (abortController.signal.aborted) {
            if (!event.node.res.headersSent) {
                event.node.res.statusCode = 499;
            }
            event.node.res.end();
            return;
        }

        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[requests-csv.get.ts] Export failed:', message);

        if (!event.node.res.headersSent) {
            setResponseHeader(event, 'Content-Type', 'text/plain');
            event.node.res.statusCode = 500;
            return 'CSV export failed. Please try again.';
        }
        event.node.res.write(`\r\n# ERROR: Export incomplete. Please retry.\r\n`);
        event.node.res.end();
        return;
    }
});
