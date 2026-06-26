/**
 * Unit Tests for useCategories Composable
 *
 * Tests jurisdiction-scoped service_category loading, localStorage caching,
 * the fetch-generation guard, concurrent-request dedup, offline fallback,
 * the FastMap slug path and the categoryOptions hierarchy builder.
 *
 * @see /app/composables/features/useCategories.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, computed, effectScope, type EffectScope } from 'vue';
import { clearMockState, mockIsOnline } from '../../__mocks__/nuxt';
import { useCategories } from '@/composables/features/useCategories';

// ============================================================================
// Mock Dependencies
// ============================================================================

// useApiClient mock - register on globalThis since Nuxt auto-imports it
const mockGet = vi.fn();
globalThis.useApiClient = () => ({
    get: mockGet,
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
});

// useI18n mock - controllable locale
const mockLocale = ref('de');
globalThis.useI18n = () => ({
    locale: mockLocale,
    t: (key: string) => key
});

// useMarkASpotConfig mock - controllable jurisdiction + services allow-list
const mockCurrentJurisdictionId = ref<string>('');
const mockTaxonomyJurisdictionId = ref<number | null>(null);
const mockJurisdiction = ref<{ id?: number, slug?: string } | null>(null);
const mockServices = ref<{ tid: number }[]>([]);
globalThis.useMarkASpotConfig = () => ({
    currentJurisdictionId: computed(() => mockCurrentJurisdictionId.value),
    taxonomyJurisdictionId: computed(() => mockTaxonomyJurisdictionId.value),
    jurisdiction: computed(() => mockJurisdiction.value),
    services: computed(() => mockServices.value),
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

// useRuntimeConfig mock - controllable fastmap flag
const mockIsFastmap = ref(false);
globalThis.useRuntimeConfig = () => ({
    public: {
        fastmap: mockIsFastmap.value
    }
});

// ============================================================================
// Test Data
// ============================================================================

interface MockCategoryOverrides {
    id?: string
    tid?: number
    name?: string
    weight?: number
    parentId?: string | null
}

const makeCategory = (overrides: MockCategoryOverrides = {}) => {
    const { id, tid, name, weight, parentId } = {
        id: 'cat-uuid-1',
        tid: 10,
        name: 'Roads',
        weight: 0,
        parentId: null,
        ...overrides
    };

    return {
        id,
        type: 'taxonomy_term--service_category',
        attributes: {
            drupal_internal__tid: tid,
            name,
            weight,
            field_service_code: `S${tid}`
        },
        relationships: {
            parent: {
                data: parentId ? [{ id: parentId, type: 'taxonomy_term--service_category' }] : []
            }
        },
        links: { self: `/${id}` }
    };
};

const singleCategoryResponse = {
    data: [makeCategory()],
    links: { self: '/jsonapi/taxonomy_term/service_category' }
};

const emptyResponse = {
    data: [],
    links: { self: '/jsonapi/taxonomy_term/service_category' }
};

// ============================================================================
// Effect-scope harness
// ============================================================================

let scope: EffectScope | null = null;

const scopedUseCategories = (
    ...args: Parameters<typeof useCategories>
) => {
    scope = effectScope();
    const categories = scope.run(() => useCategories(...args));
    if (!categories) {
        throw new Error('Failed to initialize useCategories in effect scope');
    }
    return categories;
};

// Flush the microtask queue so module-level watchers settle.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

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
    mockServices.value = [];
    mockLocale.value = 'de';
    mockIsFastmap.value = false;
    mockIsOnline.value = true;
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    scope?.stop();
    scope = null;
    localStorage.clear();
});

describe('useCategories', () => {
    // ========================================================================
    // Public API: fetchCategories
    // ========================================================================
    describe('fetchCategories', () => {
        it('loads categories and exposes them through the categories ref', async () => {
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories, categories, loading, error } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledOnce();
            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/taxonomy_term/service_category',
                expect.objectContaining({ 'page[offset]': '0', 'page[limit]': '50' }),
                undefined
            );
            expect(categories.value).toHaveLength(1);
            expect(categories.value[0].attributes.name).toBe('Roads');
            expect(loading.value).toBe(false);
            expect(error.value).toBeNull();
        });

        it('returns the documented public API shape', () => {
            const api = scopedUseCategories();

            expect(Object.keys(api).sort()).toEqual(
                ['categories', 'categoryOptions', 'clearCache', 'error', 'fetchCategories', 'loading'].sort()
            );
            expect(typeof api.fetchCategories).toBe('function');
            expect(typeof api.clearCache).toBe('function');
        });

        it('adds the jurisdiction filter when jurisdiction.id is resolved', async () => {
            mockJurisdiction.value = { id: 7, slug: 'utrecht' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/taxonomy_term/service_category',
                expect.objectContaining({
                    'filter[field_jurisdiction.meta.drupal_internal__target_id]': '7'
                }),
                undefined
            );
        });

        it('prefers taxonomyJurisdictionId over jurisdiction.id for inherited catalogs', async () => {
            mockCurrentJurisdictionId.value = 'child-slug';
            mockJurisdiction.value = { id: 9, slug: 'child-slug' };
            mockTaxonomyJurisdictionId.value = 1;
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/taxonomy_term/service_category',
                expect.objectContaining({
                    'filter[field_jurisdiction.meta.drupal_internal__target_id]': '1'
                }),
                undefined
            );
        });

        it('fetches the second page only when the first page links to next', async () => {
            const firstPage = {
                data: [makeCategory({ id: 'p1', tid: 1, name: 'A' })],
                links: {
                    self: '/jsonapi/taxonomy_term/service_category',
                    next: { href: '/jsonapi/taxonomy_term/service_category?page[offset]=50' }
                }
            };
            const secondPage = {
                data: [makeCategory({ id: 'p2', tid: 2, name: 'B' })],
                links: { self: '/jsonapi/taxonomy_term/service_category' }
            };
            mockGet.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

            const { fetchCategories, categories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledTimes(2);
            expect(mockGet).toHaveBeenNthCalledWith(2,
                '/jsonapi/taxonomy_term/service_category',
                expect.objectContaining({ 'page[offset]': '50' }),
                undefined
            );
            expect(categories.value).toHaveLength(2);
        });

        it('does not fetch a second page when there is no next link', async () => {
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledTimes(1);
        });

        it('sets loading true while in flight and false after completion', async () => {
            let resolveGet!: (value: unknown) => void;
            mockGet.mockReturnValue(new Promise((resolve) => {
                resolveGet = resolve;
            }));

            const { fetchCategories, loading } = scopedUseCategories();
            const fetchPromise = fetchCategories();

            expect(loading.value).toBe(true);

            resolveGet(singleCategoryResponse);
            await fetchPromise;

            expect(loading.value).toBe(false);
        });

        it('skips a redundant fetch when the same jurisdiction and locale are already loaded', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();
            expect(mockGet).toHaveBeenCalledTimes(1);

            // Second call with unchanged jurisdiction+locale must be a no-op.
            await fetchCategories();
            expect(mockGet).toHaveBeenCalledTimes(1);
        });
    });

    // ========================================================================
    // Services allow-list filtering
    // ========================================================================
    describe('jurisdiction allow-list filtering', () => {
        it('filters fetched categories down to the configured services allow-list', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue({
                data: [
                    makeCategory({ id: 'a', tid: 10, name: 'Allowed' }),
                    makeCategory({ id: 'b', tid: 20, name: 'Blocked' }),
                    makeCategory({ id: 'c', tid: 30, name: 'AlsoBlocked' })
                ],
                links: { self: '/jsonapi/taxonomy_term/service_category' }
            });
            // Allow-list shorter than the fetched set triggers the filter branch.
            mockServices.value = [{ tid: 10 }];

            const { fetchCategories, categories } = scopedUseCategories();
            await fetchCategories();

            expect(categories.value).toHaveLength(1);
            expect(categories.value[0].attributes.name).toBe('Allowed');
        });

        it('keeps all categories when the allow-list is not shorter than the fetched set', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue({
                data: [makeCategory({ id: 'a', tid: 10 })],
                links: { self: '/jsonapi/taxonomy_term/service_category' }
            });
            mockServices.value = [{ tid: 10 }, { tid: 99 }];

            const { fetchCategories, categories } = scopedUseCategories();
            await fetchCategories();

            expect(categories.value).toHaveLength(1);
        });
    });

    // ========================================================================
    // Fetch-generation guard / concurrent dedup
    // ========================================================================
    describe('fetch-generation guard', () => {
        it('discards a stale in-flight fetch when the jurisdiction changes mid-flight', async () => {
            let resolveFirst!: (value: unknown) => void;
            mockGet.mockReturnValueOnce(new Promise((resolve) => {
                resolveFirst = resolve;
            }));

            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            const { fetchCategories, categories } = scopedUseCategories();
            const firstFetch = fetchCategories();

            // A newer fetch bumps fetchGeneration; the first result must be discarded.
            mockJurisdiction.value = { id: 5, slug: 'rotterdam' };
            mockGet.mockResolvedValueOnce({
                data: [makeCategory({ id: 'rotterdam-cat', tid: 50, name: 'Rotterdam' })],
                links: { self: '/jsonapi/taxonomy_term/service_category' }
            });
            await fetchCategories();

            // Now resolve the stale first fetch with a different payload.
            resolveFirst({
                data: [makeCategory({ id: 'amsterdam-cat', tid: 10, name: 'Amsterdam' })],
                links: { self: '/jsonapi/taxonomy_term/service_category' }
            });
            await firstFetch;

            // The newer (rotterdam) result wins; the stale one is dropped.
            expect(categories.value).toHaveLength(1);
            expect(categories.value[0].attributes.name).toBe('Rotterdam');
        });

        it('does not surface an error from a stale fetch generation', async () => {
            let rejectFirst!: (reason?: unknown) => void;
            mockGet.mockReturnValueOnce(new Promise((_resolve, reject) => {
                rejectFirst = reject;
            }));

            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            const { fetchCategories, error } = scopedUseCategories();
            const firstFetch = fetchCategories();

            mockJurisdiction.value = { id: 5, slug: 'rotterdam' };
            mockGet.mockResolvedValueOnce(singleCategoryResponse);
            await fetchCategories();

            rejectFirst(new Error('stale network failure'));
            await firstFetch;

            // The stale rejection must not overwrite the current (clean) error state.
            expect(error.value).toBeNull();
        });

        it('deduplicates concurrent fetches for the same locale and jurisdiction', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            let resolveGet!: (value: unknown) => void;
            mockGet.mockReturnValueOnce(new Promise((resolve) => {
                resolveGet = resolve;
            }));

            const { fetchCategories, categories } = scopedUseCategories();
            const firstFetch = fetchCategories();
            const secondFetch = fetchCategories();

            resolveGet(singleCategoryResponse);
            await Promise.all([firstFetch, secondFetch]);

            // Both calls share one in-flight request via pendingFetches.
            expect(mockGet).toHaveBeenCalledTimes(1);
            expect(categories.value).toHaveLength(1);
        });
    });

    // ========================================================================
    // Error handling
    // ========================================================================
    describe('error handling', () => {
        it('captures an Error message and stops loading on API failure', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockRejectedValue(new Error('Network down'));

            const { fetchCategories, error, loading } = scopedUseCategories();
            await fetchCategories();

            expect(error.value).toBe('Network down');
            expect(loading.value).toBe(false);
        });

        it('falls back to a generic message for non-Error rejections', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockRejectedValue('string failure');

            const { fetchCategories, error } = scopedUseCategories();
            await fetchCategories();

            expect(error.value).toBe('Failed to fetch categories');
        });
    });

    // ========================================================================
    // Offline fallback
    // ========================================================================
    describe('offline fallback', () => {
        it('reports categories unavailable when offline with no cache', async () => {
            mockIsOnline.value = false;
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };

            const { fetchCategories, error, loading, categories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).not.toHaveBeenCalled();
            expect(error.value).toBe('Categories unavailable offline');
            expect(loading.value).toBe(false);
            expect(categories.value).toEqual([]);
        });

        it('serves stale cached categories while offline', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };

            // Seed a stale-but-valid-locale cache entry directly.
            const storageKey = 'categories_de_jur1';
            localStorage.setItem(storageKey, JSON.stringify({
                data: [makeCategory({ id: 'cached', tid: 10, name: 'Cached Roads' })],
                timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day old -> expired
                version: '1.0.0',
                locale: 'de'
            }));

            mockIsOnline.value = false;

            const { fetchCategories, categories, loading } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).not.toHaveBeenCalled();
            expect(categories.value).toHaveLength(1);
            expect(categories.value[0].attributes.name).toBe('Cached Roads');
            expect(loading.value).toBe(false);
        });
    });

    // ========================================================================
    // localStorage caching
    // ========================================================================
    describe('localStorage caching', () => {
        it('writes a fresh cache entry after a successful fetch', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            const raw = localStorage.getItem('categories_de_jur1');
            expect(raw).not.toBeNull();
            const parsed = JSON.parse(raw as string);
            expect(parsed.data).toHaveLength(1);
            expect(parsed.locale).toBe('de');
            expect(parsed.version).toBe('1.0.0');
        });

        it('loads a fresh cache entry without hitting the API', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            localStorage.setItem('categories_de_jur1', JSON.stringify({
                data: [makeCategory({ id: 'fresh', tid: 10, name: 'Fresh Cache' })],
                timestamp: Date.now(),
                version: '1.0.0',
                locale: 'de'
            }));

            const { fetchCategories, categories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).not.toHaveBeenCalled();
            expect(categories.value).toHaveLength(1);
            expect(categories.value[0].attributes.name).toBe('Fresh Cache');
        });

        it('ignores a cache entry written for a different locale', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            // Cache stored under the German key but with an English locale stamp.
            localStorage.setItem('categories_de_jur1', JSON.stringify({
                data: [makeCategory({ id: 'wrong-locale', tid: 10 })],
                timestamp: Date.now(),
                version: '1.0.0',
                locale: 'en'
            }));
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            // Locale mismatch invalidates the cache -> a real fetch must happen.
            expect(mockGet).toHaveBeenCalledOnce();
        });

        it('clearCache removes the stored entry and empties categories', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories, clearCache, categories } = scopedUseCategories();
            await fetchCategories();
            expect(localStorage.getItem('categories_de_jur1')).not.toBeNull();

            clearCache();

            expect(localStorage.getItem('categories_de_jur1')).toBeNull();
            expect(categories.value).toEqual([]);
        });

        it('recovers from a corrupt cache entry by fetching fresh data', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            localStorage.setItem('categories_de_jur1', '{ not valid json');
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories, categories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledOnce();
            expect(categories.value).toHaveLength(1);
        });
    });

    // ========================================================================
    // FastMap slug path
    // ========================================================================
    describe('FastMap slug path', () => {
        it('uses the jurisdiction slug as the taxonomy filter when fastmap is enabled', async () => {
            mockIsFastmap.value = true;
            mockCurrentJurisdictionId.value = 'amsterdam';
            // jurisdiction.id is present but must be ignored in fastmap mode.
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/taxonomy_term/service_category',
                expect.objectContaining({
                    'filter[field_jurisdiction.meta.drupal_internal__target_id]': 'amsterdam'
                }),
                undefined
            );
        });

        it('caches fastmap results under a slug-scoped storage key', async () => {
            mockIsFastmap.value = true;
            mockCurrentJurisdictionId.value = 'rotterdam';
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            expect(localStorage.getItem('categories_de_jurrotterdam')).not.toBeNull();
        });

        it('still prefers an explicit taxonomyJurisdictionId override in fastmap mode', async () => {
            mockIsFastmap.value = true;
            mockCurrentJurisdictionId.value = 'child-slug';
            mockTaxonomyJurisdictionId.value = 1;
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/taxonomy_term/service_category',
                expect.objectContaining({
                    'filter[field_jurisdiction.meta.drupal_internal__target_id]': '1'
                }),
                undefined
            );
        });
    });

    // ========================================================================
    // locale override
    // ========================================================================
    describe('locale override', () => {
        it('sends translation headers when a locale override is supplied', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories(false, 'fr');
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/taxonomy_term/service_category',
                expect.any(Object),
                { headers: { 'X-Translation-Language': 'fr', 'Accept-Language': 'fr' } }
            );
        });

        it('omits request headers when no locale override is active', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();

            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/taxonomy_term/service_category',
                expect.any(Object),
                undefined
            );
        });
    });

    // ========================================================================
    // categoryOptions hierarchy builder
    // ========================================================================
    describe('categoryOptions', () => {
        it('returns an empty option list when there are no categories', () => {
            const { categoryOptions } = scopedUseCategories();
            expect(categoryOptions.value).toEqual([]);
        });

        it('builds flat options sorted by weight then name', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue({
                data: [
                    makeCategory({ id: 'b', tid: 2, name: 'Bravo', weight: 5 }),
                    makeCategory({ id: 'a', tid: 1, name: 'Alpha', weight: 1 }),
                    makeCategory({ id: 'c', tid: 3, name: 'Charlie', weight: 1 })
                ],
                links: { self: '/jsonapi/taxonomy_term/service_category' }
            });

            const { fetchCategories, categoryOptions } = scopedUseCategories();
            await fetchCategories();

            // weight 1 before weight 5; within equal weight, name order.
            expect(categoryOptions.value.map(o => o.label)).toEqual(['Alpha', 'Charlie', 'Bravo']);
        });

        it('disables parent categories when parent selection is not allowed', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue({
                data: [
                    makeCategory({ id: 'parent', tid: 1, name: 'Parent' }),
                    makeCategory({ id: 'child', tid: 2, name: 'Child', parentId: 'parent' })
                ],
                links: { self: '/jsonapi/taxonomy_term/service_category' }
            });

            const { fetchCategories, categoryOptions } = scopedUseCategories(false);
            await fetchCategories();

            const parent = categoryOptions.value.find(o => o.value === 'parent');
            const child = categoryOptions.value.find(o => o.value === 'child');
            expect(parent?.disabled).toBe(true);
            expect(child?.disabled).toBe(false);
            // Child is indented under its parent.
            expect(child?.label).toContain('Child');
            expect(child?.label).not.toBe('Child');
        });

        it('keeps parent categories selectable when parent selection is allowed', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue({
                data: [
                    makeCategory({ id: 'parent', tid: 1, name: 'Parent' }),
                    makeCategory({ id: 'child', tid: 2, name: 'Child', parentId: 'parent' })
                ],
                links: { self: '/jsonapi/taxonomy_term/service_category' }
            });

            const { fetchCategories, categoryOptions } = scopedUseCategories(ref(true));
            await fetchCategories();

            const parent = categoryOptions.value.find(o => o.value === 'parent');
            expect(parent?.disabled).toBe(false);
        });
    });

    // ========================================================================
    // Watchers
    // ========================================================================
    describe('reactive refetch', () => {
        it('refetches when the jurisdiction changes after mount', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            scopedUseCategories();
            await flush();
            mockGet.mockClear();

            mockJurisdiction.value = { id: 5, slug: 'rotterdam' };
            await flush();
            await flush();

            expect(mockGet).toHaveBeenCalled();
            expect(mockGet).toHaveBeenLastCalledWith(
                '/jsonapi/taxonomy_term/service_category',
                expect.objectContaining({
                    'filter[field_jurisdiction.meta.drupal_internal__target_id]': '5'
                }),
                undefined
            );
        });

        it('refetches when the locale changes after mount', async () => {
            mockJurisdiction.value = { id: 1, slug: 'amsterdam' };
            mockGet.mockResolvedValue(singleCategoryResponse);

            const { fetchCategories } = scopedUseCategories();
            await fetchCategories();
            mockGet.mockClear();

            mockLocale.value = 'en';
            await flush();
            await flush();

            expect(mockGet).toHaveBeenCalled();
        });
    });
});
