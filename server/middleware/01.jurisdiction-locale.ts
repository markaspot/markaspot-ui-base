import type { H3Event } from 'h3';
import { isLocaleCode } from '../../config/locales';
import { isFastmapMarketingPath, stripFastmapLocalePrefix } from '../../fastmap-layer/lib/locale-routing';

interface JurisdictionSummary {
    id: number
    slug: string
    isDefault?: boolean
}

const BRAND_FALLBACK_LOCALE = 'en';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes — match server/api/jurisdictions.get.ts

// Cache successful lookups only, with a TTL. A transient Drupal outage must
// never be persisted as a permanent cache hit: that would pin every tenant to
// the wrong locale (or an empty jurisdiction list, so no slug ever matches) for
// the entire Nitro process lifetime, and never pick up newly onboarded tenants.
const defaultLocaleCache = new Map<string, { locale: string, fetchedAt: number }>();
let jurisdictionsCache: JurisdictionSummary[] | null = null;
let jurisdictionsFetchedAt = 0;
let jurisdictionsRefresh: Promise<void> | null = null;

/**
 * Server middleware to resolve the jurisdiction locale for SSR.
 *
 * Runs BEFORE SSR rendering to ensure:
 * - Accept-Language header is set for API proxy
 * - @nuxtjs/i18n receives the resolved locale via Nitro context
 *
 * Tenant requests (slug match or NUXT_PUBLIC_JURISDICTION_ID): Drupal's
 * `languages.default` decides; browser preferences are ignored so hydration
 * always starts from tenant config.
 *
 * Unprefixed app routes (/dashboard, /requests, /auth — no slug, no ENV):
 * resolve to the DEFAULT jurisdiction's locale, not the brand-root locale.
 * This mirrors jurisdiction.global.ts, which redirects exactly these routes to
 * the default jurisdiction's slug when no tenant is specified. Without this the
 * SSR locale (and <html lang>) falls back to Accept-Language / `en`, so the
 * dashboard renders in English even on a German tenant before the client-side
 * tenant locale ever applies (markaspot/markaspot-ui dashboard-en-default).
 *
 * Brand root (civicspot.io/, mark-a-spot.com/ — marketing paths, no slug, no
 * ENV): honor the visitor's Accept-Language, fall back to `en`. Avoids leaking
 * jurisdictions[0]'s locale to the marketing root.
 */
export default defineEventHandler(async (event) => {
    const jurisdictionKey = await resolveJurisdictionKey(event);
    const effectiveLocale = jurisdictionKey
        ? await getJurisdictionDefaultLocale(jurisdictionKey)
        : await resolveFallbackLocale(event);

    if (effectiveLocale && isLocaleCode(effectiveLocale)) {
        event.node.req.headers['accept-language'] = effectiveLocale;
        event.context.nuxtI18n = event.context.nuxtI18n || {};
        event.context.nuxtI18n.detectLocale = effectiveLocale;
    }
});

/**
 * Decide the locale when no tenant slug / ENV resolves.
 *
 * - Genuine marketing/brand-root paths (`/`, `/start`, `/solutions/...`):
 *   browser Accept-Language with `en` fallback (unchanged behaviour).
 * - Any other path is an app route reached without a tenant prefix
 *   (e.g. a bookmarked `/dashboard`). The Vue router middleware
 *   (jurisdiction.global.ts) redirects these to the default jurisdiction's
 *   slug, so the SSR locale must match that target's `languages.default`
 *   instead of falling back to English.
 */
async function resolveFallbackLocale(event: H3Event): Promise<string> {
    const pathname = getRequestURL(event).pathname;
    if (isFastmapMarketingPath(stripFastmapLocalePrefix(pathname))) {
        return pickBrandRootLocale(event);
    }

    const defaultSlug = await getDefaultJurisdictionSlug();
    if (defaultSlug) {
        return getJurisdictionDefaultLocale(defaultSlug);
    }

    // No default jurisdiction known (cold start / Drupal unavailable):
    // fall back to brand-root detection rather than blocking the request.
    return pickBrandRootLocale(event);
}

async function getDefaultJurisdictionSlug(): Promise<string> {
    const jurisdictions = await getJurisdictions();
    const fallback = jurisdictions.find(j => j.isDefault) || jurisdictions[0];
    return fallback?.slug || '';
}

async function resolveJurisdictionKey(event: H3Event): Promise<string> {
    const url = getRequestURL(event);
    const queryJurisdiction = url.searchParams.get('jurisdiction');
    if (queryJurisdiction) {
        return queryJurisdiction;
    }

    // Check URL path slug FIRST, so /bcp-council resolves to BCP Council
    // even when NUXT_PUBLIC_JURISDICTION_ID is set (single-tenant mode).
    // The ENV is only a fallback for paths that don't match any known jurisdiction.
    const jurisdictions = await getJurisdictions();
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];

    if (firstSegment) {
        const matchedJurisdiction = jurisdictions.find(j => j.slug === firstSegment);
        if (matchedJurisdiction) {
            return matchedJurisdiction.slug;
        }
    }

    // Fall back to ENV-configured jurisdiction (single-tenant mode)
    const config = useRuntimeConfig();
    if (config.jurisdictionId) {
        // Resolve numeric ID to slug if possible
        const envId = String(config.jurisdictionId);
        if (/^\d+$/.test(envId)) {
            const jur = jurisdictions.find(j => j.id === Number(envId));
            return jur?.slug || envId;
        }
        return envId;
    }

    // Brand root: no slug match, no ENV. Caller falls back to brand-locale
    // detection. Returning '' avoids leaking jurisdictions[0]'s locale.
    return '';
}

function pickBrandRootLocale(event: H3Event): string {
    const cookieLocale = getCookie(event, 'mas_locale');
    if (cookieLocale && isLocaleCode(cookieLocale)) {
        return cookieLocale;
    }

    // Cap header length defensively; real browsers send <200 bytes.
    const header = (getRequestHeader(event, 'accept-language') || '').slice(0, 1024);
    const tags = header
        .split(',')
        .map(t => t.split(';')[0]?.trim().toLowerCase())
        .filter((t): t is string => Boolean(t));
    for (const tag of tags) {
        if (isLocaleCode(tag)) return tag;
        const base = tag.split('-')[0];
        if (base && isLocaleCode(base)) return base;
    }

    return BRAND_FALLBACK_LOCALE;
}

async function getJurisdictionDefaultLocale(jurisdictionKey: string): Promise<string> {
    const cached = defaultLocaleCache.get(jurisdictionKey);
    const now = Date.now();
    if (cached && (now - cached.fetchedAt) < CACHE_TTL) {
        return cached.locale;
    }

    try {
        const config = useRuntimeConfig();
        const apiBase = config.apiBase || config.public?.apiBase || 'http://web';
        const settingsUrl = `${apiBase}/api/mark-a-spot-settings?jurisdiction=${encodeURIComponent(jurisdictionKey)}`;
        const data = await $fetch<{ languages?: { default?: string } }>(settingsUrl, { timeout: 3000 });
        const locale = data?.languages?.default || 'de';
        defaultLocaleCache.set(jurisdictionKey, { locale, fetchedAt: now });
        return locale;
    } catch {
        // Do NOT persist the fallback: a transient outage must not pin 'de' for
        // the process lifetime. Serve last-known-good if we have it, else a
        // one-shot fallback so the next request retries the lookup.
        return cached?.locale || 'de';
    }
}

async function refreshJurisdictions(): Promise<void> {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase || config.public?.apiBase || 'http://web';
    const data = await $fetch<{ jurisdictions?: JurisdictionSummary[] }>(`${apiBase}/api/jurisdictions`, { timeout: 3000 });
    jurisdictionsCache = data?.jurisdictions || [];
    jurisdictionsFetchedAt = Date.now();
}

function scheduleJurisdictionsRefresh(context: string): Promise<void> {
    if (!jurisdictionsRefresh) {
        jurisdictionsRefresh = refreshJurisdictions()
            .catch((error) => {
                const msg = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`[jurisdiction-locale] Jurisdictions ${context} failed: ${msg}`);
            })
            .finally(() => {
                jurisdictionsRefresh = null;
            });
    }
    return jurisdictionsRefresh;
}

async function getJurisdictions(): Promise<JurisdictionSummary[]> {
    const now = Date.now();
    const isFresh = jurisdictionsFetchedAt > 0 && (now - jurisdictionsFetchedAt) < CACHE_TTL;

    // Fresh cache: serve immediately, no Drupal roundtrip.
    if (isFresh && jurisdictionsCache) {
        return jurisdictionsCache;
    }

    // Stale cache: serve stale immediately, refresh in the background.
    if (jurisdictionsCache && jurisdictionsFetchedAt > 0) {
        void scheduleJurisdictionsRefresh('refresh');
        return jurisdictionsCache;
    }

    // No cache yet (cold start, or every prior fetch failed): await one attempt.
    // On failure jurisdictionsCache stays null and fetchedAt stays 0, so we
    // return [] for THIS request only and the next request retries — the empty
    // failure result is never persisted as a cache hit.
    await scheduleJurisdictionsRefresh('fetch');
    return jurisdictionsCache || [];
}
