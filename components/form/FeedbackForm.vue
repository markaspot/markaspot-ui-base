<template>
  <div v-if="!isFeedbackEnabled" class="feedback-form p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <div class="mb-4 p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded flex items-center gap-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 flex-shrink-0" />
      <span>{{ $t('feedback.disabled') || 'Feedback feature is currently disabled' }}</span>
    </div>
  </div>
  <div v-else class="feedback-form p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">

    <div v-if="error" class="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded flex items-center gap-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 flex-shrink-0" />
      <span>{{ error }}</span>
    </div>

    <div v-if="!serviceRequest && !loading && !error" class="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded flex items-center gap-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 flex-shrink-0" />
      <span>{{ $t('feedback.invalid_request') || 'Ungültige oder abgelaufene Serviceanfrage' }}</span>
    </div>
    
    <div v-else-if="serviceRequest && !serviceRequest.id && !loading && !error" class="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded flex items-center gap-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 flex-shrink-0" />
      <span>Fehler beim Laden des Service-Requests: Keine gültige ID gefunden</span>
    </div>

    <div v-else-if="hasSubmitted" class="text-center py-6">
      <div class="mb-4 text-green-600 dark:text-green-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{{ $t('feedback.thank_you') || 'Thank you for your feedback!' }}</h2>
      <p class="text-gray-700 dark:text-gray-300">{{ $t('feedback.submission_received') || 'Your feedback has been received.' }}</p>
      <div class="mt-6">
        <UButton @click="emit('success')" variant="outline">
          {{ $t('common.close') || 'Close' }}
        </UButton>
      </div>
    </div>

    <div v-else-if="loading" class="py-6 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      <p class="mt-2 text-gray-700 dark:text-gray-300">{{ $t('feedback.loading') || 'Loading...' }}</p>
    </div>

    <form v-else-if="serviceRequest && serviceRequest.id && !existingFeedback" @submit.prevent="submitForm">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        {{ $t('feedback.title', { service: getServiceRequestTitle() }) || 'Provide Feedback' }}
      </h2>

      <div class="mb-4">
        <label for="feedback" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('feedback.description') || 'Your Feedback' }}
        </label>
        <AutoResizeTextarea
          id="feedback"
          v-model="formData.feedback"
          :placeholder="$t('feedback.placeholder') || 'Please enter your feedback here...'"
          class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          :class="{'border-red-500 dark:border-red-400': validationErrors && validationErrors.feedback}"
          rows="4"
          :disabled="formSubmitting"
          :aria-describedby="validationErrors && validationErrors.feedback ? 'feedback-error' : undefined"
        />
        <p v-if="validationErrors && validationErrors.feedback" id="feedback-error" class="mt-1 text-sm text-red-600">
          {{ validationErrors.feedback }}
        </p>
      </div>

      <div class="mb-6">
        <label class="inline-flex items-center">
          <input
            type="checkbox"
            v-model="formData.set_status"
            class="h-4 w-4 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600"
            :disabled="formSubmitting"
          />
          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {{ $t('feedback.reopen_request') || 'Request to reopen this case' }}
          </span>
        </label>
      </div>

      <div v-if="submissionError" class="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded">
        {{ submissionError }}
      </div>
      
      <div class="flex justify-end">
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          :disabled="formSubmitting"
        >
          <span v-if="formSubmitting">{{ $t('feedback.submitting') || 'Submitting...' }}</span>
          <span v-else>{{ $t('feedback.submit') || 'Submit' }}</span>
        </button>
      </div>
    </form>

    <div v-else-if="existingFeedback && typeof existingFeedback === 'string'" class="py-4">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        {{ $t('feedback.existing_title', { service: getServiceRequestTitle() }) || 'Your Previous Feedback' }}
      </h2>
      <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-md mb-4">
        <p class="whitespace-pre-line text-gray-800 dark:text-gray-200">{{ existingFeedback }}</p>
      </div>
      <div class="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md flex items-center gap-2">
        <UIcon name="i-heroicons-information-circle" class="w-5 h-5 flex-shrink-0" />
        <p>{{ $t('feedback.already_submitted') || 'You have already submitted feedback for this request.' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useFeedback } from '~/composables/features/useFeedback'
import AutoResizeTextarea from '~/components/form/AutoResizeTextarea.vue'
import { useRuntimeConfig } from '#app'


interface FeedbackData {
  feedback: string
  set_status: boolean
  uuid: string
}

const props = defineProps<{
  uuid: string
  feedbackEditable?: boolean
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'error', message: string): void
  (e: 'mounted'): void
}>()

const { loading, feedback: existingFeedback, hasSubmitted, submissionError, getServiceRequest, submitFeedback } = useFeedback()


const validationErrors = ref<{ feedback?: string }>({})

const setError = (field: string, message: string) => {
  validationErrors.value = { ...validationErrors.value, [field]: message }
}

const clearErrors = () => {
  validationErrors.value = {}
}


const handleSubmitSuccess = () => {
  
}

const handleSubmitError = () => {
  
}

const serviceRequest = ref<any>(null)
const formSubmitting = ref(false)
const error = ref<string | null>(null)
const runtimeConfig = useRuntimeConfig()
const isFeedbackEnabled = computed(() => 
  runtimeConfig.public.clientConfig.features.feedback === true
)

const formData = ref<FeedbackData>({
  feedback: '',
  set_status: false,
  uuid: props.uuid
})

onMounted(async () => {
  if (!isFeedbackEnabled.value) {
    error.value = 'Feedback feature is currently disabled'
    emit('error', error.value)
    return
  }
  if (!props.uuid) {
    const errorMessage = 'Missing UUID parameter'
    error.value = errorMessage
    emit('error', errorMessage)
    return
  }

  try {
    loading.value = true
    error.value = null
    
    const result = await getServiceRequest(props.uuid)
    
    
    if (!result) {
      error.value = 'Service request not found or invalid UUID'
      emit('error', error.value)
      return
    }
    
    
    try {
      if (result && result.data && result.data.length > 0) {
        serviceRequest.value = result.data[0]
        
        
        if (!serviceRequest.value.id && !serviceRequest.value.nid) {
          error.value = 'Invalid service request data - missing ID'
          emit('error', error.value)
        }
      } else {
        
        error.value = 'Service request format unrecognized'
        emit('error', error.value)
        return
      } 
    } catch (e) {
      
      error.value = 'Error processing service request data'
      emit('error', error.value)
      return
    }
    
    
    if (existingFeedback.value) {
      formData.value.feedback = existingFeedback.value
    }
    
  } catch (err) {
    const errorMessage = submissionError.value || 'Failed to load service request'
    error.value = errorMessage
    emit('error', errorMessage)
  } finally {
    loading.value = false
  }
})

const validateForm = () => {
  clearErrors()
  let isValid = true

  if (!formData.value.feedback || formData.value.feedback.trim().length < 5) {
    setError('feedback', 'Please provide meaningful feedback (at least 5 characters)')
    isValid = false
  }

  return isValid
}

const getServiceRequestTitle = () => {
  try {
    if (!serviceRequest.value) return 'Service Request'
    
    
    if (serviceRequest.value.attributes?.title) {
      return serviceRequest.value.attributes.title
    } else if (serviceRequest.value.title) {
      return serviceRequest.value.title
    } else if (typeof serviceRequest.value === 'object') {
      
      try {
        const values = Object.values(serviceRequest.value).filter(val => val !== null && val !== undefined)
        const possibleTitle = values.find(val => 
          typeof val === 'string' && (val.includes('#') || val.includes('Service Request'))
        )
        if (possibleTitle) return possibleTitle
      } catch (e) {
        console.error('Error extracting title from object values:', e)
      }
    }
    
    
    try {
      return '#' + (
        (serviceRequest.value && serviceRequest.value.id) || 
        (serviceRequest.value && serviceRequest.value.nid) || 
        'Unknown'
      )
    } catch (e) {
      console.error('Error accessing id/nid properties:', e)
      return 'Service Request'
    }
  } catch (e) {
    console.error('Error in getServiceRequestTitle:', e)
    return 'Service Request'
  }
}

const submitForm = async () => {
  if (!validateForm()) {
    handleSubmitError()
    return
  }

  formSubmitting.value = true
  
  try {
    const success = await submitFeedback(formData.value)
    
    if (success) {
      handleSubmitSuccess()
      emit('success')
    }
  } catch (err) {
    const errorMessage = submissionError.value || 'Failed to submit feedback'
    error.value = errorMessage
    emit('error', errorMessage)
    handleSubmitError()
  } finally {
    formSubmitting.value = false
  }
}
</script>