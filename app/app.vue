<template>
  <UApp
    class="isolate"
    :toaster="toasterConfig"
    :locale="uiLocale"
  >
    <!-- Enhanced skip navigation for keyboard users (frontend only, not in embed) -->
    <SkipNavigation v-if="!isDashboard && !isAdmin && !isEmbed && !isFastmap" />

    <!-- Persistent banner for the demo instance. Outside the !isEmbed gate so
    the warning still shows on embed routes — the demo nature of the host must
    not be hidden by an iframe wrapper. -->
    <DemoBanner />

    <!-- Persistent banner for non-production environments (not in embed) -->
    <SystemNoticeBanner v-if="!isEmbed" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Application-level complementary content (frontend only, not in embed) -->
    <aside
      v-if="!isDashboard && !isAdmin && !isEmbed && !isFastmap"
      aria-label="Application features"
    >
      <OfflineBanner />
      <PWAInstallPrompt />
      <ServiceUnavailableOverlay />
      <EmergencyBannerToast />
    </aside>

    <!-- Demo-mode pre-submit gate. Mounted globally so any report form in the
    app routes through the same modal instance. The component renders only
    when `runtimeConfig.public.demoMode === true`. -->
    <DemoSubmitConfirmModal />
  </UApp>
</template>

<script setup lang="ts">
import useAppBootstrap from '~/composables/useAppBootstrap';
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import { useDemoMode } from '~/composables/core/useDemoMode';
import { SUPPORTED_LOCALES } from '~~/config/locales';
import { resolveLocaleDir } from '~/utils/locale';
import { ar, cs, da, de, en, es, fi, fr, hu, it, nb_no, nl, pl, pt, sv, tr, uk } from '@nuxt/ui/locale';

const route = useRoute();
const { clientConfig } = useMarkASpotConfig();
const { locale } = useI18n();
const { isDemoMode } = useDemoMode();

const uiLocales = {
    'ar': ar,
    'cs': cs,
    'da': da,
    'de': de,
    'de-ls': de,
    'en': en,
    'es': es,
    'fi': fi,
    'fr': fr,
    'hu': hu,
    'it': it,
    'nb': nb_no,
    'nl': nl,
    'pl': pl,
    'pt': pt,
    'sv': sv,
    'tr': tr,
    'uk': uk
};

const uiLocale = computed(() => uiLocales[locale.value as keyof typeof uiLocales] ?? en);

// Reactively bind <html lang> and <html dir> to the active locale.
// The Nuxt i18n module does not auto-write `dir` to the html element with
// strategy: 'no_prefix', so RTL locales (ar/he/fa/ur) need an explicit
// binding here. Tailwind's `rtl:` variants and CSS logical properties
// react to the html attribute, so this single source drives the whole
// layout flip.
useHead({
    title: computed(() => clientConfig.value?.name || 'Mark-a-Spot'),
    htmlAttrs: {
        lang: computed(() => locale.value || 'de'),
        dir: computed(() => resolveLocaleDir(locale.value))
    },
    // Demo instances must not appear in search results — citizens land here
    // via "Amsterdam Meldung", "Rotterdam pothole" and submit real reports.
    // The HTML meta tag complements the X-Robots-Tag header set by the
    // server middleware (issue #432).
    meta: computed(() =>
        isDemoMode.value
            ? [{ name: 'robots', content: 'noindex, nofollow' }]
            : []
    )
});

// OpenGraph locale tag derived from the active i18n locale.
// og:locale uses the `xx_YY` format (underscore), not BCP-47's `xx-YY`.
const ogLocale = computed(() => {
    const entry = SUPPORTED_LOCALES.find(l => l.code === locale.value);
    return (entry?.iso || 'en-US').replace('-', '_');
});

const ogLocaleAlternate = computed(() =>
    SUPPORTED_LOCALES
        .filter(l => l.code !== locale.value)
        .map(l => l.iso.replace('-', '_'))
);

useServerSeoMeta({
    ogLocale,
    ogLocaleAlternate
});

// Check if we're on a dashboard, platform-admin or embed route.
// Platform admin is cross-tenant and has no map/report affordances,
// so the citizen skip-links and complementary features don't apply.
const isDashboard = computed(() => route.path.includes('/dashboard'));
const isAdmin = computed(() => /(^|\/)admin(\/|$)/.test(route.path));
const isFastmap = computed(() => route.meta.layout === 'fastmap');
const { isEmbed } = useEmbed();

// Configure toaster position based on route - dashboard needs bottom-right to avoid header actions
const toasterConfig = computed(() => ({
    position: (isDashboard.value ? 'bottom-right' : 'top-right') as 'bottom-right' | 'top-right',
    expand: true,
    duration: 8000
}));

useAppBootstrap();
</script>
