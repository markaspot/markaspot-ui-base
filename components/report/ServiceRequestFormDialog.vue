<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ClassicReportForm from './ClassicReportForm.vue'

const { t } = useI18n()

const dialogRef = ref<HTMLElement | null>(null)
const dialogId = `dialog-title-${Math.random().toString(36).slice(2)}`
const descriptionId = `dialog-desc-${Math.random().toString(36).slice(2)}`
const previousFocus = ref<HTMLElement | null>(null)


onMounted(() => {
  previousFocus.value = document.activeElement as HTMLElement
  setTimeout(() => {
    show.value = true
    
    nextTick(() => {
      const firstFocusable = dialogRef.value?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    })
  }, 50)
})

const props = defineProps<{
  type: 'photo' | 'classic',
  mapCenter?: {
    lat: number
    lng: number
    address?: string
  }
}>()


const mapCenter = computed(() => ({
  lat: props.mapCenter?.lat,
  lng: props.mapCenter?.lng,
  address: props.mapCenter?.address
}))

const show = ref(false)
onMounted(() => {
  setTimeout(() => {
    show.value = true
  }, 50)
})

const emit = defineEmits<{
  close: []
  success: [response: any]
}>()

const showSuccess = ref(false)
const currentRequestId = ref('')

const handleSuccess = (response?: any) => {
  
  if (response?.attributes) {
    currentRequestId.value = response?.attributes.request_id
    showSuccess.value = true
  } else {
    console.warn('Unexpected response structure:', response)
    currentRequestId.value = 'N/A'
    showSuccess.value = true
  }
}
const resetForm = () => {
  showSuccess.value = false
  currentRequestId.value = ''
}

const formTitle = computed(() =>
  props.type === 'photo' ? t('report.title.photo') : t('report.title.classic')
)

const iconColor = computed(() =>
  props.type === 'photo' ? 'primary' : 'secondary'
)

const iconName = computed(() =>
  props.type === 'photo' ? 'i-heroicons-camera' : 'i-heroicons-document-text'
)
</script>

<template>
  <div
    ref="dialogRef"
    class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
    @click="handleBackdropClick"
    v-show="show"
    :class="{'opacity-0': !show}"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="dialogId"
    :aria-describedby="descriptionId"
    @keydown="handleKeyDown"
    tabindex="-1"
  >

    <!-- Success Toast -->
    <div v-if="showSuccess"
         class="fixed inset-x-0 top-4 mx-auto max-w-xl animate-fade-in"
         @click.stop>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500"/>
          <div>
            <h3 class="font-medium dark:text-gray-100">{{ t('success.report_submitted') }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ t('success.moderation_notice') }}
              <span class="font-medium">{{ currentRequestId }}</span>
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <UButton @click="$emit('close')">{{ t('common.close') }}</UButton>
          <UButton @click="resetForm">{{ t('success.submit_another') }}</UButton>
        </div>
      </div>
    </div>

    <!-- Form Dialog -->
    <div v-show="!showSuccess"
         class="bg-white dark:bg-gray-800 w-full sm:w-[480px] sm:rounded-2xl max-h-[90vh] flex flex-col"
         :class="[show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0']"
         @click.stop>
      <!-- Header -->
      <header class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="bg-primary-600 w-10 h-10 rounded-xl flex items-center justify-center transform hover:scale-105 transition-transform">
            <UIcon :name="iconName" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 class="font-semibold">{{ formTitle }}</h2>
            <div v-if="type === 'photo'" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div class="w-2 h-2 rounded-full bg-primary-500"></div>
              <span>{{ t('report.ai.powered') }}</span>
            </div>
          </div>
        </div>
        <button @click="$emit('close')"
                aria-label="Close"
                class="text-gray-400 hover:text-gray-600 dark:text-gray-100 transform hover:rotate-90 transition-transform">
          <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
        </button>
      </header>

      <!-- Form Content -->
      <main class="h-[calc(100dvh-8rem)] sm:h-auto overflow-y-auto">
        
        <ClassicReportForm
          :map-center="{
            lat: props.mapCenter?.lat,
            lng: props.mapCenter?.lng,
            address: props.mapCenter?.address
          }"
          @success="handleSuccess"
        />

      </main>
    </div>
  </div>
</template>
<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-1rem); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
