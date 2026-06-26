import type maplibregl from 'maplibre-gl';

interface MapControlsOptions {
    map: Ref<maplibregl.Map | null>
    getMapFunctions: () => any
    emit: (event: string, ...args: unknown[]) => void
}

export function useMapControls(options: MapControlsOptions) {
    const { map, getMapFunctions, emit } = options;

    const updateMapTilt = (tiltValue: number) => {
        if (map.value) {
            map.value.setPitch(tiltValue);
        }
    };

    const toggleLanguage = () => {
    // Delegate language toggling to parent component
        emit('toggle-language');
    };

    const toggleHeatmap = () => {
    // Toggle heatmap using the mapFunctions
        const mapFunctions = getMapFunctions();
        if (mapFunctions) {
            mapFunctions.toggleHeatmap();
        }
    };

    return {
        updateMapTilt,
        toggleLanguage,
        toggleHeatmap
    };
}
