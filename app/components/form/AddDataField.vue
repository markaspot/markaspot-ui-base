<template>
  <div v-if="config">
    <UFormField
      :error="error"
      :required="isRequired"
    >
      <UCheckbox
        :id="`add-data-field-${fieldId}`"
        :model-value="modelValue"
        :required="isRequired"
        :label="t('fields.field_add_data')"
        @update:model-value="handleInput"
      />
      <template #error>
        <div :id="`add-data-error-${fieldId}`">
          {{ error }}
        </div>
      </template>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
/**
 * AddDataField Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';

const props = defineProps<{
    modelValue: boolean
    hasInteracted?: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'validation': [isValid: boolean]
}>();

const { settings } = useFormSettings();
const { t } = useI18n();
const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted || false);
// Unique ID for ARIA
const fieldId = computed(() => Math.random().toString(36).substring(2, 9));

const config = computed(() => settings.value?.fields.field_add_data);
const isRequired = computed(() => config.value?.required ?? false);

const validate = (value: boolean) => {
    const isValid = !(isRequired.value && !value);

    // Only show errors if user has interacted with the field
    if (!isValid && hasUserInteracted.value) {
        error.value = config.value?.validation_message || `${config.value?.label} is required`;
    } else {
        error.value = null;
    }

    emit('validation', isValid);
    return isValid;
};

const handleInput = (value: boolean) => {
    hasUserInteracted.value = true; // Mark as interacted when user clicks checkbox
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
