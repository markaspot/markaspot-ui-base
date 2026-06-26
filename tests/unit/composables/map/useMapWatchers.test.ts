import { describe, it, expect, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useMapWatchers } from '@/composables/useMapWatchers';

type EventHandler = () => void;

class FakeMap {
    private handlers = new Map<string, Set<EventHandler>>();

    on(eventName: string, handler: EventHandler) {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, new Set());
        }
        this.handlers.get(eventName)!.add(handler);
    }

    off(eventName: string, handler: EventHandler) {
        this.handlers.get(eventName)?.delete(handler);
    }

    emit(eventName: string) {
        this.handlers.get(eventName)?.forEach(handler => handler());
    }
}

function createMarker(rect: DOMRectInit) {
    return {
        getElement: () => ({
            getBoundingClientRect: () => ({
                left: rect.left ?? 0,
                top: rect.top ?? 0,
                width: rect.width ?? 0,
                height: rect.height ?? 0
            })
        })
    } as any;
}

describe('useMapWatchers', () => {
    it('keeps the tooltip anchored to the active marker while the map moves', async () => {
        const mapInstance = new FakeMap();
        const marker = ref(createMarker({ left: 100, top: 40, width: 20, height: 20 }));
        const tooltipPosition = ref({ x: 0, y: 0 });
        const showLocationTooltip = ref(true);

        useMapWatchers({
            map: ref(mapInstance as any),
            geolocatedCoords: null,
            currentMarker: marker,
            tooltipMarker: marker,
            showLocationTooltip,
            tooltipPosition,
            tooltipLocationValid: ref(true),
            boundaryValidationMessage: ref(''),
            boundariesLoading: ref(false),
            isDesktop: ref(true),
            updateUserLocationMarker: vi.fn(),
            validateLocation: vi.fn(() => ({ valid: true, message: '' })),
            updateBoundaryLayer: vi.fn(),
            applyMaxBoundsFromBoundary: vi.fn()
        });

        await nextTick();
        mapInstance.emit('move');

        expect(tooltipPosition.value).toEqual({ x: 110, y: 40 });
    });

    it('reanchors to the new tooltip marker when the active marker changes', async () => {
        const mapInstance = new FakeMap();
        const currentMarker = ref(createMarker({ left: 50, top: 25, width: 20, height: 20 }));
        const tooltipMarker = ref(currentMarker.value);
        const tooltipPosition = ref({ x: 0, y: 0 });
        const showLocationTooltip = ref(true);

        useMapWatchers({
            map: ref(mapInstance as any),
            geolocatedCoords: null,
            currentMarker,
            tooltipMarker,
            showLocationTooltip,
            tooltipPosition,
            tooltipLocationValid: ref(true),
            boundaryValidationMessage: ref(''),
            boundariesLoading: ref(false),
            isDesktop: ref(true),
            updateUserLocationMarker: vi.fn(),
            validateLocation: vi.fn(() => ({ valid: true, message: '' })),
            updateBoundaryLayer: vi.fn(),
            applyMaxBoundsFromBoundary: vi.fn()
        });

        tooltipMarker.value = createMarker({ left: 200, top: 80, width: 24, height: 24 });

        await nextTick();
        mapInstance.emit('zoom');

        expect(tooltipPosition.value).toEqual({ x: 212, y: 80 });
    });
});
