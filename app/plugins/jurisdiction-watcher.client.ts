/**
 * Jurisdiction Watcher Plugin (Client-Only)
 *
 * Watches for jurisdiction changes (via URL slug or query parameter) and
 * clears all jurisdiction-dependent stores when switching:
 * - Config (theme, features, map settings)
 * - Requests store (service requests from GeoReport API)
 * - Cache store (bounds-based request cache)
 * - Categories and statuses are cleared by their own watchers
 *
 * Handles both URL patterns:
 * - Slug-based: /rotterdam/dashboard -> /noord/dashboard (production)
 * - Query-based: /?jurisdiction=14 -> /?jurisdiction=15 (development)
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/63
 */
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import { useRequestsStore } from '~/stores/requests';
import { useCacheStore } from '~/stores/cache';

export default defineNuxtPlugin({
    name: 'mas-jurisdiction-watcher',
    enforce: 'post', // Run after config and theme plugins
    dependsOn: ['mas-config', 'mas-theme-injection'],

    setup(nuxtApp) {
        const route = useRoute();
        const { fetchConfig, config, theme } = useMarkASpotConfig();
        const ssrJurisdictionKey = useState<string>('mas-config-jurisdiction-key', () => '');

        // Track current jurisdiction from both slug (route params) and query params
        const currentJurisdiction = computed(() => {
            // Query param takes priority (explicit switch, used in dev)
            const qJurisdiction = route.query.jurisdiction;
            if (qJurisdiction) return String(qJurisdiction);

            // Route param from [[jurisdiction]] slug (production URL pattern)
            const paramJurisdiction = route.params.jurisdiction;
            if (paramJurisdiction) return String(paramJurisdiction);

            // Use SSR-resolved key instead of build-baked runtimeConfig value
            return ssrJurisdictionKey.value || '';
        });

        // Store initial jurisdiction to detect changes
        let lastJurisdiction = currentJurisdiction.value;

        console.log(`[JurisdictionWatcher] Initialized. Current jurisdiction: ${lastJurisdiction}`);

        // Watch for jurisdiction changes
        watch(
            currentJurisdiction,
            async (newJurisdiction) => {
                if (newJurisdiction !== lastJurisdiction) {
                    console.log(`[JurisdictionWatcher] Jurisdiction changed: ${lastJurisdiction} → ${newJurisdiction}`);
                    lastJurisdiction = newJurisdiction;

                    // Clear requests and cache stores (contain jurisdiction-specific data)
                    try {
                        const requestsStore = useRequestsStore();
                        const cacheStore = useCacheStore();
                        const savedBounds = requestsStore.currentBounds;

                        cacheStore.clearCache();
                        requestsStore.clearStore();

                        // Force refetch config from backend
                        await fetchConfig(true);

                        // Refetch requests with new jurisdiction if we had bounds
                        if (savedBounds) {
                            await nextTick();
                            await requestsStore.fetchRequests(savedBounds);
                        }
                    } catch (e) {
                        // Stores might not be initialized yet
                        await fetchConfig(true);
                    }

                    console.log(`[JurisdictionWatcher] Config refetched. New theme:`, theme.value);
                }
            },
            { immediate: false } // Don't trigger on initial load
        );
    }
});
