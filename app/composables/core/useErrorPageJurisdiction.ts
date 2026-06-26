/**
 * useErrorPageJurisdiction
 *
 * Resolves the jurisdiction logo and default locale for the error page in an
 * SSR-safe way. Mirrors the single-image-multi-tenant pattern used in
 * useMarkASpotSettings so error.vue never flashes the default Mark-a-Spot
 * logo on tenant deployments.
 *
 * Resolution order:
 *   1. Server: runtimeConfig.jurisdictionId (server-only key, set via
 *      NUXT_PUBLIC_JURISDICTION_ID / NUXT_JURISDICTION_ID).
 *      Client: useState('mas-config-jurisdiction-key'), the SSR-transported
 *      slug/id.
 *   2. First path segment of the original request URL (multi-tenant fallback).
 *      We receive this as `originalUrl` from `error.vue` (i.e. `props.error.url`),
 *      not via useRequestURL(): on Nuxt 4 the server-side error render sees
 *      the rewritten `/__nuxt_error` route, not the original request path.
 *
 * We deliberately do NOT trust the useMarkASpotConfig singleton here. Its
 * module-level cache can hold a different tenant than the one the visitor
 * actually hit:
 *   - On the server (nuxt dev, node cluster) the singleton leaks across
 *     requests and would serve Request A's logo to Request B.
 *   - On the client the singleton is populated by the initial page load, so
 *     an error.vue mount inherits whichever tenant the bundle bootstrapped
 *     with (typically the default jurisdiction), not the tenant addressed in
 *     the failing URL.
 * Doing one fetch per 404 is cheap: error.vue is not a hot path.
 */

export interface ResolvedErrorPageJurisdiction {
    logos: { light?: string, dark?: string } | null
    defaultLocale: string | null
    availableLocales: string[]
    locales: SettingsLocaleDefinition[]
}

export interface JurisdictionLookupEntry {
    id?: number | string
    slug?: string
    isDefault?: boolean
}

export interface ResolvedSsrJurisdictionKey {
    key: string
    source: 'route' | 'error-url' | 'runtime-config' | 'default' | 'none'
}

interface SettingsResponse {
    theme?: { logos?: { light?: string, dark?: string } }
    languages?: {
        default?: string
        available?: string[]
        locales?: SettingsLocaleDefinition[]
    }
}

export interface SettingsLocaleDefinition {
    code: string
    name?: string
    iso?: string
}

/**
 * Pure resolver, no framework calls. Easy to unit test.
 * The Vue wrapper below feeds live Nuxt composables into this function and
 * wraps the call in useAsyncData so the SSR result hydrates without a refetch
 * on the client.
 */
export async function resolveErrorPageJurisdiction(deps: {
    serverJurisdictionId: string
    clientJurisdictionKey: string
    urlFirstSegment: string
    fetchSettings: (identifier: string) => Promise<SettingsResponse | null>
    isServer: boolean
    isDev: boolean
}): Promise<ResolvedErrorPageJurisdiction> {
    let identifier = '';
    if (deps.isServer) {
        if (deps.serverJurisdictionId) identifier = deps.serverJurisdictionId;
    } else {
        if (deps.clientJurisdictionKey) identifier = deps.clientJurisdictionKey;
    }
    if (!identifier && deps.urlFirstSegment) {
        identifier = deps.urlFirstSegment;
    }

    if (!identifier) {
        return {
            logos: null,
            defaultLocale: null,
            availableLocales: [],
            locales: []
        };
    }

    try {
        const res = await deps.fetchSettings(identifier);
        return {
            logos: res?.theme?.logos ?? null,
            defaultLocale: res?.languages?.default ?? null,
            availableLocales: res?.languages?.available ?? [],
            locales: res?.languages?.locales ?? []
        };
    } catch (err) {
        if (deps.isDev) {
            console.warn(
                `[error-page] Failed to resolve jurisdiction settings for "${identifier}":`,
                err
            );
        }
        return {
            logos: null,
            defaultLocale: null,
            availableLocales: [],
            locales: []
        };
    }
}

/**
 * Derive the first URL path segment (the jurisdiction slug in multi-tenant
 * mode) from `props.error.url`. Exported for tests; matches the heuristic
 * used inside the Vue wrapper below.
 */
export function firstPathSegment(originalUrl: string | undefined): string {
    if (!originalUrl) return '';
    let pathname = '';
    try {
        pathname = new URL(originalUrl, 'http://_').pathname;
    } catch {
        pathname = originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`;
    }
    return pathname.split('/').filter(Boolean)[0] || '';
}

/**
 * Resolve the jurisdiction key for the SSR preload plugin.
 *
 * Unlike route.params, `error.url` still contains the original failing tenant
 * path during a Nuxt error render. This lets the plugin preload the same
 * tenant assets that error.vue will later render in multi-tenant mode.
 *
 * Single-tenant ENV config must still win over that fallback: if a tenant is
 * pinned by runtime config, a random first URL segment on a 404 must not flip
 * the error page branding or disable the single-tenant client mode.
 */
export function resolveSsrJurisdictionKey(deps: {
    routeJurisdictionKey: string
    routePath: string
    runtimeJurisdictionId: string
    errorUrl: string
    jurisdictions: JurisdictionLookupEntry[]
    /**
     * When true, accept route slugs that are not in the SSR-preloaded public
     * jurisdictions list — covers admin-only workspaces (`field_visibility !=
     * public`, but still `status = 1`) that a platform admin reaches via
     * bookmark or hard refresh. The middleware (jurisdiction.global.ts) gates
     * anonymous traffic before this resolver runs.
     *
     * The Drupal settings endpoint requires the jurisdiction group to be
     * published (`MarkASpotSettingsController::getMarkASpotSettings` lines
     * 179-183). Unpublished or non-existent slugs return HTTP 404; the SSR
     * fetch catch-block then leaves config state empty and the page renders
     * default Mark-a-Spot branding. Never a leak of another tenant's config.
     */
    acceptUnknownSlugs?: boolean
}): ResolvedSsrJurisdictionKey {
    const findBySlug = (slug: string) => deps.jurisdictions.find(j => j.slug === slug);
    const findDefault = () => deps.jurisdictions.find(j => j.isDefault) || deps.jurisdictions[0];

    if (deps.routeJurisdictionKey) {
        if (findBySlug(deps.routeJurisdictionKey)) {
            return { key: deps.routeJurisdictionKey, source: 'route' };
        }
        if (deps.acceptUnknownSlugs) {
            return { key: deps.routeJurisdictionKey, source: 'route' };
        }
    }

    const routePathSlug = firstPathSegment(deps.routePath);
    if (routePathSlug) {
        if (findBySlug(routePathSlug)) {
            return { key: routePathSlug, source: 'route' };
        }
        if (deps.acceptUnknownSlugs) {
            return { key: routePathSlug, source: 'route' };
        }
    }

    if (deps.runtimeJurisdictionId) {
        if (/^\d+$/.test(deps.runtimeJurisdictionId)) {
            const jur = deps.jurisdictions.find(j => Number(j.id) === Number(deps.runtimeJurisdictionId));
            return {
                key: jur?.slug || deps.runtimeJurisdictionId,
                source: 'runtime-config'
            };
        }

        return { key: deps.runtimeJurisdictionId, source: 'runtime-config' };
    }

    const errorUrlSlug = firstPathSegment(deps.errorUrl);
    if (errorUrlSlug && findBySlug(errorUrlSlug)) {
        return { key: errorUrlSlug, source: 'error-url' };
    }

    const defaultJurisdiction = findDefault();
    if (defaultJurisdiction?.slug) {
        return { key: defaultJurisdiction.slug, source: 'default' };
    }

    return { key: '', source: 'none' };
}

/**
 * Thin Vue wrapper that feeds live Nuxt composables into the pure resolver
 * and wraps the call in useAsyncData. The cache key includes the original URL
 * so the SSR payload hydrates the client with the same result, no refetch
 * and no hydration mismatch.
 */
export async function useErrorPageJurisdiction(originalUrl?: string) {
    const runtimeConfig = useRuntimeConfig();
    const urlFirstSegment = firstPathSegment(originalUrl);
    const cacheKey = `error-page-jurisdiction:${urlFirstSegment || 'none'}`;

    // Bind the SSR-transported jurisdiction key at setup time. The useAsyncData
    // handler below runs asynchronously and no longer has an active Nuxt
    // instance, so calling useState() from inside it would collapse with
    // "[nuxt] instance unavailable". We capture the ref here and only read its
    // .value lazily.
    const ssrJurisdictionKey = useState<string>('mas-config-jurisdiction-key', () => '');

    const { data } = await useAsyncData<ResolvedErrorPageJurisdiction>(
        cacheKey,
        async () => {
            const clientKey = import.meta.server
                ? ''
                : ssrJurisdictionKey.value;

            return resolveErrorPageJurisdiction({
                serverJurisdictionId: import.meta.server
                    ? String((runtimeConfig as Record<string, unknown>).jurisdictionId || '')
                    : '',
                clientJurisdictionKey: clientKey,
                urlFirstSegment,
                fetchSettings: async (identifier: string) => {
                    return await $fetch<SettingsResponse>(
                        `/api/mark-a-spot-settings?jurisdiction=${encodeURIComponent(identifier)}`,
                        { timeout: 3000 }
                    );
                },
                isServer: import.meta.server,
                isDev: import.meta.dev
            });
        },
        {
            default: (): ResolvedErrorPageJurisdiction => ({
                logos: null,
                defaultLocale: null,
                availableLocales: [],
                locales: []
            })
        }
    );

    return data;
}
