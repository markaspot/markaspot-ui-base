// composables/map/useMapSettings.ts

/**
 * Composable to manage configurable map settings like zoom levels.
 * Reads from useMarkASpotConfig() which merges client defaults with
 * Drupal API jurisdiction overrides (via defu).
 *
 * Two separate concerns:
 * 1. clusterMaxZoom (source-level): Controls when MapLibre stops clustering.
 *    Must be high enough so overlapping points remain clustered for Spiderfy.
 *    At high zoom, only truly overlapping points (within clusterRadius pixels)
 *    remain clustered. Isolated points become individual features.
 * 2. Layer visibility (visual): Controls what the user sees at each zoom.
 *    Clusters and markers coexist at high zoom: clusters for overlapping
 *    points (clickable via Spiderfy), markers for isolated points.
 */

// Source-level: match map maxZoom so overlapping points stay clustered
// at all zoom levels. Spiderfy handles expansion on click.
const DEFAULT_CLUSTER_MAX_ZOOM = 22;
// MapLibre's hard ceiling for source maxzoom. clusterMaxZoom must stay
// at least one step below so the source can satisfy maxzoom > clusterMaxZoom
// (MapLibre warns on equality and rejects values above 24).
const MAPLIBRE_MAX_ZOOM = 24;
const MAX_CLUSTER_MAX_ZOOM = MAPLIBRE_MAX_ZOOM - 1;

// Visual layer thresholds (independent of source clustering).
const DEFAULT_HEATMAP_MAX_ZOOM = 11;
const DEFAULT_CLUSTER_MIN_ZOOM = 10;
const DEFAULT_MARKER_MIN_ZOOM = 14;

// Static defaults - no reactive dependencies, plain object avoids
// unnecessary computed allocations on every composable call.
const DEFAULT_ZOOM_LEVELS = {
    heatmap: {
        minZoom: 0,
        maxZoom: DEFAULT_HEATMAP_MAX_ZOOM,
        fadeOut: true
    },
    clusters: {
        minZoom: DEFAULT_CLUSTER_MIN_ZOOM
    },
    markers: {
        minZoom: DEFAULT_MARKER_MIN_ZOOM
    }
} as const;

export function useMapSettings() {
    const { clientConfig } = useMarkASpotConfig();

    // Source-level clusterMaxZoom from jurisdiction config, with fallback
    // and clamp leaving room for the source's maxzoom to sit one step above.
    const clusterMaxZoom = computed(() => {
        const configured = clientConfig.value?.features?.map?.clusterMaxZoom ?? DEFAULT_CLUSTER_MAX_ZOOM;
        return Math.min(configured, MAX_CLUSTER_MAX_ZOOM);
    });

    // GeoJSON source maxzoom. MapLibre requires strictly greater than
    // clusterMaxZoom, otherwise it warns and clustering caps at the
    // source's tile-pyramid ceiling (default 18) instead of the
    // requested clusterMaxZoom.
    const sourceMaxZoom = computed(() =>
        Math.min(clusterMaxZoom.value + 1, MAPLIBRE_MAX_ZOOM)
    );

    // Merge jurisdiction overrides onto static defaults.
    const zoomLevels = computed(() => {
        const layerVisibility = clientConfig.value?.features?.map?.layerVisibility;

        if (layerVisibility) {
            return {
                heatmap: { ...DEFAULT_ZOOM_LEVELS.heatmap, ...layerVisibility.heatmap },
                clusters: { ...DEFAULT_ZOOM_LEVELS.clusters, ...layerVisibility.clusters },
                markers: { ...DEFAULT_ZOOM_LEVELS.markers, ...layerVisibility.markers }
            };
        }

        return DEFAULT_ZOOM_LEVELS;
    });

    // Pin border color: 'auto' = dark/light mode adaptive, or explicit hex
    const markerBorderColor = computed(() =>
        clientConfig.value?.features?.map?.markers?.borderColor ?? 'auto'
    );

    // Selected-pin animation config: true/false or { enabled, type }
    const selectedAnimation = computed(() => {
        const config = clientConfig.value?.features?.map?.markers?.selectedAnimation;
        if (config === false) return { enabled: false, type: 'glow' as const };
        if (config === true || config === undefined) return { enabled: true, type: 'glow' as const };
        return { enabled: config.enabled !== false, type: config.type || 'glow' };
    });

    // Magnitude-based pin scaling: scale pin sizes by hazard level, age, or status
    const magnitudeScaling = computed(() => {
        const rawConfig = clientConfig.value?.features?.map?.markers?.magnitudeScaling;
        const config = typeof rawConfig === 'object' && rawConfig !== null ? rawConfig : null;
        if (!config || rawConfig === false) {
            return {
                enabled: false,
                factors: { hazardLevel: true, age: false, status: false },
                minScale: 0.7,
                maxScale: 1.5
            };
        }
        return {
            enabled: true,
            factors: {
                hazardLevel: config.factors?.hazardLevel !== false,
                age: config.factors?.age === true,
                status: config.factors?.status === true
            },
            minScale: config.minScale ?? 0.7,
            maxScale: config.maxScale ?? 1.5
        };
    });

    // Cluster circles use dominant category color for stroke
    const dominantClusterColor = computed(() =>
        clientConfig.value?.features?.map?.clusters?.dominantColor === true
    );

    // Animated decluster transition: animate pins outward from cluster center on zoom-in.
    // Disabled by default. Accepts boolean or { enabled, duration } object.
    const declusterAnimation = computed(() => {
        const rawConfig = clientConfig.value?.features?.map?.clusters?.animateExpand;
        if (rawConfig == null || rawConfig === false) return { enabled: false, duration: 300 };
        if (rawConfig === true) return { enabled: true, duration: 300 };
        const config = rawConfig;
        return {
            enabled: config.enabled !== false,
            duration: config.duration ?? 300
        };
    });

    return {
        zoomLevels,
        clusterMaxZoom,
        sourceMaxZoom,
        markerBorderColor,
        selectedAnimation,
        magnitudeScaling,
        dominantClusterColor,
        declusterAnimation
    };
}
