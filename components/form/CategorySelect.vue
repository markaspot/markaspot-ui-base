# components/form/CategorySelect.vue
<template>
  <div>
    <UFormGroup
      :label="config?.label || t('report.form.category.label')"
      :error="error"
      :required="isRequired"
    >
      <USelect
        v-model="selectedCategory"
        :id="`category-field-${fieldId}`"
        :options="selectOptions"
        :loading="loading"
        :disabled="loading"
        :placeholder="config?.widget_settings?.placeholder || t('report.form.category.placeholder')"
        :state="error ? 'error' : undefined"
        :searchable="true"
        class="category-select"
        :aria-required="isRequired"
        :aria-invalid="!!error"
        :aria-describedby="error ? `category-error-${fieldId}` : undefined"
        :aria-label="config?.label || t('report.form.category.label')"
        role="combobox"
      >
        <template #empty>
          <span class="text-gray-500">{{ t('report.form.category.empty') }}</span>
        </template>
        <template #loading>
          <span class="text-gray-500">{{ t('report.form.category.loading') }}</span>
        </template>
      </USelect>
      
      <template #error>
        <div :id="`category-error-${fieldId}`">{{ error }}</div>
      </template>
    </UFormGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFormSettings } from '~/composables/form/useFormSettings'
import { useI18n } from 'vue-i18n'
import { useCategories } from '~/composables/features/useCategories'

const { t } = useI18n()
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'validation': [isValid: boolean]
}>()

const error = ref<string | null>(null)
const { settings } = useFormSettings()
const { loading, categoryOptions, fetchCategories } = useCategories()

const fieldId = computed(() => Math.random().toString(36).substring(2, 9))

const config = computed(() => settings.value?.fields.field_category)
const isRequired = computed(() => config.value?.required ?? false)


const selectOptions = computed(() => {
  
  return [
    { label: t('report.form.category.placeholder'), value: '' },
    ...categoryOptions.value
  ]
})

// Handle v-model
const selectedCategory = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
    validate(value)
  }
})


const validate = (value: string) => {
  if (isRequired.value && !value) {
    error.value = t('common.required')
    emit('validation', false)
    return false
  }
  error.value = null
  emit('validation', true)
  return true
}


onMounted(async () => {
  await fetchCategories()
})
</script>
