import { useRuntimeConfig } from '#app';
import type { MarkASpotConfig } from './useMarkASpotConfig';

/**
 * MarkASpotSettings Composable
 *
 * REFACTORED: This composable now delegates to useMarkASpotConfig for data fetching.
 * This eliminates duplicate API calls to /api/mark-a-spot-settings.
 *
 * Responsibilities:
 * - Provides settings data (delegated to useMarkASpotConfig)
 * - localStorage caching for offline/performance
 * - Boundary lazy-loading (separate from main config)
 *
 * For the primary config composable, see useMarkASpotConfig.ts
 *
 * @returns Reactive state and methods for settings functionality
 */

interface CachedSettings {
    data: MarkASpotConfig | any // Allow any for boundary GeoJSON data
    bbox?: string | null
    timestamp: number
    version: string
}

// Module-level pending promise for boundary fetches (prevent duplicate requests)
let pendingBoundaryFetch: Promise<any> | null = null;

/**
 * MarkASpotSettings Composable
 *
 * REFACTORED: Delegates to useMarkASpotConfig for data fetching to eliminate duplicate API calls.
 * Provides localStorage caching and boundary lazy-loading.
 *
 * @returns Reactive state and methods for settings functionality
 */
export const useMarkASpotSettings = () => {
    // Import config composable - this is now the single source of truth for settings data
    // Note: We use a lazy import pattern to avoid circular dependency issues
    const {
        config: configData,
        isReady: configReady,
        isPending: configPending,
        error: configError,
        fetchConfig,
        currentJurisdictionId
    } = useMarkASpotConfig();

    // Map config data to settings format (they're the same structure from the same endpoint)
    const settings = computed<MarkASpotConfig | null>(() => configData.value);
    const loading = computed(() => configPending.value);
    const error = computed(() => configError.value ? new Error(configError.value) : null);

    // Capture useRouter() at setup scope (not useRoute()) — see #445.
    // useRoute() warns and returns the OLD route when this composable runs
    // transitively from route middleware under Nuxt 4. router is stable and
    // router.currentRoute.value is a plain reactive read with no such caveat.
    // Mirrors the precedent in useMarkASpotConfig.ts.
    const router = useRouter();
    const runtimeConfig = useRuntimeConfig();
    const {
        currentJurisdiction,
        loaded: jurisdictionsLoaded,
        getBySlug,
        getById
    } = useJurisdictions();
    const ssrJurisdictionKey = useState<string>('mas-config-jurisdiction-key', () => '');
    const authUser = useState<{ uid?: string } | null>('auth_user');

    // Get jurisdiction slug for API calls.
    // Settings API accepts both slugs and numeric IDs.
    const getJurisdictionIdOrSlug = (): { id?: string, slug?: string, source: string } => {
        const route = router.currentRoute.value;
        const urlSlug = route.params.jurisdiction as string | undefined;

        // URL slug takes priority (always available, no resolution needed)
        if (urlSlug) {
            return { slug: urlSlug, source: 'url-slug' };
        }

        // Dev mode query param override
        if (import.meta.dev && route.query.jurisdiction) {
            return { slug: String(route.query.jurisdiction), source: 'query' };
        }

        // Server-only ENV or SSR-transported state key (client).
        // jurisdictionId is in server-only runtimeConfig (NOT public) to avoid
        // baking the build-time value into the client bundle.
        // On SSR: read server config directly, resolve numeric IDs to slugs.
        // On client: read from 'mas-config-jurisdiction-key' useState transported via SSR payload.
        if (import.meta.server) {
            const envId = (runtimeConfig as Record<string, unknown>).jurisdictionId
                ? String((runtimeConfig as Record<string, unknown>).jurisdictionId)
                : '';
            if (envId) {
                // Resolve numeric ENV IDs to slugs when possible (Settings API accepts both)
                if (/^\d+$/.test(envId)) {
                    const jur = getById(Number(envId));
                    if (jur?.slug) return { slug: jur.slug, source: 'config' };
                }
                return { slug: envId, source: 'config' };
            }
        } else {
            if (ssrJurisdictionKey.value) {
                return { slug: ssrJurisdictionKey.value, source: 'config' };
            }
        }

        return { source: 'none' };
    };

    // Get current jurisdiction for cache key differentiation (uses ID when available)
    const getJurisdictionId = (): string => {
        const { id, slug } = getJurisdictionIdOrSlug();
        return id || slug || '';
    };

    // Get current user ID for cache key differentiation (authenticated users get user-specific cache)
    const getUserId = (): string => {
        return authUser.value?.uid || 'anon';
    };

    // Key to store settings in local storage (includes jurisdiction AND user for multi-tenant)
    // This ensures authenticated users from different jurisdictions don't share cached settings
    const localStorageKey = computed(() => {
        const jurisdictionPart = getJurisdictionId() || 'default';
        const userPart = getUserId();
        return `markASpotSettings_j${jurisdictionPart}_u${userPart}`;
    });

    // Use build hash from git commit for automatic cache invalidation on redeploy
    const CACHE_VERSION = import.meta.env.APP_VERSION || '1.0.1';

    // Cache max age in milliseconds (1 hour)
    // Shorter duration ensures map settings stay fresh
    const CACHE_MAX_AGE = 60 * 60 * 1000;

    // Check if we are in the client (browser) environment
    const isClient = typeof window !== 'undefined';

    // Legacy key for migration (before jurisdiction-specific caching)
    const LEGACY_STORAGE_KEY = 'markASpotSettings';

    // Lazy-load boundary data (excluded from SSR for performance)
    // Declared early so clearCache can reference them
    const boundary = useState<any>('mas-boundary-data', () => null);
    const boundaryBboxState = useState<string | null>('mas-boundary-bbox', () => null);
    const boundaryStateCacheKey = useState<string>('mas-boundary-state-cache-key', () => '');
    const boundaryLoading = useState<boolean>('mas-boundary-loading', () => false);
    const boundaryFetchFailed = useState<boolean>('mas-boundary-fetch-failed', () => false);

    const calculateBoundaryBbox = (data: any): string | null => {
        const bounds = getBoundsType(data);
        if (!bounds) return null;
        return `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
    };

    // Bbox string derived from boundary GeoJSON and persisted with the boundary cache.
    // Geocoding components use this stable value to scope every search request to the jurisdiction.
    const boundaryBbox = computed<string | null>(() => boundaryBboxState.value);

    // Boundary cache key (includes jurisdiction for multi-tenant)
    const boundaryCacheKey = computed(() => {
        const jurisdictionPart = getJurisdictionId() || 'default';
        const userPart = getUserId();
        return `markASpotBoundary_j${jurisdictionPart}_u${userPart}`;
    });

    const resetBoundaryState = () => {
        boundary.value = null;
        boundaryBboxState.value = null;
        boundaryFetchFailed.value = false;
    };

    const ensureBoundaryStateMatchesCacheKey = () => {
        const key = boundaryCacheKey.value;
        if (boundaryStateCacheKey.value && boundaryStateCacheKey.value !== key) {
            resetBoundaryState();
        }
        boundaryStateCacheKey.value = key;
    };

    /**
     * Migrate settings from legacy localStorage key - cleanup only
     * REFACTORED: Settings caching is now handled by useMarkASpotConfig
     */
    const migrateLegacyCache = (): void => {
        if (!isClient) return;

        // Clean up legacy keys (no longer used)
        const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyData) {
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            console.log('[MarkASpotSettings] Removed legacy cache key');
        }

        // Also clean up old jurisdiction-specific settings keys (now handled by useMarkASpotConfig)
        Object.keys(localStorage)
            .filter(k => k.startsWith('markASpotSettings_j'))
            .forEach((k) => {
                localStorage.removeItem(k);
                console.log(`[MarkASpotSettings] Removed old settings cache: ${k}`);
            });
    };

    // Get useMarkASpotConfig's clearCache function
    const { clearCache: clearConfigCache } = useMarkASpotConfig();

    /**
     * Manually clear the cache (useful for debugging or error recovery)
     * REFACTORED: Delegates to useMarkASpotConfig
     */
    const clearCache = () => {
        // Clear boundary localStorage cache
        if (isClient) {
            localStorage.removeItem(boundaryCacheKey.value);
        }
        // Clear main config cache via useMarkASpotConfig
        clearConfigCache();
        // Reset boundary state
        resetBoundaryState();
        boundaryStateCacheKey.value = '';
        console.log('[MarkASpotSettings] Cache cleared (delegated to useMarkASpotConfig)');
    };

    /**
     * Fetch settings from the backend
     * REFACTORED: Delegates to useMarkASpotConfig to avoid duplicate API calls
     * @param force - Bypass cache and force fresh fetch
     */
    const fetchSettings = async (force = false) => {
        // Delegate to useMarkASpotConfig - single source of truth
        console.log(`[MarkASpotSettings] Delegating fetch to useMarkASpotConfig (force: ${force})`);
        await fetchConfig(force);
    };

    // Computed getters for commonly used settings
    const mapSettings = computed(() => {
        if (!settings.value) {
            return {
                style: '',
                center: { lat: 0, lng: 0 },
                zoom: 13 // Default zoom
            };
        }

        return {
            style: settings.value.mapbox_style || '',
            style_dark: settings.value.mapbox_style_dark || '',
            center: {
                lat: Number.isFinite(parseFloat(String(settings.value.center_lat))) ? parseFloat(String(settings.value.center_lat)) : 0,
                lng: Number.isFinite(parseFloat(String(settings.value.center_lng))) ? parseFloat(String(settings.value.center_lng)) : 0
            },
            zoom: parseInt(String(settings.value.zoom_initial)) || 13
        };
    });

    // Initialize: Clean up legacy localStorage caches (client only, one-time operation)
    if (isClient) {
        migrateLegacyCache();
    }

    // Note: Jurisdiction change watching is handled by:
    // 1. useMarkASpotConfig (main data)
    // 2. jurisdiction-watcher.client.ts plugin (dev mode query param)
    watch(currentJurisdictionId, (newId, oldId) => {
        if (newId !== oldId) {
            resetBoundaryState();
            boundaryStateCacheKey.value = '';
        }
    });

    /**
     * Load cached boundary from localStorage with version and age validation
     * @returns boolean indicating if cache was valid and loaded
     */
    const loadCachedBoundary = (): boolean => {
        if (!isClient) return false;

        const cachedData = localStorage.getItem(boundaryCacheKey.value);
        if (!cachedData) return false;

        try {
            const cached: CachedSettings = JSON.parse(cachedData);
            const now = Date.now();
            const age = now - cached.timestamp;

            // Validate cache version and age
            if (cached.version === CACHE_VERSION && age < CACHE_MAX_AGE) {
                boundary.value = cached.data;
                boundaryBboxState.value = cached.bbox ?? calculateBoundaryBbox(cached.data);
                boundaryStateCacheKey.value = boundaryCacheKey.value;
                if (cached.bbox === undefined && boundaryBboxState.value) {
                    saveBoundaryToCache(cached.data);
                }
                console.log(`[MarkASpotSettings] Boundary loaded from cache (v${CACHE_VERSION}, ${Math.round(age / 60000)}m old)`);
                return true;
            } else {
                const reason = cached.version !== CACHE_VERSION
                    ? `version mismatch (cached: ${cached.version}, current: ${CACHE_VERSION})`
                    : `expired (${Math.round(age / 60000)}m old)`;
                console.log(`[MarkASpotSettings] Boundary cache invalidated: ${reason}`);
                localStorage.removeItem(boundaryCacheKey.value);
                return false;
            }
        } catch (err) {
            console.error('[MarkASpotSettings] Failed to parse cached boundary:', err);
            localStorage.removeItem(boundaryCacheKey.value);
            return false;
        }
    };

    /**
     * Save boundary to localStorage with version and timestamp
     */
    const saveBoundaryToCache = (data: any) => {
        if (!isClient) return;

        const cached: CachedSettings = {
            data,
            bbox: calculateBoundaryBbox(data),
            timestamp: Date.now(),
            version: CACHE_VERSION
        };

        try {
            localStorage.setItem(boundaryCacheKey.value, JSON.stringify(cached));
            console.log(`[MarkASpotSettings] Boundary saved to cache (v${CACHE_VERSION}, key: ${boundaryCacheKey.value})`);
        } catch (err: unknown) {
            if ((err as any)?.name === 'QuotaExceededError' || (err as any)?.code === 22) {
                console.warn('[MarkASpotSettings] Storage quota exceeded, clearing old boundary caches');
                Object.keys(localStorage)
                    .filter(k => k.startsWith('markASpotBoundary'))
                    .forEach(k => localStorage.removeItem(k));
                try {
                    localStorage.setItem(boundaryCacheKey.value, JSON.stringify(cached));
                } catch {
                    console.warn('[MarkASpotSettings] Boundary cache save failed after cleanup');
                }
            } else {
                console.error('[MarkASpotSettings] Failed to save boundary cache:', err);
            }
        }
    };

    /**
     * Fetch boundary data separately (lazy-loaded after initial page render)
     * This is excluded from SSR to reduce initial payload size.
     * Includes promise deduplication to prevent concurrent requests.
     */
    const fetchBoundary = async () => {
        ensureBoundaryStateMatchesCacheKey();

        // Skip if already loaded
        if (boundary.value) {
            boundaryBboxState.value ||= calculateBoundaryBbox(boundary.value);
            return boundary.value;
        }

        // Skip on server - boundary is client-only
        if (import.meta.server) return null;

        // Prevent retry if previous fetch failed
        if (boundaryFetchFailed.value) {
            console.log('[MarkASpotSettings] Skipping boundary fetch (previous attempt failed)');
            return null;
        }

        // Try loading from cache first
        if (loadCachedBoundary()) {
            return boundary.value;
        }

        // Deduplicate concurrent requests
        if (pendingBoundaryFetch) {
            console.log('[MarkASpotSettings] Waiting for pending boundary fetch...');
            return pendingBoundaryFetch;
        }

        boundaryLoading.value = true;

        // Create and store the fetch promise
        pendingBoundaryFetch = (async () => {
            try {
                const { id, slug } = getJurisdictionIdOrSlug();
                const jurisdictionParam = id || slug;
                // Use consistent URL pattern with /api/ prefix
                const url = `/api/mark-a-spot-settings${jurisdictionParam ? `?jurisdiction=${jurisdictionParam}` : ''}`;
                console.log(`[MarkASpotSettings] Fetching boundary from ${url}`);

                // Use $fetch for consistency (all /api/ routes use $fetch in other composables)
                const response = await $fetch<MarkASpotConfig>(url, {
                    credentials: 'include'
                });

                if (response?.boundary) {
                    boundary.value = response.boundary;
                    boundaryBboxState.value = calculateBoundaryBbox(response.boundary);
                    boundaryStateCacheKey.value = boundaryCacheKey.value;
                    saveBoundaryToCache(response.boundary);
                    console.log('[MarkASpotSettings] Boundary loaded and cached');
                    return boundary.value;
                } else {
                    console.warn('[MarkASpotSettings] No boundary data in API response');
                    return null;
                }
            } catch (err) {
                console.error('[MarkASpotSettings] Error fetching boundary:', err);
                boundaryFetchFailed.value = true; // Prevent infinite retry loops
                return null;
            } finally {
                boundaryLoading.value = false;
                pendingBoundaryFetch = null;
            }
        })();

        return pendingBoundaryFetch;
    };

    return {
        settings,
        loading,
        error,
        fetchSettings,
        mapSettings,
        clearCache,
        jurisdictionsLoaded,
        // Boundary lazy-loading
        boundary,
        boundaryBbox,
        boundaryLoading,
        fetchBoundary
    };
};
