import { defineNuxtRouteMiddleware, navigateTo, useCookie, useState } from '#imports';
import type { EmergencyStatusResponse } from '~~/types';

// Global route middleware:
// - Fetches Drupal emergency status (the status response is the single source
//   of truth; build-time client config is NOT checked here).
// - Redirects to /lite when emergency is active AND force_redirect or lite_ui
//   is set on the response.
// - Respects allowed_urls and critical bypass paths.
// - Client-side TTL: re-fetches at most every ~15 s to avoid per-navigation
//   stampedes (server-side defineCachedEventHandler maxAge 20s backs this up).

interface StatusCache {
    data: EmergencyStatusResponse | null
    ts: number
}

const CLIENT_TTL_MS = 15_000; // 15 seconds

export default defineNuxtRouteMiddleware(async (to) => {
    // Per-user bypass via ?full=1 query or 'lite_bypass' cookie (12h).
    // Cookie is set with secure + sameSite for minimal hardening
    // (client-side cookies cannot be httpOnly).
    const bypass = useCookie<string | null>('lite_bypass', {
        maxAge: 60 * 60 * 12,
        secure: true,
        sameSite: 'strict'
    });
    if (to.query.full === '1') {
        bypass.value = '1';
        return;
    }
    if (bypass.value === '1') return;

    // Client-side status cache to avoid fetching on every navigation.
    const statusCache = useState<StatusCache>('emergency-status-cache', () => ({ data: null, ts: 0 }));

    let status: EmergencyStatusResponse | null = null;

    if (import.meta.client) {
        const now = Date.now();
        if (statusCache.value.data !== null && now - statusCache.value.ts < CLIENT_TTL_MS) {
            status = statusCache.value.data;
        }
    }

    if (status === null) {
        try {
            // No cache: 'no-store' — the server-side handler already caches.
            // On the server side (SSR) we always fetch fresh; the Nitro cache
            // handles deduplication.
            status = await $fetch<EmergencyStatusResponse>('/api/emergency-mode/status');
            if (import.meta.client) {
                statusCache.value = { data: status, ts: Date.now() };
            }
        } catch {
            // Fail-open: do not block routing if status endpoint is unavailable.
            return;
        }
    }

    if (!status) return;

    // The canonical active flag. `null` means backend unreachable (fail-open).
    const isEmergencyActive = status.emergency_mode === true;

    // Redirect when emergency mode is ACTIVE and either force_redirect or
    // lite_ui is set. These are top-level booleans on the contract.
    const forceEmergency = isEmergencyActive && (status.force_redirect === true || status.lite_ui === true);

    // Maintenance mode: only redirect when force_redirect is explicitly set.
    const forceMaintenance = status.mode_type === 'maintenance' && status.force_redirect === true;

    if (!(forceEmergency || forceMaintenance)) return;

    const path = to.path || '/';
    if (path === '/lite') return; // Already at lite.

    // allowed_urls from backend config: match with AND without jurisdiction prefix.
    const allowed: string[] = Array.isArray(status.allowed_urls) ? status.allowed_urls : [];
    if (isAllowedPath(path, allowed)) return;

    // Always allow critical paths during emergencies:
    // /auth/* and /dashboard/* for field agents,
    // /<jur>/report (exact) for citizens submitting emergency reports.
    if (isCriticalBypassPath(path)) return;

    // /lite is a Nitro server route, not a Vue page. Without external:true the
    // Vue router matches it against the [[jurisdiction]] catch-all and the
    // jurisdiction middleware 404s ("lite" is not a slug). external forces a
    // real 302 (SSR) / full page load (client) onto the server route.
    return navigateTo('/lite', { external: true });
});

/**
 * Returns true when `path` is listed in `allowed`, either exactly
 * or with an optional jurisdiction-slug prefix stripped.
 *
 * e.g. allowed = ['/status-page'] matches both '/status-page' and
 * '/amsterdam/status-page'.
 */
function isAllowedPath(path: string, allowed: string[]): boolean {
    if (allowed.includes(path)) return true;

    // Strip potential jurisdiction prefix (first path segment) and re-check.
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2) {
        const withoutJur = '/' + segments.slice(1).join('/');
        if (allowed.includes(withoutJur)) return true;
    }
    return false;
}

/**
 * Returns true for paths that must always remain accessible during emergencies.
 *
 * Jurisdiction-prefix-aware: checks the segment AFTER the optional slug.
 * Examples that must pass:
 *   /auth/login               - unprefixed
 *   /amsterdam/auth/login     - jurisdiction-prefixed
 *   /amsterdam/dashboard      - dashboard root
 *   /amsterdam/dashboard/xxx  - dashboard sub-pages
 *   /amsterdam/report         - exact report path
 */
function isCriticalBypassPath(path: string): boolean {
    const segments = path.split('/').filter(Boolean);

    // Check both with and without jurisdiction prefix.
    // With prefix: segments[1] is the critical segment.
    // Without prefix: segments[0] is the critical segment.
    const checks = [segments[0], segments[1]];

    for (const seg of checks) {
        if (seg === 'auth' || seg === 'dashboard') return true;
    }

    // /report must be the LAST meaningful segment (exact match, not /report/something).
    // Matches /<jur>/report and /report.
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === 'report' && segments.length <= 2) return true;

    return false;
}
