<script setup lang="ts">
/**
 * SuggestionsList Component
 *
 * Shared component for rendering location suggestions with validation
 * Used by both LocationInput and LocationSearch components
 */

interface GeocodingResult {
    lat: number
    lng: number
    displayName: string
    address: {
        street?: string
        houseNumber?: string
        housenumber?: string
        postcode?: string
        city?: string
        district?: string
        state?: string
        country?: string
    }
}

interface EnhancedGeocodingResult extends GeocodingResult {
    validationResult?: {
        valid: boolean
        message: string
    }
}

interface Props {
    suggestions: EnhancedGeocodingResult[]
    selectedIndex: number
    fieldId?: string
    maxHeight?: string
}

interface Emits {
    (e: 'select', suggestion: EnhancedGeocodingResult): void
}

const props = withDefaults(defineProps<Props>(), {
    fieldId: 'suggestions',
    maxHeight: 'max-h-60'
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

// Enhanced address formatting with structured display
const formatStructuredAddress = (address: GeocodingResult['address']) => {
    const street = address.street || '';
    const houseNumber = address.houseNumber || address.housenumber || '';
    const streetFull = [street, houseNumber].filter(Boolean).join(' ');
    const postcode = address.postcode || '';
    const city = address.city || '';
    const district = address.district || '';
    const state = address.state || '';

    const hasStreetAddress = Boolean(streetFull);

    return {
        street: streetFull,
        location: [postcode, city].filter(Boolean).join(' '),
        district: district,
        state: state,
        // Consider address complete if we have:
        // 1. Street + postcode + city (full address), OR
        // 2. Just city/district/state (administrative area)
        hasCompleteAddress: hasStreetAddress
            ? Boolean(postcode && city)
            : Boolean(city || district || state)
    };
};

// Handle suggestion selection
const selectSuggestion = (suggestion: EnhancedGeocodingResult) => {
    emit('select', suggestion);
};
</script>

<template>
  <div
    v-if="suggestions.length"
    :class="[
      'absolute z-[60] w-full mt-1 bg-[var(--ui-bg)] rounded-b-lg border border-[var(--ui-border)] shadow-xl overflow-hidden backdrop-blur-sm',
      maxHeight,
      'overflow-y-auto',
    ]"
  >
    <button
      v-for="(suggestion, index) in suggestions"
      :id="`location-suggestion-${fieldId}-${index}`"
      :key="`${suggestion.lat}-${suggestion.lng}`"
      :class="[
        'w-full text-left p-4 transition-all duration-150 focus:outline-none',
        // Ensure consistent styling for all items including last
        'border-0 rounded-none',
        index === selectedIndex
          ? 'bg-primary-100 dark:bg-primary-800 text-primary-900 dark:text-primary-100'
          : 'bg-[var(--ui-bg)] hover:bg-[var(--ui-bg-elevated)]/70',
        index < suggestions.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : 'border-b-0',
      ]"
      role="option"
      :aria-selected="index === selectedIndex"
      tabindex="-1"
      @mousedown="selectSuggestion(suggestion)"
    >
      <div class="flex items-start gap-3">
        <!-- Valid: decorative pin (visible message text below provides context). -->
        <UIcon
          v-if="suggestion.validationResult?.valid"
          name="i-heroicons-map-pin"
          class="w-5 h-5 mt-1 text-neutral-400"
          aria-hidden="true"
        />
        <!-- Invalid: warning carries meaning, expose via tooltip + sr-only sibling. -->
        <UTooltip
          v-else
          :text="t('report.form.location.warning')"
        >
          <span class="inline-flex">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-5 h-5 mt-1 text-amber-500"
              aria-hidden="true"
            />
            <span class="sr-only">{{ t('report.form.location.warning') }}</span>
          </span>
        </UTooltip>
        <div class="flex flex-col items-start min-w-0 flex-1">
          <!-- Enhanced structured address display -->
          <div class="w-full">
            <div class="flex items-center gap-2 mb-1">
              <!-- Street address - primary info -->
              <span class="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {{ formatStructuredAddress(suggestion.address).street || suggestion.displayName }}
              </span>
              <!-- Address completeness indicator: shape + color, not color alone (WCAG 1.4.1) -->
              <UTooltip
                v-if="formatStructuredAddress(suggestion.address).hasCompleteAddress"
                :text="t('report.form.location.complete_address')"
              >
                <span class="inline-flex items-center flex-shrink-0">
                  <UIcon
                    name="i-heroicons-check-circle"
                    class="size-4 text-green-500"
                    aria-hidden="true"
                  />
                  <span class="sr-only">{{ t('report.form.location.complete_address') }}</span>
                </span>
              </UTooltip>
            </div>

            <!-- Location info - secondary -->
            <div class="flex items-center gap-1 text-sm text-[var(--ui-text-muted)]">
              <UIcon
                name="i-heroicons-building-office-2"
                class="w-3 h-3 flex-shrink-0"
              />
              {{ formatStructuredAddress(suggestion.address).location }}
              <span
                v-if="formatStructuredAddress(suggestion.address).district"
                class="text-neutral-500"
              >
                • {{ formatStructuredAddress(suggestion.address).district }}
              </span>
            </div>
          </div>

          <!-- Enhanced validation message -->
          <div
            v-if="suggestion.validationResult?.message"
            class="mt-2 p-2 rounded-md border"
            :class="[
              suggestion.validationResult.valid
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50',
            ]"
          >
            <div class="flex items-start gap-2 text-xs font-medium">
              <span
                :class="[
                  suggestion.validationResult.valid
                    ? 'text-emerald-800 dark:text-emerald-200'
                    : 'text-amber-800 dark:text-amber-200',
                ]"
              >
                {{ suggestion.validationResult.message }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  </div>
</template>
