import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';

import {
    buildFacilityFeatureCollection,
    useMapFacilityLayer
} from '@/composables/map/useMapFacilityLayer';

/**
 * Unit Tests for useMapFacilityLayer
 *
 * The composable:
 * - Builds a GeoJSON FeatureCollection from active facilities
 * - Filters invalid coordinates and facilities with active:false
 * - Adds a dedicated source/layers (facilities-geojson, facility-clusters, ...)
 * - Honors clusterMinPoints from client config (clamped to >= 2)
 *
 * @see /app/composables/map/useMapFacilityLayer.ts
 */

// ============================================================================
// Mock Dependencies
// ============================================================================

const mockClientConfig = ref<any>(null);

vi.stubGlobal('useMarkASpotConfig', () => ({
    clientConfig: computed(() => mockClientConfig.value)
}));

vi.stubGlobal('useMapSettings', () => ({
    clusterMaxZoom: computed(() => 22),
    sourceMaxZoom: computed(() => 23)
}));

vi.stubGlobal('useThemeColors', () => ({
    primaryColor: computed(() => '#3b82f6')
}));

vi.stubGlobal('useColorMode', () => ({ value: 'light' }));

// useMapIcons is only touched inside updateFacilitySource, which we do
// not call in these tests. Provide a stub so imports resolve.
vi.stubGlobal('useMapIcons', () => ({
    loadIcon: vi.fn(async () => undefined),
    isIconLoaded: vi.fn(() => false)
}));

// Minimal MapLibre map mock that tracks addSource/addLayer calls.
// MapLibre's real signatures are wider, but the composable only uses
// getLayer / getSource / addLayer / addSource / setLayoutProperty.
class FakeMap {
    private sources = new Map<string, any>();
    private layers = new Map<string, any>();
    public layoutProps = new Map<string, Record<string, unknown>>();

    getSource(id: string) {
        return this.sources.get(id);
    }

    getLayer(id: string) {
        return this.layers.get(id);
    }

    addSource(id: string, spec: any) {
        this.sources.set(id, { id, ...spec, setData: vi.fn() });
    }

    addLayer(layer: any) {
        this.layers.set(layer.id, layer);
    }

    setLayoutProperty(layerId: string, key: string, value: unknown) {
        if (!this.layers.has(layerId)) return;
        const props = this.layoutProps.get(layerId) ?? {};
        props[key] = value;
        this.layoutProps.set(layerId, props);
    }
}

// ============================================================================
// buildFacilityFeatureCollection
// ============================================================================

describe('buildFacilityFeatureCollection', () => {
    it('builds features from facility list', () => {
        const result = buildFacilityFeatureCollection([
            { id: 'a', label: 'A', lat: 52.1, lng: 4.3, address: 'Addr A' },
            { id: 'b', label: 'B', lat: 52.2, lng: 4.4 }
        ]);

        expect(result.type).toBe('FeatureCollection');
        expect(result.features).toHaveLength(2);
        expect(result.features[0]!.geometry.coordinates).toEqual([4.3, 52.1]);
        expect(result.features[0]!.properties.id).toBe('a');
        expect(result.features[0]!.properties.label).toBe('A');
        expect(result.features[0]!.properties.address).toBe('Addr A');
        expect(result.features[1]!.properties.address).toBe('');
    });

    it('drops facilities with invalid coordinates', () => {
        const result = buildFacilityFeatureCollection([
            { id: 'ok', label: 'OK', lat: 52.1, lng: 4.3 },
            { id: 'nan', label: 'NaN', lat: Number.NaN, lng: 4.3 },
            { id: 'str', label: 'Str', lat: 'abc' as any, lng: 4.3 },
            { id: 'inf', label: 'Inf', lat: 52.1, lng: Number.POSITIVE_INFINITY }
        ]);

        expect(result.features).toHaveLength(1);
        expect(result.features[0]!.properties.id).toBe('ok');
    });

    it('coerces numeric lat/lng strings', () => {
        const result = buildFacilityFeatureCollection([
            { id: 'str', label: 'Str', lat: '52.1' as any, lng: '4.3' as any }
        ]);

        expect(result.features).toHaveLength(1);
        expect(result.features[0]!.geometry.coordinates).toEqual([4.3, 52.1]);
    });

    it('returns empty FeatureCollection for empty input', () => {
        const result = buildFacilityFeatureCollection([]);
        expect(result.features).toEqual([]);
    });

    it('forwards optional icon/description/url through feature properties (#381)', () => {
        const result = buildFacilityFeatureCollection([
            {
                id: 'school',
                label: 'School',
                lat: 52.5,
                lng: 13.4,
                icon: 'lucide:school',
                description: 'Open Mon–Fri 8am–4pm',
                url: 'https://school.example.org'
            }
        ]);

        const props = result.features[0]!.properties as Record<string, string>;
        // NB: keyed `iconName` (not `icon`) to avoid collision with the
        // map-symbol id stamped in updateFacilitySource — see layer source.
        expect(props.iconName).toBe('lucide:school');
        expect(props.description).toBe('Open Mon–Fri 8am–4pm');
        expect(props.url).toBe('https://school.example.org');
    });

    it('omits empty optional metadata as empty strings', () => {
        const result = buildFacilityFeatureCollection([
            { id: 'a', label: 'A', lat: 52.1, lng: 4.3 }
        ]);
        const props = result.features[0]!.properties as Record<string, string>;
        expect(props.iconName).toBe('');
        expect(props.description).toBe('');
        expect(props.url).toBe('');
    });

    it('formats structured FacilityAddress via formatFacilityAddress (no [object Object])', () => {
        const result = buildFacilityFeatureCollection([
            {
                id: 'school',
                label: 'School',
                lat: 52.5,
                lng: 13.4,
                address: {
                    address_line1: 'Parkstraße 1',
                    country_code: 'DE',
                    locality: 'Berlin',
                    postal_code: '10115'
                }
            }
        ], 'de');

        expect(result.features[0]!.properties.address).toBe('Parkstraße 1, 10115 Berlin');
        expect(result.features[0]!.properties.address).not.toContain('[object Object]');
    });
});

// ============================================================================
// useMapFacilityLayer: source + layer registration
// ============================================================================

describe('useMapFacilityLayer', () => {
    beforeEach(() => {
        mockClientConfig.value = null;
    });

    it('exposes stable layer ids', () => {
        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);

        expect(layer.sourceId).toBe('facilities-geojson');
        expect(layer.symbolLayerId).toBe('facilities-symbols');
        expect(layer.clusterLayerId).toBe('facility-clusters');
        expect(layer.clusterCountLayerId).toBe('facility-cluster-count');
    });

    it('addFacilitySource registers a clustered geojson source', () => {
        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);

        layer.addFacilitySource();
        const source = map.getSource('facilities-geojson');

        expect(source).toBeDefined();
        expect(source.type).toBe('geojson');
        expect(source.cluster).toBe(true);
        expect(source.clusterRadius).toBe(50);
        expect(source.clusterMaxZoom).toBe(22);
        expect(source.maxzoom).toBe(23);
        expect(source.clusterMinPoints).toBe(2);
    });

    it('addFacilitySource is idempotent', () => {
        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);

        layer.addFacilitySource();
        const first = map.getSource('facilities-geojson');
        layer.addFacilitySource();
        const second = map.getSource('facilities-geojson');

        expect(first).toBe(second); // Same object reference = not recreated
    });

    it('addFacilityLayers registers the three layers', () => {
        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);

        layer.addFacilitySource();
        layer.addFacilityLayers();

        expect(map.getLayer('facility-clusters')).toBeDefined();
        expect(map.getLayer('facility-cluster-count')).toBeDefined();
        expect(map.getLayer('facilities-symbols')).toBeDefined();
    });

    it('addFacilityLayers is a no-op when source missing', () => {
        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);

        // Note: no addFacilitySource() call
        layer.addFacilityLayers();

        expect(map.getLayer('facility-clusters')).toBeUndefined();
        expect(map.getLayer('facilities-symbols')).toBeUndefined();
    });

    it('filters active facilities from client config', () => {
        mockClientConfig.value = {
            facilities: {
                enabled: true,
                mode: 'exclusive',
                items: [
                    { id: 'a', label: 'A', lat: 52.1, lng: 4.3 },
                    { id: 'b', label: 'B', lat: 52.2, lng: 4.4, active: false },
                    { id: 'c', label: 'C', lat: 52.3, lng: 4.5, active: true }
                ]
            }
        };

        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);

        expect(layer.activeFacilities.value).toHaveLength(2);
        expect(layer.activeFacilities.value.map(f => f.id)).toEqual(['a', 'c']);
    });

    it('returns empty active list when facilities config is absent', () => {
        mockClientConfig.value = { facilities: undefined };
        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);

        expect(layer.activeFacilities.value).toEqual([]);
    });

    it('honors clusterMinPoints override from client config', () => {
        mockClientConfig.value = {
            facilities: {
                enabled: true,
                clusterMinPoints: 5,
                items: []
            }
        };

        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);
        layer.addFacilitySource();

        const source = map.getSource('facilities-geojson');
        expect(source.clusterMinPoints).toBe(5);
    });

    it('clamps invalid clusterMinPoints to default', () => {
        mockClientConfig.value = {
            facilities: {
                enabled: true,
                clusterMinPoints: 1, // Below MapLibre minimum
                items: []
            }
        };

        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);
        layer.addFacilitySource();

        const source = map.getSource('facilities-geojson');
        expect(source.clusterMinPoints).toBe(2);
    });

    // -----------------------------------------------------------------
    // setLayersVisibility (issue #402)
    //
    // The map hides facility badges while the user has any report-list
    // filter active so admin-curated facilities don't read as "filtered
    // reports". The composable owns the layer ids — the helper toggles
    // them all in one call and remains a no-op for layers that haven't
    // been initialised yet (the map re-applies after init).
    // -----------------------------------------------------------------

    it('setLayersVisibility flips visibility on every facility layer', () => {
        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);
        layer.addFacilitySource();
        layer.addFacilityLayers();

        layer.setLayersVisibility(false);

        const ids = [
            layer.symbolLayerId,
            layer.clusterLayerId,
            layer.clusterCountLayerId,
            layer.selectedHaloLayerId
        ];
        for (const id of ids) {
            expect(map.layoutProps.get(id)?.visibility).toBe('none');
        }

        layer.setLayersVisibility(true);
        for (const id of ids) {
            expect(map.layoutProps.get(id)?.visibility).toBe('visible');
        }
    });

    it('setLayersVisibility is a no-op before layers exist', () => {
        const map = new FakeMap();
        const layer = useMapFacilityLayer(map as any);

        // Layers not initialised yet — must not throw and must not
        // record any layout properties (FakeMap.setLayoutProperty bails
        // when getLayer returns undefined).
        expect(() => layer.setLayersVisibility(false)).not.toThrow();
        expect(map.layoutProps.size).toBe(0);
    });
});
