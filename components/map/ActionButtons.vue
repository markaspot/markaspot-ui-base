<template>
  <div class="relative z-40">
    <!-- Action Buttons -->
    <div
      class="fixed right-4 flex flex-col gap-2 w-[280px]"
      :class="fullscreenWithIsland ? 'safe-area-top' : 'top-16'"
    >
      <!-- Location Search -->
      <LocationSearch
        :map-instance="mapInstance"
        variant="map"
        @location-selected="handleLocationSelect"
        class="mb-2"
      />


      <!-- Classic Report Button -->
      <button
        @click="$emit('report', 'classic')"
        class="w-full flex items-center bg-secondary gap-3 px-4 py-4 rounded-xl shadow-lg hover:bg-secondary-600 transition-all"
      >
        <UIcon
          name="i-heroicons-document-text"
          class="text-white dark:text-black w-5 h-5"
        />
        <span class="text-white dark:text-black font-medium">
          {{ t('report.buttons.classic') }}
        </span>
      </button>
    </div>

    <!-- Map Controls -->
    <div class="fixed right-4 top-64 flex flex-col gap-2">
      

      <!-- Zoom Controls -->
      <div class="bg-white dark:bg-black rounded-lg shadow-lg divide-y">
        <button
          class="w-10 h-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          :aria-label="t('map.controls.zoom_in')"
          @click="zoomIn"
        >
          <UIcon
            name="i-heroicons-plus"
            class="w-5 h-5 text-gray-600 dark:text-gray-300"
          />
        </button>
        <button
          class="w-10 h-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          :aria-label="t('map.controls.zoom_out')"
          @click="zoomOut"
        >
          <UIcon
            name="i-heroicons-minus"
            class="w-5 h-5 text-gray-600 dark:text-gray-300"
          />
        </button>
      </div>

      

      <!-- Geolocation Button -->
      <button
        class="w-10 h-10 bg-white dark:bg-black rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        :aria-label="t('map.controls.find_location')"
        @click="geolocate"
      >
        <UIcon
          name="i-heroicons-map-pin"
          class="w-5 h-5 text-gray-600 dark:text-gray-300"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Map } from 'maplibre-gl'
import LocationSearch from './LocationSearch.vue'

const { t, locale } = useI18n()
const hydrated = ref(false)
const isHeatmapVisible = ref(false)

// Props
const props = defineProps<{
  mapInstance: Map | null
}>()

const emit = defineEmits<{
  report: [type: 'classic']
  'update:location': [locationData: { lat: number; lng: number; address: string }]
  'toggle-language': []
  'geolocate': [coords: { lat: number; lng: number }]
}>()

onMounted(() => {
  hydrated.value = true
})

const { settings } = useMarkASpotSettings()
const { useFallback } = useMapStyles()

// Show language toggle if multiple languages are available (always false in base edition)
const showLanguageToggle = computed(() => false);

const toggleLanguage = () => {
  console.warn('Language toggle is disabled in base edition');
};

const toggleColorMode = () => {
  console.warn('Theme toggle is disabled in base edition');
};

const handleLocationSelect = (locationData: { lat: number; lng: number; address: string }) => {
  emit('update:location', locationData)
}

const toggleHeatmap = () => {
  if (!props.mapInstance) return

  const heatmapLayerId = 'reports-heat'
  const symbolLayerId = 'reports-symbols'
  const circlesLayerId = 'reports-circles'

  if (!props.mapInstance.getLayer(heatmapLayerId)) {
    console.warn(`Layer "${heatmapLayerId}" does not exist.`)
    return
  }

  isHeatmapVisible.value = !isHeatmapVisible.value
  const visibility = isHeatmapVisible.value ? 'visible' : 'none'

  props.mapInstance.setLayoutProperty(heatmapLayerId, 'visibility', visibility)

  // Toggle other layers
  ;[symbolLayerId, circlesLayerId].forEach(layerId => {
    if (props.mapInstance?.getLayer(layerId)) {
      props.mapInstance.setLayoutProperty(
        layerId,
        'visibility',
        visibility === 'visible' ? 'none' : 'visible'
      )
    }
  })
}

const zoomIn = () => props.mapInstance?.zoomIn()
const zoomOut = () => props.mapInstance?.zoomOut()

const geolocate = () => {
  if (!props.mapInstance) return

  if (process.env.NODE_ENV === 'development') {
    const mockCoords = { lat: 50.0, lng: 10.0 }
    emit('geolocate', mockCoords)
    handleLocationSelect({ ...mockCoords, address: 'Mock Location' })
  } else {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        emit('geolocate', coords)
        handleLocationSelect({ ...coords, address: 'Current Location' })
      },
      (error) => {
        console.error('Geolocation error:', error)
        // Handle error (show notification, etc.)
      }
    )
  }
}
</script>