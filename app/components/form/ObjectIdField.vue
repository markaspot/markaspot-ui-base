<template>
  <div v-if="config && FEATURE_OBJECT_ID">
    <UFormField
      :label="displayLabel"
      :description="displayHelp"
      :error="error"
    >
      <template #label>
        {{ displayLabel }} <span
          v-if="isRequired"
          class="text-red-500"
        >*</span>
      </template>
      <AppInput
        :id="`object-id-field-${fieldId}`"
        size="md"
        :model-value="modelValue"
        type="text"
        :placeholder="displayPlaceholder"
        maxlength="255"
        :state="error ? 'error' : undefined"
        :aria-required="isRequired"
        :aria-invalid="!!error"
        :aria-describedby="error ? `object-id-error-${fieldId}` : undefined"
        class="w-full max-w-md"
        @update:model-value="handleInput"
      />
      <template #error>
        <div :id="`object-id-error-${fieldId}`">
          {{ error }}
        </div>
      </template>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
/**
 * ObjectIdField Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';
// Build-time feature flag
const FEATURE_OBJECT_ID = __FEATURE_OBJECT_ID__;

const { t } = useI18n();
// Use Nuxt UI theming (color="primary") instead of custom UI classes

const props = defineProps<{
    modelValue: string
    hasInteracted?: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'validation': [isValid: boolean]
}>();

const { settings } = useFormSettings();
const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted || false);
// Unique ID for ARIA
const fieldId = computed(() => Math.random().toString(36).substring(2, 9));

// Use the field config from the API directly
const fieldName = 'field_object_id'; // The expected field name in the API
const { getFieldConfig } = useFormSettings();
const config = getFieldConfig(fieldName);
const isRequired = computed(() => config.value?.required ?? false);

// Prioritize i18n over config
const displayLabel = computed(() => t('form.object_id') || config.value?.label || 'Object ID');
const displayHelp = computed(() => t('form.object_id_description') || config.value?.description || null);
const displayPlaceholder = computed(() => t('form.object_id_placeholder') || config.value?.widget_settings?.placeholder || 'Enter object ID');

const validate = (value: string) => {
    const isValid = !(isRequired.value && !value?.trim());

    // Only show errors if user has interacted with the field
    if (!isValid && hasUserInteracted.value) {
        error.value = t('validation.object_id_required') ||
          t('validation.required_field', { field: displayLabel.value }) ||
          config.value?.validation_message ||
          'This field is required';
    } else {
        error.value = null;
    }

    emit('validation', isValid);
    return isValid;
};

const handleInput = (value: string) => {
    hasUserInteracted.value = true; // Mark as interacted when user types
    emit('update:modelValue', value);
    validate(value);
};

// Watch for external changes to hasInteracted
watch(() => props.hasInteracted, (newValue) => {
    if (newValue) {
        hasUserInteracted.value = true;
        validate(props.modelValue);
    }
});

// Watch for value changes and validate
watch(() => props.modelValue, (newValue) => {
    validate(newValue);
});
</script>
