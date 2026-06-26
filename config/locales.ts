/**
 * Centralized locale configuration
 *
 * Single source of truth for all supported locales.
 * Used by nuxt.config.ts (i18n module) and server middleware.
 *
 * Order: default (de) and its Leichte-Sprache variant first, then en as
 * international fallback, then alphabetical by native name. The switcher
 * surfaces this order verbatim, so keep priority + alpha consistent.
 *
 * displayCode follows the language code (uppercased), not the country.
 * ISO follows the `language-region` convention (e.g. `cs-CZ`, `ar-SA`)
 * to match the backend `LOCALE_ISO_CODES` mapping in
 * markaspot_nuxt's TenantSettingsController.
 */
export const SUPPORTED_LOCALES = [
    { code: 'de', iso: 'de-DE', file: 'de.ts', name: 'Deutsch', displayCode: 'DE' },
    { code: 'de-ls', iso: 'de-DE', file: 'de-ls.ts', name: 'Einfache Sprache', displayCode: 'LS' },
    { code: 'en', iso: 'en-US', file: 'en.ts', name: 'English', displayCode: 'EN' },
    { code: 'cs', iso: 'cs-CZ', file: 'cs.ts', name: 'Čeština', displayCode: 'CS' },
    { code: 'da', iso: 'da-DK', file: 'da.ts', name: 'Dansk', displayCode: 'DA' },
    { code: 'es', iso: 'es-ES', file: 'es.ts', name: 'Español', displayCode: 'ES' },
    { code: 'fr', iso: 'fr-FR', file: 'fr.ts', name: 'Français', displayCode: 'FR' },
    { code: 'it', iso: 'it-IT', file: 'it.ts', name: 'Italiano', displayCode: 'IT' },
    { code: 'hu', iso: 'hu-HU', file: 'hu.ts', name: 'Magyar', displayCode: 'HU' },
    { code: 'nl', iso: 'nl-NL', file: 'nl.ts', name: 'Nederlands', displayCode: 'NL' },
    { code: 'nb', iso: 'nb-NO', file: 'nb.ts', name: 'Norsk bokmål', displayCode: 'NB' },
    { code: 'pl', iso: 'pl-PL', file: 'pl.ts', name: 'Polski', displayCode: 'PL' },
    { code: 'pt', iso: 'pt-PT', file: 'pt.ts', name: 'Português', displayCode: 'PT' },
    { code: 'fi', iso: 'fi-FI', file: 'fi.ts', name: 'Suomi', displayCode: 'FI' },
    { code: 'sv', iso: 'sv-SE', file: 'sv.ts', name: 'Svenska', displayCode: 'SV' },
    { code: 'tr', iso: 'tr-TR', file: 'tr.ts', name: 'Türkçe', displayCode: 'TR' },
    { code: 'uk', iso: 'uk-UA', file: 'uk.ts', name: 'Українська', displayCode: 'UK' },
    { code: 'ar', iso: 'ar-SA', file: 'ar.ts', name: 'العربية', displayCode: 'AR', dir: 'rtl' }
] as const;

export const LOCALE_CODES = SUPPORTED_LOCALES.map(l => l.code);

export const DEFAULT_LOCALE = 'de';

// Derived lookup maps for convenience
export const LOCALE_LABELS: Record<string, string> = Object.fromEntries(
    SUPPORTED_LOCALES.map(l => [l.code, l.name])
);

export const LOCALE_DISPLAY_CODES: Record<string, string> = Object.fromEntries(
    SUPPORTED_LOCALES.map(l => [l.code, l.displayCode])
);

// Type exports
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isLocaleCode(value: string): value is LocaleCode {
    return (LOCALE_CODES as readonly string[]).includes(value);
}
