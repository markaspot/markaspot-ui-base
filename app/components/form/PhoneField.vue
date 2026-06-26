<template>
  <div v-if="config">
    <UFormField
      :label="t('form.phone') || config.label"
      :description="t('form.phone_description') || config.description"
      :error="error"
      :required="isRequired"
    >
      <AppInput
        size="md"
        :model-value="modelValue"
        type="tel"
        :placeholder="t('form.phone_placeholder') || config.widget_settings?.placeholder"
        autocomplete="tel"
        class="w-full max-w-md"
        @update:model-value="handleInput"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
/**
 * PhoneField Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

const config = computed(() => settings.value?.fields.field_phone);
const isRequired = computed(() => config.value?.required ?? false);

const validate = (value: string) => {
    const isValid = !(isRequired.value && !value?.trim());

    // Only show errors if user has interacted with the field
    if (!isValid && hasUserInteracted.value) {
        error.value = t('validation.phone_required') ||
          t('validation.required_field', { field: t('form.phone') || config.value?.label }) ||
          config.value?.validation_message ||
          `${config.value?.label} is required`;
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
