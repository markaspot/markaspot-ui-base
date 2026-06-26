import { defineEventHandler, getQuery } from 'h3';
import { Agent } from 'https';
import { Agent as UndiciAgent } from 'undici';

/**
 * Jurisdictions API Endpoint
 *
 * Returns all available jurisdictions for URL routing.
 * Public endpoint - no authentication required.
 *
 * Caches the response in-memory with stale-while-revalidate:
 * - Serves cached data immediately (no Drupal roundtrip on every SSR request)
 * - Refreshes in background after TTL expires
 * - First request after startup awaits Drupal response
 *
 * Response format:
 * {
 *   jurisdictions: [
 *     { id: 1, name: 'Stadt Köln', slug: 'stadt-koeln', isDefault: true },
 *     { id: 2, name: 'Stadt Bonn', slug: 'stadt-bonn', isDefault: false }
 *   ],
 *   count: 2,
 *   hasMultiple: true
 * }
 */

export interface Jurisdiction {
  id: number;
  uuid: string;
  name: string;
  slug: string | null;
  isDefault: boolean;
  parentId: number | null;
}

export interface JurisdictionsResponse {
  jurisdictions: Jurisdiction[];
  count: number;
  hasMultiple: boolean;
  error?: string;
}

// In-memory cache with stale-while-revalidate
let cached: JurisdictionsResponse | null = null;
let lastFetched = 0;
let refreshPromise: Promise<void> | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchFromDrupal(): Promise<JurisdictionsResponse> {
  const config = useRuntimeConfig();
  const apiBase = config.public.geoReportApiBase || config.public.apiBase;
  const baseUrl = String(apiBase).replace(/\/+$/, '');
  const url = `${baseUrl}/api/jurisdictions`;

  // Mirror the [...path].ts proxy TLS handling: Node's native fetch is
  // undici, which silently IGNORES the legacy `agent` option — only the
  // undici `dispatcher` actually applies rejectUnauthorized. With just the
  // agent option this route failed against DDEV's mkcert certificate
  // (UNABLE_TO_VERIFY_LEAF_SIGNATURE) and served an empty fetch_error
  // payload, which the client cached — slug-routed dashboards then never
  // resolved their jurisdiction and never loaded the request list.
  // Default matches the proxy: secure (true) unless explicitly disabled.
  const rejectUnauthorized = (config.proxy?.rejectUnauthorized as boolean) ?? true;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Forwarded-Proto': 'https',
    },
    signal: AbortSignal.timeout(5000),
    // @ts-ignore - Node.js specific options
    agent: new Agent({ rejectUnauthorized }),
    // @ts-ignore - undici dispatcher (the option native fetch honors)
    dispatcher: new UndiciAgent({ connect: { rejectUnauthorized } }),
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.jurisdictions || !Array.isArray(data.jurisdictions)) {
    throw new Error('Invalid response structure');
  }

  return {
    jurisdictions: data.jurisdictions,
    count: data.count || data.jurisdictions.length,
    hasMultiple: data.hasMultiple ?? data.jurisdictions.length > 1,
  };
}

async function doRefresh(): Promise<void> {
  try {
    cached = await fetchFromDrupal();
    lastFetched = Date.now();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[jurisdictions] Refresh failed: ${msg}`);
    // Keep stale data if available
  }
}

export default defineEventHandler(async (event): Promise<JurisdictionsResponse> => {
  const query = getQuery(event);
  const forceRefresh = query.refresh === 'true' || query.refresh === '1';

  const now = Date.now();
  const isFresh = lastFetched > 0 && (now - lastFetched) < CACHE_TTL;

  // Fresh cache: serve immediately (unless force refresh requested)
  if (isFresh && cached && !forceRefresh) {
    return cached;
  }

  // Stale cache: serve stale, refresh in background
  // When force-refreshing, await the refresh to return fresh data
  if (cached && lastFetched > 0) {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    if (forceRefresh) {
      await refreshPromise;
      return cached!;
    }
    return cached;
  }

  // No cache (first request): must await
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;

  if (cached) {
    return cached;
  }

  // Complete failure
  console.error('[jurisdictions] No data available after fetch attempt');
  return { jurisdictions: [], count: 0, hasMultiple: false, error: 'fetch_error' };
});
