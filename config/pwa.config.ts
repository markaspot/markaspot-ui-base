import type { ModuleOptions } from '@vite-pwa/nuxt';
import type { ClientConfig } from '~~/types/clientConfig';

/**
 * PWA Configuration
 *
 * Manifest is served dynamically via server/routes/manifest.webmanifest.get.ts
 * to support per-jurisdiction branding from a single Docker image.
 * Only workbox/service worker config remains here.
 */

/**
 * Default manifest structure used as fallback by the dynamic manifest route
 * when the settings API is unavailable.
 */
export const DEFAULT_MANIFEST = {
    id: '/',
    name: 'Mark-a-Spot',
    short_name: 'Mark-a-Spot',
    description: 'Citizen Reporting Platform',
    theme_color: '#000000',
    background_color: '#000000',
    start_url: '/',
    display: 'standalone' as const,
    orientation: 'portrait-primary' as const,
    display_override: ['window-controls-overlay'],
    scope: '/',
    launch_handler: {
        client_mode: 'focus-existing'
    },
    icons: [
        { src: '/images/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/images/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/images/pwa-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/images/pwa-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ],
    categories: ['productivity', 'utilities', 'tools'],
    dir: 'ltr' as const,
    prefer_related_applications: false,
    screenshots: [
        { src: '/screenshots/screenshot1.png', sizes: '1280x720', type: 'image/png' },
        { src: '/screenshots/screenshot2.png', sizes: '1920x1080', type: 'image/png' }
    ]
};

export function createPWAConfig(_clientConfig: ClientConfig): ModuleOptions {
    return {
        devOptions: {
            enabled: false, // Disabled in dev to prevent caching issues with MIME type fixes
            type: 'module'
        },
        injectRegister: 'auto',
        strategies: 'generateSW',
        registerType: 'autoUpdate',
        workbox: {
            // SSR: Do NOT use navigateFallback. It serves the precached '/' for
            // every navigation request, bypassing SSR completely. Each page needs
            // its own server-rendered HTML. Navigation is handled via NetworkFirst
            // runtimeCaching below, which falls back to cache only when offline.
            navigateFallback: undefined,
            runtimeCaching: [
                {
                    // Navigation requests: NetworkFirst for SSR compatibility.
                    // Online: always hit the SSR server for fresh HTML.
                    // Offline: serve the last cached version of that page.
                    urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
                    handler: 'NetworkFirst',
                    options: {
                        cacheName: 'pages',
                        networkTimeoutSeconds: 3,
                        expiration: {
                            maxEntries: 50,
                            maxAgeSeconds: 24 * 60 * 60
                        }
                    }
                },
                {
                    // Static assets: CacheFirst for performance
                    urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?)$/i,
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'static-assets-v2',
                        expiration: {
                            maxEntries: 100,
                            maxAgeSeconds: 7 * 24 * 60 * 60
                        }
                    }
                }
            ],
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true
        },
        // Manifest served dynamically via /manifest.webmanifest server route
        manifest: false
    };
}
