/**
 * Unit Tests for useLanguage Composable
 *
 * Focus: the `effectiveLocales` fallback introduced for tenants whose
 * jurisdiction config ships `languages.available` without the companion
 * `languages.locales` array. The composable must synthesise a safe
 * default so downstream consumers (e.g. the dashboard language switcher)
 * keep rendering display metadata instead of failing silently.
 *
 * @see app/composables/core/useLanguage.ts
 * @see https://github.com/markaspot/markaspot-ui/issues/357
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';

const mockLocaleRef = ref<string>('de');
const mockLocales = ref<Array<{ code: string }>>([
    { code: 'de' },
    { code: 'en' }
]);

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        locale: mockLocaleRef,
        locales: mockLocales
    })
}));

const mockMasLanguages = ref<any>(null);
const mockMasIsReady = ref(true);

// @ts-expect-error test-only global shim
globalThis.useMarkASpotConfig = () => ({
    languages: mockMasLanguages,
    isReady: mockMasIsReady
});

// @ts-expect-error test-only global shim
globalThis.useRuntimeConfig = () => ({
    public: {
        clientConfig: {
            languages: {}
        }
    }
});

// eslint-disable-next-line import/first
import { useLanguage } from '~/app/composables/core/useLanguage';

describe('useLanguage', () => {
    beforeEach(() => {
        mockLocaleRef.value = 'de';
        mockLocales.value = [{ code: 'de' }, { code: 'en' }];
        mockMasLanguages.value = null;
        mockMasIsReady.value = true;
    });

    describe('effectiveLocales', () => {
        it('passes through Drupal locales when present', () => {
            mockMasLanguages.value = {
                available: ['de', 'en'],
                default: 'de',
                locales: [
                    { code: 'de', name: 'Deutsch (Custom)', iso: 'de-DE' },
                    { code: 'en', name: 'English (Custom)', iso: 'en-US' }
                ]
            };

            const { effectiveLocales } = useLanguage();

            expect(effectiveLocales.value).toEqual([
                { code: 'de', name: 'Deutsch (Custom)', iso: 'de-DE' },
                { code: 'en', name: 'English (Custom)', iso: 'en-US' }
            ]);
        });

        it('synthesises locales from available when Drupal omits the locales array', () => {
            mockMasLanguages.value = {
                available: ['de', 'en'],
                default: 'de'
            };

            const { effectiveLocales } = useLanguage();

            expect(effectiveLocales.value).toEqual([
                { code: 'de', iso: 'DE', name: 'Deutsch' },
                { code: 'en', iso: 'EN', name: 'English' }
            ]);
        });

        it('synthesises locales when Drupal ships an empty locales array', () => {
            mockLocales.value = [{ code: 'tr' }];
            mockMasLanguages.value = {
                available: ['tr'],
                default: 'tr',
                locales: []
            };

            const { effectiveLocales } = useLanguage();

            expect(effectiveLocales.value).toEqual([
                { code: 'tr', iso: 'TR', name: 'Türkçe' }
            ]);
        });

        it('filters backend languages that have no registered UI locale', () => {
            mockMasLanguages.value = {
                available: ['de', 'xx-yy', 'fr'],
                default: 'de'
            };

            const { availableLocales, effectiveLocales } = useLanguage();

            expect(availableLocales.value).toEqual(['de']);

            expect(effectiveLocales.value).toEqual([
                { code: 'de', iso: 'DE', name: 'Deutsch' }
            ]);
        });

        it('keeps backend languages when the UI locale is registered', () => {
            mockLocales.value = [{ code: 'de' }, { code: 'fr' }];
            mockMasLanguages.value = {
                available: ['de', 'fr'],
                default: 'de'
            };

            const { availableLocales, effectiveLocales } = useLanguage();

            expect(availableLocales.value).toEqual(['de', 'fr']);
            expect(effectiveLocales.value).toEqual([
                { code: 'de', iso: 'DE', name: 'Deutsch' },
                { code: 'fr', iso: 'FR', name: 'Français' }
            ]);
        });

        it('filters Drupal locale metadata to the renderable available locales', () => {
            mockLocales.value = [{ code: 'de' }, { code: 'fr' }];
            mockMasLanguages.value = {
                available: ['de'],
                default: 'de',
                locales: [
                    { code: 'de', name: 'Deutsch (Custom)', iso: 'de-DE' },
                    { code: 'fr', name: 'Français (Hidden)', iso: 'fr-FR' }
                ]
            };

            const { effectiveLocales } = useLanguage();

            expect(effectiveLocales.value).toEqual([
                { code: 'de', name: 'Deutsch (Custom)', iso: 'de-DE' }
            ]);
        });
    });

    describe('getLanguageLabels via effectiveLocales', () => {
        it('prefers custom Drupal names when provided', () => {
            mockMasLanguages.value = {
                available: ['de', 'en'],
                default: 'de',
                locales: [
                    { code: 'de', name: 'Deutsch (Custom)' },
                    { code: 'en', name: 'English (Custom)' }
                ]
            };

            const { getLanguageLabels } = useLanguage();

            expect(getLanguageLabels.value).toEqual({
                de: 'Deutsch (Custom)',
                en: 'English (Custom)'
            });
        });

        it('picks up synthesised names when Drupal omits locales', () => {
            mockMasLanguages.value = {
                available: ['de', 'en'],
                default: 'de'
            };

            const { getLanguageLabels } = useLanguage();

            expect(getLanguageLabels.value).toEqual({
                de: 'Deutsch',
                en: 'English'
            });
        });
    });

    describe('defaultLocale', () => {
        it('falls back to the first renderable locale when the configured default is not available', () => {
            mockLocales.value = [{ code: 'de' }, { code: 'fr' }];
            mockMasLanguages.value = {
                available: ['de'],
                default: 'fr'
            };

            const { defaultLocale } = useLanguage();

            expect(defaultLocale.value).toBe('de');
        });
    });
});
