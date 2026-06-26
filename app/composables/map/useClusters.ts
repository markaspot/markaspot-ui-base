import type { Map as MapLibreMap } from 'maplibre-gl';
import { useColorPalette } from './useColorPalette';
import { getContrastingTextColor } from '@/utils/colorUtils';

// Cluster layer management

/**
 * Clusters Composable
 *
 * Provides clusters functionality for the application.
 *
 * @returns Reactive state and methods for clusters functionality
 */

export function useClusters(map: MapLibreMap) {
    const clusterLayerId = 'clusters';
    const countLayerId = 'cluster-count';

    // Get theme colors from centralized utility
    const { primaryColor } = useThemeColors();

    // Get client configuration for zoom levels and dominant color feature
    const { zoomLevels, dominantClusterColor } = useMapSettings();
    const { buildColorMatchExpression } = useColorPalette();

    // Add cluster circle and count layers
    function addClusterLayers() {
        const textColor = getContrastingTextColor(primaryColor.value);

        if (!map.getLayer(clusterLayerId)) {
            map.addLayer({
                id: clusterLayerId,
                type: 'circle',
                source: 'reports-geojson',
                filter: ['has', 'point_count'],
                minzoom: zoomLevels.value.clusters.minZoom,
                // No maxzoom - let clusters show at all zoom levels for spiderfy
                paint: {
                    'circle-color': primaryColor.value,
                    'circle-radius': [
                        'step', ['get', 'point_count'],
                        20,
                        100, 30,
                        750, 40
                    ],
                    'circle-opacity': 1,
                    'circle-stroke-width': 0,
                    'circle-stroke-opacity': 0
                }
            });
        }
        if (!map.getLayer(countLayerId)) {
            map.addLayer({
                id: countLayerId,
                type: 'symbol',
                source: 'reports-geojson',
                filter: ['has', 'point_count'],
                minzoom: zoomLevels.value.clusters.minZoom,
                // No maxzoom - let cluster count show at all zoom levels for spiderfy
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['Noto Sans Regular'],
                    'text-size': 14
                },
                paint: {
                    'text-color': textColor,
                    'text-opacity': 1
                }
            });
        }
    }

    /**
     * Update cluster stroke color after new data loads and palette has entries.
     * Called after GeoJSON source update so the match expression includes all colors.
     */
    function updateClusterColors() {
        if (!map.getLayer(clusterLayerId)) return;

        if (!dominantClusterColor.value) {
            // dominantClusterColor was toggled off while the layer persists — reset the stroke
            // that a previous call may have applied so clusters revert to plain circles.
            map.setPaintProperty(clusterLayerId, 'circle-stroke-width', 0);
            map.setPaintProperty(clusterLayerId, 'circle-stroke-opacity', 0);
            return;
        }

        // When dominant color is enabled, show a thin stroke with category colors
        const strokeColor = buildColorMatchExpression(primaryColor.value);
        map.setPaintProperty(clusterLayerId, 'circle-stroke-width', 2);
        map.setPaintProperty(clusterLayerId, 'circle-stroke-opacity', 0.5);
        map.setPaintProperty(clusterLayerId, 'circle-stroke-color', strokeColor);
    }

    return { clusterLayerId, countLayerId, addClusterLayers, updateClusterColors };
}
