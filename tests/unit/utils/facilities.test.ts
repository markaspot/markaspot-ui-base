import { describe, it, expect } from 'vitest';
import type { FacilityConfigItem } from '~~/types/clientConfig';
import {
    findNearestActiveFacility,
    resolveValidFacilityId
} from '@/utils/facilities';

const centrum: FacilityConfigItem = {
    id: 'stadsloket-centrum',
    label: 'Stadsloket Centrum',
    lat: 52.3676842,
    lng: 4.9002256,
    address: 'Amstel 1',
    active: true
};
const west: FacilityConfigItem = {
    id: 'stadsloket-west',
    label: 'Stadsloket West',
    lat: 52.3781391,
    lng: 4.8452606,
    address: 'Bos en Lommerplein 250',
    active: true
};
const oost: FacilityConfigItem = {
    id: 'stadsloket-oost',
    label: 'Stadsloket Oost',
    lat: 52.35804,
    lng: 4.93115,
    active: true
};

describe('resolveValidFacilityId', () => {
    it('returns the candidate when it matches an active facility', () => {
        expect(resolveValidFacilityId('stadsloket-west', [centrum, west])).toBe(
            'stadsloket-west'
        );
    });

    it('returns an empty string for unknown ids', () => {
        expect(resolveValidFacilityId('does-not-exist', [centrum, west])).toBe('');
    });

    it('returns an empty string for empty / null inputs', () => {
        expect(resolveValidFacilityId('', [centrum])).toBe('');
        expect(resolveValidFacilityId(undefined, [centrum])).toBe('');
        expect(resolveValidFacilityId(null, [centrum])).toBe('');
    });

    it('handles missing facility lists', () => {
        expect(resolveValidFacilityId('x', null)).toBe('');
        expect(resolveValidFacilityId('x', [])).toBe('');
    });
});

describe('findNearestActiveFacility', () => {
    it('returns null when there are no facilities', () => {
        expect(findNearestActiveFacility(52.37, 4.9, [])).toBeNull();
        expect(findNearestActiveFacility(52.37, 4.9, null)).toBeNull();
    });

    it('returns the single facility when only one exists', () => {
        const res = findNearestActiveFacility(52.37, 4.9, [centrum]);
        expect(res).not.toBeNull();
        expect(res!.facility.id).toBe('stadsloket-centrum');
        expect(res!.distanceMeters).toBeGreaterThan(0);
    });

    it('picks the closest facility among several', () => {
        // Near Amstel 1 -> expect Centrum.
        const nearCentrum = findNearestActiveFacility(
            52.3677,
            4.9003,
            [west, centrum, oost]
        );
        expect(nearCentrum!.facility.id).toBe('stadsloket-centrum');

        // Near Bos en Lommerplein -> expect West.
        const nearWest = findNearestActiveFacility(
            52.378,
            4.846,
            [west, centrum, oost]
        );
        expect(nearWest!.facility.id).toBe('stadsloket-west');
    });

    it('tolerates string lat/lng on facility items', () => {
        const stringCoords = {
            id: 'string-coords',
            label: 'String Coords',
            // Cast: the type accepts numbers but Drupal field values occasionally
            // arrive as strings from JSON:API.
            lat: '52.3676842' as unknown as number,
            lng: '4.9002256' as unknown as number,
            active: true
        };
        const res = findNearestActiveFacility(52.3676842, 4.9002256, [
            stringCoords
        ]);
        expect(res).not.toBeNull();
        expect(res!.facility.id).toBe('string-coords');
        expect(res!.distanceMeters).toBeCloseTo(0, 3);
    });

    it('skips facilities whose coordinates do not parse', () => {
        const broken = {
            id: 'broken',
            label: 'Broken',
            lat: Number.NaN,
            lng: Number.NaN,
            active: true
        };
        const res = findNearestActiveFacility(52.37, 4.9, [broken, centrum]);
        expect(res).not.toBeNull();
        expect(res!.facility.id).toBe('stadsloket-centrum');
    });

    it('reports a distance > 0 for non-colocated coords', () => {
        const res = findNearestActiveFacility(52.0, 5.0, [centrum, west]);
        expect(res).not.toBeNull();
        expect(res!.distanceMeters).toBeGreaterThan(1000);
    });
});
