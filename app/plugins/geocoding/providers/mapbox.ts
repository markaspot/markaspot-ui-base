// plugins/geocoding/providers/mapbox.ts
import type { GeocodingOptions, GeocodingProvider, GeocodingResult } from './types';

/**
 * Mapbox Plugin
 *
 * Plugin for mapbox functionality.
 *
 * Nuxt plugin for application-wide functionality.
 */

const DEFAULT_MAPBOX_FORWARD_TYPES = 'address,place,poi,neighborhood';
const DEFAULT_MAPBOX_REVERSE_TYPES = 'address,place,poi,neighborhood';

export function createMapboxProvider(accessToken: string): GeocodingProvider {
    const formatDisplayName = (feature: any): string => {
        const parts = [];

        // Add street address with house number
        if (feature.text) {
            const streetParts = [feature.text];
            if (feature.address) {
                streetParts.push(feature.address);
            }
            parts.push(streetParts.join(' '));
        }

        // Add postcode and city from context
        // Priority: place (city) > locality (district/neighborhood)
        if (feature.context) {
            const postcodeCtx = feature.context.find((ctx: any) => ctx.id.startsWith('postcode.'));
            const placeCtx = feature.context.find((ctx: any) => ctx.id.startsWith('place.'));
            const localityCtx = feature.context.find((ctx: any) => ctx.id.startsWith('locality.'));
            // Prefer city (place) over district (locality)
            const cityCtx = placeCtx || localityCtx;

            if (postcodeCtx || cityCtx) {
                const cityParts = [];
                if (postcodeCtx) {
                    cityParts.push(postcodeCtx.text);
                }
                if (cityCtx) {
                    cityParts.push(cityCtx.text);
                }
                parts.push(cityParts.join(' '));
            }
        }

        return parts.join(', ') || feature.place_name;
    };

    return {
        name: 'mapbox',

        async geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> {
            const params = new URLSearchParams({
                access_token: accessToken,
                limit: (options?.limit || 5).toString(),
                autocomplete: String(options?.autocomplete ?? true),
                types: options?.types || DEFAULT_MAPBOX_FORWARD_TYPES
            });

            // Add language if provided
            if (options?.language) {
                params.append('language', options.language);
            }

            // Add country filter if provided
            if (options?.country) {
                params.append('country', options.country);
            }

            if (options?.bbox) {
                params.append('bbox', options.bbox);
            }

            // Add proximity filtering if centerPoint is provided
            if (options?.centerPoint) {
                params.append('proximity', `${options.centerPoint.lng},${options.centerPoint.lat}`);
            }

            // Add region or locality filtering if provided
            if (options?.region) {
                params.append('region', options.region);
            }

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
            );

            if (!response.ok) {
                throw new Error(`Mapbox geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.features.map((feature: any) => {
                const context = feature.context?.reduce((acc: any, item: any) => {
                    const id = item.id.split('.')[0];
                    acc[id] = item.text;
                    if (item.short_code) acc[`${id}_code`] = item.short_code;
                    return acc;
                }, {});

                // Extract district/neighborhood from context
                const neighborhoodCtx = feature.context?.find((ctx: any) =>
                    ctx.id.startsWith('neighborhood.') ||
                    ctx.id.startsWith('locality.') ||
                    ctx.id.startsWith('district.')
                );

                return {
                    lat: feature.center[1],
                    lng: feature.center[0],
                    displayName: formatDisplayName(feature),
                    address: {
                        street: feature.text,
                        houseNumber: feature.address || null,
                        housenumber: feature.address || null, // Add lowercase variant for compatibility
                        city: context?.place,
                        district: neighborhoodCtx?.text || context?.neighborhood || context?.locality,
                        state: context?.region,
                        country: context?.country,
                        countryCode: context?.country_code?.toUpperCase() || null,
                        postcode: context?.postcode
                    },
                    raw: feature
                };
            });
        },

        async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
            const params = new URLSearchParams({
                access_token: accessToken,
                types: DEFAULT_MAPBOX_REVERSE_TYPES
            });

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params}`
            );

            if (!response.ok) {
                throw new Error(`Mapbox reverse geocoding failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.features?.length) {
                throw new Error('No results found');
            }

            const feature = data.features[0];
            const context = feature.context?.reduce((acc: any, item: any) => {
                const id = item.id.split('.')[0];
                acc[id] = item.text;
                if (item.short_code) acc[`${id}_code`] = item.short_code;
                return acc;
            }, {});

            // Extract district/neighborhood from context
            const neighborhoodCtx = feature.context?.find((ctx: any) =>
                ctx.id.startsWith('neighborhood.') ||
                ctx.id.startsWith('locality.') ||
                ctx.id.startsWith('district.')
            );

            return {
                lat: feature.center[1],
                lng: feature.center[0],
                displayName: formatDisplayName(feature),
                address: {
                    street: feature.text,
                    houseNumber: feature.address || null,
                    housenumber: feature.address || null, // Add lowercase variant for compatibility
                    city: context?.place,
                    district: neighborhoodCtx?.text || context?.neighborhood || context?.locality,
                    state: context?.region,
                    country: context?.country,
                    countryCode: context?.country_code?.toUpperCase() || null,
                    postcode: context?.postcode
                },
                raw: feature
            };
        }
    };
}
