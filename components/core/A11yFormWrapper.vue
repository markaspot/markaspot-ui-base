<template>
  <form 
    :id="formId" 
    @submit.prevent="onSubmit"
    :aria-label="title"
    class="space-y-6"
    novalidate
  >
    <fieldset :disabled="loading">
      <legend class="sr-only">{{ title }}</legend>
      
      <!-- Status announcer for screen readers -->
      <div 
        ref="statusAnnouncer"
        aria-live="assertive" 
        class="sr-only"
      >
        <p v-if="loading">{{ loadingMessage || 'Form is processing. Please wait.' }}</p>
        <p v-if="success">{{ successMessage || 'Form has been submitted successfully.' }}</p>
      </div>
      
      <!-- Content -->
      <slot></slot>
      
      <!-- Form actions -->
      <div class="flex justify-end space-x-4 pt-4">
        <slot name="actions">
          <UButton
            v-if="showCancelButton"
            type="button"
            variant="soft"
            color="gray"
            @click="onCancel"
            :disabled="loading"
            class="w-1/2"
          >
            {{ cancelButtonText || 'Cancel' }}
          </UButton>
          
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="loading || !isValid"
            class="w-1/2"
          >
            {{ submitButtonText || 'Submit' }}
          </UButton>
        </slot>
      </div>
    </fieldset>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted, useSlots } from 'vue'
import { useFormAccessibility } from '~/composables/form/useFormAccessibility'

const props = defineProps({
  formId: {
    type: String,
    default: () => `form-${Math.random().toString(36).substring(2, 9)}`
  },
  title: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  success: {
    type: Boolean,
    default: false
  },
  isValid: {
    type: Boolean,
    default: true
  },
  loadingMessage: String,
  successMessage: String,
  submitButtonText: String,
  cancelButtonText: String,
  showCancelButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['submit', 'cancel'])

const slots = useSlots()
const statusAnnouncer = ref<HTMLElement | null>(null)
const { scrollToError } = useFormAccessibility()


const announce = (message: string) => {
  if (statusAnnouncer.value) {
    statusAnnouncer.value.textContent = '';
    // Force browser to acknowledge content change
    setTimeout(() => {
      if (statusAnnouncer.value) {
        statusAnnouncer.value.textContent = message;
      }
    }, 100);
  }
}

const onSubmit = () => {
  if (props.loading) return
  
  // Check for errors and scroll to first error if needed
  const firstError = document.querySelector('[aria-invalid="true"]')
  if (firstError) {
    scrollToError(`#${firstError.id}`)
    announce('Please correct the errors in the form before submitting.')
    return
  }
  
  emit('submit')
}

const onCancel = () => {
  emit('cancel')
}

onMounted(() => {
  
  nextTick(() => {
    const form = document.getElementById(props.formId)
    if (form) {
      const firstInput = form.querySelector('input, select, textarea, button:not([disabled])')
      if (firstInput instanceof HTMLElement) {
        firstInput.focus()
      }
    }
  })
})

defineExpose({ announce })
</script>