// composables/useTokenCache.ts

/**
 * TokenCache Composable
 *
 * Manages authentication tokens with caching and automatic refresh capabilities.
 * Uses a pending promise to prevent multiple concurrent token fetches.
 *
 * @returns Reactive state and methods for tokencache functionality
 */

interface TokenCache {
    value: string | null
    timestamp: number
}

const tokenCache = ref<TokenCache>({
    value: null,
    timestamp: 0
});

// Module-level pending promise to deduplicate concurrent token fetches
let pendingTokenFetch: Promise<string | null> | null = null;

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export const useTokenCache = () => {
    const isTokenValid = () => {
        if (!tokenCache.value.value) return false;
        const now = Date.now();
        return now - tokenCache.value.timestamp < CACHE_DURATION;
    };

    const getCachedToken = () => {
        return isTokenValid() ? tokenCache.value.value : null;
    };

    const setCachedToken = (token: string) => {
        tokenCache.value = {
            value: token,
            timestamp: Date.now()
        };
    };

    const invalidateToken = () => {
        tokenCache.value = {
            value: null,
            timestamp: 0
        };
    };

    /**
     * Get pending token fetch promise (for deduplication)
     */
    const getPendingFetch = () => pendingTokenFetch;

    /**
     * Set pending token fetch promise
     */
    const setPendingFetch = (promise: Promise<string | null> | null) => {
        pendingTokenFetch = promise;
    };

    return {
        getCachedToken,
        setCachedToken,
        invalidateToken,
        isTokenValid,
        getPendingFetch,
        setPendingFetch
    };
};
