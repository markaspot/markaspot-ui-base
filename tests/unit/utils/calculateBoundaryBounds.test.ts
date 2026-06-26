import { describe, it, expect } from 'vitest';
import { calculateBoundaryBounds } from '@/utils/calculateBoundaryBounds';

/**
 * Boundary Bounds Calculation Tests
 *
 * Tests GeoJSON boundary processing for map bounds.
 * Used to:
 * - Calculate map viewport from jurisdiction boundaries
 * - Validate if coordinates are within boundaries
 * - Pan map to show entire jurisdiction
 */

describe('calculateBoundaryBounds', () => {
    /**
   * Test 1: Calculate bounds from Polygon
   */
    it('should calculate bounds from single Polygon', () => {
        const geoJSON = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [7.0, 50.7], // SW
                                [7.2, 50.7], // SE
                                [7.2, 50.8], // NE
                                [7.0, 50.8], // NW
                                [7.0, 50.7] // Close ring
                            ]
                        ]
                    }
                }
            ]
        };

        const bounds = calculateBoundaryBounds(geoJSON);

        expect(bounds).toBeTruthy();
        expect(bounds).toHaveLength(2);

        // Should have SW and NE corners with padding
        const [[minLng, minLat], [maxLng, maxLat]] = bounds!;

        // Original bounds: lng 7.0-7.2, lat 50.7-50.8
        // Should be padded (2.5x on each side)
        expect(minLng).toBeLessThan(7.0);
        expect(maxLng).toBeGreaterThan(7.2);
        expect(minLat).toBeLessThan(50.7);
        expect(maxLat).toBeGreaterThan(50.8);
    });

    /**
   * Test 2: Calculate bounds from MultiPolygon
   */
    it('should calculate bounds from MultiPolygon', () => {
        const geoJSON = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [7.0, 50.7],
                                    [7.1, 50.7],
                                    [7.1, 50.8],
                                    [7.0, 50.8],
                                    [7.0, 50.7]
                                ]
                            ],
                            [
                                [
                                    [7.5, 50.9],
                                    [7.6, 50.9],
                                    [7.6, 51.0],
                                    [7.5, 51.0],
                                    [7.5, 50.9]
                                ]
                            ]
                        ]
                    }
                }
            ]
        };

        const bounds = calculateBoundaryBounds(geoJSON);

        expect(bounds).toBeTruthy();

        const [[minLng, minLat], [maxLng, maxLat]] = bounds!;

        // Should encompass both polygons
        expect(minLng).toBeLessThan(7.0);
        expect(maxLng).toBeGreaterThan(7.6);
        expect(minLat).toBeLessThan(50.7);
        expect(maxLat).toBeGreaterThan(51.0);
    });

    /**
   * Test 3: Handle null/undefined input
   */
    it('should return null for null input', () => {
        expect(calculateBoundaryBounds(null)).toBeNull();
        expect(calculateBoundaryBounds(undefined)).toBeNull();
    });

    /**
   * Test 4: Handle empty features
   */
    it('should return null for empty features', () => {
        const geoJSON = {
            type: 'FeatureCollection',
            features: []
        };

        expect(calculateBoundaryBounds(geoJSON)).toBeNull();
    });

    /**
   * Test 5: Handle missing features
   */
    it('should return null for missing features', () => {
        const geoJSON = {
            type: 'FeatureCollection'
            // No features property
        };

        expect(calculateBoundaryBounds(geoJSON)).toBeNull();
    });

    /**
   * Test 6: Handle feature without geometry
   */
    it('should skip features without geometry', () => {
        const geoJSON = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: null // Missing geometry
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [7.0, 50.7],
                                [7.1, 50.7],
                                [7.1, 50.8],
                                [7.0, 50.8],
                                [7.0, 50.7]
                            ]
                        ]
                    }
                }
            ]
        };

        const bounds = calculateBoundaryBounds(geoJSON);

        // Should still calculate bounds from valid feature
        expect(bounds).toBeTruthy();
    });

    /**
   * Test 7: Padding calculation
   */
    it('should apply 2.5x padding to bounds', () => {
        const geoJSON = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [7.0, 50.0],
                                [7.1, 50.0],
                                [7.1, 50.1],
                                [7.0, 50.1],
                                [7.0, 50.0]
                            ]
                        ]
                    }
                }
            ]
        };

        const bounds = calculateBoundaryBounds(geoJSON);
        const [[minLng, minLat], [maxLng, maxLat]] = bounds!;

        // Original: lng 7.0-7.1 (width 0.1), lat 50.0-50.1 (height 0.1)
        // Padding: 2.5 * 0.1 = 0.25 on each side

        const expectedMinLng = 7.0 - 0.25; // 6.75
        const expectedMaxLng = 7.1 + 0.25; // 7.35
        const expectedMinLat = 50.0 - 0.25; // 49.75
        const expectedMaxLat = 50.1 + 0.25; // 50.35

        expect(minLng).toBeCloseTo(expectedMinLng, 5);
        expect(maxLng).toBeCloseTo(expectedMaxLng, 5);
        expect(minLat).toBeCloseTo(expectedMinLat, 5);
        expect(maxLat).toBeCloseTo(expectedMaxLat, 5);
    });

    /**
   * Test 8: Real-world example - Bonn boundary
   */
    it('real-world: calculate bounds for city of Bonn', () => {
    // Simplified Bonn boundary (actual boundary is more complex)
        const bonnBoundary = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { name: 'Bonn' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [7.0493, 50.6910], // SW corner
                                [7.1875, 50.6910], // SE corner
                                [7.1875, 50.7748], // NE corner
                                [7.0493, 50.7748], // NW corner
                                [7.0493, 50.6910] // Close ring
                            ]
                        ]
                    }
                }
            ]
        };

        const bounds = calculateBoundaryBounds(bonnBoundary);

        expect(bounds).toBeTruthy();

        const [[minLng, minLat], [maxLng, maxLat]] = bounds!;

        // Should contain Bonn with generous padding
        expect(minLng).toBeLessThan(7.0493);
        expect(maxLng).toBeGreaterThan(7.1875);
        expect(minLat).toBeLessThan(50.6910);
        expect(maxLat).toBeGreaterThan(50.7748);

        // Bounds should be reasonable (not infinity)
        expect(Number.isFinite(minLng)).toBe(true);
        expect(Number.isFinite(maxLng)).toBe(true);
        expect(Number.isFinite(minLat)).toBe(true);
        expect(Number.isFinite(maxLat)).toBe(true);
    });

    /**
   * Test 9: Handle complex MultiPolygon with holes
   */
    it('should handle complex MultiPolygon with holes', () => {
        const geoJSON = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                // Outer ring
                                [
                                    [7.0, 50.0],
                                    [7.5, 50.0],
                                    [7.5, 50.5],
                                    [7.0, 50.5],
                                    [7.0, 50.0]
                                ],
                                // Hole (inner ring)
                                [
                                    [7.2, 50.2],
                                    [7.3, 50.2],
                                    [7.3, 50.3],
                                    [7.2, 50.3],
                                    [7.2, 50.2]
                                ]
                            ]
                        ]
                    }
                }
            ]
        };

        const bounds = calculateBoundaryBounds(geoJSON);

        expect(bounds).toBeTruthy();

        const [[minLng, minLat], [maxLng, maxLat]] = bounds!;

        // Should use outer ring for bounds
        expect(minLng).toBeLessThan(7.0);
        expect(maxLng).toBeGreaterThan(7.5);
        expect(minLat).toBeLessThan(50.0);
        expect(maxLat).toBeGreaterThan(50.5);
    });

    /**
   * Test 10: Edge case - single point (degenerate polygon)
   */
    it('should handle degenerate polygon (single point)', () => {
        const geoJSON = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [7.0, 50.0],
                                [7.0, 50.0],
                                [7.0, 50.0],
                                [7.0, 50.0],
                                [7.0, 50.0]
                            ]
                        ]
                    }
                }
            ]
        };

        const bounds = calculateBoundaryBounds(geoJSON);

        expect(bounds).toBeTruthy();

        // Single point has 0 width/height, so padding is 0
        // Bounds will equal the point itself
        const [[minLng, minLat], [maxLng, maxLat]] = bounds!;

        expect(minLng).toBe(7.0);
        expect(maxLng).toBe(7.0);
        expect(minLat).toBe(50.0);
        expect(maxLat).toBe(50.0);
    });
});
