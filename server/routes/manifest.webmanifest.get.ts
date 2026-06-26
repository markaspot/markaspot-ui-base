import { defineEventHandler, getQuery, getRequestHeader, setResponseHeaders } from 'h3';
import { DEFAULT_MANIFEST } from '../../config/pwa.config';
import { DEFAULT_BRANDING_ASSETS, resolveClientAssetPath } from '../../app/utils/clientAssetResolver';
import { resolveColorToHex } from '../utils/color-resolver';

/**
 * Dynamic PWA manifest route.
 *
 * Fetches jurisdiction-specific settings from the backend and returns
 * a manifest with per-tenant branding (name, colors, icons).
 * This enables a single Docker image to serve correct PWA metadata
 * for all clients and cloud tenants.
 *
 * Query params:
 *   ?jurisdiction=<slug> - optional, falls back to ENV NUXT_JURISDICTION_ID
 *
 * Caching: 1 hour public cache, stale-while-revalidate for seamless updates.
 */

interface SettingsTheme {
    primary?: string
    pwaIcon?: string
    logos?: { dark?: string, light?: string }
    favicon?: string
}

interface SettingsResponse {
    client?: { name?: string, shortName?: string }
    jurisdiction?: { name?: string }
    theme?: SettingsTheme
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const config = useRuntimeConfig();

    // Determine jurisdiction: query param > ENV
    const jurisdiction = (query.jurisdiction as string) || config.jurisdictionId as string || '';

    let settingsUrl = '/api/mark-a-spot-settings?exclude=boundary';
    if (jurisdiction) {
        settingsUrl += `&jurisdiction=${encodeURIComponent(jurisdiction)}`;
    }

    setResponseHeaders(event, {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=3600',
        'Vary': 'Accept-Encoding'
    });

    try {
        const settings = await $fetch<SettingsResponse>(settingsUrl, {
            headers: { host: getRequestHeader(event, 'host') || '' }
        });
        const theme = settings?.theme;

        const name = settings?.client?.name || settings?.jurisdiction?.name || DEFAULT_MANIFEST.name;
        const shortName = settings?.client?.shortName || name;
        const themeColor = resolveColorToHex(theme?.primary || 'blue');

        // Resolve icon: pwaIcon -> logos.dark -> static fallback
        const iconSource = theme?.pwaIcon || theme?.logos?.dark;
        const iconPath = resolveClientAssetPath(iconSource, DEFAULT_BRANDING_ASSETS.icon512);
        const icon192Path = resolveClientAssetPath(iconSource, DEFAULT_BRANDING_ASSETS.icon192);

        return {
            ...DEFAULT_MANIFEST,
            name,
            short_name: shortName,
            description: `${name} - Citizen Reporting`,
            theme_color: themeColor,
            background_color: themeColor,
            icons: [
                { src: icon192Path, sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: iconPath, sizes: '512x512', type: 'image/png', purpose: 'any' },
                { src: '/images/pwa-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
                { src: '/images/pwa-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
            ]
        };
    } catch (error) {
        // Never return HTTP 500 for manifest - return minimal fallback
        console.error('[manifest.webmanifest] Failed to fetch settings:', error instanceof Error ? error.message : String(error));
        return DEFAULT_MANIFEST;
    }
});
