import { describe, it, expect, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useMapStyleWatcher } from '@/composables/useMapStyleWatcher';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

class FakeLoadedMap {
    loaded = vi.fn(() => true);
}

function createMapFunctions() {
    return {
        resetInitialization: vi.fn(),
        clearIcons: vi.fn(),
        initializeMarkerLayers: vi.fn(async () => undefined),
        updateGeoJSONSource: vi.fn()
    };
}

describe('useMapStyleWatcher', () => {
    it('delegates style loading and rebuilds map layers after a successful style change', async () => {
        const mapStyle = ref('https://tiles.example/light.json');
        const mapFunctions = createMapFunctions();
        const loadStyle = vi.fn(async () => true);
        const markers = [{ service_request_id: '1' }];

        useMapStyleWatcher({
            map: ref(new FakeLoadedMap() as any),
            mapStyle,
            getMapFunctions: () => mapFunctions,
            getMarkers: () => markers as any,
            loadStyle
        });

        mapStyle.value = 'https://tiles.example/dark.json';
        await nextTick();
        await flushPromises();

        expect(loadStyle).toHaveBeenCalledWith('https://tiles.example/dark.json');
        expect(mapFunctions.resetInitialization).toHaveBeenCalledTimes(1);
        expect(mapFunctions.clearIcons).toHaveBeenCalledTimes(1);
        expect(mapFunctions.initializeMarkerLayers).toHaveBeenCalledTimes(1);
        expect(mapFunctions.updateGeoJSONSource).toHaveBeenCalledWith(markers, 'style-change');
    });

    it('does not rebuild map layers when style loading fails', async () => {
        const mapStyle = ref('https://tiles.example/light.json');
        const mapFunctions = createMapFunctions();

        useMapStyleWatcher({
            map: ref(new FakeLoadedMap() as any),
            mapStyle,
            getMapFunctions: () => mapFunctions,
            getMarkers: () => [],
            loadStyle: vi.fn(async () => false)
        });

        mapStyle.value = 'https://tiles.example/dark.json';
        await nextTick();
        await flushPromises();

        expect(mapFunctions.resetInitialization).not.toHaveBeenCalled();
        expect(mapFunctions.clearIcons).not.toHaveBeenCalled();
        expect(mapFunctions.initializeMarkerLayers).not.toHaveBeenCalled();
        expect(mapFunctions.updateGeoJSONSource).not.toHaveBeenCalled();
    });

    it('serializes rapid style changes and rebuilds only for the latest style', async () => {
        const mapStyle = ref('https://tiles.example/light.json');
        const mapFunctions = createMapFunctions();
        const markers = [{ service_request_id: '1' }];
        const resolvers: Array<(value: boolean) => void> = [];
        const loadStyle = vi.fn(() => new Promise<boolean>((resolve) => {
            resolvers.push(resolve);
        }));

        useMapStyleWatcher({
            map: ref(new FakeLoadedMap() as any),
            mapStyle,
            getMapFunctions: () => mapFunctions,
            getMarkers: () => markers as any,
            loadStyle
        });

        mapStyle.value = 'https://tiles.example/dark.json';
        await nextTick();
        await flushPromises();

        mapStyle.value = 'https://tiles.example/light.json';
        await nextTick();
        await flushPromises();

        expect(loadStyle).toHaveBeenCalledTimes(1);
        expect(loadStyle).toHaveBeenNthCalledWith(1, 'https://tiles.example/dark.json');

        resolvers[0](true);
        await flushPromises();

        expect(loadStyle).toHaveBeenCalledTimes(2);
        expect(loadStyle).toHaveBeenNthCalledWith(2, 'https://tiles.example/light.json');
        expect(mapFunctions.initializeMarkerLayers).not.toHaveBeenCalled();

        resolvers[1](true);
        await flushPromises();

        expect(mapFunctions.resetInitialization).toHaveBeenCalledTimes(1);
        expect(mapFunctions.clearIcons).toHaveBeenCalledTimes(1);
        expect(mapFunctions.initializeMarkerLayers).toHaveBeenCalledTimes(1);
        expect(mapFunctions.updateGeoJSONSource).toHaveBeenCalledWith(markers, 'style-change');
    });

    it('reloads layers when the watch key changes but the style URL stays the same', async () => {
        const mapStyle = ref('https://tiles.example/shared.json');
        const watchKey = ref('light:https://tiles.example/shared.json');
        const mapFunctions = createMapFunctions();
        const loadStyle = vi.fn(async () => true);

        useMapStyleWatcher({
            map: ref(new FakeLoadedMap() as any),
            mapStyle,
            watchKey,
            getMapFunctions: () => mapFunctions,
            getMarkers: () => [],
            loadStyle
        });

        watchKey.value = 'dark:https://tiles.example/shared.json';
        await nextTick();
        await flushPromises();

        expect(loadStyle).toHaveBeenCalledWith('https://tiles.example/shared.json');
        expect(mapFunctions.resetInitialization).toHaveBeenCalledTimes(1);
        expect(mapFunctions.clearIcons).toHaveBeenCalledTimes(1);
        expect(mapFunctions.initializeMarkerLayers).toHaveBeenCalledTimes(1);
    });
});
