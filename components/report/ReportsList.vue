<script setup lang="ts">
import { VList } from "virtua/vue";
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const ITEMS_PER_PAGE = 20;

const props = defineProps<{
  requests: Array<any>;
}>();

const emit = defineEmits<{
  "select-report": [{ report: any }];
}>();

const { t } = useI18n();


const sortedRequests = computed(() => {
  return [...props.requests].map(request => {
    
    const statusHex = 
      
      request.status_hex || 
      
      request.extended_attributes?.markaspot?.status_hex || 
      
      '#959595'; 
    
    return {
      ...request,
      status_hex: statusHex
    };
  }).sort((a, b) => {
    const dateA = new Date(a.requested_datetime).getTime();
    const dateB = new Date(b.requested_datetime).getTime();
    return dateB - dateA;
  });
});


const requestsWithoutHex = computed(() =>
  props.requests.filter(req => !req.status_hex)
    .map(req => ({
      id: req.service_request_id,
      status: req.status,
      service_name: req.service_name
    }))
);




watch(() => requestsWithoutHex.value, (requests) => {
  if (requests.length > 0) {
    console.warn('Requests missing status_hex:', requests);
  }
}, { immediate: true });


const handleReportSelect = (report: any) => {
  emit("select-report", { report });
};


const formatTimeAgo = (datetime?: string) => {
  if (!datetime) return "";
  const date = new Date(datetime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return t("time.today");
  if (days === 1) return t("time.yesterday");
  return t("time.days_ago", { count: days });
};
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header with count -->
    <div class="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-500 sticky top-0 z-10">
      <span class="text-gray-600 dark:text-gray-100 text-sm">
        {{ t("list.showing", { visible: sortedRequests.length, total: requests.length }) }}
      </span>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto">
      <VList
        :data="sortedRequests"
        :style="{ height: '800px' }"
        #default="{ item: request, index }"
      >
        <button
          :key="request.service_request_id"
          class="w-full text-left hover:bg-gray-50/50 dark:hover:bg-gray-400/20 transition-all px-6 py-3.5 focus:outline-none focus:bg-gray-500/50 dark:focus:bg-gray-400/20 border-b border-gray-200 dark:border-gray-600"
          @click="handleReportSelect(request)"
        >
          <div class="space-y-1.5">
            <div class="flex items-baseline gap-2">
        <span class="font-medium text-gray-900 dark:text-gray-400">
          #{{ request.service_request_id }} {{ request.service_name }}
        </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  :style="{ backgroundColor: request.status_hex }"
                >
                  <UIcon name="i-heroicons-map-pin" class="w-3 h-3 text-white" />
                </div>
                <span class="text-gray-500">{{ request.address_string }}</span>
              </div>
              <div class="flex items-center gap-1 text-gray-500">
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                <span>{{ formatTimeAgo(request.requested_datetime) }}</span>
              </div>
            </div>
          </div>
        </button>
      </VList>

    </div>

    <!-- Empty State -->
    <div v-if="!requests.length" class="p-6 text-center text-gray-500">
      {{ t("list.no_results") }}
    </div>

    <!-- Loading State -->
    <div v-if="!sortedRequests.length && requests.length" class="p-3 flex justify-center text-gray-400 text-sm">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
      <span class="ml-2">{{ t("common.loading") }}</span>
    </div>
  </div>
</template>
