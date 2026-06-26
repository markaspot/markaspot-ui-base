import type maplibregl from 'maplibre-gl';

interface ReportHandlerOptions {
    currentMarker: Ref<maplibregl.Marker | null>
    boundaryConfig: Ref<any>
    tooltipLocationValid: Ref<boolean>
    tooltipHardInvalid?: Ref<boolean>
    selectedAddress: Ref<string>
    currentAddressObj: Ref<Record<string, unknown> | null>
    showLocationTooltip: Ref<boolean>
    clearLocationState: () => void
    emit: (event: string, ...args: unknown[]) => void
}

export function useMapReportHandler(options: ReportHandlerOptions) {
    const {
        currentMarker,
        boundaryConfig,
        tooltipLocationValid,
        selectedAddress,
        currentAddressObj,
        showLocationTooltip,
        clearLocationState,
        emit
    } = options;

    const handleReportType = (type: 'photo' | 'classic') => {
    // If we have a marker, use its location
        if (currentMarker.value) {
            // A missing postcode / absent geocoded address never blocks the
            // report (coordinate fallback). Only strict boundary validation may
            // hold the user back. See utils/locationValidation.ts.
            if (boundaryConfig.value.enabled && boundaryConfig.value.strictValidation && !tooltipLocationValid.value) {
                // Keep tooltip visible with warning; do nothing
                return;
            }
            const coords = currentMarker.value.getLngLat();
            const location = {
                lat: coords.lat,
                lng: coords.lng,
                address: selectedAddress.value,
                addressObj: currentAddressObj.value || undefined
            };

            emit('add-report', type, location);
            // Hide tooltip but keep marker visible for user reference
            showLocationTooltip.value = false;
            return;
        }

        // No marker? Forward the report type directly
        // The form will ask user for location if needed
        emit('add-report', type);
        showLocationTooltip.value = false;
    };

    return {
        handleReportType
    };
}
