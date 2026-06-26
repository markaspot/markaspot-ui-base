/**
 * Dynamic Splash Screen Route
 *
 * Generates branded Apple splash screen PNGs per jurisdiction.
 * Path format: /api/splash/{jurisdiction}/{hash}/{WxH}.png
 *
 * Flow:
 * 1. Parse & validate path segments and size
 * 2. Fetch jurisdiction settings, compute canonical hash
 * 3. If URL hash != canonical: 302 redirect (handles stale HTML)
 * 4. Check persistent cache (fs-backed storage)
 * 5. On miss: fetch logo from Drupal, render SVG->PNG via resvg, store
 * 6. On ANY failure: return solid-color PNG with Cache-Control: no-cache
 *
 * Cache: path-based versioning + immutable headers. Hash changes = new URL = cache miss.
 * Eviction: Max 500 entries, oldest removed on write.
 */
import { defineEventHandler, createError, sendRedirect, setResponseHeaders, send } from 'h3';
import { generateSplashPng, computeSplashHash } from '../../utils/splash-generator';
import { resolveColorToHex } from '../../utils/color-resolver';
import { isSuspiciousPath } from '../../utils/path';

// Jurisdiction slugs: alphanumeric, hyphens, underscores only (max 64 chars)
const JURISDICTION_RE = /^[a-zA-Z0-9_-]{1,64}$/;
// Hash: 6-char base36 from computeSplashHash
const HASH_RE = /^[a-z0-9]{1,8}$/;

// All known iOS splash screen dimensions (portrait + landscape)
const VALID_SIZES = new Set([
    '2048x2732', '2732x2048',
    '1668x2388', '2388x1668',
    '1536x2048', '2048x1536',
    '1640x2360', '2360x1640',
    '1668x2224', '2224x1668',
    '1620x2160', '2160x1620',
    '1488x2266', '2266x1488',
    '1320x2868', '2868x1320',
    '1206x2622', '2622x1206',
    '1260x2736', '2736x1260',
    '1290x2796', '2796x1290',
    '1179x2556', '2556x1179',
    '1170x2532', '2532x1170',
    '1284x2778', '2778x1284',
    '1125x2436', '2436x1125',
    '1242x2688', '2688x1242',
    '828x1792', '1792x828',
    '1242x2208', '2208x1242',
    '750x1334', '1334x750',
    '640x1136', '1136x640'
]);

const MAX_CACHE_ENTRIES = 500;

// In-flight dedup: prevent parallel renders for the same cache key
const inflightMap = new Map<string, Promise<{ png: Buffer, complete: boolean }>>();

interface SettingsTheme {
    primary?: string
    neutral?: string
    pwaIcon?: string
    logos?: { dark?: string, light?: string }
}

interface SettingsResponse {
    theme?: SettingsTheme
}

export default defineEventHandler(async (event) => {
    const pathParam = event.context.params?.path;
    const pathStr = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');

    // Parse: {jurisdiction}/{hash}/{WxH}.png
    // Strip .png extension from the last segment (catch-all includes it)
    const segments = pathStr.replace(/\.png$/i, '').split('/');
    if (segments.length !== 3) {
        throw createError({ statusCode: 400, message: 'Invalid path format. Expected: /api/splash/{jurisdiction}/{hash}/{WxH}.png' });
    }

    const [jurisdiction, urlHash, sizeStr] = segments;

    if (!jurisdiction || !urlHash || !sizeStr) {
        throw createError({ statusCode: 400, message: 'Missing path segments' });
    }

    // Validate jurisdiction and hash format to prevent cache key traversal (CWE-22)
    if (!JURISDICTION_RE.test(jurisdiction)) {
        throw createError({ statusCode: 400, message: 'Invalid jurisdiction identifier' });
    }
    if (!HASH_RE.test(urlHash)) {
        throw createError({ statusCode: 400, message: 'Invalid hash format' });
    }

    // Validate size against whitelist
    if (!VALID_SIZES.has(sizeStr)) {
        throw createError({ statusCode: 400, message: `Invalid size: ${sizeStr}` });
    }

    const [widthStr, heightStr] = sizeStr.split('x');
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    // Fetch jurisdiction settings
    // Derive host from runtimeConfig (not client header) to prevent host header injection (CWE-74)
    const config = useRuntimeConfig();
    let canonicalHost = '';
    try {
        canonicalHost = new URL(String(config.public.apiBase || config.public.geoReportApiBase)).hostname;
    } catch { /* ignore */ }

    let settings: SettingsResponse;
    try {
        settings = await $fetch<SettingsResponse>(
            `/api/mark-a-spot-settings?exclude=boundary&jurisdiction=${encodeURIComponent(jurisdiction)}`,
            { headers: { host: canonicalHost || '' } }
        );
    } catch {
        // Settings fetch failed: return solid-color fallback
        return serveFallback(event, width, height, '#020617');
    }

    const theme = settings?.theme;

    // Resolve render inputs
    const neutralHex = resolveColorToHex(theme?.neutral || 'slate', '950');
    const primaryHex = resolveColorToHex(theme?.primary || 'blue');
    const logoPath = theme?.pwaIcon || theme?.logos?.dark || '';

    // Compute canonical hash from actual render inputs
    const canonicalHash = computeSplashHash(neutralHex, primaryHex, logoPath);

    // Redirect if URL hash doesn't match canonical (stale HTML referencing old theme)
    if (urlHash !== canonicalHash) {
        const canonicalUrl = `/api/splash/${encodeURIComponent(jurisdiction)}/${canonicalHash}/${sizeStr}.png`;
        return sendRedirect(event, canonicalUrl, 302);
    }

    // Cache key for persistent storage
    const cacheKey = `${jurisdiction}-${sizeStr}-${canonicalHash}`;
    const storage = useStorage('splash');

    // Check cache
    try {
        const cached = await storage.getItemRaw(cacheKey);
        if (cached) {
            setResponseHeaders(event, {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=31536000, immutable'
            });
            return send(event, Buffer.from(cached as ArrayBuffer));
        }
    } catch {
        // Cache read failed, proceed to render
    }

    // In-flight dedup: join existing render if one is in progress
    if (inflightMap.has(cacheKey)) {
        try {
            const result = await inflightMap.get(cacheKey)!;
            setResponseHeaders(event, {
                'Content-Type': 'image/png',
                'Cache-Control': result.complete ? 'public, max-age=31536000, immutable' : 'public, max-age=300'
            });
            return send(event, result.png);
        } catch {
            return serveFallback(event, width, height, neutralHex);
        }
    }

    // Start render
    const renderPromise = renderSplash(width, height, neutralHex, logoPath, cacheKey, storage);
    inflightMap.set(cacheKey, renderPromise);

    try {
        const result = await renderPromise;
        setResponseHeaders(event, {
            'Content-Type': 'image/png',
            // Incomplete renders (logo fetch failed) get short cache so retries succeed
            'Cache-Control': result.complete ? 'public, max-age=31536000, immutable' : 'public, max-age=300'
        });
        return send(event, result.png);
    } catch {
        return serveFallback(event, width, height, neutralHex);
    } finally {
        inflightMap.delete(cacheKey);
    }
});

/**
 * Render splash PNG: fetch logo, generate, store in cache.
 * Returns { png, complete } where complete=false means logo fetch failed
 * (the PNG should NOT be cached with immutable headers).
 */
async function renderSplash(
    width: number,
    height: number,
    bgColor: string,
    logoPath: string,
    cacheKey: string,
    storage: ReturnType<typeof useStorage>
): Promise<{ png: Buffer, complete: boolean }> {
    let logoData: { buffer: Buffer, contentType: string } | null = null;

    // Fetch logo directly from Drupal backend (bypass proxy roundtrip)
    // Validate logoPath to prevent SSRF (CWE-918)
    if (logoPath && !isSuspiciousPath(logoPath)) {
        try {
            const config = useRuntimeConfig();
            const backendUrl = String(config.public.imageProxyBackend || config.public.geoReportApiBase || config.public.apiBase);
            const rawUrl = logoPath.startsWith('/') ? `${backendUrl}${logoPath}` : `${backendUrl}/${logoPath}`;

            // Validate resolved URL stays within backend origin
            let logoUrl: string;
            try {
                const parsed = new URL(rawUrl);
                const backendOrigin = new URL(backendUrl).origin;
                if (parsed.origin !== backendOrigin) {
                    throw new Error('Logo URL escaped backend origin');
                }
                logoUrl = parsed.href;
            } catch {
                logoUrl = ''; // Invalid URL, skip logo
            }

            if (!logoUrl) {
                return {
                    png: await generateSplashPng(width, height, bgColor, null),
                    complete: false
                };
            }

            const response = await fetch(logoUrl, {
                headers: { Accept: 'image/*' }
            });

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const contentType = response.headers.get('content-type') || 'image/png';
                logoData = {
                    buffer: Buffer.from(arrayBuffer),
                    contentType
                };
            }
        } catch {
            // Logo fetch failed: render without logo
        }
    }

    const png = await generateSplashPng(width, height, bgColor, logoData);

    // Only persist to cache if the render is "complete":
    // - Logo was fetched successfully, OR
    // - No logo was configured (logoPath is empty)
    // A temporary logo fetch failure must NOT produce a permanently cached
    // logo-less PNG with immutable headers (would survive until eviction).
    const complete = !logoPath || logoData !== null;
    if (complete) {
        storage.setItemRaw(cacheKey, png).then(() => evictIfNeeded(storage)).catch(() => {});
    }

    return { png, complete };
}

/**
 * Evict entries if cache exceeds MAX_CACHE_ENTRIES.
 * Uses random eviction (fair across all jurisdictions, no alphabetical bias).
 * True LRU is not feasible with unstorage's fs driver without sidecar metadata.
 */
async function evictIfNeeded(storage: ReturnType<typeof useStorage>): Promise<void> {
    try {
        const keys = await storage.getKeys();
        if (keys.length <= MAX_CACHE_ENTRIES) return;

        const excess = keys.length - MAX_CACHE_ENTRIES;
        // Shuffle and pick N random keys to evict
        for (let i = keys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]];
        }
        const toDelete = keys.slice(0, excess);
        await Promise.all(toDelete.map(k => storage.removeItem(k)));
    } catch {
        // Eviction failure is non-critical
    }
}

/**
 * Serve a solid-color fallback PNG. Never cached persistently.
 */
async function serveFallback(
    event: Parameters<typeof send>[0],
    width: number,
    height: number,
    bgColor: string
) {
    try {
        const png = await generateSplashPng(width, height, bgColor, null);
        setResponseHeaders(event, {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache'
        });
        return send(event, png);
    } catch {
        // Even fallback generation failed: return 1x1 transparent PNG
        setResponseHeaders(event, {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache'
        });
        // Minimal valid 1x1 PNG
        const minimalPng = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRElEQkSuQmCC',
            'base64'
        );
        return send(event, minimalPng);
    }
}
