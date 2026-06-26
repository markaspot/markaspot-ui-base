/**
 * Fonts CSS proxy endpoint.
 *
 * Proxies /api/fonts.css?jurisdiction=X to Drupal's /api/fonts.css endpoint,
 * returning @font-face declarations and --font-heading/--font-body CSS variables.
 *
 * Using a dedicated route (instead of the catch-all [...path].ts) ensures the
 * Content-Type is set to text/css and the response is returned as plain text,
 * not serialized as JSON.
 */
import { defineEventHandler, getQuery, setResponseHeader } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const query = getQuery(event);
    const backend = (config.public.apiBase as string).replace(/\/+$/, '');
    const jurisdictionParam = query.jurisdiction ? `?jurisdiction=${encodeURIComponent(String(query.jurisdiction))}` : '';

    try {
        const css = await $fetch<string>(`${backend}/api/fonts.css${jurisdictionParam}`, {
            headers: { Accept: 'text/css' },
            responseType: 'text',
        });

        setResponseHeader(event, 'content-type', 'text/css; charset=UTF-8');
        setResponseHeader(event, 'cache-control', 'public, max-age=86400');
        return css;
    } catch {
        // Return empty CSS on error - fonts are a progressive enhancement.
        setResponseHeader(event, 'content-type', 'text/css; charset=UTF-8');
        return '';
    }
});
