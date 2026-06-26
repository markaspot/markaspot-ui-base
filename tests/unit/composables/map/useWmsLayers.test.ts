import { describe, it, expect, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { WmsLayerConfig } from '@/composables/map/useWmsLayers';
import {
    resolveWmsVisibility,
    filterWmsLayersForCitizen,
    buildWmsLegendUrl,
    getWmsLegendAlt,
    getWmsLegendUnavailableText,
    addWmsLayerToMap
} from '@/composables/map/useWmsLayers';

/**
 * Unit Tests for WMS layer visibility resolution.
 *
 * Covers the per-layer `visibility` field with three tiers and the
 * back-compat mapping from the deprecated `requireAuth` boolean:
 *
 *   effective = visibility ?? (requireAuth ? 'authenticated' : 'public')
 *
 * The citizen filter (`filterWmsLayersForCitizen`) only knows whether the
 * visitor is authenticated — it has no role concept:
 *   - 'public'        → always shown
 *   - 'authenticated' → only when isAuthenticated
 *   - 'staff'         → never on the citizen map
 *
 * @see /app/composables/map/useWmsLayers.ts
 */

// ============================================================================
// Test helpers
// ============================================================================

function makeLayer(partial: Partial<WmsLayerConfig> & { id: string }): WmsLayerConfig {
    return {
        title: partial.id,
        layerName: `layer_${partial.id}`,
        enabled: true,
        ...partial
    };
}

// ============================================================================
// resolveWmsVisibility
// ============================================================================

describe('resolveWmsVisibility', () => {
    it('returns the explicit visibility when set', () => {
        expect(resolveWmsVisibility({ visibility: 'public' })).toBe('public');
        expect(resolveWmsVisibility({ visibility: 'authenticated' })).toBe('authenticated');
        expect(resolveWmsVisibility({ visibility: 'staff' })).toBe('staff');
    });

    it('explicit visibility wins over requireAuth', () => {
        // A modern config that also still carries the legacy flag.
        expect(resolveWmsVisibility({ visibility: 'staff', requireAuth: false })).toBe('staff');
        expect(resolveWmsVisibility({ visibility: 'public', requireAuth: true })).toBe('public');
    });

    describe('requireAuth back-compat mapping', () => {
        it('maps requireAuth: true to "authenticated"', () => {
            expect(resolveWmsVisibility({ requireAuth: true })).toBe('authenticated');
        });

        it('maps requireAuth: false to "public"', () => {
            expect(resolveWmsVisibility({ requireAuth: false })).toBe('public');
        });

        it('maps a missing requireAuth (legacy public layer) to "public"', () => {
            expect(resolveWmsVisibility({})).toBe('public');
        });
    });
});

// ============================================================================
// filterWmsLayersForCitizen — all three values × anonymous/authenticated
// ============================================================================

describe('filterWmsLayersForCitizen', () => {
    const layers: WmsLayerConfig[] = [
        makeLayer({ id: 'pub', visibility: 'public' }),
        makeLayer({ id: 'auth', visibility: 'authenticated' }),
        makeLayer({ id: 'staff', visibility: 'staff' })
    ];

    it('anonymous visitor sees only public layers', () => {
        const result = filterWmsLayersForCitizen(layers, false);
        expect(result.map(l => l.id)).toEqual(['pub']);
    });

    it('authenticated visitor sees public + authenticated layers', () => {
        const result = filterWmsLayersForCitizen(layers, true);
        expect(result.map(l => l.id)).toEqual(['pub', 'auth']);
    });

    it('staff layers are never shown on the citizen map, even when authenticated', () => {
        const result = filterWmsLayersForCitizen(layers, true);
        expect(result.some(l => l.id === 'staff')).toBe(false);
    });

    it('returns an empty list when no layers are configured', () => {
        expect(filterWmsLayersForCitizen([], true)).toEqual([]);
        expect(filterWmsLayersForCitizen([], false)).toEqual([]);
    });

    describe('back-compat: requireAuth-based configs', () => {
        const legacyLayers: WmsLayerConfig[] = [
            makeLayer({ id: 'legacy-public' }), // no requireAuth, no visibility
            makeLayer({ id: 'legacy-public-explicit', requireAuth: false }),
            makeLayer({ id: 'legacy-auth', requireAuth: true })
        ];

        it('anonymous visitor sees only the legacy public layers', () => {
            const result = filterWmsLayersForCitizen(legacyLayers, false);
            expect(result.map(l => l.id)).toEqual(['legacy-public', 'legacy-public-explicit']);
        });

        it('authenticated visitor also sees the legacy requireAuth layer', () => {
            const result = filterWmsLayersForCitizen(legacyLayers, true);
            expect(result.map(l => l.id)).toEqual([
                'legacy-public',
                'legacy-public-explicit',
                'legacy-auth'
            ]);
        });
    });

    it('handles a mixed legacy + new config correctly', () => {
        const mixed: WmsLayerConfig[] = [
            makeLayer({ id: 'new-public', visibility: 'public' }),
            makeLayer({ id: 'new-staff', visibility: 'staff' }),
            makeLayer({ id: 'legacy-auth', requireAuth: true }),
            makeLayer({ id: 'legacy-public' })
        ];

        expect(filterWmsLayersForCitizen(mixed, false).map(l => l.id))
            .toEqual(['new-public', 'legacy-public']);
        expect(filterWmsLayersForCitizen(mixed, true).map(l => l.id))
            .toEqual(['new-public', 'legacy-auth', 'legacy-public']);
    });
});

// ============================================================================
// buildWmsLegendUrl
// ============================================================================

describe('buildWmsLegendUrl', () => {
    it('builds a proxied GetLegendGraphic URL with jurisdiction routing', () => {
        const url = buildWmsLegendUrl('v_denkmalsatzung_p_33036', 'bonn-mobility');
        const params = new URL(url, 'https://example.test').searchParams;

        expect(url).toContain('/api/wms?');
        expect(params.get('REQUEST')).toBe('GetLegendGraphic');
        expect(params.get('LAYER')).toBe('v_denkmalsatzung_p_33036');
        expect(params.get('STYLE')).toBe('');
        expect(params.get('format')).toBe('image/png');
        expect(params.get('jurisdiction')).toBe('bonn-mobility');
        expect(params.has('layers')).toBe(false);
        expect(params.has('bbox')).toBe(false);
    });
});

describe('WMS legend text helpers', () => {
    it('uses layer-title fallbacks unless the jurisdiction layer config overrides them', () => {
        const layer = makeLayer({ id: 'denkmal', title: 'Denkmalbereiche' });

        expect(getWmsLegendAlt(layer)).toBe('Denkmalbereiche');
        expect(getWmsLegendUnavailableText(layer)).toBe('Denkmalbereiche');

        expect(getWmsLegendAlt({
            ...layer,
            legendAlt: 'Kartenlegende Denkmalbereiche'
        })).toBe('Kartenlegende Denkmalbereiche');
        expect(getWmsLegendUnavailableText({
            ...layer,
            legendUnavailableText: 'Legende derzeit nicht verfügbar.'
        })).toBe('Legende derzeit nicht verfügbar.');
    });
});

// ============================================================================
// addWmsLayerToMap — shared layer construction (stub MapLibre map)
// ============================================================================

/**
 * Minimal MapLibre map stub: tracks added sources/layers and lets a test
 * pre-seed an existing source to exercise the collision early-return.
 */
function createStubMap(existingSources: string[] = []) {
    const sources = new Set<string>(existingSources);
    const addSource = vi.fn((id: string) => sources.add(id));
    const addLayer = vi.fn();
    const getSource = vi.fn((id: string) => (sources.has(id) ? {} : undefined));
    return {
        map: { addSource, addLayer, getSource } as unknown as MapLibreMap,
        addSource,
        addLayer,
        getSource
    };
}

describe('addWmsLayerToMap', () => {
    it('returns true and adds a source + layer for a new layer', () => {
        const stub = createStubMap();
        const layer = makeLayer({ id: 'bike', layerName: 'v_bike_27582' });

        const result = addWmsLayerToMap(stub.map, layer);

        expect(result).toBe(true);
        expect(stub.addSource).toHaveBeenCalledTimes(1);
        expect(stub.addLayer).toHaveBeenCalledTimes(1);
        expect(stub.addSource).toHaveBeenCalledWith(
            'wms-source-bike',
            expect.objectContaining({ type: 'raster', tileSize: 256 })
        );
    });

    it('returns false and adds nothing when the source already exists', () => {
        const stub = createStubMap(['wms-source-bike']);
        const layer = makeLayer({ id: 'bike' });

        const result = addWmsLayerToMap(stub.map, layer);

        expect(result).toBe(false);
        expect(stub.addSource).not.toHaveBeenCalled();
        expect(stub.addLayer).not.toHaveBeenCalled();
    });

    it('forwards beforeLayerId as the second arg to map.addLayer', () => {
        const stub = createStubMap();
        const layer = makeLayer({ id: 'bike' });

        addWmsLayerToMap(stub.map, layer, { beforeLayerId: 'reports-heat' });

        expect(stub.addLayer).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'wms-layer-bike' }),
            'reports-heat'
        );
    });

    it('passes undefined beforeLayerId when none is given', () => {
        const stub = createStubMap();
        addWmsLayerToMap(stub.map, makeLayer({ id: 'bike' }));

        expect(stub.addLayer).toHaveBeenCalledWith(expect.anything(), undefined);
    });

    it('applies opacity/zoom defaults when the config omits them', () => {
        const stub = createStubMap();
        // makeLayer omits opacity/minZoom/maxZoom
        addWmsLayerToMap(stub.map, makeLayer({ id: 'bike' }));

        const layerArg = stub.addLayer.mock.calls[0]![0];
        expect(layerArg.minzoom).toBe(10);
        expect(layerArg.maxzoom).toBe(20);
        expect(layerArg.paint['raster-opacity']).toBe(0.7);
        expect(layerArg.layout.visibility).toBe('visible'); // enabled: true
    });

    it('honours explicit opacity/zoom and disabled (enabled: false) config', () => {
        const stub = createStubMap();
        const layer = makeLayer({
            id: 'bike',
            enabled: false,
            opacity: 0.3,
            minZoom: 8,
            maxZoom: 18
        });

        addWmsLayerToMap(stub.map, layer);

        const layerArg = stub.addLayer.mock.calls[0]![0];
        expect(layerArg.minzoom).toBe(8);
        expect(layerArg.maxzoom).toBe(18);
        expect(layerArg.paint['raster-opacity']).toBe(0.3);
        expect(layerArg.layout.visibility).toBe('none');
    });

    it('includes the jurisdiction id in the tile URL when provided', () => {
        const stub = createStubMap();
        addWmsLayerToMap(stub.map, makeLayer({ id: 'bike', layerName: 'v_bike' }), {
            jurisdictionId: 7
        });

        const sourceArg = stub.addSource.mock.calls[0]![1] as { tiles: string[] };
        expect(sourceArg.tiles[0]).toContain('jurisdiction=7');
        expect(sourceArg.tiles[0]).toContain('layers=v_bike');
    });
});
