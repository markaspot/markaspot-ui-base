<template>
  <UFormField
    v-if="FEATURE_OKTOBERFEST"
    :label="config?.label || t('report.form.oktoberfest.label')"
    :description="config?.description"
    :error="error"
  >
    <template #label>
      {{ config?.label || t('report.form.oktoberfest.label') }} <span
        v-if="isRequired"
        class="text-red-500"
      >*</span>
    </template>
    <AppSelect
      :id="`oktoberfest-field-${fieldId}`"
      v-model="selectedStreet"
      :options="streetOptions"
      :placeholder="t('report.form.oktoberfest.placeholder')"
      :state="error ? 'error' : undefined"
      class="w-full max-w-md pointer-events-auto"
    >
      <template #empty>
        <span class="text-neutral-600">{{ t('report.form.oktoberfest.empty') }}</span>
      </template>
    </AppSelect>

    <template #error>
      <div :id="`oktoberfest-error-${fieldId}`">
        {{ error }}
      </div>
    </template>
  </UFormField>
</template>

<script setup lang="ts">
/**
 * OktoberfestSelect Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import AppSelect from '@/components/ui/AppSelect.vue';
// Build-time feature flag
const FEATURE_OKTOBERFEST = __FEATURE_OKTOBERFEST__;

const { t } = useI18n();
const props = defineProps<{
    modelValue: string | number | null
    hasInteracted?: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string | number | null]
    'validation': [isValid: boolean]
}>();

const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted || false);
const { settings, hasField } = useFormSettings();
const fieldId = computed(() => Math.random().toString(36).substring(2, 9));

const config = computed(() => settings.value?.fields.field_oktoberfest as any);
// Even though API says it's not required, UI shows it as required with *
const isRequired = computed(() => true);

// Transform allowed_values from config into options for USelect
const streetOptions = computed(() => {
    if (!config.value?.settings?.allowed_values) {
        return [];
    }

    return Object.entries(config.value.settings.allowed_values).map(([value, label]) => ({
        label: String(label),
        value: parseInt(value, 10)
    }));
});

// Handle v-model
const selectedStreet = computed({
    get: () => props.modelValue,
    set: (value: string | number | null) => {
        hasUserInteracted.value = true;
        emit('update:modelValue', value);
        validate(value);
    }
});

// Watch for external changes to hasInteracted
watch(() => props.hasInteracted, (newValue) => {
    if (newValue) {
        hasUserInteracted.value = true;
        validate(selectedStreet.value);
    }
});

// Validation
const validate = (value: string | number | null) => {
    if (!hasUserInteracted.value) {
        return true;
    }

    if (isRequired.value && !value && value !== 0) {
        error.value = t('common.required');
        emit('validation', false);
        return false;
    }

    error.value = null;
    emit('validation', true);
    return true;
};
</script>
