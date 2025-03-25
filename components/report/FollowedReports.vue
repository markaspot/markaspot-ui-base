<template>
  <div class="h-full flex flex-col">
    <div class="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-500 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <span class="text-gray-600 dark:text-gray-100 text-sm">
          {{ t("report.following.count", { count: followedReports.length }) }}
        </span>
        <button
          v-if="updatedReportsCount > 0"
          @click="handleMarkAllRead"
          class="text-xs text-gray-600 hover:text-blue-700 dark:text-blue-400"
        >
          {{ t("report.following.mark_all_read") }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="followedReports.length === 0" class="flex flex-col items-center justify-center h-full p-6 text-gray-500">
        <UIcon name="i-heroicons-star" class="w-8 h-8 mb-2" />
        <p>{{ t("report.following.no_reports") }}</p>
      </div>

      <div v-else class="divide-y divide-gray-100 dark:divide-gray-600">
        <button
          v-for="report in followedReports"
          :key="report.service_request_id"
          class="w-full text-left hover:bg-gray-50/50 dark:hover:bg-gray-400/20 transition-all px-6 py-3.5 focus:outline-none focus:bg-gray-50/50"
          @click="selectReport(report)"
        >
          <div class="space-y-1.5">
            <div class="flex items-baseline justify-between">
              <span class="font-medium text-gray-900 dark:text-gray-400">
                #{{ report.service_request_id }} {{ report.service_name }}
              </span>
              <span
                v-if="report.has_update"
                class="px-4 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full"
              >
                {{ t("report.following.status_updated") }}
              </span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  :style="{ backgroundColor: report.status_hex }"
                >
                  <UIcon name="i-heroicons-map-pin" class="w-3 h-3 text-white" />
                </div>
                <span class="text-gray-500">{{ report.address_string }}</span>
              </div>
              <div class="flex items-center gap-1 text-gray-500">
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                <span>{{ formatDate(report.followed_at) }}</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRequestsStore } from "~/stores/requests";
import { useI18n } from "vue-i18n";
import { computed, watch } from 'vue';

const { t } = useI18n();
const requestsStore = useRequestsStore();
const { followedReports, markAllAsRead } = useFollows();

const emit = defineEmits<{
  "select-report": [{ report: any }];
  "update-count": [count: number];
}>();

const updatedReportsCount = computed(() =>
  followedReports.value.filter(report => report.has_update).length
);

watch(updatedReportsCount, (newCount) => {
  emit('update-count', newCount);
});

const selectReport = (request: any) => {
  const fullRequest = requestsStore.getRequestById(request.service_request_id) || request;
  emit("select-report", { report: fullRequest });
};

const handleMarkAllRead = () => {
  markAllAsRead();
  emit('update-count', 0);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return t("report.following.date.today");
  if (diffInDays === 1) return t("report.following.date.tomorrow");
  if (diffInDays === -1) return t("report.following.date.yesterday");

  let locale = t("locale.code") || "en-US";
  if (typeof locale !== "string" || !locale.match(/^[a-z]{2}-[A-Z]{2}$/)) {
    locale = "en-US";
  }

  try {
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};
</script>
