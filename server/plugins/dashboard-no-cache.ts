/**
 * Strips SWR cache headers from dashboard routes.
 *
 * Nuxt wraps the renderer for `/x]` in a cachedEventHandler with
 * {swr: true, maxAge: 120}. Because h3 uses prefix matching, that
 * cached handler also serves `/x]/dashboard/**` and sets
 * `s-maxage=120, stale-while-revalidate` on those responses.
 *
 * Route rules with `swr: false` don't help because the cache config
 * is baked into the handler at startup, not evaluated per request.
 *
 * This plugin hooks into `beforeResponse` (after handler, before
 * flush) to override cache headers for authenticated dashboard pages.
 */
export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('beforeResponse', (event) => {
        const path = event.path || event.node.req.url || '';
        if (/\/dashboard(\/|$|\?)/.test(path)) {
            event.node.res.setHeader(
                'cache-control',
                'private, no-store, no-cache, must-revalidate'
            );
        }
    });
});
