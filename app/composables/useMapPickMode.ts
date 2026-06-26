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
    hardInvalid?: boolean
}

interface MapPickState {
    select: (data: {
        lat: number
        lng: number
        address: string
        addressObj: Record<string, unknown>
        validationResult: ValidationResult
    }) => void
    [key: string]: unknown
}

interface PickModeOptions {
    map: Ref<maplibregl.Map | null>
    pickMarker: Ref<maplibregl.Marker | null>
    currentMarker: Ref<maplibregl.Marker | null>
    userLocationMarker: Ref<maplibregl.Marker | null>
    maplibregl: Ref<typeof maplibregl>
    selectedAddress: Ref<string>
    reverseGeocode: (lat: number, lng: number) => Promise<GeocodingResult>
    validateLocation: (lat: number, lng: number) => ValidationResult
    mapPick: MapPickState
    createPickMarkerElement: () => HTMLElement
    createCustomMarkerElement: (color: string, transitions: boolean, showDragTooltip: boolean, primaryColor: string, iconType?: 'plus' | 'crosshair') => HTMLElement
    primaryColor: Ref<string>
    tooltipLocationValid: Ref<boolean>
    boundaryValidationMessage: Ref<string>
    updateBoundaryLayer: () => void
    showLocationTooltip: Ref<boolean>
    tooltipPosition: Ref<{ x: number, y: number }>
    tooltipHardInvalid?: Ref<boolean>
}

export function useMapPickMode(options: PickModeOptions) {
    const {
        map,
        pickMarker,
        currentMarker,
        userLocationMarker,
        maplibregl,
        selectedAddress,
        reverseGeocode,
        validateLocation,
        mapPick,
        createPickMarkerElement,
        createCustomMarkerElement,
        primaryColor,
        tooltipLocationValid,
        boundaryValidationMessage,
        updateBoundaryLayer,
        showLocationTooltip,
        tooltipPosition,
        tooltipHardInvalid
    } = options;

    // Performance and UX state
    const isGeocoding = ref(false);
    const geocodingRetryCount = ref(0);
    const maxRetries = 3;
    const retryDelay = 1000;
    const currentAddressObj = ref<Record<string, unknown> | null>(null);

    const applyPostcodeValidation = (_addressObj: Record<string, unknown>, validationResult: ValidationResult) => {
        // A missing postcode must NOT block: only the boundary result decides
        // validity, with coordinate fallback otherwise. See utils/locationValidation.ts.
        const resolved = resolveLocationValidation(validationResult);
        tooltipLocationValid.value = resolved.valid;
        boundaryValidationMessage.value = resolved.message;
        if (tooltipHardInvalid) {
            tooltipHardInvalid.value = resolved.hardInvalid;
        }
    };

    // Debounced address update function
    const debouncedAddressUpdate = useDebounceFn(async (lat: number, lng: number) => {
        await updateAddressWithRetry(lat, lng);
    }, 300);

    // Consolidated address update with retry mechanism
    const updateAddressWithRetry = async (lat: number, lng: number, immediate = false): Promise<{ address: string, addressObj: Record<string, unknown> }> => {
        if (!immediate && isGeocoding.value) {
            return { address: selectedAddress.value || `${lat.toFixed(6)}, ${lng.toFixed(6)}`, addressObj: {} };
        }

        isGeocoding.value = true;
        geocodingRetryCount.value = 0;

        const attemptGeocode = async (): Promise<{ address: string, addressObj: Record<string, unknown> }> => {
            try {
                const result = await reverseGeocode(lat, lng);
                const address = formatGeocodedAddress(result, { lat, lng });
                const addressObj = result.address || {};

                selectedAddress.value = address;
                currentAddressObj.value = addressObj;
                geocodingRetryCount.value = 0;

                return { address, addressObj };
            } catch (error) {
                geocodingRetryCount.value++;

                if (geocodingRetryCount.value < maxRetries) {
                    // Exponential backoff
                    const delay = retryDelay * Math.pow(2, geocodingRetryCount.value - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return attemptGeocode();
                } else {
                    // Fallback to coordinates
                    const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    selectedAddress.value = fallbackAddress;
                    console.warn('Geocoding failed after retries, using coordinates as fallback', error);
                    return { address: fallbackAddress, addressObj: {} };
                }
            } finally {
                isGeocoding.value = false;
            }
        };

        return attemptGeocode();
    };

    // Store the DOM click handler so it can be removed before the marker is
    // destroyed. marker.remove() only detaches the element from the map; raw
    // DOM listeners on getElement() are NOT cleaned up automatically.
    let pickMarkerClickHandler: ((e: MouseEvent) => void) | null = null;

    /**
     * Detach all DOM + MapLibre listeners from the current pick marker and
     * remove it from the map. Call this before replacing the marker.
     */
    const removePickMarker = () => {
        const m = pickMarker.value;
        if (!m) return;
        if (pickMarkerClickHandler) {
            m.getElement().removeEventListener('click', pickMarkerClickHandler);
            pickMarkerClickHandler = null;
        }
        m.remove();
        pickMarker.value = null;
    };

    // Marker creation and reuse utilities
    const ensurePickMarker = (lngLat: { lat: number, lng: number }): maplibregl.Marker => {
        if (pickMarker.value) {
            // Reuse existing marker with smooth animation
            pickMarker.value.setLngLat(lngLat);
            return pickMarker.value;
        }

        // Create new marker with enhanced event handling
        // Anchor at the tip of the pin (bottom of marker, centered horizontally)
        const marker = new maplibregl.value.Marker({
            element: createPickMarkerElement(),
            draggable: true,
            anchor: 'bottom'
        })
            .setLngLat(lngLat)
            .addTo(map.value!);

        // Enhanced drag event handling with debouncing
        marker.on('dragstart', () => {
            isGeocoding.value = false; // Cancel any ongoing geocoding
            showLocationTooltip.value = false; // Hide tooltip during drag
        });

        marker.on('drag', () => {
            const currentLngLat = marker.getLngLat();
            // Use debounced update during drag for better performance
            debouncedAddressUpdate(currentLngLat.lat, currentLngLat.lng);
        });

        marker.on('dragend', async () => {
            const lngLat = marker.getLngLat();
            await showLocationTooltipForConfirmation(lngLat);
        });

        // Click handler shows tooltip for confirmation. Store the ref so it can
        // be removed when the marker is torn down (removePickMarker).
        pickMarkerClickHandler = async (e: MouseEvent) => {
            e.stopPropagation();
            await showLocationTooltipForConfirmation(marker.getLngLat());
        };
        marker.getElement().addEventListener('click', pickMarkerClickHandler);

        pickMarker.value = marker;
        return marker;
    };

    // Show tooltip for location confirmation instead of immediately selecting
    const showLocationTooltipForConfirmation = async (lngLat: { lat: number, lng: number }) => {
        const lat = lngLat.lat;
        const lng = lngLat.lng;

        if (!map.value) return;

        // Update address for tooltip display
        const { addressObj } = await updateAddressWithRetry(lat, lng, true);
        applyPostcodeValidation(addressObj, validateLocation(lat, lng));

        // Calculate screen position for tooltip
        const point = map.value.project([lng, lat]);
        const canvasRect = map.value.getCanvas().getBoundingClientRect();

        // Update tooltip position - offset to avoid covering marker
        tooltipPosition.value = {
            x: canvasRect.left + point.x,
            y: canvasRect.top + point.y - 60 // Offset to clear the marker
        };

        showLocationTooltip.value = true;

        return { lat, lng };
    };

    // Enhanced location confirmation with consolidated logic - now called when user confirms via tooltip
    const confirmPickLocationEnhanced = async (lngLat: { lat: number, lng: number }) => {
        const lat = lngLat.lat;
        const lng = lngLat.lng;

        const { address, addressObj } = await updateAddressWithRetry(lat, lng, true);
        // Postcode never gates: confirm with the boundary result only, falling
        // back to coordinates when geocoding returned no address.
        const effectiveValidationResult = resolveLocationValidation(validateLocation(lat, lng));

        mapPick.select({
            lat,
            lng,
            address,
            addressObj,
            validationResult: effectiveValidationResult
        });
    };

    const handlePickModeClick = async (lngLat: { lat: number, lng: number }) => {
        if (!map.value) return;

        // Use enhanced marker creation/reuse
        ensurePickMarker(lngLat);

        // Smooth map animation with improved easing
        map.value.flyTo({
            center: lngLat,
            duration: 300,
            essential: true,
            easing: t => t * (2 - t) // Ease-out quadratic for smoother feel
        });

        // Update address and show tooltip after map movement
        map.value.once('moveend', async () => {
            await showLocationTooltipForConfirmation(lngLat);
        });
    };

    // Legacy functions kept for compatibility but redirected to enhanced versions
    const updatePickAddress = async (lat: number, lng: number) => {
        await updateAddressWithRetry(lat, lng);
    };

    const confirmPickLocation = async (lngLat: { lat: number, lng: number }) => {
        await confirmPickLocationEnhanced(lngLat);
    };

    const flyToPickLocation = (coords: { lat: number, lng: number }) => {
        if (!map.value) return;

        const { lat, lng } = coords;

        // Clean up existing markers — use removePickMarker so the DOM click
        // listener is properly detached before the element is destroyed.
        removePickMarker();

        if (currentMarker.value) {
            currentMarker.value.remove();
            currentMarker.value = null;
        }

        // Keep userLocationMarker to show GPS position while picking
        // if (userLocationMarker.value) {
        //     userLocationMarker.value.remove();
        //     userLocationMarker.value = null;
        // }

        // Force map resize to fix any distortion from navigation
        map.value.resize();

        const canvas = map.value?.getCanvas();
        canvas?.focus();

        // Enhanced fly animation with better easing
        map.value.flyTo({
            center: [lng, lat],
            duration: 600,
            essential: true,
            easing: t => 1 - Math.pow(1 - t, 3) // Ease-out cubic for smoother feel
        });

        // Wait for animation to complete then create enhanced marker
        map.value.once('moveend', async () => {
            if (!map.value) return;

            // Create enhanced pick marker with improved styling
            // Anchor at the tip of the pin (bottom of marker, centered horizontally)
            const marker = new maplibregl.value.Marker({
                element: createCustomMarkerElement('#dc2626', true, false, primaryColor.value, 'crosshair'),
                draggable: true,
                anchor: 'bottom'
            })
                .setLngLat([lng, lat])
                .addTo(map.value);

            // Enhanced event handling
            marker.on('dragstart', () => {
                isGeocoding.value = false;
                showLocationTooltip.value = false; // Hide tooltip during drag
            });

            marker.on('drag', () => {
                const currentLngLat = marker.getLngLat();
                debouncedAddressUpdate(currentLngLat.lat, currentLngLat.lng);
            });

            marker.on('dragend', async () => {
                const lngLat = marker.getLngLat();
                await showLocationTooltipForConfirmation(lngLat);
            });

            // Store the DOM click handler ref so removePickMarker can detach it.
            pickMarkerClickHandler = async (e: MouseEvent) => {
                e.stopPropagation();
                await showLocationTooltipForConfirmation(marker.getLngLat());
            };
            marker.getElement().addEventListener('click', pickMarkerClickHandler);

            pickMarker.value = marker;

            // Show tooltip for initial location
            await showLocationTooltipForConfirmation({ lat, lng });
        });
    };

    return {
        handlePickModeClick,
        flyToPickLocation,
        // Enhanced state exposure for UI feedback
        isGeocoding: readonly(isGeocoding),
        geocodingRetryCount: readonly(geocodingRetryCount),
        currentAddressObj: readonly(currentAddressObj),
        // Enhanced utilities
        updateAddressWithRetry,
        confirmPickLocationEnhanced,
        ensurePickMarker,
        showLocationTooltipForConfirmation,
        // Teardown: properly detaches DOM click listeners before removing the marker.
        // Callers that currently call pickMarker.value.remove() directly should
        // use this instead to avoid DOM click-listener leaks across pick cycles.
        removePickMarker
    };
}
