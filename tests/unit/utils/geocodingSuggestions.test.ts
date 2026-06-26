import { describe, expect, it } from 'vitest';
import {
    isStreetLikeGeocodingResult,
    isStreetOnlyQuery,
    shouldKeepGeocodingSuggestion
} from '~/app/utils/geocodingSuggestions';
import type { GeocodingResult } from '~/app/plugins/geocoding/providers/types';

const result = (overrides: Partial<GeocodingResult> = {}): GeocodingResult => ({
    lat: 51.455,
    lng: 6.626,
    displayName: 'An der Coelve',
    address: {
        street: 'An der Coelve',
        city: 'Moers'
    },
    raw: { place_type: ['address'] },
    ...overrides
});

describe('geocoding suggestion filters', () => {
    describe('isStreetOnlyQuery', () => {
        it('accepts street names without house numbers', () => {
            expect(isStreetOnlyQuery('An der Coelve')).toBe(true);
            expect(isStreetOnlyQuery('Rue de la Paix')).toBe(true);
        });

        it('rejects queries that already look like full addresses', () => {
            expect(isStreetOnlyQuery('An der Coelve 12')).toBe(false);
            expect(isStreetOnlyQuery('An der Coelve, Moers')).toBe(false);
        });
    });

    describe('isStreetLikeGeocodingResult', () => {
        it('accepts provider results with address or street feature types', () => {
            expect(isStreetLikeGeocodingResult(result({ raw: { place_type: ['address'] } }))).toBe(true);
            expect(isStreetLikeGeocodingResult(result({ raw: { properties: { type: 'street' } } }))).toBe(true);
        });

        it('rejects administrative results even when provider mapping exposes text as street', () => {
            expect(isStreetLikeGeocodingResult(result({ raw: { place_type: ['place'] } }))).toBe(false);
            expect(isStreetLikeGeocodingResult(result({ raw: { place_type: ['neighborhood'] } }))).toBe(false);
        });

        it('falls back to a street component for providers without raw feature typing', () => {
            expect(isStreetLikeGeocodingResult(result({ raw: undefined }))).toBe(true);
        });

        it('rejects unrecognized raw feature types even when a street component is present', () => {
            expect(isStreetLikeGeocodingResult(result({ raw: { type: 'venue' } }))).toBe(false);
        });
    });

    describe('shouldKeepGeocodingSuggestion', () => {
        it('always keeps suggestions with a postcode', () => {
            expect(shouldKeepGeocodingSuggestion(
                'An der Coelve 12',
                result({ address: { street: 'An der Coelve', postcode: '47441' } })
            )).toBe(true);
        });

        it('keeps postcode-less street results for street-only queries', () => {
            expect(shouldKeepGeocodingSuggestion('An der Coelve', result())).toBe(true);
        });

        it('drops postcode-less street results for house-number queries', () => {
            expect(shouldKeepGeocodingSuggestion('An der Coelve 12', result())).toBe(false);
        });

        it('drops postcode-less city or area results for street-only queries', () => {
            expect(shouldKeepGeocodingSuggestion(
                'Moers',
                result({
                    displayName: 'Moers',
                    address: { street: 'Moers' },
                    raw: { place_type: ['place'] }
                })
            )).toBe(false);
        });
    });
});
