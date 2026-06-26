// composables/useInfoBlock.ts
import { useApiClient } from '~/composables/api/useApiClient';
import { useOnlineStatus } from '~/composables/core/useOnlineStatus';

/**
 * InfoBlock Composable
 *
 * Provides info block functionality for the application.
 *
 * @returns Reactive state and methods for infoblock functionality
 */

// MEMORY LEAK FIX: Limit Map size to prevent unbounded growth in SSR
// Each unique endpoint creates an entry; limit to 50 to prevent memory issues
const MAX_INFOBLOCK_CACHE = 50;
const infoBlocksMap = new Map<string, {
    data: ReturnType<typeof useState<any>>
    loading: ReturnType<typeof useState<boolean>>
    error: ReturnType<typeof useState<string | null>>
}>();

export function useInfoBlock(apiEndpoint: string) {
    const api = useApiClient();

    // Create unique state key based on endpoint
    const stateKey = `infoblock-${apiEndpoint.replace(/\//g, '-')}`;

    // Get or create state for this endpoint
    if (!infoBlocksMap.has(apiEndpoint)) {
        // MEMORY LEAK FIX: Enforce max size before adding new entry
        if (infoBlocksMap.size >= MAX_INFOBLOCK_CACHE) {
            // Remove oldest entry (first key in iteration order)
            const firstKey = infoBlocksMap.keys().next().value;
            if (firstKey) infoBlocksMap.delete(firstKey);
        }
        infoBlocksMap.set(apiEndpoint, {
            data: useState<any>(`${stateKey}-data`, () => null),
            loading: useState<boolean>(`${stateKey}-loading`, () => false),
            error: useState<string | null>(`${stateKey}-error`, () => null)
        });
    }

    const state = infoBlocksMap.get(apiEndpoint)!;

    const { isOffline } = useOnlineStatus();

    const fetchInfoBlock = async () => {
        // Skip fetch when offline - keep cached data if available, don't show error
        if (isOffline.value) {
            return;
        }

        state.loading.value = true;
        state.error.value = null;

        try {
            const response = await api.get(apiEndpoint, undefined, {
                headers: {
                    Priority: 'high'
                }
            });
            state.data.value = (response as any).data[0];
        } catch (e) {
            // Suppress error when offline (connection may have dropped during fetch)
            if (isOffline.value) {
                return;
            }
            console.error('Failed to fetch info block:', e);
            state.error.value = e instanceof Error ? e.message : 'Failed to load info block';
        } finally {
            state.loading.value = false;
        }
    };

    return {
        infoBlock: state.data,
        loading: state.loading,
        error: state.error,
        fetchInfoBlock
    };
}
