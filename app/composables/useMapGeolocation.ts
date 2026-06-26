import type maplibregl from 'maplibre-gl';
import { formatGeocodedAddress } from '@/utils/formatAddress';

interface GeolocationOptions {
    map: Ref<maplibregl.Map | null>
    currentMarker: Ref<maplibregl.Marker | null>
    maplibregl: any
    selectedAddress: Ref<string>
    tooltipPosition: Ref<{ x: number, y: number }>
    showLocationTooltip: Ref<boolean>
    tooltipLocationValid: Ref<boolean>
    boundaryValidationMessage: Ref<string>
    primaryColor: Ref<string>
    reverseGeocode: (lat: number, lng: number) => Promise<any>
    validateLocation: (lat: number, lng: number) => any
    updateBoundaryLayer: () => void
    updateUserLocationMarker: (coords: { lat: number, lng: number }) => void
    removeMaxBounds: () => void
    emit: (event: string, ...args: unknown[]) => void
}

export function useMapGeolocation(options: GeolocationOptions) {
    const {
        map,
        currentMarker,
        selectedAddress,
        tooltipPosition,
        showLocationTooltip,
        tooltipLocationValid,
        boundaryValidationMessage,
        reverseGeocode,
        validateLocation,
        updateBoundaryLayer,
        updateUserLocationMarker,
        removeMaxBounds,
        emit
    } = options;

    const handleGeolocate = async (coords: { lat: number, lng: number }) => {
        if (!map.value) return;

        // Wait for map to be loaded if it's not ready yet
        if (!map.value.loaded()) {
            await new Promise((resolve) => {
                map.value!.once('load', resolve);
            });
        }

        // Validate location against boundaries
        const validation = validateLocation(coords.lat, coords.lng);
        tooltipLocationValid.value = validation.valid;
        boundaryValidationMessage.value = validation.message;

        // If location is outside boundary, temporarily remove maxBounds to allow viewing
        if (!validation.valid) {
            removeMaxBounds();
        }

        // Add user location marker to show current GPS position
        updateUserLocationMarker(coords);

        // GPS button should activate pick mode and go to location
        // Emit geolocate-to-pick event to trigger pick mode at this location
        emit('geolocate-to-pick', coords);
    };

    return {
        handleGeolocate
    };
}
