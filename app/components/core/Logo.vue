<template>
  <img
    :src="computedLogoSrc"
    :alt="altText"
    :style="styleObject"
    :aria-hidden="ariaHidden ? 'true' : 'false'"
    :role="ariaHidden ? null : 'img'"
    fetchpriority="high"
    loading="eager"
    @error="handleImageError"
  >
</template>

<script setup lang="ts">
/**
 * Logo Component
 *
 * Logo component providing user interface functionality.
 */

const { clientConfig } = useRuntimeConfig().public;
const { logoLight, logoDark } = useClientAssets();

// Animation settings from client config
const animationDuration = computed(() =>
    clientConfig?.theme?.ui?.animations?.duration || 300
);

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

interface LogoProps {
    altText?: string
    width?: string
    height?: string
    src?: string
    ariaHidden?: boolean
}

const props = withDefaults(defineProps<LogoProps>(), {
    altText: 'Logo',
    width: '160px',
    height: 'auto',
    src: '',
    ariaHidden: false
});

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

const computedLogoSrc = computed(() => {
    if (props.src) return props.src;

    // Use the resolved logo paths from the composable
    return isDark.value ? logoDark.value : logoLight.value;
});

const retryCount = ref(0);
const MAX_RETRIES = 1;

// Reset retry counter when logo source changes (e.g., dark/light mode toggle)
watch(computedLogoSrc, () => {
    retryCount.value = 0;
});

const handleImageError = (e: Event) => {
    const target = e.target as HTMLImageElement;
    const originalSrc = computedLogoSrc.value;

    // Retry once: image proxy may fail on first request (cold backend)
    if (retryCount.value < MAX_RETRIES && !target.src.includes('/images/')) {
        retryCount.value++;
        console.warn(`[Logo] Retry ${retryCount.value}/${MAX_RETRIES} for ${originalSrc}`);
        // Brief delay before retry to let the backend warm up
        setTimeout(() => {
            target.src = `${originalSrc}${originalSrc.includes('?') ? '&' : '?'}t=${Date.now()}`;
        }, 500);
        return;
    }

    console.warn(`[Logo] Falling back to default logo (failed: ${target.src})`);
    target.src = isDark.value ? '/images/logo-dark.svg' : '/images/logo-light.svg';
};

// Consolidate inline style into a computed object with proper typing
const styleObject = computed<CSSProperties>(() => ({
    width: props.width === 'auto' ? 'auto' : props.width,
    height: props.height === 'auto' ? 'auto' : props.height,
    maxHeight: props.height === 'auto' ? 'none' : props.height,
    maxWidth: '100%',
    objectFit: 'contain', // Preserve aspect ratio without distortion
    objectPosition: 'left center', // Align to left for consistent positioning
    transition: `all ${animationDuration.value}ms ${animationEasing.value}`
}));
</script>
