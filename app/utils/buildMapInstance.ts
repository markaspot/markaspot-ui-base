import { createMapConfig } from './createMapConfig';
import type { RequestParameters } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';

/**
 * Parse a numeric value, returning the fallback if the result is NaN/null/undefined.
 * Unlike `??`, this also handles NaN from parseFloat/parseInt.
 */
function numericWithFallback(value: number | undefined | null, fallback: number): number {
    return (value != null && !Number.isNaN(value)) ? value : fallback;
}

/** Check if a numeric value is explicitly configured (not null/undefined/NaN) */
function isConfigured(value: number | undefined | null): boolean {
    return value != null && !Number.isNaN(value);
}

/**
 * Calculate the center point from a GeoJSON boundary's bounding box.
 * Returns [lng, lat] or null if boundary is empty/invalid.
 */
function centerFromBoundary(boundary: FeatureCollection | null | undefined): [number, number] | null {
    if (!boundary?.features?.length) return null;

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

    for (const f of boundary.features) {
        const g = f.geometry;
        if (!g) continue;

        const processCoord = (coord: number[]) => {
            minLng = Math.min(minLng, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLng = Math.max(maxLng, coord[0]);
            maxLat = Math.max(maxLat, coord[1]);
        };

        if (g.type === 'Polygon') {
            for (const ring of (g as GeoJSON.Polygon).coordinates) {
                for (const c of ring) processCoord(c);
            }
        } else if (g.type === 'MultiPolygon') {
            for (const poly of (g as GeoJSON.MultiPolygon).coordinates) {
                for (const ring of poly) {
                    for (const c of ring) processCoord(c);
                }
            }
        }
    }

    if (!Number.isFinite(minLng)) return null;
    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

export function buildMapInstanceConfig(options: {
    mapContainer: HTMLElement
    settings: any
    props: any
    boundaryGeoJSON?: FeatureCollection | null
    preserveDrawingBuffer?: boolean
    transformRequest?: (url: string, resourceType: string) => RequestParameters
}) {
    const { mapContainer, settings, props, boundaryGeoJSON, preserveDrawingBuffer, transformRequest } = options;

    const isDesktopNow = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
    const desktopAttrMode = settings?.map_attribution_desktop || 'builtin';
    const mobileAttrMode = settings?.map_attribution_mobile || 'custom';
    const attributionControlEnabled = isDesktopNow
        ? (desktopAttrMode === 'builtin' || desktopAttrMode === 'both')
        : (mobileAttrMode === 'builtin' || mobileAttrMode === 'both');

    // Center priority: 1. Props  2. Drupal settings  3. Boundary center  4. [0, 0]
    const propsLng = props.centerLng;
    const propsLat = props.centerLat;
    const settingsLng = parseFloat(settings.center_lng);
    const settingsLat = parseFloat(settings.center_lat);

    let center: [number, number];
    if (isConfigured(propsLng) && isConfigured(propsLat)) {
        center = [propsLng, propsLat];
    } else if (isConfigured(settingsLng) && isConfigured(settingsLat)) {
        center = [settingsLng, settingsLat];
    } else {
        // No explicit center configured: try boundary centroid
        center = centerFromBoundary(boundaryGeoJSON) ?? [0, 0];
    }

    const zoom = numericWithFallback(props.initialZoom, numericWithFallback(parseInt(settings.zoom_initial, 10), 13));

    return createMapConfig({
        container: mapContainer,
        center,
        zoom,
        attributionControl: attributionControlEnabled,
        logoPosition: settings?.map_logo_position || 'bottom-left',
        preserveDrawingBuffer,
        transformRequest
    });
}
