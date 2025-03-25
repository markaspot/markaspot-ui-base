<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'



const { t } = useI18n()
const { settings } = useFormSettings()
const { search, reverse } = useGeocoding()

const fieldId = computed(() => Math.random().toString(36).substring(2, 9))

const config = computed(() => settings.value?.fields.field_geolocation)

interface LocationValue {
  lat: number | string
  lng: number | string
}

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    street?: string;
    houseNumber?: string;
    housenumber?: string; 
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const props = defineProps<{
  modelValue: LocationValue,
  mapCenter?: {
    lat: number,
    lng: number,
    address?: string
  },
  required?: boolean,
  triggeredFromAction?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LocationValue]
}>()


const searchInput = ref('')
const suggestions = ref<GeocodingResult[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const selected = ref(false)
const gettingCurrentLocation = ref(false)

const formatAddress = (address: GeocodingResult['address']): string => {
  const parts = []

  if (address.street) {
    const street = [address.street]
    
    const houseNumber = address.houseNumber || address.housenumber
    if (houseNumber) {
      street.push(houseNumber)
    }
    parts.push(street.join(' '))
  }

  if (address.city) {
    if (address.postcode) {
      parts.push(`${address.postcode} ${address.city}`)
    } else {
      parts.push(address.city)
    }
  }

  if (parts.length === 0 && address.state) {
    parts.push(address.state)
  }

  return parts.join(', ') || 'Unknown location'
}


const searchLocation = useDebounceFn(async (query: string) => {
  if (!query?.trim()) {
    suggestions.value = []
    return
  }

  isLoading.value = true
  error.value = null

  try {
    
    const searchOptions: any = {
      limit: 5,
      language: 'de'
    }

    
    if (config.value?.widget_settings?.limit_viewbox) {
      searchOptions.bbox = config.value.widget_settings.limit_viewbox
    }

    
    if (props.mapCenter?.lat && props.mapCenter?.lng) {
      searchOptions.centerPoint = {
        lat: props.mapCenter.lat,
        lng: props.mapCenter.lng
      }
    }

    const results = await search(query, searchOptions)
    suggestions.value = results
  } catch (error) {
    console.error('Error during location search:', error)
    error.value = t('report.form.location.error')
    suggestions.value = []
  } finally {
    isLoading.value = false
  }
}, 300)
const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    error.value = t('errors.location_not_supported')
    return
  }

  gettingCurrentLocation.value = true
  error.value = null

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      })
    })

    
    if (position?.coords) {
      const { latitude, longitude } = position.coords

      try {
        const result = await reverse(latitude, longitude)
        searchInput.value = formatAddress(result.address)
        selected.value = true
        
        emit('update:modelValue', { lat: latitude, lng: longitude })
      } catch (error) {
        console.error('Error during reverse geocoding:', error)
        searchInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        selected.value = true
        emit('update:modelValue', { lat: latitude, lng: longitude })
      }
    }

  } catch (error) {
    console.error('Error getting current location:', error)
    error.value = t('report.form.location.error')
  } finally {
    gettingCurrentLocation.value = false
  }
}
watch(searchInput, (newValue) => {
  if (!selected.value && newValue?.trim()) {
    searchLocation(newValue)
  } else {
    suggestions.value = []
  }
})

const clearSearch = () => {
  searchInput.value = ''
  selected.value = false
  suggestions.value = []
  error.value = null
}

const selectSuggestion = (suggestion: GeocodingResult) => {
  selected.value = true
  searchInput.value = formatAddress(suggestion.address)
  emit('update:modelValue', {
    lat: suggestion.lat,
    lng: suggestion.lng,
  })
  suggestions.value = []
}

const clearLocation = () => {
  emit('update:modelValue', { lat: '', lng: '' })
  clearSearch()
}

// Watch for modelValue changes to handle reverse geocoding
watch(() => props.modelValue, async (newValue) => {
  // Most basic guard - don't do anything if we don't have valid coordinates
  if (!newValue?.lat || !newValue?.lng ||
    newValue.lat === '' || newValue.lng === '') {
    return;
  }

  if (!searchInput.value) {
    isLoading.value = true;
    try {
      const result = await reverse(Number(newValue.lat), Number(newValue.lng));
      searchInput.value = formatAddress(result.address);
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      // Don't try to format invalid coordinates
    } finally {
      isLoading.value = false;
    }
  }
}, { immediate: true });



onMounted(async () => {
  
  if (props.mapCenter &&
    !props.modelValue.lat &&
    !props.modelValue.lng &&
    props.triggeredFromAction) {

    
    if (props.mapCenter.address) {
      searchInput.value = props.mapCenter.address
      selected.value = true
      emit('update:modelValue', {
        lat: props.mapCenter.lat,
        lng: props.mapCenter.lng
      })
      return; 
    }

    
    if (typeof props.mapCenter.lat === 'number' &&
      typeof props.mapCenter.lng === 'number' &&
      !isNaN(props.mapCenter.lat) &&
      !isNaN(props.mapCenter.lng)) {

      isLoading.value = true;
      try {
        const result = await reverse(props.mapCenter.lat, props.mapCenter.lng)
        searchInput.value = formatAddress(result.address)
        selected.value = true
        emit('update:modelValue', {
          lat: props.mapCenter.lat,
          lng: props.mapCenter.lng
        })
      } catch (error) {
        console.error('Error during reverse geocoding:', error)
      } finally {
        isLoading.value = false
      }
    }
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="relative">
      <UFormGroup
        :label="t('report.form.location.label')"
        :required="required"
        :help="t('report.form.location.help')"
        :error="error"
      >
        <!-- Search Input -->
        <UInput
          v-model="searchInput"
          :id="`location-field-${fieldId}`"
          :placeholder="t('report.form.location.placeholder')"
          :loading="isLoading"
          :state="error ? 'error' : undefined"
          :trailing="!!searchInput"
          @focus="clearSearch"
          :aria-required="required"
          :aria-invalid="!!error"
          :aria-describedby="error ? `location-error-${fieldId}` : undefined"
          :aria-label="t('report.form.location.label')"
          :aria-expanded="!selected && suggestions.length > 0"
          :aria-controls="!selected && suggestions.length > 0 ? `location-suggestions-${fieldId}` : undefined"
          role="combobox"
          autocomplete="off"
        >
          <!-- Leading Icon -->
          <template #leading>
            <UIcon
              name="i-heroicons-map-pin"
              class="w-5 h-5 text-gray-400"
              aria-hidden="true"
            />
          </template>

          <!-- Trailing Clear Button -->
          <template #trailing v-if="searchInput">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              :aria-label="t('report.form.location.clear')"
              @click="clearSearch"
            />
          </template>
        </UInput>

        <!-- Search Suggestions Dropdown -->
        <div
          v-if="!selected && suggestions.length"
          :id="`location-suggestions-${fieldId}`"
          class="absolute z-10 w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-lg overflow-hidden"
          role="listbox"
          aria-label="Location suggestions"
        >
          <UButton
            v-for="(suggestion, index) in suggestions"
            :key="`${suggestion.lat}-${suggestion.lng}`"
            class="w-full justify-start bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="selectSuggestion(suggestion)"
            role="option"
            :aria-selected="index === 0"
            :id="`location-suggestion-${fieldId}-${index}`"
          >
            <template #leading>
              <UIcon
                name="i-heroicons-map-pin"
                class="w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
            </template>
            <div class="flex flex-col items-start">
              <span class="font-medium text-gray-800 dark:text-gray-200">
                {{ suggestion.displayName }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatAddress(suggestion.address) }}
              </span>
            </div>
          </UButton>
        </div>

        <!-- Current Location Button -->
        <div class="mt-2">
          <UButton
            size="sm"
            variant="soft"
            color="primary"
            class="w-auto flex items-center gap-2"
            :loading="gettingCurrentLocation"
            :disabled="gettingCurrentLocation"
            @click="getCurrentLocation"
            aria-label="Use current location"
          >
            <UIcon
              name="i-heroicons-map-pin"
              class="h-4 w-4"
              aria-hidden="true"
            />
            {{ t('report.form.location.current') }}
          </UButton>
        </div>

        <!-- Location Status -->
        <template #help>
          <div v-if="modelValue.lat && modelValue.lng"
               class="flex items-center gap-2 text-sm text-gray-500"
               aria-live="polite">
            <UIcon
              name="i-heroicons-check-circle"
              class="w-4 h-4 text-green-500"
              aria-hidden="true"
            />
            <span>{{ t('report.form.location.selected') }}</span>
            <UButton
              size="xs"
              color="gray"
              variant="ghost"
              @click="clearLocation"
              aria-label="Clear selected location"
            >
              {{ t('common.clear') }}
            </UButton>
          </div>
        </template>
        
        <!-- Error message with unique ID for aria-describedby -->
        <template #error>
          <div :id="`location-error-${fieldId}`">{{ error }}</div>
        </template>
      </UFormGroup>
    </div>
  </div>
</template>
