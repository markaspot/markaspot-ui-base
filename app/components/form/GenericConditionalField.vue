<template>
  <div v-if="config">
    <UFormField
      :label="displayLabel"
      :description="config.description"
      :error="error"
    >
      <template #label>
        {{ displayLabel }} <span
          v-if="isRequired"
          class="text-red-500"
        >*</span>
      </template>

      <!-- Select field (list_integer / list_string) -->
      <AppSelectMenu
        v-if="isSelectField"
        :id="`${fieldName}-field-${fieldId}`"
        :model-value="selectedOption"
        :items="selectOptions"
        :placeholder="displayPlaceholder"
        option-attribute="label"
        value-attribute="value"
        by="value"
        class="w-full max-w-md"
        @update:model-value="handleSelectUpdate"
      >
        <template #empty>
          <span class="text-[var(--ui-text-muted)]">{{ t('common.no_options') }}</span>
        </template>
      </AppSelectMenu>

      <!-- Text field (string / string_long) -->
      <AppInput
        v-else-if="isTextField"
        :id="`${fieldName}-field-${fieldId}`"
        size="md"
        :model-value="modelValue"
        type="text"
        :placeholder="displayPlaceholder"
        maxlength="255"
        :state="error ? 'error' : undefined"
        :aria-required="isRequired"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${fieldName}-error-${fieldId}` : undefined"
        class="w-full max-w-md"
        @update:model-value="handleInput"
      />

      <!-- Checkbox field (boolean) -->
      <UCheckbox
        v-else-if="isBooleanField"
        :id="`${fieldName}-field-${fieldId}`"
        :model-value="modelValue"
        :required="isRequired"
        :label="displayLabel"
        @update:model-value="handleInput"
      />

      <!-- Number field (integer / float / decimal) -->
      <AppInput
        v-else-if="isNumberField"
        :id="`${fieldName}-field-${fieldId}`"
        size="md"
        :model-value="modelValue"
        type="number"
        :placeholder="displayPlaceholder"
        :state="error ? 'error' : undefined"
        :aria-required="isRequired"
        :aria-invalid="!!error"
        class="w-full max-w-md"
        @update:model-value="handleInput"
      />

      <template #error>
        <div :id="`${fieldName}-error-${fieldId}`">
          {{ error }}
        </div>
      </template>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
/**
 * GenericConditionalField
 *
 * Auto-renders a conditional form field based on Drupal field type metadata.
 * Supports: select (list_integer/list_string), text (string), checkbox (boolean), number.
 * The field's label, options, and required status come from the Drupal API.
 */

import { useI18n } from 'vue-i18n';
import AppSelectMenu from '~/components/ui/AppSelectMenu.vue';

const { t } = useI18n();

const props = defineProps<{
    fieldName: string
    modelValue: any
    hasInteracted?: boolean
    disabled?: boolean
    labelOverride?: string
    requiredOverride?: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: any]
    'validation': [isValid: boolean]
}>();

const { settings } = useFormSettings();
const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted || false);
const fieldId = useId();

// Field configuration from Drupal API
const config = computed(() => settings.value?.fields?.[props.fieldName] as any);
const fieldType = computed(() => config.value?.field_type || '');

// Field type detection
const isSelectField = computed(() =>
    ['list_integer', 'list_string'].includes(fieldType.value)
);
const isTextField = computed(() =>
    ['string', 'string_long'].includes(fieldType.value)
);
const isBooleanField = computed(() =>
    fieldType.value === 'boolean'
);
const isNumberField = computed(() =>
    ['integer', 'float', 'decimal'].includes(fieldType.value)
);

// Display properties
const displayLabel = computed(() =>
    props.labelOverride || config.value?.label || props.fieldName
);
const displayPlaceholder = computed(() =>
    config.value?.widget_settings?.placeholder || ''
);

// Required status (config override takes priority)
const isRequired = computed(() => {
    if (props.requiredOverride !== undefined) return props.requiredOverride;
    return config.value?.required ?? false;
});

// Transform allowed_values from Drupal API into select options
const selectOptions = computed(() => {
    const allowedValues = config.value?.settings?.allowed_values;
    if (!allowedValues) return [];

    // Handle both array and object formats
    if (Array.isArray(allowedValues)) {
        return allowedValues.map((item: any) => ({
            label: String(item.label || item),
            value: item.value !== undefined ? item.value : item
        }));
    }

    return Object.entries(allowedValues).map(([value, label]) => ({
        label: String(label),
        value: fieldType.value === 'list_integer' ? parseInt(value, 10) : value
    }));
});

// Handle v-model for select - AppSelectMenu works with objects
const selectedOption = computed(() => {
    return selectOptions.value.find(
        (option: { value: any }) => option.value === props.modelValue
    ) || null;
});

const handleSelectUpdate = (selected: { label: string, value: any } | null) => {
    hasUserInteracted.value = true;
    const value = selected?.value ?? null;
    emit('update:modelValue', value);
    validate(value);
};

const handleInput = (value: any) => {
    hasUserInteracted.value = true;
    emit('update:modelValue', value);
    validate(value);
};

// Validation
const validate = (value: any) => {
    if (!hasUserInteracted.value) return true;

    if (isRequired.value && (value === null || value === undefined || value === '' || value === false)) {
        error.value = t('errors.validation.required_field', { field: displayLabel.value });
        emit('validation', false);
        return false;
    }

    error.value = null;
    emit('validation', true);
    return true;
};

// Watch for external changes to hasInteracted
watch(() => props.hasInteracted, (newValue) => {
    hasUserInteracted.value = !!newValue;
    if (newValue) {
        validate(props.modelValue);
    }
});

// Watch for value changes
watch(() => props.modelValue, (newValue) => {
    if (hasUserInteracted.value) {
        validate(newValue);
    }
});
</script>
