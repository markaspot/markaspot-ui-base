/**
 * useMediaTypeEntities Tests
 *
 * Tests the composable that fetches Drupal media entities via JSON:API,
 * including the optional mediaGroup filter for field_definition_group.
 *
 * @see app/composables/media/useMediaTypeEntities.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick, toValue } from 'vue';

// Make toValue available globally (auto-imported in Nuxt but not in test setup)
globalThis.toValue = toValue;

// ============================================================================
// Mock setup
// ============================================================================

const mockGet = vi.fn();

vi.mock('~/composables/api/useApiClient', () => ({
    useApiClient: () => ({ get: mockGet })
}));

// ============================================================================
// Fixtures
// ============================================================================

function createJsonApiResponse(
    entities: Array<{ id: string, name: string, fileId: string }>,
    files: Array<{ id: string, url: string }>,
    hasNext = false
) {
    return {
        data: entities.map(e => ({
            id: e.id,
            type: 'media--catalog_image',
            attributes: { name: e.name },
            relationships: {
                thumbnail: { data: { id: e.fileId, type: 'file--file' } }
            }
        })),
        included: files.map(f => ({
            id: f.id,
            type: 'file--file',
            attributes: { uri: { url: f.url } }
        })),
        links: hasNext ? { next: { href: 'https://example.com/next' } } : {}
    };
}

const singlePageResponse = createJsonApiResponse(
    [
        { id: 'uuid-1', name: 'Anlehnbuegel', fileId: 'file-1' },
        { id: 'uuid-2', name: 'Sheffield Stand', fileId: 'file-2' }
    ],
    [
        { id: 'file-1', url: '/sites/default/files/catalog/anlehnbuegel.png' },
        { id: 'file-2', url: '/sites/default/files/catalog/sheffield.png' }
    ]
);

// ============================================================================
// Tests
// ============================================================================

describe('useMediaTypeEntities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockReset();
    });

    // Lazy import to ensure mocks are registered before module loads
    async function loadComposable() {
        const mod = await import('@/composables/media/useMediaTypeEntities');
        return mod.useMediaTypeEntities;
    }

    it('fetches entities without group filter', async () => {
        mockGet.mockResolvedValueOnce(singlePageResponse);

        const useMediaTypeEntities = await loadComposable();
        const { items } = useMediaTypeEntities(ref('catalog_image'));

        // Wait for the watch + async fetch to settle
        await vi.waitFor(() => {
            expect(mockGet).toHaveBeenCalledTimes(1);
        });

        const [url, params] = mockGet.mock.calls[0];
        expect(url).toBe('/jsonapi/media/catalog_image');
        expect(params).toHaveProperty('include', 'thumbnail');
        expect(params).toHaveProperty('fields[media--catalog_image]', 'name,thumbnail');
        expect(params).not.toHaveProperty('filter[field_definition_group][value]');

        await vi.waitFor(() => {
            expect(items.value).toHaveLength(2);
        });
        expect(items.value[0].name).toBe('Anlehnbuegel');
        expect(items.value[1].name).toBe('Sheffield Stand');
    });

    it('includes group filter when mediaGroup is provided', async () => {
        mockGet.mockResolvedValueOnce(singlePageResponse);

        const useMediaTypeEntities = await loadComposable();
        useMediaTypeEntities(ref('catalog_image'), ref('radbuegel_bautypen'));

        await vi.waitFor(() => {
            expect(mockGet).toHaveBeenCalledTimes(1);
        });

        const [, params] = mockGet.mock.calls[0];
        expect(params['filter[field_definition_group][value]']).toBe('radbuegel_bautypen');
    });

    it('does not include group filter when mediaGroup is undefined', async () => {
        mockGet.mockResolvedValueOnce(singlePageResponse);

        const useMediaTypeEntities = await loadComposable();
        useMediaTypeEntities(ref('catalog_image'), ref(undefined));

        await vi.waitFor(() => {
            expect(mockGet).toHaveBeenCalledTimes(1);
        });

        const [, params] = mockGet.mock.calls[0];
        expect(params).not.toHaveProperty('filter[field_definition_group][value]');
    });

    it('returns empty items and skips fetch when mediaType is undefined', async () => {
        const useMediaTypeEntities = await loadComposable();
        const { items } = useMediaTypeEntities(ref(undefined));

        await nextTick();

        expect(mockGet).not.toHaveBeenCalled();
        expect(items.value).toEqual([]);
    });

    it('resolves image URLs through the proxy path', async () => {
        mockGet.mockResolvedValueOnce(singlePageResponse);

        const useMediaTypeEntities = await loadComposable();
        const { items } = useMediaTypeEntities(ref('catalog_image'));

        await vi.waitFor(() => {
            expect(items.value).toHaveLength(2);
        });

        expect(items.value[0].imageUrl).toBe('/api/images/sites/default/files/catalog/anlehnbuegel.png');
        expect(items.value[1].imageUrl).toBe('/api/images/sites/default/files/catalog/sheffield.png');
    });

    it('handles image URLs without leading slash', async () => {
        const response = createJsonApiResponse(
            [{ id: 'uuid-1', name: 'Test', fileId: 'file-1' }],
            [{ id: 'file-1', url: 'sites/default/files/catalog/test.png' }]
        );
        mockGet.mockResolvedValueOnce(response);

        const useMediaTypeEntities = await loadComposable();
        const { items } = useMediaTypeEntities(ref('catalog_image'));

        await vi.waitFor(() => {
            expect(items.value).toHaveLength(1);
        });

        expect(items.value[0].imageUrl).toBe('/api/images/sites/default/files/catalog/test.png');
    });

    it('sets error and empties items on fetch failure', async () => {
        mockGet.mockRejectedValueOnce(new Error('Network error'));
        // Suppress expected console.error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const useMediaTypeEntities = await loadComposable();
        const { items, error, loading } = useMediaTypeEntities(ref('catalog_image'));

        await vi.waitFor(() => {
            expect(error.value).not.toBeNull();
        });

        expect(error.value).toBe('Network error');
        expect(items.value).toEqual([]);
        expect(loading.value).toBe(false);

        consoleSpy.mockRestore();
    });

    it('uses fallback message for non-Error throws', async () => {
        mockGet.mockRejectedValueOnce('something went wrong');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const useMediaTypeEntities = await loadComposable();
        const { error } = useMediaTypeEntities(ref('catalog_image'));

        await vi.waitFor(() => {
            expect(error.value).not.toBeNull();
        });

        expect(error.value).toBe('Failed to fetch media entities');

        consoleSpy.mockRestore();
    });

    it('handles pagination across multiple pages', async () => {
        const page1 = createJsonApiResponse(
            [{ id: 'uuid-1', name: 'Item 1', fileId: 'file-1' }],
            [{ id: 'file-1', url: '/sites/default/files/catalog/item1.png' }],
            true // hasNext
        );
        const page2 = createJsonApiResponse(
            [{ id: 'uuid-2', name: 'Item 2', fileId: 'file-2' }],
            [{ id: 'file-2', url: '/sites/default/files/catalog/item2.png' }],
            false
        );
        mockGet.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

        const useMediaTypeEntities = await loadComposable();
        const { items } = useMediaTypeEntities(ref('catalog_image'));

        await vi.waitFor(() => {
            expect(items.value).toHaveLength(2);
        });

        expect(mockGet).toHaveBeenCalledTimes(2);
        expect(items.value[0].name).toBe('Item 1');
        expect(items.value[1].name).toBe('Item 2');

        // Verify offset incremented on second call
        const [, params2] = mockGet.mock.calls[1];
        expect(params2['page[offset]']).toBe('50');
    });

    it('returns empty imageUrl when thumbnail relationship is missing', async () => {
        const response = {
            data: [{
                id: 'uuid-1',
                type: 'media--catalog_image',
                attributes: { name: 'No Thumb' },
                relationships: {}
            }],
            included: [],
            links: {}
        };
        mockGet.mockResolvedValueOnce(response);

        const useMediaTypeEntities = await loadComposable();
        const { items } = useMediaTypeEntities(ref('catalog_image'));

        await vi.waitFor(() => {
            expect(items.value).toHaveLength(1);
        });

        expect(items.value[0].imageUrl).toBe('');
    });

    it('refresh triggers a new fetch', async () => {
        mockGet.mockResolvedValue(singlePageResponse);

        const useMediaTypeEntities = await loadComposable();
        const { refresh } = useMediaTypeEntities(ref('catalog_image'));

        await vi.waitFor(() => {
            expect(mockGet).toHaveBeenCalledTimes(1);
        });

        await refresh();

        expect(mockGet).toHaveBeenCalledTimes(2);
    });
});
