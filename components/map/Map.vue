# Map.vue
<template>
  <div v-if="settings" class="relative h-full">
    <!-- Tooltip for location selection -->
    <div v-if="showLocationTooltip"
         class="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center gap-4 w-[350px]"
         :style="{
           left: `${tooltipPosition.x}px`,
           top: `${tooltipPosition.y -60}px`,
           transform: 'translate(-50%)'
           }">

      <div class="flex flex-col gap-2">
        <div class="font-medium">{{ selectedAddress || t('map.add_report_here') }}</div>
        <div class="flex gap-2">
          <UButton size="sm" @click="handleAddClassicReport">
            <template #leading>
              <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
            </template>
            {{ t('report.buttons.classic') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div ref="mapContainer" role="application" class="map-container"></div>
  </div>
  <div v-else class="map-container flex items-center justify-center">
    <span class="text-gray-500">Loading map settings...</span>
  </div>
</template>

<script setup lang="ts">

const maplibregl = await import('maplibre-gl')
const { t } = useI18n()
const { $colorMode } = useNuxtApp()


const props = defineProps<{
  markers: any[]
  isDetailMap?: boolean
  centerLat?: number
  centerLng?: number
}>()


const emit = defineEmits<{
  'update:bounds': [bounds: BoundsType, isDetailView?: boolean]
  'select-report': [report: any]
  'map-init': [map: maplibregl.Map]
  'add-report': [type: 'classic', location: { lat: number, lng: number, address?: string }]
}>()


const mapContainer = ref<HTMLElement | null>(null)
const map = ref<maplibregl.Map | null>(null)
const { settings, fetchSettings } = useMarkASpotSettings()
const { useFallback } = useMapStyles()

let mapFunctions: ReturnType<typeof useMap> | null = null

const currentMarker = ref<maplibregl.Marker | null>(null)
const showLocationTooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const selectedAddress = ref('')

// Map style handling
const mapStyle = computed(() => {
  const timestamp = Date.now()
  const styleUrl = $colorMode.value === 'dark'
    ? settings.value?.mapbox_style_dark
    : settings.value?.mapbox_style

  if (styleUrl) {
    const separator = styleUrl.includes('?') ? '&' : '?'
    return `${styleUrl}${separator}_=${timestamp}`
  }
  return styleUrl
})


const initializeMap = async () => {
  if (!mapContainer.value || !settings.value) return
  

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    center: props.isDetailMap
      ? [props.centerLng!, props.centerLat!]
      : [
        props.centerLng || parseFloat(settings.value.center_lng),
        props.centerLat || parseFloat(settings.value.center_lat),
      ],
    zoom: props.isDetailMap ? 16 : parseInt(settings.value.zoom_initial, 10) || 13,
    attributionControl: false,
    logoPosition: 'bottom-right',
    trackResize: true,
    interactive: true
  });
  
  if (!props.isDetailMap) {
    const attributionControl = new maplibregl.AttributionControl({
      compact: true
    });
    
    map.value.addControl(attributionControl, 'bottom-right');
    
    setTimeout(() => {
      if (!mapContainer.value) return;
      
      const zoomInButton = mapContainer.value.querySelector('.maplibregl-ctrl-zoom-in');
      const zoomOutButton = mapContainer.value.querySelector('.maplibregl-ctrl-zoom-out');
      const compassButton = mapContainer.value.querySelector('.maplibregl-ctrl-compass');
      
      if (zoomInButton) {
        zoomInButton.setAttribute('aria-label', t('map.zoom_in'));
        zoomInButton.setAttribute('title', t('map.zoom_in'));
      }
      
      if (zoomOutButton) {
        zoomOutButton.setAttribute('aria-label', t('map.zoom_out'));
        zoomOutButton.setAttribute('title', t('map.zoom_out'));
      }
      
      if (compassButton) {
        compassButton.setAttribute('aria-label', t('map.reset_bearing'));
        compassButton.setAttribute('title', t('map.reset_bearing'));
      }
    }, 500);
  }

  
  
  try {
    
    const styleLoaded = await useFallback(map.value, settings.value)

    if (styleLoaded) {
      
    } else {
      console.error('Failed to load any map style')
    }
  } catch (error) {
    console.error('Error during map initialization:', error)
  }

  
  if (!props.isDetailMap) {
    map.value.on('load', async () => {
      mapFunctions = useMap(map.value!, props, emit)
      await mapFunctions.initializeMarkerLayers()
      emit('map-init', map.value!)

      const bounds = map.value!.getBounds()
      emit('update:bounds', {
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      })
    })

    map.value.on('moveend', () => {
      if (!map.value) return
      const bounds = map.value.getBounds()
      emit('update:bounds', {
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      }, false)
    })

    map.value.on('click', handleMapClick)
  }
}


const { reverse: reverseGeocode } = useGeocoding()


const handleMapClick = async (e: maplibregl.MapMouseEvent & { features?: any[] }) => {
  if (!map.value) return

  
  const reportFeatures = map.value.queryRenderedFeatures(e.point, {
    layers: ['reports-circles', 'reports-symbols']
  })

  if (reportFeatures.length > 0) {
    
    const feature = reportFeatures[0]
    const report = props.markers.find((m) => m.service_request_id === feature.properties.id)
    if (report) {
      emit('select-report', { report, mapInstance: map.value })
      return 
    }
  }

  
  const clusterFeatures = map.value.queryRenderedFeatures(e.point, {
    layers: ['clusters']
  })

  if (clusterFeatures.length > 0) {
    
    const coordinates = clusterFeatures[0].geometry.coordinates
    const currentZoom = map.value.getZoom()

    map.value.flyTo({
      center: coordinates,
      zoom: currentZoom + 2,
      duration: 500,
    })
    return 
  }

  
  if (currentMarker.value) {
    currentMarker.value.remove()
  }

  
  currentMarker.value = new maplibregl.Marker({
    offset: [0, +50],
    color: '#2563eb' 
  })
    .setLngLat(e.lngLat)
    .addTo(map.value)

  
  try {
    const { reverse: reverseGeocode } = useGeocoding()
    const result = await reverseGeocode(e.lngLat.lat, e.lngLat.lng)
    const p = result.display_name ? result : result.address

    if (p) {
      const parts = []
      if (p.street) {
        parts.push(p.street + (p.housenumber ? ' ' + p.housenumber : ''))
      }
      if (p.city) {
        parts.push([p.postcode, p.city].filter(Boolean).join(' '))
      }
      selectedAddress.value = parts.join(', ') || p.name
    } else {
      selectedAddress.value = `${e.lngLat.lat.toFixed(6)}, ${e.lngLat.lng.toFixed(6)}`
    }
  } catch (err) {
    console.error('Reverse geocoding failed:', err)
    selectedAddress.value = `${e.lngLat.lat.toFixed(6)}, ${e.lngLat.lng.toFixed(6)}`
  }

  // Update tooltip position and show it
  const point = map.value.project(e.lngLat)
  tooltipPosition.value = { x: point.x, y: point.y }
  showLocationTooltip.value = true
}
// Location selection handling
const handleLocationSelect = (locationData: { lat: number; lng: number; address: string }) => {
  if (!map.value) return

  // Remove existing marker
  if (currentMarker.value) {
    currentMarker.value.remove()
  }

  map.value.once('moveend', () => {
    currentMarker.value = new maplibregl.Marker({
      offset: [0, 50], color: '#f40af5'})
      .setLngLat([locationData.lng, locationData.lat])
      .addTo(map.value!)

    selectedAddress.value = locationData.address

    
    const point = map.value!.project([locationData.lng, locationData.lat])
    tooltipPosition.value = { x: point.x, y: point.y }
    showLocationTooltip.value = true
  })
}


defineExpose({ handleLocationSelect })



const handleAddClassicReport = () => {
  if (!currentMarker.value) return

  const coords = currentMarker.value.getLngLat()
  emit('add-report', 'classic', {
    lat: coords.lat,
    lng: coords.lng,
    address: selectedAddress.value
  })
  clearLocationState()
}

const clearLocationState = () => {
  if (currentMarker.value) {
    currentMarker.value.remove()
    currentMarker.value = null
  }
  showLocationTooltip.value = false
  selectedAddress.value = ''
}


watch(mapStyle, async (newStyle) => {
  if (map.value?.loaded()) {
    try {
      map.value.setStyle(newStyle)
      await new Promise((resolve) => {
        map.value!.once('styledata', resolve)
      })
      if (mapFunctions) {
        await mapFunctions.initializeMarkerLayers()
      }
    } catch (error) {
      console.error('Error setting map style:', error)
    }
  }
})


onMounted(async () => {
  await fetchSettings()
  await initializeMap()

  if (!map.value) return

  
  map.value.on('load', async () => {
    
    map.value.once('styledata', async () => {
      mapFunctions = useMap(map.value!, props, emit);
      await mapFunctions.initializeMarkerLayers();

      
      if (props.markers.length > 0) {
        mapFunctions.updateGeoJSONSource(props.markers);
      }

      
      watch(
        () => props.markers,
        (newMarkers) => {
          mapFunctions.updateGeoJSONSource(newMarkers);
        },
        { deep: true, immediate: true }
      );
      
    });
  });
})

onUnmounted(() => {
  if (map.value) {
    map.value.off('click', handleMapClick)
  }
  clearLocationState()
})

</script>

<style>
@import 'maplibre-gl/dist/maplibre-gl.css';

.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
  z-index: 1;
}

.report-popup {
  @apply bg-white dark:bg-gray-800 rounded shadow-lg;
}

.maplibregl-canvas-container {
  cursor: crosshair; }

.maplibregl-canvas-container {
  cursor: default;
}


.maplibregl-ctrl-attrib-inner a {
  color: #000000 !important;   text-decoration: underline !important;
  font-weight: 500 !important;
}

.dark .maplibregl-ctrl-attrib-inner a {
  color: #90CAF9 !important; }

.maplibregl-ctrl-attrib-inner a:focus,
.maplibregl-ctrl button:focus {
  outline: 2px solid currentColor !important;
  outline-offset: 2px !important;
}

</style>
