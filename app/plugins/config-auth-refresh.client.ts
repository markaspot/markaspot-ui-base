/**
 * Config Auth Refresh Plugin (Client-Only)
 *
 * Re-fetches Mark-a-Spot configuration for authenticated users.
 * SSR requests don't include session cookies, so the backend can't detect
 * the user's jurisdiction during SSR. This plugin fixes that by re-fetching
 * the config on the client where cookies are available.
 */
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';

export default defineNuxtPlugin({
    name: 'config-auth-refresh',
    // Explicit ordering: auth.client must have populated `auth_user` state
    // before we can decide whether to refetch the config.
    dependsOn: ['auth'],
    setup(nuxtApp) {
        // Use app:mounted hook to ensure auth state is ready
        nuxtApp.hook('app:mounted', async () => {
            const { fetchConfig, config } = useMarkASpotConfig();
            const authUser = useState<{ uid?: string } | null>('auth_user');

            // Log initial state
            if (import.meta.dev) {
                console.log('[MasConfig Auth Refresh] app:mounted check:', {
                    authUserId: authUser.value?.uid,
                    jurisdictionId: config.value?.jurisdiction?.id,
                    hasConfig: !!config.value
                });
            }

            // SSR fetches the config without session cookies, so the backend can't
            // see the user's role. For any authenticated client, re-fetch once so
            // admin-tier fields (boilerplates, status definitions, etc.) hydrate
            // even when the SSR response already carries a jurisdiction.id from
            // the URL slug. app:mounted fires once → no refresh loop.
            const userIsAuthenticated = !!authUser.value?.uid;

            if (userIsAuthenticated) {
                if (import.meta.dev) {
                    console.log('[MasConfig Auth Refresh] Re-fetching config for authenticated user (uid:', authUser.value?.uid, ')');
                }
                try {
                    await fetchConfig(true); // force refresh
                    if (import.meta.dev) {
                        console.log('[MasConfig Auth Refresh] Config re-fetched, jurisdiction:', config.value?.jurisdiction);
                    }
                } catch (err) {
                    console.error('[MasConfig Auth Refresh] Error re-fetching config:', err);
                }
            } else if (import.meta.dev) {
                console.log('[MasConfig Auth Refresh] Skipped: not authenticated');
            }
        });
    }
});
