/**
 * useFacilityNearestSnap
 *
 * Watches geolocated coordinates (from the map's locate-me button) and, when
 * facility reporting mode is active, auto-selects the nearest facility inside
 * the configured snap radius. Surfaces snap / no-nearby / low-accuracy
 * outcomes via toast.
 *
 * Intentionally NOT auto-run on mount: it fires only when `geolocatedCoords`
 * changes to a new coordinate pair, i.e. the user clicked locate-me.
 */

import type { Ref, ComputedRef } from 'vue';
import type { SnapToNearestResult } from './useFacilityReporting';

interface GeolocatedCoords {
    lat: number
    lng: number
}

interface UseFacilityNearestSnapOptions {
    geolocatedCoords: Ref<GeolocatedCoords | null> | ComputedRef<GeolocatedCoords | null>
    facilityModeEnabled: Ref<boolean> | ComputedRef<boolean>
    singularLabel: Ref<string> | ComputedRef<string>
    snapToNearestFacility: (
        coords: GeolocatedCoords,
        accuracyMeters?: number | null
    ) => SnapToNearestResult
}

export function useFacilityNearestSnap(options: UseFacilityNearestSnapOptions) {
    const { t } = useI18n();
    const toast = useToast();
    const { lastPosition } = useGeolocation();

    const handled = ref<string | null>(null);

    const showSnapToast = (label: string) => {
        toast.add({
            title: t('form.facility_nearest_snapped', { label }),
            color: 'success',
            icon: 'i-heroicons-map-pin',
            duration: 4000
        });
    };

    const showNoNearbyToast = () => {
        toast.add({
            title: t('form.facility_no_nearby'),
            color: 'warning',
            icon: 'i-heroicons-map-pin',
            duration: 5000
        });
    };

    const processCoords = (coords: GeolocatedCoords | null) => {
        // When the locate-me flow ends (coords reset to null), clear the
        // dedupe key so a fresh press at the same spot is processed again
        // instead of being silently swallowed.
        if (!coords) {
            handled.value = null;
            return;
        }
        if (!options.facilityModeEnabled.value) return;

        // Dedupe: an identical coord pair (e.g. same locate-me press that
        // re-triggered a watcher) is processed only once.
        const key = `${coords.lat.toFixed(6)}:${coords.lng.toFixed(6)}`;
        if (handled.value === key) return;
        handled.value = key;

        // Read accuracy from the geolocation singleton. It is populated on the
        // same getCurrentPosition() call that produced the coords upstream.
        const accuracy = lastPosition.value?.accuracy ?? null;

        const result = options.snapToNearestFacility(coords, accuracy);

        if (result.reason === 'snapped' && result.facility) {
            showSnapToast(result.facility.label);
        } else if (result.reason === 'no_nearby' || result.reason === 'low_accuracy') {
            showNoNearbyToast();
        }
        // 'disabled' / 'no_coords' stay silent.
    };

    watch(
        () => options.geolocatedCoords.value,
        (coords) => {
            processCoords(coords);
        },
        { flush: 'post' }
    );

    return {
        /**
         * Exposed for tests / ad-hoc callers. Normally the watcher handles
         * everything.
         */
        processCoords
    };
}
