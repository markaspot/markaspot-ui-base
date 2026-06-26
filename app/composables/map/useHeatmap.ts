import type { Map as MapLibreMap, HeatmapLayerSpecification } from 'maplibre-gl';
import { toValue, type MaybeRefOrGetter } from 'vue';

// Heatmap layer management

/**
 * Heatmap Composable
 *
 * Provides  heatmap functionality for the application.
 *
 * @returns Reactive state and methods for heatmap functionality
 */

export function useHeatmap(map: MapLibreMap, initialEnabled: MaybeRefOrGetter<boolean> = false) {
    const layerId = 'reports-heat';
    // Get client configuration for zoom levels
    const { zoomLevels } = useMapSettings();
    // Track whether heatmap is enabled by the user (regardless of zoom level).
    // Initialized from the (possibly not-yet-resolved) config value.
    const heatmapEnabled = ref(toValue(initialEnabled));

    // The tenant's `heatmap.initialState` config can resolve AFTER the map 'load'
    // event (async jurisdiction fetch). Adopt it when it arrives, but only while
    // the user has not manually toggled — their explicit choice wins thereafter.
    let userToggled = false;
    watch(() => toValue(initialEnabled), (enabled) => {
        if (userToggled || heatmapEnabled.value === enabled) return;
        heatmapEnabled.value = enabled;
        updateVisibilityOnZoom(map.getZoom());
    });

    // Add heatmap layer if not already present
    function addHeatmapLayer() {
        if (!map.getLayer(layerId)) {
            // Get configured heatmap zoom levels
            const heatmapZoom = zoomLevels.value.heatmap;

            // Create paint properties with configured zoom levels
            const paintProperties: HeatmapLayerSpecification['paint'] = {
                // Weight clusters sub-linearly by sqrt(point_count): a cluster
                // carries more heat than a single point but does not saturate the
                // density into a solid blob the way raw point_count does (and
                // without the old arbitrary `/ 40` damping factor). Cluster of 4 ->
                // weight 2, of 100 -> 10. Individual points (no point_count) weigh 1.
                'heatmap-weight': [
                    'case',
                    ['has', 'point_count'], ['sqrt', ['get', 'point_count']],
                    1
                ],
                // Intensity increases with zoom
                'heatmap-intensity': [
                    'interpolate', ['linear'], ['zoom'],
                    heatmapZoom.minZoom, 0.5,
                    heatmapZoom.maxZoom, 1.5
                ],
                // Color ramp for heatmap
                'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0,0,255,0)',
                    0.1, 'rgba(65,105,225,0.5)',
                    0.3, 'rgba(0,255,255,0.6)',
                    0.5, 'rgba(0,255,0,0.7)',
                    0.7, 'rgba(255,255,0,0.8)',
                    0.9, 'rgba(255,0,0,0.9)',
                    1, 'rgba(255,0,0,1)'
                ],
                // Radius based on zoom
                'heatmap-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    heatmapZoom.minZoom, 10,
                    heatmapZoom.maxZoom, 100
                ]
            };

            // Apply opacity with optional fade-out effect
            if (heatmapZoom.fadeOut) {
                // Clamp fadeStartZoom so it never equals or exceeds maxZoom,
                // which would produce non-ascending interpolate stops and make MapLibre throw.
                const fadeStartZoom = Math.max(heatmapZoom.minZoom, heatmapZoom.maxZoom - 1);
                if (fadeStartZoom < heatmapZoom.maxZoom) {
                    // Create a fade-out effect between 90% and 100% of max zoom
                    paintProperties['heatmap-opacity'] = [
                        'interpolate', ['linear'], ['zoom'],
                        fadeStartZoom, 0.8, // Full opacity at fadeStartZoom
                        heatmapZoom.maxZoom, 0 // Fade to transparent at maxZoom
                    ];
                } else {
                    // Zoom range too narrow to fade — fall back to constant opacity
                    paintProperties['heatmap-opacity'] = 0.8;
                }
            } else {
                // Use constant opacity
                paintProperties['heatmap-opacity'] = 0.8;
            }

            try {
                map.addLayer({
                    id: layerId,
                    type: 'heatmap',
                    source: 'reports-geojson',
                    minzoom: heatmapZoom.minZoom,
                    maxzoom: heatmapZoom.maxZoom,
                    layout: {
                        // Set initial visibility based on the enabled state
                        visibility: heatmapEnabled.value ? 'visible' : 'none'
                    },
                    paint: paintProperties
                });
            } catch (err) {
                console.warn('[useHeatmap] addLayer failed:', err);
            }
        }
    }

    // Toggle heatmap visibility on/off
    function toggleHeatmap(): boolean {
        if (!map.getLayer(layerId)) return false;

        // From here the user owns the state; config changes no longer override it.
        userToggled = true;
        // Toggle the enabled state
        heatmapEnabled.value = !heatmapEnabled.value;

        // Delegate to updateVisibilityOnZoom so the zoom-range check is the single
        // source of truth. Unconditionally setting 'visible'/'none' here would
        // desync with updateVisibilityOnZoom when the current zoom is out of range.
        updateVisibilityOnZoom(map.getZoom());

        return heatmapEnabled.value;
    }

    // Update visibility based on zoom level, respecting user preference
    function updateVisibilityOnZoom(zoom: number): void {
        if (!map.getLayer(layerId)) return;

        // Only show if both conditions are true:
        // 1. User has enabled heatmap
        // 2. Current zoom level is within range
        const heatmapZoom = zoomLevels.value.heatmap;
        const isInZoomRange = zoom >= heatmapZoom.minZoom && zoom < heatmapZoom.maxZoom;
        const shouldShow = heatmapEnabled.value && isInZoomRange;

        map.setLayoutProperty(
            layerId,
            'visibility',
            shouldShow ? 'visible' : 'none'
        );
    }

    // Check if heatmap is currently visible (actual layout property, not just the enabled flag).
    // When the zoom is out of range the layer may be enabled but hidden by updateVisibilityOnZoom.
    function isHeatmapVisible(): boolean {
        if (!map.getLayer(layerId)) return false;
        return map.getLayoutProperty(layerId, 'visibility') === 'visible';
    }

    return {
        layerId,
        addHeatmapLayer,
        toggleHeatmap,
        updateVisibilityOnZoom,
        isHeatmapVisible,
        heatmapEnabled
    };
}
