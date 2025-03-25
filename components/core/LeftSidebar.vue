
<template>
  <nav class="w-96 bg-white dark:bg-gray-800 h-screen" aria-label="Main navigation">
    <MainNavigation
        :requests="requests"
        @select-report="$emit('select-report', $event)"
        @select-page="$emit('select-page', $event)"
    />
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFollows } from '~/composables/features/useFollows'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { updateCount, loadFollowedReports } = useFollows()


const showInfo = ref(false)

const props = defineProps<{
  requests: Array<any>
}>()

const emit = defineEmits<{
  'select-page': [page: any],
  'select-report': [report: any]
}>()

const tabs = computed(() => [
  { id: 'info', icon: 'i-heroicons-information-circle', label: t('navigation.tabs.info.label') },
  { id: 'list', icon: 'i-heroicons-list-bullet', label: t('navigation.tabs.list.label') },
  { id: 'following', icon: 'i-heroicons-star', label: t('navigation.tabs.following.label') },
  { id: 'stats', icon: 'i-heroicons-chart-pie', label: t('navigation.tabs.stats.label') }
])

const activeTab = ref('list')

const openReportsCount = computed(() =>
  props.requests.filter(r => r.status === 'open').length
)


const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}


onMounted(() => {
  const hasSeenInfo = localStorage.getItem('hasSeenInfo')
  if (!hasSeenInfo) {
    activeTab.value = 'info' 
  }
})


const handleDontShowAgain = () => {
  activeTab.value = 'list'
  localStorage.setItem('hasSeenInfo', 'true')
}
</script>

<style scoped>
.h-screen {
  height: 100vh;
  height: 100dvh;
}

.scrollbar-hide {
  -ms-overflow-style: none;    scrollbar-width: none;  }

.scrollbar-hide::-webkit-scrollbar {
  display: none;  }

.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

.z-30 { z-index: 30; }

.relative {
  isolation: isolate;
}

.bg-white\/95,
.dark .bg-gray-800\/95 {
  backdrop-filter: blur(8px);
}
</style>
