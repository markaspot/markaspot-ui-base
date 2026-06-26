/**
 * Dynamic robots.txt.
 *
 * On the demo instance (`runtimeConfig.public.demoMode === true`) we serve a
 * hard `Disallow: /` so search engines stop ranking the demo for queries
 * like "Amsterdam Meldung" or "Rotterdam pothole". Real tenants get the
 * permissive default that mirrors the previous static `public/robots.txt`
 * (allow-all with internal `/api` and `/_nuxt/` excluded). Replacing the
 * static file with this server route keeps the demo override in one place
 * and avoids drift on rebuilds.
 *
 * The `Sitemap:` line is opt-in via `NUXT_PUBLIC_SITEMAP_URL`. Hard-coding
 * civicspot.io here would advertise its sitemap from any self-hosted tenant
 * pulling `dev-2.x` — a cross-tenant SEO leak.
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/432
 */

const DEMO_ROBOTS = 'User-agent: *\nDisallow: /\n';

const buildProdRobots = (sitemapUrl: string): string => {
    const lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /_nuxt/',
        'Disallow: /api',
        'Disallow: /api/'
    ];
    if (sitemapUrl) {
        lines.push('', `Sitemap: ${sitemapUrl}`);
    }
    lines.push('');
    return lines.join('\n');
};

export default defineEventHandler((event) => {
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
    const config = useRuntimeConfig(event);
    if (config.public.demoMode === true) {
        return DEMO_ROBOTS;
    }
    const sitemapUrl = (config.public.sitemapUrl as string | undefined) ?? '';
    return buildProdRobots(sitemapUrl);
});
