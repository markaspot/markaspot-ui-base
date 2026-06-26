<template>
  <div
    class="relative"
  >
    <!-- Desktop: Show custom only if backend settings request it -->
    <div
      v-if="showDesktopCustom && attribution"
      class="attribution-control hidden md:block bg-white dark:bg-black rounded-lg shadow-lg px-3 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 border border-[var(--ui-border)] max-w-xs"
      v-html="attribution"
    />

    <!-- Mobile: Info button -->
    <button
      v-if="showMobileCustom"
      class="block md:hidden "
      :class="[
        config?.classes || 'w-10 h-10 bg-white dark:bg-black rounded-lg shadow-lg flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
      ]"
      :aria-label="t('common.buttons.attribution')"
      @click="toggleAttribution"
    >
      <UIcon
        name="i-heroicons-information-circle"
        class="h-5 w-5 text-neutral-600 dark:text-neutral-300"
      />
      <span class="sr-only">{{ t('common.buttons.attribution') }}</span>
    </button>

    <!-- Mobile: Attribution popup -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showMobileCustom && showMobilePopup"
        class="md:hidden"
        :class="[
          'absolute z-50 px-3 py-2 text-xs rounded-lg shadow-lg max-w-xs',
          'bg-[var(--ui-bg)]/95 backdrop-blur-sm border border-[var(--ui-border)]',
          'text-neutral-900 dark:text-neutral-100',
          tooltipPosition,
        ]"
        role="tooltip"
      >
        <!-- Attribution content -->
        <div
          v-if="attribution"
          class="attribution-content text-xs leading-relaxed"
          v-html="attribution"
        />
        <div
          v-else
          class="text-neutral-500 dark:text-neutral-400"
        >
          {{ t('common.loading') }}
        </div>

        <!-- Arrow -->
        <div
          :class="[
            'absolute w-2 h-2 bg-[var(--ui-bg)]/95 border-l border-b border-[var(--ui-border)] transform rotate-45',
            arrowPosition,
          ]"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/**
 * AttributionControl Component
 *
 * Shows map attribution information
 * Desktop: Readable attribution overlay
 * Mobile: Info button with popup on tap
 */

import { useI18n } from 'vue-i18n';
import type { Map } from 'maplibre-gl';
import { sanitizeHtml } from '~/utils/sanitize';
// Desktop/mobile handled via responsive CSS classes
import { useMarkASpotSettings } from '~/composables/core/useMarkASpotSettings';
import { useMapStyles } from '~/composables/map/useMapStyles';
import type { MarkASpotConfig } from '~/composables/core/useMarkASpotConfig';

/**
 * Extended settings shape with attribution-control fields served by the backend
 * but not yet codified in the shared MarkASpotConfig interface.
 */
interface SettingsWithAttribution extends MarkASpotConfig {
    map_attribution_desktop?: string
    map_attribution_mobile?: string
}

const { t } = useI18n();

const showMobilePopup = ref(false);
const rawAttribution = ref<string>('');
const attribution = computed(() => sanitizeHtml(rawAttribution.value));
const hydrated = ref(false);
// Initialized to 1024 (desktop) on SSR; updated to real value in onMounted.
// The hydrated flag gates width-dependent v-if rendering so SSR and first
// client render agree, avoiding hydration mismatches.
const windowWidth = ref<number>(1024);

// Props
const props = defineProps<{
    mapInstance: Map | null
    config?: {
        classes?: string
        position?: string
    }
}>();

// Get map style utilities to fetch current attribution
const { settings } = useMarkASpotSettings();
const { getAttributionForService } = useMapStyles();

// Determine whether to render custom attribution on desktop/mobile from backend settings.
// Gate on `hydrated` so SSR renders nothing (no client-width known), and
// the initial client render after hydration agrees before JS updates windowWidth.
const isDesktop = computed(() => windowWidth.value >= 768);
const attrSettings = computed(() => settings.value as SettingsWithAttribution | null);
const desktopAttrMode = computed(() => attrSettings.value?.map_attribution_desktop || 'builtin');
const mobileAttrMode = computed(() => attrSettings.value?.map_attribution_mobile || 'custom');
const showDesktopCustom = computed(() => hydrated.value && isDesktop.value && (desktopAttrMode.value === 'custom' || desktopAttrMode.value === 'both'));
const showMobileCustom = computed(() => hydrated.value && !isDesktop.value && (mobileAttrMode.value === 'custom' || mobileAttrMode.value === 'both'));

// Computed properties for positioning mobile popup
const tooltipPosition = computed(() => {
    const position = props.config?.position || 'centerLeft';

    // Position tooltip based on control position
    switch (position) {
        case 'topLeft':
        case 'centerLeft':
            return 'left-full ml-2 top-1/2 -translate-y-1/2';
        case 'topRight':
        case 'centerRight':
            return 'right-full mr-2 top-1/2 -translate-y-1/2';
        case 'bottomLeft':
        case 'bottomRight':
            return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
        default:
            return 'left-full ml-2 top-1/2 -translate-y-1/2';
    }
});

const arrowPosition = computed(() => {
    const position = props.config?.position || 'centerLeft';

    switch (position) {
        case 'topLeft':
        case 'centerLeft':
            return '-left-1 top-1/2 -translate-y-1/2';
        case 'topRight':
        case 'centerRight':
            return '-right-1 top-1/2 -translate-y-1/2';
        case 'bottomLeft':
        case 'bottomRight':
            return 'left-1/2 -translate-x-1/2 -bottom-1';
        default:
            return '-left-1 top-1/2 -translate-y-1/2';
    }
});

// Attribution methods
const fetchAttribution = async () => {
    if (!props.mapInstance || !settings.value) {
        rawAttribution.value = '© <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>';
        return;
    }

    try {
        // Determine attribution based on which tile service is configured
        const hasPrimaryStyle = settings.value.mapbox_style || settings.value.mapbox_style_dark;
        const hasFallbackStyle = settings.value.fallback_style || settings.value.fallback_style_dark;

        if (hasPrimaryStyle) {
            rawAttribution.value = getAttributionForService('primary', settings.value);
        } else if (hasFallbackStyle) {
            rawAttribution.value = getAttributionForService('fallback', settings.value);
        } else {
            rawAttribution.value = getAttributionForService('failed', settings.value);
        }
    } catch (error) {
        if (import.meta.dev) console.error('AttributionControl: Error determining attribution:', error);
        rawAttribution.value = getAttributionForService('failed', settings.value);
    }
};

const toggleAttribution = () => {
    showMobilePopup.value = !showMobilePopup.value;
};

// Watch for map changes to update attribution
watch(() => props.mapInstance, () => {
    if (props.mapInstance) {
        fetchAttribution();
    }
});

// Watch only the specific settings fields that affect attribution (avoids deep watch on the whole object)
watch(
    () => [
        settings.value?.mapbox_style,
        settings.value?.mapbox_style_dark,
        settings.value?.fallback_style,
        settings.value?.fallback_style_dark,
        attrSettings.value?.map_attribution_desktop,
        attrSettings.value?.map_attribution_mobile
    ],
    () => {
        if (settings.value) fetchAttribution();
    }
);

const onResize = () => {
    windowWidth.value = window.innerWidth;
};

// Set hydrated to true on client-side only; register resize listener here
onMounted(() => {
    hydrated.value = true;
    windowWidth.value = window.innerWidth;
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    fetchAttribution();
});

// Cleanup resize listener — must be at top-level of <script setup>, not nested in onMounted
onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
});
</script>

<style scoped>
/* Ensure attribution links are properly styled */
.attribution-content :deep(a) {
    color: var(--color-primary-600);
    text-decoration: underline;
}

.attribution-content :deep(a:hover) {
    color: var(--color-primary-800);
}

@media (prefers-color-scheme: dark) {
    .attribution-content :deep(a) {
        color: var(--color-primary-400);
    }

    .attribution-content :deep(a:hover) {
        color: var(--color-primary-300);
    }
}

.attribution-content :deep(strong) {
    font-weight: 500;
}

/* Desktop attribution overlay positioning */
.attribution-overlay {
    pointer-events: none; /* Don't interfere with map interactions */
}

.attribution-overlay :deep(a) {
    pointer-events: auto; /* Allow clicking attribution links */
}

/* Mobile-specific adjustments */
@media (max-width: 767px) {
    .attribution-content {
        font-size: 11px;
        line-height: 1.4;
    }
}
</style>
