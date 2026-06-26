import type maplibregl from 'maplibre-gl';

interface MapPickState {
    isActive: Ref<boolean>
    initialCoords: Ref<{ lat: number, lng: number } | null>
    [key: string]: unknown
}

interface MapPickWatcherOptions {
    map: Ref<maplibregl.Map | null>
    mapPick: MapPickState
    pickMarker: Ref<maplibregl.Marker | null>
    currentMarker?: Ref<maplibregl.Marker | null>
    flyToPickLocation: (coords: { lat: number, lng: number }) => void
}

export function useMapPickWatcher(options: MapPickWatcherOptions) {
    const { map, mapPick, pickMarker, currentMarker, flyToPickLocation } = options;

    // Hide the stale "current report" pin while the user is re-picking a
    // position. Two reasons: (1) the old pin no longer reflects the chosen
    // location once pick mode starts, (2) it visually stacks with the pick
    // marker when pick mode is entered from a facility/auto-filled report.
    // Toggle CSS on the element instead of removing the marker so we keep
    // its position + any listeners and can restore it on cancel.
    const setCurrentMarkerHidden = (hidden: boolean) => {
        const el = currentMarker?.value?.getElement();
        if (!el) return;
        if (hidden) {
            el.style.display = 'none';
        } else {
            el.style.removeProperty('display');
        }
    };

    // Tracks the pending "wait-for-map" poll so rapid toggles of
    // mapPick.isActive (e.g. true→false→true within <50ms) don't leak a
    // timer. If a previous activation's poll is still running when a new
    // activation or a deactivation arrives, we clear it before starting
    // the next cycle so the fly-to only ever targets the LATEST coords.
    let mapReadyPoll: ReturnType<typeof setInterval> | null = null;
    const clearMapReadyPoll = () => {
        if (mapReadyPoll !== null) {
            clearInterval(mapReadyPoll);
            mapReadyPoll = null;
        }
    };

    // Focus map when entering pick mode and place initial marker if coordinates provided
    watch(() => mapPick.isActive.value, async (active) => {
        // Always keep the stale-marker toggle symmetric with the isActive
        // flag, even when no initialCoords were supplied (e.g. pick mode
        // entered from the GPS button path that calls mapPick.start()
        // without coords and later calls flyToPickLocation itself).
        setCurrentMarkerHidden(active);

        // Any previous wait-for-map cycle is now stale — whether we're
        // re-entering pick mode (new coords about to be set) or exiting
        // (no fly-to should fire at all).
        clearMapReadyPoll();

        if (active && mapPick.initialCoords.value) {
            // If map isn't ready yet, wait for load event
            if (!map.value) {
                // Wait for map to be created and loaded
                const mapLoadedHandler = () => {
                    // Give browser time to render the map at correct size
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            flyToPickLocation(mapPick.initialCoords.value);
                        });
                    });
                };

                // Check if map gets created soon. `initialCoords.value` is
                // deliberately read inside the deferred callback, not
                // captured here — if the user changes coords during the
                // wait, we fly to the latest value, not the stale one.
                mapReadyPoll = setInterval(() => {
                    if (map.value) {
                        clearMapReadyPoll();
                        // Map exists, wait for it to be fully loaded
                        if (map.value.loaded()) {
                            mapLoadedHandler();
                        } else {
                            map.value.once('load', mapLoadedHandler);
                        }
                    }
                }, 50);
                return;
            }

            // Map exists, check if loaded
            if (map.value.loaded()) {
                // Give browser time to render
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        flyToPickLocation(mapPick.initialCoords.value);
                    });
                });
            } else {
                // Map exists but not loaded yet
                map.value.once('load', () => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            flyToPickLocation(mapPick.initialCoords.value);
                        });
                    });
                });
            }
        } else if (!active) {
            // Clean up pick marker when exiting pick mode
            if (pickMarker.value) {
                pickMarker.value.remove();
                pickMarker.value = null;
            }
        }
    }, { immediate: true });

    // Clear any pending poll if the component unmounts mid-cycle.
    onScopeDispose(clearMapReadyPoll);
}
