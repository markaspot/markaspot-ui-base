import { Agent } from 'https';

/**
 * App Mode Resolver
 *
 * Resolves whether a given hostname should run in 'citizen' or 'full' mode
 * by checking against jurisdiction host mappings from Drupal.
 *
 * Priority:
 * 1. NUXT_APP_MODE ENV (handled by middleware, not here)
 * 2. Host found in publicHosts -> 'citizen'
 * 3. Host found in allowedHosts -> 'full'
 * 4. Host not found -> 'full' (dev compatibility)
 *
 * Caches the host map in memory with a 5-minute TTL.
 * Uses stale-while-revalidate: serves old data while refreshing in background.
 */

interface JurisdictionHostMapping {
    jurisdiction_id: number
    name: string
    allowedHosts: string[]
    publicHosts: string[]
}

type AppMode = 'citizen' | 'full';

// Module-level cache
let hostMap: Map<string, AppMode> = new Map();
let lastFetched = 0;
let refreshPromise: Promise<void> | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function buildHostMap(mappings: JurisdictionHostMapping[]): Map<string, AppMode> {
    const map = new Map<string, AppMode>();
    for (const mapping of mappings) {
        for (const host of mapping.publicHosts) {
            map.set(host.toLowerCase(), 'citizen');
        }
        for (const host of mapping.allowedHosts) {
            map.set(host.toLowerCase(), 'full');
        }
    }
    return map;
}

async function fetchHostMappings(): Promise<JurisdictionHostMapping[]> {
    const config = useRuntimeConfig();
    const apiBase = (config.public.geoReportApiBase || config.public.apiBase) as string;
    const baseUrl = String(apiBase).replace(/\/+$/, '');
    const url = `${baseUrl}/api/jurisdiction-hosts`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Forwarded-Proto': 'https'
        },
        // @ts-expect-error Node.js specific
        agent: new Agent({ rejectUnauthorized: config.proxy?.rejectUnauthorized ?? false })
    });

    if (!response.ok) {
        throw new Error(`jurisdiction-hosts API returned ${response.status}`);
    }

    return await response.json() as JurisdictionHostMapping[];
}

async function doRefresh(): Promise<void> {
    try {
        const mappings = await fetchHostMappings();
        hostMap = buildHostMap(mappings);
        lastFetched = Date.now();

        if (hostMap.size > 0) {
            console.log(`[app-mode] Host map refreshed: ${hostMap.size} host(s) mapped`);
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[app-mode] Failed to fetch host mappings: ${msg}`);
        // Keep stale data if we have it, otherwise hostMap stays empty (-> full mode)
    }
}

function isFresh(): boolean {
    return lastFetched > 0 && (Date.now() - lastFetched) < CACHE_TTL;
}

async function ensureFresh(): Promise<void> {
    if (isFresh()) return;

    // Stale-while-revalidate: if we have data, serve it and refresh in background
    if (lastFetched > 0) {
        if (!refreshPromise) {
            refreshPromise = doRefresh().finally(() => {
                refreshPromise = null;
            });
        }
        return; // Always serve stale when we have data
    }

    // First load: must await
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    await refreshPromise;
}

/**
 * Resolve app mode for a given hostname.
 * Returns 'citizen' or 'full'.
 */
export async function resolveAppMode(hostname: string): Promise<AppMode> {
    await ensureFresh();
    return hostMap.get(hostname.toLowerCase()) ?? 'full';
}

/**
 * Pre-warm the host map cache. Call from a server plugin on startup.
 */
export async function warmupAppModeCache(): Promise<void> {
    try {
        await doRefresh();
    } catch {
        console.warn('[app-mode] Warmup failed, will retry on first request');
    }
}
