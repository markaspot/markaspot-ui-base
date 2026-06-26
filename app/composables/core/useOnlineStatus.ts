/**
 * Composable for reactive online/offline status
 *
 * Provides SSR-safe detection of network connectivity using Navigator API.
 * Uses useState for shared state across components (SSR-compatible).
 *
 * NOTE: This is a BASE APP utility - not pro-only.
 * The MIT version needs to know online status for basic UX.
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/68
 *
 * @example
 * ```vue
 * <script setup>
 * const { isOnline, isOffline, lastOnlineAt } = useOnlineStatus()
 *
 * watch(isOnline, (online) => {
 *   if (online) {
 *     // Trigger sync
 *   }
 * })
 * </script>
 * ```
 */

// Singleton pattern: Ensure listeners are only registered once globally
let listenersInitialized = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Reactive online/offline status composable
 *
 * Uses singleton pattern to ensure event listeners are only registered once,
 * even when called outside Vue component setup contexts (e.g., from MapLibre).
 * This prevents memory leaks while maintaining shared state across the app.
 *
 * @returns Object with reactive online status and last online timestamp
 */
export function useOnlineStatus() {
    // Use useState for SSR-safe shared state (not ref!)
    // Default to true on server-side (assume online)
    const isOnline = useState<boolean>('network:online', () => true);
    const lastOnlineAt = useState<number>('network:lastOnline', () => Date.now());

    // Client-only initialization
    if (import.meta.client && !listenersInitialized) {
        listenersInitialized = true;

        // Set initial state from Navigator
        isOnline.value = navigator.onLine;
        if (isOnline.value) {
            lastOnlineAt.value = Date.now();
        }

        // Debounced update function to prevent flicker on unstable connections
        const updateOnlineStatus = () => {
            // Clear any pending debounce
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            // Debounce by 300ms to prevent rapid toggling
            debounceTimer = setTimeout(() => {
                const newStatus = navigator.onLine;

                if (newStatus !== isOnline.value) {
                    isOnline.value = newStatus;

                    if (newStatus) {
                        lastOnlineAt.value = Date.now();
                    }
                }

                debounceTimer = null;
            }, 300);
        };

        // Register event listeners (once, globally)
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Cleanup on scope disposal (only if called from component setup)
        // This handles component-level cleanup gracefully, but listeners
        // persist globally for non-component callers (intended behavior).
        if (getCurrentScope()) {
            onScopeDispose(() => {
                // Note: We DON'T remove window listeners here because:
                // 1. useState is app-global, so listeners should be too
                // 2. Multiple components may use this composable
                // 3. Non-component contexts (MapLibre) need persistent listeners
                //
                // Only clear the debounce timer to prevent stale updates
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                }
            });
        }
    }

    // Computed for convenience
    const isOffline = computed(() => !isOnline.value);

    /**
     * Time elapsed since last online (in milliseconds)
     * Returns 0 if currently online
     */
    const offlineDuration = computed(() => {
        if (isOnline.value) return 0;
        return Date.now() - lastOnlineAt.value;
    });

    /**
     * Format offline duration as human-readable string
     */
    const offlineDurationText = computed(() => {
        const ms = offlineDuration.value;
        if (ms === 0) return '';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        if (minutes > 0) {
            return `${minutes}m`;
        }
        return `${seconds}s`;
    });

    return {
        /** Whether the device is currently online */
        isOnline: readonly(isOnline),
        /** Whether the device is currently offline */
        isOffline,
        /** Timestamp of when the device was last online */
        lastOnlineAt: readonly(lastOnlineAt),
        /** Duration offline in milliseconds (0 if online) */
        offlineDuration,
        /** Human-readable offline duration */
        offlineDurationText
    };
}
