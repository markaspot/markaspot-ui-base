<template>
  <div>
    <UFormField
      :label="displayLabel"
      :description="displayHelp"
      :error="error"
      :required="isRequired"
    >
      <AppInput
        size="md"
        :model-value="modelValue"
        :placeholder="displayPlaceholder"
        maxlength="60"
        autocomplete="family-name"
        class="w-full max-w-md"
        @update:model-value="handleInput"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
/**
 * LastNameField Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';

const props = defineProps<{
    modelValue: string
    hasInteracted?: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'validation': [isValid: boolean]
}>();

const { t } = useI18n();
const { settings } = useFormSettings();
const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted || false);

// Use the field config from the API directly
const fieldName = 'field_name'; // The expected field name in the API
const { getFieldConfig } = useFormSettings();
const config = getFieldConfig(fieldName);
const isRequired = computed(() => config.value?.required ?? false);

// Prioritize i18n over config
const displayLabel = computed(() => t('form.last_name') || config.value?.label || 'Last Name');
const displayHelp = computed(() => t('form.last_name_description') || config.value?.description || null);
const displayPlaceholder = computed(() => t('form.last_name_placeholder') || config.value?.widget_settings?.placeholder || 'Enter last name');

const validate = (value: string) => {
    const isValid = !(isRequired.value && !value?.trim());

    // Only show errors if user has interacted with the field
    if (!isValid && hasUserInteracted.value) {
        error.value = t('validation.last_name_required') ||
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
