import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import clientConfig from './config/clients'; // Now imports directly from index.ts
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './config/locales';
import { createPWAConfig } from './config/pwa.config';
import { createPreloadConfig } from './config/performance.config';
import { createRouterConfig, createRouteRules } from './config/router.config';
import { createNuxtDevBuildMetaPlugin } from './config/vite-dev-build-meta';

const pkgVersion = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'package.json'), 'utf8')).version;

if (!clientConfig) {
    throw new Error('No client configuration found');
}

// Generate build hash for cache invalidation
const buildHash = (() => {
    try {
        const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
        return result.stdout?.trim() || Date.now().toString();
    } catch {
        return Date.now().toString();
    }
})();

// Only define compile-time flags for optional feature toggles.
// Keys listed here are runtime-configurable per jurisdiction via
// field_nuxt_config and must not be baked at build time.
const excludedFeatureKeys = new Set([
    'media',
    'categories',
    'navigation',
    'map',
    'geocoding',
    'boundaries',
    'aiAnalysis',
    'photoReporting',
    'categoryDescriptions'
]);
const featureDefines = Object.entries(clientConfig.features ?? {})
    .filter(([key]) => !excludedFeatureKeys.has(key))
    .reduce((acc, [key, value]) => {
    // Flatten objects that have an `enabled` sub-flag
        const raw = typeof value === 'object' ? (value as any).enabled : value;
        const flag = `__FEATURE_${key.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}__`;
        acc[flag] = JSON.stringify(Boolean(raw));
        return acc;
    }, {} as Record<string, string>);
const isDev = process.env.NODE_ENV === 'development';

const parseDdevExposedHttpsPort = (value?: string): number | undefined => {
    const match = value?.match(/(?:^|,)\s*(\d+):3000\b/);
    return match ? Number(match[1]) : undefined;
};

const hmrHost = process.env.DDEV_HOSTNAME || process.env.VIRTUAL_HOST || undefined;
const hmrClientPort = Number(process.env.NUXT_VITE_HMR_CLIENT_PORT || process.env.VITE_HMR_CLIENT_PORT) ||
  parseDdevExposedHttpsPort(process.env.HTTPS_EXPOSE) ||
  (hmrHost ? 443 : 3001);

// Tailwind config path resolution
const __dirname = dirname(fileURLToPath(import.meta.url));

// Pro layer configuration
// Set NUXT_PRO=false to disable pro features (for MIT builds)
// Note: Layer moved outside layers/ to prevent Nuxt auto-discovery (since v3.12.0)
const proLayerPath = resolve(__dirname, 'pro-layer');
const enablePro = process.env.NUXT_PRO !== 'false' &&
  existsSync(proLayerPath);

// FastMap layer configuration
// Set NUXT_FASTMAP=true to enable discovery/onboarding features (fastmap.app)
// Not loaded for tenant instances (no impact on PWA bundle)
const fastmapLayerPath = resolve(__dirname, 'fastmap-layer');
const enableFastmap = process.env.NUXT_FASTMAP === 'true' &&
  existsSync(fastmapLayerPath);

if (isDev && enablePro) {
    console.log('[Nuxt] Pro layer enabled');
}
if (isDev && enableFastmap) {
    console.log('[Nuxt] FastMap layer enabled');
}

// Get preload configuration
const preloadConfig = createPreloadConfig();

export default defineNuxtConfig({
    // Pro layer (conditional)
    // Contains: Offline, Dashboard, AI Analysis features
    extends: [
        ...(enablePro ? [proLayerPath] : []),
        ...(enableFastmap ? [fastmapLayerPath] : [])
    ],

    // Sitemap + Umami modules only for FastMap/CivicSpot (not tenant PWAs)
    modules: ['@pinia/nuxt', '@nuxt/ui', '@nuxtjs/color-mode', '@nuxtjs/i18n', '@vite-pwa/nuxt', ...(enableFastmap ? ['@nuxtjs/sitemap', 'nuxt-umami'] : [])],
    ssr: true,
    components: [
        {
            path: './components',
            pathPrefix: false
        }
    ],

    imports: {
        dirs: [
            // Scan top level and nested composables
            'composables',
            'composables/**',
            // Base-only no-op implementations for symbols that normally come
            // from pro-layer auto-imports.
            ...(!enablePro ? ['stubs/pro-composables'] : []),
            // Auto-import utility functions
            'utils'
        ]
    },
    devtools: { enabled: false },
    app: {
        baseURL: '/',
        head: {
            title: clientConfig.name || 'Mark-a-Spot',
            link: [
                // Favicon, apple-touch-icon, manifest, and splash screens are now
                // injected dynamically per jurisdiction by 01.jurisdiction-ssr.ts plugin.
                // Critical asset preloads from performance config
                ...preloadConfig.images,
                ...preloadConfig.connections
            ],
            meta: [
                { charset: 'utf-8' },
                {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content'
                },
                {
                    name: 'format-detection',
                    content: 'telephone=no'
                },
                {
                    name: 'description',
                    content: `Mark-a-Spot for ${clientConfig.name}`
                },
                // theme-color, apple-mobile-web-app-title, OG, and Twitter meta are
                // injected dynamically per jurisdiction by 01.jurisdiction-ssr.ts plugin.
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                { name: 'mobile-web-app-capable', content: 'yes' },
                {
                    name: 'apple-mobile-web-app-status-bar-style',
                    content: 'black-translucent'
                },
                { property: 'og:type', content: 'website' },
                { property: 'og:image:width', content: '1200' },
                { property: 'og:image:height', content: '630' },
                { name: 'twitter:card', content: 'summary_large_image' },
                // Build version for deploy verification
                { name: 'generator', content: `Mark-a-Spot v${pkgVersion} (${buildHash})` }
            ]
        }
    },
    css: [
        './app/assets/css/main.css',
        './app/assets/css/safe-area.css',
        './app/assets/css/touch-action.css',
        './app/assets/css/print.css',
        resolve(__dirname, `app/assets/clients/${clientConfig.shortName}/css/fonts.css`),
        resolve(__dirname, `app/assets/clients/${clientConfig.shortName}/css/tailwind.css`),
        resolve(__dirname, `app/assets/clients/${clientConfig.shortName}/css/main.css`)
    ],
    // Router configuration from modular config
    router: createRouterConfig() as any,
    ui: {
        // Nuxt UI v4: Use semantic family 'primary' for theming

        ...({ primary: clientConfig.theme?.colors?.primary || 'primary' } as any),
        icons: 'heroicons',
        // Generate Tailwind color tokens for ALL palettes
        // Required for runtime theme switching (single-image multi-tenant)
        // @see docs/architecture/single-image-multi-tenant.md
        colors: [
            'primary',
            'secondary',
            // Neutrals (classic + Tailwind v4.2+ warm/organic neutrals)
            'slate', 'gray', 'zinc', 'neutral', 'stone',
            'mauve', 'olive', 'mist', 'taupe',
            // Warm to green
            'red', 'orange', 'amber', 'yellow', 'lime', 'green',
            // Teal to blue
            'emerald', 'teal', 'cyan', 'sky', 'blue',
            // Purple to pink
            'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
            // Custom palettes
            'forest', 'error'
        ],
        // Enhanced focus and accessibility settings
        strategy: 'override', // Allow custom focus overrides
        transitions: {
            focus: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
        },
        // Disable @nuxt/fonts entirely - we use local fonts only
        fonts: false
    },

    runtimeConfig: {
        // App mode: 'citizen' (no dashboard/auth) or '' (dynamic resolution from Drupal)
        // When empty, middleware resolves mode from Drupal jurisdiction host config.
        appMode: process.env.NUXT_APP_MODE || '',
        // Server-only jurisdiction ID (NUXT_JURISDICTION_ID env var).
        // Intentionally NOT in public: baking this into the client bundle causes the
        // build-time value to override the runtime ENV on the client side, leading to
        // wrong jurisdiction IDs in API calls (e.g. numeric "1" instead of slug "berlin").
        // SSR reads this at runtime; the resolved slug is then transported to the client
        // via the 'mas-config-jurisdiction-key' useState payload.
        jurisdictionId: process.env.NUXT_PUBLIC_JURISDICTION_ID || process.env.NUXT_JURISDICTION_ID || '',
        proxy: {
            timeoutSeconds: 30,
            maxRedirects: 5,
            rejectUnauthorized: process.env.REJECT_UNAUTHORIZED
                ? process.env.REJECT_UNAUTHORIZED === 'true'
                : process.env.NODE_ENV === 'production',
            wmsAllowedHosts: process.env.NUXT_WMS_ALLOWED_HOSTS || ''
        },
        public: {
            client: process.env.CLIENT || clientConfig.shortName || 'default',
            clientName: clientConfig.name,
            clientConfig: clientConfig as any,
            nominatimEndpoint: process.env.NOMINATIM_ENDPOINT,
            geoReportApiBase: process.env.NUXT_GEOREPORT_API_BASE,
            apiBase: process.env.NUXT_API_BASE || clientConfig.apiEndpoint || '/api', // This will be our client-side API URL always
            ssoBackendOrigin: process.env.NUXT_PUBLIC_SSO_BACKEND_ORIGIN || '',
            // Backend URL for the image proxy - defaults to the GeoReport API base or regular API base
            imageProxyBackend: process.env.NUXT_IMAGE_PROXY_BACKEND || process.env.NUXT_GEOREPORT_API_BASE || process.env.NUXT_API_BASE,
            useProxy: true,
            proxyPath: '/api',
            mapboxKey: process.env.MAPBOX_API_KEY,
            maptilerKey: process.env.MAPTILER_API_KEY,
            // Pro features availability
            pro: enablePro,
            // FastMap mode (slug-based jurisdiction routing)
            fastmap: enableFastmap,
            // System notice banner (NUXT_PUBLIC_SYSTEM_NOTICE env var)
            systemNotice: process.env.NUXT_PUBLIC_SYSTEM_NOTICE || '',
            // Platform admin opt-in. Off by default. When enabled, the
            // cross-tenant /admin/* surface becomes reachable for users with
            // the Drupal `administrator` role. Production hardening posture:
            // dashboards remain invisible unless an operator flips the flag.
            platformAdmin: process.env.NUXT_PUBLIC_PLATFORM_ADMIN === 'true',
            // Demo-mode marker. Default off. When `NUXT_PUBLIC_DEMO_MODE=true`
            // is baked into the SSR build (as on demo.mark-a-spot.com), the UI
            // shows a persistent banner, requires an explicit confirmation
            // before any GeoReport submission, the `/lite` server route
            // refuses non-JS submissions, and noindex/nofollow signals reach
            // crawlers. Real tenants (civicspot.io, self-hosted) leave this
            // unset and behave normally.
            // @see https://github.com/markaspot/markaspot-ui/issues/432
            demoMode: process.env.NUXT_PUBLIC_DEMO_MODE === 'true',
            // Sitemap URL emitted by the dynamic robots.txt route. Empty by
            // default — only deployments that actually host a sitemap should
            // advertise one. Hard-coding civicspot.io here would create a
            // cross-tenant SEO leak for self-hosted instances pulling
            // `dev-2.x` directly.
            sitemapUrl: process.env.NUXT_PUBLIC_SITEMAP_URL || '',
            // Contextual help links point at the end-user documentation
            // (issue #191). Empty by default — useDocsLinks falls back to the
            // product-wide https://docs.mark-a-spot.com. Override per
            // deployment with NUXT_PUBLIC_DOCS_BASE_URL (e.g. a self-hosted
            // docs mirror).
            docsBaseUrl: process.env.NUXT_PUBLIC_DOCS_BASE_URL || ''
        },
        private: {
            geoReportApiKey: process.env.GEOREPORT_API_KEY,
            jsonapiRandomPath: process.env.JSONAPI_RANDOM_PATH || 'jsonapi'
        }
    },
    dir: {
        public: 'public'
    },
    buildDir: process.env.NUXT_BUILD_DIR || '.nuxt',
    routeRules: createRouteRules(),
    // Disable source maps in production builds
    sourcemap: {
        server: isDev,
        client: isDev
    },
    devServer: {
        host: '0.0.0.0',
        port: 3000
    },
    future: {
        compatibilityVersion: 4
    },
    compatibilityDate: '2024-04-03',
    nitro: {
        preset: 'node-server',
        // Minify server chunks (OXC) - mangles variable names, strips whitespace
        minify: !isDev,
        compressPublicAssets: true,
        esbuild: {
            // Strip console/debugger from server bundle in production
            options: {
                drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
            }
        },
        externals: {
            inline: ['vue']
        },
        storage: {
            splash: {
                driver: 'fs',
                base: '.data/splash-cache'
            }
        },
        routeRules: {
            '/auth/**': { ssr: true }, // Auth routes - outside [[jurisdiction]] catch-all
            '/requests/**': { ssr: true }, // Explicitly enable SSR for these routes
            '/icons/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }, // Cache SVG icons for 1 year
            '/images/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }, // Cache images for 1 year
            '/fonts/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }, // Cache fonts for 1 year
            '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } } // Cache JS/CSS assets
            // Note: /api/splash/** headers are set by the handler itself (immutable for
            // successful renders, no-cache for fallbacks). No Nitro route rule here.
        }
    },
    // Vite - restored stable configuration
    vite: {
        // Explicit base path prevents MIME type issues in proxied environments
        base: '/',
        server: {
            allowedHosts: true,
            watch: {
                usePolling: true
            },
            hmr: {
                // Don't let Vite use the apiBase for HMR connections
                path: '/__vite_hmr',
                host: hmrHost,
                protocol: 'wss',
                clientPort: hmrClientPort
            },
            // Prevent serving CSS as JS modules (fixes MIME type errors)
            middlewareMode: false,
            // Ensure proper CORS for HMR
            cors: true,
            // Force consistent headers for module scripts
            headers: {
                'Access-Control-Allow-Origin': '*',
                // Prevent browser from caching wrong MIME types for virtual modules (dev only)
                ...(isDev && { 'Cache-Control': 'no-store' })
            }
        },
        define: {
            ...featureDefines,
            'process.env.CLIENT_CONFIG': JSON.stringify(clientConfig),
            'import.meta.env.APP_VERSION': JSON.stringify(buildHash),
            'import.meta.env.PKG_VERSION': JSON.stringify(pkgVersion)
        },
        esbuild: {
            drop: isDev ? [] : ['console']
        },
        ssr: {
            noExternal: ['vue']
        },
        // Optimize dependencies to prevent HMR conflicts
        optimizeDeps: {
            include: [
                'vue',
                '@nuxt/ui',
                'pinia',
                '@vueuse/core',
                '@internationalized/date',
                '@tiptap/extension-link',
                '@tiptap/extension-underline',
                '@tiptap/starter-kit',
                '@tiptap/vue-3',
                'chart.js',
                'defu',
                'dexie',
                'exifr',
                'isomorphic-dompurify',
                'mitt',
                'maplibre-gl',
                'qrcode',
                'virtua',
                'vue-chartjs',
                'vuedraggable'
            ],
            // Force exclude CSS processing from dependency optimization
            exclude: ['@nuxt/ui-templates'],
            // Force pre-bundling on dev server start to avoid lazy module resolution issues
            force: true
        },
        // CSS handling to prevent MIME type issues
        css: {
            // Disable CSS code splitting in dev to prevent module/CSS confusion
            devSourcemap: true
        },
        plugins: [
            ...(isDev ? [createNuxtDevBuildMetaPlugin()] : []),
            // Fix CSS MIME type issues in dev: transform CSS to JS modules when imported from JS
            // Nuxt's css.mjs virtual module imports CSS files which should be handled by Vite's
            // CSS plugin, but in DDEV/proxy environments, they get served as raw CSS.
            // This plugin modifies the css.mjs to use ?inline imports which return CSS as strings.
            ...(isDev
                ? [{
                    name: 'fix-css-imports',
                    enforce: 'pre' as const,
                    apply: 'serve' as const,
                    transform(code: string, id: string, options?: { ssr?: boolean }) {
                    // Skip SSR transforms - CSS is only needed on client
                        if (options?.ssr) return null;

                        // Transform the css.mjs virtual module to use ?inline imports
                        // Match various forms: .nuxt/css.mjs, virtual:nuxt:...css.mjs
                        const isCssMjs = id.includes('css.mjs') && (id.includes('.nuxt') || id.includes('virtual:nuxt'));
                        if (isCssMjs) {
                            console.log('[fix-css-imports] Transforming:', id);
                            // Add ?inline to CSS imports and wrap in style injection
                            const transformed = code.replace(
                                /import\s+["']([^"']+\.css)["'];?/g,
                                (_match, cssPath) => {
                                    const varName = `css_${Math.random().toString(36).slice(2, 8)}`;
                                    return `import ${varName} from "${cssPath}?inline";
(function(){const s=document.createElement('style');s.textContent=${varName};document.head.appendChild(s);})();`;
                                }
                            );
                            return { code: transformed, map: null };
                        }
                        return null;
                    },
                    // Intercept CSS responses that are requested as scripts and wrap them in JS
                    configureServer(server: any) {
                        server.middlewares.use((req: any, res: any, next: any) => {
                            const url = req.url || '';
                            const secFetchDest = req.headers['sec-fetch-dest'];

                            // If CSS file requested as script, wrap response in JS module
                            if ((url.includes('.css') || url.includes('lang.css')) &&
                              !url.includes('?inline') && secFetchDest === 'script') {
                                const originalWrite = res.write.bind(res);
                                const originalEnd = res.end.bind(res);
                                let body = '';

                                res.write = (chunk: any) => {
                                    body += chunk.toString();
                                    return true;
                                };

                                res.end = (chunk?: any) => {
                                    if (chunk) body += chunk.toString();

                                    // Check if response is CSS (starts with CSS-like content)
                                    if (body.trim().startsWith('/*') || body.trim().startsWith('@') ||
                                      body.trim().startsWith('.') || body.trim().startsWith(':')) {
                                    // Wrap CSS in JS module that injects styles
                                        const escaped = JSON.stringify(body);
                                        const jsModule = `const css = ${escaped};
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
export default css;`;
                                        res.setHeader('Content-Type', 'text/javascript');
                                        res.setHeader('Content-Length', Buffer.byteLength(jsModule));
                                        return originalEnd(jsModule);
                                    }
                                    return originalEnd(body);
                                };
                            }
                            next();
                        });
                    }
                }]
                : []),
            {
                name: 'remove-empty-css',
                apply: 'build',
                generateBundle(_options, bundle) {
                    const emptyCssFiles = new Set<string>();

                    // First pass: identify empty CSS files
                    for (const fileName of Object.keys(bundle)) {
                        if (fileName.endsWith('.css')) {
                            const asset = bundle[fileName];
                            if (asset.type === 'asset') {
                                const content = typeof asset.source === 'string'
                                    ? asset.source
                                    : new TextDecoder().decode(asset.source as Uint8Array);
                                const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '').trim();
                                if (stripped.length < 10) {
                                    emptyCssFiles.add(fileName);
                                }
                            }
                        }
                    }

                    // Second pass: remove references from JS chunks
                    for (const fileName of Object.keys(bundle)) {
                        const chunk = bundle[fileName];
                        if (chunk.type === 'chunk') {
                            // Clean viteMetadata.importedCss
                            const meta = (chunk as any).viteMetadata;
                            if (meta?.importedCss) {
                                for (const css of emptyCssFiles) {
                                    meta.importedCss.delete(css);
                                }
                            }
                        }
                    }

                    // Third pass: delete empty CSS files
                    for (const css of emptyCssFiles) {
                        console.log(`[remove-empty-css] Removed: ${css}`);
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete bundle[css];
                    }
                }
            }
        ],
        build: {
            chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
            sourcemap: isDev,
            cssMinify: 'lightningcss',
            // CSS code splitting configuration
            cssCodeSplit: true,
            // Rollup options for finer control
            rollupOptions: {
                output: {
                    // Ensure CSS assets meet minimum size threshold
                    assetFileNames: (assetInfo) => {
                        // Standard asset naming
                        if (assetInfo.name?.endsWith('.css')) {
                            return '_nuxt/[name].[hash].css';
                        }
                        return '_nuxt/[name].[hash][extname]';
                    }
                }
            },
            // Disable automatic modulePreload for heavy chunks (MapLibre ~1MB)
            // This prevents the browser from prefetching the map chunk on initial load
            // The map will load on-demand when user interacts with it
            modulePreload: {
                resolveDependencies: (_filename, deps) => {
                    // Filter out MapLibre and ALL map-related chunks from preload
                    return deps.filter(dep =>
                        !dep.includes('maplibre') &&
                        !dep.includes('Map.') &&
                        !dep.includes('MapSection') &&
                        !dep.includes('MapLazy') &&
                        !dep.includes('MiniMap.') &&
                        !dep.includes('useMap')
                    );
                }
            }
        }
    },
    debug: isDev,
    eslint: {
        fix: true, // Auto-fix linting issues
        emitWarning: true
    },

    i18n: {
        // Use no route prefix for languages to allow in-place locale switching
        strategy: 'no_prefix',
        // Custom vue-i18n config registers plural rules for cs/pl/uk/ar
        vueI18n: './i18n.config.ts',
        // Default locale files - customizations come from Drupal i18n.overrides at runtime
        langDir: 'locales/default',
        // All available locales
        locales: [...SUPPORTED_LOCALES],
        defaultLocale: clientConfig.languages?.defaultLocale || DEFAULT_LOCALE,
        // IMPORTANT: Disable lazy loading to ensure all locales are bundled
        // This prevents "Not found" errors when switching locales
        // @ts-expect-error - lazy is supported but types don't include it
        lazy: false,
        // Drupal resolves the initial locale per jurisdiction during SSR and writes it
        // into Nuxt state. Keep browser/cookie detection disabled so the build-time
        // defaultLocale never overrides the runtime tenant locale on hydration.
        detectBrowserLanguage: false,
        experimental: {
            nitroContextDetection: true,
            preload: true
        },
        debug: false
    },

    // Icon configuration - 100% offline, no external connections (DSGVO-compliant)
    // Static <Icon> components are bundled at build time from @iconify-json/* packages
    // Dynamic map icons are served via /_dynamic-icons/ server handler at runtime
    icon: {
        // Use local endpoint for static icon loading (SSR)
        // IMPORTANT: Don't use /api/ prefix - it's caught by our Drupal proxy
        localApiEndpoint: '/_icons',

        // Bundle icons used in <Icon> components at build time
        clientBundle: {
            // Scan all components for icon usage and include them
            scan: true,
            // Include custom collections (if any)
            includeCustomCollections: true,
            // Size limit for bundled icons (KB)
            sizeLimitKb: 1024
            // NOTE: Map marker icons are NOT pre-bundled here anymore.
            // They are loaded dynamically via /_dynamic-icons/ server handler
            // which reads from @iconify-json/lucide at runtime.
            // This allows Drupal admins to configure ANY Lucide icon without rebuild.
        },

        // Server bundle: 'auto' detects node-server preset → 'local' mode
        // which externalizes icon JSONs instead of inlining them (prevents OOM)
        serverBundle: 'auto',

        // Security: Disable external Iconify API connections (DSGVO-compliant)
        fallbackToApi: false
    },
    pwa: createPWAConfig(clientConfig as any),
    tailwindcss: {
        config: {
            darkMode: 'class',
            // Safelist all color palettes for runtime theme switching
            // This enables single-image deployments where theme is configured via backend
            // @see https://github.com/markaspot/markaspot-ui/issues/63
            safelist: [
                // Primary/Secondary semantic colors (mapped at runtime)
                { pattern: /^(bg|text|border|ring|outline)-(primary|secondary)-(50|100|200|300|400|500|600|700|800|900|950)$/ },
                // All Tailwind color palettes that can be selected as primary/secondary
                { pattern: /^(bg|text|border|ring)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/ },
                // Neutral palettes
                { pattern: /^(bg|text|border)-(slate|gray|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)$/ },
                // Hover/focus variants for interactive elements
                { pattern: /^hover:(bg|text|border)-(primary|secondary)-(50|100|200|300|400|500|600|700|800|900|950)$/ },
                { pattern: /^focus:(ring|border)-(primary|secondary)-(50|100|200|300|400|500|600|700|800|900|950)$/ }
            ]
        }
    },

    ...({})
});
