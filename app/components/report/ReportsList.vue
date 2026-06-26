<script setup lang="ts">
/**
 * ReportsList Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { VList } from 'virtua/vue';
import { useI18n } from 'vue-i18n';
import { NEUTRAL_FALLBACKS } from '~/utils/colorUtils';
import { useReportsFilter } from '~/composables/features/useReportsFilter';
import { useKeyboardListNavigation } from '@/composables/useKeyboardListNavigation';
import { useReportFocus } from '@/composables/core/useReportFocus';
import { getReportStatusInfo } from '@/utils/reportUtils';
import FilterBar from '~/components/filters/FilterBar.vue';
import { formatReportCountLabel } from '@/utils/reportCountLabel';

const ITEMS_PER_PAGE = 20;
const isLoading = ref(true);
const isTransitioning = ref(false);
const showContent = ref(false);
// Filter visibility with localStorage persistence
const showFilters = ref(false);
// Mobile filter drawer state
const showFilterDrawer = ref(false);
// Layout detection
const { isDesktop } = useLayout();

// Initialize filter visibility from localStorage
onMounted(() => {
    const savedState = localStorage.getItem('mas-filters-visible');
    if (savedState !== null) {
        showFilters.value = JSON.parse(savedState);
    }
});

// Watch for changes and persist to localStorage
watch(showFilters, (newValue) => {
    localStorage.setItem('mas-filters-visible', JSON.stringify(newValue));
});

const props = defineProps<{
    requests: Array<any>
    storeTotal: number
    globalTotal?: number | null
    filterStats?: { total: number, filtered: number, hiddenByFilters: number, filterCount: number, boundsActive?: boolean }
    sharedFilterSystem?: any
    searchSystem?: any
    /** External loading state (e.g., while map/data is loading) */
    externalLoading?: boolean
}>();

const emit = defineEmits<{
    'select-report': [{ report: any, source?: string }]
}>();

const { t } = useI18n();
const { handleListItemKeydown } = useKeyboardListNavigation();
const { setSelectedReport } = useReportFocus();

// Response visibility config (show org/jur badges in list, per-jurisdiction)
const { clientConfig } = useMarkASpotConfig();
const showInList = computed(() => clientConfig.value?.responseVisibility?.showInList === true);
const { organisationsEnabled } = useFeatureFlags();

// Use shared filter system if provided, otherwise create new one
const requestsRef = computed(() => props.requests);
const filterSystem = props.sharedFilterSystem || useReportsFilter(requestsRef);
const {
    filteredRequests,
    filterGroups,
    activeFiltersList,
    hasActiveFilters,
    toggleFilter,
    clearFilter,
    clearAllFilters
} = filterSystem;

// Using shared filter system for synchronized filtering

// Process and sort filtered requests
// Use filteredRequests which includes search filtering + category/status/time filters
// PERFORMANCE: Avoid creating new objects - use a WeakMap cache for status info
const statusCache = new WeakMap<any, { hex: string, descriptive: string }>();

const getStatusCached = (request: any) => {
    let cached = statusCache.get(request);
    if (!cached) {
        const statusInfo = getReportStatusInfo(request);
        cached = {
            hex: statusInfo.statusHex || NEUTRAL_FALLBACKS.DEFAULT,
            descriptive: statusInfo.statusDescriptive
        };
        statusCache.set(request, cached);
    }
    return cached;
};

const sortedRequests = computed(() => {
    // Use props.requests which is already bounds-filtered + category/status/time filtered
    // via useMapListSync.filteredForList in the parent.
    // The sharedFilterSystem is only used for filter UI state (groups, toggles, active filters).
    return [...requestsRef.value].sort((a, b) => {
        const dateA = new Date(a.requested_datetime).getTime();
        const dateB = new Date(b.requested_datetime).getTime();
        return dateB - dateA;
    });
});

const isSearchActive = computed(() => Boolean(
    props.searchSystem?.isSearchActive?.value ?? props.searchSystem?.isSearchActive
));

const countLabel = computed(() => {
    const visible = props.filterStats?.filtered ?? sortedRequests.value.length;
    const scopedTotal = props.filterStats?.total ?? props.storeTotal;
    const globalTotal = typeof props.globalTotal === 'number' ? props.globalTotal : null;

    return formatReportCountLabel({
        visible,
        scopedTotal,
        globalTotal,
        boundsActive: props.filterStats?.boundsActive,
        hasActiveFilters: hasActiveFilters.value,
        isSearchActive: isSearchActive.value
    }, t);
});

// Helper to get status display info (used in template)
const getStatusHex = (request: any) => getStatusCached(request).hex;
const getStatusDescriptive = (request: any) => getStatusCached(request).descriptive;

// Debug logging removed for performance - status info is now cached via getStatusCached

// Enhanced loading state management with smooth transitions
watch(() => props.requests, async (newRequests) => {
    if (newRequests.length > 0) {
        // We have data - show it regardless of loading state
        isLoading.value = false;
        isTransitioning.value = false;
        showContent.value = true;
    } else {
        // No data - determine if it's loading or filtering
        // Avoid hard-hiding the list container to prevent visual flicker
        // Keep content mounted; empty states and skeleton will toggle visibility
        showContent.value = false;
        isTransitioning.value = false;
        isLoading.value = false; // Never show loading when we get empty results
    }
}, { immediate: true });

// Handle item selection
const handleReportSelect = (report: any) => {
    // Store the selected report ID for focus restoration
    setSelectedReport(report.service_request_id);
    emit('select-report', { report, source: 'list' });
};

// Format timestamps
const formatTimeAgo = (datetime?: string) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days === 0) return t('time.today');
    if (days === 1) return t('time.yesterday');
    return t('time.days_ago', { count: days });
};
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header with count and filter button -->
    <div class="px-6 py-3 sticky top-0 z-10">
      <div class="flex items-start justify-between gap-3">
        <span
          class="min-w-0 flex-1 text-neutral-600 dark:text-neutral-100 text-sm leading-snug"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ countLabel }}
        </span>

        <!-- Filter toggle button -->
        <button
          :class="[
            'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-500',
            showFilters || showFilterDrawer
              ? 'bg-primary-500 text-inverted border border-primary-500 hover:bg-primary-600'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-600 dark:hover:bg-neutral-700',
          ]"
          @click="isDesktop ? (showFilters = !showFilters) : (showFilterDrawer = !showFilterDrawer)"
        >
          <UIcon
            name="i-heroicons-funnel"
            class="w-4 h-4"
          />
          <span>{{ $t('filters.actions.toggle') }}</span>
          <span
            v-if="hasActiveFilters"
            :class="[
              'ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold',
              showFilters
                ? 'bg-white/20 text-inverted'
                : 'bg-primary-500 text-inverted',
            ]"
          >
            {{ activeFiltersList.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Desktop: Filter Bar (collapsible inline) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform -translate-y-2"
      enter-to-class="opacity-100 transform translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0"
      leave-to-class="opacity-0 transform -translate-y-2"
    >
      <FilterBar
        v-if="isDesktop && showFilters"
        :filter-groups="filterGroups"
        :has-active-filters="hasActiveFilters"
        :search-enabled="searchSystem?.isSearchEnabled.value"
        :search-query="searchSystem?.searchQuery.value || ''"
        :is-client-searching="searchSystem?.isClientSearching.value || false"
        :is-server-searching="searchSystem?.isServerSearching.value || false"
        :show-expand-button="searchSystem?.showExpandButton.value || false"
        :has-no-results="searchSystem?.hasNoResults.value || false"
        @toggle-filter="toggleFilter"
        @clear-filter="clearFilter"
        @clear-all-filters="clearAllFilters"
        @update-search="searchSystem?.handleSearchInput"
        @expand-search="searchSystem?.expandSearchToServer"
        @clear-search="searchSystem?.clearSearch"
        @search-focus-in="searchSystem?.setFocused?.(true)"
        @search-focus-out="searchSystem?.setFocused?.(false)"
      />
    </Transition>

    <!-- Mobile: Filter Fullscreen View -->
    <div
      v-if="!isDesktop && showFilterDrawer"
      class="fixed inset-0 z-50 bg-[var(--ui-bg)] flex flex-col"
    >
      <!-- Header with close button -->
      <div class="flex items-center justify-between p-4 border-b border-[var(--ui-border)]">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
          {{ $t('filters.title') }}
        </h2>
        <button
          type="button"
          class="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          @click="showFilterDrawer = false"
        >
          <UIcon
            name="i-heroicons-x-mark"
            class="w-6 h-6"
          />
        </button>
      </div>

      <!-- Filter content -->
      <div class="flex-1 overflow-y-auto">
        <FilterBar
          :filter-groups="filterGroups"
          :has-active-filters="hasActiveFilters"
          :expand-by-default="true"
          :search-enabled="searchSystem?.isSearchEnabled.value"
          :search-query="searchSystem?.searchQuery.value || ''"
          :is-client-searching="searchSystem?.isClientSearching.value || false"
          :is-server-searching="searchSystem?.isServerSearching.value || false"
          :show-expand-button="searchSystem?.showExpandButton.value || false"
          :has-no-results="searchSystem?.hasNoResults.value || false"
          @toggle-filter="toggleFilter"
          @clear-filter="clearFilter"
          @clear-all-filters="clearAllFilters"
          @update-search="searchSystem?.handleSearchInput"
          @expand-search="searchSystem?.expandSearchToServer"
          @clear-search="searchSystem?.clearSearch"
          @search-focus-in="searchSystem?.setFocused?.(true)"
          @search-focus-out="searchSystem?.setFocused?.(false)"
        />
      </div>
    </div>

    <!-- Normal List (kept mounted; visibility controlled to avoid remount flicker) -->
    <div
      v-show="sortedRequests.length > 0 && showContent && !externalLoading"
      class="flex-1 overflow-y-auto pt-2 pb-4"
      role="region"
      aria-label="Reports list"
    >
      <VList
        v-slot="{ item: request, index }"
        :data="sortedRequests"
        :style="{ height: '100%' }"
      >
        <div
          :key="request.service_request_id"
          :data-index="index"
          :data-report-id="request.service_request_id"
          class="group relative mx-3 mb-3 mt-2 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)] hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-500"
          role="button"
          tabindex="0"
          :aria-label="`Report #${request.service_request_id}: ${request.title || request.service_name}`"
          @click="handleReportSelect(request)"
          @keydown="handleListItemKeydown($event, request, index, sortedRequests, handleReportSelect)"
        >
          <!-- Card content -->
          <div
            class="p-4"
            :class="{ 'opacity-70': request.extended_attributes?.markaspot?.published === false }"
          >
            <!-- Header: ID and Status on one line -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono">
                  #{{ request.service_request_id }}
                </span>
                <!-- Organisation badge(s) (only when showInList is configured and feature enabled) -->
                <template v-if="showInList && organisationsEnabled && (request.organisations?.length || request.organisation?.label)">
                  <UBadge
                    v-for="org in (request.organisations?.length ? request.organisations : (request.organisation ? [request.organisation] : []))"
                    :key="org.id || org.label"
                    color="primary"
                    variant="subtle"
                    size="xs"
                    class="flex items-center gap-1"
                  >
                    <UIcon
                      name="i-heroicons-building-office-2"
                      class="w-3 h-3"
                    />
                    {{ org.label }}
                  </UBadge>
                </template>
                <!-- Jurisdiction badge (only when showInList is configured) -->
                <UBadge
                  v-if="showInList && request.jurisdiction?.label"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  class="flex items-center gap-1"
                >
                  <UIcon
                    name="i-heroicons-map"
                    class="w-3 h-3"
                  />
                  {{ request.jurisdiction.label }}
                </UBadge>
                <!-- Unpublished badge -->
                <UBadge
                  v-if="request.extended_attributes?.markaspot?.published === false"
                  color="warning"
                  variant="subtle"
                  size="xs"
                  class="flex items-center gap-1"
                >
                  <UIcon
                    name="i-heroicons-eye-slash"
                    class="w-3 h-3"
                  />
                  {{ t('list.unpublished') }}
                </UBadge>
                <!-- Sentiment badge -->
                <SentimentBadge
                  v-if="request.extended_attributes?.drupal?.field_sentiment?.[0]?.value"
                  :sentiment="request.extended_attributes.drupal.field_sentiment[0].value"
                  size="xs"
                />
              </div>
              <div
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                :style="{
                  backgroundColor: getStatusHex(request) + '15',
                  color: getStatusHex(request),
                }"
              >
                <div
                  class="w-1.5 h-1.5 rounded-full mr-1"
                  :style="{ backgroundColor: getStatusHex(request) }"
                />
                {{ getStatusDescriptive(request) || request.status }}
              </div>
            </div>

            <!-- Service Name with Icon -->
            <div class="flex items-center gap-3 mb-3">
              <div class="flex-shrink-0">
                <DynamicIcon
                  :icon-name="request.extended_attributes?.markaspot?.category_icon || ''"
                  class-name="w-3 h-3 text-neutral-500 dark:text-neutral-300"
                  :use-nuxt-icon="false"
                />
              </div>
              <h3 class="font-medium text-neutral-900 dark:text-neutral-100 leading-tight flex-1">
                {{ request.service_name }}
              </h3>
            </div>

            <!-- Description -->
            <div
              v-if="request.description"
              class="mb-3 text-sm text-[var(--ui-text-muted)] line-clamp-2 leading-relaxed"
              :title="request.description"
            >
              {{ request.description }}
            </div>

            <!-- Footer: Location and Time -->
            <div class="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
              <UIcon
                name="i-heroicons-map-pin"
                class="w-3.5 h-3.5 mr-1 flex-shrink-0"
              />
              <span class="truncate flex-1 mr-3">{{ request.address_string }}</span>

              <div class="flex items-center flex-shrink-0">
                <UIcon
                  name="i-heroicons-clock"
                  class="w-3.5 h-3.5 mr-1"
                />
                <span>{{ formatTimeAgo(request.requested_datetime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </VList>
    </div>

    <!-- Empty State (when no results) - COMPACT VERSION -->
    <div
      v-show="!requests.length && !isLoading && !hasActiveFilters"
      class="border-t border-[var(--ui-border)] py-4 md:py-3"
    >
      <div class="text-center text-neutral-500 text-sm">
        {{ t("list.no_results") }}
      </div>
    </div>

    <!-- No results due to filtering -->
    <div
      v-show="!requests.length && !isLoading && hasActiveFilters"
      class="border-t border-[var(--ui-border)] py-4 md:py-3"
    >
      <div class="text-center text-neutral-500 text-sm">
        {{ t("list.no_filtered_results") }}
      </div>
    </div>

    <!-- Enhanced Skeleton Loader -->
    <div
      v-show="isLoading || isTransitioning || externalLoading"
      class="flex-1 overflow-hidden"
    >
      <div class="space-y-0">
        <!-- Multiple skeleton items for realistic loading -->
        <div
          v-for="i in 6"
          :key="`skeleton-${i}`"
          :class="[
            'px-6 py-5 border-b border-[var(--ui-border)] animate-pulse',
            `animation-delay-${i * 100}`,
          ]"
        >
          <div class="space-y-2.5">
            <!-- Report title skeleton -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded',
                    i % 3 === 0 ? 'w-48' : i % 3 === 1 ? 'w-52' : 'w-44',
                  ]"
                />
              </div>
            </div>

            <!-- Address and status skeleton -->
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-2 flex-1 min-w-0 mr-4">
                <!-- Status dot -->
                <div class="w-4 h-4 rounded-full bg-neutral-300 dark:bg-neutral-600 flex-shrink-0 mt-0.5" />
                <!-- Address -->
                <div class="space-y-1 flex-1">
                  <div
                    :class="[
                      'h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded',
                      i % 2 === 0 ? 'w-3/4' : 'w-2/3',
                    ]"
                  />
                  <div
                    v-if="i % 3 === 0"
                    class="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/2"
                  />
                </div>
              </div>

              <!-- Status and time skeleton -->
              <div class="text-right flex-shrink-0 space-y-1">
                <div class="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-16" />
                <div class="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-12" />
              </div>
            </div>

            <!-- Description skeleton -->
            <div
              v-if="i % 2 === 0"
              class="flex items-start gap-2"
            >
              <div class="w-4 h-4 bg-neutral-300 dark:bg-neutral-600 rounded flex-shrink-0 mt-0.5" />
              <div
                :class="[
                  'h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded',
                  i % 4 === 0 ? 'w-5/6' : 'w-3/4',
                ]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Line clamp utility for description text */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card hover effects */
.group:hover .group-hover\:shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.dark .group:hover .group-hover\:shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
}

/* Staggered animation delays for skeleton items */
.animation-delay-100 { animation-delay: 100ms; }
.animation-delay-200 { animation-delay: 200ms; }
.animation-delay-300 { animation-delay: 300ms; }
.animation-delay-400 { animation-delay: 400ms; }
.animation-delay-500 { animation-delay: 500ms; }
.animation-delay-600 { animation-delay: 600ms; }

/* Enhanced gradient animation for skeleton items */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.bg-gradient-to-r {
  position: relative;
  overflow: hidden;
}

.bg-gradient-to-r::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

.dark .bg-gradient-to-r::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
}

/* Smooth transitions for content appearance */
.transition-all {
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth card animations */
@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.group {
  animation: cardSlideIn 0.3s ease-out;
}
</style>
