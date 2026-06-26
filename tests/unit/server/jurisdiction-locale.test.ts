/**
 * server/middleware/01.jurisdiction-locale.ts
 *
 * Covers the resolveFallbackLocale fix: when no tenant slug and no
 * NUXT_PUBLIC_JURISDICTION_ID resolves, the middleware must distinguish
 * genuine marketing/brand-root paths (honor Accept-Language, fall back to
 * 'en') from unprefixed app routes like /dashboard (resolve to the DEFAULT
 * jurisdiction's languages.default, NOT Accept-Language).
 *
 * The handler talks to Drupal over $fetch for two endpoints:
 *  - GET {apiBase}/api/jurisdictions               -> { jurisdictions: [...] }
 *  - GET {apiBase}/api/mark-a-spot-settings?...     -> { languages: { default } }
 *
 * It sets event.node.req.headers['accept-language'] and
 * event.context.nuxtI18n.detectLocale to the resolved locale.
 *
 * Module-level caches (jurisdictionsCache, defaultLocaleCache) persist for the
 * Nitro process lifetime, so each test re-imports the handler through
 * vi.resetModules() to start from a cold cache.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { H3Event } from 'h3';

// The source file imports only `isLocaleCode` (config/locales) and the fastmap
// path helpers; both are pure data/logic modules and stay real. Everything else
// it uses — defineEventHandler, getRequestURL, getCookie, getRequestHeader,
// $fetch, useRuntimeConfig — is a Nitro/Nuxt AUTO-IMPORT (no `import` statement
// in the source), so they must be provided as globals, not via vi.mock('h3').
const mockFetch = vi.hoisted(() => vi.fn());

function stubH3Globals() {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
    vi.stubGlobal(
        'getRequestURL',
        (event: { _pathname: string }) => new URL(`https://example.test${event._pathname}`)
    );
    vi.stubGlobal(
        'getCookie',
        (event: { _cookies?: Record<string, string> }, name: string) => event._cookies?.[name]
    );
    vi.stubGlobal(
        'getRequestHeader',
        (event: { _headers?: Record<string, string> }, name: string) => event._headers?.[name.toLowerCase()]
    );
}

interface FetchMaps {
    jurisdictions?: Array<{ id: number, slug: string, isDefault?: boolean }>
    jurisdictionsRejects?: boolean
    settings?: Record<string, { languages?: { default?: string } }>
}

function configureFetch({ jurisdictions, jurisdictionsRejects, settings }: FetchMaps) {
    mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/api/jurisdictions')) {
            if (jurisdictionsRejects) {
                throw new Error('Drupal unavailable');
            }
            return { jurisdictions: jurisdictions ?? [] };
        }
        if (url.includes('/api/mark-a-spot-settings')) {
            const match = url.match(/jurisdiction=([^&]+)/);
            const key = match ? decodeURIComponent(match[1]) : '';
            const entry = settings?.[key];
            if (!entry) {
                throw new Error(`no settings for ${key}`);
            }
            return entry;
        }
        throw new Error(`unexpected url ${url}`);
    });
}

interface EventInit {
    pathname: string
    acceptLanguage?: string
    cookieLocale?: string
}

function createEvent({ pathname, acceptLanguage, cookieLocale }: EventInit) {
    return {
        _pathname: pathname,
        _headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {},
        _cookies: cookieLocale ? { mas_locale: cookieLocale } : {},
        node: { req: { headers: {} as Record<string, string> } },
        context: {} as Record<string, any>
    };
}

async function loadHandler() {
    // Fresh module instance -> empty jurisdictionsCache + defaultLocaleCache.
    vi.resetModules();
    const mod = await import('~/server/middleware/01.jurisdiction-locale');
    return mod.default as (event: H3Event) => Promise<void>;
}

function setRuntimeConfig(jurisdictionId: string | number | undefined = undefined) {
    vi.stubGlobal('useRuntimeConfig', () => ({
        apiBase: 'http://web',
        jurisdictionId,
        public: { apiBase: 'http://web' }
    }));
}

describe('01.jurisdiction-locale middleware — resolveFallbackLocale', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        mockFetch.mockReset();
        stubH3Globals();
        vi.stubGlobal('$fetch', mockFetch);
        setRuntimeConfig(undefined);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('resolves /dashboard (no slug, no ENV) to the DEFAULT jurisdiction languages.default, not Accept-Language', async () => {
        configureFetch({
            jurisdictions: [
                { id: 1, slug: 'amsterdam', isDefault: false },
                { id: 2, slug: 'koeln', isDefault: true }
            ],
            settings: {
                koeln: { languages: { default: 'de' } }
            }
        });
        const handler = await loadHandler();

        // Browser asks for French; the tenant default (de) must win on an app route.
        const event = createEvent({ pathname: '/dashboard', acceptLanguage: 'fr' });
        await handler(event as never);

        expect(event.node.req.headers['accept-language']).toBe('de');
        expect(event.context.nuxtI18n.detectLocale).toBe('de');
        // Settings were resolved for the DEFAULT jurisdiction, not jurisdictions[0].
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('jurisdiction=koeln'),
            expect.anything()
        );
        expect(mockFetch).not.toHaveBeenCalledWith(
            expect.stringContaining('jurisdiction=amsterdam'),
            expect.anything()
        );
    });

    it('honors Accept-Language on the marketing root "/" with an "en" fallback', async () => {
        // Even with jurisdictions present, the marketing root must not leak a
        // tenant locale: only Accept-Language (then 'en') decides.
        configureFetch({
            jurisdictions: [{ id: 2, slug: 'koeln', isDefault: true }],
            settings: { koeln: { languages: { default: 'de' } } }
        });
        const handler = await loadHandler();

        const matched = createEvent({ pathname: '/', acceptLanguage: 'fr-FR,fr;q=0.9' });
        await handler(matched as never);
        expect(matched.node.req.headers['accept-language']).toBe('fr');

        // No Accept-Language match -> 'en' brand fallback, never a tenant default.
        const fallbackHandler = await loadHandler();
        const noHeader = createEvent({ pathname: '/' });
        await fallbackHandler(noHeader as never);
        expect(noHeader.node.req.headers['accept-language']).toBe('en');

        // The marketing root never queries mark-a-spot-settings for a tenant.
        expect(mockFetch).not.toHaveBeenCalledWith(
            expect.stringContaining('/api/mark-a-spot-settings'),
            expect.anything()
        );
    });

    it('getDefaultJurisdictionSlug prefers the isDefault jurisdiction over jurisdictions[0]', async () => {
        // jurisdictions[0] is amsterdam (de), but the isDefault one is rotterdam (nl).
        configureFetch({
            jurisdictions: [
                { id: 1, slug: 'amsterdam', isDefault: false },
                { id: 5, slug: 'rotterdam', isDefault: true }
            ],
            settings: {
                amsterdam: { languages: { default: 'de' } },
                rotterdam: { languages: { default: 'nl' } }
            }
        });
        const handler = await loadHandler();

        const event = createEvent({ pathname: '/requests' });
        await handler(event as never);

        // nl from the isDefault jurisdiction wins, not de from jurisdictions[0].
        expect(event.node.req.headers['accept-language']).toBe('nl');
        expect(event.context.nuxtI18n.detectLocale).toBe('nl');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('jurisdiction=rotterdam'),
            expect.anything()
        );
    });

    it('falls back to a sane brand locale and does NOT pin a wrong locale process-wide on a Drupal outage', async () => {
        // /api/jurisdictions rejects -> no default slug is known. The handler
        // must fall back to brand-root detection (Accept-Language, then en) and
        // must NOT persist that as a cache hit, so the next request retries.
        configureFetch({
            jurisdictionsRejects: true,
            settings: { koeln: { languages: { default: 'de' } } }
        });
        const handler = await loadHandler();

        // First (outage) request on an app route: degrade to Accept-Language ('it').
        const outageEvent = createEvent({ pathname: '/dashboard', acceptLanguage: 'it' });
        await handler(outageEvent as never);

        expect(outageEvent.node.req.headers['accept-language']).toBe('it');
        // No tenant settings lookup happened — there is no default slug to query.
        expect(mockFetch).not.toHaveBeenCalledWith(
            expect.stringContaining('/api/mark-a-spot-settings'),
            expect.anything()
        );

        // Drupal recovers. Because the empty/failed jurisdictions result was NOT
        // cached, the next request retries the fetch and resolves the real
        // default jurisdiction locale instead of staying pinned to 'it'.
        configureFetch({
            jurisdictions: [{ id: 2, slug: 'koeln', isDefault: true }],
            settings: { koeln: { languages: { default: 'de' } } }
        });
        const recoveredEvent = createEvent({ pathname: '/dashboard', acceptLanguage: 'it' });
        await handler(recoveredEvent as never);

        expect(recoveredEvent.node.req.headers['accept-language']).toBe('de');
        expect(recoveredEvent.context.nuxtI18n.detectLocale).toBe('de');
    });
});
