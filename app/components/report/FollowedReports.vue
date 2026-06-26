<template>
  <div class="h-full flex flex-col">
    <!-- Header with count and actions - using consistent styling with ReportsList -->
    <div class="px-6 py-3 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <span class="text-neutral-600 dark:text-neutral-100 text-sm">
          {{ t("report.following.count", followedReports.length, { count: followedReports.length }) }}
        </span>
        <button
          v-if="updatedReportsCount > 0"
          class="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          @click="handleMarkAllRead"
        >
          <UIcon
            name="i-heroicons-check-circle"
            class="w-3.5 h-3.5"
          />
          <span>{{ t("report.following.mark_all_read") }}</span>
          <span class="px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
            {{ updatedReportsCount }}
          </span>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- Empty State - consistent with ReportsList styling -->
      <AppEmptyState
        v-if="enhancedFollowedReports.length === 0"
        icon="i-heroicons-star"
        icon-class="w-8 h-8 text-neutral-400"
        :title="t('report.following.no_reports')"
        full-height
        class="p-6"
      />

      <!-- Reports List - using card layout similar to ReportsList -->
      <div
        v-else
        class="pt-2 pb-4"
        role="region"
        aria-label="Followed reports list"
      >
        <div
          v-for="(report, index) in enhancedFollowedReports"
          :key="report.service_request_id"
          class="mb-4"
        >
          <!-- Card -->
          <div
            :data-index="index"
            :data-report-id="report.service_request_id"
            class="group relative mx-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)] hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-500"
            :class="[
              !canClickReport(report) && !report.unavailable ? 'opacity-60 cursor-not-allowed' : '',
              report.unavailable ? 'opacity-50 cursor-not-allowed' : '',
              report.has_update && !report.escalated_to && !report.unavailable
                ? 'ring-2 ring-primary-200 dark:ring-primary-800 bg-primary-50 dark:bg-primary-950/20' : '',
              report.escalated_to
                ? 'ring-2 ring-amber-200 dark:ring-amber-800 bg-amber-50 dark:bg-amber-950/20' : '',
            ]"
            role="button"
            tabindex="0"
            :aria-label="`Followed report #${report.service_request_id}: ${report.service_name}${report.has_update ? ' - Status updated' : ''}`"
            @click="canClickReport(report) && selectReport(report)"
            @keydown="handleListItemKeydown($event, report, index, enhancedFollowedReports, selectReport, canClickReport)"
          >
            <!-- Card content -->
            <div class="p-4">
              <!-- Header: ID and Status badges -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono">
                    #{{ report.service_request_id }}
                  </span>
                  <!-- Organisation badge(s) -->
                  <template v-if="organisationsEnabled && (report.organisations?.length || report.organisation?.label)">
                    <UBadge
                      v-for="org in (report.organisations?.length ? report.organisations : (report.organisation ? [report.organisation] : []))"
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
                  <!-- Jurisdiction badge -->
                  <UBadge
                    v-if="report.jurisdiction?.label"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    class="flex items-center gap-1"
                  >
                    <UIcon
                      name="i-heroicons-map"
                      class="w-3 h-3"
                    />
                    {{ report.jurisdiction.label }}
                  </UBadge>
                  <!-- Escalated badge -->
                  <UBadge
                    v-if="report.escalated_to"
                    color="warning"
                    variant="subtle"
                    size="xs"
                    class="flex items-center gap-1"
                  >
                    <UIcon
                      name="i-heroicons-arrow-up-right"
                      class="w-3 h-3"
                    />
                    {{ t('report.following.escalated_to', { jurisdiction: report.escalated_to.label }) }}
                  </UBadge>
                </div>

                <!-- Status badge -->
                <StatusBadge
                  :label="report.status_descriptive_name || report.status"
                  :color="report.status_hex || '#6B7280'"
                  size="xs"
                />
              </div>

              <!-- Service Name with Icon -->
              <div class="flex items-center gap-3 mb-3">
                <div class="flex-shrink-0">
                  <DynamicIcon
                    :icon-name="report.extended_attributes?.markaspot?.category_icon || ''"
                    class-name="w-4 h-4 text-neutral-500 dark:text-neutral-300"
                    :use-nuxt-icon="false"
                  />
                </div>
                <h3 class="font-medium text-neutral-900 dark:text-neutral-100 leading-tight flex-1">
                  {{ report.service_name }}
                </h3>
              </div>

              <!-- Footer: Location and Time -->
              <div class="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                <UIcon
                  name="i-heroicons-map-pin"
                  class="w-3.5 h-3.5 mr-1 flex-shrink-0"
                />
                <span class="truncate flex-1 mr-3">{{ report.address_string || t('report.following.no_address') }}</span>

                <div class="flex items-center flex-shrink-0">
                  <UIcon
                    name="i-heroicons-clock"
                    class="w-3.5 h-3.5 mr-1"
                  />
                  <span>{{ formatDate(report.updated_datetime || report.requested_datetime || report.followed_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions below card -->
          <div
            v-if="report.has_update || report.escalated_to || report.unavailable || !canClickReport(report)"
            class="mx-3 mt-2 px-4 py-2 flex items-center justify-between text-xs"
          >
            <!-- Update notification, escalated hint, unavailable hint, or awaiting server -->
            <span
              v-if="report.has_update && !report.escalated_to && !report.unavailable"
              class="inline-flex items-center text-primary-600 dark:text-primary-400"
            >
              <UIcon
                name="i-heroicons-bell"
                class="w-3.5 h-3.5 mr-1.5"
              />
              {{ t("report.following.status_updated") }}
            </span>
            <span
              v-else-if="report.escalated_to"
              class="inline-flex items-center text-amber-600 dark:text-amber-400"
            >
              <UIcon
                name="i-heroicons-arrow-up-right"
                class="w-3.5 h-3.5 mr-1.5"
              />
              {{ t("report.following.escalated_click") }}
            </span>
            <span
              v-else-if="report.unavailable"
              class="inline-flex items-center text-red-600 dark:text-red-400"
            >
              <UIcon
                name="i-heroicons-eye-slash"
                class="w-3.5 h-3.5 mr-1.5"
              />
              {{ t("report.following.unavailable") }}
            </span>
            <span
              v-else-if="!canClickReport(report)"
              class="inline-flex items-center text-amber-600 dark:text-amber-400"
            >
              <UIcon
                name="i-heroicons-clock"
                class="w-3.5 h-3.5 mr-1.5"
              />
              {{ t("report.following.awaiting_server") }}
            </span>
            <span v-else />

            <!-- Unfollow action -->
            <button
              class="inline-flex items-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              @click.stop="handleUnfollow(report)"
            >
              <UIcon
                name="i-heroicons-star-solid"
                class="w-3.5 h-3.5 mr-1"
                aria-hidden="true"
              />
              {{ t('detail.follow.stop') }}
            </button>
          </div>

          <!-- Unfollow action when no notification -->
          <div
            v-else
            class="mx-3 mt-2 px-4 py-1 flex justify-end text-xs"
          >
            <button
              class="inline-flex items-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              @click.stop="handleUnfollow(report)"
            >
              <UIcon
                name="i-heroicons-star-solid"
                class="w-3.5 h-3.5 mr-1"
                aria-hidden="true"
              />
              {{ t('detail.follow.stop') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * FollowedReports Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import { useRequestsStore } from '~/stores/requests';
import { useJurisdictions } from '~/composables/core/useJurisdictions';
import { useKeyboardListNavigation } from '@/composables/useKeyboardListNavigation';
import DynamicIcon from '@/components/core/DynamicIcon.vue';
import { NEUTRAL_FALLBACKS } from '~/utils/colorUtils';

const { t } = useI18n();
const { formatDateOnly } = useFormatters();
const requestsStore = useRequestsStore();
const { followedReports, markAllAsRead, startPolling, stopPolling, toggleFollow } = useFollows();
const { buildPath } = useJurisdictions();
const { handleListItemKeydown } = useKeyboardListNavigation();
const { organisationsEnabled } = useFeatureFlags();

// Start polling for updates on mount
onMounted(() => {
    startPolling();
});

// Clean up on unmount
onUnmounted(() => {
    stopPolling();
});

const emit = defineEmits<{
    'select-report': [{ report: any }]
    'update-count': [count: number]
}>();

// Enhance followed reports with full data when available
const enhancedFollowedReports = computed(() => {
    return followedReports.value.map((report) => {
        const fullReport = requestsStore.getRequestById(report.service_request_id);
        if (fullReport) {
            // Use full report data with enhanced status information and datetime fields
            return {
                ...report,
                ...fullReport,
                // Preserve follow-specific metadata
                followed_at: report.followed_at,
                has_update: report.has_update,
                last_known_status: report.last_known_status,
                // Preserve escalation/unavailable state from follows
                escalated_to: report.escalated_to,
                unavailable: report.unavailable,
                // Enhance status display
                status_descriptive_name: fullReport.extended_attributes?.markaspot?.status_descriptive_name || fullReport.status || report.status,
                status_hex: fullReport.extended_attributes?.markaspot?.status_hex || fullReport.status_hex || report.status_hex || NEUTRAL_FALLBACKS.DEFAULT,
                // Use better datetime prioritization
                requested_datetime: fullReport.requested_datetime || report.followed_at,
                updated_datetime: fullReport.updated_datetime
            };
        }
        // Fallback for reports not yet fetched from server
        return {
            ...report,
            status_hex: report.status_hex || NEUTRAL_FALLBACKS.DEFAULT,
            status_descriptive_name: report.status || t('report.following.awaiting_server')
        };
    }).sort((a, b) => {
        // Unavailable reports sort last
        if (a.unavailable && !b.unavailable) return 1;
        if (!a.unavailable && b.unavailable) return -1;

        // Sort by update status first (updated reports at top), then by followed_at time
        if (a.has_update && !b.has_update) return -1;
        if (!a.has_update && b.has_update) return 1;

        const dateA = new Date(a.updated_datetime || a.requested_datetime || a.followed_at).getTime();
        const dateB = new Date(b.updated_datetime || b.requested_datetime || b.followed_at).getTime();
        return dateB - dateA; // Most recent first
    });
});

const updatedReportsCount = computed(() =>
    enhancedFollowedReports.value.filter(report => report.has_update).length
);

// Watch for changes in the updated reports count and notify parent
watch(updatedReportsCount, (newCount) => {
    emit('update-count', newCount);
}, { immediate: true });

// When the component mounts, ensure we emit the initial count
onMounted(() => {
    emit('update-count', updatedReportsCount.value);
});

const canClickReport = (report: any): boolean => {
    // Don't allow clicking if the report is newly created and hasn't been fetched from server
    if (!report) return false;

    // Unavailable reports cannot be clicked
    if (report.unavailable) return false;

    // Escalated reports are clickable (navigate to new jurisdiction)
    if (report.escalated_to) return true;

    // Check if this report is in the requests store (came from server)
    const fromStore = requestsStore.getRequestById(report.service_request_id);

    // A report can be clicked if it either:
    // 1. Exists in the store (came from server) OR
    // 2. Has had an update (was fetched at least once)
    return !!fromStore || report.has_update === true;
};

const selectReport = async (request: any) => {
    // Safety check
    if (!canClickReport(request)) return;

    // Escalated reports: navigate to the new jurisdiction's URL
    if (request.escalated_to?.slug) {
        await navigateTo(buildPath(`/requests/${request.service_request_id}`, request.escalated_to.slug));
        return;
    }

    let fullRequest = requestsStore.getRequestById(request.service_request_id);

    // If not in store (e.g. after jurisdiction escalation), fetch fresh from API
    if (!fullRequest) {
        fullRequest = await requestsStore.fetchRequestById(request.service_request_id);
    }

    if (fullRequest) {
        emit('select-report', { report: fullRequest });
    }
};

const handleMarkAllRead = () => {
    markAllAsRead();
    emit('update-count', 0);
};

const handleUnfollow = (report: any) => {
    // Use toggleFollow to unfollow the report
    const wasUnfollowed = toggleFollow(report);

    // Optional: Show a brief notification or feedback
    if (!wasUnfollowed) {
        console.log(`Unfollowed report #${report.service_request_id}`);
    }
};

const formatDate = (dateStr?: string) => {
    // If no dateStr provided, use current timestamp
    if (!dateStr) {
        dateStr = new Date().toISOString();
    }

    const date = new Date(dateStr);

    // Check if the date is valid, fallback to current time
    if (isNaN(date.getTime())) {
        return formatDate(new Date().toISOString());
    }

    const now = new Date();
    const diffInDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t('report.following.date.today');
    if (diffInDays === 1) return t('report.following.date.yesterday'); // 1 day in the past
    if (diffInDays === -1) return t('report.following.date.tomorrow'); // 1 day in the future

    return formatDateOnly(date);
};
</script>
