<template>
  <div
    v-if="hydrated"
    :class="['map-control', props.config?.classes]"
    class="w-11 h-11"
  >
    <button
      class="w-full h-full flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
      style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
      :aria-label="t('common.buttons.toggle_theme')"
      @click="toggleColorMode"
    >
      <UIcon
        :name="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
        class="h-5 w-5"
        :class="isDark ? 'text-primary-400' : 'text-primary-500'"
      />
      <span class="sr-only">{{ t('common.buttons.toggle_theme') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * ThemeControl Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import type { Map } from 'maplibre-gl';
import { useColorMode } from '#imports';

const { t } = useI18n();
const hydrated = ref(false);
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

// Props
const props = defineProps<{
    mapInstance: Map | null
    config?: {
        classes?: string
    }
}>();

const toggleColorMode = () => {
    const newTheme = isDark.value ? 'light' : 'dark';
    colorMode.preference = newTheme;
};

// Set hydrated to true on client-side only
onMounted(() => {
    hydrated.value = true;
});
</script>
