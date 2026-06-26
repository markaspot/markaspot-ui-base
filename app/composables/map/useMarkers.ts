import type { Map as MapLibreMap } from 'maplibre-gl';

// Marker layer management

/**
 * Markers Composable
 *
 * Manages map markers using a single symbol layer with pin-style icons.
 * Pin icons are composite images (pin shape + category icon) registered via map.addImage().
 *
 * @returns Reactive state and methods for markers functionality
 */

interface UseMarkersOptions {
    /** When true, markers are visible at all zoom levels (used for read-only detail views) */
    forceShowMarkers?: boolean
}

export function useMarkers(map: MapLibreMap, options: UseMarkersOptions = {}) {
    const symbolLayerId = 'reports-symbols';

    // Get client configuration for zoom levels and magnitude scaling
    const { zoomLevels, magnitudeScaling } = useMapSettings();

    // Add pin marker symbol layer
    function addMarkerLayers() {
        // When forceShowMarkers is true (read-only detail view), show markers at any zoom level
        const markerMinZoom = options.forceShowMarkers ? 0 : zoomLevels.value.markers.minZoom;

        if (!map.getLayer(symbolLayerId)) {
            map.addLayer({
                id: symbolLayerId,
                type: 'symbol',
                source: 'reports-geojson',
                filter: ['!', ['has', 'point_count']],
                minzoom: markerMinZoom,
                layout: {
                    'icon-image': ['get', 'icon'],
                    'icon-size': magnitudeScaling.value.enabled
                        ? [
                            'interpolate', ['linear'], ['get', 'magnitude'],
                            0, magnitudeScaling.value.minScale,
                            1, magnitudeScaling.value.maxScale
                        ]
                        : 1.0,
                    'icon-anchor': 'bottom',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                },
                paint: {
                    'icon-opacity': 1
                }
            });
        }
    }

    return { symbolLayerId, addMarkerLayers };
}
