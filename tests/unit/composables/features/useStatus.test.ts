/**
 * Unit Tests for useStatus Composable
 *
 * Tests jurisdiction-scoped service_status loading.
 *
 * @see /app/composables/features/useStatus.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computed, effectScope, ref, type EffectScope } from 'vue';
import { clearMockState, mockUseState } from '../../__mocks__/nuxt';
import { useStatus } from '@/composables/features/useStatus';

// ============================================================================
// Mock Dependencies
// ============================================================================

const mockGet = vi.fn();

vi.mock('~/composables/api/useApiClient', () => ({
    useApiClient: () => ({
        get: mockGet
    })
}));

const mockCurrentJurisdictionId = ref<string>('');
const mockTaxonomyJurisdictionId = ref<number | null>(null);
const mockJurisdiction = ref<{ id?: number, slug?: string } | null>(null);
const mockLocale = ref('de');
let scope: EffectScope | null = null;

globalThis.useMarkASpotConfig = () => ({
    currentJurisdictionId: computed(() => mockCurrentJurisdictionId.value),
    taxonomyJurisdictionId: computed(() => mockTaxonomyJurisdictionId.value),
    jurisdiction: computed(() => mockJurisdiction.value),
    features: computed(() => ({})),
    config: computed(() => null),
    isReady: computed(() => true),
    isPending: computed(() => false),
    error: computed(() => null),
    client: computed(() => null),
    theme: computed(() => null),
    ui: computed(() => null),
    media: computed(() => null),
    fetchConfig: vi.fn(),
    clearCache: vi.fn()
});

globalThis.useI18n = () => ({
    locale: mockLocale,
    t: (key: string) => key
});

// ============================================================================
// Tests
// ============================================================================

beforeEach(() => {
    scope?.stop();
    scope = null;
    clearMockState();
    mockGet.mockReset();
    mockCurrentJurisdictionId.value = '';
    mockTaxonomyJurisdictionId.value = null;
    mockJurisdiction.value = null;
    mockLocale.value = 'de';
});

afterEach(() => {
    scope?.stop();
    scope = null;
});

const scopedUseStatus = () => {
    scope = effectScope();
    const status = scope.run(() => useStatus());
    if (!status) {
        throw new Error('Failed to initialize useStatus in effect scope');
    }
    return status;
};

describe('useStatus', () => {
    it('waits for numeric jurisdiction config when the current jurisdiction is a slug', async () => {
        mockCurrentJurisdictionId.value = 'bleckede';

        const { fetchStatus, statusItems } = scopedUseStatus();

        const result = await fetchStatus();

        expect(mockGet).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
    });

    it('waits instead of fetching unscoped when no jurisdiction is resolved', async () => {
        const { fetchStatus, statusItems } = scopedUseStatus();

        const result = await fetchStatus();

        expect(mockGet).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
    });

    it('does not request the staff-only field_status_definition on the public path', async () => {
        // field_status_definition carries internal process attributes and must
        // never be requested by the citizen-facing composable. Definitions are
        // sourced from the dashboard-scoped useSettingsStatuses() instead.
        mockCurrentJurisdictionId.value = 'bleckede';
        mockJurisdiction.value = { id: 1, slug: 'bleckede' };
        mockGet.mockResolvedValueOnce({
            data: [],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        const { fetchStatus } = scopedUseStatus();

        await fetchStatus();

        expect(mockGet).toHaveBeenCalledTimes(1);
        const [, params] = mockGet.mock.calls[0];
        expect(params['fields[taxonomy_term--service_status]']).not.toContain('field_status_definition');
    });

    it('uses jurisdiction.id as numeric JSON:API taxonomy filter for slug routes', async () => {
        mockCurrentJurisdictionId.value = 'bleckede';
        mockJurisdiction.value = { id: 1, slug: 'bleckede' };
        mockGet.mockResolvedValueOnce({
            data: [
                {
                    id: 'status-uuid-1',
                    type: 'taxonomy_term--service_status',
                    attributes: {
                        drupal_internal__tid: 3,
                        name: 'Gemeldet',
                        weight: 0,
                        field_status_hex: '#E74C3C',
                        field_status_icon: 'i-lucide-hand'
                    },
                    links: { self: '/status-uuid-1' }
                }
            ],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        const { fetchStatus, statusItems } = scopedUseStatus();

        await fetchStatus();

        expect(mockGet).toHaveBeenCalledWith(
            '/jsonapi/taxonomy_term/service_status',
            expect.objectContaining({
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': '1'
            })
        );
        expect(statusItems.value).toHaveLength(1);
        expect(statusItems.value[0].attributes.name).toBe('Gemeldet');
    });

    it('waits for matching config before using a numeric jurisdiction route', async () => {
        mockCurrentJurisdictionId.value = '2';

        const { fetchStatus, statusItems } = scopedUseStatus();

        const result = await fetchStatus();

        expect(mockGet).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
    });

    it('uses matching numeric config as JSON:API taxonomy filter', async () => {
        mockCurrentJurisdictionId.value = '2';
        mockJurisdiction.value = { id: 2, slug: 'tenant-b' };
        mockGet.mockResolvedValueOnce({
            data: [],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        const { fetchStatus } = scopedUseStatus();

        await fetchStatus();

        expect(mockGet).toHaveBeenCalledWith(
            '/jsonapi/taxonomy_term/service_status',
            expect.objectContaining({
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': '2'
            })
        );
    });

    it('waits instead of using stale config for a numeric jurisdiction switch', async () => {
        mockCurrentJurisdictionId.value = '2';
        mockJurisdiction.value = { id: 1, slug: 'tenant-a' };
        mockTaxonomyJurisdictionId.value = 1;

        const { fetchStatus, statusItems } = scopedUseStatus();

        const result = await fetchStatus();

        expect(mockGet).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
    });

    it('prefers taxonomyJurisdictionId for inherited status catalogs', async () => {
        mockCurrentJurisdictionId.value = 'child-slug';
        mockJurisdiction.value = { id: 9, slug: 'child-slug' };
        mockTaxonomyJurisdictionId.value = 1;
        mockGet.mockResolvedValueOnce({
            data: [
                {
                    id: 'root-status-uuid-1',
                    type: 'taxonomy_term--service_status',
                    attributes: {
                        drupal_internal__tid: 3,
                        name: 'Gemeldet',
                        weight: 0,
                        field_status_hex: '#E74C3C',
                        field_status_icon: 'i-lucide-hand'
                    },
                    links: { self: '/root-status-uuid-1' }
                }
            ],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        const { fetchStatus } = scopedUseStatus();

        await fetchStatus();

        expect(mockGet).toHaveBeenCalledWith(
            '/jsonapi/taxonomy_term/service_status',
            expect.objectContaining({
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': '1'
            })
        );
    });

    it('does not retry without jurisdiction filter when the scoped status list is empty', async () => {
        mockCurrentJurisdictionId.value = 'bleckede';
        mockJurisdiction.value = { id: 1, slug: 'bleckede' };
        mockGet.mockResolvedValueOnce({
            data: [],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        const { fetchStatus, statusItems } = scopedUseStatus();

        const result = await fetchStatus();

        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledWith(
            '/jsonapi/taxonomy_term/service_status',
            expect.objectContaining({
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': '1'
            })
        );
    });

    it('clears stale statuses and waits when slug routes have mismatched config', async () => {
        mockCurrentJurisdictionId.value = 'tenant-a';
        mockJurisdiction.value = { id: 1, slug: 'tenant-a' };
        mockGet.mockResolvedValueOnce({
            data: [
                {
                    id: 'tenant-a-status-uuid',
                    type: 'taxonomy_term--service_status',
                    attributes: {
                        drupal_internal__tid: 3,
                        name: 'Gemeldet',
                        weight: 0,
                        field_status_hex: '#E74C3C',
                        field_status_icon: 'i-lucide-hand'
                    },
                    links: { self: '/tenant-a-status-uuid' }
                }
            ],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        const { fetchStatus, statusItems } = scopedUseStatus();

        await fetchStatus();
        expect(statusItems.value).toHaveLength(1);

        mockGet.mockClear();
        mockCurrentJurisdictionId.value = 'tenant-b';

        const result = await fetchStatus(true);

        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
        expect(mockGet).not.toHaveBeenCalled();
    });

    it('refuses to fetch when current jurisdiction is empty even if config is populated', async () => {
        // Regression guard: a stale config from a previous tenant must not
        // become the JSON:API filter on root `/` when no route slug, query,
        // ENV, or default jurisdiction can be resolved.
        mockCurrentJurisdictionId.value = '';
        mockJurisdiction.value = { id: 5, slug: 'rotterdam' };
        mockTaxonomyJurisdictionId.value = 5;

        const { fetchStatus, statusItems } = scopedUseStatus();

        const result = await fetchStatus();

        expect(mockGet).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
    });

    it('uses the SSR jurisdiction key for single-tenant root dashboard routes', async () => {
        // Single-tenant deployments keep dashboard URLs unprefixed. If the route
        // resolver sees a static segment instead of the tenant slug, the SSR key
        // is the authoritative tenant proof.
        mockCurrentJurisdictionId.value = 'dashboard';
        mockJurisdiction.value = { id: 1, slug: 'bleckede' };
        mockTaxonomyJurisdictionId.value = 1;
        mockUseState<string>('mas-config-jurisdiction-key', () => '').value = 'bleckede';
        mockUseState<boolean>('jurisdiction-single-tenant', () => false).value = true;
        mockGet.mockResolvedValueOnce({
            data: [],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        const { fetchStatus } = scopedUseStatus();

        await fetchStatus();

        expect(mockGet).toHaveBeenCalledWith(
            '/jsonapi/taxonomy_term/service_status',
            expect.objectContaining({
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': '1'
            })
        );
    });

    it('does not use the SSR jurisdiction key for multi-tenant route mismatches', async () => {
        mockCurrentJurisdictionId.value = 'tenant-b';
        mockJurisdiction.value = { id: 1, slug: 'tenant-a' };
        mockTaxonomyJurisdictionId.value = 1;
        mockUseState<string>('mas-config-jurisdiction-key', () => '').value = 'tenant-a';

        const { fetchStatus, statusItems } = scopedUseStatus();

        const result = await fetchStatus();

        expect(mockGet).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
    });

    it('does not let single-tenant SSR state override an explicit different tenant route', async () => {
        mockCurrentJurisdictionId.value = 'tenant-b';
        mockJurisdiction.value = { id: 1, slug: 'tenant-a' };
        mockTaxonomyJurisdictionId.value = 1;
        mockUseState<string>('mas-config-jurisdiction-key', () => '').value = 'tenant-a';
        mockUseState<boolean>('jurisdiction-single-tenant', () => false).value = true;

        const { fetchStatus, statusItems } = scopedUseStatus();

        const result = await fetchStatus();

        expect(mockGet).not.toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(statusItems.value).toEqual([]);
    });

    it('fetches when the single-tenant SSR key hydrates after the composable is mounted', async () => {
        mockCurrentJurisdictionId.value = 'dashboard';
        mockJurisdiction.value = { id: 1, slug: 'bleckede' };
        mockTaxonomyJurisdictionId.value = 1;
        mockGet.mockResolvedValue({
            data: [],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        scopedUseStatus();

        mockUseState<boolean>('jurisdiction-single-tenant', () => false).value = true;
        mockUseState<string>('mas-config-jurisdiction-key', () => '').value = 'bleckede';

        await new Promise(resolve => setTimeout(resolve, 0));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledWith(
            '/jsonapi/taxonomy_term/service_status',
            expect.objectContaining({
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': '1'
            })
        );
    });

    it('issues a single fetch when slug and config arrive together via watcher', async () => {
        // Locale and jurisdiction watchers must not double-fetch when a tenant
        // resolves from empty: only the jurisdiction watcher should fire here.
        mockGet.mockResolvedValue({
            data: [],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        scopedUseStatus();

        mockCurrentJurisdictionId.value = 'tenant-a';
        mockJurisdiction.value = { id: 1, slug: 'tenant-a' };

        await new Promise(resolve => setTimeout(resolve, 0));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledWith(
            '/jsonapi/taxonomy_term/service_status',
            expect.objectContaining({
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': '1'
            })
        );
    });

    it('does not allow pending requests to repopulate after slug config becomes unresolved', async () => {
        let resolveTenantA: (value: unknown) => void = () => {};
        mockCurrentJurisdictionId.value = 'tenant-a';
        mockJurisdiction.value = { id: 1, slug: 'tenant-a' };
        mockGet.mockReturnValueOnce(new Promise((resolve) => {
            resolveTenantA = resolve;
        }));

        const { fetchStatus, statusItems, loading } = scopedUseStatus();

        const tenantAFetch = fetchStatus();
        expect(loading.value).toBe(true);
        mockCurrentJurisdictionId.value = 'tenant-b';

        const unresolvedResult = await fetchStatus(true);

        expect(unresolvedResult).toEqual([]);
        expect(statusItems.value).toEqual([]);
        expect(loading.value).toBe(false);

        resolveTenantA({
            data: [
                {
                    id: 'tenant-a-status-uuid',
                    type: 'taxonomy_term--service_status',
                    attributes: {
                        drupal_internal__tid: 3,
                        name: 'Gemeldet',
                        weight: 0,
                        field_status_hex: '#E74C3C',
                        field_status_icon: 'i-lucide-hand'
                    },
                    links: { self: '/tenant-a-status-uuid' }
                }
            ],
            links: { self: '/jsonapi/taxonomy_term/service_status' }
        });

        const staleResult = await tenantAFetch;

        expect(staleResult).toEqual([]);
        expect(statusItems.value).toEqual([]);
        expect(loading.value).toBe(false);
    });
});
