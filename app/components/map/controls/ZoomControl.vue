<template>
  <div
    id="map-controls"
    :class="['map-control divide-y', props.config?.classes]"
    class="w-11"
    role="group"
    :aria-label="t('map.controls.zoom')"
  >
    <button
      class="w-11 h-11 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
      style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
      :aria-label="t('map.controls.zoom_in')"
      @click="zoomIn"
    >
      <UIcon
        name="i-heroicons-plus"
        :class="['w-5 h-5', buttonTextClass()]"
      />
      <span class="sr-only">{{ t('map.controls.zoom_in') }}</span>
    </button>
    <button
      class="w-11 h-11 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
      style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
      :aria-label="t('map.controls.zoom_out')"
      @click="zoomOut"
    >
      <UIcon
        name="i-heroicons-minus"
        :class="['w-5 h-5', buttonTextClass()]"
      />
      <span class="sr-only">{{ t('map.controls.zoom_out') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * ZoomControl Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import type { Map } from 'maplibre-gl';

const { t } = useI18n();
const { buttonTextClass } = useContrastText();

// Props
const props = defineProps<{
    mapInstance: Map | null
    config?: {
        classes?: string
    }
}>();

// Methods
const zoomIn = () => props.mapInstance?.zoomIn();
const zoomOut = () => props.mapInstance?.zoomOut();
</script>
