<template>
  <div v-if="config">
    <UFormField
      :label="t('form.email') || config.label"
      :description="helpText"
      :error="error"
      :required="isRequired"
    >
      <!-- Category requirement hint moved below input -->

      <AppInput
        :id="`email-field-${fieldId}`"
        size="md"
        :model-value="modelValue"
        type="email"
        :placeholder="t('form.email_placeholder') || config.widget_settings?.placeholder"
        maxlength="60"
        autocomplete="email"
        :aria-required="isRequired"
        :aria-invalid="!!error"
        class="w-full max-w-md"
        @update:model-value="handleInput"
      />

      <!-- Category requirement hint below input field -->
      <div
        v-if="categoryRequired && !hideRequiredLabeling"
        class="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2 mt-2"
      >
        <UIcon
          name="i-heroicons-information-circle"
          class="w-4 h-4"
        />
        {{ t('report.form.email.required') }}
      </div>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
/**
 * EmailField Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';
import { useFormSettings } from '@/composables/form/useFormSettings';

const { t } = useI18n();

const props = withDefaults(defineProps<{
    modelValue: string
    required?: boolean // Accept required as a prop override
    hideRequiredLabeling?: boolean // Hide the prominent requirement indicator
    categoryRequired?: boolean // True when required specifically for selected category
    hasInteracted?: boolean // Whether user has interacted with the field (for submit validation)
}>(), {
    hasInteracted: false
});

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'validation': [isValid: boolean]
}>();

const { settings } = useFormSettings();
const error = ref<string | null>(null);

// Computed property to conditionally include help text
const helpText = computed(() => {
    const help = t('form.email_description') || config.value?.description;
    return help?.trim() || null;
});
// Track if the field has been interacted with
const fieldTouched = ref(false);
// Generate unique ID for this field instance
const fieldId = computed(() => Math.random().toString(36).substring(2, 9));

const config = computed(() => settings.value?.fields.field_e_mail);
// Use prop override if provided, otherwise fall back to API config
const isRequired = computed(() => props.required ?? config.value?.required ?? false);

const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Track if submit was attempted (passed from parent via hasInteracted)
const submitAttempted = ref(false);

const validate = (value: string) => {
    // Calculate validity
    const isEmpty = isRequired.value && !value;
    const hasInvalidFormat = value && !validateEmail(value);
    const isValid = !isEmpty && !hasInvalidFormat;

    // Only show errors if user has interacted with this field OR submit was attempted
    const shouldShowError = fieldTouched.value || submitAttempted.value;

    if (shouldShowError) {
        if (isEmpty) {
            error.value = t('validation.email_required') || config.value?.validation_message || 'Email is required';
        } else if (hasInvalidFormat) {
            error.value = t('validation.email_format') || 'Invalid email format';
        } else {
            error.value = null;
        }
    } else {
        // Never show errors before interaction
        error.value = null;
    }

    emit('validation', isValid);
    return isValid;
};

const handleInput = (value: string) => {
    // Mark the field as touched when the user interacts with it
    fieldTouched.value = true;
    emit('update:modelValue', value);
    validate(value);
};

// Watch for external changes to hasInteracted (e.g., on form submit)
watch(() => props.hasInteracted, (newValue) => {
    if (newValue) {
        submitAttempted.value = true;
        validate(props.modelValue);
    }
});

// Watch modelValue changes - re-validate to update error state
watch(() => props.modelValue, (newValue) => {
    validate(newValue);
});

// Initial validity check on mount (emits validation state but doesn't show errors)
onMounted(() => {
    validate(props.modelValue);
});
</script>
