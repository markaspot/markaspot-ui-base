import { defineStore } from 'pinia';
import type { Request, BoundsType } from '~~/types';
import { DEFAULT_LOCALE } from '@/utils/locale';

interface CacheEntry {
    data: Request[]
    timestamp: number
}

/**
 * Dedicated store for request caching logic
 */
export const useCacheStore = defineStore('cache', {
    state: () => ({
        requestsCache: new Map<string, CacheEntry>(),
        cacheTTL: 5 * 60 * 1000 // 5 minutes default
    }),

    getters: {
    /**
     * Check if cache entry is still valid
     */
        isCacheValid: state => (cacheKey: string): boolean => {
            const cached = state.requestsCache.get(cacheKey);
            if (!cached) return false;

            return Date.now() - cached.timestamp < state.cacheTTL;
        },

        /**
     * Get cache statistics for debugging
     */
        cacheStats: (state) => {
            const entries = Array.from(state.requestsCache.entries());
            const now = Date.now();

            return {
                totalEntries: entries.length,
                validEntries: entries.filter(([, entry]) => now - entry.timestamp < state.cacheTTL).length,
                oldestEntry: entries.length > 0 ? Math.min(...entries.map(([, entry]) => entry.timestamp)) : null,
                newestEntry: entries.length > 0 ? Math.max(...entries.map(([, entry]) => entry.timestamp)) : null
            };
        }
    },

    actions: {
    /**
     * Generate cache key for requests
     * Includes locale and jurisdiction to ensure separate cache entries
     */
        generateCacheKey(
            bounds: BoundsType,
            serviceCode: string | null = null,
            page = 1,
            locale?: string,
            jurisdictionId?: string,
            isAuthenticated = false
        ): string {
            const localeKey = locale || DEFAULT_LOCALE;
            const jurKey = jurisdictionId || 'default';
            // Auth state changes the response shape (manager-only fields like
            // organisation, internal notes). Mixing it into the key prevents
            // an anonymous and an authenticated caller from sharing the same
            // cache entry or in-flight Promise.
            const authKey = isAuthenticated ? 'auth' : 'anon';
            // Quantize bounds to ~10m grid (4 decimals). Two consecutive
            // moveend events from the same fitBounds animation can land on
            // bbox snapshots that differ by metres; treating them as the
            // same key collapses redundant fetches without affecting any
            // viewport change a user could perceive.
            const round = (n: number) => n.toFixed(4);
            return `${round(bounds.minLat)},${round(bounds.maxLat)},${round(bounds.minLng)},${round(bounds.maxLng)}-${serviceCode}-${page}-${localeKey}-jur${jurKey}-${authKey}`;
        },

        /**
     * Get cached requests if valid
     */
        getCachedRequests(cacheKey: string): Request[] | null {
            if (!this.isCacheValid(cacheKey)) {
                return null;
            }

            const cached = this.requestsCache.get(cacheKey);
            if (cached) {
                return cached.data;
            }

            return null;
        },

        /**
     * Cache requests data
     */
        setCachedRequests(cacheKey: string, data: Request[]): void {
            this.requestsCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            // Clean up old entries if cache gets too large
            this.cleanupCache();
        },

        /**
     * Clean up expired cache entries
     */
        cleanupCache(): void {
            const now = Date.now();
            const keysToDelete: string[] = [];

            for (const [key, entry] of this.requestsCache.entries()) {
                if (now - entry.timestamp > this.cacheTTL) {
                    keysToDelete.push(key);
                }
            }

            keysToDelete.forEach((key) => {
                this.requestsCache.delete(key);
            });

            // Also limit total cache size
            const maxCacheSize = 50;
            if (this.requestsCache.size > maxCacheSize) {
                const entries = Array.from(this.requestsCache.entries());
                entries.sort((a, b) => a[1].timestamp - b[1].timestamp); // Sort by timestamp

                // Remove oldest entries
                const entriesToRemove = entries.slice(0, this.requestsCache.size - maxCacheSize);
                entriesToRemove.forEach(([key]) => {
                    this.requestsCache.delete(key);
                });
            }
        },

        /**
     * Clear all cache
     */
        clearCache(): void {
            this.requestsCache.clear();
        },

        /**
     * Update cache TTL
     */
        setCacheTTL(ttl: number): void {
            this.cacheTTL = ttl;
        }
    }
});

// Enable Pinia HMR in development to prevent "getActivePinia()" errors
// when Vite hot-reloads this store module
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useCacheStore, import.meta.hot));
}
