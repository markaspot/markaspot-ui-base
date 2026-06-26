// plugins/geocoding/providers/nominatim.ts

/**
 * Nominatim Plugin
 *
 * Plugin for nominatim functionality.
 *
 * Nuxt plugin for application-wide functionality.
 */

export function createNominatimProvider(endpoint: string): GeocodingProvider {
    const mapNominatimResult = (result: any): GeocodingResult => {
        const address = result.address || {};

        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            displayName: result.display_name,
            address: {
                street: address.road,
                houseNumber: address.house_number || null,
                housenumber: address.house_number || null, // Add lowercase variant for compatibility
                postcode: address.postcode,
                city: address.city || address.town || address.village,
                state: address.state,
                country: address.country,
                countryCode: address.country_code?.toUpperCase() || null
            },
            raw: result
        };
    };

    return {
        name: 'nominatim',

        async geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> {
            const params = new URLSearchParams({
                'q': query,
                'format': 'json',
                'addressdetails': '1',
                'limit': (options?.limit || 5).toString(),
                'accept-language': options?.language || 'de'
            });

            if (options?.bbox) {
                params.append('viewbox', options.bbox);
                params.append('bounded', '1');
            }

            // Add country code filter if provided (ISO 3166-1 alpha-2)
            if (options?.country) {
                params.append('countrycodes', options.country);
            }

            const response = await fetch(`${endpoint}/search?${params}`);
            if (!response.ok) {
                throw new Error(`Nominatim geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.map(mapNominatimResult);
        },

        async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
            const params = new URLSearchParams({
                'lat': lat.toString(),
                'lon': lng.toString(),
                'format': 'json',
                'accept-language': 'de'
            });

            const response = await fetch(`${endpoint}/reverse?${params}`);
            if (!response.ok) {
                throw new Error(`Nominatim reverse geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            return mapNominatimResult(data);
        }
    };
}
