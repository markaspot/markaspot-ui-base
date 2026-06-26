<template>
  <div
    v-if="shouldRenderBanner"
    id="demo-mode-banner"
    ref="bannerEl"
    data-testid="demo-mode-banner"
    role="status"
    aria-live="polite"
    :style="bannerStyle"
    class="demo-mode-banner fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-50 rounded-lg border border-warning-500/50 bg-slate-950/95 text-white shadow-lg backdrop-blur supports-[backdrop-filter]:bg-slate-950/90"
  >
    <div class="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 sm:px-4">
      <div class="flex min-w-0 items-center gap-2 text-sm">
        <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning-400/15 text-warning-300 ring-1 ring-warning-300/40">
          <UIcon
            name="i-lucide-triangle-alert"
            class="size-4"
            aria-hidden="true"
          />
        </span>

        <div class="min-w-0 leading-tight sm:flex sm:items-center sm:gap-2">
          <strong class="block text-sm font-semibold text-warning-100 sm:inline sm:shrink-0 sm:whitespace-nowrap">
            {{ bannerTitle }}
          </strong>
          <span class="block text-xs text-slate-200 sm:max-w-[48vw] lg:max-w-none">
            {{ bannerMessage }}
          </span>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <!-- Render the CTA via a raw anchor so `rel="noopener noreferrer"`
        is guaranteed to ship with target="_blank". -->
        <a
          :href="ctaHref"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="demo-mode-banner-cta"
          :title="ctaLabel"
          class="inline-flex h-8 max-w-[36vw] shrink-0 items-center gap-1 rounded-md border border-warning-400/60 bg-warning-400/10 px-2 text-xs font-medium text-warning-100 transition hover:bg-warning-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:max-w-none sm:px-3"
        >
          <span class="truncate">{{ ctaLabel }}</span>
          <UIcon
            name="i-lucide-external-link"
            class="size-3.5"
            aria-hidden="true"
          />
        </a>

        <button
          type="button"
          data-testid="demo-mode-banner-close"
          :aria-label="closeLabel"
          :title="closeLabel"
          class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          @click="dismissBanner"
        >
          <UIcon
            name="i-lucide-x"
            class="size-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * DemoBanner
 *
 * Floating top banner for the demo system (demo.mark-a-spot.com).
 * Dismissible because the submission gate is the real safeguard; this banner
 * should warn without permanently occupying vertical layout space.
 *
 * Renders only when `runtimeConfig.public.demoMode === true`. Production
 * tenants (civicspot.io, self-hosted) never mount the banner.
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/432
 */

import { useDemoMode } from '~/composables/core/useDemoMode';

const { t } = useI18n();
const { clientConfig } = useMarkASpotConfig();
const { isBannerVisible, dismissBanner } = useDemoMode();
const route = useRoute();
const bannerEl = ref<HTMLElement | null>(null);

// Pre-compute strings at setup time. We avoid `$t` inside the template so that
// shallow-mounted unit tests (which don't install the full vue-i18n plugin)
// can still render the component.
const demoBannerConfig = computed(() => clientConfig.value?.demoMode?.banner);
const fallbackCtaHref = 'https://mark-a-spot.com';
const resolveConfigText = (value: unknown, fallback: string): string =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
const resolveConfigHref = (value: unknown): string => {
    if (typeof value !== 'string' || value.trim().length === 0) return fallbackCtaHref;
    const href = value.trim();
    if (href.startsWith('/')) return href;

    try {
        const url = new URL(href);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : fallbackCtaHref;
    } catch {
        return fallbackCtaHref;
    }
};

const bannerTitle = computed(() => resolveConfigText(demoBannerConfig.value?.title, t('demo_mode.banner.title')));
const bannerMessage = computed(() => resolveConfigText(demoBannerConfig.value?.message, t('demo_mode.banner.message')));
const ctaLabel = computed(() => resolveConfigText(demoBannerConfig.value?.linkLabel, t('demo_mode.banner.link_label')));
const closeLabel = computed(() => t('common.close'));
const ctaHref = computed(() => resolveConfigHref(demoBannerConfig.value?.linkUrl));
const routeIsDashboard = computed(() =>
    route.path.split('/').filter(Boolean).includes('dashboard')
);
const shouldRenderBanner = computed(() => isBannerVisible.value && !routeIsDashboard.value);
const routeUsesCitizenSidebar = computed(() => {
    const segments = route.path.split('/').filter(Boolean);
    if (segments.length !== 1) return false;

    const segment = segments[0].toLowerCase();
    if (/^[a-z]{2}(?:-[a-z]{2})?$/.test(segment)) return false;

    return ![
        'admin',
        'auth',
        'dashboard',
        'embed',
        'impressum',
        'partner',
        'privacy',
        'report',
        'solutions',
        'start',
        'terms',
        'welcome'
    ].includes(segment);
});
const sidebarOffset = computed(() => {
    const leftSidebar = clientConfig.value?.theme?.ui?.leftSidebar;
    if (!routeUsesCitizenSidebar.value) return '0px';
    if (leftSidebar?.enabled === false) return '0px';
    return leftSidebar?.width || '420px';
});
const bannerStyle = computed(() => ({
    '--demo-mode-sidebar-width': sidebarOffset.value
}) as Record<string, string>);

if (import.meta.client) {
    let observer: ResizeObserver | null = null;

    const updateBannerHeight = () => {
        if (!shouldRenderBanner.value || !bannerEl.value) {
            document.documentElement.style.setProperty('--demo-mode-banner-height', '0px');
            return;
        }

        const bottom = Math.ceil(bannerEl.value.getBoundingClientRect().bottom);
        document.documentElement.style.setProperty('--demo-mode-banner-height', `${bottom}px`);
    };

    onMounted(() => {
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(updateBannerHeight);
        }
        watch(
            [shouldRenderBanner, bannerEl, sidebarOffset],
            async () => {
                await nextTick();
                observer?.disconnect();
                if (bannerEl.value) observer?.observe(bannerEl.value);
                updateBannerHeight();
            },
            { immediate: true }
        );
        window.addEventListener('resize', updateBannerHeight);
    });

    onUnmounted(() => {
        observer?.disconnect();
        window.removeEventListener('resize', updateBannerHeight);
        document.documentElement.style.setProperty('--demo-mode-banner-height', '0px');
    });
}
</script>

<style scoped>
.demo-mode-banner {
    left: max(0.5rem, calc((100vw - 48rem) / 2));
    width: min(48rem, calc(100vw - 1rem));
}

@media (min-width: 768px) {
    .demo-mode-banner {
        left: calc(var(--demo-mode-sidebar-width, 0px) + max(0.5rem, calc((100vw - var(--demo-mode-sidebar-width, 0px) - 48rem) / 2)));
        width: min(48rem, calc(100vw - var(--demo-mode-sidebar-width, 0px) - 1rem));
    }
}
</style>
