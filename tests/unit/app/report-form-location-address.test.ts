/**
 * Unit tests for the locationAddress selection logic shared by
 * the classic and photo-first report forms (both import
 * `pickLocationAddress` from app/utils/pickLocationAddress.ts).
 *
 * Regression guard for the optional-mode address shadowing bug: in optional
 * (and mixed/disabled) facility modes, a citizen-picked location was being
 * overwritten by the auto-tagged facility's stored address. The
 * FacilityManager backend deliberately leaves geo data alone in those modes
 * (FacilityManager::applyToServiceRequest in the profile), so the frontend
 * must not pre-substitute the address either — otherwise the report ships
 * with the facility's street even when the pin is metres away.
 *
 * Only `exclusive` mode lets the facility own the location/address; every
 * other mode uses the citizen's pin-derived address unconditionally.
 */
import { describe, it, expect } from 'vitest';
import type { FacilityAddress } from '~~/types/clientConfig';
import { pickLocationAddress } from '@/utils/pickLocationAddress';

interface SelectedFacility {
    id: string
    label: string
    lat: number
    lng: number
    address?: FacilityAddress | string
}

describe('report form locationAddress selection', () => {
    const facility: SelectedFacility = {
        id: 'school-1',
        label: 'Schule am Park',
        lat: 52.5,
        lng: 13.4,
        address: {
            address_line1: 'Parkstraße 1',
            country_code: 'DE',
            locality: 'Berlin',
            postal_code: '10115'
        }
    };

    const citizenAddress = {
        road: 'Hauptstraße',
        houseNumber: '42',
        city: 'Berlin',
        postcode: '10117',
        countryCode: 'DE'
    };

    describe('exclusive mode', () => {
        it('uses the selected facility address when present', () => {
            expect(pickLocationAddress(true, facility, citizenAddress)).toEqual(facility.address);
        });

        it('falls back to the citizen-picked address when no facility is selected', () => {
            expect(pickLocationAddress(true, null, citizenAddress)).toEqual(citizenAddress);
        });

        it('falls back to the citizen-picked address when facility has no stored address', () => {
            const f: SelectedFacility = { ...facility, address: undefined };
            expect(pickLocationAddress(true, f, citizenAddress)).toEqual(citizenAddress);
        });
    });

    describe('optional mode (auto-tagged facility via radius)', () => {
        it('uses the citizen-picked address even when a facility is auto-tagged', () => {
            // Facility id auto-attached because the pin landed inside
            // nearestSnapRadius — but the citizen's actual position drives
            // the address, not the facility's stored street.
            expect(pickLocationAddress(false, facility, citizenAddress)).toEqual(citizenAddress);
        });

        it('does not coerce the facility address into the payload when no citizen address yet', () => {
            // Pin set, reverse-geocode pending → undefined. We must NOT silently
            // backfill from the facility (would attribute the report to the
            // facility's street).
            expect(pickLocationAddress(false, facility, undefined)).toBeUndefined();
        });
    });

    describe('mixed/disabled modes (isExclusive=false)', () => {
        it('mixed mode behaves like optional: citizen address wins', () => {
            // Mixed mode has the facility picker AND the map picker visible.
            // A free pin must use its own reverse-geocoded address.
            expect(pickLocationAddress(false, facility, citizenAddress)).toEqual(citizenAddress);
        });

        it('disabled mode (no facility selectable) uses citizen address', () => {
            expect(pickLocationAddress(false, null, citizenAddress)).toEqual(citizenAddress);
        });
    });

    describe('shape passthrough', () => {
        it('passes a structured FacilityAddress through unchanged in exclusive mode', () => {
            const result = pickLocationAddress(true, facility, undefined);
            expect(result).toEqual(facility.address);
            // Sanity: the structured object is still recognisable as FacilityAddress
            // by useServiceRequest (it dispatches on `address_line1` key).
            expect((result as FacilityAddress).address_line1).toBe('Parkstraße 1');
        });

        it('passes a legacy plain-string facility address through unchanged in exclusive mode', () => {
            const legacy: SelectedFacility = { ...facility, address: 'Old Street 7, Berlin' };
            const result = pickLocationAddress(true, legacy, undefined);
            expect(result).toBe('Old Street 7, Berlin');
        });
    });
});
