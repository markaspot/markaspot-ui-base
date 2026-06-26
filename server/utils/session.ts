import { parseCookies } from 'h3';
import type { H3Event } from 'h3';

/**
 * Check for valid Drupal session cookie.
 * Drupal session cookies follow pattern: SESS{32} or SSESS{32} (HTTPS).
 *
 * A cookie is only considered valid when its value is non-empty and not the
 * literal string "deleted" (which browsers may store when a Set-Cookie with
 * Max-Age=0 / past Expires races against the next request).
 */
export const hasValidDrupalSession = (event: H3Event): boolean => {
    const cookies = parseCookies(event);
    return Object.entries(cookies).some(([key, value]) =>
        /^S?SESS[a-f0-9]{32}$/.test(key) &&
        typeof value === 'string' &&
        value.length > 0 &&
        value !== 'deleted'
    );
};

/**
 * Detect a GeoReport response that looks like an unauthenticated fallback.
 *
 * When a stale Drupal session cookie is forwarded to the backend without an
 * api_key, Drupal treats the request as anonymous and returns minimal
 * extended_attributes: either an empty object, null, or an object whose only
 * key is "escalated" set to false.  Any additional key (status_color, category,
 * etc.) means the backend did return enriched data, so we should NOT retry.
 *
 * We only inspect the first item when the response is a list.
 */
export const isMinimalExtendedAttributes = (response: unknown): boolean => {
    if (!response || typeof response !== 'object') return false;

    // Normalise: grab the first item when the API returns an array or
    // the wrapped { requests: [...] } shape.
    let item: Record<string, unknown> | null = null;
    if (Array.isArray(response)) {
        item = (response[0] ?? null) as Record<string, unknown> | null;
    } else {
        const obj = response as Record<string, unknown>;
        if (Array.isArray(obj.requests)) {
            item = (obj.requests[0] ?? null) as Record<string, unknown> | null;
        } else {
            item = obj;
        }
    }

    if (!item || typeof item !== 'object') return false;

    const ext = (item as Record<string, unknown>).extended_attributes;

    // No extended_attributes at all: definitely minimal.
    if (ext === undefined || ext === null) return true;

    if (typeof ext !== 'object') return false;

    // Only { escalated: false } (and nothing else): minimal.
    const keys = Object.keys(ext as object);
    if (keys.length === 0) return true;
    if (keys.length === 1 && keys[0] === 'escalated' && (ext as Record<string, unknown>).escalated === false) return true;

    return false;
};
