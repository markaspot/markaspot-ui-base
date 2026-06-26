/**
 * Plugin to apply i18n overrides from jurisdiction config (Drupal API)
 *
 * Runs on both SERVER and CLIENT to ensure consistent rendering.
 * On SSR: Applies overrides immediately after 01.jurisdiction-ssr.ts loads config
 * On Client: Watches for config changes and locale switches
 *
 * Drupal config format:
 * {
 *   "i18n": {
 *     "overrides": {
 *       "de": { "header.app_name": "Custom Name", ... },
 *       "en": { "header.app_name": "Custom Name EN", ... }
 *     }
 *   }
 * }
 */
import { unflattenI18nOverrideObject } from '~/utils/i18nOverrides';
import { resolveRenderableDefaultLocale } from '~/utils/locale';

export default defineNuxtPlugin({
    name: 'i18n-overrides',
    // Run after:
    // 1. mas-jurisdiction-ssr - loads config from Drupal (including i18n.overrides)
    // 2. i18n:plugin - provides $i18n instance with loaded translations
    dependsOn: ['mas-jurisdiction-ssr', 'i18n:plugin'],

    async setup(nuxtApp) {
        const ctx = import.meta.server ? 'SSR' : 'Client';
        console.log(`[i18n-overrides] [${ctx}] setup() called`);

        const $i18n = nuxtApp.$i18n as any;
        if (!$i18n) {
            console.error('[i18n-overrides] $i18n not available!');
            return;
        }

        const { i18nOverrides, isReady, fetchConfig, languages } = useMarkASpotConfig();

        // Track which locales have had overrides applied (per-request on SSR)
        const appliedLocales = new Set<string>();

        // Check if messages are fully loaded (have actual content, not just structure)
        function areMessagesLoaded(locale: string): boolean {
            const messages = $i18n.messages.value[locale];
            if (!messages) return false;
            // Check for common keys that should exist
            return !!(messages.header?.app_name || messages.report?.buttons?.photo);
        }

        // Apply overrides for a specific locale (synchronous version)
        function applyOverridesSync(locale: string): boolean {
            const overrides = i18nOverrides.value;

            if (!overrides || !overrides[locale]) {
                console.log(`[i18n-overrides] No overrides for locale: ${locale}`, overrides);
                return false;
            }

            // Don't re-apply
            if (appliedLocales.has(locale)) {
                return true;
            }

            // Check if messages are loaded
            if (!areMessagesLoaded(locale)) {
                console.log(`[i18n-overrides] Messages not loaded for: ${locale}`);
                return false;
            }

            const flatOverrides = overrides[locale];
            const nestedOverrides = unflattenI18nOverrideObject(flatOverrides);

            // Use mergeLocaleMessage to ADD/OVERRIDE specific keys
            // without replacing the entire locale
            $i18n.mergeLocaleMessage(locale, nestedOverrides);
            appliedLocales.add(locale);

            const ctx = import.meta.server ? 'SSR' : 'Client';
            console.log(`[i18n-overrides] [${ctx}] Applied overrides for:`, locale, Object.keys(flatOverrides));

            return true;
        }

        // Apply overrides with retries (client-side only)
        function applyOverridesWithRetry(locale: string, retries = 10) {
            if (applyOverridesSync(locale)) {
                return;
            }

            // Only retry on client - SSR doesn't have time for async retries
            if (import.meta.client && retries > 0) {
                setTimeout(() => applyOverridesWithRetry(locale, retries - 1), 100);
            }
        }

        // Switch locale to jurisdiction default if different from build-time default.
        // In @nuxtjs/i18n v10, messages are loaded per-locale on demand (even with
        // lazy:false). We must load messages for the target locale before switching,
        // otherwise $t() returns raw keys for any locale other than the build-time default.
        async function applyJurisdictionLocale(): Promise<boolean> {
            const jurisdictionLocale = languages.value
                ? resolveRenderableDefaultLocale(
                    languages.value.default,
                    languages.value.available,
                    $i18n.availableLocales
                )
                : '';
            if (jurisdictionLocale && jurisdictionLocale !== $i18n.locale.value &&
              $i18n.availableLocales.includes(jurisdictionLocale)) {
                // Load messages for target locale before switching
                if ($i18n.loadLocaleMessages) {
                    await $i18n.loadLocaleMessages(jurisdictionLocale);
                }
                $i18n.locale.value = jurisdictionLocale;
                return true;
            }
            return false;
        }

        // ==========================================
        // SSR: Apply locale + overrides
        // ==========================================
        if (import.meta.server) {
            // 01.jurisdiction-ssr.ts should have already loaded config
            // If not ready, fetch it now (fallback)
            if (!isReady.value) {
                await fetchConfig();
            }

            if (isReady.value) {
                await applyJurisdictionLocale();
                applyOverridesSync($i18n.locale.value);
            }
        }

        // ==========================================
        // Client: Set locale to match SSR, then use watchers
        // ==========================================
        if (import.meta.client) {
            // Match SSR locale immediately to prevent hydration mismatch.
            // Config state is transferred via __NUXT_DATA__ payload, so
            // isReady should be true if SSR loaded successfully.
            // User preferences are handled later in useAppBootstrap (onMounted).
            if (isReady.value) {
                await applyJurisdictionLocale();
                applyOverridesWithRetry($i18n.locale.value);
            }

            // Watch for config ready (handles late config loads after SSR failure)
            watch(isReady, async (ready) => {
                if (ready) {
                    await applyJurisdictionLocale();
                    applyOverridesWithRetry($i18n.locale.value);
                }
            });

            // Watch for locale changes
            watch(() => $i18n.locale.value, (newLocale) => {
                if (isReady.value) {
                    applyOverridesWithRetry(newLocale);
                }
            });

            // Watch for i18nOverrides changes (e.g., when jurisdiction switches)
            watch(i18nOverrides, () => {
                if (isReady.value) {
                    // Clear applied cache and re-apply
                    appliedLocales.clear();
                    applyOverridesWithRetry($i18n.locale.value);
                }
            }, { deep: true });
        }
    }
});
