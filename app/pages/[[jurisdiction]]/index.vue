/* eslint-disable vue/multi-word-component-names */
<script setup lang="ts" name="IndexPage">
import { computed, defineAsyncComponent, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRuntimeConfig, useRoute, useRouter } from '#app';
import { useLayout } from '~/composables/core/useLayout';
import { useRequestsStore } from '~/stores/requests';
import { resolveTenantMetaDescription, resolveTenantMetaOverride } from '~/utils/pageMeta';

// Feature-specific composables
import { useMapManager } from '~/composables/features/useMapManager';
import { useReportManager } from '~/composables/features/useReportManager';
import { useModalManager } from '~/composables/features/useModalManager';
import { useFeedbackState } from '~/composables/features/useFeedbackState';
import { useServiceProviderState } from '~/composables/features/useServiceProviderState';
import { useRequestWatchers } from '~/composables/features/useRequestWatchers';
import { useEventManager } from '~/composables/features/useEventManager';
import { useMapListSync } from '~/composables/features/useMapListSync';
import { useReportsFilter } from '~/composables/features/useReportsFilter';
import { useSearch } from '~/composables/features/useSearch';
import { useListFirst } from '~/composables/features/useListFirst';
import { useFormFirstMode } from '~/composables/features/useFormFirstMode';

// Props
const props = defineProps<{
    initialRequestId?: string
    initialConfirmationUuid?: string
}>();

// Core composables and stores
const { locale, t } = useI18n();
const { isDesktop } = useLayout();
const { shouldUseDesktopModal } = useResponsive();
// Use dynamic config from API for per-jurisdiction feature flags
const {
    clientConfig,
    jurisdiction: configJurisdiction,
    currentJurisdictionId,
    i18nOverrides,
    languages
} = useMarkASpotConfig();
// Keep runtimeConfig for build-time values like clientName
const runtimeConfig = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

// Jurisdiction-aware report path for navigation (preserves tenant slug)
const reportPath = computed(() => {
    const jur = route.params.jurisdiction || configJurisdiction.value?.slug;
    return jur ? `/${jur}/report` : '/report';
});
const requestsStore = useRequestsStore();

// Feature managers
const mapManager = useMapManager();
const reportManager = useReportManager(mapManager as any);
const modalManager = useModalManager();
const feedbackState = useFeedbackState(); // Feedback state (pro or stub)
const serviceProviderState = useServiceProviderState(); // Service provider state (pro or stub)
const eventManager = useEventManager(modalManager);
const mapPick = useMapPick();
const pickWasActive = ref(false);
const uiStore = useUIStore();

// List-first preloading for mobile (loads data before map)
const listFirst = useListFirst();

// Form-first mode for mobile (issue #61)
// Uses VueUse's useWindowSize internally - no duplicate resize listeners
const formFirst = useFormFirstMode();
const { photoReportAvailable } = useFeatureFlags();

// Failed submission editing (for offline queue)
const failedEdit = useFailedSubmissionEdit();

// Dev mode flag for console logging
const isDev = import.meta.dev;

// Request watchers
const requestWatchers = useRequestWatchers(props, mapManager as any, reportManager, modalManager, feedbackState, serviceProviderState);

// Computed values
const FEATURE_CONTACT_FORM = computed(() => Boolean(clientConfig.value?.features?.contactForm));
// Pass ALL accumulated requests - track total for "X of Total" display
const allRequests = computed(() => requestsStore.allRequestsList);
const storeTotalCount = computed(() => requestsStore.requestsCount);
const globalReportsTotal = ref<number | null>(null);
let globalReportsTotalRequestId = 0;
const sidebarEnabled = computed(() => clientConfig.value?.theme?.ui?.leftSidebar?.enabled ?? true);
const sidebarWidth = computed(() => clientConfig.value?.theme?.ui?.leftSidebar?.width || '320px');

const fetchGlobalReportsTotal = async () => {
    const requestId = ++globalReportsTotalRequestId;
    const jurisdictionId = currentJurisdictionId.value ?? configJurisdiction.value?.id;
    if (!jurisdictionId) {
        globalReportsTotal.value = null;
        return;
    }

    try {
        const response = await useApiClient().get<{ meta?: { total?: number } }>(
            '/georeport/v2/requests.json',
            {
                extensions: 'true',
                meta: 'true',
                limit: '1',
                offset: '0',
                start_date: '2001-01-01',
                jurisdiction_id: String(jurisdictionId),
                langcode: String(locale.value)
            },
            { silent: true }
        );
        if (requestId !== globalReportsTotalRequestId) return;
        globalReportsTotal.value = typeof response?.meta?.total === 'number'
            ? response.meta.total
            : null;
    } catch (error) {
        if (isDev) console.warn('Failed to load global report total', error);
        if (requestId !== globalReportsTotalRequestId) return;
        globalReportsTotal.value = null;
    }
};

onMounted(() => {
    fetchGlobalReportsTotal();
});

watch(
    () => [currentJurisdictionId.value ?? configJurisdiction.value?.id, locale.value],
    () => fetchGlobalReportsTotal()
);

// Initialize search system first (searches through all loaded requests)
const searchSystem = useSearch(allRequests, mapManager);

// Apply search filtering FIRST - this becomes the base dataset for all other filtering
const searchFilteredRequests = computed(() => {
    // If search is active, use search results; otherwise use all requests
    return searchSystem.isSearchActive.value
        ? searchSystem.clientSearchResults.value
        : allRequests.value;
});

// Shared state for map bounds (will be updated by handleBoundsUpdate)
const sharedMapBounds = ref<any>(null);
const sharedIsMapInitialized = ref(false);

// Check if deferredMap preload is enabled (for mobile filter behavior)
const deferredMapEnabled = computed(() => {
    const mapConfig = clientConfig.value?.features?.map;
    return mapConfig?.deferredMap?.enabled && mapConfig?.deferredMap?.preloadData;
});

// Create a computed ref for bounds-filtered requests (for building filter options)
// This shows only items in the current map view, excluding search results
const boundsFilteredForOptions = computed(() => {
    const requests = searchFilteredRequests.value;

    // If bounds filtering is disabled or map not initialized, use all requests
    const enableBoundsFiltering = clientConfig.value?.features?.map?.enableBoundsFiltering ?? true;
    if (!enableBoundsFiltering || !sharedMapBounds.value || !sharedIsMapInitialized.value) {
        return requests;
    }

    // Skip bounds filtering during search to show all search results
    if (searchSystem.isSearchActive.value) {
        return requests;
    }

    // On mobile with deferredMap preload, use ALL items for filter options
    // This ensures filters show counts for all preloaded + map-loaded items
    if (!isDesktop.value && deferredMapEnabled.value) {
        return requests;
    }

    // Apply bounds filtering to show only visible items
    const bounds = sharedMapBounds.value;
    return requests.filter((request) => {
        const lat = Number(request.lat);
        const lng = Number(request.long);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

        return (
            lat >= bounds.minLat &&
            lat <= bounds.maxLat &&
            lng >= bounds.minLng &&
            lng <= bounds.maxLng
        );
    });
});

// Create shared filter system that filters search results, then applies category/status/time filters
const sharedFilterSystem = useReportsFilter(
    searchFilteredRequests as any, // Data to filter (already search-filtered)
    boundsFilteredForOptions as any // Data to build filter options from
);

// Initialize map-list synchronization with the shared filter system
// Pass search active state to disable bounds filtering during search
const mapListSync = useMapListSync(searchFilteredRequests as any, {
    enableBoundsFiltering: clientConfig.value?.features?.map?.enableBoundsFiltering ?? true,
    enableSelectionSync: true,
    sharedFilterSystem,
    isSearchActive: searchSystem.isSearchActive
});

// Combined bounds handler that updates both mapManager and mapListSync
const handleBoundsUpdate = async (bounds: any, isDetailView = false) => {
    // Update shared bounds state for filter options
    sharedMapBounds.value = bounds;
    if (!sharedIsMapInitialized.value) {
        sharedIsMapInitialized.value = true;
    }

    // Update map list sync with new bounds for filtering
    mapListSync.handleMapBoundsUpdate(bounds);

    // Skip API calls during initial fitBounds animation - markers are already loaded
    // This prevents the cascade: fitBounds → moveend → redundant API call
    if (mapManager.isInitialFit.value) {
        if (isDev) console.log('⏭️  Skipping API call during initial fitBounds');
        return;
    }

    // Skip API calls during active search - search results are already loaded
    // This prevents the cascade: search → fitBounds → moveend → API call
    if (searchSystem.isSearchActive.value) {
        if (isDev) console.log('⏭️  Skipping API call during active search');
        return;
    }

    // Trigger API request for new markers in the bounds
    await mapManager.handleBoundsUpdate(bounds, isDetailView);
};

// Use filtered data directly from the sync composable to avoid extra computed layers
const filteredRequestsForList = mapListSync.filteredForList as any;
const filteredRequestsForMap = mapListSync.filteredForMap as any;

// Auto-fit map to filtered markers is handled by useMapManager.handleMapInit
// which watches for the first batch of requests and calls fitBoundsToRequests once.
// The isInitialFit guard prevents the resulting moveend from triggering redundant API calls.

// Component refs
const modalsContainerRef = ref();

// Ref for MapSection to control form-first mode
const mapSectionRef = ref<{ returnToFormFirst: () => void } | null>(null);

/**
 * Issue #404: Info-tab "Explore" shortcut handler.
 * Fits the map view to all currently visible (filtered) requests.
 * If the map isn't ready yet (mobile lazy mount), defer until it is —
 * MapSection's onFitBoundsRequest already triggers the map load before
 * emitting fit-bounds, so we just need to call once the instance exists.
 */
const handleFitBounds = () => {
    const fit = () => {
        if (mapManager.fitBoundsToRequests) {
            mapManager.fitBoundsToRequests(filteredRequestsForMap.value);
        }
    };
    if (mapManager.mainMapInstance.value) {
        fit();
    } else {
        // Map not yet initialized: wait for handleMapInit to set the instance.
        const stop = watch(mapManager.mainMapInstance, (instance) => {
            if (instance) {
                stop();
                nextTick(fit);
            }
        });
    }
};

// Combined success handler that resets form-first state
const handleFormSuccess = () => {
    try {
        reportManager.handleSuccess();
    } catch (error) {
        console.error('Error in handleSuccess:', error);
    } finally {
        formFirst.resetOnSuccess();
    }
};

// Enhanced event handlers that integrate composables
const handleReport = (type: 'photo' | 'classic', location?: { lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> }) => {
    const effectiveType = type === 'photo' && !photoReportAvailable.value ? 'classic' : type;

    // When form-first mode is active, switch tabs instead of opening a dialog
    if (formFirst.isFormFirstActive.value) {
        // Set the active tab
        formFirst.setActiveTab(effectiveType);

        // If location provided, update the map center so form gets the location
        if (location) {
            mapManager.handleLocationSelect(location);
        }

        // Return to form view (collapse sheet, show form)
        nextTick(() => {
            if (mapSectionRef.value?.returnToFormFirst) {
                mapSectionRef.value.returnToFormFirst();
            }
        });

        return;
    }

    // Desktop/standard mode: open dialog
    const mapCenter = reportManager.handleReport(effectiveType, location);
    if (mapCenter) {
        mapManager.handleLocationSelect(mapCenter);
    }
};

// Initialize everything
eventManager.initializeEvents();
requestWatchers.initializeWatchers();

/**
 * Consolidated initialization on mount
 * Handles: preload, pick mode, query params, modals
 */
onMounted(async () => {
    const isMobile = !isDesktop.value;

    // 1. Preload list data on mobile FIRST (before other interactions)
    if (isMobile) {
        await listFirst.preload(isMobile);
    }

    // 2. Handle pick mode activation from store (mobile navigation from /report)
    if (uiStore.mapPickMode.active) {
        nextTick(() => {
            mapPick.start(uiStore.mapPickMode.initialCoords || undefined);
        });
    }

    // 3. Handle form-first mode redirect from /report page
    if (route.query.formFirst && formFirst.isFormFirstActive.value) {
        const requestedTabType = route.query.formFirst as 'photo' | 'classic';
        const tabType = requestedTabType === 'photo' && !photoReportAvailable.value ? 'classic' : requestedTabType;
        formFirst.setActiveTab(tabType);

        // Handle location data from query params if provided
        if (route.query.lat && route.query.lng) {
            const lat = parseFloat(route.query.lat as string);
            const lng = parseFloat(route.query.lng as string);
            const address = route.query.address as string;

            if (!isNaN(lat) && !isNaN(lng)) {
                // Store location for form to use
                uiStore.setLastMapLocation({ lat, lng, address });
            }
        }

        // Clear formFirst query param to clean up URL
        nextTick(() => {
            const { formFirst: _, ...cleanQuery } = route.query;
            navigateTo({ query: cleanQuery }, { replace: true });
        });
    }

    // 4. Auto-open report dialog if report=true in query params (desktop mode)
    if (route.query.report === 'true') {
        const requestedType = route.query.type === 'photo' || route.query.type === 'classic'
            ? route.query.type
            : undefined;
        const fallbackType = photoReportAvailable.value ? 'photo' : 'classic';
        const reportType = requestedType === 'photo' && !photoReportAvailable.value
            ? 'classic'
            : requestedType ?? fallbackType;
        reportManager.showDialog.value = true;
        reportManager.reportType.value = reportType;

        // Handle location data from query params if provided
        if (route.query.lat && route.query.lng) {
            const lat = parseFloat(route.query.lat as string);
            const lng = parseFloat(route.query.lng as string);
            const address = route.query.address as string;

            if (!isNaN(lat) && !isNaN(lng)) {
                reportManager.reportLocation.value = {
                    lat,
                    lng,
                    address: address || undefined
                };
            }
        }
    }

    // 5. Handle location context from closed form (for faster map restoration)
    if (uiStore.lastMapLocation) {
        mapManager.handleLocationSelect(uiStore.lastMapLocation);
        // Note: Don't clear here - let MapLazy clear it after the map loads
    }

    // 6. Handle mobile success redirect - show success overlay
    if (route.query.success === 'true' && route.query.successData) {
        try {
            const successData = JSON.parse(route.query.successData as string);
            nextTick(() => {
                if (modalsContainerRef.value?.handleSuccess) {
                    modalsContainerRef.value.handleSuccess(successData);
                }
                if (mapManager.clearLocationMarker) {
                    mapManager.clearLocationMarker();
                }
            });
        } catch (e) {
            console.error('Failed to parse mobile success data:', e);
        }

        // Clear query params to avoid showing success overlay on refresh
        nextTick(() => {
            const { success, successData, requestId, ...cleanQuery } = route.query;
            navigateTo({ query: cleanQuery }, { replace: true });
        });
    }

    // 7. Handle confirmation URL parameters
    if (props.initialConfirmationUuid) {
        modalManager.initializeConfirmationModal(props.initialConfirmationUuid);
    }

    // Note: Service provider URLs are now handled via query param watcher in useRequestWatchers
});

// Watch for failed submission edit requests (from OfflineBanner)
watch(() => failedEdit.shouldOpenForm.value, (shouldOpen) => {
    if (shouldOpen) {
        if (isDev) console.log('📝 INDEX: Opening form for failed submission edit');

        // Mark the form as opened (resets the flag)
        failedEdit.formOpened();

        // Open the form dialog (form data is already in serviceRequestStore.formDraft)
        const type = photoReportAvailable.value ? 'photo' : 'classic';

        if (shouldUseDesktopModal()) {
            reportManager.handleReport(type);
        } else {
            router.push({ path: reportPath.value, query: { type, editMode: 'failed' } });
        }
    }
});

// Close desktop dialog when entering pick-on-map mode so the map is clickable
watch(() => mapPick.isActive.value, async (active, oldActive) => {
    if (isDev) console.log('🗺️ INDEX: Pick mode watch triggered', { active, oldActive, pickWasActive: pickWasActive.value });
    if (active && !oldActive) {
        if (isDev) console.log('🗺️ INDEX: Entering pick mode - saving form state');
        pickWasActive.value = true;
        // Save form state before closing (if modalsContainer ref exists)
        if (modalsContainerRef.value?.saveFormDraft) {
            await modalsContainerRef.value.saveFormDraft();
        }
        // Close dialog to allow map interaction
        reportManager.showDialog.value = false;
    } else if (!active && pickWasActive.value) {
        if (isDev) console.log('🗺️ INDEX: Exiting pick mode - reopening form');
        const r = mapPick.lastResult.value;

        // Check if this was initiated from mobile /report page
        const returnRoute = uiStore.mapPickMode.returnRoute;
        const returnPath = typeof returnRoute === 'object' ? returnRoute?.path : returnRoute;
        const isReportPageReturn = typeof returnPath === 'string' && returnPath.endsWith('/report');

        if (isReportPageReturn) {
            if (r) {
                // Navigate back to report page with picked location and preserve original query params
                const baseQuery = typeof returnRoute === 'object' && returnRoute.query
                    ? { ...returnRoute.query }
                    : { ...route.query };

                router.push({
                    path: returnPath,
                    query: {
                        ...baseQuery,
                        lat: String(r.lat),
                        lng: String(r.lng),
                        address: r.address
                    }
                });
            } else {
                // Canceled - navigate back to report page without changes, preserving original params
                if (typeof returnRoute === 'object' && returnRoute.query) {
                    router.push({ path: returnPath, query: returnRoute.query });
                } else {
                    router.push(returnPath);
                }
            }
            uiStore.endMapPickMode();
        } else if (formFirst.isFormFirstActive.value) {
            // Form-first mode: form is already visible on home page
            // LocationInput's mapPick.onPicked listener handles the location update
            // Just log for debugging
            if (isDev) console.log('🗺️ INDEX: Form-first mode - letting LocationInput handle picked location:', r);
        } else {
            // Desktop flow - re-open modal with picked location
            const type = (reportManager.reportType as any).value || 'classic';

            if (r) {
                // Re-open with picked location
                if (shouldUseDesktopModal()) {
                    reportManager.handleReport(type, { lat: r.lat, lng: r.lng, address: r.address, addressObj: r.addressObj });
                } else {
                    router.push({ path: reportPath.value, query: { type, lat: String(r.lat), lng: String(r.lng), address: r.address } });
                }
            } else {
                // Canceled pick: re-open the form without location
                if (shouldUseDesktopModal()) {
                    reportManager.handleReport(type);
                } else {
                    router.push({ path: reportPath.value, query: { type } });
                }
            }
        }
        pickWasActive.value = false;
    }
});

// Preload logo images for better LCP performance
// Dynamic OG meta tags (SSR-only, for crawlers)
const ogTitle = computed(() => {
    const name = configJurisdiction.value?.name ||
      clientConfig.value?.client?.name ||
      clientConfig.value?.name ||
      runtimeConfig.public.clientName ||
      'Mark-a-Spot';
    return String(name);
});

const ogDescription = computed(() => {
    const translatedDescription = resolveTenantMetaOverride(i18nOverrides.value, [
        locale.value,
        languages.value?.default
    ]) || t('meta.description');

    return resolveTenantMetaDescription({
        translatedDescription,
        name: clientConfig.value?.jurisdiction?.shortName ||
          clientConfig.value?.shortName ||
          ogTitle.value,
        tagline: clientConfig.value?.client?.tagline
    });
});

const ogImage = computed(() => {
    return clientConfig.value?.theme?.ogImage ||
      clientConfig.value?.theme?.logoDark ||
      '/images/og-image.webp';
});

useHead({
    title: ogTitle,
    meta: [
        { name: 'description', content: ogDescription, key: 'description' }
    ]
});

useServerSeoMeta({
    description: ogDescription,
    ogTitle,
    ogDescription,
    ogImage,
    twitterTitle: ogTitle,
    twitterDescription: ogDescription,
    twitterCard: 'summary_large_image'
});
</script>

<template>
  <div class="h-dvh w-full bg-[var(--ui-bg)] flex">
    <!-- Single skip navigation is handled globally in app.vue -->

    <!-- Main Layout -->
    <main
      id="main-content"
      role="main"
      aria-label="Main content"
      class="flex-1 flex"
      tabindex="-1"
    >
      <!-- Screen reader only h1 -->
      <h1 class="sr-only">
        {{ ogTitle }}
      </h1>

      <ClientOnly>
        <Suspense>
          <template #default>
            <div class="flex flex-1">
              <!-- Desktop Sidebar -->
              <DesktopSidebar
                v-if="isDesktop && sidebarEnabled"
                :requests="filteredRequestsForList"
                :store-total="storeTotalCount"
                :global-total="globalReportsTotal"
                :filter-stats="mapListSync.filterStats.value"
                :show-info="modalManager.showInfo.value"
                :sidebar-width="sidebarWidth"
                :shared-filter-system="sharedFilterSystem"
                :search-system="searchSystem"
                :modal-open="reportManager.showDialog.value"
                @select-report="reportManager.handleReportSelect"
                @select-page="modalManager.handlePageSelect"
                @open-contact="modalManager.openContactModal"
                @toggle-info="modalManager.toggleInfo"
                @add-report="handleReport"
                @fit-bounds="handleFitBounds"
              />

              <!-- Map Section - Lazy loaded to defer MapLibre (~1MB) until needed -->
              <LazyMapSection
                ref="mapSectionRef"
                :recent-requests="filteredRequestsForMap"
                :geolocated-coords="mapManager.geolocatedCoords.value"
                :is-desktop="isDesktop"
                :sidebar-enabled="sidebarEnabled"
                :store-total="storeTotalCount"
                :global-total="globalReportsTotal"
                :filter-stats="mapListSync.filterStats.value"
                :shared-filter-system="sharedFilterSystem"
                :search-system="searchSystem"
                :has-status-filter="mapListSync.hasStatusFilter.value"
                :has-active-filters="sharedFilterSystem.hasActiveFilters.value"
                :list-first-loading="listFirst.isLoading.value"
                :list-first-error="listFirst.error.value"
                :form-first-mode="formFirst.isFormFirstActive.value"
                :form-first-tab="formFirst.activeTab.value"
                :map-center="mapManager.mapCenter.value"
                @update:bounds="handleBoundsUpdate"
                @select-report="reportManager.handleReportSelect"
                @close-modal="reportManager.handleClose"
                @map-init="mapManager.handleMapInit"
                @add-report="handleReport"
                @toggle-language="eventManager.handleLanguageToggle"
                @select-page="modalManager.handlePageSelect"
                @open-contact="modalManager.openContactModal"
                @geolocate="mapManager.handleGeolocate"
                @form-success="handleFormSuccess"
                @form-close="formFirst.resetOnClose"
                @fit-bounds="handleFitBounds"
              />
            </div>
          </template>
          <template #fallback>
            <div class="flex-1 flex items-center justify-center">
              <span class="text-[var(--ui-text-muted)]">{{ $t('common.loading') }}</span>
            </div>
          </template>
        </Suspense>
      </ClientOnly>
    </main>

    <!-- Modals and Overlays -->
    <ModalsContainer
      ref="modalsContainerRef"
      :selected-report="reportManager.selectedReport.value"
      :selected-page="modalManager.selectedPage.value"
      :show-dialog="reportManager.showDialog.value"
      :show-feedback-modal="feedbackState.showFeedbackModal.value"
      :feedback-uuid="feedbackState.feedbackUuid.value"
      :show-confirmation-modal="modalManager.showConfirmationModal.value"
      :confirmation-uuid="modalManager.confirmationUuid.value"
      :show-service-provider-modal="serviceProviderState.showServiceProviderModal.value"
      :service-provider-uuid="serviceProviderState.serviceProviderUuid.value"
      :report-type="reportManager.reportType.value"
      :map-center="reportManager.reportLocation.value || mapManager.mapCenter.value"
      :geolocated-coords="mapManager.geolocatedCoords.value"
      :map-instance="mapManager.mainMapInstance.value"
      :show-contact-modal="modalManager.showContactModal.value"
      :feature-contact-form="FEATURE_CONTACT_FORM"
      @close-report="() => reportManager.handleClose(props.initialRequestId)"
      @close-dialog="reportManager.handleDialogClose"
      @close-page="() => modalManager.handlePageSelect(null)"
      @close-contact="modalManager.handleContactClose"
      @close-feedback="feedbackState.handleFeedbackClose"
      @close-confirmation="modalManager.handleConfirmationClose"
      @close-service-provider="serviceProviderState.handleServiceProviderClose"
      @success="handleFormSuccess"
      @create-new="() => { formFirst.resetForNewReport(); mapManager.clearMapCenter(); reportManager.handleReport('photo'); }"
      @follow-changed="reportManager.handleFollowChange"
    />
  </div>
</template>
