import type { GeoJSONSourceSpecification, Map as MapLibreMap, MapLayerMouseEvent, MapMouseEvent, Marker as MapLibreMarker, Popup as MapLibrePopup } from 'maplibre-gl';
import type { FacilityConfigItem } from '~~/types/clientConfig';
import { useHeatmap } from './useHeatmap';
import { useClusters } from './useClusters';
import { useMarkers } from './useMarkers';
import { useSpiderfy } from './useSpiderfy';
import { useMapClickGuard } from './useMapClickGuard';
import { useWmsLayers } from './useWmsLayers';
import { useMapSettings } from './useMapSettings';
import { useMapFacilityLayer } from './useMapFacilityLayer';
import { PIN_PULSE_CENTER_OFFSET } from './useMapIcons';
import { useMapFacilitySelection } from '@/composables/features/useMapFacilitySelection';

/**
 * Map Composable
 *
 * Core map functionality including initialization, event handling, and layer management.
 *
 * @returns Reactive state and methods for map functionality
 */

import type { Request } from '~~/types';

/**
 * Per-instance map state stored in a WeakMap so we avoid monkey-patching
 * the MapLibre Map prototype or casting to `any` for private state.
 */
interface MasMapState {
    initialized: boolean
    dblClickHandler: ((e: MapMouseEvent) => void) | null
}
const masMapState = new WeakMap<MapLibreMap, MasMapState>();

interface MapProps {
    markers: Request[]
    readOnly?: boolean
    /**
     * True when ANY report-list filter (status, time, or category) is
     * active. While set, the facility layer is hidden so admin-curated
     * facility badges don't read as "filtered reports" (issue #402).
     */
    hasActiveFilters?: boolean
}

export function useMap(
    mapInstance: MapLibreMap,
    props: MapProps,
    emit: (event: string, ...args: unknown[]) => void
) {
    // Get client configuration for default heatmap state - dynamic config from API takes priority
    const runtimeConfig = useRuntimeConfig();
    const { clientConfig } = useMarkASpotConfig();
    const { photoReportAvailable } = useFeatureFlags();
    // Note: `===` binds tighter than `??`, so parentheses around the full
    // `??`-expression are required to coerce both branches to boolean.
    const initialHeatmapEnabled = computed(() =>
        (clientConfig.value?.features?.map?.controls?.heatmap?.initialState ??
          runtimeConfig.public.clientConfig.features.map?.controls?.heatmap?.initialState) === true
    );

    // Initialize the per-instance state entry if this is the first useMap call for this map.
    if (!masMapState.has(mapInstance)) {
        masMapState.set(mapInstance, { initialized: false, dblClickHandler: null });
    }

    const { updateGeoJSONSource: _updateGeoJSONSource, clearIcons, setMapInteracting } = useMapIcons(mapInstance);

    // Pass the computed (not its snapshot) so useHeatmap adopts the tenant's
    // heatmap.initialState even when clientConfig resolves after the map 'load'
    // event — until the user manually toggles the heatmap.
    const heatmap = useHeatmap(mapInstance, initialHeatmapEnabled);
    const clusters = useClusters(mapInstance);

    // Wrapper to add caller tracking and status filter info.
    // After data update, refresh cluster colors so the palette match expression
    // includes any newly registered category colors.
    const updateGeoJSONSource = async (reports: Request[], caller = 'useMap', hasStatusFilter = false) => {
        await _updateGeoJSONSource(reports, caller, hasStatusFilter);
        clusters.updateClusterColors();
    };
    // When readOnly is true (detail view), force markers to show at all zoom levels
    const markers = useMarkers(mapInstance, { forceShowMarkers: props.readOnly });
    const spiderfy = useSpiderfy(mapInstance, emit, toRef(props, 'markers'));
    const wmsLayers = useWmsLayers(mapInstance);
    const facilityLayer = useMapFacilityLayer(mapInstance);
    const facilitySelection = useMapFacilitySelection();
    const { markClickHandled } = useMapClickGuard();
    // Pick mode needs to override normal layer-click handlers so clicks on
    // facilities or report markers become position picks, not new reports.
    const mapPick = useMapPick();

    /**
     * Whether facility rendering should be active for this tenant. Honors
     * `enabled: false` as a hard kill-switch; `mode: 'disabled'` is
     * equivalent. Anything else renders (admins can still end up with zero
     * features if every item is `active: false`).
     */
    const facilityLayerEnabled = computed(() => {
        const facilities = clientConfig.value?.facilities;
        if (!facilities) return false;
        if (facilities.enabled === false) return false;
        if (facilities.mode === 'disabled') return false;
        return true;
    });

    // Previously: hid facility layers entirely during pick mode to prevent
    // the drop-pin pick marker from stacking on a facility badge at the
    // same coords. That was too aggressive — the citizen lost all
    // facility context while re-picking, which was the opposite of
    // helpful. The pick marker is a tall drop-pin anchored at its tip
    // and the facility badge is a small flat square; even at identical
    // lat/lng the shapes barely overlap. Suppressed facility clicks are
    // handled separately in the click-path guards.

    // Hover pulse marker (single HTML overlay, created on demand).
    // Typed as the class instance; MarkerClass stores the constructor from the lazy import.
    let hoverPulseMarker: MapLibreMarker | null = null;
    let MarkerClass: (typeof import('maplibre-gl'))['Marker'] | null = null;

    const showHoverPulse = async (lngLat: [number, number]) => {
        // Lazy-load Marker class (avoids SSR issues)
        if (!MarkerClass) {
            const mgl = await import('maplibre-gl');
            MarkerClass = mgl.Marker;
        }

        removeHoverPulse();

        const el = document.createElement('div');
        el.className = 'pulse-marker';
        el.innerHTML = '<div class="pulse-ring"></div><div class="pulse-ring pulse-ring-delayed"></div>';

        hoverPulseMarker = new MarkerClass({ element: el, anchor: 'bottom', offset: [0, -PIN_PULSE_CENTER_OFFSET] })
            .setLngLat(lngLat)
            .addTo(mapInstance);
    };

    const removeHoverPulse = () => {
        if (hoverPulseMarker) {
            hoverPulseMarker.remove();
            hoverPulseMarker = null;
        }
    };

    // Hoist useMapSettings() to composable top level (not inside event handlers)
    // to guarantee Nuxt context availability and avoid re-creating computeds per call.
    const { zoomLevels, clusterMaxZoom, sourceMaxZoom, dominantClusterColor } = useMapSettings();

    // Cache previous visibility state to avoid unnecessary updates
    const lastVisibilityState: { [key: string]: boolean } = {};

    // Track timers and handlers for cleanup
    let visibilityUpdateThrottle: NodeJS.Timeout | null = null;
    let zoomHandler: (() => void) | null = null;

    // Layer-delegated event handler references.
    // Stored so removeLayerHandlers() can pass the exact same function reference
    // to off(type, [layerId], handler), which is the only overload MapLibre v5
    // exposes for layer-scoped removal (off(type, layerId) without a ref is a no-op).
    type MapLayerHandler = (e: MapLayerMouseEvent) => void;
    let handlerReportsSymbolClick: MapLayerHandler | null = null;
    let handlerReportsSymbolMouseenter: MapLayerHandler | null = null;
    let handlerReportsSymbolMouseleave: MapLayerHandler | null = null;
    let handlerClustersMouseenter: MapLayerHandler | null = null;
    let handlerClustersMouseleave: MapLayerHandler | null = null;
    let handlerClustersClick: MapLayerHandler | null = null;
    let handlerClusterCountClick: MapLayerHandler | null = null;
    let handlerFacilitySymbolClick: MapLayerHandler | null = null;
    let handlerFacilitySymbolMouseenter: MapLayerHandler | null = null;
    let handlerFacilitySymbolMouseleave: MapLayerHandler | null = null;
    let handlerFacilityClusterMouseenter: MapLayerHandler | null = null;
    let handlerFacilityClusterMouseleave: MapLayerHandler | null = null;
    let handlerFacilityClusterClick: MapLayerHandler | null = null;
    let handlerFacilityClusterCountClick: MapLayerHandler | null = null;
    let zoomStartHandler: (() => void) | null = null;

    /**
     * Remove all layer-delegated handlers that were registered in initializeMarkerLayers.
     * Must be called at the top of initializeMarkerLayers (before re-registering) and
     * inside cleanup(). Uses the correct MapLibre v5 overload: off(type, [layerId], ref).
     */
    const removeLayerHandlers = () => {
        if (handlerReportsSymbolClick) {
            mapInstance.off('click', ['reports-symbols'], handlerReportsSymbolClick);
            handlerReportsSymbolClick = null;
        }
        if (handlerReportsSymbolMouseenter) {
            mapInstance.off('mouseenter', ['reports-symbols'], handlerReportsSymbolMouseenter);
            handlerReportsSymbolMouseenter = null;
        }
        if (handlerReportsSymbolMouseleave) {
            mapInstance.off('mouseleave', ['reports-symbols'], handlerReportsSymbolMouseleave);
            handlerReportsSymbolMouseleave = null;
        }
        if (handlerClustersMouseenter) {
            mapInstance.off('mouseenter', ['clusters'], handlerClustersMouseenter);
            handlerClustersMouseenter = null;
        }
        if (handlerClustersMouseleave) {
            mapInstance.off('mouseleave', ['clusters'], handlerClustersMouseleave);
            handlerClustersMouseleave = null;
        }
        if (handlerClustersClick) {
            mapInstance.off('click', ['clusters'], handlerClustersClick);
            handlerClustersClick = null;
        }
        if (handlerClusterCountClick) {
            mapInstance.off('click', ['cluster-count'], handlerClusterCountClick);
            handlerClusterCountClick = null;
        }
        if (handlerFacilitySymbolClick) {
            mapInstance.off('click', [facilityLayer.symbolLayerId], handlerFacilitySymbolClick);
            handlerFacilitySymbolClick = null;
        }
        if (handlerFacilitySymbolMouseenter) {
            mapInstance.off('mouseenter', [facilityLayer.symbolLayerId], handlerFacilitySymbolMouseenter);
            handlerFacilitySymbolMouseenter = null;
        }
        if (handlerFacilitySymbolMouseleave) {
            mapInstance.off('mouseleave', [facilityLayer.symbolLayerId], handlerFacilitySymbolMouseleave);
            handlerFacilitySymbolMouseleave = null;
        }
        if (handlerFacilityClusterMouseenter) {
            mapInstance.off('mouseenter', [facilityLayer.clusterLayerId], handlerFacilityClusterMouseenter);
            handlerFacilityClusterMouseenter = null;
        }
        if (handlerFacilityClusterMouseleave) {
            mapInstance.off('mouseleave', [facilityLayer.clusterLayerId], handlerFacilityClusterMouseleave);
            handlerFacilityClusterMouseleave = null;
        }
        if (handlerFacilityClusterClick) {
            mapInstance.off('click', [facilityLayer.clusterLayerId], handlerFacilityClusterClick);
            handlerFacilityClusterClick = null;
        }
        if (handlerFacilityClusterCountClick) {
            mapInstance.off('click', [facilityLayer.clusterCountLayerId], handlerFacilityClusterCountClick);
            handlerFacilityClusterCountClick = null;
        }
        if (zoomStartHandler) {
            mapInstance.off('zoomstart', zoomStartHandler);
            zoomStartHandler = null;
        }
    };

    const updateVisibility = (zoom: number) => {
        // Clusters visible from minZoom upward with no maxZoom cap.
        // At high zoom, the source only produces clusters for truly overlapping
        // points (within clusterRadius pixels), so they coexist with markers.
        const showClusters = zoom >= zoomLevels.value.clusters.minZoom;
        // When readOnly (detail view), always show markers regardless of zoom level
        const showMarkers = props.readOnly || zoom >= zoomLevels.value.markers.minZoom;

        // Handle non-heatmap layers first
        const layers = {
            [clusters.clusterLayerId]: showClusters,
            [clusters.countLayerId]: showClusters,
            [markers.symbolLayerId]: showMarkers
        };

        // Only update layers that have actually changed visibility
        Object.entries(layers).forEach(([layerId, visible]) => {
            if (mapInstance.getLayer(layerId) && lastVisibilityState[layerId] !== visible) {
                mapInstance.setLayoutProperty(
                    layerId,
                    'visibility',
                    visible ? 'visible' : 'none'
                );
                lastVisibilityState[layerId] = visible;
            }
        });

        // Handle heatmap layer separately using the new function that respects user preference
        heatmap.updateVisibilityOnZoom(zoom);
    };

    // Delegate heatmap layer setup to composable
    const addHeatmapLayer = heatmap.addHeatmapLayer;

    // Delegate cluster layer setup to composable
    const addClusterLayers = clusters.addClusterLayers;

    // Delegate marker layer setup to composable
    const addMarkerLayers = markers.addMarkerLayers;

    // Delegate heatmap toggle to composable
    const toggleHeatmap = heatmap.toggleHeatmap;

    // Facility hover popup (single instance, reused across hover events).
    // Lazy-loaded via dynamic import to keep SSR safe and avoid pulling
    // maplibre-gl Popup into the SSR bundle.
    let facilityHoverPopup: MapLibrePopup | null = null;
    let PopupClass: (typeof import('maplibre-gl'))['Popup'] | null = null;
    const ensurePopupClass = async () => {
        if (!PopupClass) {
            const mgl = await import('maplibre-gl');
            PopupClass = mgl.Popup;
        }
    };
    const hideFacilityHoverPopup = () => {
        if (facilityHoverPopup) {
            facilityHoverPopup.remove();
            facilityHoverPopup = null;
        }
    };

    /**
     * Resolve a facility id from a clicked feature's properties back to
     * the full FacilityConfigItem from client config. Returns null if
     * the item is missing (e.g., config changed mid-click).
     */
    const resolveFacilityById = (id: string): FacilityConfigItem | null => {
        const items = clientConfig.value?.facilities?.items || [];
        return items.find(item => String(item.id) === id) || null;
    };

    /**
     * Wire click + hover handlers for the facility symbol and cluster
     * layers. Mirrors the report-layer handler setup so both layers
     * behave consistently. Cluster clicks zoom in (no spiderfy for
     * facilities — the dataset is typically small enough that a zoom
     * step resolves overlap).
     *
     * Handler references are stored in the closure-level handler* variables
     * so removeLayerHandlers() can remove them with the correct MapLibre v5
     * off(type, [layerId], ref) overload.
     */
    const wireFacilityInteractions = () => {
        // Click on individual facility pin
        handlerFacilitySymbolClick = (e: MapLayerMouseEvent) => {
            // In pick mode, don't consume the click: let the raw map-click
            // handler treat this as a position pick. Without this early-
            // return the facility flow would steal the click and emit
            // add-report, which is exactly what pick mode should suppress.
            if (mapPick.isActive.value) return;
            markClickHandled();
            hideFacilityHoverPopup();
            const feature = e.features?.[0];
            const id = feature?.properties?.id;
            if (!id) return;

            const facility = resolveFacilityById(String(id));
            if (!facility) return;

            const mode = clientConfig.value?.facilities?.mode;
            const featureGeom = feature.geometry;
            const coords = (featureGeom && featureGeom.type !== 'GeometryCollection')
                ? featureGeom.coordinates as [number, number]
                : undefined;

            if (mode === 'optional' && coords) {
                // Optional mode: do not force a facility selection. Instead
                // drop the report pin at the facility's coordinates and let
                // useFacilityPositionTag attach/detach the tag based on radius.
                facilitySelection.pickFacilityLocation({
                    facility,
                    lng: coords[0],
                    lat: coords[1]
                });
            } else {
                // Exclusive mode (or legacy enabled:true): adopt the facility
                // as the report's subject via the shared selection channel.
                facilitySelection.selectFacility(facility);
            }

            // Kick off the report flow at the facility's position. Without
            // this emit, the click only updates shared selection state —
            // which is observable by a mounted form but produces no visible
            // action on the landing page (no form is mounted yet). The
            // page's handleReport wiring routes us into form-first OR opens
            // the report dialog, depending on client config. The form then
            // picks up `lastSelectedFacility` / `lastLocationPick` on mount
            // and adopts the facility context.
            const lat = Number(facility.lat);
            const lng = Number(facility.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                emit('add-report', photoReportAvailable.value ? 'photo' : 'classic', {
                    lat,
                    lng,
                    address: facility.address || undefined
                });
            }
        };
        mapInstance.on('click', facilityLayer.symbolLayerId, handlerFacilitySymbolClick);

        // Hover popup: facility label + (optional) address. Uses
        // setDOMContent rather than setHTML so both fields are inserted
        // via textContent and can't inject markup even if an admin ever
        // slipped HTML into a label or address config value.
        handlerFacilitySymbolMouseenter = async (e: MapLayerMouseEvent) => {
            mapInstance.getCanvas().style.cursor = 'pointer';
            const feature = e.features?.[0];
            if (!feature) return;

            const geom = feature.geometry;
            const coords = (geom && geom.type !== 'GeometryCollection')
                ? geom.coordinates as [number, number]
                : undefined;
            const label = feature.properties?.label;
            const address = feature.properties?.address;
            const description = feature.properties?.description;
            const url = feature.properties?.url;
            if (!coords || !label) return;

            await ensurePopupClass();
            hideFacilityHoverPopup();

            const content = document.createElement('div');
            content.className = 'facility-hover-popup__body';
            const labelEl = document.createElement('strong');
            labelEl.className = 'facility-hover-popup__label';
            labelEl.textContent = String(label);
            content.appendChild(labelEl);
            if (address) {
                const addressEl = document.createElement('div');
                addressEl.className = 'facility-hover-popup__address';
                addressEl.textContent = String(address);
                content.appendChild(addressEl);
            }
            // Optional description (#381). textContent prevents any HTML
            // an admin might have pasted from rendering as markup.
            if (description) {
                const descEl = document.createElement('div');
                descEl.className = 'facility-hover-popup__description';
                // Preserve admin-entered line breaks (UTextarea allows them).
                // textContent + white-space:pre-wrap renders newlines without
                // accepting any HTML tags.
                descEl.style.whiteSpace = 'pre-wrap';
                descEl.textContent = String(description);
                content.appendChild(descEl);
            }
            // Optional url (#381). Validated client-side at admin save, but
            // we still gate on a successful URL parse + http(s) protocol
            // here so a stale or hand-edited config can't mount a
            // javascript: link in the popup. rel=noopener noreferrer is
            // mandatory because the popup opens an external origin in a
            // new tab.
            if (url) {
                try {
                    const parsed = new URL(String(url));
                    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
                        const linkEl = document.createElement('a');
                        linkEl.className = 'facility-hover-popup__url';
                        linkEl.href = parsed.toString();
                        linkEl.target = '_blank';
                        linkEl.rel = 'noopener noreferrer';
                        linkEl.textContent = parsed.hostname.replace(/^www\./, '');
                        content.appendChild(linkEl);
                    }
                } catch {
                    // Invalid URL — silently omit rather than crash the popup.
                }
            }

            facilityHoverPopup = new PopupClass({
                closeButton: false,
                closeOnClick: false,
                offset: 24,
                className: 'facility-hover-popup'
            })
                .setLngLat(coords)
                .setDOMContent(content)
                .addTo(mapInstance);
        };
        mapInstance.on('mouseenter', facilityLayer.symbolLayerId, handlerFacilitySymbolMouseenter);

        handlerFacilitySymbolMouseleave = () => {
            mapInstance.getCanvas().style.cursor = '';
            hideFacilityHoverPopup();
        };
        mapInstance.on('mouseleave', facilityLayer.symbolLayerId, handlerFacilitySymbolMouseleave);

        // Cluster click: zoom in one step at the cluster's position so the
        // cluster breaks apart. Keeps behavior predictable without needing
        // a facility-specific spiderfy implementation.
        // One named function registered on both cluster layers; the same ref
        // is stored in both handler slots so removeLayerHandlers() can remove
        // it from each layer independently.
        const handleFacilityClusterClick = (e: MapLayerMouseEvent) => {
            // Pick mode takes precedence — let the raw map-click handler
            // treat this as a position pick instead of a cluster zoom.
            if (mapPick.isActive.value) return;
            markClickHandled();
            hideFacilityHoverPopup();
            try {
                const features = mapInstance.queryRenderedFeatures(e.point, {
                    layers: [facilityLayer.clusterLayerId, facilityLayer.clusterCountLayerId]
                });
                if (features[0]?.properties?.cluster_id) {
                    const currentZoom = mapInstance.getZoom();
                    const maxZoom = mapInstance.getMaxZoom();
                    if (currentZoom < maxZoom) {
                        mapInstance.easeTo({
                            center: e.lngLat,
                            zoom: Math.min(currentZoom + 2, maxZoom),
                            duration: 400
                        });
                    }
                }
            } catch {
                // Ignore tile parsing errors from basemap
            }
        };
        handlerFacilityClusterClick = handleFacilityClusterClick;
        handlerFacilityClusterCountClick = handleFacilityClusterClick;
        mapInstance.on('click', facilityLayer.clusterLayerId, handlerFacilityClusterClick);
        mapInstance.on('click', facilityLayer.clusterCountLayerId, handlerFacilityClusterCountClick);

        handlerFacilityClusterMouseenter = () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
        };
        mapInstance.on('mouseenter', facilityLayer.clusterLayerId, handlerFacilityClusterMouseenter);

        handlerFacilityClusterMouseleave = () => {
            mapInstance.getCanvas().style.cursor = '';
        };
        mapInstance.on('mouseleave', facilityLayer.clusterLayerId, handlerFacilityClusterMouseleave);
    };

    // Reactive watcher: when the facility *items* change at runtime
    // (e.g., jurisdiction settings refetch), update the source features.
    // Watches only `items` (not the whole facilities object) so that unrelated
    // field changes (mode, enabled, etc.) don't trigger an unnecessary GeoJSON
    // rebuild. Init for first-time setup still happens inside initializeMarkerLayers.
    watch(
        () => clientConfig.value?.facilities?.items,
        async () => {
            if (!facilityLayerEnabled.value || props.readOnly) return;
            if (!mapInstance.getSource(facilityLayer.sourceId)) return;
            try {
                await facilityLayer.updateFacilitySource();
            } catch (error) {
                console.error('[Map] Error refreshing facility layer source:', error);
            }
        },
        { deep: true }
    );

    // Selected-state highlight: follow the shared selection channel and
    // flip the halo filter to match the active facility id. Clearing the
    // selection (null) collapses the halo because the layer filter falls
    // back to the sentinel that matches no features.
    watch(
        () => facilitySelection.lastSelectedFacility.value?.id,
        (newId) => {
            if (!facilityLayerEnabled.value || props.readOnly) return;
            if (!mapInstance.getLayer(facilityLayer.selectedHaloLayerId)) return;
            facilityLayer.setSelectedFacilityId(newId ? String(newId) : null);
        }
    );

    // Issue #402: hide facility layer while the user has any report-list
    // filter active. Facilities are independent admin-curated points
    // (schools, kindergartens, etc.) and not subject to report filters,
    // but their badges visually compete with report markers — so when
    // the list scope narrows we narrow the map's badge surface too.
    // Re-applies on every change so a freshly-initialized layer
    // inherits the current visibility (the watcher is `immediate: true`
    // for that reason).
    watch(
        () => Boolean(props.hasActiveFilters),
        (active) => {
            if (!facilityLayerEnabled.value || props.readOnly) return;
            facilityLayer.setLayersVisibility(!active);
        },
        { immediate: true }
    );

    const initializeMarkerLayers = async () => {
        // Prevent multiple initializations using per-instance state
        if (masMapState.get(mapInstance)?.initialized) {
            return;
        }

        // Ensure style is ready before adding sources/layers
        const isStyleLoaded = mapInstance?.isStyleLoaded();

        if (!isStyleLoaded) {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Style loading timeout'));
                }, 3000);

                const checkAndResolve = () => {
                    if (mapInstance.loaded() && mapInstance.isStyleLoaded()) {
                        clearTimeout(timeout);
                        resolve();
                    }
                };

                mapInstance.once('idle', checkAndResolve);
                mapInstance.once('styledata', checkAndResolve);
                checkAndResolve();
            }).catch(() => {
                // Continue with initialization despite timeout
            });
        }

        if (!mapInstance.getSource('reports-geojson')) {
            try {
                // Note: clusterMaxZoom, sourceMaxZoom, and dominantClusterColor are read once
                // at source creation time. If any of these config values change at runtime
                // (e.g., jurisdiction settings refetch), the source must be recreated via
                // resetInitialization() + initializeMarkerLayers(). Currently no watcher
                // triggers this automatically; a style/theme toggle (useMapStyleWatcher) is
                // the only path that rebuilds the source today. This is intentional for now
                // because jurisdiction config rarely changes these values post-load.
                const sourceConfig: GeoJSONSourceSpecification = {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    },
                    cluster: true,
                    clusterRadius: 50,
                    clusterMaxZoom: clusterMaxZoom.value,
                    clusterMinPoints: 2,
                    // MapLibre requires source maxzoom strictly greater than
                    // clusterMaxZoom; without this the GeoJSON-source default
                    // of 18 caps clustering and triggers a runtime warning.
                    maxzoom: sourceMaxZoom.value
                };

                // Aggregate dominant color index via max when enabled
                if (dominantClusterColor.value) {
                    sourceConfig.clusterProperties = {
                        dominantColorIndex: ['max', ['get', 'colorIndex']]
                    };
                }

                mapInstance.addSource('reports-geojson', sourceConfig);
            } catch (error) {
                console.error('Error adding reports-geojson source:', error);
            }
        }

        // Initialize WMS layers FIRST (they appear below report layers)
        wmsLayers.initializeWmsLayers();

        addHeatmapLayer();
        addClusterLayers();
        addMarkerLayers();

        // Facility layer is additive and gated by client config. When disabled
        // we still skip source+layer creation so the map doesn't hold empty
        // GeoJSON resources. In read-only (detail view) mode, rendering static
        // facility pins next to the focused report would distract from the
        // single-item view, so we skip it there too.
        if (facilityLayerEnabled.value && !props.readOnly) {
            try {
                await facilityLayer.initializeFacilityLayer();
                // Re-apply any pre-existing selection (e.g., restored from a
                // draft or selected before the map finished mounting).
                const preselectedId = facilitySelection.lastSelectedFacility.value?.id;
                if (preselectedId) {
                    facilityLayer.setSelectedFacilityId(String(preselectedId));
                }
                // Re-apply current report-filter visibility (issue #402).
                // The watcher above may have fired before layers existed,
                // so a no-op then; sync now that the layers are in place.
                facilityLayer.setLayersVisibility(!props.hasActiveFilters);
            } catch (error) {
                console.error('[Map] Error initializing facility layer:', error);
            }
        }

        // Don't call updateGeoJSONSource here - let the watcher handle it

        // Set initial visibility based on zoom
        updateVisibility(mapInstance.getZoom());

        // Disable performance monitoring - the issue is MapLibre's internal render loops

        // Remove previous zoom handler if exists
        if (zoomHandler) {
            mapInstance.off('zoom', zoomHandler);
        }

        // Create throttled zoom handler
        zoomHandler = () => {
            if (visibilityUpdateThrottle) {
                clearTimeout(visibilityUpdateThrottle);
            }
            visibilityUpdateThrottle = setTimeout(() => {
                updateVisibility(mapInstance.getZoom());
                visibilityUpdateThrottle = null;
            }, 16); // ~60fps throttle
        };

        mapInstance.on('zoom', zoomHandler);

        // Remove any existing layer-delegated handlers before re-registering.
        // removeLayerHandlers() uses the stored function refs with the correct
        // MapLibre v5 overload: off(type, [layerId], handler). The previous
        // string-only off('click', 'reports-symbols') calls were no-ops because
        // MapLibre v5 has no off(type, layerId) overload without a listener arg.
        removeLayerHandlers();

        // Initialize spiderfy for cluster expansion AFTER event cleanup
        spiderfy.initializeSpiderfy();

        // Handle marker clicks (pin symbol layer)
        handlerReportsSymbolClick = (e: MapLayerMouseEvent) => {
            // Pick mode takes precedence — a citizen correcting their
            // position must not accidentally open a stranger's report.
            if (mapPick.isActive.value) return;
            // Stacking guard: facility badges draw ABOVE report pins, so
            // when both layers have a feature at the click point the
            // facility owns the click. Without this guard, both the
            // facility selection flow AND the report detail modal would
            // open simultaneously on overlapping coordinates (common in
            // dense jurisdictions where facilities and citizen reports
            // cluster around the same POIs).
            if (facilityLayerEnabled.value && mapInstance.getLayer(facilityLayer.symbolLayerId)) {
                const facilityHits = mapInstance.queryRenderedFeatures(e.point, {
                    layers: [facilityLayer.symbolLayerId]
                });
                if (facilityHits.length > 0) return;
            }
            markClickHandled();
            const feature = e.features?.[0];
            if (feature) {
                const report = props.markers.find(m => m.service_request_id === feature.properties.id);
                if (report) {
                    emit('select-report', { report, mapInstance });
                }
            }
        };
        mapInstance.on('click', 'reports-symbols', handlerReportsSymbolClick);

        // Cursor + pulse on hover
        handlerReportsSymbolMouseenter = (e: MapLayerMouseEvent) => {
            mapInstance.getCanvas().style.cursor = 'pointer';
            const hoverGeom = e.features?.[0]?.geometry;
            const coords = (hoverGeom && hoverGeom.type !== 'GeometryCollection')
                ? hoverGeom.coordinates as [number, number]
                : undefined;
            if (coords) {
                showHoverPulse(coords);
            }
        };
        mapInstance.on('mouseenter', 'reports-symbols', handlerReportsSymbolMouseenter);

        handlerReportsSymbolMouseleave = () => {
            mapInstance.getCanvas().style.cursor = '';
            removeHoverPulse();
        };
        mapInstance.on('mouseleave', 'reports-symbols', handlerReportsSymbolMouseleave);

        handlerClustersMouseenter = () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
        };
        mapInstance.on('mouseenter', 'clusters', handlerClustersMouseenter);

        handlerClustersMouseleave = () => {
            mapInstance.getCanvas().style.cursor = '';
        };
        mapInstance.on('mouseleave', 'clusters', handlerClustersMouseleave);

        // Handle cluster clicks - zoom in or spiderfy at max zoom
        // One named function registered on both cluster layers; stored in two
        // separate handler slots so removeLayerHandlers() can deregister each.
        const handleClusterLayerClick = (e: MapLayerMouseEvent) => {
            // Pick mode takes precedence — a click on a cluster must not
            // zoom/spiderfy when the citizen is trying to pick a position.
            if (mapPick.isActive.value) return;
            markClickHandled();
            try {
                const features = mapInstance.queryRenderedFeatures(e.point, {
                    layers: ['clusters', 'cluster-count']
                });
                if (features[0]?.properties?.cluster_id) {
                    spiderfy.handleClusterClick(
                        features[0].properties.cluster_id,
                        e.lngLat
                    );
                }
            } catch {
                // Ignore tile parsing errors from basemap
            }
        };
        handlerClustersClick = handleClusterLayerClick;
        handlerClusterCountClick = handleClusterLayerClick;
        mapInstance.on('click', 'clusters', handlerClustersClick);
        mapInstance.on('click', 'cluster-count', handlerClusterCountClick);

        // Facility layer interactions. Only wire when the layer is active for
        // this jurisdiction (mode !== 'disabled' && enabled !== false) so we
        // don't add dead listeners in reports-only tenants.
        if (facilityLayerEnabled.value && !props.readOnly) {
            wireFacilityInteractions();
        }

        // Clear spiderfy on zoom start. Handler is stored so removeLayerHandlers()
        // can deregister it on re-init (style/locale change) and cleanup().
        zoomStartHandler = () => {
            spiderfy.unspiderfyAll();
        };
        mapInstance.on('zoomstart', zoomStartHandler);

        // Throttled double-click zoom to prevent map stale from rapid clicks
        // Native doubleClickZoom is disabled in createMapConfig.ts
        let lastDblClickTime = 0;
        const DBLCLICK_THROTTLE = 400; // Minimum ms between zoom operations

        const handleThrottledDblClick = (e: MapMouseEvent) => {
            const now = Date.now();
            if (now - lastDblClickTime < DBLCLICK_THROTTLE) {
                return; // Ignore rapid double-clicks
            }
            lastDblClickTime = now;

            // Check if clicking on a cluster - let cluster handler manage zoom
            try {
                const clusterFeatures = mapInstance.queryRenderedFeatures(e.point, {
                    layers: ['clusters', 'cluster-count']
                });
                if (clusterFeatures.length > 0) {
                    return; // Cluster handler will handle this
                }
            } catch {
                // Ignore query errors
            }

            // Manual zoom in at click location
            const currentZoom = mapInstance.getZoom();
            const maxZoom = mapInstance.getMaxZoom();
            if (currentZoom < maxZoom) {
                mapInstance.easeTo({
                    center: e.lngLat,
                    zoom: Math.min(currentZoom + 1, maxZoom),
                    duration: 300
                });
            }
        };

        // Cleanup any existing handler first (defensive)
        const state = masMapState.get(mapInstance)!;
        if (state.dblClickHandler) {
            mapInstance.off('dblclick', state.dblClickHandler);
        }

        mapInstance.on('dblclick', handleThrottledDblClick);
        state.dblClickHandler = handleThrottledDblClick;

        // Mark as initialized in per-instance state
        state.initialized = true;
    };

    // Add map pitch (tilt) control
    const setMapPitch = (pitch: number) => {
        if (mapInstance && mapInstance.loaded()) {
            mapInstance.setPitch(pitch);
        }
    };

    // Reset initialization flag (useful for style changes)
    const resetInitialization = () => {
        const s = masMapState.get(mapInstance);
        if (s) s.initialized = false;
    };

    // Cleanup timers and handlers
    const cleanup = () => {
        // Clear throttle timer
        if (visibilityUpdateThrottle) {
            clearTimeout(visibilityUpdateThrottle);
            visibilityUpdateThrottle = null;
        }

        // Remove zoom handler
        if (zoomHandler) {
            mapInstance.off('zoom', zoomHandler);
            zoomHandler = null;
        }

        // Remove double-click handler
        const s = masMapState.get(mapInstance);
        if (s?.dblClickHandler) {
            mapInstance.off('dblclick', s.dblClickHandler);
            s.dblClickHandler = null;
        }

        // Remove all layer-delegated handlers (reports-symbols, clusters, facility, zoomstart)
        removeLayerHandlers();

        // Cleanup spiderfy, hover pulse, and facility popup
        spiderfy.cleanup();
        removeHoverPulse();
        hideFacilityHoverPopup();
    };

    return {
        updateGeoJSONSource,
        initializeMarkerLayers,
        resetInitialization,
        toggleHeatmap,
        clearIcons,
        setMapPitch,
        setMapInteracting,
        unspiderfyAll: spiderfy.unspiderfyAll,
        handleClusterClick: spiderfy.handleClusterClick,
        isSpiderfied: spiderfy.isSpiderfied,
        cleanup,
        // WMS Layer controls
        wmsLayers: {
            toggle: wmsLayers.toggleWmsLayer,
            setOpacity: wmsLayers.setLayerOpacity,
            isVisible: wmsLayers.isLayerVisible,
            layers: wmsLayers.wmsLayers,
            isEnabled: wmsLayers.isWmsEnabled
        }
    };
}
