/**
 * Format Address Tests
 *
 * Tests address string construction from geocoding results with
 * various combinations of street, housenumber, city, postcode.
 *
 * @see app/utils/formatAddress.ts
 */
import { describe, it, expect } from 'vitest';
import { formatGeocodedAddress } from '@/utils/formatAddress';

// ============================================================================
// Helpers
// ============================================================================

function result(address: Record<string, any> = {}, displayName?: string) {
    return { address, displayName };
}

// ============================================================================
// Tests
// ============================================================================

describe('formatGeocodedAddress', () => {
    describe('full address', () => {
        it('formats street + housenumber, postcode + city', () => {
            const addr = formatGeocodedAddress(result({
                street: 'Domplatz',
                housenumber: '1',
                postcode: '50667',
                city: 'Cologne'
            }));
            expect(addr).toBe('Domplatz 1, 50667 Cologne');
        });

        it('formats street without housenumber', () => {
            const addr = formatGeocodedAddress(result({
                street: 'Unter Sachsenhausen',
                city: 'Cologne',
                postcode: '50667'
            }));
            expect(addr).toBe('Unter Sachsenhausen, 50667 Cologne');
        });

        it('formats city without postcode', () => {
            const addr = formatGeocodedAddress(result({
                street: 'Main Street',
                city: 'Springfield'
            }));
            expect(addr).toBe('Main Street, Springfield');
        });
    });

    describe('partial address', () => {
        it('only street', () => {
            expect(formatGeocodedAddress(result({ street: 'Domplatz' }))).toBe('Domplatz');
        });

        it('only city', () => {
            expect(formatGeocodedAddress(result({ city: 'Cologne' }))).toBe('Cologne');
        });

        it('empty address falls back to displayName', () => {
            expect(formatGeocodedAddress(result({}, 'Cologne, Germany'))).toBe('Cologne, Germany');
        });
    });

    describe('fallback behavior', () => {
        it('returns displayName when no address object', () => {
            expect(formatGeocodedAddress({ displayName: 'Some Place' })).toBe('Some Place');
        });

        it('returns coordinate string when fallbackCoords provided and no address', () => {
            const addr = formatGeocodedAddress(null, { lat: 50.9375, lng: 6.9603 });
            expect(addr).toBe('50.937500, 6.960300');
        });

        it('returns "Unknown location" when nothing available', () => {
            expect(formatGeocodedAddress(null)).toBe('Unknown location');
            expect(formatGeocodedAddress(undefined)).toBe('Unknown location');
        });

        it('prefers formatted parts over displayName', () => {
            const addr = formatGeocodedAddress(result(
                { street: 'Domplatz', housenumber: '1', city: 'Cologne' },
                'Domplatz 1, 50667 Cologne, Germany'
            ));
            // Formatted parts don't include country, displayName does
            expect(addr).toBe('Domplatz 1, Cologne');
        });

        it('uses displayName when address has no street or city', () => {
            const addr = formatGeocodedAddress(result(
                { state: 'NRW', country: 'Germany' },
                'NRW, Germany'
            ));
            expect(addr).toBe('NRW, Germany');
        });

        it('uses coords as last resort when no displayName', () => {
            const addr = formatGeocodedAddress(
                result({ state: 'NRW' }), // no street, no city, no displayName
                { lat: 50.0, lng: 7.0 }
            );
            // No street/city parts, no displayName -> falls through to fallbackCoords
            expect(addr).toBe('50.000000, 7.000000');
        });
    });

    describe('uses housenumber (not houseNumber)', () => {
        it('uses housenumber field', () => {
            const addr = formatGeocodedAddress(result({
                street: 'Domplatz',
                housenumber: '42'
            }));
            expect(addr).toContain('42');
        });

        it('does NOT use houseNumber (camelCase)', () => {
            // This documents the current behavior: only lowercase housenumber is used
            const addr = formatGeocodedAddress(result({
                street: 'Domplatz',
                houseNumber: '42' // camelCase - not used by formatAddress
            }));
            // The houseNumber is ignored, only housenumber works
            expect(addr).toBe('Domplatz');
        });
    });
});
