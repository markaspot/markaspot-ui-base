import { getQuery } from 'h3';
import { useRuntimeConfig } from '#imports';
import type { EmergencyStatusResponse } from '../../types/proxy';

// Neutral fail-open sentinel: backend is down, treat as inactive.
const FAIL_OPEN: EmergencyStatusResponse = { emergency_mode: null };

export default defineCachedEventHandler(
    async (event) => {
        const config = useRuntimeConfig();
        const apiBase = config.public.apiBase as string;

        // No per-IP rate limit here: this handler is wrapped in a 20s SWR
        // cache (defineCachedEventHandler below), so Drupal sees at most ~3
        // upstream requests per minute per jurisdiction regardless of how many
        // clients poll. A per-IP limit on a cached handler would use a shared
        // cache key, which could cause one IP's limit to prevent all tenants
        // from getting a fresh response (cache poisoning). Monitoring of
        // upstream call frequency happens at the Drupal layer.

        // Forward jurisdiction_id so Drupal can scope available_categories
        // per tenant. Without this, multi-tenant installs see all categories.
        // Validate to digits-only to prevent key-flooding (cache keys include
        // this value; an arbitrary string would let a caller pollute the cache
        // store with unbounded unique keys).
        const query = getQuery(event);
        const rawJurisdictionId = query.jurisdiction_id as string | undefined;
        const jurisdictionId = rawJurisdictionId && /^\d+$/.test(rawJurisdictionId)
            ? rawJurisdictionId
            : undefined;
        const upstreamUrl = jurisdictionId
            ? `${apiBase}/api/emergency-mode/status?jurisdiction_id=${encodeURIComponent(jurisdictionId)}`
            : `${apiBase}/api/emergency-mode/status`;

        try {
            const data = await $fetch<EmergencyStatusResponse>(upstreamUrl, {
                headers: {
                    'User-Agent': 'Nuxt-Emergency-Banner'
                }
            });

            return data;
        } catch (error: unknown) {
            // Fail-open: backend down during an emergency must not break routing.
            // Log for monitoring, but return 200 with null flag.
            console.error('[emergency-mode/status] backend unreachable:', error instanceof Error ? error.message : String(error));
            return FAIL_OPEN;
        }
    },
    {
        // 20s max-age with SWR: cached responses are stale-served while a
        // background revalidation runs. This means at most 20s lag between a
        // backend state change and the Nuxt cache refreshing, but navigation
        // never blocks on a cold Drupal request per visitor.
        maxAge: 20,
        swr: true,
        staleMaxAge: 60,
        // Include jurisdiction_id in the cache key so different tenants on the
        // same Nuxt process don't share emergency status. Only digits-only
        // values are accepted to prevent cache key flooding.
        getKey: (event) => {
            const query = getQuery(event);
            const raw = (query.jurisdiction_id as string) || '';
            const jid = /^\d+$/.test(raw) ? raw : '';
            return `emergency-status:${jid}`;
        }
    }
);
