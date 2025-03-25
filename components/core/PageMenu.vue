<template>
  <nav class="border-t border-gray-200 dark:border-gray-700">
    <div v-if="loading" class="flex justify-center items-center py-4">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
    </div>

    <div v-else class="grid grid-cols-2">
      <UButton
        v-for="page in pages"
        :key="page.id"
        @click="handleClick(page)"
        color="gray"
        variant="ghost"
        class="relative h-auto p-4 flex flex-col items-center gap-2 rounded-none hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0"
      >
        <img
          :src="getIconPath(page.attributes.field_page_icon)"
          alt="icon"
          class="w-5 h-5 icon-filter"
        />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ page.attributes.title }}
        </span>
      </UButton>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'


interface Page {
  id: string
  attributes: {
    title: string
    field_page_icon?: string
    body: {
      processed: string
    }
  }
}

const emit = defineEmits<{
  'select-page': [page: Page]
}>()

const { cleanIconName } = useIcons()
const { pages, loading, fetchPages } = usePages()

const getIconPath = (iconName?: string): string => {
  const cleanedName = cleanIconName(iconName || 'question-circle')
  return `/icons/${cleanedName}.svg`
}

const handleClick = (page: Page) => {
  emit('select-page', page)
}

onMounted(async () => {
  await fetchPages()
})
</script>

<style scoped>
.icon-filter {
  filter: brightness(0) invert(0);
}

.dark .icon-filter {
  filter: brightness(0) invert(1) contrast(1.5);
}
</style>
