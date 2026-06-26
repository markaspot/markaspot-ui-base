import type maplibregl from 'maplibre-gl';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { useDebounceFn } from '@vueuse/core';

interface MapFunctions {
    setMapInteracting?: (value: boolean) => void
    [key: string]: unknown
}

interface MapEventHandlersOptions {
    map: Ref<maplibregl.Map | null>
    mapFunctions: MapFunctions
    handleMapClick: (e: maplibregl.MapMouseEvent & { features?: MapGeoJSONFeature[] }) => Promise<void>
    recordMetric: (name: string, value: number, type?: string) => void
    emit: (event: string, ...args: unknown[]) => void
}

export function useMapEventHandlers(options: MapEventHandlersOptions) {
    const {
        map,
        mapFunctions,
        handleMapClick,
        recordMetric,
        emit
    } = options;

    let isSetup = false; // Prevent duplicate setup within a single composable instance

    // Store named handler references so teardown can call the exact same function
    // object that was passed to map.on() — MapLibre requires the same ref for off().
    let teardown: (() => void) | null = null;

    const setupEventHandlers = () => {
        if (!map.value) return;
        if (isSetup) {
            console.warn('⚠️ setupEventHandlers already called, skipping to prevent duplicate listeners');
            return;
        }
        isSetup = true;

        const mapInstance = map.value;

        // CRITICAL: Aggressive debounce to prevent API calls during zoom
        const debouncedMoveEnd = useDebounceFn(() => {
            if (!map.value) return;
            const bounds = map.value.getBounds();
            emit('update:bounds', {
                minLat: bounds.getSouth(),
                maxLat: bounds.getNorth(),
                minLng: bounds.getWest(),
                maxLng: bounds.getEast()
            }, false);
        }, 800); // Much longer debounce to prevent mid-zoom API calls

        mapInstance.on('moveend', debouncedMoveEnd);
        mapInstance.on('click', handleMapClick);

        // Performance monitoring for all map interactions
        let moveStartTime: number;
        let dragStartTime: number;
        let rotateStartTime: number;

        // Emit interaction start events to allow UI to react (e.g., collapse sheet)
        const interactionStart = () => {
            emit('map-interaction');
            // Prevent marker updates during active interactions
            if (mapFunctions?.setMapInteracting) {
                mapFunctions.setMapInteracting(true);
            }
        };

        const interactionEnd = () => {
            // Re-enable marker updates after interactions complete
            if (mapFunctions?.setMapInteracting) {
                mapFunctions.setMapInteracting(false);
            }
        };

        // Named handler refs for every map.on() registration so map.off() works.
        const onMoveStart = () => {
            moveStartTime = performance.now();
            interactionStart();
            recordMetric('map_move_start', 1, 'counter');
        };

        const onDragStart = () => {
            dragStartTime = performance.now();
            recordMetric('map_drag_start', 1, 'counter');
        };

        const onRotateStart = () => {
            rotateStartTime = performance.now();
            recordMetric('map_rotate_start', 1, 'counter');
        };

        const onMoveEnd = () => {
            if (moveStartTime) {
                const moveDuration = performance.now() - moveStartTime;
                recordMetric('map_move_duration', moveDuration);
            }
            // small delay ensures inertia fully settles before heavy updates
            setTimeout(interactionEnd, 50);
        };

        const onDragEnd = () => {
            if (dragStartTime) {
                const dragDuration = performance.now() - dragStartTime;
                recordMetric('map_drag_duration', dragDuration);
            }
        };

        const onRotateEnd = () => {
            if (rotateStartTime) {
                const rotateDuration = performance.now() - rotateStartTime;
                recordMetric('map_rotate_duration', rotateDuration);
            }
        };

        // Monitor different types of map movements
        mapInstance.on('movestart', onMoveStart);
        mapInstance.on('dragstart', onDragStart);
        mapInstance.on('rotatestart', onRotateStart);
        mapInstance.on('moveend', onMoveEnd);
        mapInstance.on('dragend', onDragEnd);
        mapInstance.on('rotateend', onRotateEnd);

        // Register teardown for all handlers added above.
        teardown = () => {
            mapInstance.off('moveend', debouncedMoveEnd);
            mapInstance.off('click', handleMapClick);
            mapInstance.off('movestart', onMoveStart);
            mapInstance.off('dragstart', onDragStart);
            mapInstance.off('rotatestart', onRotateStart);
            mapInstance.off('moveend', onMoveEnd);
            mapInstance.off('dragend', onDragEnd);
            mapInstance.off('rotateend', onRotateEnd);
        };
    };

    // No onScopeDispose: this composable is created inside useMapLoadHandler's
    // map 'load' callback, outside any active component effect scope. The handlers
    // are removed when the map component's onUnmounted calls map.remove() (which
    // drops every map listener). teardownEventHandlers is exposed for callers that
    // need to detach them without destroying the map.
    const teardownEventHandlers = () => {
        teardown?.();
        teardown = null;
    };

    return {
        setupEventHandlers,
        teardownEventHandlers
    };
}
