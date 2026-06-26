import type maplibregl from 'maplibre-gl';
import { resolveLocationValidation } from '@/utils/locationValidation';

interface LocationSelectOptions {
    map: Ref<maplibregl.Map | null>
    maplibregl: Ref<typeof maplibregl>
    currentMarker: Ref<maplibregl.Marker | null>
    selectedAddress: Ref<string>
    tooltipPosition: Ref<{ x: number, y: number }>
    showLocationTooltip: Ref<boolean>
    tooltipLocationValid: Ref<boolean>
    boundaryValidationMessage: Ref<string>
    isMarkerDragging: Ref<boolean>
    validateLocation: (lat: number, lng: number) => any
    updateBoundaryLayer: () => void
    createCustomMarkerElement: (color: string, transitions: boolean, showDragTooltip: boolean, primaryColor: string, iconType?: 'plus' | 'crosshair') => HTMLElement
    primaryColor: Ref<string>
    tooltipHardInvalid?: Ref<boolean>
}

export function useLocationSelect(options: LocationSelectOptions) {
    const {
        map,
        maplibregl,
        currentMarker,
        selectedAddress,
        tooltipPosition,
        showLocationTooltip,
        tooltipLocationValid,
        boundaryValidationMessage,
        isMarkerDragging,
        validateLocation,
        updateBoundaryLayer,
        createCustomMarkerElement,
        primaryColor,
        tooltipHardInvalid
    } = options;

    // Track pending timer ids so they can be cleared if the component unmounts
    // before the callbacks fire (drag/drop handlers schedule short delays).
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

    const applyLocationValidation = (
        validationResult: { valid: boolean, message: string },
        _address?: { postcode?: string | null } | null
    ) => {
        // A missing postcode must NOT block: only the boundary result decides
        // validity, with coordinate fallback otherwise. See utils/locationValidation.ts.
        const resolved = resolveLocationValidation(validationResult);
        tooltipLocationValid.value = resolved.valid;
        boundaryValidationMessage.value = resolved.message;
        if (tooltipHardInvalid) {
            tooltipHardInvalid.value = resolved.hardInvalid;
        }
    };

    const handleLocationSelect = (locationData: {
        lat: number
        lng: number
        address: string
        validationResult?: { valid: boolean, message: string, hardInvalid?: boolean }
    }) => {
        if (!map.value) return;

        if (currentMarker.value) {
            currentMarker.value.remove();
        }

        map.value.once('moveend', () => {
            currentMarker.value = new maplibregl.value.Marker({
                element: createCustomMarkerElement(primaryColor.value, false, false, primaryColor.value),
                draggable: true,
                anchor: 'bottom'
            })
                .setLngLat([locationData.lng, locationData.lat])
                .addTo(map.value!);

            currentMarker.value.on('dragstart', () => {
                isMarkerDragging.value = true;
            });

            currentMarker.value.on('dragend', async (e) => {
                // iOS fix: Get correct position from event or marker
                const lngLat = e?.target?.getLngLat ? e.target.getLngLat() : currentMarker.value!.getLngLat();
                const newLat = lngLat.lat;
                const newLng = lngLat.lng;

                // iOS fix: Force marker to correct position if it jumped
                scheduleTimer(() => {
                    if (currentMarker.value) {
                        currentMarker.value.setLngLat([newLng, newLat]);
                    }
                }, 0);

                let addressObj: { postcode?: string | null } | null = null;
                try {
                    const { reverse: reverseGeocode } = useGeocoding();
                    const result = await reverseGeocode(newLat, newLng);
                    addressObj = result.address || {};
                    if (result.address) {
                        const parts = [];
                        if (result.address.street) {
                            parts.push(result.address.street + (result.address.housenumber ? ' ' + result.address.housenumber : ''));
                        }
                        if (result.address.city) {
                            parts.push([result.address.postcode, result.address.city].filter(Boolean).join(' '));
                        }
                        selectedAddress.value = parts.length > 0 ? parts.join(', ') : (result.displayName || `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
                    } else {
                        selectedAddress.value = `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;
                    }
                } catch (err) {
                    if (import.meta.dev) {
                        console.error('Reverse geocoding failed:', err);
                    }
                    selectedAddress.value = `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;
                }

                const validationResult = validateLocation(newLat, newLng);
                applyLocationValidation(validationResult, addressObj);

                if (boundaryValidationMessage.value) {
                    updateBoundaryLayer();
                }

                scheduleTimer(() => {
                    if (currentMarker.value) {
                        const markerEl = currentMarker.value.getElement();
                        const rect = markerEl.getBoundingClientRect();
                        const newPos = {
                            x: rect.left + (rect.width / 2),
                            y: rect.top
                        };
                        tooltipPosition.value = newPos;
                        showLocationTooltip.value = true;
                        isMarkerDragging.value = false;
                    }
                }, 50);
            });

            selectedAddress.value = locationData.address;

            if (locationData.validationResult) {
                tooltipLocationValid.value = locationData.validationResult.valid;
                boundaryValidationMessage.value = locationData.validationResult.message;
                if (tooltipHardInvalid) {
                    tooltipHardInvalid.value = locationData.validationResult.hardInvalid === true;
                }
            } else {
                const validationResult = validateLocation(locationData.lat, locationData.lng);
                applyLocationValidation(validationResult);
            }

            if (boundaryValidationMessage.value) {
                updateBoundaryLayer();
            }

            scheduleTimer(() => {
                if (currentMarker.value) {
                    const markerEl = currentMarker.value.getElement();
                    const rect = markerEl.getBoundingClientRect();
                    tooltipPosition.value = {
                        x: rect.left + (rect.width / 2),
                        y: rect.top
                    };
                    showLocationTooltip.value = true;

                    const canvas = map.value?.getCanvas();
                    if (canvas) {
                        canvas.focus();
                    }
                }
            }, 10);
        });
    };

    return {
        handleLocationSelect
    };
}
