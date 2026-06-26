import type * as maplibregl from 'maplibre-gl';
import type { BoundsType, Request } from '~~/types';
import { useRequestsStore } from '~/stores/requests';
import { PIN_ANCHOR_TO_CENTER_OFFSET, PIN_PULSE_CENTER_OFFSET } from '@/composables/map/useMapIcons';
import { useSelectedMarkerAnimation } from '@/composables/map/useSelectedMarkerAnimation';

/**
 * Map Manager Composable
 *
 * Manages MapLibre GL map instance, coordinates, bounds, and location-based operations.
 * Provides centralized map state management and coordinates with the requests store
 * for spatial data visualization.
 *
 * Features:
 * - Map instance management and initialization
 * - Bounds tracking and request filtering
 * - Geolocation and coordinate handling
 * - Map navigation and centering
 */
export function useMapManager() {
    const requestsStore = useRequestsStore();

    // Map instance and related state
    const mainMapInstance = shallowRef<maplibregl.Map | null>(null);
    const mapRef = ref<any>(null);
    const mapCenter = ref<{
        lat: number
        lng: number
        address?: string
        addressObj?: Record<string, unknown>
    } | null>(null);
    const geolocatedCoords = ref<{ lat: number, lng: number } | null>(null);

    // Guard flag: true while the initial fitBounds animation is in progress.
    // External consumers (e.g. bounds handler) can check this to skip redundant API calls.
    const isInitialFit = ref(false);

    // Selected-pin animation (bounce/pulse/glow, config-driven)
    const selectedMarkerAnimation = useSelectedMarkerAnimation(mainMapInstance);

    // Pulse marker for selected report (single HTML marker overlay)
    let pulseMarker: maplibregl.Marker | null = null;

    // Theme colors hoisted to setup so they are bound in a synchronous
    // Vue composition context and not re-created on every highlight callback.
    const { primaryColor, getPrimaryWithOpacity } = useThemeColors();

    // Pending moveend handler for flyToRequest highlights. Stored so the
    // previous handler can be cancelled when a new flyToRequest arrives
    // before the animation completes (prevents double-fire and duplicate
    // source/layer errors).
    let pendingHighlightHandler: (() => void) | null = null;

    // Watcher for the auto-fitBounds-on-first-load path. Kept at composable
    // scope so onScopeDispose can stop it if the page unmounts before any
    // requests arrive (empty jurisdiction, fetch error, etc.).
    let initWatcherStop: (() => void) | undefined;

    /**
   * Initialize the map instance
   */
    const handleMapInit = (instance: maplibregl.Map) => {
        mainMapInstance.value = instance;

        // Check if we should load markers on init - use dynamic config from API
        const runtimeConfig = useRuntimeConfig();
        const { clientConfig } = useMarkASpotConfig();
        const loadMarkersOnInit = clientConfig.value?.features?.map?.loadMarkersOnInit ??
          runtimeConfig.public.clientConfig.features?.map?.loadMarkersOnInit;
        if (loadMarkersOnInit) {
            // The initial fetch is owned by useMapLoadHandler's update:bounds
            // emit so it runs through the page-level handleBoundsUpdate guards
            // (isInitialFit, isSearchActive). Firing a parallel direct fetch
            // from here bypassed those guards and produced a redundant call
            // with the pre-fitBoundsToRequests viewport.

            // Auto-fitBounds: once the first batch of requests arrives, fit the map
            // to show all markers. Uses a one-shot watcher that stops itself.
            //
            // Holder object + optional-call guards against a TDZ trap:
            // `immediate: true` makes the handler run synchronously during the
            // `watch()` call, so if `allRequestsList` is already populated the
            // handler fires before the returned stop-fn has been assigned.
            // Reading `watcherHandle.stop` is always safe (undefined until the
            // watch() call returns), and the optional-call no-ops until then.
            const watcherHandle: { stop?: () => void } = {};
            watcherHandle.stop = watch(
                () => requestsStore.allRequestsList,
                (requests) => {
                    if (!requests || requests.length === 0) return;

                    // Set guard so the moveend from fitBounds is not treated
                    // as a user interaction (avoids redundant API call)
                    isInitialFit.value = true;
                    fitBoundsToRequests(requests).then(() => {
                        // Wait for the fitBounds animation to complete before clearing the guard.
                        // MapLibre fires moveend after the animation (duration: 1000ms in fitBoundsToRequests).
                        if (mainMapInstance.value) {
                            mainMapInstance.value.once('moveend', () => {
                                isInitialFit.value = false;
                            });
                        } else {
                            isInitialFit.value = false;
                        }
                    });

                    // One-shot: stop watching after first successful fit.
                    // Optional-call handles the synchronous-immediate case
                    // (see TDZ note above).
                    watcherHandle.stop?.();
                },
                { immediate: true }
            );
            // Keep a composable-scope reference so onScopeDispose can stop
            // the watcher if the page unmounts before any requests arrive.
            initWatcherStop = watcherHandle.stop;
        }
    };

    /**
   * Handle map bounds updates for loading requests
   */
    const handleBoundsUpdate = async (bounds: BoundsType, isDetailView = false) => {
        await requestsStore.handleBoundsUpdate(bounds, isDetailView);
    };

    /**
   * Handle location selection from search or geocoding
   */
    const handleLocationSelect = (location: { lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> }) => {
        mapCenter.value = location;
    };

    /**
   * Handle geolocation updates
   */
    const handleGeolocate = (coords: { lat: number, lng: number }) => {
        geolocatedCoords.value = coords;

        // Fly to the coordinates
        if (mainMapInstance.value) {
            mainMapInstance.value.flyTo({
                center: [coords.lng, coords.lat],
                zoom: 16,
                duration: 1500
            });
        }
    };

    /**
   * Handle tilt changes on the map
   */
    const handleTiltChange = (tiltValue: number) => {
        if (mainMapInstance.value) {
            mainMapInstance.value.setPitch(tiltValue);
        }
    };

    /**
   * Fly to a specific request location with optional highlighting
   */
    const flyToRequest = async (request: Request, options: { highlight?: boolean } = {}) => {
        if (mainMapInstance.value && request) {
            await nextTick();

            const map = mainMapInstance.value;
            const lng = Number(request.long);
            const lat = Number(request.lat);

            // Fly to request with a minimum zoom level for street-level detail
            const currentZoom = map.getZoom();
            const targetZoom = Math.max(currentZoom + 1, 16);
            map.flyTo({
                center: [lng, lat],
                zoom: targetZoom,
                duration: 1000
            });

            // Add highlight if requested
            if (options.highlight) {
                // Cancel any in-flight highlight handler from a previous call so
                // only the latest selection fires (prevents double addSource/addLayer
                // errors when the user selects a new report before the flyTo completes).
                if (pendingHighlightHandler) {
                    map.off('moveend', pendingHighlightHandler);
                    pendingHighlightHandler = null;
                }

                const handler = () => {
                    pendingHighlightHandler = null;

                    // Re-query layer/source at execution time; the stale pre-flyTo
                    // boolean would reflect the old state and could miss concurrent
                    // clearHighlight calls that ran between flyTo and moveend.
                    if (map.getLayer('keyboard-highlight')) {
                        try {
                            map.removeLayer('keyboard-highlight');
                            map.removeSource('keyboard-highlight');
                        } catch (e) {
                            if (import.meta.dev) {
                                console.warn('flyToRequest: failed to clear previous highlight', e);
                            }
                        }
                    }

                    // Dim other markers and pulse selected
                    if (request.service_request_id) {
                        dimOtherMarkers(request.service_request_id, { lng, lat });
                    }

                    // Create highlight data
                    const highlightData: GeoJSON.FeatureCollection = {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [lng, lat]
                            },
                            properties: {
                                id: request.service_request_id
                            }
                        }]
                    };

                    try {
                        // Add highlight source and layer
                        map.addSource('keyboard-highlight', {
                            type: 'geojson',
                            data: highlightData
                        });

                        // Find the first symbol layer to add our highlight before it.
                        // Guard against getStyle() returning undefined before style load.
                        const style = map.getStyle();
                        const firstSymbolId = style?.layers?.find(layer => layer.type === 'symbol')?.id;

                        map.addLayer({
                            id: 'keyboard-highlight',
                            type: 'circle',
                            source: 'keyboard-highlight',
                            paint: {
                                'circle-radius': 50,
                                'circle-color': getPrimaryWithOpacity(0.4),
                                'circle-stroke-width': 8,
                                'circle-stroke-color': primaryColor.value,
                                'circle-stroke-opacity': 1,
                                // Pin markers use icon-anchor:bottom, shift highlight up to circle center
                                'circle-translate': [0, -PIN_ANCHOR_TO_CENTER_OFFSET]
                            }
                        }, firstSymbolId); // Add before symbol layers so it appears under markers
                    } catch (error) {
                        if (import.meta.dev) {
                            console.warn('flyToRequest: error adding highlight layer', error);
                        }
                    }
                };

                pendingHighlightHandler = handler;
                map.once('moveend', handler);
            }
        }
    };

    /**
     * Remove pulse marker overlay
     */
    const removePulseMarker = () => {
        if (pulseMarker) {
            pulseMarker.remove();
            pulseMarker = null;
        }
    };

    /**
     * Add a pulsing ring around the selected marker position
     */
    const addPulseMarker = async (lng: number, lat: number) => {
        if (!mainMapInstance.value) return;

        removePulseMarker();

        const { Marker } = await import('maplibre-gl');

        const el = document.createElement('div');
        el.className = 'pulse-marker';
        el.innerHTML = '<div class="pulse-ring"></div><div class="pulse-ring pulse-ring-delayed"></div>';

        pulseMarker = new Marker({ element: el, anchor: 'bottom', offset: [0, -PIN_PULSE_CENTER_OFFSET] })
            .setLngLat([lng, lat])
            .addTo(mainMapInstance.value);
    };

    /**
     * Dim other markers when focusing on one specific marker
     */
    const dimOtherMarkers = (selectedMarkerId: string, coords?: { lng: number, lat: number }) => {
        if (!mainMapInstance.value) return;

        const map = mainMapInstance.value;

        try {
            // Apply dimming to pin markers (opacity only)
            if (map.getLayer('reports-symbols')) {
                const idExpression = [
                    'case',
                    ['any',
                        ['==', ['get', 'service_request_id'], selectedMarkerId],
                        ['==', ['get', 'id'], selectedMarkerId],
                        ['==', ['to-string', ['get', 'service_request_id']], String(selectedMarkerId)]
                    ],
                    1, // Full opacity for selected
                    0.15 // Very dimmed for others
                ];

                map.setPaintProperty('reports-symbols', 'icon-opacity', idExpression);
            }

            // Add pulse ring at selected marker position
            if (coords) {
                addPulseMarker(coords.lng, coords.lat);

                // Trigger selected-pin animation (bounce/pulse/glow)
                selectedMarkerAnimation.show({
                    coordinates: [coords.lng, coords.lat],
                    featureId: selectedMarkerId
                });
            }
        } catch (error) {
            console.error('Error dimming markers:', error);
        }
    };

    /**
     * Restore normal appearance for all markers
     */
    const restoreMarkers = () => {
        if (!mainMapInstance.value) return;

        const map = mainMapInstance.value;

        try {
            // Restore pin markers to normal opacity
            if (map.getLayer('reports-symbols')) {
                map.setPaintProperty('reports-symbols', 'icon-opacity', 1);
            }

            // Remove pulse overlay
            removePulseMarker();

            // Remove selected-pin animation layers
            selectedMarkerAnimation.remove();
        } catch (error) {
            console.error('Error restoring markers:', error);
        }
    };

    /**
     * Clear highlight from the map and restore centered position
     */
    const clearHighlight = (selectedMarker?: Request, shouldRecenter = true) => {
        if (!mainMapInstance.value) return;

        const map = mainMapInstance.value;

        // Cancel any pending highlight handler so a queued once('moveend')
        // does not add the layer back immediately after we clear it.
        if (pendingHighlightHandler) {
            map.off('moveend', pendingHighlightHandler);
            pendingHighlightHandler = null;
        }

        try {
            if (map.getLayer('keyboard-highlight')) {
                map.removeLayer('keyboard-highlight');
            }
            if (map.getSource('keyboard-highlight')) {
                map.removeSource('keyboard-highlight');
            }
        } catch (error) {
            // getLayer/getSource already guard existence, so errors here indicate
            // a genuine problem (e.g. style not loaded, map destroyed).
            if (import.meta.dev) {
                console.warn('clearHighlight: unexpected error removing layer/source', error);
            }
        }

        // Also restore normal marker appearance
        restoreMarkers();

        // Pan back to center the selected marker and restore normal view when modal closes
        if (shouldRecenter && selectedMarker) {
            const lng = Number(selectedMarker.long);
            const lat = Number(selectedMarker.lat);

            map.easeTo({
                center: [lng, lat],
                zoom: 16, // Pull back to neighborhood view
                pitch: 0, // Reset tilt to flat view
                bearing: 0, // Keep north orientation
                offset: [0, 0], // Reset to no offset (centered on marker)
                duration: 1000 // Smooth transition back
            });
        }
    };

    /**
     * Clear the location marker from the map
     */
    const clearLocationMarker = () => {
        if (mapRef.value?.clearLocationState) {
            mapRef.value.clearLocationState();
        }
    };

    /**
     * Clear the map center location
     * Used when starting a fresh new report to avoid passing stale location data
     */
    const clearMapCenter = () => {
        mapCenter.value = null;
    };

    /**
     * Fit map bounds to show a list of requests
     */
    const fitBoundsToRequests = async (requests: Request[]) => {
        if (!mainMapInstance.value || !requests || requests.length === 0) return;

        const map = mainMapInstance.value;

        // Calculate bounds from all requests
        const coordinates = requests
            .map((req) => {
                const lng = Number(req.long);
                const lat = Number(req.lat);
                return (!isNaN(lng) && !isNaN(lat)) ? [lng, lat] : null;
            })
            .filter((coord): coord is [number, number] => coord !== null);

        if (coordinates.length === 0) return;

        // Dynamically import LngLatBounds to avoid loading maplibre-gl on initial page load
        const { LngLatBounds } = await import('maplibre-gl');

        // Create bounds object
        const bounds = coordinates.reduce(
            (bounds, coord) => bounds.extend(coord),
            new LngLatBounds(coordinates[0], coordinates[0])
        );

        // Fit map to bounds with padding
        map.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            maxZoom: 16,
            duration: 1000
        });
    };

    // Teardown: guarantee cleanup regardless of whether individual cleanup
    // functions were called by the consumer (e.g. page unmounts mid-animation).
    onScopeDispose(() => {
        // Stop the init watcher if it never fired (empty jurisdiction, fetch error).
        initWatcherStop?.();

        // Cancel any pending highlight handler.
        if (pendingHighlightHandler && mainMapInstance.value) {
            mainMapInstance.value.off('moveend', pendingHighlightHandler);
            pendingHighlightHandler = null;
        }

        // Remove pulse/animation overlays.
        removePulseMarker();
        selectedMarkerAnimation.remove?.();
    });

    return {
    // State
        mainMapInstance: readonly(mainMapInstance),
        mapRef,
        mapCenter,
        geolocatedCoords: readonly(geolocatedCoords),
        isInitialFit: readonly(isInitialFit),

        // Methods
        handleMapInit,
        handleBoundsUpdate,
        handleLocationSelect,
        handleGeolocate,
        handleTiltChange,
        flyToRequest,
        clearHighlight,
        dimOtherMarkers,
        restoreMarkers,
        clearLocationMarker,
        clearMapCenter,
        fitBoundsToRequests
    };
}
