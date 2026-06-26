/**
 * useTileFallback
 *
 * Decides WHEN to fall back to an alternate basemap style, based on MapLibre's
 * native tile-load `error` events. This is the resilience path for "the tile CDN
 * is down" — without it a citizen sees a blank map.
 *
 * Pure decision logic (no MapLibre/map dependency) so it is unit-testable: the
 * caller injects how to read the configured fallback style and how to apply it
 * (the actual setStyle + layer rebuild lives in the map component). The error
 * path is hard to smoke in a browser, so the unit test is the safety net.
 */

/** Minimal shape of a MapLibre tile-load error event we care about. */
export interface TileErrorLike {
    /** Present (with a tileID) on tile-load failures; absent on other map errors. */
    tile?: unknown
    /** The source whose tile failed. */
    sourceId?: string
}

export interface TileFallbackOptions {
    /**
     * Number of failed tiles tolerated before switching. A handful of transient
     * failures are normal; sustained failure means the CDN is down. Default 6.
     */
    threshold?: number
    /**
     * Returns the configured fallback style URL, or undefined when no fallback is
     * configured for this tenant (in which case we never switch — a no-op).
     */
    getFallbackStyle: () => string | undefined
    /** Performs the actual style switch + layer rebuild. Called at most once. */
    applyFallback: (fallbackStyle: string) => void
}

export function useTileFallback(options: TileFallbackOptions) {
    const threshold = options.threshold ?? 6;
    let failureCount = 0;
    let applied = false;

    /**
     * Feed a map 'error' event in. Returns true when the event was a tile-load
     * failure (so the caller can stop further handling), false otherwise.
     * Triggers the fallback exactly once when sustained failures cross the
     * threshold AND a fallback style is configured.
     */
    const handleError = (event: TileErrorLike): boolean => {
        if (!(event.tile && event.sourceId)) return false;

        failureCount += 1;
        if (!applied && failureCount >= threshold) {
            const fallbackStyle = options.getFallbackStyle();
            if (fallbackStyle) {
                applied = true;
                options.applyFallback(fallbackStyle);
            }
        }
        return true;
    };

    /** Reset counters (e.g. after a deliberate style change succeeds). */
    const reset = () => {
        failureCount = 0;
        applied = false;
    };

    return {
        handleError,
        reset,
        getFailureCount: () => failureCount,
        hasAppliedFallback: () => applied
    };
}
