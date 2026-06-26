import { describe, it, expect, vi } from 'vitest';
import { mapAddressToDrupal, facilityAddressToDrupal } from '@/utils/mapAddressToDrupal';

/**
 * mapAddressToDrupal Tests
 *
 * Tests the mapping from geocoder address objects (Mapbox/Photon/Nominatim)
 * to Drupal's field_address format. This is the critical bridge ensuring
 * structured addresses are correctly stored in Drupal.
 */

describe('mapAddressToDrupal', () => {
    // ========================================================================
    // Null / undefined input
    // ========================================================================

    describe('empty input', () => {
        it('returns undefined for undefined', () => {
            expect(mapAddressToDrupal(undefined)).toBeUndefined();
        });

        it('returns undefined for an all-empty object (WBD #126: never overwrite field_address with blanks)', () => {
            // A failed map-pick reverse-geocode yields {}. Returning undefined
            // makes callers omit field_address rather than clobbering a stored
            // address with empty values.
            expect(mapAddressToDrupal({})).toBeUndefined();
        });

        it('still maps a country-only object (country_code is meaningful data)', () => {
            expect(mapAddressToDrupal({ country: 'Deutschland' })).toEqual({
                country_code: 'DE',
                postal_code: '',
                locality: '',
                address_line1: ''
            });
        });
    });

    // ========================================================================
    // Full address mapping (typical geocoder output)
    // ========================================================================

    describe('complete address mapping', () => {
        it('maps a complete German address with countryCode', () => {
            const result = mapAddressToDrupal({
                street: 'Domkloster',
                houseNumber: '4',
                postcode: '50667',
                city: 'Köln',
                countryCode: 'de',
                country: 'Deutschland',
                state: 'Nordrhein-Westfalen'
            });

            expect(result).toEqual({
                country_code: 'DE',
                postal_code: '50667',
                locality: 'Köln',
                address_line1: 'Domkloster 4'
            });
        });

        it('maps a Photon result with lowercase housenumber', () => {
            const result = mapAddressToDrupal({
                street: 'Münsterplatz',
                housenumber: '1',
                postcode: '53111',
                city: 'Bonn',
                countryCode: 'de'
            });

            expect(result).toEqual({
                country_code: 'DE',
                postal_code: '53111',
                locality: 'Bonn',
                address_line1: 'Münsterplatz 1'
            });
        });

        it('prefers houseNumber over housenumber when both exist', () => {
            const result = mapAddressToDrupal({
                street: 'Teststraße',
                houseNumber: '10',
                housenumber: '99',
                city: 'Berlin',
                countryCode: 'DE'
            });

            expect(result!.address_line1).toBe('Teststraße 10');
        });
    });

    // ========================================================================
    // Country code resolution
    // ========================================================================

    describe('country code resolution', () => {
        it('uppercases existing countryCode', () => {
            const result = mapAddressToDrupal({ countryCode: 'nl', city: 'Amsterdam' });
            expect(result!.country_code).toBe('NL');
        });

        it('maps "Deutschland" to DE', () => {
            const result = mapAddressToDrupal({ country: 'Deutschland' });
            expect(result!.country_code).toBe('DE');
        });

        it('maps "Germany" to DE', () => {
            const result = mapAddressToDrupal({ country: 'Germany' });
            expect(result!.country_code).toBe('DE');
        });

        it('maps "United States" to US', () => {
            const result = mapAddressToDrupal({ country: 'United States' });
            expect(result!.country_code).toBe('US');
        });

        it('maps "United Kingdom" to GB', () => {
            const result = mapAddressToDrupal({ country: 'United Kingdom' });
            expect(result!.country_code).toBe('GB');
        });

        it('maps "France" to FR', () => {
            const result = mapAddressToDrupal({ country: 'France' });
            expect(result!.country_code).toBe('FR');
        });

        it('maps "Austria" to AT', () => {
            const result = mapAddressToDrupal({ country: 'Austria' });
            expect(result!.country_code).toBe('AT');
        });

        it('maps "Switzerland" to CH', () => {
            const result = mapAddressToDrupal({ country: 'Switzerland' });
            expect(result!.country_code).toBe('CH');
        });

        it('maps "Netherlands" to NL', () => {
            const result = mapAddressToDrupal({ country: 'Netherlands' });
            expect(result!.country_code).toBe('NL');
        });

        it('prefers countryCode over country name', () => {
            const result = mapAddressToDrupal({
                countryCode: 'AT',
                country: 'Deutschland'
            });
            expect(result!.country_code).toBe('AT');
        });

        it('warns and omits the address for an unknown-country-only object', () => {
            // Unknown country resolves to an empty code; with no other usable
            // fields the whole address is empty, so it is omitted (WBD #126).
            // The warning still fires before the empty-address guard.
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = mapAddressToDrupal({ country: 'Narnia' });
            expect(result).toBeUndefined();
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Unknown country name "Narnia"')
            );
            warnSpy.mockRestore();
        });

        it('returns empty country_code when a locality is present but no country', () => {
            const result = mapAddressToDrupal({ city: 'Köln' });
            expect(result!.country_code).toBe('');
        });
    });

    // ========================================================================
    // Partial addresses (common in geocoder results)
    // ========================================================================

    describe('partial addresses', () => {
        it('handles street without house number', () => {
            const result = mapAddressToDrupal({
                street: 'Domplatz',
                city: 'Köln',
                postcode: '50667'
            });
            expect(result!.address_line1).toBe('Domplatz');
        });

        it('handles city without street', () => {
            const result = mapAddressToDrupal({
                city: 'Köln',
                postcode: '50667'
            });
            expect(result!.address_line1).toBe('');
            expect(result!.locality).toBe('Köln');
            expect(result!.postal_code).toBe('50667');
        });

        it('handles only postcode', () => {
            const result = mapAddressToDrupal({ postcode: '50667' });
            expect(result!.postal_code).toBe('50667');
            expect(result!.locality).toBe('');
            expect(result!.address_line1).toBe('');
        });

        it('converts numeric postcode to string', () => {
            const result = mapAddressToDrupal({ postcode: '01234' });
            expect(result!.postal_code).toBe('01234');
            expect(typeof result!.postal_code).toBe('string');
        });
    });

    // ========================================================================
    // Provider-specific edge cases
    // ========================================================================

    describe('provider-specific patterns', () => {
        it('handles Mapbox result (camelCase houseNumber)', () => {
            const result = mapAddressToDrupal({
                street: 'Broadway',
                houseNumber: '1600',
                city: 'New York',
                postcode: '10019',
                countryCode: 'US',
                state: 'New York'
            });
            expect(result).toEqual({
                country_code: 'US',
                postal_code: '10019',
                locality: 'New York',
                address_line1: 'Broadway 1600'
            });
        });

        it('handles Nominatim result (no houseNumber field)', () => {
            const result = mapAddressToDrupal({
                street: 'Champs-Élysées',
                city: 'Paris',
                postcode: '75008',
                country: 'France'
            });
            expect(result).toEqual({
                country_code: 'FR',
                postal_code: '75008',
                locality: 'Paris',
                address_line1: 'Champs-Élysées'
            });
        });

        it('handles Dutch postcode format', () => {
            const result = mapAddressToDrupal({
                street: 'Dam',
                housenumber: '1',
                city: 'Amsterdam',
                postcode: '1012 JS',
                countryCode: 'NL'
            });
            expect(result!.postal_code).toBe('1012 JS');
        });
    });
});

// ============================================================================
// facilityAddressToDrupal - #359 fix
// ============================================================================

describe('facilityAddressToDrupal', () => {
    // =========================================================================
    // Structured FacilityAddress input
    // =========================================================================

    describe('structured FacilityAddress input', () => {
        it('returns all four Drupal fields for a complete structured address', () => {
            const result = facilityAddressToDrupal({
                address_line1: 'Lindenstraße 12',
                country_code: 'DE',
                locality: 'Berlin',
                postal_code: '10115'
            });

            expect(result).toEqual({
                address_line1: 'Lindenstraße 12',
                country_code: 'DE',
                locality: 'Berlin',
                postal_code: '10115'
            });
        });

        it('accepts a structured address with only address_line1 set (optional fields empty)', () => {
            const result = facilityAddressToDrupal({ address_line1: 'Marktplatz 1' });

            expect(result).toEqual({
                address_line1: 'Marktplatz 1',
                country_code: '',
                locality: '',
                postal_code: ''
            });
        });

        it('preserves country_code casing as stored (no forced toUpperCase)', () => {
            // The admin UI stores the reverse-geocoded value; casing is provider-specific.
            // facilityAddressToDrupal must not alter the value, only the offline-queue
            // path normalises country_code.
            const result = facilityAddressToDrupal({
                address_line1: 'Dam 1',
                country_code: 'NL',
                locality: 'Amsterdam',
                postal_code: '1012 AB'
            });

            expect(result!.country_code).toBe('NL');
        });
    });

    // =========================================================================
    // Legacy plain-string input (graceful degradation)
    // =========================================================================

    describe('legacy plain-string input (graceful degradation)', () => {
        it('wraps a plain string as address_line1 with empty other fields', () => {
            const result = facilityAddressToDrupal('Sportpark 5, Berlin');

            expect(result).toEqual({
                address_line1: 'Sportpark 5, Berlin',
                country_code: '',
                locality: '',
                postal_code: ''
            });
        });

        it('trims the plain string', () => {
            const result = facilityAddressToDrupal('  Main Street 1  ');
            expect(result!.address_line1).toBe('Main Street 1');
        });

        it('returns undefined for an empty string', () => {
            expect(facilityAddressToDrupal('')).toBeUndefined();
        });

        it('returns undefined for a whitespace-only string', () => {
            expect(facilityAddressToDrupal('   ')).toBeUndefined();
        });
    });

    // =========================================================================
    // undefined input
    // =========================================================================

    describe('undefined input', () => {
        it('returns undefined when address is undefined', () => {
            expect(facilityAddressToDrupal(undefined)).toBeUndefined();
        });
    });

    // =========================================================================
    // Acceptance criteria: facility submission always sends complete payload
    // =========================================================================

    describe('submission payload completeness', () => {
        it('structured address from facility config produces all four Drupal fields (strict-address tenant scenario)', () => {
            // Simulates a facility saved with geocoded address (NL tenant with strict country_code required)
            const facilityAddr = {
                address_line1: 'Stadionplein 1',
                country_code: 'NL',
                locality: 'Amsterdam',
                postal_code: '1076 BR'
            };

            const result = facilityAddressToDrupal(facilityAddr);

            // All four fields must be present so Drupal does not 422
            expect(result?.country_code).toBeTruthy();
            expect(result?.locality).toBeTruthy();
            expect(result?.postal_code).toBeTruthy();
            expect(result?.address_line1).toBeTruthy();
        });
    });
});
