import type { Ref } from 'vue';
import type { Map as MapLibreMap, GeoJSONSource, LngLat, MapLayerMouseEvent } from 'maplibre-gl';
import type { Request } from '~~/types';
import { useMapClickGuard } from './useMapClickGuard';

/**
 * Native Spiderfy Composable
 *
 * Handles spiderfying clusters when clicked at max zoom to reveal individual markers.
 * Uses native MapLibre icon-offset approach instead of external library.
 *
 * Based on: https://medium.com/@tomytubert/mapbox-spiderfy-clusters-without-library-8936d4f45347
 */

interface SpiderfyOptions {
    circleSwitchover?: number
    circleLeavesSeparation?: number
    spiralLegLengthStart?: number
    spiralLegLengthFactor?: number
    spiralLeavesSeparation?: number
    maxLeaves?: number
}

const DEFAULT_OPTIONS: SpiderfyOptions = {
    circleSwitchover: 10,
    circleLeavesSeparation: 60,
    spiralLegLengthStart: 25,
    spiralLegLengthFactor: 5,
    spiralLeavesSeparation: 40,
    maxLeaves: 255
};

export function useSpiderfy(
    map: MapLibreMap,
    emit: (event: string, ...args: unknown[]) => void,
    markers: Ref<Request[]>,
    options: SpiderfyOptions = {}
) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { markClickHandled } = useMapClickGuard();
    const { primaryColor } = useThemeColors();

    // Hoist useMapSettings() to composable top level to guarantee Nuxt context.
    const { clusterMaxZoom, declusterAnimation } = useMapSettings();

    // Decluster animation for zoom-in transitions
    const declusterAnim = useDeclusterAnimation(map);

    let isSpiderfied = false;
    let isProcessing = false;
    let lastClusterClickTime = 0;
    const CLUSTER_CLICK_THROTTLE = 400; // Minimum ms between cluster zoom operations
    let spiderfyClickHandler: ((e: MapLayerMouseEvent) => void) | null = null;
    let mouseEnterHandler: (() => void) | null = null;
    let mouseLeaveHandler: (() => void) | null = null;

    // Source and layer IDs
    const SPIDERFY_SOURCE = 'spiderfy-source';
    const SPIDERFY_LAYER = 'spiderfy-leaves';
    const SPIDERFY_LEGS_LAYER = 'spiderfy-legs';

    /**
     * Calculate positions in a circle pattern (for small clusters)
     * Starts from -45° for diagonal spread (looks better for 2 items)
     */
    const calculateCirclePositions = (count: number): [number, number][] => {
        const separation = opts.circleLeavesSeparation!;
        const points: [number, number][] = [];
        const theta = (2 * Math.PI) / count;
        const startAngle = -Math.PI / 4; // Start at -45° for diagonal

        for (let i = 0; i < count; i++) {
            const angle = startAngle + (theta * i);
            const x = separation * Math.cos(angle);
            const y = separation * Math.sin(angle);
            points.push([x, y]);
        }
        return points;
    };

    /**
     * Calculate positions in a spiral pattern (for larger clusters)
     */
    const calculateSpiralPositions = (count: number): [number, number][] => {
        const legLengthStart = opts.spiralLegLengthStart!;
        const legLengthFactor = opts.spiralLegLengthFactor!;
        const separation = opts.spiralLeavesSeparation!;
        const points: [number, number][] = [];
        let legLength = legLengthStart;
        let angle = 0;

        for (let i = 0; i < count; i++) {
            angle += separation / legLength + i * 0.0005;
            const x = legLength * Math.cos(angle);
            const y = legLength * Math.sin(angle);
            points.push([x, y]);
            legLength += (Math.PI * 2 * legLengthFactor) / angle;
        }
        return points;
    };

    /**
     * Initialize spiderfy source and layers
     */
    const initializeSpiderfy = () => {
        // Add empty spiderfy source
        if (!map.getSource(SPIDERFY_SOURCE)) {
            map.addSource(SPIDERFY_SOURCE, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                cluster: false
            });
        }

        // Add spider legs layer (lines from center to leaves)
        if (!map.getLayer(SPIDERFY_LEGS_LAYER)) {
            map.addLayer({
                id: SPIDERFY_LEGS_LAYER,
                type: 'line',
                source: SPIDERFY_SOURCE,
                filter: ['==', ['get', 'isLeg'], true],
                paint: {
                    'line-color': primaryColor.value || '#3b82f6',
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            });
        }

        // Add spider leaves layer (the actual markers)
        if (!map.getLayer(SPIDERFY_LAYER)) {
            map.addLayer({
                id: SPIDERFY_LAYER,
                type: 'symbol',
                source: SPIDERFY_SOURCE,
                filter: ['==', ['get', 'isLeaf'], true],
                layout: {
                    'icon-image': 'spider-circle',
                    'icon-size': 1,
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                    'icon-offset': ['get', 'iconOffset']
                },
                paint: {
                    'icon-color': primaryColor.value || '#3b82f6',
                    'icon-opacity': 1
                }
            });
        }

        // Create spider circle icon if not exists
        createSpiderCircleIcon();

        // Set up click handler for spider leaves
        if (!spiderfyClickHandler) {
            spiderfyClickHandler = (e: MapLayerMouseEvent) => {
                try {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: [SPIDERFY_LAYER]
                    });

                    if (features.length > 0) {
                        markClickHandled();
                        const feature = features[0];
                        const reportId = feature.properties?.id;
                        const report = markers.value.find(
                            m => m.service_request_id === reportId
                        );
                        if (report) {
                            emit('select-report', { report, mapInstance: map });
                        }
                    }
                } catch {
                    // Ignore tile parsing errors from basemap
                }
            };
            map.on('click', SPIDERFY_LAYER, spiderfyClickHandler);
        }

        // Set up cursor change on hover (store refs for cleanup)
        if (!mouseEnterHandler) {
            mouseEnterHandler = () => {
                map.getCanvas().style.cursor = 'pointer';
            };
            mouseLeaveHandler = () => {
                map.getCanvas().style.cursor = '';
            };
            map.on('mouseenter', SPIDERFY_LAYER, mouseEnterHandler);
            map.on('mouseleave', SPIDERFY_LAYER, mouseLeaveHandler!);
        }
    };

    /**
     * Create the spider circle icon for leaves
     */
    const createSpiderCircleIcon = () => {
        // Guard: document is not available during SSR
        if (import.meta.server) return;
        if (map.hasImage('spider-circle')) return;

        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw white circle
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        map.addImage('spider-circle', ctx.getImageData(0, 0, size, size), {
            sdf: true
        });
    };

    /**
     * Spiderfy a cluster - expand its features in circle/spiral pattern
     */
    const spiderfyCluster = async (clusterId: number, clusterCoords: LngLat) => {
        const source = map.getSource('reports-geojson') as GeoJSONSource;
        if (!source) return;

        try {
            // MapLibre 4+ uses Promise-based API
            const features = await source.getClusterLeaves(clusterId, opts.maxLeaves!, 0);
            if (!features || features.length === 0) return;

            // Calculate positions based on count
            const positions = features.length > opts.circleSwitchover!
                ? calculateSpiralPositions(features.length)
                : calculateCirclePositions(features.length);

            const geoJsonFeatures: GeoJSON.Feature[] = [];
            const centerCoords = [clusterCoords.lng, clusterCoords.lat];

            // Get center point in pixels for coordinate conversion
            const centerPixel = map.project(clusterCoords);

            // Create leaf features with icon offset AND leg features
            features.forEach((feature, index) => {
                const offset = positions[index];

                // Calculate the leaf's actual screen position
                const leafPixel = {
                    x: centerPixel.x + offset[0],
                    y: centerPixel.y + offset[1]
                };

                // Convert back to coordinates for the leg endpoint
                const leafLngLat = map.unproject([leafPixel.x, leafPixel.y]);
                const leafCoords = [leafLngLat.lng, leafLngLat.lat];

                // Add leg line (from center to leaf position)
                geoJsonFeatures.push({
                    type: 'Feature',
                    properties: {
                        isLeg: true
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: [centerCoords, leafCoords]
                    }
                });

                // Add leaf marker
                geoJsonFeatures.push({
                    type: 'Feature',
                    properties: {
                        ...feature.properties,
                        isLeaf: true,
                        iconOffset: offset
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: centerCoords
                    }
                });
            });

            const spiderfySource = map.getSource(SPIDERFY_SOURCE) as GeoJSONSource;

            if (spiderfySource) {
                spiderfySource.setData({
                    type: 'FeatureCollection',
                    features: geoJsonFeatures
                });
                isSpiderfied = true;

                // Hide cluster layers completely during spiderfy
                if (map.getLayer('clusters')) {
                    map.setLayoutProperty('clusters', 'visibility', 'none');
                }
                if (map.getLayer('cluster-count')) {
                    map.setLayoutProperty('cluster-count', 'visibility', 'none');
                }
            }
        } catch (error) {
            console.error('[Spiderfy] Error getting cluster leaves:', error);
        }
    };

    /**
     * Clear all spiderfied features
     */
    const unspiderfyAll = () => {
        if (!isSpiderfied) return;

        const spiderfySource = map.getSource(SPIDERFY_SOURCE) as GeoJSONSource;
        if (spiderfySource) {
            spiderfySource.setData({
                type: 'FeatureCollection',
                features: []
            });
        }

        // Restore cluster layer visibility
        if (map.getLayer('clusters')) {
            map.setLayoutProperty('clusters', 'visibility', 'visible');
        }
        if (map.getLayer('cluster-count')) {
            map.setLayoutProperty('cluster-count', 'visibility', 'visible');
        }

        isSpiderfied = false;
    };

    /**
     * Handle cluster click - zoom in or spiderfy at max zoom.
     *
     * @param clusterCoords - Must be the cluster feature's geometry centroid
     *   (features[0].geometry.coordinates), NOT e.lngLat (the raw click point).
     *   Passing the click point offsets spider legs and the easeTo anchor by up to
     *   ~40px for large cluster circles.  The caller (handleClusterLayerClick in
     *   useMap.ts) is responsible for extracting the centroid from the GeoJSON feature.
     */
    const handleClusterClick = async (clusterId: number, clusterCoords: LngLat) => {
        // Time-based throttle to prevent rapid clicks causing map stale
        const now = Date.now();
        if (now - lastClusterClickTime < CLUSTER_CLICK_THROTTLE) {
            return; // Ignore rapid cluster clicks
        }
        lastClusterClickTime = now;

        // Prevent concurrent processing
        if (isProcessing) return;
        isProcessing = true;

        try {
            const source = map.getSource('reports-geojson') as GeoJSONSource;
            if (!source) return;

            // Clear any existing spiderfy first
            unspiderfyAll();

            // MapLibre 4+ uses Promise-based API
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const currentZoom = map.getZoom();
            const maxZoom = map.getMaxZoom();

            // Spiderfy if:
            // - expansion zoom exceeds source clusterMaxZoom (zooming would destroy the cluster), OR
            // - expansion zoom is beyond map max zoom, OR
            // - we're already at or above the expansion zoom (cluster won't expand further), OR
            // - we're near max zoom
            const shouldSpiderfy = zoom >= clusterMaxZoom.value ||
              zoom >= maxZoom ||
              currentZoom >= zoom ||
              currentZoom >= maxZoom - 1;

            if (shouldSpiderfy) {
                markClickHandled();
                // Await spiderfyCluster so isProcessing stays true until leaves are placed and
                // setData has run — prevents a second click 401ms later from racing the same
                // SPIDERFY_SOURCE write.  easeTo runs after so the camera anchors correctly.
                await spiderfyCluster(clusterId, clusterCoords);
                map.easeTo({ center: clusterCoords });
            } else if (declusterAnimation.value.enabled) {
                // Animate children outward from cluster center, then zoom in.
                // Await so isProcessing is held for the full animation window.
                markClickHandled();
                await declusterAnim.animateDecluster(clusterId, clusterCoords, () => {
                    map.easeTo({
                        center: clusterCoords,
                        zoom: zoom
                    });
                });
            } else {
                // Otherwise zoom in directly
                map.easeTo({
                    center: clusterCoords,
                    zoom: zoom
                });
            }
        } catch (err) {
            console.error('[Spiderfy] Cluster expansion error:', err);
        } finally {
            isProcessing = false;
        }
    };

    /**
     * Cleanup resources
     */
    const cleanup = () => {
        unspiderfyAll();
        declusterAnim.cleanup();

        // Remove event handlers
        if (spiderfyClickHandler) {
            map.off('click', SPIDERFY_LAYER, spiderfyClickHandler);
            spiderfyClickHandler = null;
        }
        if (mouseEnterHandler) {
            map.off('mouseenter', SPIDERFY_LAYER, mouseEnterHandler);
            mouseEnterHandler = null;
        }
        if (mouseLeaveHandler) {
            map.off('mouseleave', SPIDERFY_LAYER, mouseLeaveHandler);
            mouseLeaveHandler = null;
        }

        // Remove layers and source
        if (map.getLayer(SPIDERFY_LAYER)) {
            map.removeLayer(SPIDERFY_LAYER);
        }
        if (map.getLayer(SPIDERFY_LEGS_LAYER)) {
            map.removeLayer(SPIDERFY_LEGS_LAYER);
        }
        if (map.getSource(SPIDERFY_SOURCE)) {
            map.removeSource(SPIDERFY_SOURCE);
        }
        if (map.hasImage('spider-circle')) {
            map.removeImage('spider-circle');
        }
    };

    return {
        initializeSpiderfy,
        handleClusterClick,
        unspiderfyAll,
        cleanup,
        isSpiderfied: () => isSpiderfied
    };
}
