<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Map } from 'maplibre-gl'
import { useFormSettings } from '~/composables/form/useFormSettings'

const { t } = useI18n()
const { settings } = useFormSettings()
const { search, reverse } = useGeocoding()

const config = computed(() => settings.value?.fields.field_geolocation)

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    street?: string;
    houseNumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const props = defineProps<{
  mapInstance?: Map | null
  variant?: 'default' | 'map'
}>()

const emit = defineEmits<{
  'location-selected': [coords: { lat: number; lng: number; address: string }]
}>()


const searchValue = ref('')
const searchInput = ref('')
const error = ref<string | null>(null)
const suggestions = ref<GeocodingResult[]>([])
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

    suggestions.value = results
  } catch (err) {
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

const selectSuggestion = (suggestion: GeocodingResult) => {
  const address = formatAddress(suggestion.address)
  searchValue.value = address

  if (props.mapInstance) {
    props.mapInstance.flyTo({
      center: [suggestion.lng, suggestion.lat],
      zoom: 16,
      duration: 1000
    })

    emit('location-selected', {
      lat: suggestion.lat,
      lng: suggestion.lng,
      address
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
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ suggestion.displayName }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatAddress(suggestion.address) }}
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
