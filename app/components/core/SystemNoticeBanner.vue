<template>
  <ClientOnly>
    <UBanner
      v-if="notice"
      id="system-notice"
      :title="notice.message"
      :icon="iconName"
      :color="notice.color"
      close
    />
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * SystemNoticeBanner
 *
 * Persistent top banner indicating non-production environments (test, staging, etc.).
 * Uses Nuxt UI's UBanner with localStorage-based dismiss (via id prop).
 *
 * Text source priority:
 * 1. Drupal settings API (systemNotice in field_nuxt_config)
 * 2. Runtime config (NUXT_PUBLIC_SYSTEM_NOTICE env var)
 * 3. Hostname detection (test/staging/ddev patterns)
 *
 * Drupal config example:
 * { "systemNotice": { "message": "Testsystem", "color": "warning" } }
 * Supported colors: primary, secondary, success, info, warning, error, neutral
 */

type BannerColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

interface SystemNotice {
    message: string
    color: BannerColor
}

const runtimeConfig = useRuntimeConfig();
const { config: masConfig, isReady } = useMarkASpotConfig();

// Detect non-production environment from hostname (useRequestURL works isomorphically in Nuxt)
const isNonProduction = (): boolean => {
    const hostname = useRequestURL().hostname;
    // Local dev environments are always non-production
    if (/\.ddev\.site$/i.test(hostname)) return true;
    // Only flag test/staging subdomains, not real domains containing those words.
    // e.g. test.example.com or staging.example.com, but NOT demo.mark-a-spot.com
    // (cloud demo instances are real deployments serving customers)
    return [/\btest\b/i, /\bstaging\b/i]
        .some(pattern => pattern.test(hostname));
};

// Resolve notice from available sources
const notice = computed<SystemNotice | null>(() => {
    // 1. Drupal settings API (systemNotice in field_nuxt_config)
    if (isReady.value) {
        const drupalNotice = (masConfig.value as any)?.systemNotice;
        if (drupalNotice?.message) {
            return {
                message: drupalNotice.message,
                color: drupalNotice.color || 'neutral'
            };
        }
    }

    // 2. Runtime config / env var (NUXT_PUBLIC_SYSTEM_NOTICE)
    const envNotice = runtimeConfig.public.systemNotice as string | undefined;
    if (envNotice) {
        return {
            message: envNotice,
            color: 'neutral'
        };
    }

    // 3. Hostname detection (generic fallback)
    if (isNonProduction()) {
        return {
            message: 'Meldungen in diesem System werden nicht bearbeitet.',
            color: 'warning'
        };
    }

    return null;
});

const iconName = computed(() => {
    const c = notice.value?.color;
    if (c === 'error' || c === 'warning') return 'i-lucide-triangle-alert';
    return 'i-lucide-info';
});
</script>
