<template>
  <section
    class="flex-1 relative flex flex-col"
    role="region"
    :aria-label="$t('hiddenSection.map')"
  >
    <!-- Form-first mode overlay (issue #61) -->
    <!-- Form overlays the map, hidden when sheet expanded or in pick mode -->
    <!-- Note: formFirstMode prop already checks for mobile, no need to check isDesktop again -->
    <template v-if="formFirstMode">
      <!-- Form and map picker controls - client only for proper hydration -->
      <ClientOnly>
        <!-- Form container - absolutely positioned over the map -->
        <div
          v-show="showFormFirstForm"
          class="absolute inset-0 z-30 bg-[var(--ui-bg)] overflow-y-auto"
          :style="{ paddingBottom: `${minimizedSheetHeight + 20}px` }"
          @focusin="onFormFocusIn"
        >
          <div class="p-4">
            <ReportFormTabs
              :default-tab="formFirstTab"
              :map-center="mapCenter"
              :auto-trigger-geolocation="true"
              @success="$emit('formSuccess', $event)"
              @close="$emit('formClose')"
              @bottom-focus="onFormBottomFocus"
            />
          </div>
        </div>

        <!-- Full-screen map picker overlay when IN pick mode (Uber-style) -->
        <!-- pointer-events-none allows map/marker interaction through overlay -->
        <div
          v-show="mapPickActive"
          class="absolute inset-0 z-40 pointer-events-none"
        >
          <!-- Back to form button with label -->
          <div class="absolute top-4 left-4 z-50 flex items-center gap-3 pointer-events-auto">
            <button
              class="w-10 h-10 rounded-full bg-[var(--ui-bg)] shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              :aria-label="$t('navigation.back_to_form')"
              @click="cancelMapPick"
            >
              <UIcon
                name="i-heroicons-arrow-left"
                class="w-5 h-5"
              />
            </button>
            <button
              class="bg-[var(--ui-bg)] rounded-lg shadow-lg px-4 py-2 text-sm font-medium active:scale-95 transition-transform"
              @click="cancelMapPick"
            >
              {{ $t('navigation.back_to_form') }}
            </button>
          </div>
          <!-- Instruction banner - positioned above bottom sheet -->
          <div class="absolute bottom-44 left-4 right-4 z-50 bg-[var(--ui-bg)]/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 text-sm text-center pointer-events-none">
            {{ $t('map.pick.drag_hint') }}
          </div>
        </div>

        <!-- Back to form button when browsing (sheet expanded, not in pick mode) -->
        <!-- Both icon and label are clickable for consistent UX with pick mode -->
        <div
          v-show="showBackToFormButton"
          class="absolute top-4 left-4 z-50 flex items-center gap-3 pointer-events-auto"
        >
          <button
            class="w-10 h-10 rounded-full bg-[var(--ui-bg)] shadow-lg flex items-center justify-center active:scale-95 transition-transform"
            :aria-label="$t('navigation.back_to_form')"
            @click="onBackToForm"
          >
            <UIcon
              name="i-heroicons-arrow-left"
              class="w-5 h-5"
            />
          </button>
          <button
            class="bg-[var(--ui-bg)] rounded-lg shadow-lg px-4 py-2 text-sm font-medium active:scale-95 transition-transform"
            @click="onBackToForm"
          >
            {{ $t('navigation.back_to_form') }}
          </button>
        </div>
      </ClientOnly>
    </template>

    <!-- Map area - Deferred on mobile until user interaction for Lighthouse performance -->
    <!-- In form-first mode, map loads when: sheet expands, search focus, or map pick mode -->
    <div class="flex-1 relative">
      <ClientOnly>
        <MapLazy
          v-if="isDesktop === true || mapLoadedOnMobile"
          ref="mapRef"
          :markers="recentRequests"
          :geolocated-coords="geolocatedCoords"
          :has-status-filter="hasStatusFilter"
          :has-active-filters="hasActiveFilters"
          :hide-controls="!isDesktop"
          class="w-full h-full"
          @update:bounds="$emit('update:bounds', $event)"
          @select-report="$emit('selectReport', $event)"
          @close-modal="$emit('closeModal')"
          @map-init="onMapInit"
          @add-report="(...args) => $emit('addReport', ...args)"
          @toggle-language="$emit('toggleLanguage')"
          @map-tap="onMapTap"
          @map-interaction="onMapInteraction"
          @geolocate="$emit('geolocate', $event)"
        />
        <!-- Mobile placeholder when map not loaded -->
        <div
          v-else
          class="w-full h-full bg-[var(--ui-bg-elevated)] relative"
        >
          <!-- Tap to load map area -->
          <button
            type="button"
            class="absolute inset-0 flex items-center justify-center cursor-pointer w-full h-full bg-transparent border-0"
            :aria-label="$t('map.tap_to_load')"
            @click="loadMapOnMobile"
          >
            <div class="text-center p-4">
              <UIcon
                name="i-heroicons-map"
                class="w-12 h-12 text-[var(--ui-text-muted)] mb-2"
                aria-hidden="true"
              />
              <p class="text-[var(--ui-text)]">
                {{ $t('map.tap_to_load') }}
              </p>
            </div>
          </button>
        </div>
      </ClientOnly>
    </div>

    <!-- Mobile Map Controls - Hidden in form-first mode since user is already in form -->
    <ClientOnly v-if="!isDesktop && !formFirstMode">
      <MapControls
        :map-instance="mapInstance"
        @report="(type) => $emit('addReport', type)"
        @geolocate="handleGeolocate"
        @geolocate-to-pick="handleGeolocateToPick"
        @update:location="handleLocationUpdate"
      />
    </ClientOnly>

    <!-- Mobile Bottom Sheet Drawer (when desktop sidebar is disabled) -->
    <template v-if="!isDesktop || (isDesktop && !sidebarEnabled)">
      <BottomSheetDrawer
        v-model:active-snap="sheetSnapIndex"
        :requests="recentRequests"
        :store-total="storeTotal || 0"
        :global-total="globalTotal"
        :filter-stats="filterStats"
        :shared-filter-system="sharedFilterSystem"
        :search-system="searchSystem"
        :data-loading="isDataLoading"
        :form-first-mode="formFirstMode"
        @focus-in="onSheetFocusIn"
        @focus-out="onSheetFocusOut"
        @dragging-change="onSheetDraggingChange"
        @minimum-height-change="onSheetMinimumHeightChange"
        @snap-count-change="onSheetSnapCountChange"
        @select-report="$emit('selectReport', $event)"
        @select-page="$emit('selectPage', $event)"
        @tab-change="onTabChange"
        @add-report="(type) => $emit('addReport', type)"
        @fit-bounds="onFitBoundsRequest"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
/**
 * MapSection Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useDebounceFn } from '@vueuse/core';
import type { Map } from 'maplibre-gl';
import type { FormFirstTab } from '~/composables/features/useFormFirstMode';
import type { Request } from '~~/types';
// Import ReportFormTabs directly for SSR support - improves LCP in form-first mode
// The form content needs to be in the initial HTML to avoid late LCP
import ReportFormTabs from '~/components/report/ReportFormTabs.vue';

// Lazy load MapControls for mobile (not loaded on desktop since Map.vue handles it)
const MapControls = defineAsyncComponent(() => import('~/components/map/MapControls.vue'));

// Map pick mode for Uber-style location selection
const mapPick = useMapPick();

// Form-first mode composable for centralized state
const formFirst = useFormFirstMode();
const { clientConfig, currentJurisdictionId } = useMarkASpotConfig();

interface Props {
    recentRequests: Request[]
    geolocatedCoords: { lat: number, lng: number } | null
    isDesktop: boolean
    sidebarEnabled: boolean
    sharedFilterSystem?: unknown // Add shared filter system prop
    searchSystem?: { isSearchActive?: Ref<boolean>, isFocused?: Ref<boolean>, [key: string]: unknown } // Add search system prop
    storeTotal?: number // Total count of all reports in store
    globalTotal?: number | null // Total count across the current jurisdiction
    filterStats?: { total: number, filtered: number, hiddenByFilters: number, filterCount: number, boundsActive?: boolean }
    hasStatusFilter?: boolean // Whether a status filter is active
    /**
     * True when ANY report-list filter (status, time, or category) is
     * active. Forwarded to the map so the facility layer can hide while
     * report filters narrow the list scope (issue #402).
     */
    hasActiveFilters?: boolean
    listFirstLoading?: boolean // Loading state from useListFirst preload
    listFirstError?: { type: string, message: string } | null // Error from useListFirst
    formFirstMode?: boolean // Form-first mobile mode (issue #61)
    formFirstTab?: FormFirstTab // Active tab for form-first mode
    mapCenter?: { lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> } | null // Map center for form location
}

const props = defineProps<Props>();

// Dev mode flag for console logging
const isDev = import.meta.dev;

// Map pick mode state for Uber-style flow
const mapPickActive = computed(() => mapPick.isActive.value);

// Cancel map pick and return to form
function cancelMapPick() {
    mapPick.cancel();
    if (isDev) console.log('🗺️ Map pick cancelled, returning to form');
}

// Mobile: defer map loading until user requests it
// Auto-load if already in pick mode (navigated from /report for "Pick on map")
const mapLoadedOnMobile = ref(mapPick.isActive.value);
// Track map instance for controls (null until map loads)
const mapInstance = ref<any>(null);
// Store pending location from search when map isn't loaded yet
const pendingLocation = ref<{ lat: number, lng: number, address?: string, validationResult?: { valid: boolean, message: string, hardInvalid?: boolean } } | null>(null);
// Reference to MapLazy/Map component to call handleLocationSelect
const mapRef = ref<any>(null);

// Loading state for skeleton display - true when data is being loaded
const isDataLoading = computed(() => {
    // Don't show skeleton if preload failed with error (graceful degradation)
    if (props.listFirstError) {
        return false;
    }
    // Show skeleton while list-first preload is running (mobile)
    if (props.listFirstLoading) {
        return true;
    }
    // Show skeleton while map is loading on mobile
    if (!props.isDesktop && mapLoadedOnMobile.value && !mapInstance.value) {
        return true;
    }
    // Only show skeleton if we have no data in the store at all
    // Don't show skeleton when filtering results in 0 items
    if (props.recentRequests.length === 0 && (!props.storeTotal || props.storeTotal === 0)) {
        return true;
    }
    return false;
});

function loadMapOnMobile() {
    mapLoadedOnMobile.value = true;
}

// Handle map initialization - store instance for controls
function onMapInit(map: Map) {
    if (isDev) console.log('🗺️ onMapInit called, pendingLocation:', pendingLocation.value);
    mapInstance.value = map;
    emit('mapInit', map);

    // If there's a pending location from search, fly to it now
    if (pendingLocation.value) {
        // Capture location before async callback
        const location = { ...pendingLocation.value };
        pendingLocation.value = null;
        if (isDev) console.log('🗺️ Flying to pending location:', location);

        const flyToLocationAndShowMarker = () => {
            if (isDev) console.log('🗺️ Executing flyTo:', location);
            map.flyTo({
                center: [location.lng, location.lat],
                zoom: 16,
                duration: 1000
            });

            // Trigger marker creation on the Map component
            nextTick(() => {
                if (mapRef.value?.handleLocationSelect) {
                    if (isDev) console.log('🗺️ Triggering marker creation via handleLocationSelect');
                    mapRef.value.handleLocationSelect({
                        lat: location.lat,
                        lng: location.lng,
                        address: location.address || '',
                        validationResult: location.validationResult
                    });
                }
            });
        };

        // Try multiple strategies to ensure flyTo works
        if (map.loaded() && map.isStyleLoaded()) {
            if (isDev) console.log('🗺️ Map fully ready, flying immediately');
            flyToLocationAndShowMarker();
        } else {
            if (isDev) console.log('🗺️ Map not ready, using idle event');
            // Use 'idle' event - fires when map has finished rendering
            map.once('idle', () => {
                if (isDev) console.log('🗺️ Map idle event fired, flying now');
                flyToLocationAndShowMarker();
            });
        }
    }
}

// Handle geolocation from controls
function handleGeolocate(coords: { lat: number, lng: number }) {
    // If map isn't loaded yet, load it first then geolocate
    if (!mapLoadedOnMobile.value && !props.isDesktop) {
        mapLoadedOnMobile.value = true;
    }
    emit('geolocate', coords);
}

// Handle location selection from search when map might not be loaded
function handleLocationUpdate(locationData: { lat: number, lng: number, address?: string, validationResult?: { valid: boolean, message: string, hardInvalid?: boolean } }) {
    if (isDev) {
        console.log('📍 handleLocationUpdate called:', locationData);
        console.log('📍 mapInstance.value:', !!mapInstance.value);
        console.log('📍 mapLoadedOnMobile.value:', mapLoadedOnMobile.value);
    }

    // If map is already loaded, fly to it and show marker
    if (mapInstance.value) {
        if (isDev) console.log('📍 Map already loaded, flying to location and showing marker');
        mapInstance.value.flyTo({
            center: [locationData.lng, locationData.lat],
            zoom: 16,
            duration: 1000
        });

        // Trigger marker creation on the Map component
        nextTick(() => {
            if (mapRef.value?.handleLocationSelect) {
                if (isDev) console.log('📍 Triggering marker creation via handleLocationSelect');
                mapRef.value.handleLocationSelect({
                    lat: locationData.lat,
                    lng: locationData.lng,
                    address: locationData.address || '',
                    validationResult: locationData.validationResult
                });
            }
        });
        return;
    }

    // Map not loaded - store location and trigger map load
    if (isDev) console.log('📍 Storing pending location and loading map');
    pendingLocation.value = locationData;
    if (!mapLoadedOnMobile.value && !props.isDesktop) {
        if (isDev) console.log('🗺️ Loading map - location searched:', locationData.address);
        mapLoadedOnMobile.value = true;
    }
}

// Handle geolocation to pick mode
function handleGeolocateToPick(coords: { lat: number, lng: number }) {
    // If map isn't loaded yet, load it first
    if (!mapLoadedOnMobile.value && !props.isDesktop) {
        mapLoadedOnMobile.value = true;
    }
    // The map will handle pick mode once loaded
    emit('geolocate', coords);
}

const emit = defineEmits<{
    'update:bounds': [bounds: any, isDetailView?: boolean]
    'selectReport': [event: { report: Record<string, unknown> }]
    'closeModal': []
    'mapInit': [instance: any]
    'addReport': [type: 'photo' | 'classic', location?: { lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> }]
    'toggleLanguage': []
    'selectPage': [page: Record<string, unknown>]
    'geolocate': [coords: { lat: number, lng: number }]
    'formSuccess': [response: any]
    'formClose': []
    /** Issue #404: Info-tab "Explore" shortcut: fit map to all requests. */
    'fitBounds': []
}>();

/**
 * Issue #404: Info-tab "Explore" shortcut handler.
 * On mobile the map may not be mounted yet (lazy mount), so trigger a load
 * first; the page-level fit-bounds handler runs once the map is ready.
 */
function onFitBoundsRequest() {
    if (!mapLoadedOnMobile.value && !props.isDesktop) {
        mapLoadedOnMobile.value = true;
    }
    emit('fitBounds');
}

type BottomSheetPosition = 'low' | 'medium' | 'high';

const bottomSheetConfig = computed(() => clientConfig.value?.theme?.ui?.bottomSheet || {});

// Snap count is sourced from the drawer once it has resolved its actual
// snap points (after dedup of near-duplicates). Until the drawer reports,
// fall back to a reasonable estimate from cfg.snapPoints.length or 3.
const reportedSnapCount = ref<number | null>(null);
const configuredSnapCount = computed(() => {
    if (reportedSnapCount.value && reportedSnapCount.value > 0) return reportedSnapCount.value;
    const snapPoints = bottomSheetConfig.value?.snapPoints;
    return Array.isArray(snapPoints) && snapPoints.length > 0
        ? snapPoints.length
        : 3;
});
const highestSheetSnapIndex = computed(() => Math.max(0, configuredSnapCount.value - 1));

function snapIndexFromPosition(position?: string): number {
    if (position === 'low') return 0;
    if (position === 'high') return highestSheetSnapIndex.value;
    return Math.min(1, highestSheetSnapIndex.value);
}

// Track bottom sheet snap index: 0=min, 1=mid, 2=high.
// Initial state follows ui.bottomSheet.position from the merged tenant config.
const sheetSnapIndex = ref(snapIndexFromPosition(bottomSheetConfig.value?.position));

const initialSnapKey = computed(() => {
    const position = (bottomSheetConfig.value?.position || 'medium') as BottomSheetPosition;
    return `${currentJurisdictionId.value || 'default'}:${position}`;
});

// Seed with the current key so the first hydrate of clientConfig still fires
// when it changes. Initial sheetSnapIndex is already set above from the same
// source, so we don't need { immediate: true } — also avoids TDZ on the
// sheetIsDragging/sheetHasFocus refs declared further down.
const appliedInitialSnapKey = ref(initialSnapKey.value);

watch(initialSnapKey, (key) => {
    if (key === appliedInitialSnapKey.value) return;
    // Don't yank the sheet out from under an actively interacting user.
    // If the user is dragging or has focus inside the sheet when a late
    // tenant hydrate arrives, defer applying the new position.
    if (sheetIsDragging.value || sheetHasFocus.value) {
        appliedInitialSnapKey.value = key;
        return;
    }
    // Split on first ':' only — defensive in case a future jurisdiction
    // slug ever contains a colon. Position values are 'low'|'medium'|'high'.
    const colonIdx = key.indexOf(':');
    const position = colonIdx >= 0 ? key.slice(colonIdx + 1) : '';
    sheetSnapIndex.value = snapIndexFromPosition(position);
    appliedInitialSnapKey.value = key;
});

// Offline state - shift sheet to middle when offline to show banner
const { isOffline } = useOnlineStatus();
const { pendingCount } = useOfflineQueue();

// Track if we should prevent collapse due to offline state
const isOfflineOrPending = computed(() => isOffline.value || pendingCount.value > 0);

// Store the position before going offline so we can restore it
const positionBeforeOffline = ref<number | null>(null);

// When going offline or having pending items, ensure sheet is at least at middle position
// Restore previous position when back online (if it was higher than middle)
watch(isOfflineOrPending, (offlineOrPending, wasOfflineOrPending) => {
    if (offlineOrPending) {
        // Going offline or getting pending items
        if (sheetSnapIndex.value === 0) {
            // Store that we were collapsed (but no need to restore to 0)
            positionBeforeOffline.value = null;
            sheetSnapIndex.value = 1; // Shift to middle
            if (isDev) console.log('📱 Offline/pending detected - shifting sheet from collapsed to middle');
        } else if (sheetSnapIndex.value > 0 && positionBeforeOffline.value === null) {
            // Already expanded, remember this position
            positionBeforeOffline.value = sheetSnapIndex.value;
            if (isDev) console.log('📱 Offline/pending detected - sheet already at position', sheetSnapIndex.value);
        }
    } else if (wasOfflineOrPending) {
        // Coming back online - restore previous position if it was higher than middle
        if (positionBeforeOffline.value !== null && positionBeforeOffline.value > 1) {
            sheetSnapIndex.value = positionBeforeOffline.value;
            if (isDev) console.log('📱 Back online - restoring sheet to position', positionBeforeOffline.value);
        }
        // ALWAYS reset to prevent stale state across multiple offline sessions
        positionBeforeOffline.value = null;
    }
});

// Focus/drag guards to avoid collapsing while user interacts with the sheet
const sheetHasFocus = ref(false);
const sheetIsDragging = ref(false);
// Mirror of BottomSheetDrawer's MINIMUM_SHEET_HEIGHT constant. Used until
// the drawer reports its measured value via `minimum-height-change`.
const SHEET_MIN_FLOOR = 140;
const measuredSheetMinimumHeight = ref(SHEET_MIN_FLOOR);

// FormFirst config - controls collapse-on-focus behavior
const collapseOnFocusEnabled = computed(() => formFirst.formFirstConfig.value.collapseOnFocus ?? true);
const collapseDebounce = computed(() => typeof bottomSheetConfig.value.collapseDebounce === 'number' ? bottomSheetConfig.value.collapseDebounce : 200);
const autoTap = computed(() => bottomSheetConfig.value.autoCollapseOnMapTap !== false); // default true
const autoMove = computed(() => bottomSheetConfig.value.autoCollapseOnMapMove !== false); // default true

// Minimized sheet height for form padding calculation. Source-of-truth is
// the measured value emitted by BottomSheetDrawer (logo + handle + tabs).
// Config minimum is honored only as an additional floor.
const minimizedSheetHeight = computed(() => {
    const configMin = bottomSheetConfig.value?.minimumHeight;
    const parsedMin = configMin != null && !isNaN(Number(configMin)) ? Number(configMin) : 0;
    return Math.max(parsedMin, measuredSheetMinimumHeight.value, SHEET_MIN_FLOOR);
});

const collapseIfAllowed = useDebounceFn(() => {
    // Don't auto-collapse when offline or with pending items - keep banner visible
    if (!sheetHasFocus.value && !sheetIsDragging.value && !isOfflineOrPending.value) {
        sheetSnapIndex.value = 0;
    } else if (isOfflineOrPending.value && isDev) {
        console.log('📱 Auto-collapse prevented - offline/pending state active');
    }
}, collapseDebounce);

function onMapTap() {
    if (autoTap.value) collapseIfAllowed();
}

function onMapInteraction() {
    if (autoMove.value) collapseIfAllowed();
}

function onSheetFocusIn() {
    // Track focus state for auto-collapse behavior (don't collapse while user is focused)
    sheetHasFocus.value = true;
    // Note: Map loading on search focus is handled by the searchSystem.isFocused watcher
}
function onSheetFocusOut() {
    sheetHasFocus.value = false;
}
function onSheetDraggingChange(val: boolean) {
    sheetIsDragging.value = val;
}
function onSheetMinimumHeightChange(height: number) {
    if (Number.isFinite(height) && height > 0) {
        measuredSheetMinimumHeight.value = height;
    }
}
function onSheetSnapCountChange(count: number) {
    if (Number.isFinite(count) && count > 0) {
        reportedSnapCount.value = count;
        // Clamp current index to the actually rendered range so a degenerate
        // snapPoints config (e.g. 3 near-duplicates collapsing to 1) doesn't
        // leave isSheetExpanded permanently stuck.
        if (sheetSnapIndex.value > count - 1) sheetSnapIndex.value = count - 1;
        if (import.meta.dev && count <= 1) {
            console.warn(
                '[MapSection] Bottom sheet collapsed to a single snap point. ' +
                'Form-first teardown is disabled and aria-expanded is suppressed. ' +
                'Check theme.ui.bottomSheet.snapPoints for near-duplicate values.'
            );
        }
    }
}

// Form-first mode: hide form when bottom sheet is expanded (high snap point).
// Degenerate single-snap configs (count <= 1) leave highestSheetSnapIndex=0,
// which would make `0 >= 0` permanently true and immediately tear down the
// form-first overlay. Treat such configs as "always collapsed" so the form
// stays visible until the user explicitly drags or taps to leave it.
const isSheetExpanded = computed(() => {
    if (configuredSnapCount.value <= 1) return false;
    return sheetSnapIndex.value >= highestSheetSnapIndex.value;
});

// Watch for sheet expansion - once expanded, mark as having left form-first
// Using centralized state from useFormFirstMode composable
watch(isSheetExpanded, (expanded) => {
    if (expanded && props.formFirstMode) {
        formFirst.markAsLeftFormView();
    }
});

// Show form when: in form-first mode AND hasn't left form-first AND not in map pick
const showFormFirstForm = computed(() => {
    if (!props.formFirstMode) return false;
    if (formFirst.hasLeftFormView.value) return false;
    return !mapPickActive.value;
});

// Show back-to-form button when user has left form-first mode (browsing) but not in map pick
const showBackToFormButton = computed(() => {
    if (!props.formFirstMode) return false;
    return formFirst.hasLeftFormView.value && !mapPickActive.value;
});

// Handle back to form action - collapse sheet and return to form-first state
function onBackToForm() {
    formFirst.returnToFormView();
    sheetSnapIndex.value = 0;
}

// Collapse bottom sheet when form receives focus (any input)
// Only collapses if collapseOnFocus is enabled in client config
// Don't collapse when offline/pending - keep banner visible
function onFormFocusIn() {
    // Don't collapse mid-interaction. Drag covers stylus/multitouch;
    // sheetHasFocus covers the case where focus was already inside the
    // sheet (e.g. validators or autofocus on mount re-firing focus events).
    if (sheetIsDragging.value || sheetHasFocus.value) return;
    if (props.formFirstMode && collapseOnFocusEnabled.value && sheetSnapIndex.value > 0) {
        if (!isOfflineOrPending.value) {
            sheetSnapIndex.value = 0;
            if (isDev) console.log('📋 Form focused - collapsing bottom sheet');
        } else if (isDev) {
            console.log('📋 Form focused but not collapsing - offline/pending state active');
        }
    }
}

// Collapse bottom sheet when user reaches submit section (privacy + submit button)
// Ensures sheet stays collapsed even if user scrolled it back up
// Don't collapse when offline/pending - keep banner visible
function onFormBottomFocus() {
    if (props.formFirstMode && sheetSnapIndex.value > 0) {
        if (!isOfflineOrPending.value) {
            sheetSnapIndex.value = 0;
            if (isDev) console.log('📋 Submit section focused - ensuring bottom sheet is collapsed');
        } else if (isDev) {
            console.log('📋 Submit section focused but not collapsing - offline/pending state active');
        }
    }
}

// Load map when List tab is activated (so map is ready when user needs it)
function onTabChange(tabId: string) {
    if (tabId === 'list' && !mapLoadedOnMobile.value && !props.isDesktop) {
        if (isDev) console.log('🗺️ Loading map - List tab activated');
        mapLoadedOnMobile.value = true;
    }
}

// Watch for search activity - load map when search becomes active or focused
watch(
    () => props.searchSystem?.isSearchActive?.value,
    (isActive) => {
        if (isActive && !mapLoadedOnMobile.value && !props.isDesktop) {
            if (isDev) console.log('🗺️ Loading map - search active');
            mapLoadedOnMobile.value = true;
        }
    }
);

// Watch for search focus - load map when search input is focused
watch(
    () => props.searchSystem?.isFocused?.value,
    (isFocused) => {
        if (isFocused && !mapLoadedOnMobile.value && !props.isDesktop) {
            if (isDev) console.log('🗺️ Loading map - search focused');
            mapLoadedOnMobile.value = true;
        }
    }
);

// Form-first mode: load map when bottom sheet is expanded (so list can interact with map)
watch(
    isSheetExpanded,
    (expanded) => {
        if (expanded && props.formFirstMode && !mapLoadedOnMobile.value && !props.isDesktop) {
            if (isDev) console.log('🗺️ Loading map - bottom sheet expanded in form-first mode');
            mapLoadedOnMobile.value = true;
        }
    }
);

// Form-first mode: load map when user enters map pick mode (needs map to select location)
watch(
    mapPickActive,
    (active) => {
        if (active && !mapLoadedOnMobile.value && !props.isDesktop) {
            if (isDev) console.log('🗺️ Loading map - map pick mode activated');
            mapLoadedOnMobile.value = true;
        }
    }
);

// Expose method for parent to return to form-first mode (e.g., when tooltip add-report is clicked)
function returnToFormFirst() {
    if (props.formFirstMode) {
        formFirst.returnToFormView();
        sheetSnapIndex.value = 0;
    }
}

defineExpose({
    returnToFormFirst
});
</script>
