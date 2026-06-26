// plugins/geocoding/providers/photon.ts
import type { GeocodingProvider, GeocodingResult, GeocodingOptions } from './types';

/**
 * Photon Plugin
 *
 * Plugin for photon functionality.
 *
 * Nuxt plugin for application-wide functionality.
 */

export function createPhotonProvider(): GeocodingProvider {
    // Photon only supports: de, en, fr, it (and default/empty for international)
    const SUPPORTED_LANGUAGES = new Set(['de', 'en', 'fr', 'it']);

    const getPhotonLanguage = (lang?: string): string => {
        if (!lang) return 'de';
        // Map 2-letter codes to supported Photon languages
        const normalized = lang.substring(0, 2).toLowerCase();
        if (SUPPORTED_LANGUAGES.has(normalized)) return normalized;
        // Fallback: use 'default' (international names) for unsupported languages
        return 'default';
    };

    const formatDisplayName = (properties: any): string => {
        const parts = [];

        // For POIs or named places, show the name first
        if (properties.name && properties.type !== 'street') {
            parts.push(properties.name);
        }

        // Add street and house number
        if (properties.street) {
            const streetParts = [properties.street];
            if (properties.housenumber) {
                streetParts.push(properties.housenumber);
            }
            parts.push(streetParts.join(' '));
        } else if (properties.name && properties.type === 'street') {
            // For street-type results, use the name as the street
            parts.push(properties.name);
        }

        // Add postcode and city
        if (properties.city) {
            const cityParts = [];
            if (properties.postcode) {
                cityParts.push(properties.postcode);
            }
            cityParts.push(properties.city);
            parts.push(cityParts.join(' '));
        }

        // If we have parts, join them with comma, otherwise fallback to name
        return parts.length > 0 ? parts.join(', ') : (properties.name || '');
    };

    return {
        name: 'photon',

        async geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> {
            const photonLang = getPhotonLanguage(options?.language);
            const params = new URLSearchParams({
                q: query,
                limit: (options?.limit || 5).toString(),
                ...(photonLang !== 'default' ? { lang: photonLang } : {})
            });

            if (options?.bbox) {
                params.append('bbox', options.bbox);
            }

            if (options?.centerPoint) {
                params.append('lat', options.centerPoint.lat.toString());
                params.append('lon', options.centerPoint.lng.toString());
            }

            const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'CityServicePortal'
                }
            });

            if (!response.ok) {
                throw new Error(`Photon geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.features.map((feature: any) => ({
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0],
                displayName: formatDisplayName(feature.properties),
                address: {
                    street: feature.properties.street || (feature.properties.type === 'street' ? feature.properties.name : null),
                    houseNumber: feature.properties.housenumber || null,
                    postcode: feature.properties.postcode,
                    city: feature.properties.city,
                    district: feature.properties.suburb || feature.properties.neighbourhood || feature.properties.locality || feature.properties.district,
                    state: feature.properties.state,
                    country: feature.properties.country,
                    countryCode: feature.properties.countrycode?.toUpperCase() || null
                },
                raw: feature
            }));
        },

        async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
            if (typeof lat !== 'number' || typeof lng !== 'number' ||
              isNaN(lat) || isNaN(lng)) {
                throw new Error('Invalid coordinates provided');
            }

            const response = await fetch(
                `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'CityServicePortal'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Photon reverse geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.features?.length) {
                throw new Error('No results found');
            }

            const feature = data.features[0];
            return {
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0],
                displayName: formatDisplayName(feature.properties),
                address: {
                    street: feature.properties.street || (feature.properties.type === 'street' ? feature.properties.name : null),
                    houseNumber: feature.properties.housenumber || null,
                    postcode: feature.properties.postcode,
                    city: feature.properties.city,
                    district: feature.properties.suburb || feature.properties.neighbourhood || feature.properties.locality || feature.properties.district,
                    state: feature.properties.state,
                    country: feature.properties.country,
                    countryCode: feature.properties.countrycode?.toUpperCase() || null
                },
                raw: feature
            };
        }
    };
}
