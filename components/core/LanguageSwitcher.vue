<template>
  <div class="relative">
    <UDropdown :items="languageItems">
      <UButton
          color="gray"
          variant="ghost"
          :loading="isChangingLocale"
          class="flex items-center gap-2"
          aria-label="Change language"
          :title="`Current language: ${currentLanguageLabel}. Click to change.`"
      >
        <span class="font-medium">{{ currentLanguageLabel }}</span>
        <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" aria-hidden="true" />
      </UButton>

      <template #item="{ item }">
        <div class="flex items-center gap-2">
          <span>{{ item.name }}</span>
          <UIcon
              v-if="item.code === currentLocale"
              name="i-heroicons-check"
              class="w-4 h-4 text-primary-500"
          />
        </div>
      </template>
    </UDropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';

const {
  currentLocale,
  switchLanguage,
  isChangingLocale,
  availableLocales
} = useLanguage();

const languageLabels = {
  en: 'English',
  de: 'Deutsch'
} as const;

const languageItems = computed(() =>
  availableLocales.map(code => ({
    label: languageLabels[code],
    code,
    click: () => switchLanguage(code)
  }))
);

const currentLanguageLabel = computed(() =>
  languageLabels[currentLocale.value as keyof typeof languageLabels]
);
</script>