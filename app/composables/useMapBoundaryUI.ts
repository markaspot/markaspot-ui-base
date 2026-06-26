/**
 * Composable for managing boundary visualization on the map
 * Handles showing/hiding boundary polygons when location validation fails
 */

import type maplibregl from 'maplibre-gl';

interface BoundaryUIOptions {
    map: Ref<maplibregl.Map | null>
    boundaryConfig: Ref<any>
    getBoundaryGeoJSON: () => any
}

export function useMapBoundaryUI(options: BoundaryUIOptions) {
    const { map, boundaryConfig, getBoundaryGeoJSON } = options;

    // Boundary validation message state
    const boundaryValidationMessage = ref('');

    // Tracks whether the boundary layers are currently meant to be visible.
    // setStyle() wipes all custom sources/layers, and no watcher re-fires on a
    // pure style change, so reapplyAfterStyleChange() uses this flag to restore
    // the boundary after a theme/style rebuild without showing it when it was hidden.
    let boundaryVisible = false;

    /**
   * Update boundary layer visualization
   * Shows boundaries when validation fails or has warnings
   */
    const updateBoundaryLayer = () => {
        // Guard: addSource/addLayer throw 'Style is not done loading' when called
        // during or immediately after setStyle(). isStyleLoaded() is the canonical
        // check; callers may arrive from watcher paths that fire mid-style-load.
        if (!map.value || !map.value.isStyleLoaded()) return;

        // Remove existing boundary layers if they exist
        if (map.value.getLayer('boundary-fill')) {
            map.value.removeLayer('boundary-fill');
        }
        if (map.value.getLayer('boundary-line')) {
            map.value.removeLayer('boundary-line');
        }
        if (map.value.getSource('boundary')) {
            map.value.removeSource('boundary');
        }

        const boundaryData = getBoundaryGeoJSON();
        if (!boundaryData) {
            boundaryVisible = false;
            return;
        }

        // Add boundary source
        map.value.addSource('boundary', {
            type: 'geojson',
            data: boundaryData
        });

        // Add fill layer
        map.value.addLayer({
            id: 'boundary-fill',
            type: 'fill',
            source: 'boundary',
            paint: {
                'fill-color': boundaryConfig.value.fillColor || '#E60000',
                'fill-opacity': boundaryConfig.value.fillOpacity || 0.1
            }
        });

        // Add line layer
        map.value.addLayer({
            id: 'boundary-line',
            type: 'line',
            source: 'boundary',
            paint: {
                'line-color': boundaryConfig.value.fillColor || '#E60000',
                'line-width': 2,
                'line-dasharray': [2, 2]
            }
        });

        boundaryVisible = true;
    };

    /**
   * Re-add the boundary layers after a map style change (setStyle wipes them).
   * Only restores when the boundary was visible before the rebuild, so a hidden
   * boundary stays hidden. Call this from the style-watcher afterRebuild hook.
   */
    const reapplyAfterStyleChange = () => {
        if (boundaryVisible) updateBoundaryLayer();
    };

    /**
   * Show boundaries (add layers)
   */
    const showBoundaries = () => {
        updateBoundaryLayer();
    };

    /**
   * Hide boundaries (remove layers)
   */
    const hideBoundaries = () => {
        if (!map.value || !map.value.isStyleLoaded()) return;

        if (map.value.getLayer('boundary-fill')) {
            map.value.removeLayer('boundary-fill');
        }
        if (map.value.getLayer('boundary-line')) {
            map.value.removeLayer('boundary-line');
        }
        if (map.value.getSource('boundary')) {
            map.value.removeSource('boundary');
        }

        boundaryVisible = false;
        boundaryValidationMessage.value = '';
    };

    return {
        boundaryValidationMessage,
        updateBoundaryLayer,
        reapplyAfterStyleChange,
        showBoundaries,
        hideBoundaries
    };
}
