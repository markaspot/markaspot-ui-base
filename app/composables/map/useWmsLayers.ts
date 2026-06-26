import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Where a WMS layer may be displayed.
 * - 'public'        → citizen map (everyone incl. anonymous) + dashboard
 * - 'authenticated' → citizen map only when logged in + dashboard
 * - 'staff'         → dashboard only, never on the citizen map
 */
export type WmsVisibility = 'public' | 'authenticated' | 'staff';

/**
 * WMS Layer Configuration
 */
export interface WmsLayerConfig {
    id: string
    title: string
    layerName: string // The WMS layer name (e.g., 'v_stellplaetze_bike_ride_s_27582')
    url?: string // Backend-only WMS service URL from tenant config
    enabled: boolean // Whether the layer is enabled by default
    opacity?: number // Layer opacity (0-1), default 0.7
    minZoom?: number // Minimum zoom level to show layer
    maxZoom?: number // Maximum zoom level to show layer
    legendAlt?: string // Optional per-jurisdiction legend image alt text override
    legendUnavailableText?: string // Optional per-jurisdiction legend fallback text override
    /** Attribution string rendered in the map attribution control. Omit to show no attribution. */
    attribution?: string
    /** @deprecated Use `visibility` instead. Mapped to 'authenticated' when true. */
    requireAuth?: boolean
    /** Visibility tier; falls back to `requireAuth` when unset. */
    visibility?: WmsVisibility
}

/**
 * Resolve the effective visibility of a WMS layer.
 *
 * Back-compat: when `visibility` is not set, an old `requireAuth: true`
 * config maps to 'authenticated', everything else to 'public'.
 */
export function resolveWmsVisibility(layer: Pick<WmsLayerConfig, 'visibility' | 'requireAuth'>): WmsVisibility {
    return layer.visibility ?? (layer.requireAuth ? 'authenticated' : 'public');
}

/** Get the MapLibre source ID for a WMS layer. */
export const getWmsSourceId = (layerId: string) => `wms-source-${layerId}`;

/** Get the MapLibre layer ID for a WMS layer. */
export const getWmsLayerId = (layerId: string) => `wms-layer-${layerId}`;

/**
 * Build the WMS tile URL for a layer.
 *
 * Routes through the Nuxt `/api/wms` proxy. The jurisdiction id is required
 * for multi-tenant deployments so the proxy can resolve the tenant WMS service.
 * MapLibre substitutes `{bbox-epsg-3857}` with the actual tile bbox.
 */
export function buildWmsTileUrl(layerName: string, jurisdictionId?: string | number): string {
    const baseUrl = '/api/wms';
    const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        REQUEST: 'GetMap',
        layers: layerName,
        styles: '',
        format: 'image/png',
        transparent: 'true',
        srs: 'EPSG:3857',
        width: '256',
        height: '256'
    });
    if (jurisdictionId !== undefined && jurisdictionId !== null && jurisdictionId !== '') {
        params.set('jurisdiction', String(jurisdictionId));
    }
    return `${baseUrl}?${params.toString()}&bbox={bbox-epsg-3857}`;
}

/**
 * Build the WMS legend URL for a layer.
 */
export function buildWmsLegendUrl(layerName: string, jurisdictionId?: string | number): string {
    const baseUrl = '/api/wms';
    const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        REQUEST: 'GetLegendGraphic',
        LAYER: layerName,
        STYLE: '',
        format: 'image/png',
        transparent: 'true'
    });
    if (jurisdictionId !== undefined && jurisdictionId !== null && jurisdictionId !== '') {
        params.set('jurisdiction', String(jurisdictionId));
    }
    return `${baseUrl}?${params.toString()}`;
}

export function getWmsLegendAlt(layer: Pick<WmsLayerConfig, 'title' | 'legendAlt'>): string {
    return layer.legendAlt?.trim() || layer.title;
}

export function getWmsLegendUnavailableText(layer: Pick<WmsLayerConfig, 'title' | 'legendUnavailableText'>): string {
    return layer.legendUnavailableText?.trim() || layer.title;
}

/**
 * Add a single WMS raster source + layer to a MapLibre map instance.
 *
 * Shared by the citizen map composable (`useWmsLayers`) and the dashboard
 * maps so the source/layer construction lives in exactly one place.
 *
 * @returns true when the layer was added, false when its source already existed.
 */
export function addWmsLayerToMap(
    map: MapLibreMap,
    config: WmsLayerConfig,
    options: { jurisdictionId?: string | number, beforeLayerId?: string } = {}
): boolean {
    const sourceId = getWmsSourceId(config.id);
    const layerId = getWmsLayerId(config.id);

    // Skip if the source already exists (e.g. added by another map composable).
    if (map.getSource(sourceId)) {
        return false;
    }

    map.addSource(sourceId, {
        type: 'raster',
        tiles: [buildWmsTileUrl(config.layerName, options.jurisdictionId)],
        tileSize: 256,
        // Attribution is tenant-specific; callers set it via WmsLayerConfig.attribution.
        // An empty string suppresses the attribution control entry entirely.
        ...(config.attribution ? { attribution: config.attribution } : {})
    });

    map.addLayer(
        {
            id: layerId,
            type: 'raster',
            source: sourceId,
            minzoom: config.minZoom ?? 10,
            maxzoom: config.maxZoom ?? 20,
            paint: {
                'raster-opacity': config.opacity ?? 0.7
            },
            layout: {
                visibility: config.enabled ? 'visible' : 'none'
            }
        },
        options.beforeLayerId // Insert before this layer (e.g. 'reports-heat')
    );

    return true;
}

/**
 * Filter WMS layers for the citizen map context.
 *
 * The citizen frontend only knows whether the visitor is authenticated;
 * it has no role concept. Rules:
 * - 'public'        → always shown
 * - 'authenticated' → shown only when `isAuthenticated` is true
 * - 'staff'         → never shown on the citizen map
 */
export function filterWmsLayersForCitizen(
    layers: WmsLayerConfig[],
    isAuthenticated: boolean
): WmsLayerConfig[] {
    return layers.filter((layer) => {
        const visibility = resolveWmsVisibility(layer);
        if (visibility === 'staff') return false;
        if (visibility === 'authenticated') return isAuthenticated;
        return true;
    });
}

/**
 * WMS Layers Composable
 *
 * Manages WMS layers on a MapLibre map instance.
 * Layers are loaded from client configuration and can be toggled via Dashboard UI.
 * Supports auth-gated layers that only show to authenticated users.
 *
 * @param map - MapLibre map instance
 */
export function useWmsLayers(map: MapLibreMap) {
    const { clientConfig } = useMarkASpotConfig();
    const { isAuthenticated } = usePasswordlessAuth();

    // Track active layers
    const activeLayers = ref<Set<string>>(new Set());

    // Get all WMS layers from client config
    const allWmsLayers = computed<WmsLayerConfig[]>(() => {
        return clientConfig.value?.features?.map?.wmsLayers || [];
    });

    // Get WMS layers available on the citizen map (respects effective visibility).
    // This composable drives the citizen map: 'staff' layers are never shown,
    // 'authenticated' layers only after login, 'public' layers always.
    const wmsLayers = computed<WmsLayerConfig[]>(() => {
        return filterWmsLayersForCitizen(allWmsLayers.value, isAuthenticated.value);
    });

    // Check if WMS feature is enabled (has any visible layers)
    const isWmsEnabled = computed(() => {
        return wmsLayers.value.length > 0;
    });

    // Check if there are auth-gated layers that become available after login.
    // 'staff' layers are excluded — they never appear on the citizen map.
    const hasAuthGatedLayers = computed(() => {
        return allWmsLayers.value.some(layer => resolveWmsVisibility(layer) === 'authenticated');
    });

    /**
   * Get the source ID for a WMS layer
   */
    const getSourceId = getWmsSourceId;

    /**
   * Get the layer ID for a WMS layer
   */
    const getLayerId = getWmsLayerId;

    /**
   * Add a WMS layer to the map.
   * Delegates source/layer construction to the shared `addWmsLayerToMap`.
   */
    const addWmsLayer = (config: WmsLayerConfig, beforeLayerId?: string) => {
        const added = addWmsLayerToMap(map, config, {
            jurisdictionId: clientConfig.value?.jurisdiction?.id,
            beforeLayerId
        });

        if (!added) {
            if (import.meta.dev) {
                console.warn(`[WMS] Source ${getSourceId(config.id)} already exists`);
            }
            return;
        }

        if (config.enabled) {
            activeLayers.value.add(config.id);
            // Force Vue reactivity update
            activeLayers.value = new Set(activeLayers.value);
        }

        if (import.meta.dev) {
            console.log(`[WMS] Added layer: ${config.title} (${getLayerId(config.id)})`);
        }
    };

    /**
   * Remove a WMS layer from the map
   */
    const removeWmsLayer = (layerId: string) => {
        const sourceId = getSourceId(layerId);
        const mapLayerId = getLayerId(layerId);

        if (map.getLayer(mapLayerId)) {
            map.removeLayer(mapLayerId);
        }

        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
        }

        activeLayers.value.delete(layerId);
        // Force Vue reactivity update
        activeLayers.value = new Set(activeLayers.value);
        if (import.meta.dev) {
            console.log(`[WMS] Removed layer: ${layerId}`);
        }
    };

    /**
   * Toggle a WMS layer visibility
   */
    const toggleWmsLayer = (layerId: string) => {
        const mapLayerId = getLayerId(layerId);

        if (!map.getLayer(mapLayerId)) {
            if (import.meta.dev) {
                console.warn(`[WMS] Layer ${mapLayerId} not found`);
            }
            return;
        }

        const currentVisibility = map.getLayoutProperty(mapLayerId, 'visibility');
        const newVisibility = currentVisibility === 'visible' ? 'none' : 'visible';

        map.setLayoutProperty(mapLayerId, 'visibility', newVisibility);

        if (newVisibility === 'visible') {
            activeLayers.value.add(layerId);
        } else {
            activeLayers.value.delete(layerId);
        }

        // Force Vue reactivity update (Set mutations aren't tracked)
        activeLayers.value = new Set(activeLayers.value);

        if (import.meta.dev) {
            console.log(`[WMS] Toggled layer ${layerId}: ${newVisibility}`);
        }
    };

    /**
   * Set layer opacity
   */
    const setLayerOpacity = (layerId: string, opacity: number) => {
        const mapLayerId = getLayerId(layerId);

        if (map.getLayer(mapLayerId)) {
            map.setPaintProperty(mapLayerId, 'raster-opacity', Math.max(0, Math.min(1, opacity)));
        } else if (import.meta.dev) {
            // Warn on unknown layer so opacity-slider no-ops are observable during dev.
            console.warn(`[WMS] setLayerOpacity: layer not found: ${mapLayerId}`);
        }
    };

    /**
   * Check if a layer is currently visible
   */
    const isLayerVisible = (layerId: string): boolean => {
        return activeLayers.value.has(layerId);
    };

    /**
   * Initialize all configured WMS layers
   * Call this after map style is loaded
   */
    const initializeWmsLayers = (beforeLayerId?: string) => {
        if (!isWmsEnabled.value) {
            if (import.meta.dev) {
                // Debug: log current config state only in dev and only when there are no layers
                console.log('[WMS] No WMS layers configured', {
                    hasClientConfig: !!clientConfig.value,
                    hasFeatures: !!clientConfig.value?.features,
                    hasMap: !!clientConfig.value?.features?.map,
                    wmsLayersCount: clientConfig.value?.features?.map?.wmsLayers?.length ?? 0
                });
            }
            return;
        }

        if (import.meta.dev) {
            console.log(`[WMS] Initializing ${wmsLayers.value.length} WMS layers`);
        }

        // setStyle() wipes all custom layers; on a style rebuild this runs again
        // and addWmsLayer re-adds each layer at its config-default visibility.
        // Snapshot the user's runtime toggle state first so overlays the user
        // switched on (but that are config-disabled by default) are restored
        // after re-add. Empty on first init, so no effect there.
        const previouslyActive = new Set(activeLayers.value);

        for (const layerConfig of wmsLayers.value) {
            addWmsLayer(layerConfig, beforeLayerId);
        }

        for (const layerId of previouslyActive) {
            const mapLayerId = getLayerId(layerId);
            if (map.getLayer(mapLayerId)) {
                map.setLayoutProperty(mapLayerId, 'visibility', 'visible');
                activeLayers.value.add(layerId);
            }
        }
        activeLayers.value = new Set(activeLayers.value);
    };

    /**
     * Cleanup all WMS layers.
     *
     * Iterates `allWmsLayers` (not the auth-filtered `wmsLayers`) so that
     * layers added while authenticated are removed even after the user has
     * logged out and those ids are no longer in the filtered computed.
     * Called by useMap's cleanup() on map teardown.
     */
    const cleanup = () => {
        for (const layerConfig of allWmsLayers.value) {
            removeWmsLayer(layerConfig.id);
        }
        activeLayers.value = new Set();
    };

    return {
    // State
        wmsLayers,
        allWmsLayers,
        activeLayers: computed(() => activeLayers.value),
        isWmsEnabled,
        hasAuthGatedLayers,
        isAuthenticated,

        // Methods
        initializeWmsLayers,
        addWmsLayer,
        removeWmsLayer,
        toggleWmsLayer,
        setLayerOpacity,
        isLayerVisible,
        cleanup,

        // Helpers
        getSourceId,
        getLayerId
    };
}
