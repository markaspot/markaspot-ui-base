<template>
  <div
    v-if="hasMultipleLocales"
    class="language-switcher-compact"
  >
    <div class="relative">
      <UButton
        type="button"
        variant="ghost"
        size="lg"
        :disabled="isChangingLocale"
        :aria-label="`${t('map.controls.toggle_language')}. ${t('common.current')}: ${currentLanguageLabel}`"
        :aria-expanded="isOpen"
        aria-haspopup="menu"
        class="gap-1.5 px-3.5 !bg-white dark:!bg-neutral-900 !rounded-md shadow-lg hover:!bg-neutral-50 dark:hover:!bg-neutral-800 !text-neutral-900 dark:!text-neutral-100"
        @click="toggleDropdown"
      >
        <UIcon
          name="i-heroicons-language"
          class="w-4 h-4"
          aria-hidden="true"
        />
        <span class="font-medium text-sm">{{ currentLanguageCode }}</span>
        <UIcon
          name="i-heroicons-chevron-down"
          class="w-3.5 h-3.5 transform transition-transform"
          :class="{ 'rotate-180': isOpen }"
        />
      </UButton>

      <div
        v-if="isOpen"
        role="menu"
        :aria-label="t('map.controls.toggle_language')"
        class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg z-50"
        @click.stop
      >
        <div class="py-1">
          <button
            v-for="item in languageItems"
            :key="item.code"
            type="button"
            role="menuitemradio"
            :aria-checked="item.code === currentLocale"
            class="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
            :class="{
              'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100': item.code === currentLocale,
              'text-neutral-600 dark:text-neutral-300': item.code !== currentLocale,
            }"
            @click="selectLanguage(item.code)"
          >
            <span class="font-medium">{{ item.name }}</span>
            <UIcon
              v-if="item.code === currentLocale"
              name="i-heroicons-check"
              class="w-4 h-4 text-neutral-500 dark:text-neutral-400 ml-auto"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CompactLanguageSwitcher Component
 *
 * Compact language switcher using USelect for perfect height consistency
 * with LocationSearch input and proper accessibility
 */

import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const {
    currentLocale,
    switchLanguage,
    isChangingLocale,
    availableLocales,
    getLanguageLabels,
    getLanguageCodes
} = useLanguage();

// Get dynamic language data from client config
const languageLabels = getLanguageLabels;
const languageCodes = getLanguageCodes;

const currentLanguageLabel = computed(() =>
    languageLabels.value?.[currentLocale.value] || currentLocale.value
);

const currentLanguageCode = computed(() =>
    languageCodes.value?.[currentLocale.value] || currentLocale.value.toUpperCase().slice(0, 2)
);

// Only show switcher when there are multiple locales to choose from
const hasMultipleLocales = computed(() => (availableLocales.value?.length || 0) > 1);

// Create language items for USelect
const languageItems = computed(() => {
    if (!availableLocales.value || !languageCodes.value || !languageLabels.value) {
        return [];
    }

    return availableLocales.value.map(code => ({
        code,
        name: languageLabels.value[code] || code
    }));
});

// Dropdown state management
const isOpen = ref(false);

const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
};

const selectLanguage = (languageCode: string) => {
    isOpen.value = false;
    handleLanguageChange(languageCode);
};

// Close dropdown when clicking outside
onMounted(() => {
    const handleClickOutside = (event: Event) => {
        if (isOpen.value) {
            const target = event.target as Element;
            const dropdown = document.querySelector('.language-switcher-compact');

            // Only close if click is outside the dropdown component
            if (!dropdown?.contains(target)) {
                isOpen.value = false;
            }
        }
    };

    document.addEventListener('click', handleClickOutside);

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
    });
});

const handleLanguageChange = async (selectedCode: string) => {
    if (isChangingLocale.value) return;

    if (selectedCode !== currentLocale.value) {
        await switchLanguage(selectedCode);
    }
};

// Listen for external language switch events
onMounted(() => {
    const handleExternalLanguageSwitch = (event: CustomEvent) => {
        console.log('Received switchLanguage event:', event.detail);
        const locale = event.detail?.locale;
        if (locale && availableLocales.value.includes(locale)) {
            console.log('Switching to locale:', locale);
            handleLanguageChange(locale);
        } else {
            console.log('Locale not available:', locale, 'Available:', availableLocales.value);
        }
    };

    window.addEventListener('switchLanguage', handleExternalLanguageSwitch);
    console.log('Language switcher listening for external events');

    onUnmounted(() => {
        window.removeEventListener('switchLanguage', handleExternalLanguageSwitch);
    });
});
</script>
