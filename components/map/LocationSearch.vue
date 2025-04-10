<script setup lang="ts">
import type { Map } from 'maplibre-gl'
import type { GeocodingResult } from '~/plugins/geocoding/types'

const { t } = useI18n()
const { settings } = useFormSettings()
const { search, reverse } = useGeocoding()
const { validateLocation, boundaryConfig } = useBoundaryValidator()

const config = computed(() => settings.value?.fields.field_geolocation)


interface EnhancedGeocodingResult extends GeocodingResult {
  validationResult?: {
    valid: boolean;
    message: string;
  };
}

const props = defineProps<{
  mapInstance?: Map | null
  variant?: 'default' | 'map'
}>()

const emit = defineEmits<{
  'location-selected': [coords: { lat: number; lng: number; address: string; validationResult?: { valid: boolean; message: string } }]
}>()


const searchValue = ref('')
const searchInput = ref('')
const error = ref<string | null>(null)
const suggestions = ref<EnhancedGeocodingResult[]>([])
const isLoading = ref(false)
const isDropdownOpen = ref(false)
let searchTimeout: NodeJS.Timeout | null = null

// Format address from result
const formatAddress = (address: GeocodingResult['address']) => {
  const parts = []
  if (address.street) {
    const street = [address.street]
    if (address.houseNumber) {
      street.push(address.houseNumber)
    }
    parts.push(street.join(' '))
  }
  if (address.city) {
    const cityParts = []
    if (address.postcode) {
      cityParts.push(address.postcode)
    }
    cityParts.push(address.city)
    parts.push(cityParts.join(' '))
  }
  if (parts.length === 0 && address.state) {
    parts.push(address.state)
  }
  return parts.join(', ') || 'Unknown location'
}


const searchLocations = async (query: string) => {
  if (!query?.trim()) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const results = await search(query, {
      limit: 5,
      language: 'de',
      bbox: config.value?.widget_settings?.limit_viewbox,
      centerPoint: config.value?.widget_settings?.center ? {
        lat: config.value.widget_settings.center_lat,
        lng: config.value.widget_settings.center_lng
      } : undefined
    })
    
    
    suggestions.value = results.map(result => {
      
      const validationResult = validateLocation(result.lat, result.lng)
      return { ...result, validationResult }
    })
  } catch (err: any) {
    console.error('Search error:', err)
    error.value = t('errors.search_failed')
    suggestions.value = []
  } finally {
    isLoading.value = false
  }
}

const handleInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => searchLocations(searchValue.value), 300)
}

const handleFocus = () => {
  isDropdownOpen.value = true
  if (searchValue.value) searchLocations(searchValue.value)
}

const clearSearch = () => {
  searchInput.value = ''
  searchValue.value = ''
  suggestions.value = []
  error.value = null
  isDropdownOpen.value = false
}

const selectSuggestion = (suggestion: EnhancedGeocodingResult) => {
  const address = formatAddress(suggestion.address)
  searchValue.value = address
  
  if (props.mapInstance) {
    props.mapInstance.flyTo({
      center: [suggestion.lng, suggestion.lat],
      zoom: 16,
      duration: 1000
    })
    
    // Pass validation result along with the location data
    emit('location-selected', {
      lat: suggestion.lat,
      lng: suggestion.lng,
      address,
      validationResult: suggestion.validationResult
    })
  }
  
  suggestions.value = []
  isDropdownOpen.value = false
}

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<template>
  <div class="relative location-search" :class="[variant === 'map' ? 'w-full' : '']">
    <div class="relative">
      <UInput
        v-model="searchValue"
        :placeholder="t('report.form.location.placeholder')"
        :loading="isLoading"
        :trailing="!!searchValue"
        @focus="handleFocus"
        @input="handleInput"
      >
        <template #leading>
          <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400" />
        </template>
        <template #trailing v-if="searchValue">
          <UButton
            class="relative z-10"
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            :aria-label="t('report.form.location.clear')"
            @click="clearSearch"
          />
        </template>
      </UInput>
      
      <!-- Suggestions Dropdown -->
      <div
        v-if="suggestions.length > 0 && isDropdownOpen"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
      >
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.lat + suggestion.lng"
          class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          @click="selectSuggestion(suggestion)"
        >
          <div class="flex items-start gap-2">
            <UIcon 
              :name="suggestion.validationResult?.valid ? 'i-heroicons-map-pin' : 'i-heroicons-exclamation-triangle'" 
              :class="[
                'w-5 h-5 mt-0.5', 
                suggestion.validationResult?.valid ? 'text-gray-400' : 'text-amber-500'
              ]" 
            />
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ suggestion.displayName }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatAddress(suggestion.address) }}
              </div>
              <!-- Show validation message if location is outside boundaries -->
              <div 
                v-if="suggestion.validationResult?.message" 
                class="text-xs mt-1 p-1"
                :class="[
                  suggestion.validationResult.valid ? 'text-amber-600 bg-amber-50 dark:bg-amber-900 dark:text-amber-200' : 'text-red-600 bg-red-50 dark:bg-red-900 dark:text-red-200',
                  'rounded'
                ]"
              >
                {{ suggestion.validationResult.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-search {
  position: relative;
  width: 100%;
}

.location-search :deep(.pointer-events-none) {
  pointer-events: auto;
}

.clear-button {
  z-index: 20;
  pointer-events: auto;
}
</style>
