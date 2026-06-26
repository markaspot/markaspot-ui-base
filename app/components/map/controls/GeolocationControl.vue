<template>
  <div
    :class="['map-control', props.config?.classes]"
    class="w-11 h-11"
  >
    <button
      class="w-full h-full flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset relative"
      style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
      :aria-label="t('map.controls.find_location')"
      :disabled="isLocating"
      @click="geolocate"
    >
      <AppSpinner
        v-if="isLocating"
        size="md"
        :class="buttonTextClass()"
      />
      <CrosshairGps
        v-else
        :class="'w-5 h-5 ' + buttonTextClass()"
      />
      <span class="sr-only">{{ t('map.controls.find_location') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * GeolocationControl Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import type { Map } from 'maplibre-gl';

const { t } = useI18n();
const { buttonTextClass } = useContrastText();
const { getCurrentPosition, isLocating } = useGeolocation();

// Props
const props = defineProps<{
    mapInstance: Map | null
    config?: {
        classes?: string
        trackUserLocation?: boolean
    }
}>();

const emit = defineEmits<{
    geolocate: [coords: { lat: number, lng: number }]
}>();

const geolocate = async () => {
    try {
        const coords = await getCurrentPosition({ timeout: 15000 });
        // Drop accuracy here; downstream listeners key on {lat,lng}. Consumers
        // that need accuracy read `lastPosition` from useGeolocation().
        emit('geolocate', { lat: coords.lat, lng: coords.lng });
    } catch (error) {
        // Toast already handled by useGeolocation composable
        console.error('[GeolocationControl] Geolocation failed:', error);
    }
};
</script>
