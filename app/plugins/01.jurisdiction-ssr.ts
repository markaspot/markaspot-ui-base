/**
 * Jurisdiction SSR Preload Plugin
 *
 * Loads jurisdiction and settings data during SSR to prevent client-side waterfall.
 * Adds HTTP Link headers for fonts/logos to enable early preloading (before HTML parsing).
 *
 * IMPORTANT: This plugin populates the SAME state keys used by useMarkASpotConfig():
 * - 'mas-config-state' for the config data
 * - 'mas-config-status' for the loading status
 *
 * This ensures a single source of truth and prevents duplicate API calls.
 * The config.ts plugin will skip fetching if this plugin already loaded the data.
 *
 * Font CSS is delivered as a <link rel="stylesheet"> pointing to /api/fonts.css,
 * which proxies Drupal's /api/fonts.css endpoint. A <link> element is a static
 * DOM node - Vue/Nuxt hydration never overwrites it, making it immune to the
 * reactive useHead() hydration bug that affects inline style injection.
 *
 * Load order: 01.jurisdiction-ssr → config.ts → middleware → other plugins
 */
import { appendResponseHeader, getRequestURL } from 'h3';
import { normalizeConfig, type MarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import { resolveSsrJurisdictionKey } from '~/composables/core/useErrorPageJurisdiction';
import { DEFAULT_BRANDING_ASSETS, resolveClientAssetPath } from '~/utils/clientAssetResolver';
import { resolveColorToHex, computeSplashHash } from '~/utils/colorPalette';
import { resolveRenderableDefaultLocale } from '~/utils/locale';
import type { Jurisdiction } from '~~/server/api/jurisdictions.get';
import type { PreloadLink } from '@/types/form';
import {
    isFastmapMarketingPath,
    stripFastmapLocalePrefix
} from '../../fastmap-layer/lib/locale-routing';

export default defineNuxtPlugin({
    name: 'mas-jurisdiction-ssr',
    enforce: 'pre', // Run as early as possible

    async setup(nuxtApp) {
        // Get route to determine jurisdiction from URL
        const route = useRoute();
        const config = useRuntimeConfig();
        const runtimeJurisdictionId = String(config.jurisdictionId || '');
        const singleTenantFlag = useState<boolean>('jurisdiction-single-tenant', () => false);
        const enforceRuntimeSingleTenantFlag = () => {
            if (runtimeJurisdictionId) {
                singleTenantFlag.value = true;
            }
        };
        nuxtApp.hook('app:created', enforceRuntimeSingleTenantFlag);
        if (import.meta.server) {
            enforceRuntimeSingleTenantFlag();
        }

        // Skip jurisdiction/settings fetch for FastMap marketing pages.
        // These pages render their own static content and don't need Drupal config.
        // Without this check, a failing Settings API (e.g. no backend) blocks SSR
        // and produces an empty shell - fatal for SEO.
        const rawPath = route.path;
        const strippedPath = stripFastmapLocalePrefix(rawPath);
        if (isFastmapMarketingPath(strippedPath) || isFastmapMarketingPath(rawPath)) {
            return;
        }

        // SSR-safe state for jurisdictions (shared between server/client)
        const jurisdictionsState = useState<{
            jurisdictions: Jurisdiction[]
            count: number
            hasMultiple: boolean
            loaded: boolean
            error: string | null
        }>('jurisdictions-state', () => ({
            jurisdictions: [],
            count: 0,
            hasMultiple: false,
            loaded: false,
            error: null
        }));

        // Only fetch on SSR if not already loaded
        if (import.meta.server && !jurisdictionsState.value.loaded) {
            try {
                // Use $fetch (not useFetch) for reliable SSR data fetching in plugins.
                // useFetch can return null in plugin context due to lifecycle issues.
                const data = await $fetch<{
                    jurisdictions: Jurisdiction[]
                    count: number
                    hasMultiple: boolean
                }>('/api/jurisdictions');

                jurisdictionsState.value = {
                    jurisdictions: data.jurisdictions || [],
                    count: data.count || 0,
                    hasMultiple: data.hasMultiple ?? false,
                    loaded: true,
                    error: null
                };
            } catch (err: unknown) {
                const msg = (err instanceof Error ? err.message : String(err)) || 'Failed to load jurisdictions';
                console.error('[SSR] Jurisdiction preload error:', msg);
                jurisdictionsState.value.error = msg;
            }
        }

        // Determine current jurisdiction from route params or query (SSR-safe)
        // Query param fallback enables theme loading on routes outside [[jurisdiction]]
        // (e.g., /auth/login?jurisdiction=stadt-koeln)
        const jurisdictionSlug = (route.params.jurisdiction || route.query.jurisdiction) as string | undefined;

        // Use the SAME state keys as useMarkASpotConfig() to prevent duplicate fetches
        // When config.ts plugin runs, it will see isReady=true and skip fetching
        const configState = useState<MarkASpotConfig | null>('mas-config-state', () => null);
        const configStatus = useState<'idle' | 'pending' | 'success' | 'error'>('mas-config-status', () => 'idle');
        const configJurisdictionKey = useState<string>('mas-config-jurisdiction-key', () => '');
        // Capture request origin during SSR for absolute OG/Twitter URLs.
        // Transferred to client via payload, so useHead() can produce the same tags.
        const siteOrigin = useState<string>('mas-site-origin', () => '');
        if (import.meta.server && !siteOrigin.value) {
            const event = useRequestEvent();
            if (event) {
                siteOrigin.value = getRequestURL(event).origin;
            }
        }

        if (import.meta.server && configStatus.value !== 'success') {
            // Build settings URL with jurisdiction parameter
            // Exclude boundary during SSR for faster initial load (lazy-loaded later)
            let settingsUrl = '/api/mark-a-spot-settings?exclude=boundary';
            const errorUrl = String((useError().value as { url?: string } | undefined)?.url || '');
            // Authenticated SSR (Drupal session cookie present) is allowed to
            // resolve route slugs that are not in the public jurisdictions
            // list — covers admin-only workspaces a platform admin reaches via
            // bookmark / hard refresh. The middleware gates anonymous traffic
            // before we get here.
            const ssrEvent = useRequestEvent();
            const hasSession = !!ssrEvent?.context?.hasDrupalSession;
            const { key: resolvedJurisdictionKey, source: jurisdictionSource } = resolveSsrJurisdictionKey({
                routeJurisdictionKey: jurisdictionSlug || '',
                routePath: route.path,
                runtimeJurisdictionId: String(config.jurisdictionId || ''),
                errorUrl,
                jurisdictions: jurisdictionsState.value.jurisdictions,
                acceptUnknownSlugs: hasSession
            });

            if (resolvedJurisdictionKey) {
                settingsUrl += `&jurisdiction=${encodeURIComponent(resolvedJurisdictionKey)}`;
            }

            if (jurisdictionSource === 'runtime-config') {
                // Signal single-tenant mode to client.
                // The middleware will skip slug-based redirects when this flag is set,
                // because the jurisdiction was resolved from ENV, not from a URL slug.
                singleTenantFlag.value = true;
            }

            try {
                configStatus.value = 'pending';
                const settingsData = await $fetch<MarkASpotConfig>(settingsUrl);

                // Normalize config (same logic as useMarkASpotConfig.normalizeConfig)
                const normalized = normalizeConfig(settingsData);
                configState.value = normalized;
                configStatus.value = 'success';
                configJurisdictionKey.value = resolvedJurisdictionKey;

                // Set the SSR locale from jurisdiction config so translations, head
                // metadata, and the serialized resolved locale match the request.
                // The jurisdiction's config from Drupal is the source of truth.
                // Do NOT use event.context.nuxtI18n.detectLocale from the server
                // middleware here, as it may have been resolved for a different
                // jurisdiction (e.g., ENV fallback in single-tenant mode).
                const { LOCALE_CODES } = await import('../../config/locales');
                const effectiveLocale = normalized.languages
                    ? resolveRenderableDefaultLocale(
                        normalized.languages.default,
                        normalized.languages.available,
                        LOCALE_CODES
                    )
                    : '';

                if (effectiveLocale) {
                    if ((LOCALE_CODES as string[]).includes(effectiveLocale)) {
                        const i18n = nuxtApp.$i18n as { locale: { value: string }, setLocale: (l: string) => Promise<void> };
                        const resolvedLocaleState = useState<string>('i18n:resolved-locale', () => '');
                        resolvedLocaleState.value = effectiveLocale;
                        if (import.meta.server) {
                            const event = useRequestEvent();
                            if (event) {
                                event.context.nuxtI18n = event.context.nuxtI18n || {};
                                event.context.nuxtI18n.detectLocale = effectiveLocale;
                            }
                        }
                        if (i18n && i18n.locale.value !== effectiveLocale) {
                            await i18n.setLocale(effectiveLocale);
                        }
                    }
                }

                // Preload fonts and logo to reduce CLS
                const fonts = settingsData?.theme?.fonts;
                const logos = settingsData?.theme?.logos;
                const preloadLinks: PreloadLink[] = [];

                // Helper to resolve Drupal paths through proxy.
                // Blocks external and protocol-relative URLs to prevent GDPR-violating
                // third-party connections and HTTP header injection.
                const resolvePath = (path: string, type: 'fonts' | 'images'): string => {
                    if (!path) return '';
                    if (/^https?:\/\//i.test(path) || path.startsWith('//')) return '';
                    return path.startsWith('/') ? `/api/${type}${path}` : `/api/${type}/${path}`;
                };

                // Preload custom fonts with high priority
                if (fonts?.headingUrl) {
                    preloadLinks.push({
                        rel: 'preload',
                        as: 'font',
                        type: 'font/woff2',
                        href: resolvePath(fonts.headingUrl, 'fonts'),
                        crossorigin: 'anonymous',
                        fetchpriority: 'high',
                        key: 'font-heading'
                    });
                }
                if (fonts?.bodyUrl) {
                    preloadLinks.push({
                        rel: 'preload',
                        as: 'font',
                        type: 'font/woff2',
                        href: resolvePath(fonts.bodyUrl, 'fonts'),
                        crossorigin: 'anonymous',
                        fetchpriority: 'high',
                        key: 'font-body'
                    });
                }

                // Preload both logo variants (SSR cannot predict color mode)
                if (logos?.dark) {
                    preloadLinks.push({
                        rel: 'preload',
                        as: 'image',
                        href: resolvePath(logos.dark, 'images'),
                        fetchpriority: 'high',
                        key: 'logo-dark'
                    });
                }
                if (logos?.light) {
                    preloadLinks.push({
                        rel: 'preload',
                        as: 'image',
                        href: resolvePath(logos.light, 'images'),
                        fetchpriority: 'high',
                        key: 'logo-light'
                    });
                }

                // Filter out empty hrefs (blocked external URLs)
                const validLinks = preloadLinks.filter(l => l.href);

                if (validLinks.length > 0) {
                    // Add HTTP Link headers for early preloading (before HTML parsing)
                    const event = useRequestEvent();
                    if (event) {
                        validLinks.forEach((link) => {
                            // Sanitize href to prevent HTTP header injection (CWE-113)
                            const safeHref = link.href.replace(/[\r\n\t]/g, '');
                            const parts = [`<${safeHref}>`, `rel=${link.rel}`, `as=${link.as}`];
                            if (link.type) parts.push(`type=${link.type}`);
                            if (link.crossorigin) parts.push('crossorigin');
                            const linkHeader = parts.join('; ');
                            appendResponseHeader(event, 'Link', linkHeader);
                        });
                    }

                    // Also add to <head> for client-side navigation (SPA mode)
                    useHead({ link: validLinks as any });
                }

                // Font stylesheet is registered below (outside import.meta.server)
                // so it runs on both SSR and client for unhead hydration continuity.
            } catch (settingsError: unknown) {
                console.error('[SSR] Config preload error:', settingsError instanceof Error ? settingsError.message : String(settingsError));
                // Set error state - config.ts plugin will retry if needed
                configStatus.value = 'error';
            }
        }

        // Register font stylesheet on BOTH server and client so unhead keeps it
        // alive through hydration. On SSR, configState was just populated above.
        // On client, it arrives via the __NUXT_DATA__ payload transfer.
        // useHead() must be called outside of import.meta.server to register
        // the client-side entry - otherwise unhead removes the SSR element.
        const fontsTheme = configState.value?.theme;
        const hasFonts = !!(fontsTheme?.customCss || fontsTheme?.fonts?.heading || fontsTheme?.fonts?.body);
        if (hasFonts) {
            const jurisdictionId = configState.value?.jurisdiction?.id;
            const fontsCssUrl = `/api/fonts.css${jurisdictionId ? `?jurisdiction=${jurisdictionId}` : ''}`;
            useHead({
                link: [{
                    rel: 'stylesheet',
                    href: fontsCssUrl,
                    id: 'mas-fonts-css',
                    key: 'mas-fonts-css'
                }]
            });
        }

        // Dynamic PWA/branding head tags (favicon, manifest, theme-color, OG image).
        // Runs outside import.meta.server for hydration continuity (same pattern as fonts.css).
        const theme = configState.value?.theme;
        const jurisdictionKey = configJurisdictionKey.value;

        const primaryHex = resolveColorToHex(theme?.primary || 'blue');
        const faviconUrl = resolveClientAssetPath(theme?.favicon || theme?.logos?.dark, DEFAULT_BRANDING_ASSETS.favicon);
        const pwaIconUrl = resolveClientAssetPath(theme?.pwaIcon || theme?.logos?.dark, DEFAULT_BRANDING_ASSETS.icon512);
        const ogImagePath = resolveClientAssetPath(theme?.ogImage, '/images/og-image.webp');
        // OG/Twitter images require fully-qualified absolute URLs (social crawlers
        // don't resolve relative paths). Prefix with origin captured during SSR.
        const origin = siteOrigin.value;
        const ogImageUrl = origin ? `${origin}${ogImagePath}` : ogImagePath;
        const manifestUrl = jurisdictionKey
            ? `/manifest.webmanifest?jurisdiction=${encodeURIComponent(jurisdictionKey)}`
            : '/manifest.webmanifest';

        const clientName = configState.value?.client?.name ||
          configState.value?.jurisdiction?.name ||
          'Mark-a-Spot';

        // Dynamic Apple splash screens: per-tenant branded splash via server-rendered PNGs.
        // Hash computed from neutral-950 bg + primary color + logo path ensures
        // cache busting when theme changes, while allowing immutable caching otherwise.
        const neutralHex = resolveColorToHex(theme?.neutral || 'slate', '950');
        const splashLogoPath = theme?.pwaIcon || theme?.logos?.dark || '';
        const splashHash = jurisdictionKey
            ? computeSplashHash(neutralHex, primaryHex, splashLogoPath)
            : '';
        const splashJur = jurisdictionKey ? encodeURIComponent(jurisdictionKey) : '';

        const APPLE_SPLASH_SIZES = [
            { sizes: '2048x2732', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '2732x2048', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '1668x2388', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '2388x1668', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '1536x2048', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '2048x1536', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '1640x2360', media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '2360x1640', media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '1668x2224', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '2224x1668', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '1620x2160', media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '2160x1620', media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '1488x2266', media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '2266x1488', media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '1320x2868', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2868x1320', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '1206x2622', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2622x1206', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '1260x2736', media: '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2736x1260', media: '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '1290x2796', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2796x1290', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '1179x2556', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2556x1179', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '1170x2532', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2532x1170', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '1284x2778', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2778x1284', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '1125x2436', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2436x1125', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '1242x2688', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2688x1242', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '828x1792', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '1792x828', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '1242x2208', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
            { sizes: '2208x1242', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
            { sizes: '750x1334', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '1334x750', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
            { sizes: '640x1136', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
            { sizes: '1136x640', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' }
        ] as const;

        const appleSplashScreens = APPLE_SPLASH_SIZES.map(s => ({
            rel: 'apple-touch-startup-image' as const,
            href: splashJur
                ? `/api/splash/${splashJur}/${splashHash}/${s.sizes}.png`
                : `/images/apple-splash-${s.sizes}.png`,
            media: s.media,
            key: `apple-splash-${s.sizes}`
        }));

        useHead({
            link: [
                { rel: 'icon', type: 'image/svg+xml', href: faviconUrl, key: 'favicon' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: pwaIconUrl, key: 'apple-touch-icon' },
                { rel: 'manifest', href: manifestUrl, key: 'pwa-manifest' },
                ...appleSplashScreens
            ],
            meta: [
                { name: 'theme-color', content: primaryHex, key: 'theme-color' },
                { name: 'apple-mobile-web-app-title', content: clientName, key: 'apple-web-app-title' },
                { property: 'og:title', content: clientName, key: 'og-title' },
                { property: 'og:description', content: `${clientName} - Citizen Reporting`, key: 'og-description' },
                { property: 'og:image', content: ogImageUrl, key: 'og-image' },
                { name: 'twitter:title', content: clientName, key: 'twitter-title' },
                { name: 'twitter:description', content: `${clientName} - Citizen Reporting`, key: 'twitter-description' },
                { name: 'twitter:image', content: ogImageUrl, key: 'twitter-image' }
            ]
        });

        // Provide SSR metadata to composables
        nuxtApp.provide('ssrJurisdictionLoaded', jurisdictionsState.value.loaded);
    }
});
