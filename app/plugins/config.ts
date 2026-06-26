/**
 * Config Loading Plugin (Fallback)
 *
 * This plugin serves as a FALLBACK for config loading.
 * The 01.jurisdiction-ssr.ts plugin runs first and preloads the config during SSR.
 *
 * This plugin only fetches if:
 * - SSR plugin failed to load config
 * - Client-side navigation without SSR payload
 * - Error occurred during SSR preload
 *
 * Note: For authenticated users, config-auth-refresh.client.ts handles
 * re-fetching with session cookies (SSR can't forward cookies).
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/63
 */
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import {
    isFastmapMarketingPath,
    stripFastmapLocalePrefix
} from '../../fastmap-layer/lib/locale-routing';

export default defineNuxtPlugin({
    name: 'mas-config',
    enforce: 'pre', // Run before other plugins (but after 01.jurisdiction-ssr.ts)

    async setup() {
        // Skip for FastMap marketing pages (no Drupal backend needed)
        const route = useRoute();
        const strippedPath = stripFastmapLocalePrefix(route.path);
        if (isFastmapMarketingPath(strippedPath) || isFastmapMarketingPath(route.path)) {
            return;
        }

        const { fetchConfig, isReady, error } = useMarkASpotConfig();

        // Skip if already loaded by 01.jurisdiction-ssr.ts
        if (isReady.value) {
            console.log('[MasConfig Plugin] Skipping - config already loaded by SSR plugin');
            return;
        }

        console.log('[MasConfig Plugin] Fetching config (SSR plugin did not load it)');

        try {
            // Fetch config - will be included in SSR payload automatically
            await fetchConfig();

            if (error.value) {
                console.warn('[MasConfig Plugin] Failed to load config:', error.value);
            }
        } catch (err) {
            console.error('[MasConfig Plugin] Error during config fetch:', err);
        }
    }
});
