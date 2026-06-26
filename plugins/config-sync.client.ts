/**
 * Cross-tab localStorage sync for config caches
 *
 * Fixes #11: localStorage changes don't sync across tabs
 *
 * When config or boundary caches are cleared in one tab (e.g., during logout),
 * this plugin detects the change via the 'storage' event and clears the
 * in-memory config state to ensure consistency.
 */
export default defineNuxtPlugin(() => {
    // Only run on client
    if (import.meta.server) return;

    const { clearCache } = useMarkASpotConfig();

    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', (event) => {
        // Only react to Mark-a-Spot cache changes
        if (!event.key?.startsWith('markASpot')) return;

        // If a cache key was removed (cleared), refresh our config state
        if (event.oldValue && !event.newValue) {
            console.log(`[ConfigSync] Cache cleared in another tab: ${event.key}`);
            clearCache();
        }
    });
});
