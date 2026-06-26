import type { BoundsType } from '~~/types';

/**
 * Calculate raw bounding box from GeoJSON boundary features
 * Returns [minLng, minLat, maxLng, maxLat] or null
 */
function calculateRawBbox(geo: any): number[] | null {
    if (!geo || !geo.features?.length) return null;

    const expandBBox = (bbox: number[], coord: number[]) => {
        bbox[0] = Math.min(bbox[0], coord[0]); // minLng
        bbox[1] = Math.min(bbox[1], coord[1]); // minLat
        bbox[2] = Math.max(bbox[2], coord[0]); // maxLng
        bbox[3] = Math.max(bbox[3], coord[1]); // maxLat
    };

    const bbox = [Infinity, Infinity, -Infinity, -Infinity];

    for (const f of geo.features) {
        const g = f.geometry;
        if (!g) continue;

        if (g.type === 'Polygon') {
            for (const ring of g.coordinates) {
                for (const c of ring) expandBBox(bbox, c as any);
            }
        } else if (g.type === 'MultiPolygon') {
            for (const poly of g.coordinates) {
                for (const ring of poly) {
                    for (const c of ring) expandBBox(bbox, c as any);
                }
            }
        }
    }

    if (!Number.isFinite(bbox[0])) return null;
    return bbox;
}

/**
 * Calculate bounding box from GeoJSON boundary features
 * Returns [[minLng, minLat], [maxLng, maxLat]] with 2.5x padding for MapLibre
 */
export function calculateBoundaryBounds(geo: any): number[][] | null {
    const bbox = calculateRawBbox(geo);
    if (!bbox) return null;

    // Pad bounds to allow more generous panning around edges
    const padLng = (bbox[2] - bbox[0]) * 2.5;
    const padLat = (bbox[3] - bbox[1]) * 2.5;

    return [
        [bbox[0] - padLng, bbox[1] - padLat],
        [bbox[2] + padLng, bbox[3] + padLat]
    ];
}

/**
 * Get BoundsType from GeoJSON boundary features (for API calls)
 * Returns { minLat, maxLat, minLng, maxLng } without padding
 */
export function getBoundsType(geo: any): BoundsType | null {
    const bbox = calculateRawBbox(geo);
    if (!bbox) return null;

    return {
        minLng: bbox[0],
        minLat: bbox[1],
        maxLng: bbox[2],
        maxLat: bbox[3]
    };
}
