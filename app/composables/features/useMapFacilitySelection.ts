import type { FacilityConfigItem } from '~~/types/clientConfig';

/**
 * Bridges the Map.vue facility layer and the report forms
 * via useState-backed singleton shared by the report forms.
 *
 * Two separate channels:
 *  - `facilitySelected`: map emits the picked facility; exclusive-mode
 *    forms consume it to set `selectedFacilityId`.
 *  - `facilityLocationPicked`: map emits lat/lng of the clicked facility;
 *    optional-mode forms consume it to set the report's free-form location
 *    (useFacilityPositionTag then auto-tags the facility via radius).
 *
 * Both channels use `useState` so the value survives across component
 * trees and SSR hydration. Listener sets are module-scoped (not
 * serialized) for one-shot subscriptions when components want to react to
 * NEW picks without re-firing on initial hydration.
 *
 * The composable does NOT know about exclusive/optional modes itself —
 * the consuming form decides which channel is relevant based on its
 * facility-reporting mode.
 */

export interface FacilityLocationPick {
    facility: FacilityConfigItem
    lat: number
    lng: number
}

type FacilitySelectedListener = (facility: FacilityConfigItem) => void;
type FacilityLocationListener = (pick: FacilityLocationPick) => void;

// Module-scoped listener sets. Not serialized, not reactive on purpose
// (listeners are side-effect subscriptions, not state).
const selectedListeners = new Set<FacilitySelectedListener>();
const locationListeners = new Set<FacilityLocationListener>();

export function useMapFacilitySelection() {
    // Global reactive state. Components that bind to this as a prop
    // (e.g., the sync watchers in the forms) will re-evaluate when the
    // map emits a new pick.
    const lastSelectedFacility = useState<FacilityConfigItem | null>(
        'mapFacilityLastSelected',
        () => null
    );
    const lastLocationPick = useState<FacilityLocationPick | null>(
        'mapFacilityLastLocationPick',
        () => null
    );

    /**
     * Map-side API: the facility layer's click handler calls this when
     * the user picks a facility marker. Both the reactive state AND
     * listeners fire, so either consumption style works.
     */
    const selectFacility = (facility: FacilityConfigItem) => {
        lastSelectedFacility.value = facility;
        selectedListeners.forEach((listener) => {
            try {
                listener(facility);
            } catch (error) {
                console.error('useMapFacilitySelection selected listener error', error);
            }
        });
    };

    /**
     * Map-side API: optional-mode variant. Instead of selecting the
     * facility, report the coords to the form so it can place the
     * report marker at the facility's position and let
     * useFacilityPositionTag auto-tag via radius. Useful when the
     * operator wants the facility to appear clickable but not preempt
     * the citizen's free-form location flow.
     */
    const pickFacilityLocation = (pick: FacilityLocationPick) => {
        lastLocationPick.value = pick;
        locationListeners.forEach((listener) => {
            try {
                listener(pick);
            } catch (error) {
                console.error('useMapFacilitySelection location listener error', error);
            }
        });
    };

    /**
     * Form-side API: subscribe to new facility picks. Returns an
     * unsubscribe function — call it in onUnmounted to avoid listener
     * leaks across HMR / route changes.
     *
     * `immediate: true` fires the listener synchronously on register if
     * a facility is already selected in the shared state. This matters
     * when a map-side click OPENS the form (e.g., Amsterdam landing
     * page): `selectFacility` runs before any form is mounted, so the
     * listener-only pattern misses the initial pick. We intentionally
     * do NOT clear `lastSelectedFacility` on consume — the halo watcher
     * in useMap.ts tracks that state, and re-opening the dialog
     * without a fresh click should still adopt the visibly-selected
     * facility.
     */
    const onFacilitySelected = (
        listener: FacilitySelectedListener,
        options: { immediate?: boolean } = {}
    ) => {
        selectedListeners.add(listener);
        if (options.immediate && lastSelectedFacility.value) {
            try {
                listener(lastSelectedFacility.value);
            } catch (error) {
                console.error('useMapFacilitySelection immediate listener error', error);
            }
        }
        return () => selectedListeners.delete(listener);
    };

    const onFacilityLocationPicked = (
        listener: FacilityLocationListener,
        options: { immediate?: boolean } = {}
    ) => {
        locationListeners.add(listener);
        if (options.immediate && lastLocationPick.value) {
            try {
                listener(lastLocationPick.value);
            } catch (error) {
                console.error('useMapFacilitySelection immediate location listener error', error);
            }
        }
        return () => locationListeners.delete(listener);
    };

    /**
     * Reset shared selection state. Forms call this on unmount so that
     * closing a dialog with a pre-filled facility and reopening from a
     * free-form map click does not re-adopt the stale pick via
     * `immediate: true`. Also collapses the halo layer (the watcher in
     * useMap.ts tracks `lastSelectedFacility.value?.id` and flips the
     * filter to the sentinel when the value is null).
     */
    const clearSelection = () => {
        lastSelectedFacility.value = null;
        lastLocationPick.value = null;
    };

    return {
        lastSelectedFacility,
        lastLocationPick,
        selectFacility,
        pickFacilityLocation,
        onFacilitySelected,
        onFacilityLocationPicked,
        clearSelection
    };
}
