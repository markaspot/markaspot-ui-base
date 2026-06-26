# FormErrorDisplay.vue
<template>
  <UAlert
    v-if="errorState.isVisible"
    color="error"
    variant="soft"
    icon="i-heroicons-exclamation-triangle"
    class="mb-4"
    role="alert"
    aria-live="assertive"
    close
    @update:open="clearErrors"
  >
    <template #title>
      {{ formatMessage(errorState.message, errorState.meta) }}
    </template>

    <template #description>
      <ul
        v-if="errorState.errors.length"
        class="list-disc pl-5 space-y-1"
      >
        <li
          v-for="(error, index) in errorState.errors"
          :key="index"
        >
          <template v-if="error.field !== 'general'">
            <strong
              v-if="fieldLabels[error.field]"
              class="font-medium"
            >
              {{ fieldLabels[error.field] }}:
            </strong>
            {{ formatMessage(error.message, error.meta) }}
          </template>
          <template v-else>
            {{ formatMessage(error.message, error.meta) }}
          </template>
        </li>
      </ul>
    </template>
  </UAlert>
</template>

<script setup lang="ts">
/**
 * FormErrorDisplay Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';
import type { ErrorState } from '~~/types/error';

const { t } = useI18n();

const props = defineProps<{
    errorState: ErrorState
}>();

const emit = defineEmits<{
    clear: []
}>();

// Field label translations
const fieldLabels: Record<string, string> = {
    field_geolocation: t('fields.field_geolocation'),
    field_gdpr: t('fields.field_gdpr'),
    field_e_mail: t('fields.field_e_mail'),
    field_category: t('fields.field_category'),
    field_request_media: t('fields.field_request_media'),
    field_name: t('fields.field_name'),
    field_prename: t('fields.field_prename'),
    field_phone: t('fields.field_phone'),
    field_address: t('fields.field_address'),
    body: t('fields.body')
};

// Helper to determine if a string looks like a translation key or a raw message
const isTranslationKey = (message: string): boolean => {
    // Check if it looks like a translation key (contains dots and only basic characters)
    return /^[a-z0-9_.-]+$/i.test(message) && message.includes('.');
};

// Helper to format a message with parameters even if the translation is missing
const formatMessage = (message: string, params?: Record<string, unknown>): string => {
    // If no params or empty message, just return the message
    if (!params || !message) return message;

    // If it's a translation key, try to use the translation system
    if (isTranslationKey(message)) {
        const translated = t(message, params);

        // If the translation actually happened (translated text is different from key)
        if (translated !== message) {
            return translated;
        } else {
            // Return original message when translation not found
        }
    } else {
    // Not a translation key, pass through
    }

    // Fallback: manually replace parameters in the raw message string
    let formattedMessage = message;
    Object.entries(params).forEach(([key, value]) => {
        const pattern = new RegExp(`\\{${key}\\}`, 'g');
        formattedMessage = formattedMessage.replace(pattern, String(value));
    });

    return formattedMessage;
};

const clearErrors = () => {
    emit('clear');
};
</script>
