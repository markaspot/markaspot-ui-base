<template>
  <div v-if="config">
    <UFormGroup :label="config.label" :help="config.description" :error="error">
      <UInput
          :model-value="modelValue"
          @update:model-value="handleInput"
          :placeholder="config.widget_settings?.placeholder"
          :size="config.widget_settings?.size"
          :state="error ? 'error' : undefined"
      />
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

const config = computed(() => settings.value?.fields.field_phone)
const isRequired = computed(() => config.value?.required ?? false)

const validate = (value: string) => {
  if (isRequired.value && !value?.trim()) {
    error.value = config.value?.validation_message || `${config.value?.label} is required`
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