/* eslint-disable @typescript-eslint/no-extraneous-class */
import type { Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';

export interface MapKeyboardNavigationOptions {
    enabled?: boolean
    highlightStyle?: {
        circleRadius?: number
        circleColor?: string
        circleStrokeWidth?: number
        circleStrokeColor?: string
    }
    navigation?: {
        deltaDistance?: number
        directionThreshold?: number
        animationDuration?: number
        easingFunction?: (t: number) => number
    }
}

export interface NavigationFeature {
    type: 'Feature'
    geometry: {
        type: 'Point'
        coordinates: [number, number]
    }
    properties: {
        id?: string
        cluster?: boolean
        cluster_id?: number
        point_count?: number
        isLeaf?: boolean
        iconOffset?: [number, number] | string
        [key: string]: unknown
    }
    layer?: {
        id: string
    }
    /** Pixel offset from geometry coordinates (used by spider-expanded markers) */
    screenOffset?: [number, number]
}

interface SpiderfyCallbacks {
    /** Called to expand a cluster into spider markers */
    handleClusterClick?: (clusterId: number, clusterCoords: { lng: number, lat: number }) => Promise<void>
    /** Called to collapse spider markers */
    unspiderfyAll?: () => void
    /** Returns true when spider markers are currently displayed */
    isSpiderfied?: () => boolean
}

interface NavigationCallbacks {
    onSelectReport?: (report: unknown, mapInstance: MapLibreMap | null) => void
    onCloseModal?: () => void
    spiderfy?: SpiderfyCallbacks
}

// Constants
const DEFAULT_OPTIONS = {
    enabled: true,
    navigation: {
        deltaDistance: 100,
        directionThreshold: 20,
        animationDuration: 500,
        easingFunction: (t: number) => t * (2 - t)
    }
} as const;

const KEYBOARD_EVENTS = {
    NAVIGATION: ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'],
    FOCUS_TRIGGERS: ['Tab', 'Enter', ' '],
    SELECTION: ['Enter', ' '],
    ESCAPE: ['Escape'],
    ZOOM_IN: ['=', '+'],
    ZOOM_OUT: ['-']
} as const;

/**
 * Enhanced Map Keyboard Navigation Composable
 *
 * Provides accessible keyboard navigation for map markers with clean separation of concerns.
 */
export function useMapKeyboardNavigation(
    map: Ref<MapLibreMap | null>,
    markers: Ref<unknown[]>,
    options: MapKeyboardNavigationOptions = {}
) {
    const { t } = useI18n();

    // Merge options with defaults
    const config = {
        ...DEFAULT_OPTIONS,
        ...options,
        navigation: {
            ...DEFAULT_OPTIONS.navigation,
            ...options.navigation
        }
    };

    // Detect prefers-reduced-motion once at composable creation (SSR-safe)
    const prefersReducedMotion = import.meta.client
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    /**
     * Return animation duration respecting user's motion preference.
     * Pass duration: 0 (instant) when reduce is requested.
     */
    const getAnimationDuration = (requested: number): number =>
        prefersReducedMotion ? 0 : requested;

    // Focus-highlight: use high-contrast white halo + dark inner stroke
    // instead of the raw primary color (which may not contrast against arbitrary basemaps).
    const highlightStyle = {
        circleRadius: 28,
        circleColor: 'rgba(255,255,255,0.15)',
        circleStrokeWidth: 4,
        circleStrokeColor: '#1a1a1a',
        ...options.highlightStyle
    };

    // Store navigation callbacks (set during setupKeyboardNavigation)
    let navigationCallbacks: NavigationCallbacks = {};

    // Reactive state
    const state = {
        currentMarkerIndex: ref(-1),
        currentFocusedFeature: ref<NavigationFeature | null>(null),
        availableFeatures: ref<NavigationFeature[]>([]),
        keyboardNavigationSetup: ref(false),
        lastZoomLevel: ref(0),
        focusViaKeyboard: ref(false)
    };

    // Computed properties
    const hasVisibleFeatures = computed(() => state.availableFeatures.value.length > 0);
    const currentFeature = computed(() => state.currentFocusedFeature.value);

    // Event listeners cleanup
    const eventListeners: Array<() => void> = [];

    // Pending once('idle') teardown and setTimeout id for waitForIdleAndFocus
    let pendingIdleOff: (() => void) | null = null;
    let pendingClusterTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // RAF id for throttled refreshFeatures
    let pendingRefreshRaf: ReturnType<typeof requestAnimationFrame> | null = null;

    /**
     * Feature Discovery and Management
     */
    class FeatureManager {
        static getVisibleFeatures(): NavigationFeature[] {
            if (!map.value) return [];

            const bounds = map.value.getBounds();
            const viewportBounds = {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
            };

            // Query rendered features (wrapped in try-catch for basemap tile parsing errors)
            let clusterFeatures: MapGeoJSONFeature[] = [];
            let markerFeatures: MapGeoJSONFeature[] = [];
            let spiderFeatures: MapGeoJSONFeature[] = [];
            try {
                const clusterLayers = ['clusters'].filter(l => map.value!.getLayer(l));
                if (clusterLayers.length > 0) {
                    clusterFeatures = map.value.queryRenderedFeatures({ layers: clusterLayers });
                }

                const reportLayers = ['reports-symbols'].filter(l => map.value!.getLayer(l));
                if (reportLayers.length > 0) {
                    markerFeatures = map.value.queryRenderedFeatures({ layers: reportLayers });
                }

                // Query spider-expanded markers when spiderfy is active
                if (map.value.getLayer('spiderfy-leaves')) {
                    spiderFeatures = map.value.queryRenderedFeatures({ layers: ['spiderfy-leaves'] });
                }
            } catch {
                // Ignore tile parsing errors from basemap
            }

            const allFeatures = [...clusterFeatures, ...markerFeatures, ...spiderFeatures];

            // Project each feature once here so sort and direction search share the same points
            const projected = new Map<string, { x: number, y: number }>();
            const center = map.value.getCenter();
            const centerPoint = map.value.project(center);

            return allFeatures
                .map(FeatureManager.convertToNavigationFeature)
                .filter((f): f is NavigationFeature => f !== null)
                .filter(f => FeatureManager.isInViewport(f.geometry.coordinates, viewportBounds))
                .map((f) => {
                    const key = `${f.geometry.coordinates[0]},${f.geometry.coordinates[1]},${f.screenOffset ? f.screenOffset.join(',') : ''}`;
                    if (!projected.has(key)) {
                        projected.set(key, FeatureManager.projectFeature(f));
                    }
                    return { f, pt: projected.get(key)! };
                })
                .sort((a, b) => {
                    const da = Math.hypot(a.pt.x - centerPoint.x, a.pt.y - centerPoint.y);
                    const db = Math.hypot(b.pt.x - centerPoint.x, b.pt.y - centerPoint.y);
                    return da - db;
                })
                .map(({ f }) => f);
        }

        static convertToNavigationFeature(feature: MapGeoJSONFeature): NavigationFeature | null {
            const coords = FeatureManager.getFeatureCoordinates(feature);
            if (!coords) return null;

            const props = feature.properties || {};
            const navFeature: NavigationFeature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coords
                },
                properties: props as NavigationFeature['properties'],
                layer: feature.layer ? { id: feature.layer.id } : undefined
            };

            // Spider leaves use icon-offset for positioning; capture it for screen-space calculations
            if (props.isLeaf && props.iconOffset) {
                try {
                    const offset = typeof props.iconOffset === 'string'
                        ? JSON.parse(props.iconOffset as string)
                        : props.iconOffset;
                    if (Array.isArray(offset) && offset.length >= 2) {
                        navFeature.screenOffset = [offset[0] as number, offset[1] as number];
                    }
                } catch {
                    // Malformed iconOffset string — continue without screenOffset
                }
            }

            return navFeature;
        }

        static getFeatureCoordinates(feature: MapGeoJSONFeature): [number, number] | null {
            if (feature.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
                const coords = feature.geometry.coordinates;
                if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                    return [coords[0], coords[1]];
                }
            }
            return null;
        }

        static isInViewport(coordinates: [number, number], bounds: { north: number, south: number, east: number, west: number }): boolean {
            return coordinates[1] >= bounds.south &&
              coordinates[1] <= bounds.north &&
              coordinates[0] >= bounds.west &&
              coordinates[0] <= bounds.east;
        }

        /** Project a feature to screen coordinates, accounting for spider icon offsets */
        static projectFeature(feature: NavigationFeature): { x: number, y: number } {
            const point = map.value!.project(feature.geometry.coordinates);
            if (feature.screenOffset) {
                point.x += feature.screenOffset[0];
                point.y += feature.screenOffset[1];
            }
            return point;
        }

        /**
         * Throttle via RAF so holding an arrow key does not fire a heavy
         * queryRenderedFeatures on every key-repeat. Coalesces rapid calls
         * so only one refresh runs per animation frame.
         */
        static refreshFeatures(): void {
            if (pendingRefreshRaf !== null) return; // already queued
            pendingRefreshRaf = requestAnimationFrame(() => {
                pendingRefreshRaf = null;
                FeatureManager._doRefresh();
            });
        }

        static _doRefresh(): void {
            const currentZoom = map.value?.getZoom() || 0;
            const zoomChanged = Math.abs(currentZoom - state.lastZoomLevel.value) > 0.5;

            if (state.availableFeatures.value.length === 0 || zoomChanged) {
                state.lastZoomLevel.value = currentZoom;
                state.availableFeatures.value = FeatureManager.getVisibleFeatures();

                // Reset index if out of bounds
                if (state.currentMarkerIndex.value >= state.availableFeatures.value.length) {
                    state.currentMarkerIndex.value = -1;
                }
            }
        }
    }

    /**
     * Visual Highlighting System
     */
    class HighlightManager {
        static clear(): void {
            if (!map.value) return;

            try {
                if (map.value.getLayer('keyboard-highlight')) {
                    map.value.removeLayer('keyboard-highlight');
                }
                if (map.value.getSource('keyboard-highlight')) {
                    map.value.removeSource('keyboard-highlight');
                }
            } catch (error) {
                console.error('Error clearing feature highlights:', error);
            }
        }

        static highlight(feature: NavigationFeature): void {
            if (!map.value) return;

            // highlight() self-clears; callers should NOT call clear() before highlight()
            HighlightManager.clear();

            // For spider leaves, compute actual screen position and convert back to coordinates
            let highlightFeature: NavigationFeature = feature;
            if (feature.screenOffset) {
                const screenPoint = FeatureManager.projectFeature(feature);
                const lngLat = map.value.unproject([screenPoint.x, screenPoint.y]);
                highlightFeature = {
                    ...feature,
                    geometry: {
                        type: 'Point',
                        coordinates: [lngLat.lng, lngLat.lat]
                    }
                };
            }

            const highlightData: GeoJSON.FeatureCollection = {
                type: 'FeatureCollection',
                features: [highlightFeature]
            };

            try {
                map.value.addSource('keyboard-highlight', {
                    type: 'geojson',
                    data: highlightData
                });

                map.value.addLayer({
                    id: 'keyboard-highlight',
                    type: 'circle',
                    source: 'keyboard-highlight',
                    paint: {
                        'circle-radius': feature.properties.cluster ? 35 : highlightStyle.circleRadius,
                        'circle-color': highlightStyle.circleColor,
                        'circle-stroke-width': highlightStyle.circleStrokeWidth,
                        'circle-stroke-color': highlightStyle.circleStrokeColor
                    }
                });
            } catch (error) {
                console.error('Error highlighting feature:', error);
            }
        }
    }

    /**
     * Navigation Logic
     */
    class NavigationController {
        static panInDirection(direction: 'right' | 'left' | 'up' | 'down'): void {
            if (!map.value) return;

            const { deltaDistance, easingFunction } = config.navigation;
            const panVectors: Record<string, [number, number]> = {
                up: [0, -deltaDistance],
                down: [0, deltaDistance],
                left: [-deltaDistance, 0],
                right: [deltaDistance, 0]
            };

            // Respect prefers-reduced-motion: omit easing when instant movement is preferred
            if (prefersReducedMotion) {
                map.value.panBy(panVectors[direction]);
            } else {
                map.value.panBy(panVectors[direction], { easing: easingFunction });
            }
        }

        static findFeatureInDirection(
            currentFeature: NavigationFeature,
            direction: 'right' | 'left' | 'up' | 'down'
        ): { feature: NavigationFeature | null, index: number } {
            if (!map.value) return { feature: null, index: -1 };

            const currentPoint = FeatureManager.projectFeature(currentFeature);
            const { directionThreshold } = config.navigation;

            let bestFeature: NavigationFeature | null = null;
            let bestDistance = Infinity;
            let bestIndex = -1;

            state.availableFeatures.value.forEach((feature, index) => {
                if (index === state.currentMarkerIndex.value) return;

                const featurePoint = FeatureManager.projectFeature(feature);

                const deltaX = featurePoint.x - currentPoint.x;
                const deltaY = featurePoint.y - currentPoint.y;

                const isInDirection = NavigationController.checkDirection(direction, deltaX, deltaY, directionThreshold);

                if (isInDirection) {
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestFeature = feature;
                        bestIndex = index;
                    }
                }
            });

            return { feature: bestFeature, index: bestIndex };
        }

        static checkDirection(
            direction: 'right' | 'left' | 'up' | 'down',
            deltaX: number,
            deltaY: number,
            threshold: number
        ): boolean {
            switch (direction) {
                case 'right': return deltaX > threshold;
                case 'left': return deltaX < -threshold;
                case 'down': return deltaY > threshold;
                case 'up': return deltaY < -threshold;
                default: return false;
            }
        }

        static navigateToFeature(direction: 'right' | 'left' | 'up' | 'down'): void {
            FeatureManager._doRefresh();

            if (!hasVisibleFeatures.value) {
                NavigationController.handleNoFeatures();
                return;
            }

            const targetFeature = NavigationController.getTargetFeature(direction);
            if (!targetFeature) return;

            NavigationController.setCurrentFeature(targetFeature.feature, targetFeature.index);
            NavigationController.focusFeature(targetFeature.feature);
        }

        static getTargetFeature(direction: 'right' | 'left' | 'up' | 'down') {
            if (state.currentMarkerIndex.value === -1 || !state.currentFocusedFeature.value) {
                const firstFeature = state.availableFeatures.value[0];
                return firstFeature ? { feature: firstFeature, index: 0 } : null;
            }

            return NavigationController.findFeatureInDirection(state.currentFocusedFeature.value, direction);
        }

        static setCurrentFeature(feature: NavigationFeature, index: number): void {
            state.currentFocusedFeature.value = feature;
            state.currentMarkerIndex.value = index;
        }

        static focusFeature(feature: NavigationFeature): void {
            // highlight() already clears; no need to call clear() first
            HighlightManager.highlight(feature);

            // For spider leaves, don't re-center (they orbit the cluster center)
            if (!feature.screenOffset) {
                map.value?.easeTo({
                    center: feature.geometry.coordinates,
                    duration: getAnimationDuration(500)
                });
            }

            AriaManager.updateLabel(AriaManager.getFeatureLabel(feature));
        }

        static handleNoFeatures(): void {
            HighlightManager.clear();
            state.currentFocusedFeature.value = null;
            state.currentMarkerIndex.value = -1;
            AriaManager.updateLabel(t('map.keyboard.noFeatures'));
        }

        static smartNavigate(direction: 'right' | 'left' | 'up' | 'down'): void {
            const originalIndex = state.currentMarkerIndex.value;
            const originalFocused = state.currentFocusedFeature.value;

            NavigationController.navigateToFeature(direction);

            if (
                state.currentMarkerIndex.value === originalIndex &&
                state.currentFocusedFeature.value === originalFocused &&
                !hasVisibleFeatures.value
            ) {
                NavigationController.panInDirection(direction);
                AriaManager.updateLabel(t('map.keyboard.pannedNoMarkers', { direction }));
            }
        }
    }

    /**
     * ARIA and Accessibility Management
     */
    class AriaManager {
        static updateLabel(label: string): void {
            const canvas = map.value?.getCanvas();
            if (canvas) {
                canvas.setAttribute('aria-label', label);
            }
        }

        static getFeatureLabel(feature: NavigationFeature): string {
            const position = t('map.keyboard.featurePosition', {
                current: state.currentMarkerIndex.value + 1,
                total: state.availableFeatures.value.length
            });

            if (feature.properties.cluster) {
                return t('map.keyboard.clusterFocused', {
                    count: feature.properties.point_count ?? 0,
                    position
                });
            }

            const report = markers.value.find(
                (m): m is { service_request_id: string, service_name?: string, address_string?: string } =>
                    typeof m === 'object' && m !== null &&
                    'service_request_id' in m &&
                    (m as { service_request_id: string }).service_request_id === feature.properties.id
            );
            const context = feature.properties.isLeaf ? t('map.keyboard.expandedContext') : '';
            return t('map.keyboard.markerFocused', {
                name: report?.service_name || t('map.keyboard.untitledReport'),
                address: report?.address_string || t('map.keyboard.unknownLocation'),
                context,
                position
            });
        }

        static setupCanvas(): void {
            const canvas = map.value?.getCanvas();
            if (!canvas) return;

            canvas.setAttribute('tabindex', '0');
            canvas.setAttribute('role', 'application');
            canvas.setAttribute('aria-label', t('map.keyboard.canvasInstructions'));
        }
    }

    /**
     * Event Handling System
     */
    class EventManager {
        static setupKeyboardEvents(callbacks: NavigationCallbacks): void {
            const canvas = map.value?.getCanvas();
            if (!canvas) return;

            const keydownHandler = (e: KeyboardEvent) => EventManager.handleKeydown(e, callbacks);
            const mousedownHandler = () => EventManager.handleMousedown();
            const focusHandler = () => EventManager.handleFocus();
            const blurHandler = () => EventManager.handleBlur();

            canvas.addEventListener('keydown', keydownHandler);
            canvas.addEventListener('mousedown', mousedownHandler);
            canvas.addEventListener('focus', focusHandler);
            canvas.addEventListener('blur', blurHandler);

            eventListeners.push(
                () => canvas.removeEventListener('keydown', keydownHandler),
                () => canvas.removeEventListener('mousedown', mousedownHandler),
                () => canvas.removeEventListener('focus', focusHandler),
                () => canvas.removeEventListener('blur', blurHandler)
            );
        }

        static handleKeydown(e: KeyboardEvent, callbacks: NavigationCallbacks): void {
            if ((KEYBOARD_EVENTS.FOCUS_TRIGGERS as readonly string[]).includes(e.key)) {
                state.focusViaKeyboard.value = true;
            }

            if ((KEYBOARD_EVENTS.NAVIGATION as readonly string[]).includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();

                const direction = e.key.replace('Arrow', '').toLowerCase() as 'right' | 'left' | 'down' | 'up';

                if (e.shiftKey) {
                    NavigationController.panInDirection(direction);
                    AriaManager.updateLabel(t('map.keyboard.pannedToExplore', { direction }));
                } else {
                    NavigationController.smartNavigate(direction);
                }
                return;
            }

            EventManager.handleSpecialKeys(e, callbacks);
        }

        static handleSpecialKeys(e: KeyboardEvent, callbacks: NavigationCallbacks): void {
            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    e.stopPropagation();
                    SelectionController.selectCurrentFeature(callbacks.onSelectReport);
                    break;

                case 'Escape': {
                    const isSpiderfied = callbacks.spiderfy?.isSpiderfied?.();
                    const hasActiveSelection = !!state.currentFocusedFeature.value;

                    // Only handle Escape (and consume the event) when there is actually
                    // something to dismiss. Otherwise let it bubble so ancestor dialogs/
                    // drawers can handle it.
                    if (isSpiderfied || hasActiveSelection || callbacks.onCloseModal) {
                        e.preventDefault();
                        e.stopPropagation();

                        if (isSpiderfied) {
                            // If spider markers are expanded, collapse them first
                            callbacks.spiderfy!.unspiderfyAll?.();
                            SelectionController.clearSelection();
                            state.availableFeatures.value = [];
                            // Wait for map to re-cluster before focusing
                            SelectionController.waitForIdleAndFocus();
                            break;
                        }
                        if (callbacks.onCloseModal) callbacks.onCloseModal();
                        SelectionController.clearSelection();
                        // Only zoom out when there was an active selection; otherwise just clear
                        if (hasActiveSelection) {
                            map.value?.zoomOut();
                            // After zoom-out settles, re-focus on visible features
                            SelectionController.waitForIdleAndFocus();
                        }
                    }
                    break;
                }

                case '=':
                case '+':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        map.value?.zoomIn();
                    }
                    break;

                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        map.value?.zoomOut();
                    }
                    break;
            }
        }

        static handleMousedown(): void {
            state.focusViaKeyboard.value = false;
        }

        static handleFocus(): void {
            if (state.focusViaKeyboard.value && hasVisibleFeatures.value) {
                // Focus the geographically nearest visible feature (availableFeatures[0]),
                // not an arbitrary off-screen marker from the raw markers prop.
                FocusController.focusMarker();
            }
            state.focusViaKeyboard.value = false;
        }

        static handleBlur(): void {
            state.availableFeatures.value = [];
            state.currentMarkerIndex.value = -1;
            HighlightManager.clear();
        }
    }

    /**
     * Selection and Interaction Controller
     */
    class SelectionController {
        static selectCurrentFeature(onSelectReport?: (report: unknown, mapInstance: MapLibreMap | null) => void): void {
            if (!state.currentFocusedFeature.value) {
                SelectionController.startNavigation();
                return;
            }

            const feature = state.currentFocusedFeature.value;

            if (feature.properties.cluster) {
                SelectionController.handleClusterSelection(feature);
            } else if (feature.properties.id) {
                SelectionController.handleMarkerSelection(feature, onSelectReport);
            }
        }

        static startNavigation(): void {
            FeatureManager._doRefresh();
            if (hasVisibleFeatures.value) {
                const firstFeature = state.availableFeatures.value[0];
                NavigationController.setCurrentFeature(firstFeature, 0);
                HighlightManager.highlight(firstFeature);
                AriaManager.updateLabel(AriaManager.getFeatureLabel(firstFeature));
            } else {
                AriaManager.updateLabel(t('map.keyboard.noFeatures'));
            }
        }

        static handleClusterSelection(feature: NavigationFeature): void {
            const coordinates = feature.geometry.coordinates;
            const clusterId = feature.properties.cluster_id;

            // Use spiderfy's handleClusterClick when available
            if (clusterId && navigationCallbacks.spiderfy?.handleClusterClick) {
                const lngLat = { lng: coordinates[0], lat: coordinates[1] };
                navigationCallbacks.spiderfy.handleClusterClick(clusterId, lngLat).then(() => {
                    // Track the timeout so it can be cancelled on unmount
                    pendingClusterTimeoutId = setTimeout(() => {
                        pendingClusterTimeoutId = null;
                        state.availableFeatures.value = [];
                        FeatureManager._doRefresh();
                        SelectionController.clearSelection();
                        SelectionController.restoreCanvasFocus();

                        if (hasVisibleFeatures.value) {
                            const firstFeature = state.availableFeatures.value[0];
                            NavigationController.setCurrentFeature(firstFeature, 0);
                            HighlightManager.highlight(firstFeature);
                            const isSpider = firstFeature.properties.isLeaf;
                            AriaManager.updateLabel(
                                isSpider
                                    ? t('map.keyboard.clusterExpanded', {
                                        count: state.availableFeatures.value.filter(f => f.properties.isLeaf).length,
                                        featureLabel: AriaManager.getFeatureLabel(firstFeature)
                                    })
                                    : AriaManager.getFeatureLabel(firstFeature)
                            );
                        }
                    }, 300);
                });
                return;
            }

            // Fallback: zoom in without spiderfy
            const currentZoom = map.value?.getZoom() || 0;
            map.value?.flyTo({
                center: coordinates,
                zoom: currentZoom + 4,
                duration: getAnimationDuration(config.navigation.animationDuration)
            });

            SelectionController.waitForIdleAndFocus();
        }

        static handleMarkerSelection(
            feature: NavigationFeature,
            onSelectReport?: (report: unknown, mapInstance: MapLibreMap | null) => void
        ): void {
            const report = markers.value.find(
                (m): m is { service_request_id: string } =>
                    typeof m === 'object' && m !== null &&
                    'service_request_id' in m &&
                    (m as { service_request_id: string }).service_request_id === feature.properties.id
            );
            if (report && onSelectReport) {
                onSelectReport(report, map.value);
            }
        }

        static clearSelection(): void {
            state.currentFocusedFeature.value = null;
            state.currentMarkerIndex.value = -1;
            HighlightManager.clear();
        }

        static restoreCanvasFocus(): void {
            const canvas = map.value?.getCanvas();
            // Use canvas.ownerDocument instead of global `document` to avoid SSR issues
            if (canvas && canvas.ownerDocument.activeElement !== canvas) {
                canvas.focus();
            }
        }

        /**
         * Wait for the map to become idle (tiles rendered) then auto-focus the
         * nearest feature.
         *
         * Only one once('idle') handler is alive at a time: calling this method
         * cancels any previously registered handler before registering a new one.
         * The handler and any pending setTimeout are also removed on unmount.
         */
        static waitForIdleAndFocus(): void {
            if (!map.value) return;

            // Cancel any previously queued idle handler to avoid race conditions
            // (e.g. a prior easeTo settling firing against a newer zoom intent).
            if (pendingIdleOff) {
                pendingIdleOff();
                pendingIdleOff = null;
            }

            // Stop any in-progress camera movement so the upcoming once('idle')
            // fires for OUR intended move and not the tail of a prior easeTo.
            map.value.stop();

            const tryFocus = () => {
                pendingIdleOff = null;
                SelectionController.restoreCanvasFocus();
                state.lastZoomLevel.value = 0;
                FeatureManager._doRefresh();

                if (hasVisibleFeatures.value) {
                    const firstFeature = state.availableFeatures.value[0];
                    NavigationController.setCurrentFeature(firstFeature, 0);
                    HighlightManager.highlight(firstFeature);
                    AriaManager.updateLabel(AriaManager.getFeatureLabel(firstFeature));
                } else {
                    AriaManager.updateLabel(t('map.keyboard.zoomedIntoCluster'));
                }
            };

            map.value.once('idle', tryFocus);
            // Store a teardown fn so cleanup() can remove the once handler if it hasn't fired
            pendingIdleOff = () => map.value?.off('idle', tryFocus);
        }
    }

    /**
     * Focus Management Controller
     */
    class FocusController {
        /**
         * Focus the nearest visible feature.
         * If a specific marker is passed its id is looked up among availableFeatures;
         * if not found (off-screen) we fall through to availableFeatures[0].
         * Calling with no argument always focuses the geographically nearest feature.
         */
        static focusMarker(marker?: { service_request_id?: string } | null): void {
            if (!map.value) return;

            FeatureManager._doRefresh();
            if (!hasVisibleFeatures.value) return;

            let featureIndex = 0;
            if (marker?.service_request_id) {
                const foundIndex = state.availableFeatures.value.findIndex(f =>
                    f.properties?.id === marker.service_request_id
                );
                if (foundIndex !== -1) featureIndex = foundIndex;
            }

            const feature = state.availableFeatures.value[featureIndex];
            if (!feature) return;

            NavigationController.setCurrentFeature(feature, featureIndex);
            // highlight() self-clears; no need for an explicit clear() before it
            HighlightManager.highlight(feature);
            AriaManager.updateLabel(AriaManager.getFeatureLabel(feature));
        }
    }

    // Public API
    const setupKeyboardNavigation = (
        onSelectReport?: (report: unknown, mapInstance: MapLibreMap | null) => void,
        onCloseModal?: () => void,
        spiderfy?: SpiderfyCallbacks
    ) => {
        if (!map.value || state.keyboardNavigationSetup.value || !config.enabled) {
            return;
        }

        state.keyboardNavigationSetup.value = true;

        navigationCallbacks = { onSelectReport, onCloseModal, spiderfy };

        map.value.keyboard.disable();

        AriaManager.setupCanvas();
        EventManager.setupKeyboardEvents(navigationCallbacks);
    };

    const cleanupKeyboardNavigation = () => {
        if (!map.value || !state.keyboardNavigationSetup.value) return;

        // Cancel any pending once('idle') handler to avoid mutations after unmount
        if (pendingIdleOff) {
            pendingIdleOff();
            pendingIdleOff = null;
        }

        // Cancel the cluster-expansion setTimeout if it hasn't fired yet
        if (pendingClusterTimeoutId !== null) {
            clearTimeout(pendingClusterTimeoutId);
            pendingClusterTimeoutId = null;
        }

        // Cancel any queued refreshFeatures RAF
        if (pendingRefreshRaf !== null) {
            cancelAnimationFrame(pendingRefreshRaf);
            pendingRefreshRaf = null;
        }

        HighlightManager.clear();
        state.keyboardNavigationSetup.value = false;
        state.currentMarkerIndex.value = -1;
        state.currentFocusedFeature.value = null;
        state.availableFeatures.value = [];

        eventListeners.forEach(cleanup => cleanup());
        eventListeners.length = 0;
    };

    onUnmounted(() => {
        cleanupKeyboardNavigation();
    });

    return {
        currentMarkerIndex: readonly(state.currentMarkerIndex),
        keyboardNavigationSetup: readonly(state.keyboardNavigationSetup),
        hasVisibleFeatures,
        currentFeature,

        setupKeyboardNavigation,
        cleanupKeyboardNavigation,
        // Bind exported methods so they work when destructured (avoid `this` being lost)
        focusMarker: FocusController.focusMarker.bind(FocusController),
        navigateToFeatureInDirection: NavigationController.navigateToFeature.bind(NavigationController),
        panMapInDirection: NavigationController.panInDirection.bind(NavigationController),
        smartNavigateInDirection: NavigationController.smartNavigate.bind(NavigationController),
        selectCurrentFeature: SelectionController.selectCurrentFeature.bind(SelectionController),
        clearFeatureHighlight: HighlightManager.clear.bind(HighlightManager),

        getCurrentFocusedFeature: () => state.currentFocusedFeature.value
    };
}
