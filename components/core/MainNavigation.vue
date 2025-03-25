<template>
  <div class="flex flex-col h-full">
    <HeaderLogo @header-height-change="onHeaderHeightChange"/>
    <div class="px-4 py-2 text-gray-800 dark:text-gray-100 border-b bg-primary-200 dark:bg-primary-900 flex-shrink-0">
      <div role="tablist" aria-label="Content sections" class="flex justify-between items-center">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          role="tab"
          :id="`tab-${tab.id}`"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`panel-${tab.id}`"
          class="text-gray-600 dark:text-gray-100 hover:text-gray-900 flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-sm relative"
          :class="{
            'text-gray-900 dark:text-white bg-white dark:bg-gray-600 shadow-sm':
              activeTab === tab.id,
          }"
          @click="setActiveTab(tab.id)"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" aria-hidden="true" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.id === 'following' && updateCount > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
            aria-live="polite"
          >
            {{ updateCount }}
          </span>
        </button>
      </div>
    </div>

    <div class="flex-1 relative">
      <div
        v-show="activeTab === 'list'"
        id="panel-list"
        role="tabpanel"
        aria-labelledby="tab-list"
        class="absolute inset-0 flex flex-col"
      >
        <ReportsList :requests="requests" @select-report="$emit('select-report', $event)" />
      </div>

      <div
        v-show="activeTab === 'info'"
        id="panel-info"
        role="tabpanel"
        aria-labelledby="tab-info"
        class="absolute inset-0"
      >
        <div class="h-full overflow-y-auto scrollbar-hide">
          <div class="bg-white/95 dark:bg-gray-800/95 p-4">
            <InfoBlock
              apiEndpoint="/jsonapi/block_content/mas_custom"
              :showInfo="showInfo"
              :showOnFirstVisit="showOnFirstVisit"
            />
          </div>
        </div>
      </div>

      <div
        v-show="activeTab === 'following'"
        id="panel-following"
        role="tabpanel"
        aria-labelledby="tab-following"
        class="absolute inset-0"
      >
        <div class="h-full overflow-y-auto scrollbar-hide">
          <div class="bg-white/95 dark:bg-gray-800/95">
            <FollowedReports
              @select-report="$emit('select-report', $event)"
              @update-count="updateCountValue = $event"
            />
          </div>
        </div>
      </div>

      <div
        v-show="activeTab === 'stats'"
        id="panel-stats"
        role="tabpanel"
        aria-labelledby="tab-stats"
        class="absolute inset-0"
      >
        <div class="h-full overflow-y-auto scrollbar-hide">
          <div class="bg-white/95 dark:bg-gray-800/95">
            <EnhancedStats />
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'info'" class="border-t mt-auto flex-shrink-0">
      <PageMenu @select-page="$emit('select-page', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";


const { t } = useI18n();
const { startPolling, stopPolling } = useFollows();

const props = defineProps<{
  requests: Array<any>;
}>();

const emit = defineEmits<{
  "select-report": [report: any];
  "select-page": [page: any];
  "header-height-change": [height: number];
}>();


const onHeaderHeightChange = (height: number) => {
  emit("header-height-change", height);
};

const showInfo = ref(false);
const showOnFirstVisit = ref(false);
const activeTab = ref("list");
const updateCountValue = ref(0);

const updateCount = computed(() => updateCountValue.value);

const tabs = computed(() => [
  {
    id: "info",
    icon: "i-heroicons-information-circle",
    label: t("navigation.tabs.info.label"),
  },
  {
    id: "list",
    icon: "i-heroicons-list-bullet",
    label: t("navigation.tabs.list.label"),
  },
  {
    id: "following",
    icon: "i-heroicons-star",
    label: t("navigation.tabs.following.label"),
  },
  {
    id: "stats",
    icon: "i-heroicons-chart-pie",
    label: t("navigation.tabs.stats.label"),
  },
]);

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId;
  if (tabId === "info" && !localStorage.getItem("hasSeenInfo")) {
    localStorage.setItem("hasSeenInfo", "true");
  }
};

onMounted(() => {
  startPolling();
  const hasSeenInfo = localStorage.getItem("hasSeenInfo");
  if (!hasSeenInfo) {
    showInfo.value = true;
    showOnFirstVisit.value = true;
    activeTab.value = "info";
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>
