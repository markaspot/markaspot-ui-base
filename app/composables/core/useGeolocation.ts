/**
 * useGeolocation Composable
 *
 * Centralized geolocation management with:
 * - Singleton pattern to prevent multiple simultaneous requests
 * - Toast deduplication to prevent spam
 * - Shared state across all components
 */

import { ref, readonly } from 'vue';

export interface GeolocationCoords {
    lat: number
    lng: number
    /**
     * Browser-reported 1-sigma accuracy in meters (from
     * `GeolocationPosition.coords.accuracy`). May be undefined when the
     * browser omits it.
     */
    accuracy?: number
}

// Singleton state - shared across all component instances
const isLocating = ref(false);
const lastError = ref<GeolocationPositionError | null>(null);
const lastPosition = ref<GeolocationCoords | null>(null);
const lastToastTime = ref(0);

// Minimum time between error toasts (in ms)
const TOAST_DEBOUNCE_MS = 10000;

// Current request promise - to deduplicate concurrent calls
let currentRequest: Promise<GeolocationCoords> | null = null;

export function useGeolocation() {
    const { t } = useI18n();
    const toast = useToast();

    /**
     * Show a toast for geolocation error, but only if we haven't shown one recently
     */
    const showErrorToast = (error: GeolocationPositionError) => {
        const now = Date.now();

        // Debounce: don't show toast if we showed one recently
        if (now - lastToastTime.value < TOAST_DEBOUNCE_MS) {
            if (import.meta.dev) {
                console.log('[useGeolocation] Toast suppressed (debounce)', {
                    timeSinceLastToast: now - lastToastTime.value,
                    errorCode: error.code
                });
            }
            return;
        }

        lastToastTime.value = now;

        // Map error codes to i18n keys
        let errorKey = 'errors.geolocation.unknown';
        if (error.code === 1) {
            errorKey = 'errors.geolocation.permission_denied';
        } else if (error.code === 2) {
            errorKey = 'errors.geolocation.unavailable';
        } else if (error.code === 3) {
            errorKey = 'errors.geolocation.timeout';
        }

        toast.add({
            title: t('errors.geolocation.title'),
            description: t(errorKey),
            color: 'warning',
            icon: 'i-heroicons-exclamation-triangle',
            duration: 6000
        });
    };

    /**
     * Get current position with deduplication.
     * If a request is already in progress, returns the same promise.
     *
     * @param options Standard browser PositionOptions (timeout, maximumAge, ...).
     * @param opts.silent When true, suppress the error toast on failure. Use for
     *   soft background fallbacks (e.g. device-location fallback when a photo has
     *   no EXIF geotag) where a denied/unavailable location is not a user error.
     */
    const getCurrentPosition = async (
        options?: PositionOptions,
        opts?: { silent?: boolean }
    ): Promise<GeolocationCoords> => {
        // Check if geolocation is available
        if (!navigator.geolocation) {
            const error = new Error('Geolocation not supported') as any;
            error.code = 2;
            error.message = 'Geolocation not supported';
            throw error;
        }

        // If already locating, return the existing promise.
        // NOTE: the in-flight request was started with the first caller's options;
        // any divergent options from this caller are silently ignored for the
        // duration of this call. Log a dev warning so option mismatches surface
        // during development.
        if (currentRequest && isLocating.value) {
            if (import.meta.dev) {
                console.log('[useGeolocation] Reusing existing in-flight request (caller options ignored):', options);
            }
            return currentRequest;
        }

        isLocating.value = true;
        lastError.value = null;

        currentRequest = new Promise<GeolocationCoords>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords: GeolocationCoords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        ...(Number.isFinite(position.coords.accuracy)
                            ? { accuracy: position.coords.accuracy }
                            : {})
                    };
                    lastPosition.value = coords;
                    isLocating.value = false;
                    currentRequest = null;
                    resolve(coords);
                },
                (error) => {
                    if (import.meta.dev) {
                        console.error('[useGeolocation] Error:', error.code, error.message);
                    }
                    lastError.value = error;
                    isLocating.value = false;
                    currentRequest = null;

                    // Show toast with deduplication, unless the caller opted out
                    // (silent soft-fallback callers handle the miss themselves).
                    if (!opts?.silent) {
                        showErrorToast(error);
                    }

                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: options?.timeout ?? 15000,
                    maximumAge: options?.maximumAge ?? 0,
                    ...options
                }
            );
        });

        return currentRequest;
    };

    /**
     * Reset the toast debounce timer (useful for new user interactions)
     */
    const resetToastDebounce = () => {
        lastToastTime.value = 0;
    };

    return {
        // State (readonly to prevent external mutations)
        isLocating: readonly(isLocating),
        lastError: readonly(lastError),
        lastPosition: readonly(lastPosition),

        // Methods
        getCurrentPosition,
        resetToastDebounce
    };
}
