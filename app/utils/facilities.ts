/**
 * Pure facility helpers shared by `useFacilityReporting` and the locate-me
 * auto-snap flow.
 */

import type { FacilityConfigItem } from '~~/types/clientConfig';
import { haversineDistanceMeters, type LatLngLike } from './haversine';

/**
 * Returns the candidate id if it matches an active facility, otherwise ''.
 */
export function resolveValidFacilityId(
    candidate: string | undefined | null,
    activeFacilities: readonly FacilityConfigItem[] | null | undefined
): string {
    if (!candidate) return '';
    const list = activeFacilities ?? [];
    return list.some(item => item.id === candidate) ? candidate : '';
}

export interface NearestFacilityResult {
    facility: FacilityConfigItem
    distanceMeters: number
}

/**
 * Find the active facility closest to the supplied coordinate.
 *
 * Returns null if there are no active facilities, or if every facility has
 * invalid coordinates. Does NOT apply a radius filter - callers decide
 * whether the winner is within `nearestSnapRadius`.
 */
export function findNearestActiveFacility(
    userLat: number | string,
    userLng: number | string,
    activeFacilities: readonly FacilityConfigItem[] | null | undefined
): NearestFacilityResult | null {
    const list = activeFacilities ?? [];
    if (list.length === 0) return null;

    const user: LatLngLike = { lat: userLat, lng: userLng };

    let best: NearestFacilityResult | null = null;

    for (const facility of list) {
        const distance = haversineDistanceMeters(user, {
            lat: facility.lat,
            lng: facility.lng
        });
        if (!Number.isFinite(distance)) continue;
        if (best === null || distance < best.distanceMeters) {
            best = { facility, distanceMeters: distance };
        }
    }

    return best;
}
