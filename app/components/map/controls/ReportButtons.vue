<template>
  <div
    id="report-actions"
    :class="[
      config?.classes || 'w-[280px]',
      tooltipVisible ? 'opacity-0 pointer-events-none' : 'opacity-100',
    ]"
    class="flex flex-col gap-2 transition-opacity duration-300"
  >
    <!-- Location Search with Language Switcher (when multiple languages) -->
    <div
      v-if="!compact && hasMultipleLocales"
      class="flex gap-2 mb-2 items-stretch relative"
    >
      <div class="flex-1 min-w-0 relative">
        <LocationSearch
          :map-instance="mapInstance"
          variant="map"
          :allow-expansion="true"
          @location-selected="handleLocationSelect"
          @geolocate="(coords) => $emit('geolocate', coords)"
        />
      </div>
      <div class="flex-shrink-0 h-full relative z-[10000]">
        <LanguageSwitcherCompact />
      </div>
    </div>
    <!-- Location Search alone (single language) -->
    <div
      v-else-if="!compact"
      class="mb-2"
    >
      <LocationSearch
        :map-instance="mapInstance"
        variant="map"
        :allow-expansion="true"
        @location-selected="handleLocationSelect"
        @geolocate="(coords) => $emit('geolocate', coords)"
      />
    </div>

    <!-- Foto-Report Button - only shown when photo reporting is enabled and button is not explicitly disabled -->
    <button
      v-if="canSubmit && photoReportAvailable && actionButtonsConfig.photo?.enabled !== false && embedConfig?.value?.photoButton !== false"
      :class="['w-full flex items-center gap-3 px-4 py-4 rounded-xl shadow-lg focus:outline-none focus:ring-2 transition-all focus-ring-thick', photoButtonClass]"
      type="button"
      :aria-label="photoButtonLabel"
      :title="photoButtonLabel"
      v-on="photoHoverHandlers"
      @click="$emit('report', 'photo')"
    >
      <UIcon
        :class="['w-5 h-5', photoTextClass]"
        name="i-heroicons-camera"
      />
      <span :class="['font-medium', photoTextClass]">
        {{ photoButtonLabel }}
      </span>
      <span
        v-if="photoReportAvailable"
        class="ml-auto text-sm bg-white/50 px-2 py-0.5 rounded-full text-black"
      >
        {{ t('report.ai.label') }}
      </span>
    </button>

    <!-- Classic Report Button - only shown when not explicitly disabled -->
    <button
      v-if="canSubmit && actionButtonsConfig.classic?.enabled !== false && embedConfig?.value?.classicButton !== false && clientConfig.features?.classicReporting !== false"
      :class="['w-full flex items-center gap-3 px-4 py-4 rounded-xl shadow-lg focus:outline-none focus:ring-2 transition-all', classicButtonClass]"
      type="button"
      :aria-label="classicButtonLabel"
      :title="classicButtonLabel"
      v-on="classicHoverHandlers"
      @click="$emit('report', 'classic')"
    >
      <UIcon
        :class="['w-5 h-5', classicTextClass]"
        name="i-heroicons-document-text"
      />
      <span :class="['font-medium', classicTextClass]">
        {{ classicButtonLabel }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * ReportButtons Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

// Type imports still needed
import type { Map } from 'maplibre-gl';

/** iOS non-standard PWA standalone flag — not in the standard Navigator type. */
declare global {
    interface Navigator {
        standalone?: boolean
    }
}

const { t } = useI18n();

// Embed config (provided by embed pages/layouts, null outside embed context)
const embedConfig = inject<Ref<{ photoButton?: boolean, classicButton?: boolean, photoLabel?: string, classicLabel?: string }> | null>('embedConfig', null);
const {
    primaryButtonClass,
    secondaryButtonClass,
    primaryTextClass,
    secondaryTextClass,
    primaryHoverHandlers,
    secondaryHoverHandlers
} = useButtonColors('main');

// Check if multiple languages are available (to conditionally show language switcher)
const { availableLocales } = useLanguage();
const hasMultipleLocales = computed(() => (availableLocales.value?.length || 0) > 1);

// Runtime feature flag (per-jurisdiction, comes from field_nuxt_config).
const { photoReportAvailable } = useFeatureFlags();

// Workspace visibility check
const { canSubmit } = useWorkspaceVisibility();

// Get action button configuration
const { clientConfig } = useMarkASpotConfig();
const actionButtonsConfig = computed(() => {
    return clientConfig.value.features?.actionButtons || {
        primaryButton: 'classic',
        photo: { enabled: false, priority: 'secondary' },
        classic: { enabled: true, priority: 'primary' }
    };
});

// Determine button priorities based on configuration
const photoButtonPriority = computed(() => {
    // First check explicit priority configuration
    if (actionButtonsConfig.value.photo?.priority) {
        return actionButtonsConfig.value.photo.priority;
    }
    // Fall back to primaryButton configuration
    return actionButtonsConfig.value.primaryButton === 'photo' ? 'primary' : 'secondary';
});

const classicButtonPriority = computed(() => {
    // First check explicit priority configuration
    if (actionButtonsConfig.value.classic?.priority) {
        return actionButtonsConfig.value.classic.priority;
    }
    // Fall back to primaryButton configuration
    return actionButtonsConfig.value.primaryButton === 'classic' ? 'primary' : 'secondary';
});

// Compute button classes based on priorities
const photoButtonClass = computed(() => {
    return photoButtonPriority.value === 'primary' ? primaryButtonClass.value : secondaryButtonClass.value;
});

const photoTextClass = computed(() => {
    return photoButtonPriority.value === 'primary' ? primaryTextClass.value : secondaryTextClass.value;
});

const classicButtonClass = computed(() => {
    return classicButtonPriority.value === 'primary' ? primaryButtonClass.value : secondaryButtonClass.value;
});

const classicTextClass = computed(() => {
    return classicButtonPriority.value === 'primary' ? primaryTextClass.value : secondaryTextClass.value;
});

// Compute hover handlers based on priorities
const photoHoverHandlers = computed(() => {
    return photoButtonPriority.value === 'primary' ? primaryHoverHandlers : secondaryHoverHandlers;
});

const classicHoverHandlers = computed(() => {
    return classicButtonPriority.value === 'primary' ? primaryHoverHandlers : secondaryHoverHandlers;
});

// Label resolution: embed config > client config > i18n
const photoButtonLabel = computed(() => {
    return embedConfig?.value?.photoLabel ||
      actionButtonsConfig.value.photo?.label ||
      t('report.buttons.photo');
});

const classicButtonLabel = computed(() => {
    return embedConfig?.value?.classicLabel ||
      actionButtonsConfig.value.classic?.label ||
      t('report.buttons.classic');
});

// iOS fullscreen with notch/island detection
const fullscreenWithIsland = ref(false);

const checkFullscreenIsland = () => {
    // Check if the device is iOS
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Check if in standalone mode (PWA)
    const isStandalone = window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Look for environment safe area inset presence
    const hasSafeAreaInset = CSS.supports('padding-top: env(safe-area-inset-top)') &&
      getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') !== '0px';

    // Only apply if: iOS device + standalone mode + has safe area insets
    fullscreenWithIsland.value = isIOS && isStandalone && hasSafeAreaInset;
};

onMounted(() => {
    // Initial check for notch/island
    checkFullscreenIsland();

    // Add event listeners for resize and orientation changes
    window.addEventListener('resize', checkFullscreenIsland);
    window.addEventListener('orientationchange', checkFullscreenIsland);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkFullscreenIsland);
    window.removeEventListener('orientationchange', checkFullscreenIsland);
});

// Props
const props = defineProps<{
    mapInstance: Map | null
    tooltipVisible?: boolean
    /** Hide LocationSearch & LanguageSwitcher, show only buttons (for embed overlay) */
    compact?: boolean
    config?: {
        classes?: string
    }
}>();

const emit = defineEmits<{
    'report': [type: 'photo' | 'classic']
    'update:location': [locationData: { lat: number, lng: number, address?: string }]
    'geolocate': [coords: { lat: number, lng: number }]
}>();

const handleLocationSelect = (locationData: { lat: number, lng: number, address: string }) => {
    emit('update:location', locationData);
};
</script>

<style>
/* Safe area support handled by global safe-area.css */
</style>
