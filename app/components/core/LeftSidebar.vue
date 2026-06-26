// components/LeftSidebar.vue

<template>
  <nav
    :style="{ width: sidebarWidth }"
    class="bg-[var(--ui-bg)] h-screen"
    :aria-label="$t('navigation.main')"
    :inert="modalOpen || undefined"
  >
    <MainNavigation
      :requests="requests"
      :store-total="storeTotal"
      :global-total="globalTotal"
      :filter-stats="filterStats"
      :shared-filter-system="sharedFilterSystem"
      :search-system="searchSystem"
      :modal-open="modalOpen"
      @select-report="$emit('select-report', $event)"
      @select-page="$emit('select-page', $event)"
      @add-report="$emit('add-report', $event)"
      @fit-bounds="$emit('fit-bounds')"
    />
  </nav>
</template>

<script setup lang="ts">
/**
 * LeftSidebar Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';
import { useRuntimeConfig } from '#app';

const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const { clientConfig } = useMarkASpotConfig();
const { updateCount, loadFollowedReports } = useFollows();

// Get sidebar width from config - dynamic config from API takes priority
const sidebarWidth = computed(() => {
    return clientConfig.value?.theme?.ui?.leftSidebar?.width ||
      runtimeConfig.public.clientConfig.theme?.ui?.leftSidebar?.width || '320px';
});

// Props for the component
const showInfo = ref(false);

const props = defineProps<{
    requests: Array<any>
    storeTotal: number
    globalTotal?: number | null
    filterStats?: { total: number, filtered: number, hiddenByFilters: number, filterCount: number, boundsActive?: boolean }
    sharedFilterSystem: any
    searchSystem?: any
    modalOpen?: boolean
}>();

const emit = defineEmits<{
    'select-page': [page: any]
    'select-report': [report: any]
    /** Issue #404: Info-tab shortcut requested a new report (photo or classic). */
    'add-report': [type: 'photo' | 'classic']
    /** Issue #404: Info-tab "Explore" shortcut: fit map to all requests. */
    'fit-bounds': []
}>();

const tabs = computed(() => [
    { id: 'info', icon: 'i-heroicons-information-circle', label: t('navigation.tabs.info.label') },
    { id: 'list', icon: 'i-heroicons-list-bullet', label: t('navigation.tabs.list.label') },
    { id: 'following', icon: 'i-heroicons-star', label: t('navigation.tabs.following.label') },
    { id: 'stats', icon: 'i-heroicons-chart-pie', label: t('navigation.tabs.stats.label') }
]);

const activeTab = ref('list');

const openReportsCount = computed(() =>
    props.requests.filter(r => r.status === 'open').length
);

// Simplified tab handling
const setActiveTab = (tabId: string) => {
    activeTab.value = tabId;
};

// Check local storage for `hasSeenInfo`
onMounted(() => {
    const hasSeenInfo = localStorage.getItem('hasSeenInfo');
    if (!hasSeenInfo) {
        activeTab.value = 'info'; // Show the Info tab on first visit
    }
});

// Mark Info as seen and switch to the List tab
const handleDontShowAgain = () => {
    activeTab.value = 'list';
    localStorage.setItem('hasSeenInfo', 'true');
};
</script>

<style scoped>
.h-screen {
  height: 100vh;
  height: 100dvh;
}

/* Hide scrollbars while keeping functionality */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}

/* Optimize touch scrolling */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

/* Maintain stacking context */
.z-30 { z-index: 30; }

/* Establish stacking context */
.relative {
  isolation: isolate;
}

/* Blur effect */
.bg-white\/95,
.dark .bg-neutral-800\/95 {
  backdrop-filter: blur(8px);
}
</style>
