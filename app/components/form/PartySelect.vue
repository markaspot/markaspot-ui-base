<template>
  <UFormField
    v-if="FEATURE_PARTY"
    :label="config?.label || t('report.form.party.label')"
    :description="config?.description"
    :error="error"
  >
    <template #label>
      {{ config?.label || t('report.form.party.label') }} <span
        v-if="isRequired"
        class="text-red-500"
      >*</span>
    </template>
    <AppSelectMenu
      :id="`party-field-${fieldId}`"
      v-model="selectedParty"
      :items="partyOptions"
      :placeholder="t('report.form.party.placeholder')"
      :option-attribute="'label'"
      :value-attribute="'value'"
      :by="'value'"
      class="w-full max-w-md"
    >
      <template #empty>
        <span class="text-[var(--ui-text-muted)]">{{ t('report.form.party.empty') }}</span>
      </template>
    </AppSelectMenu>

    <template #error>
      <div :id="`party-error-${fieldId}`">
        {{ error }}
      </div>
    </template>
  </UFormField>
</template>

<script setup lang="ts">
/**
 * PartySelect Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import AppSelectMenu from '~/components/ui/AppSelectMenu.vue';
// Build-time feature flag
const FEATURE_PARTY = __FEATURE_PARTY__;

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

const config = computed(() => settings.value?.fields?.field_party as any);
// Even though API says it's not required, UI shows it as required with *
const isRequired = computed(() => true);

// Transform allowed_values from config into options for USelectMenu
const partyOptions = computed(() => {
    if (!config.value?.settings?.allowed_values) {
        return [];
    }

    return Object.entries(config.value.settings.allowed_values).map(([value, label]) => ({
        label: String(label),
        value: parseInt(value, 10)
    }));
});

// Handle v-model - AppSelectMenu works with objects, but we need to emit primitive values
const selectedParty = computed({
    get: () => {
        // Find the option object matching the current primitive value
        return partyOptions.value.find(option => option.value === props.modelValue) || null;
    },
    set: (selected: { label: string, value: number } | null) => {
        hasUserInteracted.value = true;
        // Extract primitive value from selected object
        const value = selected?.value ?? null;
        emit('update:modelValue', value);
        validate(value);
    }
});

// Watch for external changes to hasInteracted
watch(() => props.hasInteracted, (newValue) => {
    if (newValue) {
        hasUserInteracted.value = true;
        validate(selectedParty.value as any);
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
