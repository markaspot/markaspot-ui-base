// composables/map/useSelectedMarkerAnimation.ts

/**
 * Selected Marker Animation Composable
 *
 * Provides visual feedback when a user clicks/selects a map pin.
 * Three animation types are available:
 *   - bounce (default): Temporary symbol layer animates icon-translate Y offset
 *   - pulse: Expanding, fading circle ring around the selected pin
 *   - glow: Static soft glow circle beneath the selected pin
 *
 * Distinct from hover pulse (CSS pulse-marker) and keyboard highlight (circle layer).
 * Respects prefers-reduced-motion: animations are skipped, only static indicators shown.
 */

import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import { PIN_ANCHOR_TO_CENTER_OFFSET } from './useMapIcons';

interface SelectedAnimationConfig {
    enabled: boolean
    type: 'bounce' | 'pulse' | 'glow'
}

interface ShowOptions {
    coordinates: [number, number]
    featureId?: string
}

// Layer/source IDs used by this composable (namespaced to avoid collisions)
const SELECTED_SOURCE = 'selected-marker-anim';
const SELECTED_BOUNCE_LAYER = 'selected-marker-bounce';
const SELECTED_PULSE_LAYER = 'selected-marker-pulse';
const SELECTED_GLOW_LAYER = 'selected-marker-glow';

export function useSelectedMarkerAnimation(map: Ref<MapLibreMap | null>) {
    const { selectedAnimation } = useMapSettings();
    const { primaryColor } = useThemeColors();

    // Track active animation frame and timeouts for cancellation
    let activeRafId: number | null = null;
    let activeTimeoutId: ReturnType<typeof setTimeout> | null = null;

    /**
     * Check if the user prefers reduced motion
     */
    const prefersReducedMotion = (): boolean => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    /**
     * Safely remove a layer and its source from the map
     */
    const removeLayerAndSource = (layerId: string, sourceId?: string) => {
        const m = map.value;
        if (!m) return;

        try {
            if (m.getLayer(layerId)) {
                m.removeLayer(layerId);
            }
        } catch {
            // Layer may already be removed
        }

        if (sourceId) {
            try {
                if (m.getSource(sourceId)) {
                    m.removeSource(sourceId);
                }
            } catch {
                // Source may already be removed
            }
        }
    };

    /**
     * Clean up all animation artifacts (layers, sources, rAF)
     */
    const remove = (): void => {
        // Cancel any running animation frame
        if (activeRafId !== null) {
            cancelAnimationFrame(activeRafId);
            activeRafId = null;
        }

        // Cancel any pending timeouts (reduced-motion fallbacks)
        if (activeTimeoutId !== null) {
            clearTimeout(activeTimeoutId);
            activeTimeoutId = null;
        }

        removeLayerAndSource(SELECTED_BOUNCE_LAYER);
        removeLayerAndSource(SELECTED_PULSE_LAYER, SELECTED_SOURCE);
        removeLayerAndSource(SELECTED_GLOW_LAYER, SELECTED_SOURCE);
    };

    /**
     * Ensure a dedicated GeoJSON point source exists at the given coordinates
     */
    const ensureSource = (coordinates: [number, number]): void => {
        const m = map.value;
        if (!m) return;

        const data: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates },
                properties: {}
            }]
        };

        const existing = m.getSource(SELECTED_SOURCE);
        if (existing && existing.type === 'geojson') {
            (existing as GeoJSONSource).setData(data);
        } else if (!existing) {
            m.addSource(SELECTED_SOURCE, { type: 'geojson', data });
        }
    };

    /**
     * Bounce animation: Animate icon-translate Y from 0 to -15px and back
     * over 400ms with ease-out timing. Uses a filter on the reports-geojson
     * source to show only the selected feature in a temporary symbol layer.
     */
    const showBounce = (options: ShowOptions): void => {
        const m = map.value;
        if (!m) return;

        const { featureId } = options;
        const reducedMotion = prefersReducedMotion();

        // For bounce, we use the reports-geojson source with a filter
        // to display the same pin icon with an animated offset.
        // The layer reads icon from ['get', 'icon'] on the source data.
        if (!featureId) {
            showPulse(options);
            return;
        }

        try {
            // Add a temporary symbol layer filtered to the selected feature
            m.addLayer({
                id: SELECTED_BOUNCE_LAYER,
                type: 'symbol',
                source: 'reports-geojson',
                filter: ['any',
                    ['==', ['get', 'id'], featureId],
                    ['==', ['get', 'service_request_id'], featureId]
                ],
                layout: {
                    'icon-image': ['get', 'icon'],
                    'icon-anchor': 'bottom',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                },
                paint: {
                    'icon-translate': [0, 0],
                    'icon-opacity': 1
                }
            });

            if (reducedMotion) {
                // Static offset only, no animation. Clean up after a brief display.
                m.setPaintProperty(SELECTED_BOUNCE_LAYER, 'icon-translate', [0, -8]);
                activeTimeoutId = setTimeout(() => {
                    activeTimeoutId = null;
                    removeLayerAndSource(SELECTED_BOUNCE_LAYER);
                }, 600);
                return;
            }

            // Animate over 400ms: Y goes 0 -> -15 -> 0 with ease-out
            const duration = 400;
            const startTime = performance.now();

            const animate = (now: number) => {
                if (!m.getLayer(SELECTED_BOUNCE_LAYER)) {
                    // Layer was removed mid-animation (e.g. setStyle wiped it).
                    // Null the id and clean up so there is no orphaned source/layer reference.
                    activeRafId = null;
                    removeLayerAndSource(SELECTED_BOUNCE_LAYER);
                    return;
                }

                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Sinusoidal bounce: single arc up and back down
                // ease-out: decelerate as it returns
                const eased = Math.sin(progress * Math.PI);
                const yOffset = -15 * eased;

                try {
                    m.setPaintProperty(SELECTED_BOUNCE_LAYER, 'icon-translate', [0, yOffset]);
                } catch {
                    // Layer may have been removed mid-animation
                    activeRafId = null;
                    return;
                }

                if (progress < 1) {
                    activeRafId = requestAnimationFrame(animate);
                } else {
                    // Animation complete, remove the temporary layer
                    activeRafId = null;
                    removeLayerAndSource(SELECTED_BOUNCE_LAYER);
                }
            };

            activeRafId = requestAnimationFrame(animate);
        } catch (error) {
            console.warn('[useSelectedMarkerAnimation] Bounce error:', error);
            removeLayerAndSource(SELECTED_BOUNCE_LAYER);
        }
    };

    /**
     * Pulse animation: Expanding circle from 20px to 50px, fading from 0.6 to 0
     * Uses a dedicated source + circle layer under symbol layers.
     */
    const showPulse = (options: ShowOptions): void => {
        const m = map.value;
        if (!m) return;

        const { coordinates } = options;
        const reducedMotion = prefersReducedMotion();

        try {
            ensureSource(coordinates);

            // Insert below the first symbol layer so the circle appears under pins
            const layers = m.getStyle().layers;
            const firstSymbolId = layers?.find(l => l.type === 'symbol')?.id;

            const color = primaryColor.value || '#6366f1';

            m.addLayer({
                id: SELECTED_PULSE_LAYER,
                type: 'circle',
                source: SELECTED_SOURCE,
                paint: {
                    'circle-radius': reducedMotion ? 35 : 20,
                    'circle-color': 'transparent',
                    'circle-stroke-width': 3,
                    'circle-stroke-color': color,
                    'circle-opacity': reducedMotion ? 0.4 : 0.6,
                    'circle-stroke-opacity': reducedMotion ? 0.4 : 0.6,
                    'circle-translate': [0, -PIN_ANCHOR_TO_CENTER_OFFSET]
                }
            }, firstSymbolId);

            if (reducedMotion) {
                // Static ring, remove after 800ms
                activeTimeoutId = setTimeout(() => {
                    activeTimeoutId = null;
                    removeLayerAndSource(SELECTED_PULSE_LAYER, SELECTED_SOURCE);
                }, 800);
                return;
            }

            // Animate over 600ms
            const duration = 600;
            const startTime = performance.now();

            const animate = (now: number) => {
                if (!m.getLayer(SELECTED_PULSE_LAYER)) {
                    // Layer was removed mid-animation (e.g. setStyle wiped it).
                    activeRafId = null;
                    removeLayerAndSource(SELECTED_PULSE_LAYER, SELECTED_SOURCE);
                    return;
                }

                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);

                const radius = 20 + (30 * eased); // 20 -> 50
                const opacity = 0.6 * (1 - eased); // 0.6 -> 0

                try {
                    m.setPaintProperty(SELECTED_PULSE_LAYER, 'circle-radius', radius);
                    m.setPaintProperty(SELECTED_PULSE_LAYER, 'circle-opacity', opacity);
                    m.setPaintProperty(SELECTED_PULSE_LAYER, 'circle-stroke-opacity', opacity);
                } catch {
                    activeRafId = null;
                    return;
                }

                if (progress < 1) {
                    activeRafId = requestAnimationFrame(animate);
                } else {
                    activeRafId = null;
                    removeLayerAndSource(SELECTED_PULSE_LAYER, SELECTED_SOURCE);
                }
            };

            activeRafId = requestAnimationFrame(animate);
        } catch (error) {
            console.warn('[useSelectedMarkerAnimation] Pulse error:', error);
            removeLayerAndSource(SELECTED_PULSE_LAYER, SELECTED_SOURCE);
        }
    };

    /**
     * Glow animation: Static soft blurred circle beneath the selected pin.
     * Persists until remove() is called (e.g., on deselection).
     */
    const showGlow = (options: ShowOptions): void => {
        const m = map.value;
        if (!m) return;

        const { coordinates } = options;

        try {
            ensureSource(coordinates);

            const layers = m.getStyle().layers;
            const firstSymbolId = layers?.find(l => l.type === 'symbol')?.id;

            const color = primaryColor.value || '#6366f1';

            m.addLayer({
                id: SELECTED_GLOW_LAYER,
                type: 'circle',
                source: SELECTED_SOURCE,
                paint: {
                    'circle-radius': 30,
                    'circle-color': color,
                    'circle-opacity': 0.35,
                    'circle-blur': 1,
                    'circle-translate': [0, -PIN_ANCHOR_TO_CENTER_OFFSET]
                }
            }, firstSymbolId);
        } catch (error) {
            console.warn('[useSelectedMarkerAnimation] Glow error:', error);
            removeLayerAndSource(SELECTED_GLOW_LAYER, SELECTED_SOURCE);
        }
    };

    /**
     * Show the selected-pin animation at the given coordinates.
     * Animation type is determined by the jurisdiction config.
     */
    const show = (feature: { coordinates: [number, number], featureId?: string }): void => {
        const config = selectedAnimation.value as SelectedAnimationConfig;
        if (!config.enabled) return;

        // Clean up any previous animation before starting a new one
        remove();

        const options: ShowOptions = {
            coordinates: feature.coordinates,
            featureId: feature.featureId
        };

        switch (config.type) {
            case 'pulse':
                showPulse(options);
                break;
            case 'glow':
                showGlow(options);
                break;
            case 'bounce':
            default:
                showBounce(options);
                break;
        }
    };

    // Self-clean when the owning scope (e.g. useMapManager) is torn down, ensuring the
    // glow layer and SELECTED_SOURCE are removed even if the caller omits remove() on unmount.
    onScopeDispose(() => remove());

    return { show, remove };
}
