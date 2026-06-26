/**
 * Geocoding Provider Tests
 *
 * Tests URL construction and response transformation for both Mapbox
 * and Photon geocoding providers. All functions are pure data transforms,
 * making them ideal unit test targets.
 *
 * @see server/api/providers/mapbox.ts
 * @see server/api/providers/photon.ts
 */
import { describe, it, expect, vi } from 'vitest';

import {
    createMapboxSearchUrl,
    createMapboxReverseUrl,
    transformMapboxSearchResults,
    transformMapboxReverseResult
} from '~/server/api/providers/mapbox';

import {
    createPhotonSearchUrl,
    createPhotonReverseUrl,
    transformPhotonSearchResults,
    transformPhotonReverseResult
} from '~/server/api/providers/photon';

import type {
    MapboxResponse,
    MapboxFeature,
    PhotonResponse,
    PhotonFeature
} from '~/server/types/proxy';

// Mock the logger to suppress output during tests
vi.mock('~/server/api/utils/logger', () => ({
    logGeocoding: vi.fn()
}));

// ============================================================================
// Helpers
// ============================================================================

function mapboxFeature(overrides: Partial<MapboxFeature> = {}): MapboxFeature {
    return {
        center: [6.9603, 50.9375], // [lng, lat] - Mapbox uses GeoJSON order
        text: 'Domplatz',
        address: '1',
        place_name: 'Domplatz 1, 50667 Cologne, Germany',
        place_type: ['address'],
        context: [
            { id: 'postcode.123', text: '50667' },
            { id: 'place.456', text: 'Cologne' },
            { id: 'region.789', text: 'North Rhine-Westphalia' },
            { id: 'country.012', text: 'Germany', short_code: 'de' }
        ],
        ...overrides
    };
}

function photonFeature(overrides: Partial<PhotonFeature> = {}): PhotonFeature {
    return {
        geometry: {
            coordinates: [6.9603, 50.9375] // [lng, lat]
        },
        properties: {
            name: undefined,
            street: 'Domplatz',
            housenumber: '1',
            city: 'Cologne',
            state: 'North Rhine-Westphalia',
            country: 'Germany',
            countrycode: 'de',
            postcode: '50667'
        },
        ...overrides
    };
}

// ============================================================================
// Mapbox URL Construction
// ============================================================================

describe('Mapbox URL construction', () => {
    describe('createMapboxSearchUrl', () => {
        it('creates URL with query and API key', () => {
            const url = createMapboxSearchUrl('Domplatz Cologne', 'pk.test123');
            expect(url.origin).toBe('https://api.mapbox.com');
            expect(url.pathname).toContain('Domplatz%20Cologne');
            expect(url.searchParams.get('access_token')).toBe('pk.test123');
        });

        it('URL-encodes special characters in query', () => {
            const url = createMapboxSearchUrl('Straße & Platz', 'pk.test');
            expect(url.pathname).toContain('Stra%C3%9Fe%20%26%20Platz');
        });

        it('applies default limit of 5', () => {
            const url = createMapboxSearchUrl('test', 'pk.key');
            expect(url.searchParams.get('limit')).toBe('5');
        });

        it('respects custom limit', () => {
            const url = createMapboxSearchUrl('test', 'pk.key', { limit: '10' });
            expect(url.searchParams.get('limit')).toBe('10');
        });

        it('caps custom limit at Mapbox maximum', () => {
            const url = createMapboxSearchUrl('test', 'pk.key', { limit: '99' });
            expect(url.searchParams.get('limit')).toBe('10');
        });

        it('applies default types', () => {
            const url = createMapboxSearchUrl('test', 'pk.key');
            expect(url.searchParams.get('types')).toBe('address,place,poi,neighborhood');
        });

        it('enables autocomplete by default', () => {
            const url = createMapboxSearchUrl('test', 'pk.key');
            expect(url.searchParams.get('autocomplete')).toBe('true');
        });

        it('defaults invalid autocomplete options instead of forwarding them', () => {
            const url = createMapboxSearchUrl('test', 'pk.key', { autocomplete: 'maybe' });
            expect(url.searchParams.get('autocomplete')).toBe('true');
        });

        it('passes through all options', () => {
            const url = createMapboxSearchUrl('test', 'pk.key', {
                language: 'de',
                bbox: '6.7,50.8,7.2,51.1',
                types: 'address',
                autocomplete: 'false',
                country: 'de'
            });
            expect(url.searchParams.get('language')).toBe('de');
            expect(url.searchParams.get('bbox')).toBe('6.7,50.8,7.2,51.1');
            expect(url.searchParams.get('types')).toBe('address');
            expect(url.searchParams.get('autocomplete')).toBe('false');
            expect(url.searchParams.get('country')).toBe('de');
        });

        it('ignores unsupported public types and falls back to defaults', () => {
            const url = createMapboxSearchUrl('test', 'pk.key', { types: 'address,venue,<script>' });
            expect(url.searchParams.get('types')).toBe('address');
        });

        it('ignores invalid bbox values', () => {
            const url = createMapboxSearchUrl('test', 'pk.key', { bbox: '999,50,7,51' });
            expect(url.searchParams.has('bbox')).toBe(false);
        });
    });

    describe('createMapboxReverseUrl', () => {
        it('creates URL with lng,lat in path (GeoJSON order)', () => {
            const url = createMapboxReverseUrl(50.9375, 6.9603, 'pk.key');
            // Mapbox reverse: /lng,lat.json
            expect(url.pathname).toContain('6.9603,50.9375');
        });

        it('appends reverseMode=distance', () => {
            const url = createMapboxReverseUrl(50.0, 7.0, 'pk.key');
            expect(url.searchParams.get('reverseMode')).toBe('distance');
        });

        it('applies default reverse types', () => {
            const url = createMapboxReverseUrl(50.0, 7.0, 'pk.key');
            expect(url.searchParams.get('types')).toBe('address,place,poi,neighborhood');
        });

        it('throws for NaN coordinates', () => {
            expect(() => createMapboxReverseUrl(NaN, 7.0, 'pk.key')).toThrow('Invalid lat/lng');
            expect(() => createMapboxReverseUrl(50.0, NaN, 'pk.key')).toThrow('Invalid lat/lng');
        });

        it('passes language option', () => {
            const url = createMapboxReverseUrl(50.0, 7.0, 'pk.key', { language: 'de' });
            expect(url.searchParams.get('language')).toBe('de');
        });
    });
});

// ============================================================================
// Mapbox Response Transformation
// ============================================================================

describe('Mapbox response transformation', () => {
    describe('transformMapboxSearchResults', () => {
        it('transforms features to GeocodingResult array', () => {
            const response: MapboxResponse = {
                features: [mapboxFeature()]
            };
            const results = transformMapboxSearchResults(response);
            expect(results).toHaveLength(1);
            expect(results[0].lat).toBe(50.9375);
            expect(results[0].lng).toBe(6.9603);
            expect(results[0].displayName).toBe('Domplatz 1, 50667 Cologne, Germany');
        });

        it('extracts address components from context', () => {
            const results = transformMapboxSearchResults({
                features: [mapboxFeature()]
            });
            expect(results[0].address.city).toBe('Cologne');
            expect(results[0].address.state).toBe('North Rhine-Westphalia');
            expect(results[0].address.country).toBe('Germany');
            expect(results[0].address.countryCode).toBe('DE');
            expect(results[0].address.postcode).toBe('50667');
        });

        it('sets both houseNumber and housenumber (dual naming)', () => {
            const results = transformMapboxSearchResults({
                features: [mapboxFeature()]
            });
            expect(results[0].address.houseNumber).toBe('1');
            expect(results[0].address.housenumber).toBe('1');
        });

        it('returns empty array for null/invalid response', () => {
            expect(transformMapboxSearchResults(null as any)).toEqual([]);
            expect(transformMapboxSearchResults({} as MapboxResponse)).toEqual([]);
            expect(transformMapboxSearchResults({ features: null as any })).toEqual([]);
        });

        it('handles feature without context', () => {
            const results = transformMapboxSearchResults({
                features: [mapboxFeature({ context: undefined })]
            });
            expect(results[0].address.city).toBeNull();
            expect(results[0].address.country).toBeNull();
        });

        it('uses locality as city fallback', () => {
            const results = transformMapboxSearchResults({
                features: [mapboxFeature({
                    context: [
                        { id: 'locality.1', text: 'Altstadt-Nord' }
                    ]
                })]
            });
            expect(results[0].address.city).toBe('Altstadt-Nord');
        });

        it('prefers place over locality for city', () => {
            const results = transformMapboxSearchResults({
                features: [mapboxFeature({
                    context: [
                        { id: 'locality.1', text: 'Altstadt-Nord' },
                        { id: 'place.2', text: 'Cologne' }
                    ]
                })]
            });
            expect(results[0].address.city).toBe('Cologne');
        });

        it('extracts neighborhood and district', () => {
            const results = transformMapboxSearchResults({
                features: [mapboxFeature({
                    context: [
                        { id: 'neighborhood.1', text: 'Altstadt' },
                        { id: 'district.2', text: 'Innenstadt' },
                        { id: 'place.3', text: 'Cologne' }
                    ]
                })]
            });
            expect(results[0].address.neighborhood).toBe('Altstadt');
            expect(results[0].address.district).toBe('Innenstadt');
        });
    });

    describe('transformMapboxReverseResult', () => {
        it('returns first feature as single result', () => {
            const result = transformMapboxReverseResult(
                { features: [mapboxFeature()] },
                50.9375, 6.9603
            );
            expect(result.lat).toBe(50.9375);
            expect(result.lng).toBe(6.9603);
            expect(result.address.street).toBe('Domplatz');
        });

        it('falls back to coordinates when no features found', () => {
            const result = transformMapboxReverseResult(
                { features: [] }, 50.9375, 6.9603
            );
            expect(result.displayName).toBe('50.937500, 6.960300');
            expect(result.address.street).toBeNull();
            expect(result.raw).toBeNull();
        });

        it('falls back for undefined features', () => {
            const result = transformMapboxReverseResult(
                {} as MapboxResponse, 50.0, 7.0
            );
            expect(result.displayName).toContain('50.000000');
        });

        it('builds displayName from text+address when no place_name', () => {
            const result = transformMapboxReverseResult({
                features: [mapboxFeature({
                    place_name: undefined,
                    text: 'Domplatz',
                    address: '1',
                    context: [{ id: 'place.1', text: 'Cologne' }]
                })]
            }, 50.0, 7.0);
            expect(result.displayName).toBe('Domplatz 1, Cologne');
        });
    });
});

// ============================================================================
// Photon URL Construction
// ============================================================================

describe('Photon URL construction', () => {
    describe('createPhotonSearchUrl', () => {
        it('creates URL with query parameter', () => {
            const url = createPhotonSearchUrl('Domplatz Cologne');
            expect(url.origin).toBe('https://photon.komoot.io');
            expect(url.pathname).toBe('/api/');
            expect(url.searchParams.get('q')).toBe('Domplatz Cologne');
        });

        it('defaults to limit=5 and lang=de', () => {
            const url = createPhotonSearchUrl('test');
            expect(url.searchParams.get('limit')).toBe('5');
            expect(url.searchParams.get('lang')).toBe('de');
        });

        it('respects custom options', () => {
            const url = createPhotonSearchUrl('test', {
                limit: '10',
                lang: 'en',
                bbox: '6.7,50.8,7.2,51.1'
            });
            expect(url.searchParams.get('limit')).toBe('10');
            expect(url.searchParams.get('lang')).toBe('en');
            expect(url.searchParams.get('bbox')).toBe('6.7,50.8,7.2,51.1');
        });

        it('adds lat/lon for location bias', () => {
            const url = createPhotonSearchUrl('test', { lat: 50.9, lng: 6.96 });
            expect(url.searchParams.get('lat')).toBe('50.9');
            expect(url.searchParams.get('lon')).toBe('6.96');
        });

        it('omits lat/lon when only one provided', () => {
            const url = createPhotonSearchUrl('test', { lat: 50.9 });
            expect(url.searchParams.has('lat')).toBe(false);
            expect(url.searchParams.has('lon')).toBe(false);
        });

        it('passes radius parameter', () => {
            const url = createPhotonSearchUrl('test', { radius: '5000' });
            expect(url.searchParams.get('radius')).toBe('5000');
        });
    });

    describe('createPhotonReverseUrl', () => {
        it('creates URL with lat/lon params', () => {
            const url = createPhotonReverseUrl(50.9375, 6.9603);
            expect(url.origin).toBe('https://photon.komoot.io');
            expect(url.pathname).toBe('/reverse/');
            expect(url.searchParams.get('lat')).toBe('50.9375');
            expect(url.searchParams.get('lon')).toBe('6.9603');
        });

        it('defaults to lang=de', () => {
            const url = createPhotonReverseUrl(50.0, 7.0);
            expect(url.searchParams.get('lang')).toBe('de');
        });

        it('respects custom lang', () => {
            const url = createPhotonReverseUrl(50.0, 7.0, { lang: 'en' });
            expect(url.searchParams.get('lang')).toBe('en');
        });

        it('throws for NaN coordinates', () => {
            expect(() => createPhotonReverseUrl(NaN, 7.0)).toThrow('Invalid lat/lng');
            expect(() => createPhotonReverseUrl(50.0, NaN)).toThrow('Invalid lat/lng');
        });
    });
});

// ============================================================================
// Photon Response Transformation
// ============================================================================

describe('Photon response transformation', () => {
    describe('transformPhotonSearchResults', () => {
        it('transforms features to GeocodingResult array', () => {
            const response: PhotonResponse = {
                features: [photonFeature()]
            };
            const results = transformPhotonSearchResults(response);
            expect(results).toHaveLength(1);
            expect(results[0].lat).toBe(50.9375);
            expect(results[0].lng).toBe(6.9603);
        });

        it('builds displayName from street + housenumber + city', () => {
            const results = transformPhotonSearchResults({
                features: [photonFeature()]
            });
            // name is undefined, so falls back to street+housenumber, city
            expect(results[0].displayName).toBe('Domplatz 1, Cologne');
        });

        it('prefers name over street+city for displayName', () => {
            const results = transformPhotonSearchResults({
                features: [photonFeature({
                    properties: {
                        name: 'Cologne Cathedral',
                        street: 'Domkloster',
                        housenumber: '4',
                        city: 'Cologne',
                        country: 'Germany',
                        countrycode: 'de',
                        postcode: '50667'
                    }
                })]
            });
            expect(results[0].displayName).toBe('Cologne Cathedral');
        });

        it('sets both houseNumber and housenumber (dual naming)', () => {
            const results = transformPhotonSearchResults({
                features: [photonFeature()]
            });
            expect(results[0].address.houseNumber).toBe('1');
            expect(results[0].address.housenumber).toBe('1');
        });

        it('maps countrycode to countryCode (uppercased)', () => {
            const results = transformPhotonSearchResults({
                features: [photonFeature()]
            });
            expect(results[0].address.countryCode).toBe('DE');
        });

        it('returns empty array for null/invalid response', () => {
            expect(transformPhotonSearchResults(null as any)).toEqual([]);
            expect(transformPhotonSearchResults({} as PhotonResponse)).toEqual([]);
        });

        it('handles feature without street (falls back to state)', () => {
            const results = transformPhotonSearchResults({
                features: [photonFeature({
                    properties: {
                        city: undefined,
                        street: undefined,
                        state: 'NRW',
                        country: 'Germany',
                        countrycode: 'de'
                    }
                })]
            });
            expect(results[0].displayName).toBe('NRW');
        });
    });

    describe('transformPhotonReverseResult', () => {
        it('returns first feature as single result', () => {
            const result = transformPhotonReverseResult(
                { features: [photonFeature()] },
                50.9375, 6.9603
            );
            expect(result.lat).toBe(50.9375);
            expect(result.lng).toBe(6.9603);
            expect(result.address.street).toBe('Domplatz');
        });

        it('falls back to coordinates when no features', () => {
            const result = transformPhotonReverseResult(
                { features: [] }, 50.9375, 6.9603
            );
            // Photon format: lat,lng without spaces
            expect(result.displayName).toBe('50.9375,6.9603');
            expect(result.address.street).toBeNull();
            expect(result.raw).toBeNull();
        });

        it('falls back for undefined features', () => {
            const result = transformPhotonReverseResult(
                {} as PhotonResponse, 50.0, 7.0
            );
            expect(result.displayName).toBe('50,7');
        });
    });
});
