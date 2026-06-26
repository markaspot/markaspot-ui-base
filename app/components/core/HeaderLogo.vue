<template>
  <div
    v-if="isHeaderVisible"
    ref="headerRef"
    class="flex-shrink-0 z-30"
    :style="{
      height: `${headerHeight}px`,
      transition: `height ${animationDuration}ms ${animationEasing}`,
    }"
  >
    <!-- Main Header with dynamic height -->
    <div
      class="px-6 py-4 h-full overflow-hidden"
      :class="{
        'cursor-grab active:cursor-grabbing select-none': enableDrag,
        'hover:bg-[var(--ui-bg-elevated)]/50 transition-colors': enableDrag,
      }"
      @mousedown="enableDrag ? $emit('drag-start', $event) : null"
      @touchstart.passive="enableDrag ? $emit('touch-start', $event) : null"
      @click.stop="enableDrag ? $emit('drag-click') : null"
    >
      <div class="flex items-center h-full">
        <!-- Logo Area -->
        <div class="flex items-center gap-6 h-full">
          <!-- Logo Container with consistent dimensions -->
          <div
            v-if="showLogo"
            class="flex items-center justify-start"
            :style="{ height: configuredLogoHeight }"
          >
            <Logo
              ref="logoRef"
              :alt="$t('header.logo_alt')"
              :height="configuredLogoHeight"
              class="w-auto"
              @load="onLogoLoad"
            />
          </div>
          <!-- Text Area -->
          <div class="flex flex-col">
            <h2
              v-if="showLogo"
              class="text-xl font-medium"
            >
              {{ appName }}
            </h2>
            <span
              v-if="showSlogan"
              class="dark:text-neutral-300 text-neutral-600 text-base"
            >
              {{ appClaim }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * HeaderLogo Component
 *
 * HeaderLogo component providing user interface functionality.
 */

import { useI18n } from 'vue-i18n';
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';

const { t, locale } = useI18n();

// Embed config (provided by embed pages/layouts, null outside embed context)
// Note: inject may be null when rendered inside UDrawer (Teleport breaks provide chain)
const embedConfig = inject<Ref<{ logo?: boolean, slogan?: boolean }> | null>('embedConfig', null);
const route = useRoute();

const { clientConfig: masConfig } = useMarkASpotConfig();
const { clientConfig } = useRuntimeConfig().public;

// Check embed visibility: inject takes priority, route query as fallback (for teleported contexts)
const embedLogo = computed(() => {
    if (embedConfig?.value?.logo !== undefined) return embedConfig.value.logo;
    const q = route.query.logo;
    if (q === 'false' || q === '0') return false;
    return undefined; // not set, defer to clientConfig
});

const embedSlogan = computed(() => {
    if (embedConfig?.value?.slogan !== undefined) return embedConfig.value.slogan;
    const q = route.query.slogan;
    if (q === 'false' || q === '0') return false;
    return undefined; // not set, defer to clientConfig
});

// Visibility: clientConfig AND embed config must not be false
const showLogo = computed(() => {
    return clientConfig?.theme?.ui?.showLogo !== false &&
      embedLogo.value !== false;
});

const showSlogan = computed(() => {
    return clientConfig?.theme?.ui?.showSlogan !== false &&
      embedSlogan.value !== false;
});

// App name from jurisdiction config (takes priority) or fallback to i18n
const appName = computed(() => {
    return masConfig.value?.name || masConfig.value?.client?.name || t('header.app_name');
});

// App claim from jurisdiction config (takes priority) or fallback to i18n
// Supports both string and language map: { en: "...", nl: "...", de: "..." }
const appClaim = computed(() => {
    const claim = masConfig.value?.client?.claim;
    if (!claim) return t('header.app_claim');
    if (typeof claim === 'string') return claim;
    return claim[locale.value] || claim['en'] || t('header.app_claim');
});

// Get UI settings from client config
const configuredHeaderHeight = computed(() => {
    return clientConfig?.theme?.ui?.headerHeight || 'auto';
});

const configuredLogoHeight = computed(() => {
    return clientConfig?.theme?.logoHeight || '40px';
});

const animationDuration = computed(() => {
    return clientConfig?.theme?.ui?.animations?.duration || 300;
});

// Different easing functions based on animation type
const animationEasing = computed(() => {
    const type = clientConfig?.theme?.ui?.animations?.type || 'bounce';
    const configEasing = clientConfig?.theme?.ui?.animations?.easing;

    // Use custom easing if provided, otherwise use preset by type
    if (configEasing) return configEasing;

    switch (type) {
        case 'bounce':
            return 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Elastic bounce
        case 'smooth':
            return 'cubic-bezier(0.4, 0, 0.2, 1)'; // Smooth
        case 'linear':
            return 'linear';
        default:
            return 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Default to bounce
    }
});

// Hide entire header when both logo and slogan are hidden
const isHeaderVisible = computed(() => showLogo.value || showSlogan.value);

// Use refs for dynamic measurements
const logoRef = ref(null);
const headerRef = ref(null);
const headerHeight = ref(120); // Default initial height

// This function will measure the logo height and adjust header height accordingly
const onLogoLoad = async () => {
    await nextTick();

    // If header height is set to a specific value in config, use that
    if (configuredHeaderHeight.value !== 'auto') {
    // Handle pixel values (e.g., "20px")
        if (configuredHeaderHeight.value.endsWith('px')) {
            const parsedHeight = parseInt(configuredHeaderHeight.value);
            if (!isNaN(parsedHeight)) {
                headerHeight.value = parsedHeight;
                emit('header-height-change', headerHeight.value);
                return;
            }
        }
        // Handle direct numeric values (e.g., "20")
        const parsedHeight = parseInt(configuredHeaderHeight.value);
        if (!isNaN(parsedHeight)) {
            headerHeight.value = parsedHeight;
            emit('header-height-change', headerHeight.value);
            return;
        }
    }

    // Otherwise, calculate based on logo
    if (logoRef.value) {
        const logo = logoRef.value.$el || logoRef.value; // Handle potential component vs element
        const logoHeight = logo.offsetHeight || logo.clientHeight;
        const padding = 32; // Additional padding (16px top + 16px bottom)

        // Set header height based on logo height with some padding
        headerHeight.value = Math.max(80, logoHeight + padding); // Min 80px

        // Emit height change event for parent components
        emit('header-height-change', headerHeight.value);
    }
};

onMounted(async () => {
    // Set initial headerHeight directly from config if it's a fixed value
    if (configuredHeaderHeight.value !== 'auto') {
        if (configuredHeaderHeight.value.endsWith('px')) {
            const parsedHeight = parseInt(configuredHeaderHeight.value);
            if (!isNaN(parsedHeight)) {
                headerHeight.value = parsedHeight;
                emit('header-height-change', headerHeight.value);
            }
        } else {
            const parsedHeight = parseInt(configuredHeaderHeight.value);
            if (!isNaN(parsedHeight)) {
                headerHeight.value = parsedHeight;
                emit('header-height-change', headerHeight.value);
            }
        }
    }

    // Still call onLogoLoad after a small delay to ensure DOM is ready
    await nextTick();
    onLogoLoad();

    // Handle responsive behavior
    window.addEventListener('resize', onLogoLoad);
});

onBeforeUnmount(() => {
    // Clean up event listener
    window.removeEventListener('resize', onLogoLoad);
});

const props = defineProps<{
    enableDrag?: boolean
}>();

const emit = defineEmits<{
    'header-height-change': [height: number]
    'drag-start': [event: MouseEvent]
    'touch-start': [event: TouchEvent]
    'drag-click': []
}>();
</script>

<style scoped>
/* Ensure crisp edges on logo */
:deep(img) {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>
