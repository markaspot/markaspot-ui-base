import { useI18n } from 'vue-i18n';
import { provideEmitter } from '@/composables/core/useEmitter';
import { useMarkASpotConfig } from '@/composables/core/useMarkASpotConfig';
import { useMarkASpotSettings } from '@/composables/core/useMarkASpotSettings';
import { useJurisdictions } from '@/composables/core/useJurisdictions';
import { LOCALE_STORAGE_KEY } from '@/composables/core/useLanguage';
import { isLocaleCode } from '../../config/locales';
import { resolveRenderableDefaultLocale } from '@/utils/locale';
import { isFastmapMarketingPath, stripFastmapLocalePrefix } from '../../fastmap-layer/lib/locale-routing';

/**
 * AppBootstrap Composable
 *
 * Application initialization and startup configuration management.
 *
 * @returns Reactive state and methods for appbootstrap functionality
 */

export default function useAppBootstrap() {
    const { fetchSettings, clearCache: clearSettingsCache } = useMarkASpotSettings();
    const { locale } = useI18n();
    const route = useRoute();
    const emitter = provideEmitter();
    // Use dynamic config from API for per-jurisdiction feature flags
    const { fetchConfig, clearCache: clearConfigCache, languages, clientConfig } = useMarkASpotConfig();
    const { currentJurisdiction } = useJurisdictions();

    const isFeatureEnabled = (feature: unknown): boolean => {
        if (typeof feature === 'boolean') return feature;
        if (typeof feature === 'object' && feature !== null && 'enabled' in feature) {
            return Boolean((feature as { enabled?: unknown }).enabled);
        }
        return false;
    };

    /**
     * Set locale without triggering navigateTo() side-effect.
     * setLocale() from nuxt-i18n internally calls navigateTo(), which
     * re-runs the middleware chain and can reset locale to jurisdiction default.
     */
    async function safeSetLocale(code: string) {
        if (!isLocaleCode(code)) return;
        const i18n = useNuxtApp().$i18n as any;
        if (i18n.loadLocaleMessages) {
            await i18n.loadLocaleMessages(code);
        }
        locale.value = code;
    }

    function clearLegacyLocalePreference() {
        if (!import.meta.client) return;
        localStorage.removeItem(LOCALE_STORAGE_KEY);
        document.cookie = 'i18n_redirected=; max-age=0; path=/; samesite=lax';
    }

    /**
     * FastMap marketing routes (/, /de/, /pl/start/templates, /solutions/...)
     * carry their locale in the URL prefix and the FastMap locale machinery
     * (03.locale-prefix middleware + the fastmap-locale plugins) is the single
     * authority there. The brand root has no jurisdiction, so its config
     * `languages.default` is resolved from Accept-Language — applying it here
     * would drag a /de/ visitor back to their browser language. Skip the
     * jurisdiction-default locale override on those routes.
     */
    function isOnFastmapMarketingRoute(): boolean {
        return isFastmapMarketingPath(stripFastmapLocalePrefix(route.path));
    }

    function resolveBackendDefaultLocale(): string {
        const i18n = useNuxtApp().$i18n as { availableLocales?: string[] };
        return resolveRenderableDefaultLocale(
            languages.value?.default,
            languages.value?.available,
            i18n.availableLocales
        );
    }


    onMounted(async () => {
        // Fetch map settings (uses localStorage cache)
        await fetchSettings();

        // Fetch backend config first so feature flags are available
        await fetchConfig();


        // Drupal remains the source of truth for the automatic initial locale.
        // Clear any legacy browser-persisted preference so it cannot override the
        // jurisdiction default during or after hydration.
        clearLegacyLocalePreference();

        const backendDefaultLocale = resolveBackendDefaultLocale();
        if (!isOnFastmapMarketingRoute() && backendDefaultLocale && backendDefaultLocale !== locale.value) {
            if (isLocaleCode(backendDefaultLocale)) {
                console.log(`[AppBootstrap] Setting locale from backend default: ${backendDefaultLocale}`);
                await safeSetLocale(backendDefaultLocale);
            }
        }

        // Initialize offline queue (if feature enabled)
        // Must run after fetchConfig so feature flags are available
        const { initialize: initOfflineQueue } = useOfflineQueue();
        await initOfflineQueue();

        // Prefetch form component chunks for offline availability
        // Uses requestIdleCallback to avoid blocking initial render
        const { initPrefetch } = useFormPrefetch();
        initPrefetch();

        // Initialize document <html> lang attribute
        document.documentElement.lang = locale.value || document.documentElement.lang;
    });

    // Keep <html> lang in sync with locale and refetch requests for translations
    watch(locale, async (newLocale, oldLocale) => {
        document.documentElement.lang = newLocale;

        if (newLocale !== oldLocale) {
            const { useRequestsStore } = await import('@/stores/requests');
            const { useCacheStore } = await import('@/stores/cache');
            const requestsStore = useRequestsStore();
            const cacheStore = useCacheStore();

            if (requestsStore.currentBounds) {
                if (import.meta.dev) console.log(`[Requests] Locale changed from ${oldLocale} to ${newLocale}`);
                cacheStore.clearCache();
                // Don't clear store first - avoids Vue re-render crash with empty list.
                // fetchRequests overwrites allRequests atomically; the marker watcher
                // detects the new array reference even when IDs are unchanged.
                await requestsStore.fetchRequests(requestsStore.currentBounds, requestsStore.currentService);
                emitter.emit('requests-refreshed', { reason: 'locale-change' });
            }
        }
    });

    // Watch for jurisdiction changes and refetch all settings
    watch(
        () => currentJurisdiction.value?.id,
        async (newId, oldId) => {
            // Skip initial mount (oldId undefined) and same jurisdiction
            if (oldId === undefined || newId === oldId) return;

            console.log(`[AppBootstrap] Jurisdiction changed: ${oldId} → ${newId}, refetching settings...`);

            // Clear caches and refetch
            clearSettingsCache?.();
            clearConfigCache?.();

            await fetchSettings(true); // force refetch
            await fetchConfig(true); // force refetch

            clearLegacyLocalePreference();

            const backendDefaultLocale = resolveBackendDefaultLocale();
            if (!isOnFastmapMarketingRoute() && backendDefaultLocale && backendDefaultLocale !== locale.value) {
                if (isLocaleCode(backendDefaultLocale)) {
                    console.log(`[AppBootstrap] Setting locale from new jurisdiction default: ${backendDefaultLocale}`);
                    await safeSetLocale(backendDefaultLocale);
                }
            }
        }
    );
}
