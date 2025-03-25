<script setup>
import {onMounted} from 'vue'
import {useInfoBlock} from '~/composables/features/useInfoBlock'

const props = defineProps({
  apiEndpoint: {
    type: String,
    required: true,
  },
  title: String,
  showInfo: Boolean,
  showOnFirstVisit: Boolean,
})

const {infoBlock, loading, error, fetchInfoBlock} = useInfoBlock(props.apiEndpoint)

onMounted(fetchInfoBlock)
</script>

<template>
  <div>
    <!-- Skeleton loader -->
    <div v-if="loading" class="mt-4 px-4 space-y-4 animate-pulse">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="text-sm text-red-500">
      {{ error }}
    </div>

    <!-- Info block -->
    <div v-else class="mt-4 px-4 space-y-4 text-sm">
      <div
          v-html="infoBlock?.attributes?.body?.processed"
          class="prose dark:prose-invert prose-sm max-w-none"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.prose) {
  & h2 {
    @apply text-base font-medium mb-2;
  }

  & p {
    @apply mb-3;
  }
}
</style>
