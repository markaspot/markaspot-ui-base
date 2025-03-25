<template>
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
       @click="$emit('close')"
       v-show="show"
       :class="{'opacity-0': !show}"
       aria-modal="true"
       role="dialog">
    <div class="bg-white dark:bg-gray-800 w-full sm:w-[480px] sm:rounded-2xl max-h-[90vh] flex flex-col"
         :class="[show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0']"
         @click.stop>
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div v-if="!title" class="w-10 h-10 rounded-xl flex items-center justify-center transform hover:scale-105 transition-transform"
                 :style="{ backgroundColor: 'rgb(79, 70, 229)' }">  <!-- Default indigo color -->
              <img
                :src="getIconPath(page?.attributes?.field_page_icon)"
                alt="icon"
                class="w-5 h-5 text-white icon-filter"
              />
            </div>
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-gray-200">
                {{ title || page?.attributes?.title }}
              </h2>
            </div>
          </div>
          <button @click="$emit('close')"
                  class="text-gray-400 hover:text-gray-600 dark:text-gray-100 transform hover:rotate-90 transition-transform">
            <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- If we have a slot, render that -->
        <slot>
          <!-- Otherwise, fall back to the old page content -->
          <div class="divide-y divide-gray-100">
            <div class="p-6">
              <div v-if="page?.attributes?.body?.processed"
                  class="prose prose-sm dark:prose-invert max-w-none"
                  v-html="page.attributes.body.processed">
              </div>
              <div v-else class="text-gray-500">No content available</div>
            </div>
          </div>
        </slot>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t flex gap-3 justify-end flex-shrink-0">
        <UButton
          variant="outline"
          @click="$emit('close')"
          class="hover:scale-105 transition-transform"
        >
          {{ t('common.close') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { cleanIconName } = useIcons()

interface Page {
  id: string
  attributes: {
    title: string
    field_page_icon?: string
    body: {
      value: string
      processed: string
      format?: string
    }
  }
}

const props = defineProps<{
  page?: Page
  title?: string
}>()

const show = ref(false)

const getIconPath = (iconName?: string): string => {
  const cleanedName = cleanIconName(iconName || 'question-circle')
  return `/icons/${cleanedName}.svg`
}

onMounted(() => {
  setTimeout(() => {
    show.value = true
  }, 50)
})

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
  border: 1px solid #f3f4f6;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.icon-filter {
  filter: brightness(0) invert(1);
}

.dark .icon-filter {
  filter: brightness(0) invert(1) contrast(1.5);
}

.translate-y-0 {
  transform: translateY(0);
}

.translate-y-4 {
  transform: translateY(1rem);
}

.opacity-0 {
  opacity: 0;
}

.opacity-100 {
  opacity: 1;
}

[v-cloak] {
  display: none;
}
</style>
