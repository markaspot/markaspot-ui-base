<!-- Template Section -->
<template>
  <div
    v-if="settings"
    class="relative h-full"
  >
    <!-- Use MapTooltip component for location selection -->
    <MapTooltip
      :visible="showLocationTooltip"
      :x="tooltipPosition.x"
      :y="tooltipPosition.y"
      :address="selectedAddress"
      :address-obj="mapPick.isActive.value ? currentAddressObj : normalModeAddressObj"
      :msg="boundaryValidationMessage"
      :is-valid="tooltipActionValid"
      :photo-enabled="photoReportAvailable"
      :is-loading="isGeocoding"
      :retry-count="geocodingRetryCount"
      :show-confirm-location="mapPick.isActive.value"
      :lat="mapPick.isActive.value ? pickMarker?.getLngLat()?.lat : currentMarker?.getLngLat()?.lat"
      :lng="mapPick.isActive.value ? pickMarker?.getLngLat()?.lng : currentMarker?.getLngLat()?.lng"
      @add="handleReportType"
      @close="clearLocationState"
      @confirm-location="handleLocationConfirmation"
    />

    <!-- Map Controls (only shown on main map when not hidden by parent) -->
    <MapControls
      v-if="!hideControls"
      :map-instance="map"
      :tooltip-visible="showLocationTooltip"
      @report="handleReportType"
      @update:location="handleLocationSelect"
      @toggle-language="toggleLanguage"
      @toggle-heatmap="toggleHeatmap"
      @update:tilt="updateMapTilt"
      @geolocate="handleGeolocate"
      @geolocate-to-pick="handleGeolocateToPickMode"
    />

    <!-- Map Container. The interactive application surface is the MapLibre
         <canvas> inside (useMapKeyboardNavigation sets role="application",
         tabindex and a translated aria-label on it). This wrapper is a plain
         container so we don't expose a second, nested role="application". -->
    <div
      id="map-canvas"
      ref="mapContainer"
      class="map-container bg-[var(--ui-bg-elevated)]"
    >
      <!-- Focus indicator: real DOM element required because CSS ::after pseudo-elements
           don't get their own GPU compositor layer and are painted beneath the WebGL canvas.
           Hidden by default, shown via CSS :has(:focus-visible) on the parent (keyboard only). -->
      <div
        class="map-focus-ring"
        aria-hidden="true"
      />
    </div>
  </div>
  <div
    v-else
    class="map-container flex items-center justify-center"
  >
    <span class="text-neutral-500">Loading map settings...</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Map Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import MapTooltip from './MapTooltip.vue';
import MapControls from './MapControls.vue';
import type { Map as MapLibreMap, Marker as MapLibreMarker, MapMouseEvent as MapLibreMouseEvent, ErrorEvent as MapLibreErrorEvent, LngLatBounds } from 'maplibre-gl';
import type { Request } from '~~/types';
import { useMapClickGuard } from '@/composables/map/useMapClickGuard';
import { useEmitter } from '@/composables/core/useEmitter';
import { useRequestsStore } from '@/stores/requests';
import { getPreferredFallbackStyle, getPreferredMapStyle } from '@/utils/mapStyleFallbacks';

/** Functions returned by useMap composable for marker layer management */
interface MapFunctions {
    initializeMarkerLayers: () => Promise<void>
    updateGeoJSONSource: (markers: Request[], source?: string, hasStatusFilter?: boolean) => void
    resetInitialization?: () => void
    clearIcons?: () => void
    toggleHeatmap?: () => void
    cleanup?: () => void
    [key: string]: unknown
}

/** Extend Window for dev-only map debugging and performance */
declare global {
    interface Window {
        mapPerformance?: {
            getReport: () => unknown
            getZoomPerformance: () => unknown
            help: () => void
        }
        /** Dev-only: exposes the MapLibre instance for browser console inspection */
        __map?: MapLibreMap
    }
}

type LocationSelectFn = (locationData: {
    lat: number
    lng: number
    address: string
    validationResult?: { valid: boolean, message: string, hardInvalid?: boolean }
}) => void;

const handlers = {
    handleLocationSelect: null as unknown as LocationSelectFn
};

const handleLocationSelect: LocationSelectFn = (...args) => {
    return handlers.handleLocationSelect(...args);
};

// Expose before await expressions
// Use shallowRef for MapLibre class instances to avoid Vue deep reactivity
// unwrapping, which strips private class members and breaks type compatibility
const map = shallowRef<MapLibreMap | null>(null);
let mapFunctions: MapFunctions | null = null;
const currentFocusedFeature = ref<unknown>(null);

// eslint-disable-next-line prefer-const
let clearLocationState: () => void;
// eslint-disable-next-line prefer-const
let clearFeatureHighlight: () => void;
// eslint-disable-next-line prefer-const
let focusMarkerFromKeyboard: () => void;

// eslint-disable-next-line prefer-const
let updateUserLocationMarkerFn: ((coords: { lat: number, lng: number }) => void) | undefined;

defineExpose({
    handleLocationSelect,
    updateUserLocationMarker: (coords: { lat: number, lng: number }) => updateUserLocationMarkerFn?.(coords),
    map: map, // Remove readonly wrapper to allow MapLibre internal updates
    mapFunctions: computed(() => mapFunctions),
    focusMarker: () => focusMarkerFromKeyboard?.(),
    clearLocationState: () => clearLocationState?.(),
    currentFocusedFeature: computed(() => getCurrentFocusedFeature?.() || currentFocusedFeature.value),
    clearFeatureHighlight: () => clearFeatureHighlight?.()
});

const props = defineProps<{
    markers: Request[]
    centerLat?: number
    centerLng?: number
    geolocatedCoords?: { lat: number, lng: number } | null
    hasStatusFilter?: boolean
    /**
     * True when ANY report-list filter (status, time, or category) is
     * active. Forwarded to useMap so the facility layer is hidden while
     * the user filters reports (issue #402).
     */
    hasActiveFilters?: boolean
    hideControls?: boolean // Hide MapControls (used when parent handles controls)
    readOnly?: boolean // Disable map click interactions (report creation, etc.)
    selectedReportId?: string | null // ID to highlight/fly to (for table-map sync)
    disableMaxBounds?: boolean // Disable boundary-based panning restrictions (for detail views)
    initialZoom?: number // Initial zoom level
    preserveDrawingBuffer?: boolean // Enable canvas capture for print
}>();

const emit = defineEmits<{
    'update:bounds': [bounds: BoundsType, isDetailView?: boolean]
    'select-report': [report: Request]
    'close-modal': []
    'map-init': [map: MapLibreMap]
    'add-report': [type: 'photo' | 'classic', location: { lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> }]
    'update:tilt': [tiltValue: number]
    'toggle-language': []
    'geolocate': [coords: { lat: number, lng: number }]
    'geolocate-to-pick': [coords: { lat: number, lng: number }]
    'map-tap': []
    'map-interaction': []
}>();

const { t } = useI18n();
const emitter = useEmitter();
const requestsStore = useRequestsStore();
const { $colorMode } = useNuxtApp();
const { photoReportAvailable } = useFeatureFlags();

const { startTiming, recordMetric, getPerformanceReport, getZoomPerformance } = usePerformanceMonitor();

if (import.meta.dev && typeof window !== 'undefined') {
    window.mapPerformance = {
        getReport: getPerformanceReport,
        getZoomPerformance,
        help: () => {
            console.log(`
🔍 Map Performance Debugging:

• window.mapPerformance.getReport() - Full performance report
• window.mapPerformance.getZoomPerformance() - Zoom-specific metrics

Zoom Status Guide:
• excellent: < 100ms
• good: 100-200ms
• fair: 200-500ms
• poor: > 500ms
            `);
        }
    };
}

const { primaryColor } = useThemeColors();

const mapContainer = ref<HTMLElement | null>(null);
const { settings, fetchSettings } = useMarkASpotSettings();
const { useFallback } = useMapStyles();

const {
    setupKeyboardNavigation,
    cleanupKeyboardNavigation,
    focusMarker: _focusMarker,
    getCurrentFocusedFeature,
    clearFeatureHighlight: _clearFeatureHighlight
} = useMapKeyboardNavigation(map, toRef(props, 'markers'));

focusMarkerFromKeyboard = _focusMarker;
clearFeatureHighlight = _clearFeatureHighlight;

const currentMarker = shallowRef<MapLibreMarker | null>(null);
const userLocationMarker = shallowRef<MapLibreMarker | null>(null);

const {
    showLocationTooltip,
    tooltipPosition,
    selectedAddress,
    isLocationValid: tooltipLocationValid,
    clearLocationState: clearTooltipState,
    updateTooltipPosition,
    handleClickOutside
} = useMapLocationTooltip({
    isMarkerDragging: () => isMarkerDragging.value,
    onClear: () => {
        if (currentMarker.value) {
            currentMarker.value.remove();
            currentMarker.value = null;
        }
        hideBoundaries();
    }
});

// Add boundary validation state
const { validateLocation, boundaryConfig, getBoundaryGeoJSON, isLoading: boundariesLoading } = useBoundaryValidator();
const { boundaryValidationMessage, updateBoundaryLayer, reapplyAfterStyleChange: reapplyBoundaryAfterStyleChange, showBoundaries: _showBoundaries, hideBoundaries } = useMapBoundaryUI({
    map,
    boundaryConfig,
    getBoundaryGeoJSON
});
const strictValidation = computed(() => boundaryConfig.value.strictValidation);

const { reverse: reverseGeocode } = useGeocoding();
const mapPick = useMapPick();

const isMarkerDragging = ref(false);
const tooltipHardInvalid = ref(false);

const pickMarker = shallowRef<MapLibreMarker | null>(null);

let maxBoundsApplied = false;
const applyMaxBoundsFromBoundary = () => {
    // Skip maxBounds for detail views (disableMaxBounds prop)
    if (!map.value || maxBoundsApplied || props.disableMaxBounds) return;
    const geo = getBoundaryGeoJSON();
    const bounds = calculateBoundaryBounds(geo);
    if (bounds) {
        // setMaxBounds is typed as LngLatBounds but accepts [[lng,lat],[lng,lat]] at runtime
        // (the docs note confirms any LngLatBoundsLike is accepted). calculateBoundaryBounds
        // returns number[][] which matches [LngLatLike, LngLatLike] — valid at runtime.
        map.value.setMaxBounds(bounds as unknown as LngLatBounds);
        maxBoundsApplied = true;
    }
};

const removeMaxBounds = () => {
    if (!map.value || !maxBoundsApplied) return;
    map.value.setMaxBounds(null);
    maxBoundsApplied = false;
};

const updateUserLocationMarker = (coords: { lat: number, lng: number }) => {
    if (!map.value) return;

    // Remove existing user location marker if exists
    if (userLocationMarker.value) {
        userLocationMarker.value.remove();
    }

    // Create a custom marker element
    const el = document.createElement('div');
    el.className = 'user-location-marker';

    // Add the new marker
    userLocationMarker.value = new MapLibreGL.Marker({
        element: el,
        anchor: 'center'
    })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map.value);
};
updateUserLocationMarkerFn = updateUserLocationMarker;

const createPickMarkerElement = () => createCustomMarkerElement('#dc2626', true, false, primaryColor.value);

const {
    handlePickModeClick,
    flyToPickLocation,
    isGeocoding,
    geocodingRetryCount,
    currentAddressObj,
    updateAddressWithRetry,
    confirmPickLocationEnhanced,
    showLocationTooltipForConfirmation
} = useMapPickMode({
    map,
    pickMarker,
    currentMarker,
    userLocationMarker,
    maplibregl: computed(() => MapLibreGL),
    selectedAddress,
    reverseGeocode,
    validateLocation,
    mapPick,
    createPickMarkerElement,
    createCustomMarkerElement,
    primaryColor,
    tooltipLocationValid,
    boundaryValidationMessage,
    updateBoundaryLayer,
    showLocationTooltip,
    tooltipPosition,
    tooltipHardInvalid
});

// Normal mode handling - uses same geocoding logic as pick mode
const { handleNormalModeClick, currentAddressObj: normalModeAddressObj } = useMapNormalMode({
    map,
    currentMarker,
    maplibregl: computed(() => MapLibreGL),
    selectedAddress,
    tooltipPosition,
    showLocationTooltip,
    tooltipLocationValid,
    boundaryValidationMessage,
    isMarkerDragging,
    reverseGeocode,
    validateLocation,
    updateBoundaryLayer,
    createCustomMarkerElement,
    primaryColor,
    tooltipHardInvalid
});

const { handleGeolocate } = useMapGeolocation({
    map,
    currentMarker,
    maplibregl: computed(() => MapLibreGL),
    selectedAddress,
    tooltipPosition,
    showLocationTooltip,
    tooltipLocationValid,
    boundaryValidationMessage,
    primaryColor,
    reverseGeocode,
    validateLocation,
    updateBoundaryLayer,
    updateUserLocationMarker,
    removeMaxBounds,
    emit
});

const { handleReportFeatureClick, handleClusterClick } = useMapFeatureInteractions({
    map,
    markers: props.markers,
    emit
});

// Click guard to prevent race condition between layer-specific and general click handlers
const { isClickHandled } = useMapClickGuard();

// Cache-bust timestamp set once at mount, not on every computed access
const styleCacheBust = ref(Date.now());
const mapStyle = computed(() => {
    const isDarkMode = $colorMode.value === 'dark';
    const styleUrl = settings.value
        ? getPreferredMapStyle(settings.value, isDarkMode)
        : undefined;

    if (styleUrl) {
        const separator = styleUrl.includes('?') ? '&' : '?';
        return `${styleUrl}${separator}_=${styleCacheBust.value}`;
    }
    return styleUrl;
});
const mapStyleWatchKey = computed(() => `${$colorMode.value}:${mapStyle.value ?? ''}`);

const initializeMap = async () => {
    if (!mapContainer.value || !settings.value) return;

    // Create map instance with performance optimizations and tile fallback
    // Pass boundary GeoJSON so the center can fall back to the boundary centroid
    // when no explicit center is configured in props or Drupal settings
    map.value = new MapLibreGL.Map(buildMapInstanceConfig({
        mapContainer: mapContainer.value,
        settings: settings.value,
        props,
        boundaryGeoJSON: getBoundaryGeoJSON() ?? undefined,
        preserveDrawingBuffer: props.preserveDrawingBuffer
    }));

    // Expose map instance for dev tools / flyover scripts
    if (import.meta.dev) {
        window.__map = map.value ?? undefined;
    }

    // Use primary or fallback styles
    try {
        if (import.meta.dev) {
            console.log('🗺️ Attempting to load map styles with settings:', {
                mapbox_style: settings.value.mapbox_style,
                fallback_style: settings.value.fallback_style
            });
        }
        const styleResult = await useFallback(map.value!, settings.value);
        if (import.meta.dev) {
            console.log('🗺️ Style load result:', styleResult);
        }
        if (!styleResult.success && import.meta.dev) {
            console.error('Failed to load any map style');
        }
    } catch (error) {
        if (import.meta.dev) {
            console.error('Error during map initialization:', error);
        }
    }

    // Set up map load handler - this is the ONLY place where initialization happens
    const { setupMapLoadHandler } = useMapLoadHandler({
        map,
        props,
        emit,
        setMapFunctions: (fn: MapFunctions) => {
            mapFunctions = fn;
        },
        applyMaxBoundsFromBoundary,
        handleMapClick,
        recordMetric,
        startTiming,
        setupKeyboardNavigation,
        updateUserLocationMarker
    });
    await setupMapLoadHandler();
};

const handleMapClick = async (e: MapLibreMouseEvent & { features?: any[] }) => {
    if (!map.value) return;

    // Skip all click handling in readOnly mode (used in dashboard)
    if (props.readOnly) return;

    // Check if click was already handled by layer-specific handlers (markers, spiderfy)
    if (isClickHandled()) return;

    // Prevent map drag on click
    e.preventDefault();

    // === PICK MODE: takes precedence over every feature-layer handler.
    // A citizen correcting the report position must never accidentally
    // open another report's detail, zoom into a cluster, or re-adopt a
    // facility. Layer-level handlers in useMap respect this flag and
    // opt out; this check covers the raw feature-hit path.
    if (mapPick.isActive.value) {
        await handlePickModeClick(e.lngLat);
        return;
    }

    // Handle report selection
    if (handleReportFeatureClick(e)) return;

    // Handle cluster zoom
    if (handleClusterClick(e)) return;

    // Raw map click (not on report/cluster) - shrink bottom sheet
    emit('map-tap');

    // === NORMAL MODE: Map-to-form report creation ===
    await handleNormalModeClick(e.lngLat);
};

// Resolve the active addressObj depending on mode (pick vs normal)
const activeAddressObj = computed(() =>
    mapPick.isActive.value
        ? (currentAddressObj.value || null)
        : (normalModeAddressObj.value || null)
);

const activeTooltipMarker = computed(() =>
    mapPick.isActive.value ? pickMarker.value : currentMarker.value
);

const { handleReportType } = useMapReportHandler({
    currentMarker,
    boundaryConfig,
    tooltipLocationValid,
    tooltipHardInvalid,
    selectedAddress,
    currentAddressObj: activeAddressObj,
    showLocationTooltip,
    clearLocationState,
    emit
});

// Handle location confirmation from MapTooltip when in pick mode
const handleLocationConfirmation = async () => {
    if (!pickMarker.value) return;

    // Get current marker position and confirm the location
    const lngLat = pickMarker.value.getLngLat();
    await confirmPickLocationEnhanced(lngLat);

    // Clear tooltip state after confirmation
    clearLocationState();
};

// Handle GPS button click - go to location and activate pick mode
const handleGeolocateToPickMode = async (coords: { lat: number, lng: number }) => {
    if (!map.value) return;

    // Activate pick mode
    mapPick.start();

    // Use flyToPickLocation to go to GPS coordinates and show pick marker
    flyToPickLocation(coords);
};

handlers.handleLocationSelect = useLocationSelect({
    map,
    maplibregl: computed(() => MapLibreGL),
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
}).handleLocationSelect;

const tooltipActionValid = computed(() => {
    // A missing postcode / absent geocoded address never blocks (coordinate
    // fallback); only strict boundary validation can. See utils/locationValidation.ts.
    return tooltipLocationValid.value || !strictValidation.value;
});

clearLocationState = () => {
    tooltipHardInvalid.value = false;
    clearTooltipState();
};

useMapStyleWatcher({
    map,
    mapStyle,
    watchKey: mapStyleWatchKey,
    getMapFunctions: () => mapFunctions,
    getMarkers: () => props.markers,
    loadStyle: async (styleUrl: string) => {
        if (!map.value || !settings.value) return false;
        const styleResult = await useFallback(map.value, settings.value, {
            preferredStyleUrl: styleUrl
        });
        return styleResult.success;
    },
    // setStyle() wipes all custom sources/layers. useMap.initializeMarkerLayers
    // (run by rebuildLayers) restores reports/clusters/facility/WMS/spiderfy, but
    // the boundary polygon is owned here and has no watcher that re-fires on a
    // pure style change, so restore it explicitly after every style rebuild.
    afterRebuild: () => {
        reapplyBoundaryAfterStyleChange();
    }
});

const { isDesktop } = useLayout();

useMapWatchers({
    map,
    geolocatedCoords: props.geolocatedCoords,
    currentMarker,
    tooltipMarker: activeTooltipMarker,
    showLocationTooltip,
    tooltipPosition,
    tooltipLocationValid,
    boundaryValidationMessage,
    boundariesLoading,
    isDesktop,
    updateUserLocationMarker,
    validateLocation,
    updateBoundaryLayer,
    applyMaxBoundsFromBoundary
});

const { updateMapTilt, toggleLanguage, toggleHeatmap } = useMapControls({
    map,
    getMapFunctions: () => mapFunctions,
    emit
});

// Global window 'error' handler to suppress MapLibre vector tile parsing
// errors that bubble out of workers (e.g. basemap.de unknown feature values).
// Scoped to well-known benign substrings only; other errors pass through.
const maplibreErrorHandler = (event: ErrorEvent) => {
    if (event.message?.includes('unknown feature value') ||
      event.message?.includes('Unimplemented type')) {
        event.preventDefault();
        event.stopPropagation?.();
        return true;
    }
};

/**
 * MapLibre emits tile-load failures as 'error' events with `tile` and `sourceId`
 * fields that are not part of the public ErrorEvent type (they're internal to the
 * tile-loading pipeline). We define a minimal local extension to avoid `as any`.
 */
interface MapTileErrorEvent extends MapLibreErrorEvent {
    tile?: { tileID?: { canonical: { z: number, x: number, y: number } } }
    sourceId?: string
    message?: string
}

// Re-add the custom report/cluster/facility/boundary layers after a style change:
// setStyle() wipes every non-style source and layer.
const rebuildLayersAfterStyleChange = async () => {
    if (!mapFunctions) return;
    mapFunctions.resetInitialization?.();
    mapFunctions.clearIcons?.();
    await mapFunctions.initializeMarkerLayers();
    mapFunctions.updateGeoJSONSource(props.markers, 'tile-fallback', props.hasStatusFilter || false);
    reapplyBoundaryAfterStyleChange();
};

// Basemap tile-load resilience: the composable counts MapLibre's native tile
// 'error' events and trips the switch to the configured fallback basemap once the
// CDN looks down. The style switch + layer rebuild action is injected here (setStyle
// wipes custom layers, so we rebuild them on the next 'styledata'). Decision logic
// is unit-tested in useTileFallback.test.ts because this error path is hard to smoke.
const tileFallback = useTileFallback({
    getFallbackStyle: () => settings.value
        ? getPreferredFallbackStyle(settings.value, $colorMode.value === 'dark')
        : undefined,
    applyFallback: (fallbackStyle) => {
        if (!map.value) return;
        if (import.meta.dev) {
            console.warn(`[Map] sustained tile failures, switching to fallback style: ${fallbackStyle}`);
        }
        map.value.once('styledata', () => {
            void rebuildLayersAfterStyleChange();
        });
        try {
            map.value.setStyle(fallbackStyle);
        } catch (styleError) {
            if (import.meta.dev) {
                console.error('[Map] Failed to switch to fallback style:', styleError);
            }
        }
    }
});

// Single consolidated map-level 'error' handler, covering both:
// - Tile-fallback logic (tile load errors with e.tile + e.sourceId)
// - Benign tile-parsing error suppression (unknown feature / Unimplemented type)
// Stored as a named ref so it can be removed explicitly before map.remove().
let mapErrorHandler: ((e: MapLibreErrorEvent) => void) | null = null;

const setupMapErrorHandler = (mapInstance: MapLibreMap) => {
    mapErrorHandler = (e: MapLibreErrorEvent) => {
        // Cast to the extended type to access tile-load-specific fields
        const tileEvent = e as MapTileErrorEvent;
        const errorMessage = tileEvent.error?.message || tileEvent.message || '';

        // Suppress known benign tile parsing errors (e.g. basemap.de)
        if (errorMessage.includes('unknown feature value') ||
          errorMessage.includes('Unimplemented type')) {
            return;
        }

        // Tile-fallback: a tile-load error carries `tile` + `sourceId`. The
        // composable counts it and trips the fallback when failures are sustained.
        if (tileFallback.handleError(tileEvent)) {
            return;
        }

        // Log unexpected map errors for debugging
        if (import.meta.dev) {
            console.warn('[Map Error]', errorMessage, tileEvent);
        }
    };

    mapInstance.on('error', mapErrorHandler);
};

const refreshMarkersAfterLocaleChange = async () => {
    if (!mapFunctions) return;

    if (typeof mapFunctions.resetInitialization === 'function') {
        mapFunctions.resetInitialization();
    }
    if (typeof mapFunctions.clearIcons === 'function') {
        mapFunctions.clearIcons();
    }

    await mapFunctions.initializeMarkerLayers();
    await nextTick();
    mapFunctions.updateGeoJSONSource(props.markers, 'locale-refresh', props.hasStatusFilter || false);
};

const handleRequestsRefreshed = async (payload: { reason: 'locale-change' }) => {
    if (payload.reason !== 'locale-change' || !mapFunctions) return;

    await refreshMarkersAfterLocaleChange();
};

// Promise rejection handler for async MapLibre errors
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    const reason = event.reason?.message || String(event.reason) || '';
    if (reason.includes('unknown feature value') ||
      reason.includes('Unimplemented type')) {
        event.preventDefault();
        return;
    }
};

// MapLibre is loaded dynamically to avoid SSR issues. At runtime, maplibreModule.default
// is the CJS compat shim that exposes constructors as MapLibreGL.Map / MapLibreGL.Marker.
// We type it as the module namespace (which has Map, Marker, etc.) so usage is fully typed.
let MapLibreGL: typeof import('maplibre-gl');

onMounted(async () => {
    // Load MapLibre + settings in parallel (saves one round-trip)
    const [maplibreModule] = await Promise.all([
        import('maplibre-gl'),
        import('maplibre-gl/dist/maplibre-gl.css'),
        fetchSettings()
    ]);
    MapLibreGL = maplibreModule.default;

    // Add global error handlers for MapLibre tile parsing errors
    window.addEventListener('error', maplibreErrorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    await nextTick();
    await initializeMap();

    // Set up MapLibre-specific error handler after map is created
    if (map.value) {
        setupMapErrorHandler(map.value);
    }

    emitter.on('requests-refreshed', handleRequestsRefreshed);

    // NOTE: Map initialization (useMap, initializeMarkerLayers, click handlers) is handled
    // by useMapLoadHandler in initializeMap(). Do NOT create another useMap instance here
    // as it overwrites mapFunctions and breaks click handlers!
});

onUnmounted(() => {
    emitter.off('requests-refreshed', handleRequestsRefreshed);

    // Remove global error handlers
    window.removeEventListener('error', maplibreErrorHandler);
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler);

    // Cleanup map resources FIRST (while map is still functional)
    try {
        if (mapFunctions?.cleanup) {
            mapFunctions.cleanup();
        }
    } catch (error) {
        console.error('[Map] Error during map cleanup:', error);
    }

    // Then cleanup keyboard navigation
    cleanupKeyboardNavigation();

    // Then location state
    clearLocationState();

    // Remove HTML markers (DOM elements + their drag/click listeners)
    currentMarker.value?.remove();
    currentMarker.value = null;
    userLocationMarker.value?.remove();
    userLocationMarker.value = null;
    pickMarker.value?.remove();
    pickMarker.value = null;

    // Destroy the MapLibre GL context: releases WebGL context, canvas,
    // tile workers, ResizeObserver, and all map.on() listeners (including
    // the consolidated 'error' handler and the tile-fallback 'error' handler).
    // Mirror of MiniMap.vue which already does this correctly.
    try {
        map.value?.remove();
    } catch {
        // map.remove() throws if already removed; safe to ignore
    }
    map.value = null;
});

useMapPickWatcher({ map, mapPick, pickMarker, currentMarker, flyToPickLocation });

// Watch for selectedReportId changes to fly to marker (table-map sync).
// { immediate: true } so deep-links / table preselections before map-ready
// still trigger a flyTo once the map exists.
watch(() => props.selectedReportId, (newId) => {
    if (!newId || !map.value) return;

    // Find the marker with this service_request_id
    const marker = props.markers.find(m => m.service_request_id === newId);
    if (marker && marker.lat && marker.long) {
        const lat = Number(marker.lat);
        const lng = Number(marker.long);
        // Guard against malformed coordinate strings that parse to NaN
        if (!isFinite(lat) || !isFinite(lng)) return;
        map.value.flyTo({
            center: [lng, lat],
            zoom: Math.max(map.value.getZoom(), 15),
            duration: 1000
        });
    }
}, { immediate: true });
</script>

<style>
/* MapLibre CSS loaded dynamically in onMounted to avoid render-blocking */

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* Focus indicator for keyboard navigation on the WebGL map canvas.
   CSS border/box-shadow/outline and ::after pseudo-elements do NOT render on top
   of WebGL canvases because they don't get promoted to their own GPU compositor
   layer. Only CSS background with full surface coverage triggers layer promotion.
   Solution: edge glow gradients + minimal base tint to force GPU layer creation. */
.map-container .maplibregl-canvas:focus,
.map-container .maplibregl-canvas:focus-visible {
  outline: none !important;
}

.map-focus-ring {
  display: none;
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  --focus-glow: color-mix(in srgb, var(--color-primary-500) 35%, transparent);
  --focus-tint: color-mix(in srgb, var(--color-primary-500) 4%, transparent);
  background:
    linear-gradient(to right, var(--focus-glow) 0px, transparent 32px, transparent calc(100% - 32px), var(--focus-glow) 100%),
    linear-gradient(to bottom, var(--focus-glow) 0px, transparent 32px, transparent calc(100% - 32px), var(--focus-glow) 100%),
    var(--focus-tint);
}

.map-container:has(:focus-visible) .map-focus-ring {
  display: block;
}

.dark .map-focus-ring {
  --focus-glow: color-mix(in srgb, var(--color-primary-400) 35%, transparent);
  --focus-tint: color-mix(in srgb, var(--color-primary-400) 4%, transparent);
}

.report-popup {
  background-color: var(--color-white);
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@media (prefers-color-scheme: dark) {
  .report-popup {
    background-color: var(--color-gray-800);
  }
}

/* Facility hover label popup. Compact, tooltip-style presentation so a
   dense facility layer doesn't obscure surrounding markers on hover. */
/* Theme follows the rest of the UI (e.g. .map-control, Nuxt UI cards):
   light mode → light surface + dark text, dark mode → dark surface +
   light text. We used to invert for basemap contrast, but that broke the
   "dark mode = dark surfaces" expectation the rest of the UI sets. */
.facility-hover-popup .maplibregl-popup-content {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.96);
  color: #111827; /* gray-900 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  pointer-events: none;
}

.facility-hover-popup .maplibregl-popup-tip {
  border-top-color: rgba(255, 255, 255, 0.96);
  border-bottom-color: rgba(255, 255, 255, 0.96);
}

.dark .facility-hover-popup .maplibregl-popup-content {
  background-color: rgba(17, 24, 39, 0.92); /* gray-900 */
  color: #f9fafb; /* gray-50 */
}

.dark .facility-hover-popup .maplibregl-popup-tip {
  border-top-color: rgba(17, 24, 39, 0.92);
  border-bottom-color: rgba(17, 24, 39, 0.92);
}

/* User location marker with pulsing effect */
.user-location-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 128, 255, 0.3);
  border: 3px solid rgb(0, 128, 255);
  box-shadow: 0 0 0 rgba(0, 128, 255, 0.5);
  position: relative;
}

.user-location-marker::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: rgb(0, 128, 255);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 128, 255, 0.6);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(0, 128, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 128, 255, 0);
  }
}

/* Respect user's motion preference for all infinite pulsing animations */
@media (prefers-reduced-motion: no-preference) {
  .user-location-marker {
    animation: pulse 1.5s infinite;
  }
}

/* Default cursor for map canvas */
.maplibregl-canvas-container {
  cursor: default;
}

/* Make markers more visible */
.maplibregl-marker {
  z-index: 40;
}

/* Theme the built-in MapLibre attribution control */
.maplibregl-ctrl-attrib {
  background-color: rgba(255, 255, 255, 0.92) !important;
  color: #111827 !important; /* gray-900 */
  border: 1px solid #e5e7eb !important; /* gray-200 */
  border-radius: 0.5rem !important; /* rounded-lg */
  padding: 2px 8px !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06) !important;
  backdrop-filter: saturate(180%) blur(6px);
}

.maplibregl-ctrl-attrib .maplibregl-ctrl-attrib-inner {
  font-size: 12px !important;
  line-height: 1.25 !important;
}

/* Improve contrast for attribution links (light) */
.maplibregl-ctrl-attrib-inner a {
  color: var(--color-primary-700, #1d4ed8) !important;
  text-decoration: underline !important;
  font-weight: 500 !important;
}

/* Dark theme styling */
.dark .maplibregl-ctrl-attrib {
  background-color: rgba(17, 24, 39, 0.88) !important; /* gray-900 */
  color: #e5e7eb !important; /* gray-200 */
  border-color: #374151 !important; /* gray-700 */
}

.dark .maplibregl-ctrl-attrib-inner a {
  color: var(--color-primary-300, #93c5fd) !important;
}

/* Focus states for better accessibility */
.maplibregl-ctrl-attrib-inner a:focus,
.maplibregl-ctrl button:focus {
  outline: 2px solid currentColor !important;
  outline-offset: 2px !important;
}

/* Animations for inline marker element */
@keyframes tooltip-fade { to { opacity: 1; } }
@keyframes tooltip-hide { to { opacity: 0; } }

@keyframes dot-pulse {
  0%,100% { transform: scale(1); opacity: 1; }
  50%     { transform: scale(1.6); opacity: 0.6; }
}
@keyframes arms-pulse {
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.15); }
}
@keyframes circle-pulse {
  0%,100% { transform: scale(1); opacity: 1; }
  50%     { transform: scale(1.08); opacity: 0.9; }
}
@keyframes whole-marker-pulse {
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.05); }
}

:deep(.pulse-dot) {
  transform-origin: 18px 16px;
}
:deep(.pulse-arms) {
  transform-origin: 18px 16px;
}
:deep(.pulse-circle) {
  transform-origin: 18px 16px;
}

/* Infinite marker animations only run when the user has not opted for reduced motion */
@media (prefers-reduced-motion: no-preference) {
  :deep(.pulse-dot) {
    animation: dot-pulse 1.5s ease-in-out infinite;
  }
  :deep(.pulse-arms) {
    animation: arms-pulse 2.5s ease-in-out infinite;
  }
  :deep(.pulse-circle) {
    animation: circle-pulse 3s ease-in-out infinite;
  }
}
</style>
