import type maplibregl from 'maplibre-gl';
import { toValue, type MaybeRefOrGetter } from 'vue';
import { resolveLocationValidation } from '@/utils/locationValidation';

interface MapWatchersOptions {
    map: Ref<maplibregl.Map | null>
    /**
     * Accept a ref, getter, or plain value for geolocated coords.
     * Pass `() => props.geolocatedCoords` (or `toRef(props,'geolocatedCoords')`)
     * from the caller so the watcher fires on every prop update.
     */
    geolocatedCoords: MaybeRefOrGetter<{ lat: number, lng: number } | null | undefined>
    currentMarker: Ref<maplibregl.Marker | null>
    tooltipMarker: Ref<maplibregl.Marker | null>
    showLocationTooltip: Ref<boolean>
    tooltipPosition: Ref<{ x: number, y: number }>
    tooltipLocationValid: Ref<boolean>
    boundaryValidationMessage: Ref<string>
    tooltipHardInvalid?: Ref<boolean>
    boundariesLoading: Ref<boolean>
    isDesktop: Ref<boolean>
    updateUserLocationMarker: (coords: { lat: number, lng: number }) => void
    validateLocation: (lat: number, lng: number) => any
    updateBoundaryLayer: () => void
    applyMaxBoundsFromBoundary: () => void
}

export function useMapWatchers(options: MapWatchersOptions) {
    const {
        map,
        geolocatedCoords,
        currentMarker,
        tooltipMarker,
        showLocationTooltip,
        tooltipPosition,
        tooltipLocationValid,
        boundaryValidationMessage,
        tooltipHardInvalid,
        boundariesLoading,
        isDesktop,
        updateUserLocationMarker,
        validateLocation,
        updateBoundaryLayer,
        applyMaxBoundsFromBoundary
    } = options;

    const syncTooltipPosition = () => {
        if (!showLocationTooltip.value) return;

        const marker = tooltipMarker.value;
        if (!marker) return;

        const markerEl = marker.getElement();
        const rect = markerEl.getBoundingClientRect();
        tooltipPosition.value = {
            x: rect.left + (rect.width / 2),
            y: rect.top
        };
    };

    // Watch for geolocated coordinates changes.
    // geolocatedCoords is typed MaybeRefOrGetter so the caller can pass a getter
    // (e.g. `() => props.geolocatedCoords`) and the watcher fires on every update.
    // Using `toValue()` as the source unwraps refs, getters, and plain values.
    watch(
        () => toValue(geolocatedCoords),
        (newCoords) => {
            if (newCoords && map.value) {
                updateUserLocationMarker(newCoords);
            }
        },
        { deep: true }
    );

    // Keep tooltip anchored to the active marker while the map camera moves.
    watch(
        () => map.value,
        (mapInstance, _, onCleanup) => {
            if (!mapInstance) return;

            const syncEvents = ['move', 'moveend', 'zoom', 'zoomend', 'pitch', 'rotate'] as const;
            const handleSync = () => {
                syncTooltipPosition();
            };

            syncEvents.forEach((eventName) => {
                mapInstance.on(eventName, handleSync);
            });

            onCleanup(() => {
                syncEvents.forEach((eventName) => {
                    mapInstance.off(eventName, handleSync);
                });
            });
        },
        { immediate: true }
    );

    watch(
        [showLocationTooltip, tooltipMarker],
        () => {
            syncTooltipPosition();
        },
        { flush: 'post' }
    );

    // Watch for window resize to update tooltip position
    watch(isDesktop, () => {
        if (!showLocationTooltip.value) return;

        setTimeout(() => {
            syncTooltipPosition();
        }, 100); // Slightly longer timeout for resize events
    });

    // If boundaries finish loading while a marker is placed, re-validate and update UI.
    // Route through resolveLocationValidation() so the postcode/coordinate-fallback
    // normalisation and tooltipHardInvalid are applied consistently with every other
    // pick/normal/location-select re-validation path.
    watch(() => boundariesLoading.value, (loading) => {
        if (!loading) {
            // Apply max bounds when boundaries finish loading
            applyMaxBoundsFromBoundary();

            // Re-validate marker if present
            if (currentMarker.value) {
                const coords = currentMarker.value.getLngLat();
                const raw = validateLocation(coords.lat, coords.lng);
                const resolved = resolveLocationValidation(raw);
                tooltipLocationValid.value = resolved.valid;
                boundaryValidationMessage.value = resolved.message;
                if (tooltipHardInvalid) {
                    tooltipHardInvalid.value = resolved.hardInvalid;
                }
                if (boundaryValidationMessage.value) {
                    updateBoundaryLayer();
                }
            }
        }
    });
}
