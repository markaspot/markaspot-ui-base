import type { GeocodingResult } from '~/plugins/geocoding/providers/types';

export function useGeocoding() {
    const nuxtApp = useNuxtApp();
    const { boundaryBbox, fetchBoundary } = useMarkASpotSettings();

    // Get the geocoding service from the plugin (with automatic fallback support)
    const $geocoding = nuxtApp.$geocoding;

    // Fallback no-op functions if geocoding plugin is not available
    const noopSearch = async (_q: string): Promise<GeocodingResult[]> => [];
    const noopReverse = async (lat: number, lng: number): Promise<GeocodingResult> => ({ lat, lng, displayName: '', address: {} });
    // Method names match the live plugin shape (search/reverse) to prevent future drift
    const noopProvider = { name: 'none', search: noopSearch, reverse: noopReverse };

    // Track errors and add retry capability
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    /**
   * Enhanced search function with retry and error handling
   */
    const search = async (query: string, options?: any): Promise<GeocodingResult[]> => {
        if (!query?.trim()) return [];

        isLoading.value = true;
        error.value = null;

        try {
            await fetchBoundary();
            const scopedOptions = {
                ...(options || {}),
                ...(boundaryBbox.value ? { bbox: boundaryBbox.value } : {})
            };

            // Add a 5-second timeout for all geocoding requests.
            // Capture the handle so it can be cleared once the race settles,
            // preventing timer and closure accumulation under rapid autocomplete.
            let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutHandle = setTimeout(() => reject(new Error('Geocoding request timed out')), 5000);
            });

            // Use the plugin's search function which includes automatic fallback
            const searchFn = $geocoding?.search || noopSearch;
            let results: GeocodingResult[];
            try {
                results = await Promise.race([
                    searchFn(query, scopedOptions),
                    timeoutPromise
                ]);
            } finally {
                clearTimeout(timeoutHandle);
            }

            // Plugin guarantees array return - deduplicate results based on displayName
            const seen = new Set<string>();
            const deduplicatedResults = results.filter((result: GeocodingResult) => {
                const key = result.displayName;
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });

            return deduplicatedResults;
        } catch (err: unknown) {
            console.error('Geocoding search error:', err instanceof Error ? err.message : String(err));
            error.value = err instanceof Error ? err.message : String(err);

            // Return empty results instead of throwing
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    /**
   * Enhanced reverse geocoding with retry and error handling
   */
    const reverse = async (lat: number, lng: number): Promise<GeocodingResult> => {
        if (typeof lat !== 'number' || typeof lng !== 'number' ||
          isNaN(lat) || isNaN(lng)) {
            throw new Error('Invalid coordinates');
        }

        isLoading.value = true;
        error.value = null;

        try {
            // Add a 5-second timeout for all geocoding requests.
            // Capture the handle so it is cleared once the race settles.
            let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutHandle = setTimeout(() => reject(new Error('Reverse geocoding request timed out')), 5000);
            });

            // Use the plugin's reverse function which includes automatic fallback
            const reverseFn = $geocoding?.reverse || noopReverse;
            let result: GeocodingResult;
            try {
                result = await Promise.race([
                    reverseFn(lat, lng),
                    timeoutPromise
                ]);
            } finally {
                clearTimeout(timeoutHandle);
            }

            return result;
        } catch (err: unknown) {
            console.error('Reverse geocoding error:', err instanceof Error ? err.message : String(err));
            error.value = err instanceof Error ? err.message : String(err);

            // For reverse geocoding, create a minimal fallback result
            return {
                lat,
                lng,
                displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                address: {}
            };
        } finally {
            isLoading.value = false;
        }
    };

    /**
   * Format coordinates as a string
   */
    const formatCoordinates = (lat: number, lng: number): string => {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    };

    /**
   * Format an address object into a readable string
   */
    const formatAddress = (address: GeocodingResult['address'] = {}): string => {
        const parts = [];

        if (address.street) {
            const street = [address.street];
            if (address.houseNumber) {
                street.push(address.houseNumber);
            }
            parts.push(street.join(' '));
        }

        if (address.city) {
            const cityParts = [];
            if (address.postcode) {
                cityParts.push(address.postcode);
            }
            cityParts.push(address.city);
            parts.push(cityParts.join(' '));
        } else if (address.state) {
            parts.push(address.state);
        }

        return parts.join(', ') || 'Unknown location';
    };

    return {
        search,
        reverse,
        formatCoordinates,
        formatAddress,
        isLoading,
        error,
        provider: $geocoding?.getProvider() || noopProvider
    };
}
