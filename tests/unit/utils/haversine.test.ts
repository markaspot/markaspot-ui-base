import { describe, it, expect } from 'vitest';
import { haversineDistanceMeters } from '@/utils/haversine';

/**
 * Haversine distance tests.
 *
 * These sanity-check the numeric output against known geodesic fixtures and
 * the input tolerance requirement (string lat/lng from config).
 */

describe('haversineDistanceMeters', () => {
    it('returns 0 for the same coordinate', () => {
        const d = haversineDistanceMeters(
            { lat: 52.3676, lng: 4.9041 },
            { lat: 52.3676, lng: 4.9041 }
        );
        expect(d).toBe(0);
    });

    it('computes a ~1m distance for ~1m north offset', () => {
        // 1e-5 degrees latitude ≈ 1.11 m.
        const d = haversineDistanceMeters(
            { lat: 52.3676, lng: 4.9041 },
            { lat: 52.36761, lng: 4.9041 }
        );
        expect(d).toBeGreaterThan(0.9);
        expect(d).toBeLessThan(1.3);
    });

    it('computes a ~111km distance for 1 degree latitude', () => {
        const d = haversineDistanceMeters(
            { lat: 0, lng: 0 },
            { lat: 1, lng: 0 }
        );
        // Earth's mean meridian arc degree ≈ 111,195 m.
        expect(d).toBeGreaterThan(111000);
        expect(d).toBeLessThan(111500);
    });

    it('is commutative', () => {
        const a = { lat: 52.3676, lng: 4.9041 };
        const b = { lat: 52.379, lng: 4.8982 };
        const ab = haversineDistanceMeters(a, b);
        const ba = haversineDistanceMeters(b, a);
        expect(ab).toBeCloseTo(ba, 6);
    });

    it('accepts numeric strings for lat/lng', () => {
        const d = haversineDistanceMeters(
            { lat: '52.3676', lng: '4.9041' },
            { lat: '52.3676', lng: '4.9041' }
        );
        expect(d).toBe(0);
    });

    it('matches numeric result when one side uses strings', () => {
        const asNumbers = haversineDistanceMeters(
            { lat: 52.3676, lng: 4.9041 },
            { lat: 52.379, lng: 4.8982 }
        );
        const asStrings = haversineDistanceMeters(
            { lat: '52.3676', lng: '4.9041' },
            { lat: '52.379', lng: '4.8982' }
        );
        expect(asStrings).toBeCloseTo(asNumbers, 6);
    });

    it('returns NaN when any coordinate is not a finite number', () => {
        expect(
            haversineDistanceMeters(
                { lat: Number.NaN, lng: 4.9041 },
                { lat: 52.3676, lng: 4.9041 }
            )
        ).toBeNaN();
        expect(
            haversineDistanceMeters(
                { lat: '', lng: 4.9041 },
                { lat: 52.3676, lng: 4.9041 }
            )
        ).toBeNaN();
        expect(
            haversineDistanceMeters(
                { lat: 'abc', lng: 4.9041 },
                { lat: 52.3676, lng: 4.9041 }
            )
        ).toBeNaN();
    });

    it('computes a realistic Amsterdam centrum -> west distance', () => {
        // Stadsloket Centrum (Amstel 1) -> Stadsloket West (Bos en Lommerplein).
        const d = haversineDistanceMeters(
            { lat: 52.3676842, lng: 4.9002256 },
            { lat: 52.3781391, lng: 4.8452606 }
        );
        // Rough expected distance ~3.9 km.
        expect(d).toBeGreaterThan(3500);
        expect(d).toBeLessThan(4500);
    });
});
