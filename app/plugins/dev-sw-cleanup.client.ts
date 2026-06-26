/**
 * Development Service Worker Cleanup Plugin
 *
 * Automatically unregisters service workers and clears caches in development
 * to prevent stale cache issues with HMR and hash mismatches.
 *
 * Problem: When devOptions.enabled is false in PWA config, old service workers
 * from previous production builds remain registered and cause 404 errors
 * for _nuxt/*.js files because the hashes don't match after rebuilds.
 */
export default defineNuxtPlugin({
    name: 'dev-sw-cleanup',
    enforce: 'pre',
    setup() {
        if (!import.meta.dev) return;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                if (registrations.length === 0) return;

                for (const registration of registrations) {
                    registration.unregister().then((success) => {
                        if (success) {
                            console.debug('[Dev SW Cleanup] Unregistered:', registration.scope);
                        }
                    });
                }
            }).catch((error) => {
                console.warn('[Dev SW Cleanup] Failed to get registrations:', error);
            });

            if ('caches' in window) {
                caches.keys().then((names) => {
                    if (names.length === 0) return;

                    for (const name of names) {
                        caches.delete(name).then((success) => {
                            if (success) {
                                console.debug('[Dev SW Cleanup] Deleted cache:', name);
                            }
                        });
                    }
                }).catch((error) => {
                    console.warn('[Dev SW Cleanup] Failed to clear caches:', error);
                });
            }
        }
    }
});
