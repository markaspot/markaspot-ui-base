/**
 * Locale utility helpers
 *
 * Provides functions for getting the current locale in contexts
 * where useI18n() might not be available (e.g., Pinia stores).
 */
import { LOCALE_CODES, isLocaleCode } from '../../config/locales';

/**
 * Default locale fallback
 */
export const DEFAULT_LOCALE = 'de';
export type I18nLocaleEntry = string | { code?: string };

/**
 * Locale codes that use right-to-left writing direction.
 *
 * Matches BCP-47 primary subtags so any region variant (e.g. `ar-SA`,
 * `he-IL`) resolves correctly. Keep this list in sync with the
 * `dir: 'rtl'` flags on entries in `config/locales.ts`.
 */
const RTL_LOCALE_PREFIXES = ['ar', 'he', 'fa', 'ur'] as const;

export type LocaleDir = 'ltr' | 'rtl';

/**
 * Resolve the writing direction for a given locale code.
 *
 * Accepts BCP-47 codes (`ar`, `ar-SA`, `de`, `de-DE`, `de-ls`).
 * Returns `'rtl'` for Arabic, Hebrew, Persian, Urdu and their
 * regional variants, `'ltr'` otherwise.
 */
export function resolveLocaleDir(locale: string | null | undefined): LocaleDir {
    if (!locale || typeof locale !== 'string') return 'ltr';
    const primary = locale.toLowerCase().split('-')[0];
    return RTL_LOCALE_PREFIXES.includes(primary as typeof RTL_LOCALE_PREFIXES[number]) ? 'rtl' : 'ltr';
}

export function normalizeI18nLocaleCodes(locales: readonly I18nLocaleEntry[] | null | undefined): string[] {
    if (!Array.isArray(locales)) {
        return [...LOCALE_CODES];
    }

    const codes = locales
        .map(locale => typeof locale === 'string' ? locale : locale.code)
        .filter((code): code is string => typeof code === 'string' && code.length > 0);

    return codes.length ? codes : [...LOCALE_CODES];
}

export function resolveRenderableLocaleCodes(
    codes: readonly (string | null | undefined)[] | null | undefined,
    renderableCodes: readonly (string | null | undefined)[] | null | undefined = LOCALE_CODES
): string[] {
    const renderable = new Set(
        (renderableCodes?.length ? renderableCodes : LOCALE_CODES)
            .filter((code): code is string => typeof code === 'string' && isLocaleCode(code))
    );
    const seen = new Set<string>();

    return (codes || []).filter((code): code is string => {
        if (typeof code !== 'string' || !isLocaleCode(code) || !renderable.has(code) || seen.has(code)) {
            return false;
        }
        seen.add(code);
        return true;
    });
}

export function resolveRenderableDefaultLocale(
    configuredDefault: string | null | undefined,
    availableCodes: readonly (string | null | undefined)[] | null | undefined,
    renderableCodes: readonly (string | null | undefined)[] | null | undefined = LOCALE_CODES,
    fallback = DEFAULT_LOCALE
): string {
    const available = resolveRenderableLocaleCodes(availableCodes, renderableCodes);

    if (configuredDefault && available.includes(configuredDefault)) {
        return configuredDefault;
    }
    if (available[0]) {
        return available[0];
    }

    const fallbackCodes = resolveRenderableLocaleCodes([fallback], renderableCodes);
    return fallbackCodes[0] || DEFAULT_LOCALE;
}

/**
 * Get current locale from Nuxt app context
 *
 * Safe to use in Pinia stores and other contexts where
 * useI18n() composable might not be available.
 *
 * @returns Current locale code or default fallback
 */
export function getCurrentLocale(): string {
    try {
        const nuxtApp = useNuxtApp();
        const i18n = nuxtApp.$i18n;
        if (i18n?.locale) {
            return typeof i18n.locale === 'string' ? i18n.locale : i18n.locale.value || DEFAULT_LOCALE;
        }
    } catch {
        // useNuxtApp may not be available in all contexts
    }
    return DEFAULT_LOCALE;
}
