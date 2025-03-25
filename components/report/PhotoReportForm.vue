<template>
  <div class="flex flex-col h-full">
    <div ref="scrollContainer" class="flex-1 overflow-y-auto">
      <div class="p-6 space-y-6">
        <!-- Success Message -->
        <div v-if="successMessage"
             class="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded shadow">
          {{ t('success.report_submitted') }}
        </div>
        <!-- Error Messages -->
        <FormErrorDisplay
          v-if="errorState.isVisible"
          :error-state="errorState"
          ref="errorContainer"
          @clear="clearErrorState"
        />

        <form ref="formElement"
              @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Media Upload -->
          <MediaUploadField
            ref="mediaUploadField"
            :uploaded-media="uploadedMedia"
            @update:media="handleMediaUpdate"
            @files-selected="handleFilesSelected"
            :enableAI="isAIEnabled"
            :label="t('report.form.media.label')"
            :upload-text="t('report.form.media.upload.button')"
            :drag-text="t('report.form.media.upload.drag')"
            :restrictions-text="t('report.form.media.upload.restrictions')"
            class="block w-full"
            tabindex="0"
          />

          <!-- AI Processing Status -->
          <div v-if="isAIEnabled && isAIProcessing" class="bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-cpu-chip" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span class="text-sm font-medium text-blue-700 dark:text-blue-400">{{ t('report.ai.analyzing') }}</span>
            </div>
            <div class="mt-3 space-y-2">
              <div v-for="step in processingSteps"
                   :key="step.field"
                   class="flex items-center gap-2 text-sm pl-7">
                <UIcon v-if="step.status === 'pending'"
                       name="i-heroicons-arrow-path"
                       class="w-4 h-4 text-gray-500 dark:text-gray-400 animate-spin" />
                <UIcon v-else
                       name="i-heroicons-check-circle"
                       class="w-4 h-4 text-green-500 dark:text-green-400" />
                <span :class="step.status === 'complete' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'">
                  {{ step.message }}
                </span>
              </div>
            </div>
          </div>

          <BodyField v-model="description" @validation="handleFieldValidation('body', $event)" />
          <CategorySelect v-model="category" @validation="handleFieldValidation('field_category', $event)" />
          <LocationInput
            v-model="location"
            :required="true"
            :map-center="mapCenter"
            :triggered-from-action="true"
          />
          <EmailField
            v-if="hasField('field_e_mail')"
            v-model="email"
            @validation="handleFieldValidation('field_e_mail', $event)"
          />
          <FirstNameField v-if="hasField('field_prename')" v-model="prename" />
          <LastNameField v-if="hasField('field_name')" v-model="name" />
          <PhoneField v-if="hasField('field_phone')" v-model="phone" />
          <GdprField v-model="gdprAccepted" @validation="handleFieldValidation('field_gdpr', $event)" />
        </form>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="p-4 bg-white dark:bg-gray-800 border-t sticky bottom-0">
      <UButton
        type="submit"
        :loading="isSubmitting || isAIProcessing"
        :disabled="!isFormValid || isSubmitting || isAIProcessing"
        @click="handleSubmit"
        block
        size="lg"
      >
        <template #leading>
          <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        </template>
        {{ submitButtonText }}
      </UButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { nextTick, ref, computed, onMounted, watch } from 'vue'
import { extractGeodata } from '~/utils/exif-helper'
import { useI18n } from 'vue-i18n'
import { useRuntimeConfig } from '#app'

const { t } = useI18n()
const { settings } = useFormSettings()
const runtimeConfig = useRuntimeConfig()
const isAIEnabled = computed(() => 
  runtimeConfig.public.clientConfig.features.aiAnalysis === true
)

const mediaUploadField = ref<InstanceType<typeof MediaUploadField> | null>(null)
onMounted(() => {
  nextTick(() => {
    
    mediaUploadField.value?.$el.querySelector('input[type="file"]')?.focus()
  })
})

const fieldValidationStates = ref<Record<string, boolean>>({})

interface ApiError {
  response?: {
    data?: {
      errors?: Array<{
        status?: string
        title?: string
        detail?: string
        source?: {
          pointer?: string
        }
      }>
    }
  }
  message?: string
}

interface Props {
  mapCenter?: {
    lat: number
    lng: number
    address?: string
  }
  geolocatedCoords?: {
    lat: number
    lng: number
  }
  triggeredFromAction?: boolean
}



const ERROR_TRANSLATIONS = {
  'outside our range of activity': 'location_out_of_range',
  'field is required': 'required',
  'invalid format': 'invalid_format'
} as const

const emit = defineEmits<{
  'success': [response: any]  
  close: []
}>()


const props = defineProps<{
  mapCenter?: {
    lat: number
    lng: number
    address?: string
  }
}>()


const scrollContainer = ref<HTMLElement | null>(null)
const errorContainer = ref<HTMLElement | null>(null)
const formElement = ref<HTMLFormElement | null>(null)


const description = ref('')
const category = ref('')
const email = ref('')
const phone = ref('')
const name = ref('')
const prename = ref('')
const gdprAccepted = ref(false)
const uploadedMedia = ref<Array<{ id: string; preview: string; response?: any; isUploading?: boolean }>>([])
const location = ref({ lat: '', lng: '' })
const totalExpectedUploads = ref(0)
const { errorState, processApiErrors, clearErrors: clearErrorState } = useErrorHandler()

// UI state
const isSubmitting = ref(false)
const isAIProcessing = ref(false)
const activeField = ref<string | null>(null)
const processingSteps = ref<Array<{ field: string; status: 'pending' | 'complete'; message: string }>>([])
const successMessage = ref('')

// Composables
const { categories, fetchCategories } = useCategories()
const { createServiceRequest, fetchAIResults } = useServiceRequest()

// Computed properties
const submitButtonText = computed(() => {
  if (isSubmitting.value) return t('report.form.submit.submitting')
  if (isAIProcessing.value) return t('report.form.submit.processing')
  if (!uploadedMedia.value.length) return t('report.form.media.upload.button')
  return t('report.form.submit.button')
})

const typingPlaceholder = computed(() =>
  isAIProcessing.value
    ? t('report.form.description.ai_processing')
    : t('report.form.description.placeholder')
)

const scrollToError = () => {
  nextTick(() => {
    if (errorContainer.value?.$el) {  
      errorContainer.value.$el.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  })
}
const hasField = (fieldName: string) => computed(() =>
  !!settings.value?.fields[fieldName]
)

const resetForm = () => {
  description.value = ''
  uploadedMedia.value = []
  category.value = ''
  email.value = ''
  gdprAccepted.value = false
  location.value = { lat: '', lng: '' }
  processingSteps.value = []
  if (settings.value?.fields) {
    fieldValidationStates.value = Object.entries(settings.value.fields).reduce((acc, [fieldName, config]) => {
      acc[fieldName] = !config.required
      return acc
    }, {} as Record<string, boolean>)
  }
}

const updateProcessingStep = (field: string, status: 'pending' | 'complete', message: string) => {
  const stepIndex = processingSteps.value.findIndex((step) => step.field === field)
  if (stepIndex > -1) {
    processingSteps.value[stepIndex] = { field, status, message }
  } else {
    processingSteps.value.push({ field, status, message })
  }
}

const typeText = async (text: string) => {
  activeField.value = 'description'
  description.value = ''
  for (const char of text) {
    description.value += char
    await new Promise((resolve) => setTimeout(resolve, 1))
  }
  activeField.value = null
}

const handleLocationUpdate = (newLocation: { lat: string | number; lng: string | number }) => {
  location.value = {
    lat: newLocation.lat.toString(),
    lng: newLocation.lng.toString(),
  }
}

const handleMediaUpdate = async (media: Array<{ id: string; preview: string; response?: any; isUploading?: boolean }>) => {
  uploadedMedia.value = media
  const uploadsComplete = media.length === totalExpectedUploads.value &&
    !media.some(m => m.isUploading)

  if (uploadsComplete && !isAIProcessing.value) {
    await runAIAnalysis()
    totalExpectedUploads.value = 0
  }
}

const handleFilesSelected = async (count: number) => {
  totalExpectedUploads.value = uploadedMedia.value.length + count
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

  if (fileInput?.files?.length) {
    updateProcessingStep('location', 'pending', t('report.ai.processing.location'))

    for (const file of Array.from(fileInput.files)) {
      try {
        const exifData = await extractGeodata(file)
        if (exifData?.lat && exifData?.lng) {
          location.value = {
            lat: exifData.lat.toString(),
            lng: exifData.lng.toString()
          }
          updateProcessingStep('location', 'complete',
            `${t('report.ai.processing.location_found')} ${exifData.lat.toFixed(6)}, ${exifData.lng.toFixed(6)}`
          )
          break
        }
      } catch (exifError) {
        console.error('EXIF extraction error:', exifError)
      }
    }
  }
}

const runAIAnalysis = async () => {
  if (isAIProcessing.value) return
  isAIProcessing.value = true
  processingSteps.value = []
  updateProcessingStep('ai_analysis', 'pending', t('report.ai.processing.analyzing'))

  try {
    const mediaIds = uploadedMedia.value
      .filter(media => !media.isUploading && !media.error)
      .map(media => media.id)

    if (!mediaIds.length) {
      throw new Error(t('report.errors.no_media'))
    }

    const aiData = await fetchAIResults(mediaIds)


    if (aiData.category) {
      updateProcessingStep('category', 'pending', t('report.ai.processing.category'))
      await new Promise(resolve => setTimeout(resolve, 500))

      const matchingCategory = categories.value?.find(
        cat => cat.attributes.name.toLowerCase() === aiData.category.toLowerCase()
      )

      if (matchingCategory) {
        category.value = matchingCategory.id
        
        handleFieldValidation('field_category', true)
        updateProcessingStep('category', 'complete',
          `${t('report.ai.processing.category_found')}: ${aiData.category}`
        )
      }
    }

    if (aiData.description_de) {
      updateProcessingStep('description', 'pending', t('report.ai.processing.description'))
      await typeText(aiData.description_de)
      updateProcessingStep('description', 'complete', t('report.ai.processing.description_complete'))
    }

    if (!location.value.lat && !location.value.lng && geo_data?.lat && geo_data?.lng) {
      updateProcessingStep('location', 'pending', t('report.ai.processing.location_ai'))
      await new Promise(resolve => setTimeout(resolve, 300))

      location.value = {
        lat: geo_data.lat.toString(),
        lng: geo_data.lng.toString()
      }
      updateProcessingStep('location', 'complete', t('report.ai.processing.location_complete'))
    }

    updateProcessingStep('ai_analysis', 'complete', t('report.ai.processing.complete'))
  } catch (error) {
    const message = error instanceof Error ? error.message : t('report.errors.ai_processing')
    processingSteps.value.push({ field: 'error', status: 'complete', message })
  } finally {
    isAIProcessing.value = false
  }
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    clearErrorState()
    successMessage.value = ''

    const requestData = {
      title: `Photo Report ${new Date().toISOString()}`,
      body: { value: description.value, format: 'plain_text' },
      field_e_mail: email.value,
      field_gdpr: gdprAccepted.value,
      field_geolocation: location.value,
      field_category: category.value,
      field_request_media: uploadedMedia.value.map(media => media.id),
    }

    const response = await createServiceRequest(requestData)
    emit('success', response)
    resetForm()

  } catch (error) {
    processApiErrors(error)  
    scrollToError()         
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  
  if (props.mapCenter?.lat !== undefined && props.mapCenter?.lng !== undefined) {
    location.value = {
      lat: props.mapCenter.lat.toString(),
      lng: props.mapCenter.lng.toString()
    }
  }
})


onMounted(async () => {
  await fetchCategories()
  if (settings.value?.fields) {
    fieldValidationStates.value = Object.entries(settings.value.fields).reduce((acc, [fieldName, config]) => {
      acc[fieldName] = !config.required 
      return acc
    }, {} as Record<string, boolean>)
  }
})


const isFormValid = computed(() =>
  Object.entries(fieldValidationStates.value).every(([fieldName, isValid]) => {
    const fieldConfig = settings.value?.fields[fieldName]
    return !fieldConfig?.required || isValid
  })
)


const handleFieldValidation = (fieldName: string, isValid: boolean) => {
  fieldValidationStates.value[fieldName] = isValid
}


watch(
  () => props.mapCenter,
  (newMapCenter) => {
    if (newMapCenter) {
      
    }
  },
  { immediate: true }
);


watch(() => uploadedMedia.value,
  async (newMedia) => {
    const allUploadsComplete = newMedia.length > 0 &&
      !newMedia.some(media => media.isUploading || media.error);

    if (allUploadsComplete && !isAIProcessing.value) {
      await runAIAnalysis();
    }
  },
  { deep: true }
);
</script>

<style scoped>
.min-h-[100dvh] {
  min-height: 100dvh;
  min-height: 100vh; }

.max-h-[100dvh] {
  max-height: 100dvh;
  max-height: 100vh; }

.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: none;
}

.sticky {
  position: -webkit-sticky;
  position: sticky;
}

button {
  -webkit-tap-highlight-color: transparent;
}

.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
