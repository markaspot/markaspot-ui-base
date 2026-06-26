<script setup lang="ts">
/**
 * LocationInput Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import { isEmbedRoutePath } from '~/utils/embedRoute';
import { shouldKeepGeocodingSuggestion } from '~/utils/geocodingSuggestions';
import { resolveLocationValidation } from '~/utils/locationValidation';

// Composables are auto-imported
const { clientConfig, jurisdiction } = useMarkASpotConfig();

const { t, locale } = useI18n();
const { settings } = useFormSettings();
const { search, reverse } = useGeocoding();
const { validateLocation, isLoading: boundaryIsLoading } = useBoundaryValidator();
const { settings: mapSettings, boundaryBbox, fetchBoundary } = useMarkASpotSettings();
const { getCurrentPosition: getGeoPosition, isLocating: geoIsLocating } = useGeolocation();
// Generate unique ID for this field instance (plain string, not computed, to avoid re-generation on re-render)
const fieldId = Math.random().toString(36).substring(2, 9);

const config = computed(() => settings.value?.fields.field_geolocation);

interface LocationValue {
    lat: number | string
    lng: number | string
    address?: {
        street?: string
        houseNumber?: string
        postcode?: string
        city?: string
        district?: string
        state?: string
        country?: string
        countryCode?: string
    }
    displayName?: string
}

interface GeocodingResult {
    lat: number
    lng: number
    displayName: string
    address: {
        street?: string
        houseNumber?: string
        housenumber?: string // Adding lowercase variant for compatibility
        postcode?: string
        city?: string
        district?: string
        state?: string
        country?: string
        countryCode?: string
    }
}

// Enhanced GeocodingResult with validation information
interface EnhancedGeocodingResult extends GeocodingResult {
    validationResult?: {
        valid: boolean
        message: string
        hardInvalid?: boolean
    }
}

const props = defineProps<{
    modelValue: LocationValue | null
    mapCenter?: {
        lat: number
        lng: number
        address?: string
    }
    required?: boolean
    triggeredFromAction?: boolean
    autoTriggerGeolocation?: boolean // External trigger for geolocation
    context?: 'inline' | 'modal' // 'modal' suppresses the "click on map" hint, since the map is occluded by the dialog
    hasInteracted?: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: LocationValue]
    'validation': [isValid: boolean]
    'pick-on-map': []
}>();

// State
const searchInput = ref('');
const suggestions = ref<EnhancedGeocodingResult[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted ?? false);
const selected = ref(false);
const validationMessage = ref<string>('');
const isLocationValid = ref<boolean>(true);
const selectedIndex = ref<number>(-1);
const programmaticallySet = ref(false); // Track if address was set programmatically
const pendingEdit = ref(false); // WBD #126: user typed an uncommitted address (no suggestion selected yet)
// Local coordinates to avoid reactivity timing issues with modelValue prop
const selectedCoordinates = ref<{ lat: number, lng: number } | null>(null);

// Computed to determine if validation panel should show
// Uses local state to avoid waiting for parent prop updates
const hasValidSelection = computed(() => {
    return selected.value && selectedCoordinates.value !== null;
});
const hasLocationValue = computed(() => Boolean(props.modelValue?.lat && props.modelValue?.lng));
const requiredError = computed(() => {
    if (!props.required || !hasUserInteracted.value || hasLocationValue.value) {
        return null;
    }

    return t('errors.validation.required_field', { field: t('fields.field_geolocation') });
});
const boundaryError = computed(() => {
    if (!hasValidSelection.value || isLocationValid.value) {
        return null;
    }

    return validationMessage.value || t('errors.validation.location_out_of_bounds');
});
const displayError = computed(() => error.value || requiredError.value || (hasUserInteracted.value ? boundaryError.value : null));
// The red error ring is reserved for hard errors (required, plus out-of-bounds
// after interaction — both folded into displayError). A pre-interaction,
// auto-detected out-of-bounds location surfaces as a soft amber advisory through
// UFormField's #help slot instead, so it must not turn the input red.
// UFormField owns the input's aria-invalid / aria-describedby natively (derived
// from its error/description/help props), so we no longer forward our own.
const inputInvalid = computed(() => Boolean(displayError.value));

// MUC-only: enable "Pick on map" button via client config
const enablePickOnMap = computed(() => {
    return clientConfig.value.features?.forms?.pickOnMapButton === true;
});

const descriptionKey = computed(() => {
    return props.context === 'modal'
        ? 'report.form.location.help_modal'
        : 'report.form.location.help';
});

// Map pick composable
const mapPick = useMapPick();

// Router and store - initialize at top level for proper SSR
const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();

// Start pick mode with current location pre-selected if available
const startPickMode = () => {
    // Dashboard or embed context: emit event for parent to handle modal
    if (route.path.includes('/dashboard') || isEmbedRoutePath(route.path)) {
        emit('pick-on-map');
        return;
    }

    // Get current coordinates if available
    const coords = props.modelValue?.lat && props.modelValue?.lng
        ? { lat: Number(props.modelValue.lat), lng: Number(props.modelValue.lng) }
        : undefined;

    // Check if we're on mobile report page - need to navigate to map
    // Use route param first, fall back to jurisdiction slug from config state
    // (on CivicSpot, /report has no slug in URL but config knows the jurisdiction)
    const jur = route.params.jurisdiction || jurisdiction.value?.slug;
    const isReportPage = route.path.endsWith('/report') || route.path === '/report';
    if (isReportPage) {
        // Preserve current route with all query parameters for return navigation
        const returnRoute = {
            path: jur ? `/${jur}/report` : '/report',
            query: { ...route.query } as Record<string, string>
        };

        // Store pick mode state and navigate to map (preserve jurisdiction context)
        uiStore.startMapPickMode(coords, returnRoute);
        router.push(jur ? `/${jur}/` : '/');
        return;
    }

    // Desktop or already on map - start pick mode directly
    mapPick.start(coords);
};
const formatAddress = (address: GeocodingResult['address']): string => {
    const parts = [];

    // Street with house number (primary info)
    if (address.street) {
        const street = [address.street];
        // Check both camelCase and lowercase property names for house numbers
        const houseNumber = address.houseNumber || address.housenumber;
        if (houseNumber) {
            street.push(houseNumber);
        }
        parts.push(street.join(' '));
    }

    // Postal code and city (secondary info)
    if (address.city) {
        if (address.postcode) {
            parts.push(`${address.postcode} ${address.city}`);
        } else {
            parts.push(address.city);
        }
    }

    // State as fallback
    if (parts.length === 0 && address.state) {
        parts.push(address.state);
    }

    return parts.join(', ') || 'Unknown location';
};

// Calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

// Build the geocoding search options (bbox / proximity / country) shared by the
// debounced autocomplete and the on-blur resolver, so both scope results
// identically to the jurisdiction.
const buildSearchOptions = async () => {
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
    // Priority: 1. mapCenter prop, 2. Drupal center_lat/lng settings
    if (Number.isFinite(props.mapCenter?.lat) && Number.isFinite(props.mapCenter?.lng)) {
        searchOptions.centerPoint = {
            lat: props.mapCenter.lat,
            lng: props.mapCenter.lng
        };
    } else if (
        Number.isFinite(parseFloat(String(mapSettings.value?.center_lat))) &&
        Number.isFinite(parseFloat(String(mapSettings.value?.center_lng)))
    ) {
        searchOptions.centerPoint = {
            lat: parseFloat(String(mapSettings.value.center_lat)),
            lng: parseFloat(String(mapSettings.value.center_lng))
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

    return searchOptions;
};

// Map raw geocoding results to enhanced suggestions with boundary validation.
const buildSuggestions = (query: string, results: GeocodingResult[]) => results
    .filter(result => shouldKeepGeocodingSuggestion(query, result))
    .map((result) => {
        // Postcode never gates a suggestion (coordinate fallback); only
        // the boundary result decides. See utils/locationValidation.ts.
        const validationResult = resolveLocationValidation(validateLocation(result.lat, result.lng));
        return { ...result, validationResult };
    })
    .filter((result): result is EnhancedGeocodingResult => result !== null);

// Debounced search function
const searchLocation = useDebounceFn(async (query: string) => {
    if (!query?.trim()) {
        suggestions.value = [];
        return;
    }

    isLoading.value = true;
    error.value = null;

    try {
        const searchOptions = await buildSearchOptions();
        suggestions.value = buildSuggestions(query, await search(query, searchOptions));
    } catch (err) {
        console.error('Error during location search:', err);
        error.value = t('report.form.location.error');
        suggestions.value = [];
    } finally {
        isLoading.value = false;
    }
}, 300);

// WBD #126: when the user types an address correction but never selects a
// suggestion (i.e. never commits), the previously committed — now stale —
// location would otherwise be submitted. On blur we resolve the typed text so
// the visible input and the submitted address/coordinates can never diverge.
const resolveTypedAddressOnBlur = async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    // Capture the suggestion the user currently sees BEFORE any await — handleBlur
    // clears the list right after invoking us. The dropdown's top entry is the
    // best match and exactly what the user would have picked, so we commit it.
    let candidate = suggestions.value[0];

    isLoading.value = true;
    error.value = null;
    try {
        // Fallback only if the dropdown had not populated yet (typed-and-blurred
        // faster than the debounced search): run a direct lookup.
        if (!candidate) {
            const searchOptions = await buildSearchOptions();
            candidate = buildSuggestions(query, await search(query, searchOptions))[0];
        }
        if (candidate) {
            // Commit exactly like a manual selection: updates address, coords,
            // displayName, validation, and the visible text to the resolved form.
            // If the top match is out of boundary, selectSuggestion surfaces the
            // boundary warning (correct) rather than silently committing it.
            selectSuggestion(candidate);
        } else if (props.modelValue?.lat && props.modelValue?.lng) {
            // No geocode match: keep the coordinates (do not block the report)
            // but drop the stale structured address so it is never sent
            // downstream, and carry the user's typed text as displayName.
            emit('update:modelValue', {
                lat: props.modelValue.lat,
                lng: props.modelValue.lng,
                address: undefined,
                displayName: query
            });
        }
    } catch (err) {
        console.error('Error during on-blur address resolution:', err);
    } finally {
        isLoading.value = false;
        pendingEdit.value = false;
    }
};
const getCurrentLocation = async () => {
    error.value = null;
    pendingEdit.value = false; // GPS commits a location; cancel any pending typed edit

    try {
        // Use centralized geolocation composable (handles deduplication and toast)
        const { lat: latitude, lng: longitude } = await getGeoPosition({ timeout: 5000 });

        try {
            const result = await reverse(latitude, longitude);
            programmaticallySet.value = true; // Mark as programmatically set
            searchInput.value = formatAddress(result.address);
            selected.value = true;
            selectedCoordinates.value = { lat: latitude, lng: longitude };

            // Validate the location
            const validationResult = validateLocation(latitude, longitude);
            validationMessage.value = validationResult.message;
            isLocationValid.value = validationResult.valid;

            // Emit after we have everything ready
            emit('update:modelValue', {
                lat: latitude,
                lng: longitude,
                address: result.address,
                displayName: result.displayName
            });
            // Emit validation state
            emit('validation', isLocationValid.value);
        } catch (reverseError) {
            console.error('Error during reverse geocoding:', reverseError);
            programmaticallySet.value = true; // Mark as programmatically set
            searchInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            selected.value = true;
            selectedCoordinates.value = { lat: latitude, lng: longitude };

            // Validate the location even if reverse geocoding failed
            const validationResult = validateLocation(latitude, longitude);
            validationMessage.value = validationResult.message;
            isLocationValid.value = validationResult.valid;

            emit('update:modelValue', {
                lat: latitude,
                lng: longitude,
                // No address data available if reverse geocoding failed
                address: undefined,
                displayName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
            // Emit validation state even if reverse geocoding failed
            emit('validation', isLocationValid.value);
        }
    } catch (err: unknown) {
        // Toast is already handled by useGeolocation composable
        console.error('[LocationInput] Geolocation failed:', err);
    }
};
watch(searchInput, (newValue) => {
    // Don't show autocomplete if location is selected or was set programmatically
    if (!selected.value && !programmaticallySet.value && newValue?.trim()) {
        searchLocation(newValue);
    } else {
        suggestions.value = [];
    }
    // Reset selected index when search changes
    selectedIndex.value = -1;
});

// Store the current selected location for proximity-based filtering
const currentLocationCoords = ref<{ lat: number, lng: number } | null>(null);

// Input handler - handle user typing over existing location
const handleInput = (event: Event) => {
    hasUserInteracted.value = true;
    const target = event.target as HTMLInputElement;
    const newValue = target.value;

    // If user clears the input completely, clear the location
    if (!newValue.trim()) {
        selected.value = false;
        programmaticallySet.value = false;
        pendingEdit.value = false;
        suggestions.value = [];
        selectedIndex.value = -1;
        currentLocationCoords.value = null;
        emit('update:modelValue', { lat: '', lng: '' });
        emit('validation', false);
        return;
    }

    // If user is editing a selected location, allow the search but mark it as refinement
    if (selected.value || programmaticallySet.value) {
        selected.value = false;
        programmaticallySet.value = false;
        // Don't clear currentLocationCoords - we'll use it for proximity filtering
    }

    // WBD #126: typed text that has not been committed via a suggestion/GPS/map
    // pick. handleBlur resolves this so a stale location can never be submitted.
    pendingEdit.value = true;
};

// Focus handler - only prepare for editing, don't clear immediately
const handleFocus = () => {
    // Reset selected index for keyboard navigation
    selectedIndex.value = -1;

    // If this was programmatically set, prepare for user input
    if (programmaticallySet.value) {
        programmaticallySet.value = false;
    }

    // Don't clear the input or location data on focus
    // Only clear when user actually starts typing (handled in handleInput)
};

// Blur handler - hide suggestions when field loses focus
const handleBlur = () => {
    hasUserInteracted.value = true;
    // Use setTimeout to allow click events on suggestions to fire first
    setTimeout(() => {
        // WBD #126: the user typed a correction but never committed it (no
        // suggestion click, GPS, or map pick cleared pendingEdit). Resolve it
        // now so the submitted address matches what is shown in the field.
        if (pendingEdit.value && !selected.value && searchInput.value.trim()) {
            void resolveTypedAddressOnBlur();
        }
        suggestions.value = [];
        selectedIndex.value = -1;
    }, 150);
};

// Keyboard navigation handlers
const handleKeyDown = (event: KeyboardEvent) => {
    // Always prevent default for arrow keys to stop window scrolling
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
    }

    // Only handle navigation if we have suggestions
    if (!suggestions.value.length) return;

    switch (event.key) {
        case 'ArrowDown':
            selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1);
            break;
        case 'ArrowUp':
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
            suggestions.value = [];
            selectedIndex.value = -1;
            break;
    }
};

const clearSearch = () => {
    hasUserInteracted.value = true;
    searchInput.value = '';
    selected.value = false;
    programmaticallySet.value = false; // Reset programmatically set flag
    pendingEdit.value = false;
    suggestions.value = [];
    error.value = null;
    validationMessage.value = '';
    isLocationValid.value = true;
    selectedIndex.value = -1;

    // Also clear the location data when clearing the search
    emit('update:modelValue', { lat: '', lng: '' });
    // Emit validation state
    emit('validation', false);
};

const selectSuggestion = (suggestion: EnhancedGeocodingResult) => {
    hasUserInteracted.value = true;
    selected.value = true;
    programmaticallySet.value = false; // Reset flag when user manually selects
    pendingEdit.value = false; // committed via selection — nothing pending to resolve
    searchInput.value = formatAddress(suggestion.address);
    // Store coordinates locally for immediate reactivity
    selectedCoordinates.value = { lat: suggestion.lat, lng: suggestion.lng };

    // Store validation information from the suggestion
    if (suggestion.validationResult) {
        validationMessage.value = suggestion.validationResult.message;
        isLocationValid.value = suggestion.validationResult.valid;
    } else {
    // If for some reason we don't have validation results, validate now
        const validationResult = validateLocation(suggestion.lat, suggestion.lng);
        validationMessage.value = validationResult.message;
        isLocationValid.value = validationResult.valid;
    }

    emit('update:modelValue', {
        lat: suggestion.lat,
        lng: suggestion.lng,
        address: suggestion.address,
        displayName: suggestion.displayName
    });

    // Emit validation state whenever a location is selected
    emit('validation', isLocationValid.value);
    suggestions.value = [];
    selectedIndex.value = -1;
};

const clearLocation = () => {
    hasUserInteracted.value = true;
    emit('update:modelValue', { lat: '', lng: '' });
    clearSearch();
    validationMessage.value = '';
    isLocationValid.value = true;
    programmaticallySet.value = false; // Reset flag when location is cleared
    selectedCoordinates.value = null; // Clear local coordinates

    // Emit validation state when location is cleared
    emit('validation', false);
};

// Expose a method to reset the component from parent components
const resetLocationInput = () => {
    searchInput.value = '';
    selected.value = false;
    programmaticallySet.value = false;
    pendingEdit.value = false;
    suggestions.value = [];
    selectedIndex.value = -1;
    validationMessage.value = '';
    isLocationValid.value = true;
    selectedCoordinates.value = null; // Clear local coordinates
    error.value = null;
    emit('update:modelValue', { lat: '', lng: '' });
    emit('validation', false);
};

// Expose the reset method for parent components
defineExpose({
    resetLocationInput
});

// Watch for modelValue changes to handle reverse geocoding
watch(() => props.modelValue, async (newValue, oldValue) => {
    // First check: if displayName is provided (even without coordinates), use it
    // This handles edit forms where we have an address string but no geocoded coordinates
    if (newValue?.displayName && newValue.displayName !== searchInput.value) {
        programmaticallySet.value = true;
        searchInput.value = newValue.displayName;
        selected.value = false; // Not fully selected without coordinates
        selectedCoordinates.value = null;

        // If we also have valid coordinates, validate them
        if (newValue.lat && newValue.lng) {
            selected.value = true;
            selectedCoordinates.value = { lat: Number(newValue.lat), lng: Number(newValue.lng) };
            const validationResult = validateLocation(Number(newValue.lat), Number(newValue.lng));
            validationMessage.value = validationResult.message;
            isLocationValid.value = validationResult.valid;
            emit('validation', isLocationValid.value);

            // Fallback: if coordinates are set but no structured address object,
            // reverse geocode to populate it (needed for field_address in Drupal)
            if (!newValue.address) {
                try {
                    const result = await reverse(Number(newValue.lat), Number(newValue.lng));
                    if (result.address) {
                        emit('update:modelValue', {
                            lat: newValue.lat,
                            lng: newValue.lng,
                            address: result.address,
                            displayName: newValue.displayName
                        });
                    }
                } catch (e) {
                    console.warn('[LocationInput] Failed to reverse geocode for structured address:', e);
                }
            }
        }
        return;
    }

    // Check if the modelValue was cleared (form reset)
    if (!newValue?.lat || !newValue?.lng ||
      newValue.lat === '' || newValue.lng === '') {
        // Only reset if we previously had a location (avoid initial state reset)
        if (oldValue && (oldValue.lat || oldValue.lng) &&
          (oldValue.lat !== '' || oldValue.lng !== '')) {
            // Reset internal state when location is cleared
            searchInput.value = '';
            selected.value = false;
            programmaticallySet.value = false;
            suggestions.value = [];
            selectedIndex.value = -1;
            validationMessage.value = '';
            isLocationValid.value = true;
            selectedCoordinates.value = null;
            error.value = null;
        }
        return;
    }

    // If displayName is provided and different from current, use it directly
    if (newValue.displayName && newValue.displayName !== searchInput.value) {
        programmaticallySet.value = true;
        searchInput.value = newValue.displayName;
        selected.value = true;
        selectedCoordinates.value = { lat: Number(newValue.lat), lng: Number(newValue.lng) };

        // Validate the location coordinates
        const validationResult = validateLocation(Number(newValue.lat), Number(newValue.lng));
        validationMessage.value = validationResult.message;
        isLocationValid.value = validationResult.valid;
        emit('validation', isLocationValid.value);

        // Fallback: if a parent emits coords + displayName but no structured
        // address object, reverse geocode so field_address can be populated.
        // Mirrors the no-searchInput branch above; covers the case where a
        // displayName was set externally (e.g. coordinate-string fallback in
        // locate-me) without going through the geocoder.
        if (!newValue.address) {
            try {
                const result = await reverse(Number(newValue.lat), Number(newValue.lng));
                if (result.address) {
                    emit('update:modelValue', {
                        lat: newValue.lat,
                        lng: newValue.lng,
                        address: result.address,
                        displayName: newValue.displayName
                    });
                }
            } catch (e) {
                console.warn('[LocationInput] Failed to reverse geocode for structured address:', e);
            }
        }
        return;
    }

    if (!searchInput.value) {
        // Otherwise, reverse geocode to get the address
        isLoading.value = true;
        try {
            const result = await reverse(Number(newValue.lat), Number(newValue.lng));
            programmaticallySet.value = true; // Mark as programmatically set from reverse geocoding
            searchInput.value = formatAddress(result.address);
            selected.value = true; // Mark as selected to prevent autocomplete
            selectedCoordinates.value = { lat: Number(newValue.lat), lng: Number(newValue.lng) };

            // Validate the location coordinates
            const validationResult = validateLocation(Number(newValue.lat), Number(newValue.lng));
            validationMessage.value = validationResult.message;
            isLocationValid.value = validationResult.valid;

            // Update the model value to include address data if we don't have it yet
            if (!newValue.address && result.address) {
                emit('update:modelValue', {
                    lat: newValue.lat,
                    lng: newValue.lng,
                    address: result.address,
                    displayName: result.displayName
                });
            }

            // Emit validation state when coordinates are validated
            emit('validation', isLocationValid.value);
        } catch (error) {
            console.error('Error during reverse geocoding:', error);
            // Don't try to format invalid coordinates

            // Still validate the coordinates
            const validationResult = validateLocation(Number(newValue.lat), Number(newValue.lng));
            validationMessage.value = validationResult.message;
            isLocationValid.value = validationResult.valid;

            // Emit validation state even if reverse geocoding fails
            emit('validation', isLocationValid.value);
        } finally {
            isLoading.value = false;
        }
    }
}, { immediate: true });

watch(() => props.hasInteracted, (newValue) => {
    if (newValue) {
        hasUserInteracted.value = true;
    }
});

// Initialize with map center if available
// Initialize with map center if available
// Watch for autoTriggerGeolocation prop changes
watch(() => props.autoTriggerGeolocation, async (shouldTrigger) => {
    if (shouldTrigger &&
      clientConfig.value.features?.forms?.autoTriggerGeolocation &&
      !props.modelValue?.lat &&
      !props.modelValue?.lng &&
      !searchInput.value) {
        // Auto-trigger geolocation when requested
        await getCurrentLocation();
    }
}, { immediate: false });

// Re-validate location when boundary data finishes loading (e.g., after jurisdiction change)
watch(boundaryIsLoading, (loading) => {
    if (!loading && selectedCoordinates.value) {
        const validationResult = validateLocation(selectedCoordinates.value.lat, selectedCoordinates.value.lng);
        validationMessage.value = validationResult.message;
        isLocationValid.value = validationResult.valid;
        emit('validation', isLocationValid.value);
    }
});

// Listen for map pick results
let unsubscribeMapPick: (() => void) | undefined;
onUnmounted(() => {
    unsubscribeMapPick?.();
});

onMounted(async () => {
    // Set up map pick listener (one-shot per mount, cleaned up on unmount)
    unsubscribeMapPick = mapPick.onPicked((result) => {
        // Update the input field and model value
        programmaticallySet.value = true;
        searchInput.value = result.address;
        selected.value = true;
        selectedCoordinates.value = { lat: result.lat, lng: result.lng };

        // Store validation information
        if (result.validationResult) {
            validationMessage.value = result.validationResult.message;
            isLocationValid.value = result.validationResult.valid;
        } else {
            // Validate the location if validation result is not provided
            const validationResult = validateLocation(result.lat, result.lng);
            validationMessage.value = validationResult.message;
            isLocationValid.value = validationResult.valid;
        }

        // Emit the update to parent component
        emit('update:modelValue', {
            lat: result.lat,
            lng: result.lng,
            address: result.addressObj,
            displayName: result.address
        });

        // Emit validation state
        emit('validation', isLocationValid.value);
    });

    // Only proceed if we have mapCenter, no existing coordinates, and this was triggered from an action
    if (props.mapCenter &&
      !props.modelValue?.lat &&
      !props.modelValue?.lng &&
      props.triggeredFromAction) {
    // If we have an address, use it directly
        if (props.mapCenter.address) {
            programmaticallySet.value = true; // Mark as programmatically set from map center
            searchInput.value = props.mapCenter.address;
            selected.value = true;
            selectedCoordinates.value = { lat: props.mapCenter.lat, lng: props.mapCenter.lng };

            // Validate the location from map center
            const validationResult = validateLocation(props.mapCenter.lat, props.mapCenter.lng);
            validationMessage.value = validationResult.message;
            isLocationValid.value = validationResult.valid;

            emit('update:modelValue', {
                lat: props.mapCenter.lat,
                lng: props.mapCenter.lng,
                displayName: props.mapCenter.address
            });
            return; // Exit early
        }

        // Validate coordinates before trying reverse geocoding
        if (typeof props.mapCenter.lat === 'number' &&
          typeof props.mapCenter.lng === 'number' &&
          !isNaN(props.mapCenter.lat) &&
          !isNaN(props.mapCenter.lng)) {
            isLoading.value = true;
            try {
                const result = await reverse(props.mapCenter.lat, props.mapCenter.lng);
                programmaticallySet.value = true; // Mark as programmatically set from reverse geocoding
                searchInput.value = formatAddress(result.address);
                selected.value = true;
                selectedCoordinates.value = { lat: props.mapCenter.lat, lng: props.mapCenter.lng };

                // Validate the location from map center
                const validationResult = validateLocation(props.mapCenter.lat, props.mapCenter.lng);
                validationMessage.value = validationResult.message;
                isLocationValid.value = validationResult.valid;

                emit('update:modelValue', {
                    lat: props.mapCenter.lat,
                    lng: props.mapCenter.lng,
                    address: result.address,
                    displayName: result.displayName
                });

                // Emit validation state
                emit('validation', isLocationValid.value);
            } catch (error) {
                console.error('Error during reverse geocoding:', error);

                // Still validate the coordinates even if reverse geocoding failed
                const validationResult = validateLocation(props.mapCenter.lat, props.mapCenter.lng);
                validationMessage.value = validationResult.message;
                isLocationValid.value = validationResult.valid;

                // Emit validation state even if reverse geocoding failed
                emit('validation', isLocationValid.value);
            } finally {
                isLoading.value = false;
            }
        }
    }
});
</script>

<template>
  <div class="space-y-4">
    <div class="relative">
      <UFormField
        :label="t('report.form.location.label')"
        :required="required"
        :description="t(descriptionKey)"
        :error="displayError"
        :help="boundaryError && !displayError ? boundaryError : undefined"
      >
        <!-- Search Input -->
        <AppInput
          :id="`location-field-${fieldId}`"
          v-model="searchInput"
          variant="outline"
          size="md"
          :name="`location-field-${fieldId}`"
          :placeholder="t('report.form.location.placeholder')"
          :loading="isLoading || geoIsLocating"
          :state="inputInvalid ? 'error' : undefined"
          :trailing="true"
          :aria-required="required"
          class="w-full"
          :aria-label="t('report.form.location.label')"
          :aria-expanded="!selected && suggestions.length > 0"
          :aria-controls="`location-suggestions-${fieldId}`"
          :aria-activedescendant="selectedIndex >= 0 ? `location-suggestion-${fieldId}-${selectedIndex}` : undefined"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          autocomplete="off"
          @keydown="handleKeyDown"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
        >
          <!-- Leading Icon -->
          <template #leading>
            <UIcon
              name="i-heroicons-map-pin"
              class="w-5 h-5 text-neutral-400"
              aria-hidden="true"
            />
          </template>

          <!-- Trailing Buttons -->
          <template #trailing>
            <div class="flex items-center gap-1">
              <!-- Geolocation button -->
              <UButton
                v-if="!searchInput"
                class="relative z-5"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="t('map.controls.geolocation.label')"
                :disabled="geoIsLocating"
                @click="getCurrentLocation"
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
              <!-- Valid location indicator -->
              <UIcon
                v-if="hasValidSelection && isLocationValid"
                name="i-heroicons-check-circle"
                class="w-5 h-5 text-emerald-500 dark:text-emerald-400"
                aria-hidden="true"
              />
              <!-- Clear button -->
              <UButton
                v-if="searchInput"
                class="relative z-10"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-x-mark"
                :aria-label="t('report.form.location.clear')"
                @click="clearSearch"
              />
            </div>
          </template>
        </AppInput>

        <!-- Suggestions Dropdown Container -->
        <div
          :id="`location-suggestions-${fieldId}`"
          role="listbox"
          :aria-labelledby="`location-field-${fieldId}`"
          :aria-hidden="selected || suggestions.length === 0"
        >
          <SuggestionsList
            v-if="!selected && suggestions.length"
            :suggestions="suggestions"
            :selected-index="selectedIndex"
            :field-id="fieldId"
            @select="selectSuggestion"
          />
        </div>
        <!-- Soft, non-blocking boundary advisory. Lives in the field's #help
             slot so UFormField links it to the input via aria-describedby
             natively (the external sibling it replaces was never associated).
             The :help prop above is what drives that native association; this
             slot only supplies the amber styling. After interaction an
             out-of-bounds location escalates to a hard error via displayError,
             so both are gated on `boundaryError && !displayError`. -->
        <template
          v-if="boundaryError && !displayError"
          #help
        >
          <span
            class="flex items-center gap-2 text-amber-700 dark:text-amber-400"
            aria-live="polite"
          >
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-3.5 h-3.5 flex-shrink-0"
              aria-hidden="true"
            />
            {{ boundaryError }}
          </span>
        </template>
      </UFormField>

      <!-- Pick on map - directly below input -->
      <div
        v-if="enablePickOnMap && modelValue?.lat && modelValue?.lng"
        class="mt-1.5"
      >
        <UButton
          type="button"
          size="md"
          color="neutral"
          variant="link"
          icon="i-heroicons-cursor-arrow-rays"
          :padded="false"
          @click.prevent.stop="startPickMode"
        >
          {{ t('report.form.location.pick_on_map') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fix pointer events for trailing slot buttons */
:deep(input[role="combobox"]) {
  padding-right: 4rem !important; /* Make room for buttons */
}

:deep(.pointer-events-none) {
  pointer-events: auto !important;
}
</style>
