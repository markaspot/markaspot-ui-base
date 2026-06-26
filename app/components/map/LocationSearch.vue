<script setup lang="ts">
/**
 * LocationSearch Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import type { Map } from 'maplibre-gl';
import type { GeocodingResult } from '~/plugins/geocoding/providers/types';
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import { shouldKeepGeocodingSuggestion } from '~/utils/geocodingSuggestions';
import { resolveLocationValidation } from '~/utils/locationValidation';

const { t, locale } = useI18n();
const { clientConfig } = useMarkASpotConfig();
const { settings } = useFormSettings();
const { search, reverse } = useGeocoding();
const { validateLocation } = useBoundaryValidator();
const { settings: mapSettings, boundaryBbox, fetchBoundary } = useMarkASpotSettings();
const { getCurrentPosition, isLocating: geoIsLocating } = useGeolocation();

const config = computed(() => settings.value?.fields.field_geolocation);

// Enhance GeocodingResult with validation information
interface EnhancedGeocodingResult extends GeocodingResult {
    validationResult?: {
        valid: boolean
        message: string
        hardInvalid?: boolean
    }
}

const props = defineProps<{
    mapInstance?: Map | null
    variant?: 'default' | 'map'
    allowExpansion?: boolean
}>();

const emit = defineEmits<{
    'location-selected': [coords: { lat: number, lng: number, address: string, validationResult?: { valid: boolean, message: string, hardInvalid?: boolean } }]
    'geolocate': [coords: { lat: number, lng: number }]
}>();

// State
const searchValue = ref('');
// Template ref for the AppInput component instance (separate from the string model)
const inputComponent = ref<{ $el?: HTMLElement } | null>(null);
const error = ref<string | null>(null);
const suggestions = ref<EnhancedGeocodingResult[]>([]);
const isLoading = ref(false);
const isDropdownOpen = ref(false);
const selectedIndex = ref<number>(-1);
const isFocused = ref(false); // Track input focus state
let searchTimeout: NodeJS.Timeout | null = null;
// Timer id for the blur-close delay; cleared on unmount and on re-focus to prevent stacking
let blurTimeout: ReturnType<typeof setTimeout> | null = null;

// Format address from result
const formatAddress = (address: GeocodingResult['address']) => {
    const parts = [];
    if (address.street) {
        const street = [address.street];
        if (address.houseNumber) {
            street.push(address.houseNumber);
        }
        parts.push(street.join(' '));
    }
    if (address.city) {
        const cityParts = [];
        if (address.postcode) {
            cityParts.push(address.postcode);
        }
        cityParts.push(address.city);
        parts.push(cityParts.join(' '));
    }
    if (parts.length === 0 && address.state) {
        parts.push(address.state);
    }
    return parts.join(', ') || t('report.form.location.unknown_location');
};

// Methods
const searchLocations = async (query: string) => {
    if (!query?.trim()) return;

    isLoading.value = true;
    error.value = null;

    try {
        await fetchBoundary();

        // Get client geocoding settings from runtime config
        const geocodingSettings = clientConfig.value.features?.geocoding;

        const searchOptions: any = {
            limit: 5,
            language: locale.value
        };

        // Bbox scopes search results to the jurisdiction area.
        // Priority: 1. Boundary-derived (auto-computed from GeoJSON),
        // 2. Legacy Drupal widget, 3. Client config
        if (boundaryBbox.value) {
            searchOptions.bbox = boundaryBbox.value;
        } else {
            const useBbox = geocodingSettings?.config?.mapbox?.options?.useBbox ?? false;
            if (useBbox) {
                if (config.value?.widget_settings?.limit_viewbox) {
                    searchOptions.bbox = config.value.widget_settings.limit_viewbox;
                } else if (geocodingSettings?.config?.mapbox?.options?.defaultBbox) {
                    searchOptions.bbox = geocodingSettings.config.mapbox.options.defaultBbox;
                }
            }
        }

        // Always use proximity bias from map center (jurisdiction-specific via API).
        // Priority: 1. Drupal center_lat/lng settings, 2. Current map center
        if (
            Number.isFinite(parseFloat(String(mapSettings.value?.center_lat))) &&
            Number.isFinite(parseFloat(String(mapSettings.value?.center_lng)))
        ) {
            searchOptions.centerPoint = {
                lat: parseFloat(String(mapSettings.value.center_lat)),
                lng: parseFloat(String(mapSettings.value.center_lng))
            };
        } else if (props.mapInstance) {
            const center = props.mapInstance.getCenter();
            searchOptions.centerPoint = {
                lat: center.lat,
                lng: center.lng
            };
        }

        // Country/region priority: 1. Drupal mapSettings (synced from jurisdiction),
        // 2. features.geocoding config, 3. legacy mapbox options
        const country = mapSettings.value?.geocoding_country ||
          geocodingSettings?.country ||
          geocodingSettings?.config?.mapbox?.options?.country;
        const region = mapSettings.value?.geocoding_region ||
          geocodingSettings?.region ||
          geocodingSettings?.config?.mapbox?.options?.region;

        if (region) {
            searchOptions.region = region;
        }
        if (country) {
            searchOptions.country = country;
        }

        const buildSuggestions = (results: GeocodingResult[]) => results
            .filter(result => shouldKeepGeocodingSuggestion(query, result))
            .map((result) => {
                // Postcode never gates a suggestion (coordinate fallback); only
                // the boundary result decides. See utils/locationValidation.ts.
                const validationResult = resolveLocationValidation(validateLocation(result.lat, result.lng));
                return { ...result, validationResult };
            })
            .filter((result): result is EnhancedGeocodingResult => result !== null);

        suggestions.value = buildSuggestions(await search(query, searchOptions));
    } catch (err: unknown) {
        console.error('Search error:', err);
        error.value = t('errors.search_failed');
        suggestions.value = [];
    } finally {
        isLoading.value = false;
    }
};

const handleInput = () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    selectedIndex.value = -1; // Reset selection when typing
    searchTimeout = setTimeout(() => searchLocations(searchValue.value), 300);
};

const handleFocus = () => {
    isFocused.value = true;
    // Cancel any pending blur-close so rapid focus/blur cycles don't stack timers
    if (blurTimeout !== null) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
    }
    isDropdownOpen.value = true;
    if (searchValue.value) searchLocations(searchValue.value);
};

const handleBlur = () => {
    isFocused.value = false;
    // Don't close dropdown immediately to allow clicking on suggestions.
    // Store the timer id so it can be cancelled on re-focus or unmount.
    if (blurTimeout !== null) clearTimeout(blurTimeout);
    blurTimeout = setTimeout(() => {
        isDropdownOpen.value = false;
        blurTimeout = null;
    }, 150);
};

const clearSearch = () => {
    searchValue.value = '';
    suggestions.value = [];
    error.value = null;
    isDropdownOpen.value = false;
    selectedIndex.value = -1;
};

// Helper function to preserve focus on the search input
const _preserveFocus = () => {
    // Use nextTick to ensure DOM updates are complete before focusing
    nextTick(() => {
        if (inputComponent.value?.$el) {
            // For Nuxt UI components, we need to access the actual input element
            const inputElement = inputComponent.value.$el.querySelector('input');
            if (inputElement) {
                inputElement.focus();
            }
        }
    });
};

const selectSuggestion = (suggestion: EnhancedGeocodingResult) => {
    const address = formatAddress(suggestion.address);
    searchValue.value = address;

    // Fly to location if map is available
    if (props.mapInstance) {
        props.mapInstance.flyTo({
            center: [suggestion.lng, suggestion.lat],
            zoom: 16,
            duration: 1000
        });
    }

    // Always emit location-selected, even if map isn't loaded yet
    // Parent component can store location and apply when map loads
    emit('location-selected', {
        lat: suggestion.lat,
        lng: suggestion.lng,
        address,
        validationResult: suggestion.validationResult
    });

    // Close dropdown
    suggestions.value = [];
    isDropdownOpen.value = false;
    selectedIndex.value = -1;
};

// Keyboard navigation handlers
const handleKeyDown = (event: KeyboardEvent) => {
    if (!suggestions.value.length || !isDropdownOpen.value) return;

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1);
            break;
        case 'ArrowUp':
            event.preventDefault();
            selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
            break;
        case 'Enter':
            event.preventDefault();
            if (selectedIndex.value >= 0 && selectedIndex.value < suggestions.value.length) {
                selectSuggestion(suggestions.value[selectedIndex.value]);
            }
            break;
        case 'Escape':
            event.preventDefault();
            clearSearch();
            break;
    }
};

// Geolocation functionality - uses centralized useGeolocation composable
const handleGeolocation = async () => {
    error.value = null;

    try {
        const { lat: latitude, lng: longitude } = await getCurrentPosition({ timeout: 10000 });

        // Emit geolocate event to trigger user location marker
        emit('geolocate', { lat: latitude, lng: longitude });

        // Validate location (boundary only; postcode never gates — route through
        // the single source of truth like the suggestion path does).
        const validationResult = resolveLocationValidation(validateLocation(latitude, longitude));

        // Get address from coordinates
        const result = await reverse(latitude, longitude);
        const address = result.displayName || formatAddress(result.address);

        searchValue.value = address;

        if (props.mapInstance) {
            props.mapInstance.flyTo({
                center: [longitude, latitude],
                zoom: 16,
                duration: 1000
            });
        }

        emit('location-selected', {
            lat: latitude,
            lng: longitude,
            address,
            validationResult
        });

        isDropdownOpen.value = false;
    } catch (err) {
        // Toast already handled by useGeolocation composable
        console.error('[LocationSearch] Geolocation failed:', err);
    }
};

onUnmounted(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (blurTimeout !== null) clearTimeout(blurTimeout);
});
</script>

<template>
  <div
    class="relative location-search"
    :class="[
      variant === 'map' ? 'w-full' : '',
      { 'location-input-expanded': isFocused && (allowExpansion !== false) },
    ]"
  >
    <div class="relative">
      <AppInput
        id="location-search"
        ref="inputComponent"
        v-model="searchValue"
        name="location-search"
        :placeholder="t('report.form.location.placeholder')"
        :aria-label="t('report.form.location.placeholder')"
        :loading="isLoading || geoIsLocating"
        :trailing="true"
        size="lg"
        class="text-base bg-white dark:bg-neutral-900 rounded-xl shadow-lg [&>input]:h-full [&>input]:!bg-white dark:[&>input]:!bg-neutral-900 [&>input]:focus:ring-2 [&>input]:focus:ring-neutral-300 dark:[&>input]:focus:ring-neutral-600 [&>input]:focus:border-neutral-300 dark:[&>input]:focus:border-neutral-600"
        role="combobox"
        :aria-expanded="isDropdownOpen && suggestions.length > 0"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls="location-suggestions-location-search"
        :aria-activedescendant="selectedIndex >= 0 ? `location-suggestion-location-search-${selectedIndex}` : undefined"
        autocomplete="off"
        :class="{ 'location-input-expanded': isFocused && (allowExpansion !== false) }"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeyDown"
      >
        <template #leading>
          <UIcon
            name="i-heroicons-map-pin"
            class="w-6 h-6 text-neutral-400"
          />
        </template>
        <template #trailing>
          <div class="flex items-center gap-1">
            <!-- Geolocation button -->
            <UButton
              v-if="!searchValue"
              class="relative z-10"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="t('map.controls.geolocation.label')"
              :disabled="geoIsLocating"
              @click="handleGeolocation"
            >
              <template #leading>
                <AppSpinner
                  v-if="geoIsLocating"
                  size="sm"
                />
                <CrosshairGps
                  v-else
                  class="w-4 h-4"
                />
              </template>
            </UButton>
            <!-- Clear button -->
            <UButton
              v-if="searchValue"
              class="relative z-10"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-x-mark"
              :aria-label="t('report.form.location.clear')"
              @click="clearSearch"
            />
          </div>
        </template>
      </AppInput>

      <!-- Suggestions container - always present for aria-controls -->
      <div
        id="location-suggestions-location-search"
        :role="suggestions.length > 0 && isDropdownOpen ? 'listbox' : undefined"
        :aria-label="suggestions.length > 0 && isDropdownOpen ? t('report.form.location.suggestions') : undefined"
        :class="suggestions.length > 0 && isDropdownOpen ? '' : 'sr-only'"
      >
        <!-- Shared Suggestions Dropdown -->
        <SuggestionsList
          v-if="suggestions.length > 0 && isDropdownOpen"
          :suggestions="suggestions"
          :selected-index="selectedIndex"
          field-id="location-search"
          max-height="max-h-60"
          @select="selectSuggestion"
        />
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

/* Base styles - relative positioning for normal flow */
.location-search {
  position: relative;
  width: 100%;
  transition: width 600ms ease-out;
  z-index: 1;
}

/* Expanded input styles - only absolute when expanded */
.location-search.location-input-expanded {
  position: absolute;
  left: 0;
  top: 0;
  width: 180%;
  max-width: 28rem;
  z-index: 10001;
}
</style>
