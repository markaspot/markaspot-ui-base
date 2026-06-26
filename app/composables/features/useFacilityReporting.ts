import type { FacilityConfigItem, FacilityMode } from '~~/types/clientConfig';
import {
    findNearestActiveFacility,
    resolveValidFacilityId as resolveValidFacilityIdUtil
} from '~/utils/facilities';
import { formatFacilityAddress } from '~/utils/facilityAddress';
import { haversineDistanceMeters } from '~/utils/haversine';

interface FacilityLocationValue {
    lat: string | number
    lng: string | number
    address?: unknown
    displayName?: string
}

interface UseFacilityReportingOptions {
    selectedFacilityId: Ref<string>
    location: Ref<FacilityLocationValue>
}

export interface SnapToNearestResult {
    snapped: boolean
    facility: FacilityConfigItem | null
    reason: 'snapped' | 'no_nearby' | 'low_accuracy' | 'disabled' | 'no_coords'
    distanceMeters?: number
}

const DEFAULT_NEAREST_SNAP_RADIUS_METERS = 50;
// Hard upper bound: anything beyond this is almost certainly a
// misconfiguration (outside a single neighborhood) and would cause the
// snap logic to pull in unrelated facilities — or, with accuracy-floor
// logic, disable the accuracy gate entirely.
const MAX_NEAREST_SNAP_RADIUS_METERS = 5000;

export function useFacilityReporting(options: UseFacilityReportingOptions) {
    const route = useRoute();
    const { t, locale } = useI18n();
    const { clientConfig } = useMarkASpotConfig();

    const facilitySettings = computed(() => clientConfig.value.facilities);
    const activeFacilities = computed(() =>
        (facilitySettings.value?.items || []).filter(item => item.active !== false)
    );

    /**
     * Resolves the effective facility mode from config. Legacy tenants that
     * set `enabled: true` without `mode` are treated as `exclusive` so the
     * pre-mode behavior is preserved. `enabled: false` always wins and
     * resolves to `disabled`, even if `mode` is set.
     */
    const facilityMode = computed<FacilityMode>(() => {
        const settings = facilitySettings.value;
        if (!settings || settings.enabled === false) return 'disabled';
        if (settings.mode === 'optional' || settings.mode === 'exclusive') {
            return settings.mode;
        }
        if (settings.enabled === true) return 'exclusive';
        return 'disabled';
    });

    // Mode gates. UI is only meaningful when at least one active facility exists.
    const isExclusive = computed(() =>
        facilityMode.value === 'exclusive' && activeFacilities.value.length > 0
    );
    const isOptional = computed(() =>
        facilityMode.value === 'optional' && activeFacilities.value.length > 0
    );
    const facilityUIEnabled = computed(() => isExclusive.value || isOptional.value);

    // Backward-compat alias: prior to the three-mode split, `facilityModeEnabled`
    // meant "facility mode active and replacing location" — i.e. exclusive.
    // Existing call sites continue to work; new code should use `isExclusive`
    // or `facilityUIEnabled` depending on intent.
    const facilityModeEnabled = isExclusive;

    /**
     * Mixed-mode flag (#361): exclusive facility UI is live AND the operator has
     * chosen to keep the map picker alongside it. Reporters can either pick a
     * facility quick-pick or drop a free pin anywhere on the map. Only defined
     * for exclusive; optional mode never hides the picker.
     */
    const isMixedMode = computed(() =>
        isExclusive.value && facilitySettings.value?.hideMapPicker === false
    );

    /**
     * Whether the classic map-picker UI (field_geolocation dialog + locate-me +
     * reverse geocoding + mapCenter watcher) should render. True in disabled
     * mode, true in optional mode (facility is a tag on top of a free pick), and
     * true in exclusive mode when `hideMapPicker` is explicitly false. Only the
     * classic "exclusive + hideMapPicker=true" path suppresses it — matching the
     * original two-mode behavior before the mixed-mode split.
     */
    const showMapPicker = computed(() => {
        if (!isExclusive.value) return true;
        return facilitySettings.value?.hideMapPicker === false;
    });

    const singularLabel = computed(() =>
        facilitySettings.value?.label?.singular?.trim() || t('form.facility')
    );
    const pluralLabel = computed(() => {
        const configured = facilitySettings.value?.label?.plural?.trim();
        if (configured) return configured;
        // If operator configured a singular but no plural, keep singular as safest fallback
        // (naive "${singular}s" breaks DE, FR, NL, PL, TR and EN irregulars).
        const configuredSingular = facilitySettings.value?.label?.singular?.trim();
        if (configuredSingular) return configuredSingular;
        return t('form.facility_plural');
    });

    const selectedFacility = computed<FacilityConfigItem | null>(() => {
        if (!facilityUIEnabled.value || !options.selectedFacilityId.value) {
            return null;
        }

        return activeFacilities.value.find(item => item.id === options.selectedFacilityId.value) || null;
    });

    const selectOptions = computed(() => activeFacilities.value.map(item => ({
        label: item.label,
        value: item.id
    })));

    // URL preselect is a one-shot: `?facility=<id>` seeds the initial
    // selection on mount, but subsequent user actions (clearing the select,
    // picking a different facility, dropping a free pin in mixed mode) must
    // win. Without the `urlConsumed` gate the `immediate: true` watcher below
    // re-applies the URL value on every dep change, so clearing the select
    // would silently snap back to the URL-preselected facility. Fixed in #361.
    const urlConsumed = ref(false);
    const preselectedFacilityId = computed(() => {
        if (urlConsumed.value) return '';
        const queryValue = route.query.facility;
        return typeof queryValue === 'string' ? queryValue : '';
    });

    const resolveValidFacilityId = (candidate?: string | null) =>
        resolveValidFacilityIdUtil(candidate, activeFacilities.value);

    const nearestSnapRadius = computed(() => {
        const raw = facilitySettings.value?.nearestSnapRadius;
        if (typeof raw !== 'number' || !Number.isFinite(raw)) {
            return DEFAULT_NEAREST_SNAP_RADIUS_METERS;
        }
        return Math.min(raw, MAX_NEAREST_SNAP_RADIUS_METERS);
    });

    /**
     * Attempt to auto-select the active facility closest to the supplied
     * coordinate. Used both for locate-me snap (exclusive mode) and for
     * continuous position-driven tagging (optional mode).
     *
     * Applies two gates before snapping:
     *  - accuracy floor: if `browserAccuracyMeters` exceeds `nearestSnapRadius`
     *    we skip auto-select and report `low_accuracy`.
     *  - radius filter: winner must be within `nearestSnapRadius` meters.
     *
     * Caller is responsible for surfacing toast feedback. Returns a result
     * the caller can inspect; this does NOT auto-detach a previously-set
     * facility id (the caller's watcher decides detach semantics based on
     * mode).
     */
    const snapToNearestFacility = (
        coords: { lat: number | string, lng: number | string } | null | undefined,
        browserAccuracyMeters?: number | null
    ): SnapToNearestResult => {
        if (!facilityUIEnabled.value) {
            return { snapped: false, facility: null, reason: 'disabled' };
        }

        if (!coords || coords.lat === '' || coords.lng === '' ||
          coords.lat === null || coords.lng === null ||
          coords.lat === undefined || coords.lng === undefined) {
            return { snapped: false, facility: null, reason: 'no_coords' };
        }

        const radius = nearestSnapRadius.value;
        if (radius <= 0) {
            return { snapped: false, facility: null, reason: 'disabled' };
        }

        // Accuracy floor: a fix worse than our snap radius would snap to the
        // wrong facility, so we refuse to guess.
        if (typeof browserAccuracyMeters === 'number' &&
          Number.isFinite(browserAccuracyMeters) &&
          browserAccuracyMeters > radius) {
            return { snapped: false, facility: null, reason: 'low_accuracy' };
        }

        const nearest = findNearestActiveFacility(
            coords.lat,
            coords.lng,
            activeFacilities.value
        );

        if (!nearest || nearest.distanceMeters > radius) {
            return {
                snapped: false,
                facility: null,
                reason: 'no_nearby',
                distanceMeters: nearest?.distanceMeters
            };
        }

        options.selectedFacilityId.value = nearest.facility.id;
        return {
            snapped: true,
            facility: nearest.facility,
            reason: 'snapped',
            distanceMeters: nearest.distanceMeters
        };
    };

    /**
     * Treat the location ref as "populated" when both lat and lng carry a
     * non-empty, finite value. Accepts both string and number encodings so
     * the form draft shape (`{ lat: '52.37', lng: '4.89' }`) and the raw
     * geolocation shape (`{ lat: 52.37, lng: 4.89 }`) both register.
     */
    const locationHasCoords = (value: FacilityLocationValue | null | undefined): boolean => {
        if (!value) return false;
        const lat = value.lat;
        const lng = value.lng;
        if (lat === '' || lat === null || lat === undefined) return false;
        if (lng === '' || lng === null || lng === undefined) return false;
        return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    };

    const syncLocationFromFacility = (facility: FacilityConfigItem | null) => {
        if (!facility) {
            // Never clobber a populated location just because no facility is
            // selected. The location field is either (a) facility-derived
            // (then it was already empty and this is a no-op), or (b) a
            // restored draft / user-placed pin (in which case wiping it
            // destroys reporter input). This guard keeps the watcher safe
            // against early firing at setup time and against async client
            // config loads that flip `facilityUIEnabled` after a draft has
            // been hydrated.
            if (locationHasCoords(options.location.value)) {
                return;
            }

            options.location.value = {
                lat: '',
                lng: '',
                address: undefined,
                displayName: ''
            };
            return;
        }

        options.location.value = {
            lat: String(facility.lat),
            lng: String(facility.lng),
            address: undefined,
            displayName: formatFacilityAddress(facility.address, locale.value) || facility.label
        };
    };

    const initializeSelection = (preferredId?: string) => {
        if (!facilityUIEnabled.value) {
            return;
        }

        const nextFacilityId =
            resolveValidFacilityId(preferredId) ||
            resolveValidFacilityId(options.selectedFacilityId.value) ||
            resolveValidFacilityId(preselectedFacilityId.value);

        options.selectedFacilityId.value = nextFacilityId;
    };

    /**
     * Validate a saved facility id against an incoming location (e.g. the
     * dialog's mapCenter after the user repositioned the pin). The form draft
     * persists facilityId + location as a pair, but nothing else guarantees
     * spatial coherence when the dialog reopens against a different pick.
     * If the saved facility lies farther than `nearestSnapRadius` from the
     * supplied coordinate, we treat the draft's pick as stale and return
     * undefined so callers can reset to a clean slate.
     *
     * Returns the saved id unchanged when:
     *  - facility UI is disabled (nothing to validate against)
     *  - no location is supplied (preserve the draft exactly)
     *  - the saved id no longer maps to an active facility (initializeSelection
     *    will already drop it via resolveValidFacilityId)
     *  - distance cannot be computed (NaN coords)
     */
    const resolveSavedFacilityIdForLocation = (
        savedFacilityId: string | undefined | null,
        coords: { lat?: number | string | null, lng?: number | string | null } | null | undefined
    ): string | undefined => {
        if (!savedFacilityId) return undefined;
        if (!facilityUIEnabled.value) return savedFacilityId;
        if (!coords || coords.lat === undefined || coords.lat === null || coords.lat === '' ||
          coords.lng === undefined || coords.lng === null || coords.lng === '') {
            return savedFacilityId;
        }

        const facility = activeFacilities.value.find(item => item.id === savedFacilityId);
        if (!facility) return savedFacilityId;

        const distance = haversineDistanceMeters(
            { lat: coords.lat, lng: coords.lng },
            { lat: facility.lat, lng: facility.lng }
        );
        if (!Number.isFinite(distance)) return savedFacilityId;

        return distance <= nearestSnapRadius.value ? savedFacilityId : undefined;
    };

    // `immediate: true` is intentional: at mount we need to reconcile the
    // preselected/draft-restored facilityId against the actually-loaded
    // facilities config, which may arrive after the draft hydrates. Without
    // the immediate fire, a ?facility= URL param or a restored draft id
    // would sit unvalidated until a later config change. The destructive
    // "no selectable facility" branch calls `syncLocationFromFacility(null)`,
    // which is now guarded by `locationHasCoords` so it cannot wipe a
    // populated draft location.
    watch(
        () => [facilityUIEnabled.value, activeFacilities.value.map(item => item.id).join('|'), preselectedFacilityId.value],
        () => {
            if (!facilityUIEnabled.value) {
                return;
            }

            const currentFacilityId = resolveValidFacilityId(options.selectedFacilityId.value);
            if (currentFacilityId) {
                options.selectedFacilityId.value = currentFacilityId;
                // URL was either already consumed or irrelevant — in both
                // cases we can safely burn the flag so a later clear sticks.
                urlConsumed.value = true;
                return;
            }

            const routeFacilityId = resolveValidFacilityId(preselectedFacilityId.value);
            if (routeFacilityId) {
                options.selectedFacilityId.value = routeFacilityId;
                // First-and-only consumption of `?facility=<id>`. A subsequent
                // manual clear (`setFacilityId('')`) must stay empty.
                urlConsumed.value = true;
            } else if (isExclusive.value) {
                // Exclusive mode owns the location field — clear it when no
                // facility is selectable. Optional/disabled leave the location
                // untouched (it's free-form, authoritative).
                syncLocationFromFacility(null);
            }
        },
        { immediate: true }
    );

    // Exclusive mode: selecting a facility drives the location field.
    // Optional mode: facility is a tag on top of an independent position —
    // no location sync. Disabled: no watcher relevance.
    //
    // The watcher is intentionally NOT immediate: an immediate fire at setup
    // time sees `selectedFacility === null` before the consuming form has had
    // a chance to run `initializeSelection(savedState.facilityId)` in
    // `onMounted`, and would therefore call `syncLocationFromFacility(null)`.
    // That destructive path is now defused by `locationHasCoords`, but we
    // still drop `immediate` so a normal mount (draft restore, classic
    // location) never even enters the clear branch. The watcher reacts to
    // genuine facility selection changes only — which is the semantics we
    // want.
    watch(selectedFacility, (facility) => {
        if (!isExclusive.value) {
            return;
        }

        syncLocationFromFacility(facility);
    });

    /**
     * Mixed-mode (#361): reporter moved the pin / used locate-me after (or
     * instead of) picking a facility. We intentionally drop the facility
     * selection so the free location wins and no silent "snap back to nearest
     * facility" can fight the user's intent. Harmless in exclusive-hidden and
     * optional mode — the caller should only invoke this on free-location
     * actions that should trump a quick-pick.
     *
     * Announces the clear via a non-blocking info toast in mixed mode so a
     * mobile brush-drag that accidentally pans the map doesn't silently throw
     * away a carefully-picked facility. `silent: true` suppresses the toast
     * for user-initiated actions (e.g. locate-me, where the user already
     * expects the spot to move) — no point double-announcing their own tap.
     */
    const clearFacilitySelection = (opts: { silent?: boolean } = {}) => {
        const previousFacility = selectedFacility.value;

        if (options.selectedFacilityId.value !== '') {
            options.selectedFacilityId.value = '';
        }
        // URL is also burnt — a mid-session pin drop invalidates the deep-link
        // preselect just like a manual select-clear does.
        urlConsumed.value = true;

        if (!opts.silent && isMixedMode.value && previousFacility) {
            useToast().add({
                // Scope the id to the cleared facility so rapid brush-drags
                // that clear two different facilities stack distinctly rather
                // than the second overwriting the first in-place (Nuxt UI's
                // toast dedup key is the id).
                id: `facility-deselected-map-pick-${previousFacility.id}`,
                title: t('form.facility_deselected_map_pick', { label: previousFacility.label }),
                color: 'info',
                icon: 'i-lucide-map-pin',
                duration: 4000
            });
        }
    };

    return {
        facilitySettings,
        facilityMode,
        isExclusive,
        isOptional,
        isMixedMode,
        facilityUIEnabled,
        facilityModeEnabled,
        showMapPicker,
        activeFacilities,
        selectedFacility,
        selectOptions,
        singularLabel,
        pluralLabel,
        initializeSelection,
        clearFacilitySelection,
        resolveValidFacilityId,
        resolveSavedFacilityIdForLocation,
        nearestSnapRadius,
        snapToNearestFacility
    };
}
