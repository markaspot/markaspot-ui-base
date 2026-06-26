// plugins/pwa-update.client.ts

/**
 * Pwa-update.client Plugin
 *
 * Plugin for pwa update.client functionality.
 *
 * Nuxt plugin for application-wide functionality.
 */

export default defineNuxtPlugin((nuxtApp) => {
    if (import.meta.client && 'serviceWorker' in navigator) {
        let refreshing = false;

        // Handle service worker updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });

        // Optional: skip automatic unregister to avoid unintended controllerchange reloads
        // navigator.serviceWorker.getRegistrations().then(registrations => {
        //   for (const registration of registrations) {
        //     registration.unregister().then(success => {
        //       console.log('Service worker unregistered successfully:', success);
        //     });
        //   }
        // }).catch(error => {
        //   console.error('Service worker unregister failed:', error);
        // });

        // Do not intercept `beforeinstallprompt` here.
        // A dedicated PWAInstallPrompt component handles the event lifecycle
        // and calls `prompt()` in response to a user gesture to avoid console warnings.
    }
});
