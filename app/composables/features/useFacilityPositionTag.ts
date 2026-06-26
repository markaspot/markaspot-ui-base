/**
 * useFacilityPositionTag (optional mode)
 *
 * Spatial-consistency invariant: the facility tag is a function of the
 * report's position. If the current position lies within `nearestSnapRadius`
 * of an active facility, that facility's id is auto-attached as metadata;
 * if the position drifts out of any radius, the tag auto-detaches. If the
 * position moves closer to a different facility, the tag switches.
 *
 * Silent by design. The citizen never has to toggle or dismiss anything —
 * moving the pin is the only input. No toasts, no UI controls.
 *
 * Only meaningful when facility mode === 'optional'. Exclusive mode is
 * handled by the FacilitySelect dropdown plus `useFacilityNearestSnap`
 * (locate-me flow). Disabled mode makes this composable a no-op.
 */

import type { Ref, ComputedRef } from 'vue';
import type { FacilityConfigItem } from '~~/types/clientConfig';
import { findNearestActiveFacility } from '~/utils/facilities';

interface PositionCoords {
    lat: number | string
    lng: number | string
}

interface UseFacilityPositionTagOptions {
    position: Ref<PositionCoords | null> | ComputedRef<PositionCoords | null>
    isOptional: Ref<boolean> | ComputedRef<boolean>
    selectedFacilityId: Ref<string>
    activeFacilities: Ref<FacilityConfigItem[]> | ComputedRef<FacilityConfigItem[]>
    nearestSnapRadius: Ref<number> | ComputedRef<number>
}

export function useFacilityPositionTag(options: UseFacilityPositionTagOptions) {
    const evaluate = (coords: PositionCoords | null) => {
        if (!options.isOptional.value) return;

        // No position: ensure no stale tag hangs around.
        if (!coords || coords.lat === '' || coords.lng === '' ||
          coords.lat === null || coords.lng === null ||
          coords.lat === undefined || coords.lng === undefined) {
            if (options.selectedFacilityId.value) {
                options.selectedFacilityId.value = '';
            }
            return;
        }

        const lat = Number(coords.lat);
        const lng = Number(coords.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const radius = options.nearestSnapRadius.value;
        if (radius <= 0) {
            // Snap disabled via config. Clear any prior tag for consistency.
            if (options.selectedFacilityId.value) {
                options.selectedFacilityId.value = '';
            }
            return;
        }

        const nearest = findNearestActiveFacility(lat, lng, options.activeFacilities.value);

        if (nearest && nearest.distanceMeters <= radius) {
            if (options.selectedFacilityId.value !== nearest.facility.id) {
                options.selectedFacilityId.value = nearest.facility.id;
            }
        } else if (options.selectedFacilityId.value) {
            options.selectedFacilityId.value = '';
        }
    };

    watch(
        () => options.position.value,
        coords => evaluate(coords),
        { immediate: true, deep: true }
    );

    // Expose for tests and edge cases where a caller wants to re-evaluate
    // after a mode change (e.g. config reload).
    return { evaluate };
}
