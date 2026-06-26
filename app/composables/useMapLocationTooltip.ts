interface LocationTooltipOptions {
    isMarkerDragging: () => boolean
    onClear?: () => void
}

export function useMapLocationTooltip(options: LocationTooltipOptions) {
    const { isMarkerDragging, onClear } = options;

    const showLocationTooltip = ref(false);
    const tooltipPosition = ref({ x: 0, y: 0 });
    const selectedAddress = ref('');
    const isLocationValid = ref(true);

    const handleClickOutside = (event: MouseEvent) => {
        if (!showLocationTooltip.value) return;

        if (isMarkerDragging()) {
            return;
        }

        const isMarkerClick = event.target &&
          (event.target as HTMLElement).closest('.maplibregl-marker') !== null;

        const isTooltipClick = event.target &&
          (event.target as HTMLElement).closest('.tooltip-with-arrow') !== null;

        if (!isMarkerClick && !isTooltipClick) {
            clearLocationState();
        }
    };

    const clearLocationState = () => {
        showLocationTooltip.value = false;
        selectedAddress.value = '';
        isLocationValid.value = true;

        if (onClear) {
            onClear();
        }
    };

    const updateTooltipPosition = (markerElement: HTMLElement) => {
        const rect = markerElement.getBoundingClientRect();
        tooltipPosition.value = {
            x: rect.left + rect.width / 2,
            y: rect.top
        };
    };

    onMounted(() => {
        document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
        clearLocationState();
    });

    return {
        showLocationTooltip,
        tooltipPosition,
        selectedAddress,
        isLocationValid,
        clearLocationState,
        updateTooltipPosition,
        handleClickOutside
    };
}
