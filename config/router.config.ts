import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router';

/**
 * Router configuration with custom scroll behavior
 * @returns Router configuration object for Nuxt 3/4
 */
export function createRouterConfig() {
    return {
        options: {
            scrollBehavior(
                to: RouteLocationNormalized,
                from: RouteLocationNormalizedLoaded,
                savedPosition: { left: number, top: number } | null
            ): Promise<{ left: number, top: number } | { el: string }> | { left: number, top: number } | { el: string } {
                // Preserve saved scroll positions (back/forward navigation)
                if (savedPosition) {
                    return savedPosition;
                }

                // Handle hash anchor navigation
                if (to.hash) {
                    return new Promise((resolve) => {
                        // Delay to allow page content (including Suspense) to render
                        setTimeout(() => {
                            try {
                                // Validate hash is a simple ID selector before querying
                                if (/^#[\w-]+$/.test(to.hash)) {
                                    const el = document.querySelector(to.hash);
                                    if (el) {
                                        resolve({ el: to.hash });
                                        return;
                                    }
                                }
                            } catch {
                                // Malformed selector: fall through to top
                            }
                            resolve({ left: 0, top: 0 });
                        }, 200);
                    });
                }

                // Default scroll to top
                return { left: 0, top: 0 };
            }
        }
    };
}

/**
 * Route rules for SSR and caching optimizations
 *
 * SWR (stale-while-revalidate) enables two cache layers:
 * 1. Nitro in-memory cache: instant responses for repeated SSR requests
 * 2. CDN/Router edge cache: Upsun router respects the s-maxage header
 *
 * Anonymous users share the cached response. Logged-in users (with session
 * cookie) get per-session cache entries at the router level.
 *
 * @returns Route rules configuration for Nuxt 3/4
 */
export function createRouteRules() {
    return {
        // SEO 301: the civic-report template was renamed to issue-reporter (#231).
        // Old indexed solutions URLs redirect to the canonical localized path.
        // Only the English canonical slug was ever public; the localized German
        // URL (/de/solutions/maengelmelder) is unchanged. The locale-prefixed
        // /en variant is covered for any links that used the explicit prefix.
        '/solutions/civic-report': { redirect: { to: '/solutions/issue-reporter', statusCode: 301 as const } },
        '/en/solutions/civic-report': { redirect: { to: '/en/solutions/issue-reporter', statusCode: 301 as const } },

        '/auth/**': { ssr: true }, // Auth routes outside [[jurisdiction]] catch-all

        // API proxy: prevent Upsun router from caching API responses
        // (Drupal's Cache-Control headers are not forwarded by the proxy)
        '/api/**': { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },

        // Dashboard: never SWR cache (authenticated, needs fresh data)
        '/dashboard/**': { swr: false },
        '/*/dashboard/**': { swr: false },

        // Locale and tenant defaults come from Drupal at request time.
        // Shared SWR entries can therefore leak the first-rendered locale to
        // subsequent users. Keep these pages uncached until cache keys vary by
        // locale and jurisdiction.
        '/': { swr: false },
        '/*/': { swr: false },
        '/requests/**': { swr: false },
        '/*/requests/**': { swr: false },

        // CivicSpot marketing pages: static content, no Drupal dependency.
        // SWR 10min cache eliminates ~1s SSR latency on repeat visits.
        // Cache key includes full path, so each locale is cached separately.
        // Both unprefixed (English default) and locale-prefixed paths.
        '/solutions/**': { swr: 600 },
        '/*/solutions/**': { swr: 600 },
        '/start/**': { swr: 600 },
        '/*/start/**': { swr: 600 },
        '/terms': { swr: 3600 },
        '/*/terms': { swr: 3600 },
        '/welcome': { swr: 600 },
        '/*/welcome': { swr: 600 }
    };
}
