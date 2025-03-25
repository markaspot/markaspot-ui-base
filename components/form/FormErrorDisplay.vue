# FormErrorDisplay.vue
<template>
  <div v-if="errorState.isVisible" class="space-y-2">
    <div 
      role="alert" 
      aria-live="assertive" 
      class="relative overflow-hidden rounded-lg border bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20"
    >
      <div class="flex items-start gap-3">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
        <div class="flex-1">
          <h3 id="error-heading" class="mb-2 font-medium text-red-800 dark:text-red-200">
            {{ formatMessage(errorState.message, errorState.meta) }}
          </h3>
          <ul 
            v-if="errorState.errors.length" 
            class="space-y-2 pl-4 text-sm text-red-700 dark:text-red-300"
            aria-labelledby="error-heading"
          >
            <li v-for="(error, index) in errorState.errors" :key="index">
              <template v-if="error.field !== 'general'">
                <strong v-if="fieldLabels[error.field]" class="font-medium">
                  {{ fieldLabels[error.field] }}:
                </strong>
                {{ formatMessage(error.message, error.meta) }}
              </template>
              <template v-else>
                {{ formatMessage(error.message, error.meta) }}
              </template>
            </li>
          </ul>
        </div>
        <button
          @click="clearErrors"
          class="rounded p-1 text-red-600 hover:bg-red-100 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-200"
          aria-label="Dismiss error message"
        >
          <UIcon name="i-heroicons-x-mark" class="h-4 w-4" aria-hidden="true" />
          <span class="sr-only">Dismiss</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ErrorState } from '~/types/error'

const { t } = useI18n()

const props = defineProps<{
  errorState: ErrorState
}>()

const emit = defineEmits<{
  'clear': []
}>()


const fieldLabels: Record<string, string> = {
  'field_geolocation': t('fields.field_geolocation'),
  'field_gdpr': t('fields.field_gdpr'),
  'field_e_mail': t('fields.field_e_mail'),
  'field_category': t('fields.field_category'),
  'field_request_media': t('fields.field_request_media'),
  'field_name': t('fields.field_name'),
  'field_prename': t('fields.field_prename'),
  'field_phone': t('fields.field_phone'),
  'body': t('fields.body')
}


const isTranslationKey = (message: string): boolean => {
  
  return /^[a-z0-9_.-]+$/i.test(message) && message.includes('.');
}


const formatMessage = (message: string, params?: Record<string, any>): string => {
  
  if (!params || !message) return message;
  
  
  if (isTranslationKey(message)) {
    const translated = t(message, params);
    
    
    if (translated !== message) {
      return translated;
    } else {
      
    }
  } else {
    
  }
  
  
  let formattedMessage = message;
  Object.entries(params).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    formattedMessage = formattedMessage.replace(pattern, String(value));
  });
  
  return formattedMessage;
}

const clearErrors = () => {
  emit('clear')
}
</script>
