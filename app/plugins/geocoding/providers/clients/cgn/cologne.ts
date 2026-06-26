// plugins/geocoding/providers/cologne.ts
import type { GeocodingProvider, GeocodingResult, GeocodingOptions } from '../../types';
import { GeocodingCoverageError } from '../../errors';

/**
 * Cologne Geoportal Provider
 *
 * Uses the local Cologne geocoder library (web/libraries/geocoder)
 * Provides geocoding services specific to Cologne, Germany.
 * More accurate than Photon/Nominatim for Cologne addresses.
 */

export function createCologneProvider(baseUrl?: string): GeocodingProvider {
    // Use Nuxt API proxy endpoint by default (avoids CORS issues)
    const geocoderBase = baseUrl || '/api/geocoder';

    const formatDisplayName = (result: any): string => {
        // Use the display_name from Cologne geocoder if available
        if (result.display_name) {
            return result.display_name;
        }

        // Fallback: build display name from address components
        const parts = [];
        const addr = result.address || {};

        // Add street and house number
        if (addr.road) {
            const streetParts = [addr.road];
            if (addr.house_number || addr.housenumber) {
                streetParts.push(addr.house_number || addr.housenumber);
            }
            parts.push(streetParts.join(' '));
        }

        // Add postcode and city
        if (addr.city) {
            const cityParts = [];
            if (addr.postcode) {
                cityParts.push(addr.postcode);
            }
            cityParts.push(addr.city);
            parts.push(cityParts.join(' '));
        }

        return parts.length > 0 ? parts.join(', ') : 'Unknown location';
    };

    const mapCologneResult = (result: any): GeocodingResult => {
        const address = result.address || {};

        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            displayName: formatDisplayName(result),
            address: {
                street: address.road || address.street,
                houseNumber: address.house_number || address.housenumber || null,
                housenumber: address.house_number || address.housenumber || null,
                postcode: address.postcode,
                city: address.city || address.town || address.village,
                district: address.suburb || address.neighbourhood || address.locality || address.district,
                state: address.state,
                country: address.country,
                countryCode: address.country_code?.toUpperCase() || null
            },
            raw: result
        };
    };

    return {
        name: 'cologne',

        async geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> {
            const params = new URLSearchParams({
                q: query
            });

            // Note: Cologne geocoder doesn't support all options, but we accept them for compatibility
            if (options?.limit) {
                // Cologne geocoder may not support limit, but we can slice results
            }

            try {
                const response = await fetch(`${geocoderBase}/search/?${params}`, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'CityServicePortal'
                    }
                });

                if (!response.ok) {
                    console.error('[Cologne Geocoder] HTTP error:', response.status, response.statusText);
                    throw new Error(`Cologne geocoding failed: ${response.statusText}`);
                }

                const data = await response.json();
                console.debug('[Cologne Geocoder] Search response:', data);

                // Handle different response formats:
                // - Array: direct array of results
                // - Object with numeric keys: {"2": {...}, "3": {...}} - convert to array
                // - Single object: wrap in array
                let results: any[];
                if (Array.isArray(data)) {
                    results = data;
                } else if (data && typeof data === 'object') {
                    // Check if it's an object with numeric keys (Cologne API format)
                    const values = Object.values(data);
                    if (values.length > 0 && values[0] && typeof values[0] === 'object' && 'lat' in values[0]) {
                        results = values;
                    } else if ('lat' in data) {
                        // Single result object
                        results = [data];
                    } else {
                        results = [];
                    }
                } else {
                    results = [];
                }

                // Map and limit results
                const mappedResults = results.map(mapCologneResult);
                return options?.limit ? mappedResults.slice(0, options.limit) : mappedResults;
            } catch (error) {
                console.error('Cologne geocoding error:', error);
                throw error;
            }
        },

        async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
            if (typeof lat !== 'number' || typeof lng !== 'number' ||
              isNaN(lat) || isNaN(lng)) {
                throw new Error('Invalid coordinates provided');
            }

            try {
                const params = new URLSearchParams({
                    lat: lat.toString(),
                    lon: lng.toString()
                });

                const response = await fetch(`${geocoderBase}/reverse/?${params}`, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'CityServicePortal'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Cologne reverse geocoding failed: ${response.statusText}`);
                }

                const data = await response.json();

                // Check if geocoder returned an error (expected for locations outside Cologne)
                if (data.error) {
                    throw new GeocodingCoverageError(data.error);
                }

                if (!data || !data.lat) {
                    throw new GeocodingCoverageError('No results found');
                }

                return mapCologneResult(data);
            } catch (error) {
                // Coverage errors are expected - re-throw without logging
                if (error instanceof GeocodingCoverageError) {
                    throw error;
                }

                // Unexpected errors should be logged
                console.error('Cologne reverse geocoding error:', error);
                throw error;
            }
        }
    };
}
