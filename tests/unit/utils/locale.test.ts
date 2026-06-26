import { describe, it, expect } from 'vitest';
import {
    normalizeI18nLocaleCodes,
    resolveLocaleDir,
    resolveRenderableDefaultLocale,
    resolveRenderableLocaleCodes
} from '~/utils/locale';

describe('resolveLocaleDir', () => {
    it('returns "rtl" for the bare Arabic primary subtag', () => {
        expect(resolveLocaleDir('ar')).toBe('rtl');
    });

    it('returns "rtl" for region-qualified RTL locales', () => {
        expect(resolveLocaleDir('ar-SA')).toBe('rtl');
        expect(resolveLocaleDir('he-IL')).toBe('rtl');
        expect(resolveLocaleDir('fa-IR')).toBe('rtl');
        expect(resolveLocaleDir('ur-PK')).toBe('rtl');
    });

    it('is case-insensitive on the primary subtag', () => {
        expect(resolveLocaleDir('AR')).toBe('rtl');
        expect(resolveLocaleDir('Ar-sa')).toBe('rtl');
    });

    it('returns "ltr" for European locales', () => {
        expect(resolveLocaleDir('de')).toBe('ltr');
        expect(resolveLocaleDir('de-DE')).toBe('ltr');
        expect(resolveLocaleDir('en-US')).toBe('ltr');
        expect(resolveLocaleDir('nl-NL')).toBe('ltr');
        expect(resolveLocaleDir('uk-UA')).toBe('ltr');
    });

    it('treats compound locale variants by primary subtag', () => {
        // de-ls (Einfache Sprache) is German, so LTR.
        expect(resolveLocaleDir('de-ls')).toBe('ltr');
    });

    it('falls back to "ltr" for unknown / empty / null input', () => {
        expect(resolveLocaleDir('')).toBe('ltr');
        expect(resolveLocaleDir(null)).toBe('ltr');
        expect(resolveLocaleDir(undefined)).toBe('ltr');
        expect(resolveLocaleDir('xx')).toBe('ltr');
    });
});

describe('renderable locale helpers', () => {
    it('normalizes Nuxt i18n locale entries', () => {
        expect(normalizeI18nLocaleCodes(['de', { code: 'en' }, { code: '' }, {}])).toEqual(['de', 'en']);
    });

    it('filters locale codes to supported and renderable locales', () => {
        expect(resolveRenderableLocaleCodes(['de', 'xx', 'fr', 'de'], ['de', 'en'])).toEqual(['de']);
    });

    it('resolves invalid configured defaults to the first renderable available locale', () => {
        expect(resolveRenderableDefaultLocale('fr', ['de'], ['de', 'fr'])).toBe('de');
    });

    it('falls back to the global default when no available locale is renderable', () => {
        expect(resolveRenderableDefaultLocale('fr', ['xx'], ['de', 'en'])).toBe('de');
    });
});
