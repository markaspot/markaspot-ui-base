import type maplibregl from 'maplibre-gl';
import type { MapGeoJSONFeature } from 'maplibre-gl';

interface MapLoadHandlerOptions {
    map: Ref<maplibregl.Map | null>
    props: any
    emit: any
    setMapFunctions: (fn: any) => void
    applyMaxBoundsFromBoundary: () => void
    handleMapClick: (e: maplibregl.MapMouseEvent & { features?: MapGeoJSONFeature[] }) => Promise<void>
    recordMetric: (name: string, value: number, type?: string) => void
    startTiming: (key: string) => (() => void) | undefined
    setupKeyboardNavigation: (onSelect: (report: any) => void, onClose: () => void, spiderfy?: any) => void
    updateUserLocationMarker: (coords: { lat: number, lng: number }) => void
}

export function useMapLoadHandler(options: MapLoadHandlerOptions) {
    const {
        map,
        props,
        emit,
        setMapFunctions,
        applyMaxBoundsFromBoundary,
        handleMapClick,
        recordMetric,
        startTiming,
        setupKeyboardNavigation,
        updateUserLocationMarker
    } = options;

    // Guard: runInitialization must run exactly once per map instance.
    // MapLibre fires 'load' once per map, but re-entry is possible on test
    // re-mounts or if setupMapLoadHandler is called again; the flag ensures
    // event-handler + marker-watcher setup is never duplicated.
    let initialized = false;

    const setupMapLoadHandler = async () => {
        if (!map.value) return;

        map.value.on('load', async () => {
            // Helper function to run all initialization
            const runInitialization = async () => {
                if (initialized) return;
                initialized = true;
                const { useMap } = await import('@/composables/map/useMap');
                const mapFunctions = useMap(map.value!, props, emit);
                setMapFunctions(mapFunctions);

                await mapFunctions.initializeMarkerLayers();
                applyMaxBoundsFromBoundary();
                emit('map-init', map.value!);

                // Set up map event handlers after mapFunctions is available
                const { useMapEventHandlers } = await import('@/composables/useMapEventHandlers');
                const { setupEventHandlers } = useMapEventHandlers({
                    map,
                    mapFunctions,
                    handleMapClick,
                    recordMetric,
                    emit
                });
                setupEventHandlers();

                // Set up marker watcher
                const { useMapMarkerWatcher } = await import('@/composables/useMapMarkerWatcher');
                const { setupMarkerWatcher } = useMapMarkerWatcher({
                    markers: () => props.markers,
                    mapFunctions,
                    startTiming: startTiming as (name: string) => () => void,
                    hasStatusFilter: () => props.hasStatusFilter || false
                });
                setupMarkerWatcher();

                // Set up keyboard navigation with cluster expansion support
                setupKeyboardNavigation(
                    (report: any) => {
                        emit('select-report', { report });
                    },
                    () => {
                        emit('close-modal');
                    },
                    {
                        handleClusterClick: mapFunctions.handleClusterClick,
                        unspiderfyAll: mapFunctions.unspiderfyAll,
                        isSpiderfied: mapFunctions.isSpiderfied
                    }
                );

                // Update user location marker if coordinates are available
                if (props.geolocatedCoords) {
                    updateUserLocationMarker(props.geolocatedCoords);
                }

                // Only emit initial bounds update if loadMarkersOnInit is true
                const { useRuntimeConfig } = await import('#app');
                const { useMarkASpotConfig } = await import('@/composables/core/useMarkASpotConfig');
                const runtimeConfig = useRuntimeConfig();
                const { clientConfig } = useMarkASpotConfig();
                const loadMarkersOnInit = clientConfig.value?.features?.map?.loadMarkersOnInit ??
                  runtimeConfig.public.clientConfig.features?.map?.loadMarkersOnInit;
                if (loadMarkersOnInit === true) {
                    const bounds = map.value!.getBounds();
                    emit('update:bounds', {
                        minLat: bounds.getSouth(),
                        maxLat: bounds.getNorth(),
                        minLng: bounds.getWest(),
                        maxLng: bounds.getEast()
                    });
                }
            };

            // If style is already loaded, run immediately; otherwise wait for styledata
            if (map.value!.isStyleLoaded()) {
                await runInitialization();
            } else {
                map.value!.once('styledata', runInitialization);
            }
        });
    };

    return {
        setupMapLoadHandler
    };
}
