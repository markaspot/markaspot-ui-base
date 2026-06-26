import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, computed } from 'vue';
import { clearNuxtState } from '../../__mocks__/nuxt';
import { useBoundaryValidator } from '@/composables/map/useBoundaryValidator';

// useBoundaryValidator pulls in two app composables plus useAppConfig; stub them
// so we can exercise the pure geometry path (isPointInBoundary) in isolation.
// Declared via vi.hoisted so the hoisted vi.mock factories can reference it.
const { fetchBoundary } = vi.hoisted(() => ({ fetchBoundary: vi.fn(async () => undefined) }));

vi.mock('@/composables/core/useMarkASpotConfig', () => ({
    useMarkASpotConfig: () => ({
        isReady: computed(() => true),
        currentJurisdictionId: ref('1')
    })
}));
vi.mock('@/composables/core/useMarkASpotSettings', () => ({
    useMarkASpotSettings: () => ({
        boundary: ref(null),
        fetchBoundary
    })
}));

// Auto-imported in Nuxt; provide minimal stubs the composable reads.
globalThis.useAppConfig = () => ({ features: { boundaries: {} } });

/**
 * A square exterior ring (0,0)-(10,10) with a square hole (4,4)-(6,6).
 * Coordinates are [lng, lat].
 */
function squareWithHole() {
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [
                    // exterior ring
                    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                    // hole
                    [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]
                ]
            }
        }]
    };
}

function multiPolygonWithHole() {
    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                        [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]
                    ]
                ]
            }
        }]
    };
}

/** Seed the useState-backed boundary singleton and clear the loading flag. */
function seedBoundary(data: any) {
    useState('boundary-data', () => null).value = data;
    useState('boundary-loading', () => true).value = false;
    useState('boundary-loading-guard', () => false).value = false;
    useState('boundary-error', () => null).value = null;
}

describe('useBoundaryValidator hole handling', () => {
    beforeEach(() => {
        clearNuxtState();
        vi.clearAllMocks();
        // The composable's immediate watcher may call loadBoundaries() across
        // state resets; stub fetch so it never hits the network in tests.
        globalThis.fetch = vi.fn(async () => ({
            ok: true,
            json: async () => squareWithHole()
        })) as unknown as typeof fetch;
    });

    it('treats a point inside the exterior ring as inside (Polygon)', () => {
        seedBoundary(squareWithHole());
        const { isPointInBoundary } = useBoundaryValidator();
        // (2, 2) is inside the exterior ring, outside the hole.
        expect(isPointInBoundary(2, 2)).toBe(true);
    });

    it('rejects a point that falls inside a hole (Polygon)', () => {
        seedBoundary(squareWithHole());
        const { isPointInBoundary } = useBoundaryValidator();
        // (5, 5) sits inside the hole -> must be rejected, matching backend.
        expect(isPointInBoundary(5, 5)).toBe(false);
    });

    it('rejects a point outside the exterior ring (Polygon)', () => {
        seedBoundary(squareWithHole());
        const { isPointInBoundary } = useBoundaryValidator();
        expect(isPointInBoundary(20, 20)).toBe(false);
    });

    it('rejects a point inside a hole for MultiPolygon', () => {
        seedBoundary(multiPolygonWithHole());
        const { isPointInBoundary } = useBoundaryValidator();
        expect(isPointInBoundary(5, 5)).toBe(false);
        // Sanity: a point in the ring but outside the hole stays inside.
        expect(isPointInBoundary(2, 2)).toBe(true);
    });
});
