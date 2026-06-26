import type { GeoJSONSource, GeoJSONSourceSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { FacilityConfigItem } from '~~/types/clientConfig';
import { formatFacilityAddress } from '@/utils/facilityAddress';

/**
 * Facility Map Layer Composable
 *
 * Renders admin-curated facility locations on the map as a separate
 * symbol/cluster layer so they never collide with citizen-report markers.
 *
 * Uses its own GeoJSON source (`facilities-geojson`) with MapLibre native
 * clustering. The layers are:
 *  - `facility-clusters` (circle) + `facility-cluster-count` (symbol)
 *  - `facilities-symbols` (symbol with pin icon)
 *
 * The composable itself does NOT decide whether facilities should render —
 * that is the caller's responsibility (respect `mode === 'disabled'` and
 * `enabled === false` in `ClientConfig.facilities`). If the layer is
 * initialized and the configured facility list is empty, the source holds
 * an empty FeatureCollection and no icons appear.
 */

// Badge icon registered by useMapIcons pipeline with `shape: 'badge'`. The
// flat rounded-square + building icon distinguishes facilities from the
// drop-pin shape used for citizen reports, so the map UI grammar reads as
// "permanent location" vs. "individual event" at a glance.
const FACILITY_ICON_NAME = 'lucide-building-2';

// Default cluster threshold. Can be overridden per-jurisdiction via
// `facilities.clusterMinPoints` in the client config (see types/clientConfig.ts).
const DEFAULT_FACILITY_CLUSTER_MIN_POINTS = 2;

export interface FacilityLayerRefs {
    sourceId: string
    symbolLayerId: string
    clusterLayerId: string
    clusterCountLayerId: string
    selectedHaloLayerId: string
}

/**
 * Convert active facilities to a GeoJSON FeatureCollection with
 * coordinates and metadata suitable for click/hover handlers.
 * Filters out facilities with invalid coordinates. The caller is
 * responsible for filtering by `active !== false` before passing
 * the list in.
 *
 * `locale` controls how a structured FacilityAddress is rendered into the
 * `address` property MapLibre exposes to popup templates. Without
 * locale-aware formatting, a structured object would coerce to
 * `[object Object]` via `String(facility.address)`. Defaults to `'en'` so
 * tests and non-i18n callers still get a readable string.
 */
export function buildFacilityFeatureCollection(facilities: FacilityConfigItem[], locale: string = 'en') {
    const features = facilities
        .filter((facility) => {
            const lat = Number(facility.lat);
            const lng = Number(facility.lng);
            return Number.isFinite(lat) && Number.isFinite(lng);
        })
        .map(facility => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [Number(facility.lng), Number(facility.lat)] as [number, number]
            },
            properties: {
                id: String(facility.id),
                label: String(facility.label || ''),
                address: formatFacilityAddress(facility.address, locale),
                organisationId: facility.organisationId ? String(facility.organisationId) : '',
                // Optional metadata (#381). Forwarded to the hover popup
                // template; not consumed by the symbol layer itself.
                // NB: keyed `iconName` (not `icon`) because `properties.icon`
                // is reserved for the registered map-symbol id stamped by
                // updateFacilitySource() and consumed by the layer's
                // `icon-image: ['get', 'icon']` expression.
                iconName: facility.icon ? String(facility.icon) : '',
                description: facility.description ? String(facility.description) : '',
                url: facility.url ? String(facility.url) : ''
            }
        }));

    return {
        type: 'FeatureCollection' as const,
        features
    };
}

export function useMapFacilityLayer(map: MapLibreMap) {
    const sourceId = 'facilities-geojson';
    const symbolLayerId = 'facilities-symbols';
    const clusterLayerId = 'facility-clusters';
    const clusterCountLayerId = 'facility-cluster-count';
    // Circle layer drawn BEHIND the badge to indicate the currently
    // selected facility. Controlled via `setSelectedFacilityId()` which
    // swaps the layer filter between a real id and a sentinel that
    // matches nothing.
    const selectedHaloLayerId = 'facility-selected-halo';
    const NO_SELECTION_SENTINEL = '__none__';

    const { primaryColor } = useThemeColors();
    const { clientConfig } = useMarkASpotConfig();
    const { clusterMaxZoom, sourceMaxZoom } = useMapSettings();
    // We can't call useI18n() here: useMapFacilityLayer is invoked from
    // useMap → runInitialization, which runs after an `await` in
    // useMapLoadHandler — outside Vue's synchronous setup window. Vue I18n's
    // `useI18n()` uses Vue's `inject()`, which throws "Must be called at the
    // top of a setup function" once the setup window has closed. We resolve
    // the locale lazily inside updateFacilitySource() instead.
    //
    // Trade-off: address text on existing badges does NOT refresh on a bare
    // language switch — resolveLocale() runs only when updateFacilitySource()
    // does (i.e. when the active facility set changes). Acceptable today
    // because formatFacilityAddress only diverges for Italian (appended
    // country code) and the badge popup template re-renders via its own
    // setup-bound useI18n on language switch. Revisit by passing a
    // setup-bound `Ref<string>` locale into this composable from useMap if
    // we add tenants in locales whose ordering differs from EN/DE/NL/FR.
    const resolveLocale = (): string => {
        try {
            const nuxtApp = useNuxtApp();
            const resolved = unref(nuxtApp.$i18n?.locale) as string | undefined;
            return resolved || clientConfig.value?.languages?.default || 'en';
        } catch (err) {
            // Expected when called outside Vue setup (e.g. after an async await).
            // Log a dev warning for any error that is NOT the inject-outside-setup case
            // so real i18n wiring failures are observable.
            if (import.meta.dev) {
                const msg = err instanceof Error ? err.message : String(err);
                if (!msg.includes('inject') && !msg.includes('setup')) {
                    console.warn('[FacilityLayer] resolveLocale: unexpected i18n error, falling back to default locale', err);
                }
            }
            return clientConfig.value?.languages?.default || 'en';
        }
    };

    const clusterMinPoints = computed(() => {
        const configured = clientConfig.value?.facilities?.clusterMinPoints;
        if (typeof configured === 'number' && Number.isFinite(configured) && configured >= 2) {
            return Math.floor(configured);
        }
        return DEFAULT_FACILITY_CLUSTER_MIN_POINTS;
    });

    /**
     * Filter facilities to only active ones (admin-curated list may
     * include soft-disabled items that should render in dashboards but
     * not on the public map).
     */
    const activeFacilities = computed<FacilityConfigItem[]>(() => {
        const items = clientConfig.value?.facilities?.items || [];
        return items.filter(item => item.active !== false);
    });

    const addFacilitySource = () => {
        if (map.getSource(sourceId)) return;

        const sourceConfig: GeoJSONSourceSpecification = {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            },
            cluster: true,
            // Same pixel radius as report clustering so visually consistent.
            clusterRadius: 50,
            clusterMaxZoom: clusterMaxZoom.value,
            clusterMinPoints: clusterMinPoints.value,
            // MapLibre requires source maxzoom strictly greater than
            // clusterMaxZoom; without this the GeoJSON-source default
            // of 18 caps clustering and triggers a runtime warning.
            maxzoom: sourceMaxZoom.value
        };

        try {
            map.addSource(sourceId, sourceConfig);
        } catch (error) {
            console.error('Error adding facilities-geojson source:', error);
        }
    };

    const addFacilityLayers = () => {
        if (!map.getSource(sourceId)) {
            // Defensive: caller should call addFacilitySource first, but if
            // the source is missing we skip silently to avoid a throw that
            // would break the whole map init chain.
            return;
        }

        // Cluster circle (drawn below the symbol layers)
        if (!map.getLayer(clusterLayerId)) {
            map.addLayer({
                id: clusterLayerId,
                type: 'circle',
                source: sourceId,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#ffffff',
                    'circle-radius': [
                        'step', ['get', 'point_count'],
                        20,
                        100, 30,
                        750, 40
                    ],
                    'circle-opacity': 1,
                    'circle-stroke-width': 4,
                    // Use primary color to visually pair with report clusters
                    // (report clusters use stroke-width: 10).
                    // Narrower stroke keeps facility clusters distinct at a glance.
                    'circle-stroke-color': primaryColor.value,
                    'circle-stroke-opacity': 0.9
                }
            });
        }

        // Cluster count label
        if (!map.getLayer(clusterCountLayerId)) {
            map.addLayer({
                id: clusterCountLayerId,
                type: 'symbol',
                source: sourceId,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['Noto Sans Regular'],
                    'text-size': 14
                },
                paint: {
                    'text-color': primaryColor.value,
                    'text-opacity': 1
                }
            });
        }

        // Selected-state halo: wider, semi-transparent ring drawn BEHIND
        // the facility badge for the currently selected facility. Filter
        // is flipped between a real id and NO_SELECTION_SENTINEL so no
        // feature matches when nothing is selected. Kept filtered to
        // non-clustered features — a halo around a cluster would be
        // visually confusing since the cluster itself represents >1 pin.
        //
        // Paint values were tuned against the dark basemap + flat badge
        // combination: radius 28 gives ~6px of visible ring around the
        // 32px badge, fill opacity 0.28 is dense enough to read without
        // tinting the badge underneath, stroke 3px @ full opacity gives
        // a crisp outer edge. Weaker values (tried 0.12/2px first) were
        // imperceptible on both OpenFreeMap light + dark styles.
        if (!map.getLayer(selectedHaloLayerId)) {
            map.addLayer({
                id: selectedHaloLayerId,
                type: 'circle',
                source: sourceId,
                filter: ['all',
                    ['!', ['has', 'point_count']],
                    ['==', ['get', 'id'], NO_SELECTION_SENTINEL]
                ],
                paint: {
                    'circle-radius': 28,
                    'circle-color': primaryColor.value,
                    'circle-opacity': 0.28,
                    'circle-stroke-color': primaryColor.value,
                    'circle-stroke-width': 3,
                    'circle-stroke-opacity': 1
                }
            });
        }

        // Individual facility badge (non-clustered features only). Anchor
        // is 'center' (not 'bottom' like report pins) because the badge
        // is a flat square, not a drop-pin with a stem tip to anchor on.
        if (!map.getLayer(symbolLayerId)) {
            map.addLayer({
                id: symbolLayerId,
                type: 'symbol',
                source: sourceId,
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': ['get', 'icon'],
                    'icon-size': 1.0,
                    'icon-anchor': 'center',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                },
                paint: {
                    'icon-opacity': 1
                }
            });
        }
    };

    /**
     * Toggle visibility of all facility layers (badge, clusters, count,
     * halo) in one call. Used to subordinate facility rendering to the
     * active report-list filter scope (issue #402): when the user
     * filters reports, facility badges are hidden so they don't read as
     * "filtered reports". No-op for layers that don't exist yet —
     * useMap.ts re-applies after `initializeFacilityLayer()`.
     */
    const setLayersVisibility = (visible: boolean) => {
        const value = visible ? 'visible' : 'none';
        const ids = [symbolLayerId, clusterLayerId, clusterCountLayerId, selectedHaloLayerId];
        for (const id of ids) {
            if (map.getLayer(id)) {
                map.setLayoutProperty(id, 'visibility', value);
            }
        }
    };

    /**
     * Update the halo filter to highlight a specific facility id (or
     * nothing if `id` is null/undefined). No-op if the layer doesn't
     * exist yet — the watcher in useMap.ts will fire again once the
     * layer is initialized.
     */
    const setSelectedFacilityId = (id: string | null | undefined) => {
        if (!map.getLayer(selectedHaloLayerId)) return;
        const target = id && id.length > 0 ? id : NO_SELECTION_SENTINEL;
        map.setFilter(selectedHaloLayerId, ['all',
            ['!', ['has', 'point_count']],
            ['==', ['get', 'id'], target]
        ]);
    };

    /**
     * Register the facility badge icon (if not already loaded) and push
     * the active facilities into the source as GeoJSON features.
     */
    const updateFacilitySource = async () => {
        const source = map.getSource(sourceId) as GeoJSONSource | undefined;
        if (!source) return;

        // Register badge icon once using the shared useMapIcons pipeline.
        // The icon id is stable across facilities so we reuse it for all
        // features (icon-image uses a constant expression below).
        const { loadIcon, isIconLoaded, getIconId } = useMapIcons(map);
        const fillColor = primaryColor.value;
        if (!isIconLoaded(FACILITY_ICON_NAME, fillColor, 'badge')) {
            await loadIcon(FACILITY_ICON_NAME, fillColor, 'badge');
        }

        // Single source-of-truth for the iconId — the facility layer used
        // to hand-build this string, which drifted when the underlying
        // naming scheme changed. Always ask the pipeline for the id.
        const iconId = getIconId(FACILITY_ICON_NAME, fillColor, 'badge');

        const collection = buildFacilityFeatureCollection(activeFacilities.value, resolveLocale());
        // Stamp each feature with the resolved icon id so the symbol
        // layer's `['get', 'icon']` expression resolves correctly.
        const features = collection.features.map(feature => ({
            ...feature,
            properties: {
                ...feature.properties,
                icon: iconId
            }
        }));

        source.setData({
            type: 'FeatureCollection',
            features
        });
    };

    /**
     * Full init: add source, add layers, populate source. Safe to call
     * multiple times (all operations are idempotent).
     */
    const initializeFacilityLayer = async () => {
        addFacilitySource();
        addFacilityLayers();
        await updateFacilitySource();
    };

    /**
     * Remove all facility layers and the GeoJSON source from the map.
     *
     * Should be called from useMap's cleanup() on map teardown. Layers must
     * be removed before the source; MapLibre throws if a layer referencing a
     * source is still present when the source is removed. No-ops gracefully
     * for layers/source that were never added.
     */
    const teardown = () => {
        const layerIds = [selectedHaloLayerId, symbolLayerId, clusterCountLayerId, clusterLayerId];
        for (const id of layerIds) {
            if (map.getLayer(id)) {
                map.removeLayer(id);
            }
        }
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
        }
    };

    return {
        sourceId,
        symbolLayerId,
        clusterLayerId,
        clusterCountLayerId,
        selectedHaloLayerId,
        activeFacilities,
        addFacilitySource,
        addFacilityLayers,
        updateFacilitySource,
        setSelectedFacilityId,
        setLayersVisibility,
        initializeFacilityLayer,
        teardown
    };
}
