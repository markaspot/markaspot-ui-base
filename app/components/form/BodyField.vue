<template>
  <div v-if="config">
    <UFormField
      :id="`${fieldId}-label`"
      :label="label"
      :description="help"
      :error="error"
      :required="isRequired"
    >
      <AutoResizeTextarea
        :id="fieldId + '-input'"
        ref="textareaRef"
        :model-value="modelValue"
        :placeholder="placeholder"
        :required="isRequired"
        :disabled="disabled"
        :readonly="readonly"
        :min-rows="minRows"
        :max-rows="maxRows"
        :maxlength="maxlength"
        :auto-resize="autoResize"
        :show-counter="showCounter"
        :error="!!error"
        :aria-label="label || placeholder"
        :aria-describedby="getAriaDescribedBy"
        @update:model-value="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <!-- Hidden descriptive help referenced by aria-describedby -->
      <div
        v-if="help"
        :id="`${fieldId}-help`"
        class="sr-only"
      >
        {{ help }}
      </div>

      <!-- Additional help text for character limit -->
      <template
        v-if="showCounter && maxlength && !error"
        #help
      >
        <div class="flex items-center justify-between">
          <span>{{ help }}</span>
          <span class="text-xs text-neutral-600 dark:text-neutral-300">
            {{ t('form.character_limit', { limit: maxlength }) }}
          </span>
        </div>
      </template>

      <!-- Error message with unique ID -->
      <template #error>
        <div
          :id="`${fieldId}-error`"
          role="alert"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ error }}
        </div>
      </template>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AutoResizeTextarea from '@/components/form/AutoResizeTextarea.vue';

// Types
interface WidgetSettings {
    placeholder?: string
    rows?: number
    max_rows?: number
    maxlength?: number
    show_counter?: boolean
    auto_resize?: boolean
}

interface Props {
    modelValue: string
    hasInteracted?: boolean
    disabled?: boolean
    readonly?: boolean
    helpText?: string
    placeholder?: string
}

// Props & Emits
const props = withDefaults(defineProps<Props>(), {
    hasInteracted: false,
    disabled: false,
    readonly: false
});

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'validation': [isValid: boolean]
    'focus': [event: FocusEvent]
    'blur': [event: FocusEvent]
}>();

// Composables
const { t } = useI18n();
const { settings } = useFormSettings();
const { isFieldRequired } = useFieldRequirements();

// Refs
const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted);
const textareaRef = ref<any>();

// Generate unique field ID
const fieldId = `body-field-${Math.random().toString(36).substr(2, 9)}`;

// Computed properties
const config = computed(() => settings.value?.fields.body as any);
// Use centralized requirement logic: body defaults to required when unspecified
const isRequired = isFieldRequired('body', true);

const label = computed(() => {
    const tLabel = t('form.body');
    if (typeof tLabel === 'string' && tLabel.trim() && tLabel !== 'form.body') return tLabel;
    return config.value?.label || (t('report.form.description.label') as string) || 'Beschreibung';
});

const help = computed(() =>
    props.helpText ||
    t('form.body_description') ||
    config.value?.description ||
    ''
);

const placeholder = computed(() =>
    props.placeholder ||
    t('form.body_placeholder') ||
    config.value?.widget_settings?.placeholder ||
    t('report.form.description.placeholder')
);

// Always use 3 rows initial height independent of API
const minRows = computed(() => 3);
const maxRows = computed(() => 10);
const maxlength = computed(() =>
    config.value?.widget_settings?.maxlength ||
    config.value?.display_settings?.third_party_settings?.maxlength?.maxlength_js
);
const showCounter = computed(() => config.value?.widget_settings?.show_counter ?? true);
const autoResize = computed(() => config.value?.widget_settings?.auto_resize ?? true);

const getAriaDescribedBy = computed(() => {
    const ids = [];
    if (help.value) ids.push(`${fieldId}-help`);
    if (error.value) ids.push(`${fieldId}-error`);
    return ids.length > 0 ? ids.join(' ') : undefined;
});

// Methods
const validate = (value: string): boolean => {
    const trimmedValue = value?.trim() || '';
    const isValid = !isRequired.value || trimmedValue.length > 0;

    // Only show errors if user has interacted with the field
    if (!isValid && hasUserInteracted.value) {
        error.value = t('validation.body_required') ||
          config.value?.validation_message ||
          t('validation.required_field', { field: label.value }) ||
          'This field is required';
    } else if (maxlength.value && value.length > maxlength.value) {
        error.value = t('validation.max_length', { max: maxlength.value }) ||
          `Maximum ${maxlength.value} characters allowed`;
    } else {
        error.value = null;
    }

    emit('validation', isValid && !error.value);
    return isValid && !error.value;
};

const handleInput = (value: string) => {
    hasUserInteracted.value = true;
    emit('update:modelValue', value);
    validate(value);
};

const handleFocus = (event: FocusEvent) => {
    emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
    hasUserInteracted.value = true;
    validate(props.modelValue);
    emit('blur', event);
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
    if (hasUserInteracted.value) {
        validate(newValue);
    }
});

// Expose methods for parent components
defineExpose({
    focus: () => textareaRef.value?.focus(),
    blur: () => textareaRef.value?.blur(),
    validate: () => validate(props.modelValue)
});
</script>
