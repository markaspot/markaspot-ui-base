import type { Request, BoundsType } from '~~/types';
import { useReportsFilter } from './useReportsFilter';
import { useDebounceFn } from '@vueuse/core';

/**
 * Map-List Synchronization Composable
 *
 * Provides unified filter state management and coordination between
 * the reports list and map components. Ensures both components stay
 * in perfect sync with the same filtered data.
 */

export interface MapListSyncOptions {
    /** Enable automatic map bounds filtering */
    enableBoundsFiltering?: boolean
    /** Enable bi-directional selection sync */
    enableSelectionSync?: boolean
    /** Shared filter system to use instead of creating new one */
    sharedFilterSystem?: ReturnType<typeof useReportsFilter>
    /** Ref indicating if search is active (disables bounds filtering) */
    isSearchActive?: Ref<boolean>
}

export function useMapListSync(
    allRequests: Ref<Request[]> | Ref<readonly Request[]>,
    options: MapListSyncOptions = {}
) {
    const {
        enableBoundsFiltering = false,
        enableSelectionSync = true,
        sharedFilterSystem,
        isSearchActive
    } = options;

    // Use shared filter system or initialize new one
    const filterSystem = sharedFilterSystem || useReportsFilter(allRequests);

    // State for cross-component coordination
    const selectedReport = ref<Request | null>(null);
    const mapBounds = ref<BoundsType | null>(null);
    const isMapInitialized = ref(false);

    const isBoundsFilterActive = computed(() =>
        enableBoundsFiltering &&
        Boolean(mapBounds.value) &&
        isMapInitialized.value &&
        !(isSearchActive?.value)
    );

    /**
   * Filtered data for list component
   * PERFORMANCE: Uses the filter system's already-computed filtered results
   * Then applies bounds filtering if enabled
   */
    const filteredForList = computed(() => {
        // PERFORMANCE: Use filter system's already-computed filtered results
        // instead of duplicating the filtering logic
        let filtered = filterSystem.filteredRequests.value;

        // Apply bounds filtering if enabled and search not active
        if (isBoundsFilterActive.value && mapBounds.value) {
            const bounds = mapBounds.value;
            filtered = filtered.filter((request) => {
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
        }

        return filtered;
    });

    // filteredForMap is intentionally identical to filteredForList: the map and
    // list always show the same data set so they stay in perfect sync. Exposed
    // as a named alias rather than a wrapping computed to avoid an extra
    // reactive node with zero transformation.
    const filteredForMap = filteredForList;

    /**
   * Statistics for the current filter state
   */
    const filterStats = computed(() => ({
        total: allRequests.value.length,
        filtered: filteredForList.value.length,
        hiddenByFilters: allRequests.value.length - filteredForList.value.length,
        filterCount: filterSystem.activeFiltersList.value.length,
        boundsActive: isBoundsFilterActive.value
    }));

    /**
   * Handle map bounds updates - debounced to prevent reactive cascade
   */
    const debouncedBoundsUpdate = useDebounceFn((bounds: BoundsType) => {
        mapBounds.value = bounds;
    }, 300); // Longer debounce to batch rapid updates during zoom/pan

    const handleMapBoundsUpdate = (bounds: BoundsType) => {
        if (!isMapInitialized.value) {
            // First update: apply immediately
            isMapInitialized.value = true;
            mapBounds.value = bounds;
        } else {
            // Subsequent updates: debounce to prevent cascade
            debouncedBoundsUpdate(bounds);
        }
    };

    /**
   * Handle report selection from list
   */
    const handleListReportSelect = (report: Request) => {
        if (enableSelectionSync) {
            selectedReport.value = report;
        }
    };

    /**
   * Handle report selection from map
   */
    const handleMapReportSelect = (report: Request) => {
        if (enableSelectionSync) {
            selectedReport.value = report;
        }
    };

    /**
   * Clear current selection
   */
    const clearSelection = () => {
        selectedReport.value = null;
    };

    /**
   * Focus on a specific report (center map, highlight in list)
   */
    const focusReport = (reportId: string) => {
        const report = allRequests.value.find(r => r.service_request_id === reportId);
        if (report) {
            selectedReport.value = report;
        }
    };

    // Debug logging only in development - disabled by default
    // Uncomment for debugging filter issues:
    // if (import.meta.dev) {
    //     watch(filteredForMap, (newFiltered) => {
    //         console.log('🎯 Filter result:', { filtered: newFiltered.length, total: allRequests.value.length });
    //     }, { immediate: false });
    // }

    // Check if we should show status markers
    // Show status markers when: status filter OR time filter is active
    const hasStatusFilter = computed(() => {
        const statusFilters = Array.from(filterSystem.activeFilters.value).filter(f => f.startsWith('status:'));
        const timeFilters = Array.from(filterSystem.activeFilters.value).filter(f => f.startsWith('time:'));
        return statusFilters.length > 0 || timeFilters.length > 0;
    });

    return {
    // Filter system (all existing functionality).
    // Note: this already exposes `hasActiveFilters` (true when ANY
    // status/time/category filter is set), which the map uses to gate
    // facility-layer visibility — facilities are admin-curated points
    // independent of reports, so they are hidden while the user filters
    // reports to keep map and list scope aligned (issue #402).
        ...filterSystem,

        // Synchronized data for components
        filteredForList,
        filteredForMap,

        // Selection coordination
        selectedReport: readonly(selectedReport),

        // Statistics
        filterStats,

        // Event handlers
        handleMapBoundsUpdate,
        handleListReportSelect,
        handleMapReportSelect,
        clearSelection,
        focusReport,

        // Configuration
        isMapInitialized: readonly(isMapInitialized),
        enableBoundsFiltering,
        enableSelectionSync,
        hasStatusFilter,

        // Bounds for external use
        mapBounds: readonly(mapBounds)
    };
}

export type MapListSync = ReturnType<typeof useMapListSync>;
