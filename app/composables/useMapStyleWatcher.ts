import type maplibregl from 'maplibre-gl';
import type { Ref } from 'vue';
import type { Request } from '~~/types';

interface MapFunctions {
    resetInitialization?: () => void
    clearIcons?: () => void
    initializeMarkerLayers: () => Promise<void>
    updateGeoJSONSource: (markers: Request[], caller?: string) => Promise<void> | void
}

interface StyleWatcherOptions {
    map: Ref<maplibregl.Map | null>
    mapStyle: Ref<string | undefined>
    watchKey?: Ref<unknown>
    getMapFunctions: () => MapFunctions | null
    getMarkers: () => Request[]
    loadStyle?: (styleUrl: string) => Promise<boolean>
    /**
     * Called after the core marker layers have been rebuilt following a style
     * change. Use it to re-add composable-owned layers that setStyle() wiped
     * but that are NOT owned by useMap.initializeMarkerLayers (e.g. the boundary
     * polygon). Runs once per completed style rebuild.
     */
    afterRebuild?: () => void | Promise<void>
}

export function useMapStyleWatcher(options: StyleWatcherOptions) {
    const { map, mapStyle, watchKey, getMapFunctions, getMarkers, loadStyle, afterRebuild } = options;

    const setStyleAndWait = async (mapInstance: maplibregl.Map, styleUrl: string): Promise<boolean> => {
        mapInstance.setStyle(styleUrl);

        // After setStyle(), wait for the new style to be fully ready.
        // Cannot trust isStyleLoaded() immediately - it may return true
        // for the OLD style before MapLibre starts loading the new one.
        // Strategy: wait for 'styledata' (style JSON parsed), then poll
        // isStyleLoaded() to confirm sprites/glyphs are ready too.
        await new Promise<void>((resolve) => {
            let settled = false;
            const done = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                resolve();
            };

            const timeout = setTimeout(() => {
                if (import.meta.dev) {
                    console.warn('[StyleWatcher] Timeout waiting for style load');
                }
                done();
            }, 5000);

            mapInstance.once('styledata', () => {
                // styledata fired = new style JSON is parsed.
                // Now poll until isStyleLoaded() confirms sprites/glyphs are ready.
                const check = () => {
                    if (settled) return;
                    if (mapInstance.isStyleLoaded()) {
                        done();
                    } else {
                        requestAnimationFrame(check);
                    }
                };
                check();
            });
        });

        return true;
    };

    let latestRequestId = 0;
    let queuedStyle: string | undefined;
    let queuedRequestId = 0;
    let isProcessing = false;

    const rebuildLayers = async () => {
        const mapFunctions = getMapFunctions();
        if (!mapFunctions) return;

        // Reset and clear (also resets isAnimating guard)
        if (typeof mapFunctions.resetInitialization === 'function') {
            mapFunctions.resetInitialization();
        }
        if (typeof mapFunctions.clearIcons === 'function') {
            mapFunctions.clearIcons();
        }

        await mapFunctions.initializeMarkerLayers();

        // Use getter to always have fresh markers
        const currentMarkers = getMarkers();
        if (currentMarkers && currentMarkers.length > 0) {
            await mapFunctions.updateGeoJSONSource(currentMarkers, 'style-change');
        }

        // Re-add composable-owned layers that setStyle() wiped but useMap does
        // not own (boundary polygon, etc.). useMap-owned layers (reports,
        // clusters, facility, WMS config, spiderfy) were restored above.
        if (afterRebuild) {
            try {
                await afterRebuild();
            } catch (error) {
                if (import.meta.dev) {
                    console.error('[StyleWatcher] afterRebuild failed:', error);
                }
            }
        }
    };

    const processStyleQueue = async () => {
        if (isProcessing) return;

        isProcessing = true;
        try {
            while (queuedStyle) {
                const styleToLoad = queuedStyle;
                const requestId = queuedRequestId;
                queuedStyle = undefined;

                const m = map.value;
                if (!m) continue;

                const styleLoaded = loadStyle
                    ? await loadStyle(styleToLoad)
                    : await setStyleAndWait(m, styleToLoad);

                if (!styleLoaded || requestId !== latestRequestId) continue;

                await rebuildLayers();
            }
        } catch (error) {
            if (import.meta.dev) {
                console.error('[StyleWatcher] Error setting map style:', error);
            }
        } finally {
            isProcessing = false;
            if (queuedStyle) {
                void processStyleQueue();
            }
        }
    };

    const enqueueStyleChange = (newStyle: string | undefined) => {
        if (!newStyle) return;

        latestRequestId += 1;
        queuedStyle = newStyle;
        queuedRequestId = latestRequestId;
        void processStyleQueue();
    };

    watch(
        () => [mapStyle.value, watchKey?.value] as const,
        ([newStyle]) => enqueueStyleChange(newStyle)
    );
}
