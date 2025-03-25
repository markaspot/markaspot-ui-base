<template>
  <div v-if="config">
    <UFormGroup
        :label="config.label"
        :help="config.description"
        :error="error"
        :required="isRequired"
    >
      <UInput
          :id="`email-field-${fieldId}`"
          :model-value="modelValue"
          @update:model-value="handleInput"
          type="email"
          :placeholder="config.widget_settings?.placeholder"
          maxlength="60"
          autocomplete="email"
          :state="error ? 'error' : undefined"
          :aria-required="isRequired"
          :aria-invalid="!!error"
          :aria-describedby="error ? `email-error-${fieldId}` : undefined"
      />
      <template #error>
        <div :id="`email-error-${fieldId}`">{{ error }}</div>
      </template>
    </UFormGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFormSettings } from '~/composables/form/useFormSettings'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'validation': [isValid: boolean]
}>()

const { settings } = useFormSettings()
const error = ref<string | null>(null)

const fieldId = computed(() => Math.random().toString(36).substring(2, 9))

const config = computed(() => settings.value?.fields.field_e_mail)
const isRequired = computed(() => config.value?.required ?? false)

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validate = (value: string) => {
  if (isRequired.value && !value) {
    error.value = config.value?.validation_message || 'Email is required'
    emit('validation', false)
    return false
  }

  if (value && !validateEmail(value)) {
    error.value = 'Invalid email format'
    emit('validation', false)
    return false
  }

  error.value = null
  emit('validation', true)
  return true
}

const handleInput = (value: string) => {
  emit('update:modelValue', value)
  validate(value)
}

watchEffect(() => {
  validate(props.modelValue)
})
</script>
