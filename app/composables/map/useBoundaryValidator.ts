// File: composables/map/useBoundaryValidator.ts

import type { FeatureCollection } from 'geojson';
import { useMarkASpotConfig } from '@/composables/core/useMarkASpotConfig';
import { useMarkASpotSettings } from '@/composables/core/useMarkASpotSettings';

/**
 * Composable for validating if a point is within city boundaries
 * Priority: API boundary (lazy-loaded) → static file
 */
export function useBoundaryValidator() {
    const appConfig = useAppConfig();
    const runtimeConfig = useRuntimeConfig();
    const { t } = useI18n();
    const { isReady: configIsReady, currentJurisdictionId } = useMarkASpotConfig();
    // Lazy-load boundary from settings (excluded from SSR for performance)
    const { boundary: lazyBoundary, fetchBoundary } = useMarkASpotSettings();

    // MEMORY LEAK FIX: Use useState for SSR-safe singleton pattern
    // This ensures state is properly scoped per SSR request context
    const boundaries = useState<FeatureCollection | null>('boundary-data', () => null);
    const isLoading = useState<boolean>('boundary-loading', () => true);
    const isLoadingBoundaries = useState<boolean>('boundary-loading-guard', () => false);
    const error = useState<Error | null>('boundary-error', () => null);

    // Update the boundaryConfig computed to include styling options
    const boundaryConfig = computed(() => {
        // Prefer runtime clientConfig (authoritative per-client config),
        // fall back to appConfig if unavailable.
        const runtimeBoundaries = runtimeConfig.public.clientConfig?.features?.boundaries;
        const appBoundaries = (appConfig.features as { boundaries?: Record<string, unknown> })?.boundaries;
        const fromConfig: Record<string, unknown> = runtimeBoundaries || appBoundaries || {};
        return {
            enabled: true,
            file: 'default',
            strictValidation: true,
            showBoundaryOnMap: true,
            fillColor: '#00A000', // Default fill color
            fillOpacity: 0.1, // Default fill opacity
            ...fromConfig
        } as {
            enabled: boolean
            file: string
            strictValidation: boolean
            showBoundaryOnMap: boolean
            fillColor: string
            fillOpacity: number
        };
    });

    // Extract properties from FeatureCollection for UI display
    const boundaryProperties = computed(() => {
        if (!boundaries.value || !boundaries.value.features || !boundaries.value.features.length) {
            return null;
        }
        return boundaries.value.features[0]?.properties || null;
    });

    // Helper function to load boundaries with loading guard
    const loadBoundaries = async () => {
        // Guard: prevent concurrent or duplicate loads.
        // When boundaries are already present, mark loading complete and bail early
        // so isLoading is not left stuck true.
        if (isLoadingBoundaries.value) return;
        if (boundaries.value !== null) {
            isLoading.value = false;
            return;
        }

        isLoadingBoundaries.value = true;

        try {
            // If boundaries feature is disabled, store an empty FeatureCollection as a
            // sentinel value so shouldLoadBoundaries stops triggering (boundaries !== null).
            // Validation functions guard on !enabled before consulting boundaries, so this
            // empty collection is never used for spatial tests or map rendering.
            if (!boundaryConfig.value.enabled) {
                boundaries.value = { type: 'FeatureCollection', features: [] } as FeatureCollection;
                return;
            }

            // Priority 1: Try lazy-loading boundary from API (excluded from SSR for performance)
            if (import.meta.client && !lazyBoundary.value) {
                if (import.meta.dev) {
                    console.log('[Boundaries] Lazy-loading boundary from API...');
                }
                await fetchBoundary();
            }
            if (lazyBoundary.value?.features?.length > 0) {
                if (import.meta.dev) {
                    console.log('[Boundaries] Using lazy-loaded API boundary');
                    console.debug('[Boundaries] Lazy boundary loaded:', lazyBoundary.value.features.length, 'feature(s)', 'geom:', lazyBoundary.value.features[0]?.geometry?.type);
                }
                boundaries.value = lazyBoundary.value;
                return;
            }

            // Priority 2: Fall back to static file (if API boundary not available)
            const boundaryFile = boundaryConfig.value.file || 'default';
            if (import.meta.dev) {
                console.log('[Boundaries] Falling back to static file:', boundaryFile);
            }

            // Fetch the boundaries from our public data folder
            const response = await fetch(`/data/boundaries/${boundaryFile}.json`);

            if (!response.ok) {
                // If client-specific file not found, try loading the default
                if (boundaryFile !== 'default') {
                    if (import.meta.dev) {
                        console.warn('[Boundaries] fallback to default.json');
                    }
                    const defaultResponse = await fetch('/data/boundaries/default.json');
                    if (defaultResponse.ok) {
                        boundaries.value = await defaultResponse.json();
                    } else {
                        throw new Error(`Failed to load boundaries: ${defaultResponse.statusText}`);
                    }
                } else {
                    throw new Error(`Failed to load boundaries: ${response.statusText}`);
                }
            } else {
                boundaries.value = await response.json();
            }

            if (import.meta.dev) {
                console.debug('[Boundaries] static file loaded:', boundaries.value?.features?.length, 'feature(s)', 'geom:', boundaries.value?.features?.[0]?.geometry?.type);
            }
        } catch (e) {
            error.value = e as Error;
            console.error('[Boundaries] Failed to load boundaries data:', e);
            // Set empty boundaries to prevent infinite retry loop
            boundaries.value = {
                type: 'FeatureCollection',
                features: []
            } as FeatureCollection;
        } finally {
            isLoading.value = false;
            isLoadingBoundaries.value = false;
        }
    };

    // Computed trigger: determines when boundaries should be loaded
    // This replaces multiple competing watchers with a single reactive trigger
    const shouldLoadBoundaries = computed(() =>
        configIsReady.value && boundaries.value === null && !isLoadingBoundaries.value
    );

    // Single watcher on the computed trigger - prevents race conditions
    watch(shouldLoadBoundaries, async (should) => {
        if (should) {
            await loadBoundaries();
        }
    }, { immediate: true });

    // Reset boundary data when jurisdiction changes (e.g., viewing escalated request in new jur)
    watch(currentJurisdictionId, (newId, oldId) => {
        if (newId && oldId && newId !== oldId) {
            if (import.meta.dev) {
                console.log(`[Boundaries] Jurisdiction changed: ${oldId} -> ${newId}, reloading`);
            }
            boundaries.value = null;
            isLoading.value = true;
            error.value = null;
            lazyBoundary.value = null;
            // Use the same initializer as useMarkASpotSettings to ensure the key is
            // always initialised, even if this composable runs before that one.
            useState<boolean>('mas-boundary-fetch-failed', () => false).value = false;
            // shouldLoadBoundaries watcher will trigger loadBoundaries()
        }
    });

    /**
   * Check if a point is within the defined boundaries
   * @param lat Latitude of the point to check
   * @param lng Longitude of the point to check
   * @returns Boolean indicating if the point is within boundaries or null if boundaries not loaded
   */
    const isPointInBoundary = (lat: number, lng: number): boolean | null => {
    // If boundaries feature is disabled, always return true
        if (!boundaryConfig.value.enabled) {
            return true;
        }

        if (isLoading.value || error.value || !boundaries.value || !boundaries.value.features || !boundaries.value.features.length) {
            return null; // Boundaries not loaded yet or error occurred
        }

        // Extract the actual MultiPolygon geometry from the FeatureCollection
        const geometry = boundaries.value.features[0]?.geometry;
        if (!geometry) {
            return false;
        }

        // For MultiPolygon type from GeoJSON.
        // Each polygon's rings are [exterior, ...holes]; honour the holes so a
        // point inside an enclave is rejected (matches backend GeoJsonBoundary).
        if (geometry.type === 'MultiPolygon') {
            return (geometry.coordinates as number[][][][]).some((polygon: number[][][]) =>
                isPointInPolygonWithHoles([lng, lat], polygon)
            );
        }

        // For Polygon type from GeoJSON (rings = [exterior, ...holes]).
        if (geometry.type === 'Polygon') {
            return isPointInPolygonWithHoles([lng, lat], geometry.coordinates as number[][][]);
        }

        return false; // Unsupported geometry type
    };

    /**
   * Point-in-polygon test honouring interior rings (holes).
   * A point is inside iff it is inside the exterior ring AND not inside any
   * hole ring. Mirrors the backend GeoJsonBoundary::pointInPolygonWithHoles().
   * @param point [longitude, latitude] point to check
   * @param rings Array of rings: first = exterior, subsequent = holes
   * @returns Boolean indicating if the point is within the polygon
   */
    const isPointInPolygonWithHoles = (point: number[], rings: number[][][]): boolean => {
        if (!rings || !rings.length || !rings[0]) {
            return false;
        }

        // Must be inside the exterior ring.
        if (!isPointInPolygon(point, rings[0])) {
            return false;
        }

        // Must not be inside any hole.
        for (let i = 1; i < rings.length; i++) {
            if (isPointInPolygon(point, rings[i])) {
                return false;
            }
        }

        return true;
    };

    /**
   * Ray casting algorithm for point in polygon test
   * @param point [longitude, latitude] point to check
   * @param polygon Array of [longitude, latitude] points forming the polygon
   * @returns Boolean indicating if the point is within the polygon
   */
    const isPointInPolygon = (point: number[], polygon: number[][]): boolean => {
        // Guard against malformed rings from untrusted GeoJSON sources (admin-entered
        // field_boundary or static file). A valid ring needs at least 3 vertices.
        if (!Array.isArray(polygon) || polygon.length < 3) {
            return false;
        }

        // Ray-casting algorithm
        const x = point[0], y = point[1];

        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i]?.[0], yi = polygon[i]?.[1];
            const xj = polygon[j]?.[0], yj = polygon[j]?.[1];

            // Skip degenerate vertices (missing or non-numeric coordinates)
            if (xi === undefined || yi === undefined || xj === undefined || yj === undefined) {
                continue;
            }

            const intersect = ((yi > y) !== (yj > y)) &&
              (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    /**
   * Gets the boundary polygon as GeoJSON for rendering on a map
   * @returns The boundary GeoJSON or null if not loaded or feature disabled
   */
    const getBoundaryGeoJSON = (): FeatureCollection | null => {
        // Guard on enabled first, same as other accessors, to prevent the disabled-feature
        // sentinel FeatureCollection from being fed to MapLibre as a degenerate source.
        if (!boundaryConfig.value.enabled) {
            return null;
        }

        if (isLoading.value || error.value || !boundaries.value || !boundaryConfig.value.showBoundaryOnMap) {
            return null;
        }

        return boundaries.value;
    };

    /**
   * Gets a user-friendly message about boundary status
   * @param lat Latitude of the point to check
   * @param lng Longitude of the point to check
   * @returns String message about boundary status
   */
    const getBoundaryMessage = (lat: number, lng: number): string => {
    // If boundaries feature is disabled, return empty message
        if (!boundaryConfig.value.enabled) {
            return '';
        }

        if (isLoading.value) {
            return t('boundaries.loading');
        }

        if (error.value) {
            return t('boundaries.error');
        }

        const isInBoundary = isPointInBoundary(lat, lng);

        if (isInBoundary === null) {
            return t('boundaries.notLoaded');
        }

        // Get the name of the boundary location for better user feedback
        const locationName = boundaryProperties.value?.NAME_LOCAL || boundaryProperties.value?.NAME_ENGLI || 'city';

        // If strict validation is disabled, just return informational message if outside boundary
        if (!boundaryConfig.value.strictValidation && !isInBoundary) {
            return t('boundaries.outsideNonStrict', { locationName });
        }

        return isInBoundary
            ? '' // No message needed when inside boundary
            : t('boundaries.outsideStrict', { locationName });
    };

    /**
   * Validates if a location is valid according to boundary constraints
   * @param lat Latitude to validate
   * @param lng Longitude to validate
   * @returns Object with validation result and error message
   */
    const validateLocation = (lat: number, lng: number): { valid: boolean, message: string } => {
    // If boundaries feature is disabled, always valid
        if (!boundaryConfig.value.enabled) {
            return { valid: true, message: '' };
        }

        const isInBoundary = isPointInBoundary(lat, lng);

        // If boundaries aren't loaded yet, never block the report flow.
        // The boundary is lazy-loaded client-only; there is a real window between
        // mount and the first fetch completing where null is returned. Blocking here
        // (even under strict mode) would reject valid reports submitted during that
        // window, which violates the project rule "postcode/boundary never blocks".
        if (isInBoundary === null) {
            return {
                valid: true,
                message: t('boundaries.validationUnavailable')
            };
        }

        // Get the name of the boundary location for better user feedback
        const locationName = boundaryProperties.value?.NAME_LOCAL || boundaryProperties.value?.NAME_ENGLI || 'city';

        // If location is inside boundary, it's valid
        if (isInBoundary) {
            return { valid: true, message: '' };
        }

        // If outside boundary but strict validation is disabled, it's still valid but with a warning
        if (!boundaryConfig.value.strictValidation) {
            return {
                valid: true,
                message: t('boundaries.outsideNonStrict', { locationName })
            };
        }

        // Otherwise, invalid
        return {
            valid: false,
            message: t('boundaries.outsideStrict', { locationName })
        };
    };

    return {
        isLoading,
        error,
        boundaryConfig,
        boundaryProperties,
        isPointInBoundary,
        getBoundaryMessage,
        getBoundaryGeoJSON,
        validateLocation
    };
}
