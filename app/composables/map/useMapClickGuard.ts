/**
 * Map Click Guard Composable
 *
 * Prevents race conditions between layer-specific click handlers
 * (markers, spiderfy leaves) and the general map click handler.
 *
 * Layer-specific handlers call markClickHandled() immediately,
 * and handleMapClick checks isClickHandled() to skip processing.
 *
 * State lives in a single shared instance so all callers (useMap,
 * useSpiderfy, Map.vue) coordinate on the same flag. The instance is
 * created lazily on the first client-side composable call; on SSR
 * all functions are no-ops / return false so no state leaks across
 * server-rendered requests.
 */
import type { Ref } from 'vue';

// Shared instance — created once on the client, reused across all
// useMapClickGuard() calls. null until the first client-side call.
let sharedClickHandled: Ref<boolean> | null = null;
let sharedTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

const getSharedState = () => {
    if (!sharedClickHandled) {
        sharedClickHandled = ref(false);
    }
    return sharedClickHandled;
};

export function useMapClickGuard() {
    const markClickHandled = () => {
        // SSR GUARD: Only run timeouts on client
        if (import.meta.server) return;

        const clickHandled = getSharedState();
        clickHandled.value = true;
        // Auto-reset after a short delay to prevent future clicks from being blocked
        if (sharedTimeoutHandle) {
            globalThis.clearTimeout(sharedTimeoutHandle);
        }
        sharedTimeoutHandle = globalThis.setTimeout(() => {
            clickHandled.value = false;
            sharedTimeoutHandle = null;
        }, 50);
    };

    const isClickHandled = (): boolean => {
        if (import.meta.server) return false;
        return getSharedState().value;
    };

    const cleanup = () => {
        if (sharedTimeoutHandle) {
            globalThis.clearTimeout(sharedTimeoutHandle);
            sharedTimeoutHandle = null;
        }
        if (sharedClickHandled) {
            sharedClickHandled.value = false;
        }
    };

    return {
        markClickHandled,
        isClickHandled,
        cleanup
    };
}
