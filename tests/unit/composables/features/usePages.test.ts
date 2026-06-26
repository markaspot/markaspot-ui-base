/**
 * Unit Tests for usePages Composable
 *
 * Tests jurisdiction-filtered page fetching and sticky start page detection.
 *
 * @see /app/composables/features/usePages.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { clearMockState } from '../../__mocks__/nuxt';
import { usePages } from '@/composables/features/usePages';

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
const mockLocale = ref('en');
globalThis.useI18n = () => ({
    locale: mockLocale,
    t: (key: string) => key
});

// useMarkASpotConfig mock - controllable jurisdiction
const mockJurisdiction = ref<{ id?: number, slug?: string } | null>(null);
globalThis.useMarkASpotConfig = () => ({
    currentJurisdictionId: computed(() => mockJurisdiction.value?.slug ?? ''),
    features: computed(() => ({})),
    config: computed(() => null),
    isReady: computed(() => true),
    isPending: computed(() => false),
    error: computed(() => null),
    jurisdiction: computed(() => mockJurisdiction.value),
    taxonomyJurisdictionId: computed(() => null),
    client: computed(() => null),
    theme: computed(() => null),
    ui: computed(() => null),
    media: computed(() => null),
    fetchConfig: vi.fn(),
    clearCache: vi.fn()
});

// useJurisdictions mock - controllable getBySlug
const mockGetBySlug = vi.fn();
globalThis.useJurisdictions = () => ({
    getBySlug: mockGetBySlug,
    getById: vi.fn(),
    jurisdictions: computed(() => []),
    count: computed(() => 0),
    hasMultiple: computed(() => false),
    loaded: computed(() => true),
    loading: computed(() => false),
    error: computed(() => null),
    currentJurisdiction: computed(() => null),
    defaultJurisdiction: computed(() => null),
    currentSlugFromPath: computed(() => null),
    needsSlugRouting: computed(() => false),
    allSlugs: computed(() => []),
    fetchJurisdictions: vi.fn(),
    buildPath: (path: string) => path,
    stripJurisdictionPrefix: (path: string) => path
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

const mockPagesResponse = {
    data: [
        {
            id: 'uuid-1',
            type: 'node--page',
            attributes: {
                title: 'Welcome',
                body: { value: '<h2>Welcome</h2>', processed: '<h2>Welcome</h2>', format: 'full_html' },
                sticky: true,
                field_page_icon: 'i-lucide-home',
                drupal_internal__nid: 1
            }
        },
        {
            id: 'uuid-2',
            type: 'node--page',
            attributes: {
                title: 'About',
                body: { value: '<h2>About</h2>', processed: '<h2>About</h2>', format: 'full_html' },
                sticky: false,
                field_page_icon: 'i-lucide-info',
                drupal_internal__nid: 2
            }
        },
        {
            id: 'uuid-3',
            type: 'node--page',
            attributes: {
                title: 'Contact',
                body: { value: '<h2>Contact</h2>', processed: '<h2>Contact</h2>', format: 'full_html' },
                sticky: false,
                field_page_icon: 'i-lucide-mail',
                drupal_internal__nid: 3
            }
        }
    ]
};

const mockNoPagesResponse = {
    data: []
};

const mockNonStickyPagesResponse = {
    data: [
        {
            id: 'uuid-4',
            type: 'node--page',
            attributes: {
                title: 'FAQ',
                body: { value: '<h2>FAQ</h2>', processed: '<h2>FAQ</h2>', format: 'full_html' },
                sticky: false,
                field_page_icon: 'i-lucide-help-circle',
                drupal_internal__nid: 4
            }
        }
    ]
};

const mockSinglePageResponse = {
    data: {
        id: 'uuid-1',
        type: 'node--page',
        attributes: {
            title: 'Welcome',
            body: { value: '<h2>Welcome</h2>', processed: '<h2>Welcome</h2>', format: 'full_html' },
            sticky: true,
            field_page_icon: 'i-lucide-home',
            drupal_internal__nid: 1
        }
    }
};

// ============================================================================
// Tests
// ============================================================================

beforeEach(() => {
    clearMockState();
    mockGet.mockReset();
    mockGetBySlug.mockReset();
    mockJurisdiction.value = null;
    mockLocale.value = 'en';
    mockIsFastmap.value = false;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('usePages', () => {
    // ========================================================================
    // fetchPages
    // ========================================================================
    describe('fetchPages', () => {
        it('fetches pages from JSON:API', async () => {
            mockGet.mockResolvedValue(mockPagesResponse);

            const { fetchPages, pages } = usePages();
            await fetchPages();

            expect(mockGet).toHaveBeenCalledOnce();
            expect(mockGet).toHaveBeenCalledWith('/jsonapi/node/page?filter[promote]=1');
            expect(pages.value).toHaveLength(3);
            expect(pages.value[0].attributes?.title).toBe('Welcome');
        });

        it('adds jurisdiction filter when jurisdiction.id is available', async () => {
            mockJurisdiction.value = { id: 1, slug: 'paris' };
            mockGet.mockResolvedValue(mockPagesResponse);

            const { fetchPages } = usePages();
            await fetchPages();

            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/node/page?filter[promote]=1&filter[field_jurisdiction.meta.drupal_internal__target_id]=1'
            );
        });

        it('does not add jurisdiction filter when jurisdiction is null', async () => {
            mockJurisdiction.value = null;
            mockGet.mockResolvedValue(mockPagesResponse);

            const { fetchPages } = usePages();
            await fetchPages();

            expect(mockGet).toHaveBeenCalledWith('/jsonapi/node/page?filter[promote]=1');
        });

        it('sets loading state correctly', async () => {
            // Delay the mock resolution to observe loading state
            let resolveGet!: (value: any) => void;
            mockGet.mockReturnValue(new Promise((resolve) => {
                resolveGet = resolve;
            }));

            const { fetchPages, loading } = usePages();
            const fetchPromise = fetchPages();

            // Loading should be true while fetching
            expect(loading.value).toBe(true);

            // Resolve the API call
            resolveGet(mockPagesResponse);
            await fetchPromise;

            // Loading should be false after completion
            expect(loading.value).toBe(false);
        });

        it('handles API errors gracefully', async () => {
            mockGet.mockRejectedValue(new Error('Network error'));

            const { fetchPages, error, loading } = usePages();
            await fetchPages();

            expect(error.value).toBe('Network error');
            expect(loading.value).toBe(false);
            // Note: pages retains its previous value on error (composable does not clear it)
        });

        it('handles non-Error exceptions', async () => {
            mockGet.mockRejectedValue('string error');

            const { fetchPages, error } = usePages();
            await fetchPages();

            expect(error.value).toBe('Error loading pages');
        });

        it('clears previous error on new fetch', async () => {
            // First call fails
            mockGet.mockRejectedValueOnce(new Error('Network error'));
            const { fetchPages, error } = usePages();
            await fetchPages();
            expect(error.value).toBe('Network error');

            // Second call succeeds
            mockGet.mockResolvedValueOnce(mockPagesResponse);
            await fetchPages();
            expect(error.value).toBeNull();
        });
    });

    // ========================================================================
    // FastMap slug-validation guard (cross-tenant leak prevention)
    // ========================================================================

    describe('FastMap slug-validation guard', () => {
        it('returns empty pages without fetching when fastmap slug is unknown', async () => {
            mockIsFastmap.value = true;
            mockJurisdiction.value = { slug: 'partner' };
            mockGetBySlug.mockReturnValue(undefined);

            const { fetchPages, pages, loading } = usePages();
            await fetchPages();

            expect(mockGetBySlug).toHaveBeenCalledWith('partner');
            expect(mockGet).not.toHaveBeenCalled();
            expect(pages.value).toEqual([]);
            expect(loading.value).toBe(false);
        });

        it('applies the slug filter when fastmap slug is known', async () => {
            mockIsFastmap.value = true;
            mockJurisdiction.value = { slug: 'amsterdam' };
            mockGetBySlug.mockReturnValue({ id: 1, slug: 'amsterdam' });
            mockGet.mockResolvedValue(mockPagesResponse);

            const { fetchPages, pages } = usePages();
            await fetchPages();

            expect(mockGetBySlug).toHaveBeenCalledWith('amsterdam');
            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/node/page?filter[promote]=1&filter[field_jurisdiction.field_slug]=amsterdam'
            );
            expect(pages.value).toHaveLength(3);
        });

        it('falls back to global pages when fastmap slug is known but tenant has no pages', async () => {
            mockIsFastmap.value = true;
            mockJurisdiction.value = { slug: 'amsterdam' };
            mockGetBySlug.mockReturnValue({ id: 1, slug: 'amsterdam' });
            mockGet
                .mockResolvedValueOnce(mockNoPagesResponse)
                .mockResolvedValueOnce(mockPagesResponse);

            const { fetchPages } = usePages();
            await fetchPages();

            expect(mockGet).toHaveBeenCalledTimes(2);
            expect(mockGet).toHaveBeenNthCalledWith(1,
                '/jsonapi/node/page?filter[promote]=1&filter[field_jurisdiction.field_slug]=amsterdam'
            );
            expect(mockGet).toHaveBeenNthCalledWith(2,
                '/jsonapi/node/page?filter[promote]=1'
            );
        });

        it('does not consult getBySlug on the legacy single-tenant path (fastmap off)', async () => {
            // The non-fastmap branch sources jurisdiction from useMarkASpotConfig
            // which is resolved via ENV/SSR, never from a route catch-all. No
            // unknown-slug vector → guard intentionally not consulted here.
            mockIsFastmap.value = false;
            mockJurisdiction.value = { id: 1, slug: 'paris' };
            mockGet.mockResolvedValue(mockPagesResponse);

            const { fetchPages } = usePages();
            await fetchPages();

            expect(mockGetBySlug).not.toHaveBeenCalled();
            expect(mockGet).toHaveBeenCalledWith(
                '/jsonapi/node/page?filter[promote]=1&filter[field_jurisdiction.meta.drupal_internal__target_id]=1'
            );
        });

        it('skips the slug guard when fastmap is on but no slug is set', async () => {
            mockIsFastmap.value = true;
            mockJurisdiction.value = null;
            mockGet.mockResolvedValue(mockPagesResponse);

            const { fetchPages } = usePages();
            await fetchPages();

            expect(mockGetBySlug).not.toHaveBeenCalled();
            expect(mockGet).toHaveBeenCalledWith('/jsonapi/node/page?filter[promote]=1');
        });
    });

    // ========================================================================
    // startPage
    // ========================================================================

    describe('startPage', () => {
        it('returns the sticky page from fetched pages', async () => {
            mockGet.mockResolvedValue(mockPagesResponse);

            const { fetchPages, startPage } = usePages();
            await fetchPages();

            expect(startPage.value).toBeDefined();
            expect(startPage.value?.id).toBe('uuid-1');
            expect(startPage.value?.attributes?.title).toBe('Welcome');
            expect(startPage.value?.attributes?.sticky).toBe(true);
        });

        it('returns undefined when no sticky page exists', async () => {
            mockGet.mockResolvedValue(mockNonStickyPagesResponse);

            const { fetchPages, startPage } = usePages();
            await fetchPages();

            expect(startPage.value).toBeUndefined();
        });

        it('returns undefined when pages array is empty', async () => {
            mockGet.mockResolvedValue(mockNoPagesResponse);

            const { fetchPages, startPage } = usePages();
            await fetchPages();

            expect(startPage.value).toBeUndefined();
        });
    });

    // ========================================================================
    // getPage
    // ========================================================================

    describe('getPage', () => {
        it('fetches single page by ID', async () => {
            mockGet.mockResolvedValue(mockSinglePageResponse);

            const { getPage } = usePages();
            const page = await getPage('uuid-1');

            expect(mockGet).toHaveBeenCalledWith('/jsonapi/node/page/uuid-1');
            expect(page).toBeDefined();
            expect(page?.id).toBe('uuid-1');
            expect(page?.attributes?.title).toBe('Welcome');
        });

        it('returns null on API error', async () => {
            mockGet.mockRejectedValue(new Error('Not found'));

            const { getPage, error } = usePages();
            const page = await getPage('nonexistent-uuid');

            expect(page).toBeNull();
            expect(error.value).toBe('Not found');
        });

        it('handles non-Error exceptions in getPage', async () => {
            mockGet.mockRejectedValue({ status: 404 });

            const { getPage, error } = usePages();
            const page = await getPage('nonexistent-uuid');

            expect(page).toBeNull();
            expect(error.value).toBe('Error loading page');
        });
    });
});
