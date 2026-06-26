/**
 * Unit tests for useErrorPageJurisdiction
 *
 * Covers the error-page jurisdiction resolver that drives error.vue.
 * Tests are written against the pure `resolveErrorPageJurisdiction` function
 * to avoid the Nuxt runtime, plus a small helper test for `firstPathSegment`.
 *
 * Matches issue markaspot/markaspot-ui#328.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    resolveErrorPageJurisdiction,
    firstPathSegment,
    resolveSsrJurisdictionKey
} from '../../../../app/composables/core/useErrorPageJurisdiction';

describe('firstPathSegment', () => {
    it('returns the first segment from a full URL', () => {
        expect(firstPathSegment('https://dev.ddev.site:3001/utrecht/does-not-exist')).toBe('utrecht');
    });

    it('returns the first segment from a path-only string', () => {
        expect(firstPathSegment('/bcp-council/404')).toBe('bcp-council');
    });

    it('tolerates missing leading slash', () => {
        expect(firstPathSegment('amsterdam/x')).toBe('amsterdam');
    });

    it('returns empty string on root / undefined / empty', () => {
        expect(firstPathSegment(undefined)).toBe('');
        expect(firstPathSegment('')).toBe('');
        expect(firstPathSegment('/')).toBe('');
        expect(firstPathSegment('https://example.com/')).toBe('');
    });
});

describe('resolveErrorPageJurisdiction', () => {
    const baseDeps = {
        serverJurisdictionId: '',
        clientJurisdictionKey: '',
        urlFirstSegment: '',
        fetchSettings: vi.fn().mockResolvedValue(null),
        isServer: false,
        isDev: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('server single-tenant via runtimeConfig.jurisdictionId', () => {
        it('fetches the settings API using the server jurisdiction id', async () => {
            const fetchSettings = vi.fn().mockResolvedValue({
                theme: { logos: { light: '/sites/default/files/maak-et.svg' } },
                languages: {
                    default: 'nl',
                    available: ['nl', 'en'],
                    locales: [
                        { code: 'nl', name: 'Nederlands', iso: 'nl-NL' },
                        { code: 'en', name: 'English', iso: 'en-US' }
                    ]
                }
            });

            const result = await resolveErrorPageJurisdiction({
                ...baseDeps,
                isServer: true,
                serverJurisdictionId: '5',
                fetchSettings
            });

            expect(fetchSettings).toHaveBeenCalledExactlyOnceWith('5');
            expect(result).toEqual({
                logos: { light: '/sites/default/files/maak-et.svg' },
                defaultLocale: 'nl',
                availableLocales: ['nl', 'en'],
                locales: [
                    { code: 'nl', name: 'Nederlands', iso: 'nl-NL' },
                    { code: 'en', name: 'English', iso: 'en-US' }
                ]
            });
        });

        it('ignores clientJurisdictionKey when running on the server', async () => {
            const fetchSettings = vi.fn().mockResolvedValue({
                theme: { logos: { light: '/from-server.svg' } },
                languages: { default: 'nl' }
            });

            await resolveErrorPageJurisdiction({
                ...baseDeps,
                isServer: true,
                serverJurisdictionId: '5',
                clientJurisdictionKey: 'bcp-council', // should not win on server
                fetchSettings
            });

            expect(fetchSettings).toHaveBeenCalledExactlyOnceWith('5');
        });
    });

    describe('client single-tenant via useState("mas-config-jurisdiction-key")', () => {
        it('fetches the settings API using the SSR-transported slug', async () => {
            const fetchSettings = vi.fn().mockResolvedValue({
                theme: { logos: { light: '/sites/default/files/rotterdam.svg' } },
                languages: {
                    default: 'nl',
                    available: ['nl', 'en']
                }
            });

            const result = await resolveErrorPageJurisdiction({
                ...baseDeps,
                isServer: false,
                clientJurisdictionKey: 'rotterdam',
                fetchSettings
            });

            expect(fetchSettings).toHaveBeenCalledExactlyOnceWith('rotterdam');
            expect(result.defaultLocale).toBe('nl');
            expect(result.availableLocales).toEqual(['nl', 'en']);
        });

        it('ignores serverJurisdictionId when running on the client', async () => {
            const fetchSettings = vi.fn().mockResolvedValue({
                theme: { logos: { light: '/from-client.svg' } }
            });

            await resolveErrorPageJurisdiction({
                ...baseDeps,
                isServer: false,
                serverJurisdictionId: '99', // should not win on client
                clientJurisdictionKey: 'rotterdam',
                fetchSettings
            });

            expect(fetchSettings).toHaveBeenCalledExactlyOnceWith('rotterdam');
        });
    });

    describe('multi-tenant URL segment fallback', () => {
        it('falls through to urlFirstSegment when no tenant id is known', async () => {
            const fetchSettings = vi.fn().mockResolvedValue({
                theme: { logos: { light: '/bcp.svg', dark: '/bcp-dark.svg' } },
                languages: {
                    default: 'en',
                    available: ['en', 'de'],
                    locales: [
                        { code: 'en', name: 'English' },
                        { code: 'de', name: 'Deutsch' }
                    ]
                }
            });

            const result = await resolveErrorPageJurisdiction({
                ...baseDeps,
                urlFirstSegment: 'bcp-council',
                fetchSettings
            });

            expect(fetchSettings).toHaveBeenCalledExactlyOnceWith('bcp-council');
            expect(result.logos).toEqual({ light: '/bcp.svg', dark: '/bcp-dark.svg' });
            expect(result.defaultLocale).toBe('en');
            expect(result.availableLocales).toEqual(['en', 'de']);
            expect(result.locales).toEqual([
                { code: 'en', name: 'English' },
                { code: 'de', name: 'Deutsch' }
            ]);
        });

        it('prefers the single-tenant id over the URL segment', async () => {
            const fetchSettings = vi.fn().mockResolvedValue({});

            await resolveErrorPageJurisdiction({
                ...baseDeps,
                isServer: true,
                serverJurisdictionId: '5',
                urlFirstSegment: 'amsterdam',
                fetchSettings
            });

            expect(fetchSettings).toHaveBeenCalledExactlyOnceWith('5');
        });
    });

    describe('cold fallback (no identifier known)', () => {
        it('returns nulls without a fetch when nothing resolves an identifier', async () => {
            const fetchSettings = vi.fn();
            const result = await resolveErrorPageJurisdiction({
                ...baseDeps,
                fetchSettings
            });

            expect(result).toEqual({
                logos: null,
                defaultLocale: null,
                availableLocales: [],
                locales: []
            });
            expect(fetchSettings).not.toHaveBeenCalled();
        });
    });

    describe('fetch error handling', () => {
        it('swallows fetch errors silently in production', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const fetchSettings = vi.fn().mockRejectedValue(new Error('timeout'));

            const result = await resolveErrorPageJurisdiction({
                ...baseDeps,
                isDev: false,
                urlFirstSegment: 'rotterdam',
                fetchSettings
            });

            expect(result).toEqual({
                logos: null,
                defaultLocale: null,
                availableLocales: [],
                locales: []
            });
            expect(warnSpy).not.toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('warns in dev mode when the fetch fails', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const fetchSettings = vi.fn().mockRejectedValue(new Error('boom'));

            await resolveErrorPageJurisdiction({
                ...baseDeps,
                isDev: true,
                urlFirstSegment: 'rotterdam',
                fetchSettings
            });

            expect(warnSpy).toHaveBeenCalled();
            const [msg] = warnSpy.mock.calls[0] ?? [];
            expect(String(msg)).toContain('rotterdam');
            warnSpy.mockRestore();
        });
    });

    describe('hydration-safety: singleton is NOT trusted', () => {
        // Regression guard: the resolver takes no `hydratedConfig` parameter
        // at all. Any attempt to read the useMarkASpotConfig singleton would
        // silently serve the wrong tenant — on the server because its module
        // cache leaks across requests, on the client because it is populated
        // by the bootstrap page load and inherits whichever tenant the bundle
        // initialised with, not the tenant addressed in the failing URL.
        //
        // See issue markaspot/markaspot-ui#328 and the live DevTools session
        // that surfaced a hydration mismatch where a /utrecht 404 hydrated to
        // the Amsterdam logo because the singleton held jurisdiction 1.
        it('resolves through the identifier chain on every call, no shortcut', async () => {
            const fetchSettings = vi.fn().mockResolvedValue({
                theme: { logos: { light: '/utrecht.svg' } },
                languages: { default: 'nl' }
            });

            const result = await resolveErrorPageJurisdiction({
                ...baseDeps,
                isServer: false,
                clientJurisdictionKey: 'utrecht',
                fetchSettings
            });

            expect(fetchSettings).toHaveBeenCalledExactlyOnceWith('utrecht');
            expect(result.logos).toEqual({ light: '/utrecht.svg' });
            expect(result.defaultLocale).toBe('nl');
        });
    });
});

describe('resolveSsrJurisdictionKey', () => {
    const jurisdictions = [
        { id: 1, slug: 'amsterdam', isDefault: true },
        { id: 2, slug: 'utrecht', isDefault: false },
        { id: 3, slug: 'rotterdam', isDefault: false }
    ];

    it('uses the validated route jurisdiction on normal renders', () => {
        expect(resolveSsrJurisdictionKey({
            routeJurisdictionKey: 'utrecht',
            routePath: '',
            runtimeJurisdictionId: '',
            errorUrl: '',
            jurisdictions
        })).toEqual({ key: 'utrecht', source: 'route' });
    });

    it('falls back to the first route path segment when params are unavailable', () => {
        expect(resolveSsrJurisdictionKey({
            routeJurisdictionKey: '',
            routePath: '/utrecht/does-not-exist',
            runtimeJurisdictionId: '',
            errorUrl: '',
            jurisdictions
        })).toEqual({ key: 'utrecht', source: 'route' });
    });

    it('uses the original error URL tenant when Nuxt rewrites the route to /__nuxt_error', () => {
        expect(resolveSsrJurisdictionKey({
            routeJurisdictionKey: '',
            routePath: '/__nuxt_error',
            runtimeJurisdictionId: '',
            errorUrl: 'https://dev.ddev.site:3001/utrecht/does-not-exist',
            jurisdictions
        })).toEqual({ key: 'utrecht', source: 'error-url' });
    });

    it('keeps the runtime-config tenant authoritative over a conflicting error URL slug', () => {
        expect(resolveSsrJurisdictionKey({
            routeJurisdictionKey: '',
            routePath: '/__nuxt_error',
            runtimeJurisdictionId: '1',
            errorUrl: 'https://dev.ddev.site:3001/rotterdam/does-not-exist',
            jurisdictions
        })).toEqual({ key: 'amsterdam', source: 'runtime-config' });
    });

    it('does not trust an unknown first segment from the error URL', () => {
        expect(resolveSsrJurisdictionKey({
            routeJurisdictionKey: '',
            routePath: '/does-not-exist',
            runtimeJurisdictionId: '1',
            errorUrl: 'https://dev.ddev.site:3001/does-not-exist',
            jurisdictions
        })).toEqual({ key: 'amsterdam', source: 'runtime-config' });
    });

    it('maps a numeric runtime jurisdiction id to its slug', () => {
        expect(resolveSsrJurisdictionKey({
            routeJurisdictionKey: '',
            routePath: '',
            runtimeJurisdictionId: '2',
            errorUrl: '',
            jurisdictions
        })).toEqual({ key: 'utrecht', source: 'runtime-config' });
    });

    it('falls back to the default jurisdiction when nothing else resolves', () => {
        expect(resolveSsrJurisdictionKey({
            routeJurisdictionKey: '',
            routePath: '',
            runtimeJurisdictionId: '',
            errorUrl: '',
            jurisdictions
        })).toEqual({ key: 'amsterdam', source: 'default' });
    });
});
