/**
 * Haversine distance helper.
 *
 * Computes the great-circle distance between two coordinates in meters.
 * Tolerant of string OR number lat/lng because facility configs in Drupal
 * occasionally surface coordinates as strings.
 */

export interface LatLngLike {
    lat: number | string
    lng: number | string
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(deg: number): number {
    return (deg * Math.PI) / 180;
}

function toFiniteNumber(value: number | string | undefined | null): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
}

/**
 * Great-circle distance in meters between points a and b.
 * Returns NaN if either coordinate cannot be parsed as a finite number.
 */
export function haversineDistanceMeters(a: LatLngLike, b: LatLngLike): number {
    const lat1 = toFiniteNumber(a?.lat);
    const lng1 = toFiniteNumber(a?.lng);
    const lat2 = toFiniteNumber(b?.lat);
    const lng2 = toFiniteNumber(b?.lng);

    if (lat1 === null || lng1 === null || lat2 === null || lng2 === null) {
        return Number.NaN;
    }

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);

    const h = sinDLat * sinDLat +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return EARTH_RADIUS_METERS * c;
}
