import type maplibregl from 'maplibre-gl';
import { formatGeocodedAddress } from '@/utils/formatAddress';
import { resolveLocationValidation } from '@/utils/locationValidation';

interface GeocodingResult {
    lat: number
    lng: number
    displayName: string
    address: {
        street?: string
        houseNumber?: string
        housenumber?: string
        postcode?: string
        city?: string
        district?: string
        state?: string
        country?: string
    }
    raw?: any
}

interface ValidationResult {
    valid: boolean
    message: string
}

interface NormalModeOptions {
    map: Ref<maplibregl.Map | null>
    currentMarker: Ref<maplibregl.Marker | null>
    maplibregl: Ref<typeof maplibregl>
    selectedAddress: Ref<string>
    tooltipPosition: Ref<{ x: number, y: number }>
    showLocationTooltip: Ref<boolean>
    tooltipLocationValid: Ref<boolean>
    boundaryValidationMessage: Ref<string>
    isMarkerDragging: { value: boolean }
    reverseGeocode: (lat: number, lng: number) => Promise<GeocodingResult>
    validateLocation: (lat: number, lng: number) => ValidationResult
    updateBoundaryLayer: () => void
    createCustomMarkerElement: (color: string, transitions: boolean, showDragTooltip: boolean, primaryColor: string, iconType?: 'plus' | 'crosshair') => HTMLElement
    primaryColor: Ref<string>
    tooltipHardInvalid?: Ref<boolean>
}

export function useMapNormalMode(options: NormalModeOptions) {
    const {
        map,
        currentMarker,
        maplibregl,
        selectedAddress,
        tooltipPosition,
        showLocationTooltip,
        tooltipLocationValid,
        boundaryValidationMessage,
        isMarkerDragging,
        reverseGeocode,
        validateLocation,
        updateBoundaryLayer,
        createCustomMarkerElement,
        primaryColor,
        tooltipHardInvalid
    } = options;

    // Create our own currentAddressObj ref for normal mode
    const currentAddressObj = ref<Record<string, unknown> | null>(null);

    // Track pending timer ids so they can be cleared if the component unmounts
    // before the callbacks fire (drag handlers schedule short delays).
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
    const scheduleTimer = (fn: () => void, ms: number) => {
        const id = setTimeout(() => {
            pendingTimers.delete(id);
            fn();
        }, ms);
        pendingTimers.add(id);
        return id;
    };

    onScopeDispose(() => {
        for (const id of pendingTimers) {
            clearTimeout(id);
        }
        pendingTimers.clear();
    });

    const updateTooltipFromMarker = () => {
        if (!currentMarker.value) return;

        const markerEl = currentMarker.value.getElement();
        const rect = markerEl.getBoundingClientRect();
        tooltipPosition.value = {
            x: rect.left + (rect.width / 2),
            y: rect.top
        };
        showLocationTooltip.value = true;
    };

    const applyLocationValidation = (validationResult: ValidationResult, _address: GeocodingResult['address'] | Record<string, unknown> | null | undefined) => {
        // A missing postcode must NOT block: only the boundary result decides
        // validity, with coordinate fallback otherwise. See utils/locationValidation.ts.
        const resolved = resolveLocationValidation(validationResult);
        tooltipLocationValid.value = resolved.valid;
        boundaryValidationMessage.value = resolved.message;
        if (tooltipHardInvalid) {
            tooltipHardInvalid.value = resolved.hardInvalid;
        }
    };

    const handleMarkerDragEnd = async (e?: maplibregl.MapMouseEvent) => {
        if (!currentMarker.value) return;

        // iOS fix: Get correct position from event or marker
        const lngLat = (e?.target as any)?.getLngLat ? (e!.target as any).getLngLat() : currentMarker.value.getLngLat();
        const lat = lngLat.lat;
        const lng = lngLat.lng;

        // iOS fix: Force marker to correct position if it jumped
        scheduleTimer(() => {
            if (currentMarker.value) {
                currentMarker.value.setLngLat([lng, lat]);
            }
        }, 0);

        // Update address
        let addressObj: GeocodingResult['address'] | Record<string, unknown> | null = null;
        try {
            const result = await reverseGeocode(lat, lng);
            selectedAddress.value = formatGeocodedAddress(result, { lat, lng });
            addressObj = result.address || {};
            currentAddressObj.value = addressObj;
        } catch (err) {
            if (import.meta.dev) {
                console.error('Reverse geocoding failed:', err);
            }
            selectedAddress.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            addressObj = {};
            currentAddressObj.value = addressObj;
        }

        // Validate location
        const validationResult = validateLocation(lat, lng);
        applyLocationValidation(validationResult, addressObj);

        if (boundaryValidationMessage.value) {
            updateBoundaryLayer();
        }

        // Update tooltip position after drag
        scheduleTimer(() => {
            updateTooltipFromMarker();
            isMarkerDragging.value = false;
        }, 50);
    };

    const handleNormalModeClick = async (lngLat: { lat: number, lng: number }) => {
        if (!map.value) return;

        // Remove existing marker
        if (currentMarker.value) {
            currentMarker.value.remove();
        }

        // Center map on click location
        map.value.flyTo({
            center: lngLat,
            duration: 200,
            essential: true
        });

        // Wait for map movement then create marker
        map.value.once('moveend', async () => {
            if (!map.value) return;

            // Create draggable marker
            currentMarker.value = new maplibregl.value.Marker({
                element: createCustomMarkerElement(primaryColor.value, false, false, primaryColor.value),
                draggable: true,
                anchor: 'bottom'
            })
                .setLngLat(lngLat)
                .addTo(map.value);

            // Accessibility attributes
            const markerEl = currentMarker.value.getElement();
            markerEl.setAttribute('role', 'button');
            markerEl.setAttribute('aria-label', 'New report location - click to create report');

            // Drag handlers
            currentMarker.value.on('dragstart', () => {
                isMarkerDragging.value = true;
            });

            currentMarker.value.on('dragend', handleMarkerDragEnd);

            // Reverse geocode initial position
            let addressObj: GeocodingResult['address'] | Record<string, unknown> | null = null;
            try {
                const result = await reverseGeocode(lngLat.lat, lngLat.lng);
                selectedAddress.value = formatGeocodedAddress(result, { lat: lngLat.lat, lng: lngLat.lng });
                addressObj = result.address || {};
                currentAddressObj.value = addressObj;
            } catch (err) {
                if (import.meta.dev) {
                    console.error('Reverse geocoding failed:', err);
                }
                selectedAddress.value = `${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}`;
                addressObj = {};
                currentAddressObj.value = addressObj;
            }

            // Validate location
            const validationResult = validateLocation(lngLat.lat, lngLat.lng);
            applyLocationValidation(validationResult, addressObj);

            if (boundaryValidationMessage.value) {
                updateBoundaryLayer();
            }

            // Show tooltip
            scheduleTimer(updateTooltipFromMarker, 10);
        });
    };

    return {
        handleNormalModeClick,
        currentAddressObj
    };
}
