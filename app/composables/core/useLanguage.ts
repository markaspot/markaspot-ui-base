// composables/core/useLanguage.ts
import { useI18n } from 'vue-i18n';
import { useRuntimeConfig } from '#imports';
import { LOCALE_LABELS, LOCALE_DISPLAY_CODES, isLocaleCode } from '../../../config/locales';
import {
    normalizeI18nLocaleCodes,
    resolveRenderableDefaultLocale,
    resolveRenderableLocaleCodes
} from '@/utils/locale';

/**
 * Cookie name for the user's manual locale choice on brand-root pages
 * (civicspot.io/, mark-a-spot.com/). Same name was previously used as a
 * localStorage key; the cookie variant is required because the server
 * middleware needs to read it during SSR.
 *
 * Tenant pages ignore this cookie — Drupal stays the source of truth there.
 */
export const LOCALE_STORAGE_KEY = 'mas_locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Language composable for single-image multi-tenant deployments
 *
 * Priority for available languages:
 * 1. Drupal jurisdiction config (dynamic, from useMarkASpotConfig)
 * 2. Build-time client config (static fallback)
 * 3. All i18n locales (ultimate fallback)
 *
 * All locales are bundled at build time, but visibility is controlled
 * by the jurisdiction's configuration in Drupal.
 *
 * Automatic locale source:
 * - Drupal jurisdiction config decides the default locale
 * - Client-side switching affects the current runtime only
 */
export function useLanguage() {
    // Obtain i18n locale controls
    const { locale, locales } = useI18n();
    const isChangingLocale = ref(false);
    const config = useRuntimeConfig();

    // Get dynamic config from Drupal API - keep full reference for reactivity
    const masConfig = useMarkASpotConfig();

    const i18nLocaleCodes = computed(() => normalizeI18nLocaleCodes(locales.value));
    const onlyRenderableLocales = (codes: string[]) => resolveRenderableLocaleCodes(codes, i18nLocaleCodes.value);

    /**
     * Get available locale codes with priority:
     * 1. Drupal config (languages.available from jurisdiction)
     * 2. Build-time clientConfig.languages.locales
     * 3. All i18n locales
     */
    const availableLocales = computed(() => {
        // Priority 1: Drupal jurisdiction config (dynamic)
        // Access via masConfig.languages.value for proper reactivity
        if (masConfig.languages.value?.available?.length) {
            const codes = onlyRenderableLocales(masConfig.languages.value.available);
            if (import.meta.dev) {
                console.log('[useLanguage] Using renderable Drupal languages:', codes);
            }
            return codes;
        }

        // Priority 2: Build-time client config (static)
        const clientLocales = config.public.clientConfig?.languages?.locales;
        if (clientLocales?.length > 0) {
            const codes = onlyRenderableLocales(clientLocales.map((l: { code: string }) => l.code));
            if (import.meta.dev) {
                console.log('[useLanguage] Using renderable build-time languages:', codes);
            }
            return codes;
        }

        // Priority 3: All i18n locales (ultimate fallback)
        const codes = onlyRenderableLocales(i18nLocaleCodes.value);
        if (codes.length) {
            if (import.meta.dev) {
                console.log('[useLanguage] Using renderable i18n locales:', codes);
            }
            return codes;
        }

        // Ultimate fallback - single language to prevent empty language switcher
        return ['de'];
    });

    /**
     * Get default locale with priority:
     * 1. Drupal config (languages.default)
     * 2. Build-time clientConfig.languages.defaultLocale
     * 3. 'de'
     */
    const defaultLocale = computed(() => {
        const configuredDefault = masConfig.languages.value?.default || config.public.clientConfig?.languages?.defaultLocale || 'de';

        return resolveRenderableDefaultLocale(configuredDefault, availableLocales.value, i18nLocaleCodes.value);
    });

    /**
     * Config ready state - useful for preventing hydration mismatches
     */
    const configReady = computed(() => masConfig.isReady.value);

    /**
     * Switch the current locale in-place for the active runtime.
     */
    const switchLanguage = async (newLocale: string) => {
        if (isChangingLocale.value || !availableLocales.value.includes(newLocale) || !isLocaleCode(newLocale)) return;
        try {
            isChangingLocale.value = true;
            // Load all layer messages first (i18n v10 loads per-locale on demand).
            // Cannot use setLocale() because its navigate() re-runs route-locale-detection
            // which resets the locale back to the jurisdiction default.
            const i18n = useNuxtApp().$i18n as any;
            if (i18n.loadLocaleMessages) {
                await i18n.loadLocaleMessages(newLocale);
            }
            // Keep the global Nuxt i18n instance in sync. Locale-dependent API
            // fetches read from useNuxtApp().$i18n via getCurrentLocale().
            if (i18n?.locale) {
                if (typeof i18n.locale === 'string') {
                    i18n.locale = newLocale;
                } else {
                    i18n.locale.value = newLocale;
                }
            }
            locale.value = newLocale;
            persistBrandLocaleChoice(newLocale);
        } catch (error) {
            console.error('Failed to switch language:', error);
        } finally {
            isChangingLocale.value = false;
        }
    };

    /**
     * Persist the manual locale choice as a cookie. The server middleware
     * `01.jurisdiction-locale.ts` reads it on brand-root requests; tenant
     * requests ignore it.
     */
    const persistBrandLocaleChoice = (newLocale: string) => {
        if (!import.meta.client) return;
        // newLocale is gated by isLocaleCode() in the caller; the allow-list
        // contains only ASCII letters and hyphens, so no encoding is needed
        // and the read side (server middleware) doesn't decode either.
        const secure = location.protocol === 'https:' ? '; secure' : '';
        document.cookie = `${LOCALE_STORAGE_KEY}=${newLocale}; max-age=${LOCALE_COOKIE_MAX_AGE}; path=/; samesite=lax${secure}`;
    };

    /**
     * Automatic locale restore is disabled because Drupal is the source of truth.
     */
    const restoreLocale = async () => {
        return Promise.resolve();
    };

    /**
     * Browser-persisted locale preferences are no longer used automatically.
     */
    const hasSavedLocale = computed(() => false);

    /**
     * Clear any legacy persisted locale state.
     */
    const clearSavedLocale = () => {
        if (!import.meta.client) return;
        localStorage.removeItem(LOCALE_STORAGE_KEY);
        document.cookie = 'i18n_redirected=; max-age=0; path=/; samesite=lax';
        document.cookie = `${LOCALE_STORAGE_KEY}=; max-age=0; path=/; samesite=lax`;
    };

    /**
     * Get the next locale in the cycle (for language toggle button)
     */
    const getNextLocale = () => {
        if (!availableLocales.value.length) return locale.value;

        const currentIndex = availableLocales.value.findIndex((code: string) => code === locale.value);
        const nextIndex = (currentIndex + 1) % availableLocales.value.length;
        return availableLocales.value[nextIndex] || availableLocales.value[0];
    };

    /**
     * Effective locale definitions for downstream consumers.
     *
     * Legacy or migrated tenants may ship `languages.available` without the
     * companion `languages.locales` list. We synthesise a safe default from
     * `available` so any consumer that reads `masConfig.languages.value.locales`
     * (including the dashboard switcher) still gets sane display metadata.
     */
    const effectiveLocales = computed(() => {
        const drupalLocales = masConfig.languages.value?.locales;
        if (drupalLocales?.length) {
            return availableLocales.value.map((code: string) => {
                const entry = drupalLocales.find((l: { code: string }) => l.code === code);
                return entry || {
                    code,
                    iso: LOCALE_DISPLAY_CODES[code] ?? code,
                    name: LOCALE_LABELS[code] ?? code
                };
            });
        }

        return availableLocales.value.map((code: string) => ({
            code,
            iso: LOCALE_DISPLAY_CODES[code] ?? code,
            name: LOCALE_LABELS[code] ?? code
        }));
    });

    /**
     * Get language labels for display (e.g., "Deutsch", "English")
     */
    const getLanguageLabels = computed(() => {
        const labels: Record<string, string> = {};

        availableLocales.value.forEach((code: string) => {
            const entry = effectiveLocales.value.find((l: { code: string }) => l.code === code);
            labels[code] = entry?.name || LOCALE_LABELS[code] || code.toUpperCase();
        });

        return labels;
    });

    /**
     * Get compact language codes for display (e.g., "DE", "EN", "LS")
     */
    const getLanguageCodes = computed(() => {
        const codes: Record<string, string> = {};

        availableLocales.value.forEach((code: string) => {
            codes[code] = LOCALE_DISPLAY_CODES[code] || code.split('-')[0].toUpperCase();
        });

        return codes;
    });

    return {
        currentLocale: locale,
        defaultLocale,
        switchLanguage,
        restoreLocale,
        hasSavedLocale,
        clearSavedLocale,
        isChangingLocale,
        availableLocales,
        effectiveLocales,
        getNextLocale,
        getLanguageLabels,
        getLanguageCodes,
        configReady // Expose to know when dynamic config is loaded
    };
}
