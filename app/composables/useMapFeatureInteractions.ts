import type maplibregl from 'maplibre-gl';
import type { Request } from '~~/types';

interface FeatureInteractionsOptions {
    map: Ref<maplibregl.Map | null>
    /**
     * Accept a getter so the handler always resolves against the live markers
     * array, not the snapshot captured at construction time. Pass
     * `() => props.markers` from the caller site (Map.vue:391).
     */
    markers: () => Request[]
    emit: (event: string, ...args: unknown[]) => void
}

export function useMapFeatureInteractions(options: FeatureInteractionsOptions) {
    const { map, markers, emit } = options;

    const handleReportFeatureClick = (e: maplibregl.MapMouseEvent): boolean => {
        if (!map.value) return false;

        try {
            const queryLayers = ['reports-symbols'].filter(l => map.value!.getLayer(l));
            if (queryLayers.length === 0) return false;

            const reportFeatures = map.value.queryRenderedFeatures(e.point, {
                layers: queryLayers
            });

            if (reportFeatures.length > 0) {
                const feature = reportFeatures[0];
                // Normalise both sides to string — vector-tile properties may
                // coerce numeric ids to numbers while service_request_id is a string.
                const list = markers();
                const report = list.find(m => String(m.service_request_id) === String(feature.properties?.id));
                if (report) {
                    emit('select-report', { report, mapInstance: map.value });
                    return true;
                }
            }
        } catch {
            // Ignore tile parsing errors from basemap
        }
        return false;
    };

    const handleClusterClick = (e: maplibregl.MapMouseEvent): boolean => {
        if (!map.value) return false;

        try {
            if (!map.value.getLayer('clusters')) return false;

            const clusterFeatures = map.value.queryRenderedFeatures(e.point, {
                layers: ['clusters']
            });

            if (clusterFeatures.length > 0) {
                const clusterCenter = (clusterFeatures[0].geometry as any).coordinates;
                const currentZoom = map.value.getZoom();

                map.value.flyTo({
                    center: clusterCenter,
                    zoom: currentZoom + 2,
                    duration: 500
                });
                return true;
            }
        } catch {
            // Ignore tile parsing errors from basemap
        }
        return false;
    };

    return {
        handleReportFeatureClick,
        handleClusterClick
    };
}
