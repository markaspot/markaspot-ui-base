/**
 * Plugin to invalidate locale-dependent cached state when locale changes.
 *
 * Clears:
 * - Status items (useState-based, contain translated labels)
 *
 * Requests and cache are handled by useAppBootstrap's locale watcher,
 * which preserves bounds and emits the 'requests-refreshed' event.
 * Categories/Districts have their own locale watchers in composables.
 */
import { watch } from 'vue';

export default defineNuxtPlugin((nuxtApp) => {
    const { $i18n } = nuxtApp as any;

    if (!$i18n) {
        if (import.meta.dev) console.warn('[locale-store-invalidation] $i18n not available');
        return;
    }

    let previousLocale = $i18n.locale.value;

    watch(() => $i18n.locale.value, (newLocale) => {
        if (newLocale === previousLocale) return;

        previousLocale = newLocale;

        // Clear status items (useState-based, translated labels)
        try {
            const statusItems = useState<any[]>('status_items');
            if (statusItems.value?.length > 0) {
                statusItems.value = [];
            }
        } catch {
            // Status state not ready - expected on first load
        }
    });
});
