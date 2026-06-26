/**
 * useListFirst - Preload list data before map loads on mobile
 *
 * When deferredMap.preloadData is enabled, this composable:
 * 1. Loads the boundary GeoJSON (cached to avoid redundant fetches)
 * 2. Calculates city-wide bbox from boundary
 * 3. Fetches initial data with configurable limit (default: 100)
 *
 * This ensures the list has data even before the map loads.
 *
 * Boundary resolution priority:
 * 1. API boundary already in config (from useMarkASpotConfig)
 * 2. Lazy-loaded boundary from API (via fetchBoundary, like useBoundaryValidator)
 * 3. Static file fallback (/data/boundaries/{file}.json)
 * 4. Center-based synthetic bbox (from center_lat/center_lng + zoom)
 *
 * The limit of 100 is chosen to balance:
 * - Coverage: Most cities have <100 active reports visible initially
 * - Performance: 100 items is fast to fetch and render
 * - Network: Single request vs paginated fetching
 */

import type { FeatureCollection } from 'geojson';
import { getBoundsType } from '@/utils/calculateBoundaryBounds';
import { useRequestsStore } from '@/stores/requests';
import { useMarkASpotConfig } from '@/composables/core/useMarkASpotConfig';
import { useMarkASpotSettings } from '@/composables/core/useMarkASpotSettings';
import type { BoundsType } from '~~/types';

// MEMORY LEAK FIX: Limit cache size to prevent unbounded growth in SSR
// Typically only 1-3 boundaries needed (default + jurisdiction variants)
const MAX_BOUNDARY_CACHE = 10;
const boundaryCache = new Map<string, any>();

/**
 * Error types for better debugging
 */
export interface ListFirstError {
    type: 'boundary' | 'api' | 'config'
    message: string
    originalError?: Error
}

export function useListFirst() {
    const runtimeConfig = useRuntimeConfig();
    const requestsStore = useRequestsStore();
    const { boundary: apiBoundary, clientConfig, config: masConfig } = useMarkASpotConfig();
    const { boundary: lazyBoundary, fetchBoundary } = useMarkASpotSettings();
    const isDev = import.meta.dev;

    // Get deferredMap config - dynamic config from API takes priority
    const deferredMapConfig = computed(() => {
        const mapConfig = clientConfig.value?.features?.map ||
          runtimeConfig.public.clientConfig?.features?.map;
        const deferredMap = typeof mapConfig?.deferredMap === 'object' && mapConfig.deferredMap !== null
            ? mapConfig.deferredMap
            : null;
        return {
            enabled: typeof mapConfig?.deferredMap === 'boolean'
                ? mapConfig.deferredMap
                : deferredMap?.enabled ?? false,
            preloadData: deferredMap?.preloadData ?? false,
            limit: deferredMap?.limit ?? 100
        };
    });

    // Get boundary config for file name - dynamic config from API takes priority
    const boundaryConfig = computed(() => {
        return clientConfig.value?.features?.boundaries ||
          runtimeConfig.public.clientConfig?.features?.boundaries ||
          { file: 'default' };
    });

    // State
    const isLoading = ref(false);
    const isPreloaded = ref(false);
    const cityBounds = ref<BoundsType | null>(null);
    const error = ref<ListFirstError | null>(null);

    /**
     * Calculate synthetic bounds from map center and zoom level.
     * Used as a last resort when no boundary GeoJSON is available.
     *
     * Approximation: at zoom 13 (typical city), ~0.05 degrees covers the viewport.
     * We use a generous padding so the preloaded data covers the initial view.
     */
    function boundsFromCenter(): BoundsType | null {
        const cfg = masConfig.value;
        if (!cfg) return null;

        const lat = parseFloat(String(cfg.center_lat));
        const lng = parseFloat(String(cfg.center_lng));
        if (!lat || !lng) return null;

        const zoom = parseInt(String(cfg.zoom_initial)) || 13;
        // Approximate degrees per tile at this zoom (longitude at equator)
        // At zoom 13, one tile covers ~0.044 degrees. We want a generous area.
        const degPerTile = 360 / Math.pow(2, zoom);
        // Use ~4 tiles worth of padding for a city-scale bbox
        const pad = degPerTile * 4;
        // Adjust longitude padding for latitude (tiles are narrower near poles)
        const latRad = (lat * Math.PI) / 180;
        const lngPad = pad / Math.cos(latRad);

        if (isDev) console.log(`[useListFirst] Synthetic bounds from center (${lat}, ${lng}) zoom ${zoom}, pad ~${pad.toFixed(4)}deg`);

        return {
            minLng: lng - lngPad,
            minLat: lat - pad,
            maxLng: lng + lngPad,
            maxLat: lat + pad
        };
    }

    /**
     * Load boundary GeoJSON and extract city bounds
     * Priority:
     * 1. API boundary already in config (from initial useMarkASpotConfig fetch)
     * 2. Lazy-loaded boundary from API (via fetchBoundary, excluded from SSR)
     * 3. Static file fallback (/data/boundaries/{file}.json)
     * 4. Center-based synthetic bbox (from center_lat/center_lng + zoom)
     */
    async function loadBoundary(): Promise<BoundsType | null> {
        // Priority 1: Check for API-provided boundary from useMarkASpotConfig
        if (apiBoundary.value && apiBoundary.value.features && apiBoundary.value.features.length > 0) {
            if (isDev) console.log('[useListFirst] Using API-provided boundary from config');
            try {
                return getBoundsType(apiBoundary.value);
            } catch (e) {
                if (isDev) console.warn('[useListFirst] Failed to get bounds from API boundary:', e);
            }
        }

        // Priority 2: Lazy-load boundary from API (same pattern as useBoundaryValidator)
        // The initial config fetch excludes boundary for performance. Load it separately.
        if (import.meta.client) {
            try {
                if (!lazyBoundary.value) {
                    if (isDev) console.log('[useListFirst] Lazy-loading boundary from API...');
                    await fetchBoundary();
                }
                if (lazyBoundary.value?.features?.length > 0) {
                    if (isDev) console.log('[useListFirst] Using lazy-loaded API boundary');
                    const bounds = getBoundsType(lazyBoundary.value);
                    if (bounds) return bounds;
                }
            } catch (e) {
                if (isDev) console.warn('[useListFirst] Failed to lazy-load boundary:', e);
            }
        }

        // Priority 3: Fall back to static file (with caching)
        const boundaryFile = boundaryConfig.value.file || 'default';

        // Check cache first
        if (boundaryCache.has(boundaryFile)) {
            if (isDev) console.log('[useListFirst] Using cached static boundary:', boundaryFile);
            return getBoundsType(boundaryCache.get(boundaryFile));
        }

        try {
            if (isDev) console.log('[useListFirst] Falling back to static file:', boundaryFile);
            const response = await fetch(`/data/boundaries/${boundaryFile}.json`);
            if (!response.ok) {
                // Try default if client-specific not found
                if (boundaryFile !== 'default') {
                    const defaultResponse = await fetch('/data/boundaries/default.json');
                    if (defaultResponse.ok) {
                        const geo = await defaultResponse.json();
                        // MEMORY LEAK FIX: Enforce max size
                        if (boundaryCache.size >= MAX_BOUNDARY_CACHE) {
                            const firstKey = boundaryCache.keys().next().value;
                            if (firstKey) boundaryCache.delete(firstKey);
                        }
                        boundaryCache.set('default', geo);
                        return getBoundsType(geo);
                    }
                }
                throw new Error(`Failed to load boundary: ${response.statusText}`);
            }

            const geo = await response.json();
            // MEMORY LEAK FIX: Enforce max size
            if (boundaryCache.size >= MAX_BOUNDARY_CACHE) {
                const firstKey = boundaryCache.keys().next().value;
                if (firstKey) boundaryCache.delete(firstKey);
            }
            boundaryCache.set(boundaryFile, geo);
            return getBoundsType(geo);
        } catch (e) {
            if (isDev) console.warn('[useListFirst] Static file unavailable:', (e as Error).message);
        }

        // Priority 4: Synthesize bounds from map center + zoom
        const centerBounds = boundsFromCenter();
        if (centerBounds) {
            if (isDev) console.log('[useListFirst] Using center-based synthetic bounds');
            return centerBounds;
        }

        // Nothing worked
        if (isDev) console.error('[useListFirst] All boundary sources exhausted');
        error.value = {
            type: 'boundary',
            message: 'No boundary data available from any source'
        };
        return null;
    }

    /**
     * Preload list data using city-wide bbox
     * Only runs on mobile when deferredMap.preloadData is enabled
     */
    async function preload(isMobile: boolean): Promise<boolean> {
        // Skip if not enabled or not mobile
        if (!deferredMapConfig.value.enabled || !deferredMapConfig.value.preloadData || !isMobile) {
            if (isDev) console.log('[useListFirst] Skipping preload - not enabled or not mobile');
            return false;
        }

        // Skip if already preloaded
        if (isPreloaded.value) {
            if (isDev) console.log('[useListFirst] Already preloaded');
            return true;
        }

        isLoading.value = true;
        error.value = null;

        try {
            // 1. Load boundary and get city bounds
            if (isDev) console.log('[useListFirst] Loading boundary...');
            const bounds = await loadBoundary();

            if (!bounds) {
                if (isDev) console.warn('[useListFirst] No bounds available, skipping preload');
                error.value = {
                    type: 'boundary',
                    message: 'Boundary data unavailable'
                };
                return false;
            }

            cityBounds.value = bounds;
            if (isDev) console.log('[useListFirst] City bounds:', bounds);

            // 2. Fetch requests with city bbox using proper store action
            const limit = deferredMapConfig.value.limit;
            if (isDev) console.log(`[useListFirst] Fetching ${limit} requests with city bbox...`);

            await requestsStore.fetchRequestsWithLimit(bounds, limit, null);

            isPreloaded.value = true;
            if (isDev) console.log('[useListFirst] Preload complete');
            return true;
        } catch (e) {
            error.value = {
                type: 'api',
                message: 'Failed to fetch requests',
                originalError: e as Error
            };
            if (isDev) console.error('[useListFirst] Preload failed:', e);
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Reset preload state (call when boundary/jurisdiction changes)
     */
    function reset() {
        isLoading.value = false;
        isPreloaded.value = false;
        cityBounds.value = null;
        error.value = null;
    }

    /**
     * Clear boundary cache (useful for testing or forced refresh)
     */
    function clearBoundaryCache() {
        boundaryCache.clear();
    }

    return {
        // Config
        deferredMapConfig,

        // State
        isLoading: readonly(isLoading),
        isPreloaded: readonly(isPreloaded),
        cityBounds: readonly(cityBounds),
        error: readonly(error),

        // Actions
        preload,
        reset,
        clearBoundaryCache
    };
}
