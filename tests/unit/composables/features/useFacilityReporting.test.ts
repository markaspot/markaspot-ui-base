/**
 * Unit Tests for useFacilityReporting
 *
 * Focused on the spatial-coherence helper that decides whether a draft's
 * saved facilityId is still relevant on dialog reopen. Regression guard for
 * the "stale facility pre-selected after moving the marker" bug: closing the
 * dialog with a facility pre-filled, then reopening it with a mapCenter
 * farther than `nearestSnapRadius` from the facility, must NOT restore the
 * stale facility.
 *
 * @see /app/composables/features/useFacilityReporting.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ref, computed, nextTick, effectScope } from 'vue';
import type { FacilitiesConfig } from '@@/types/clientConfig';
import { clearMockState, mockRouteData } from '../../__mocks__/nuxt';
import { useFacilityReporting } from '@/composables/features/useFacilityReporting';

// ============================================================================
// Mock Dependencies
// ============================================================================

// Amsterdam Centraal and Amsterdam Zuid are ~4.6km apart — comfortable
// distance for radius tests without venturing into edge-case numerics.
const FACILITY_CENTRAAL = {
    id: 'centraal',
    label: 'Kindergarten Centraal',
    lat: 52.379189,
    lng: 4.899431,
    address: 'Stationsplein 1',
    active: true
};

const FACILITY_ZUID = {
    id: 'zuid',
    label: 'Kindergarten Zuid',
    lat: 52.338889,
    lng: 4.872222,
    address: 'Zuidplein 1',
    active: true
};

const mockFacilities = ref<FacilitiesConfig | null>(null);

globalThis.useMarkASpotConfig = () => ({
    clientConfig: computed(() => ({
        facilities: mockFacilities.value
    })),
    config: computed(() => ({ facilities: mockFacilities.value })),
    fetchConfig: vi.fn(),
    clearCache: vi.fn()
}) as any;

// ============================================================================
// Helpers
// ============================================================================

interface SetupOptions {
    /** Pre-seed the selectedFacilityId ref, e.g. to emulate a restored draft */
    selectedFacilityId?: string
    /** Pre-seed the location ref, e.g. to emulate a restored classic draft */
    location?: { lat: string | number, lng: string | number, address?: unknown, displayName?: string }
}

const activeScopes: Array<ReturnType<typeof effectScope>> = [];

const setupComposable = (config: FacilitiesConfig | null, opts: SetupOptions = {}) => {
    mockFacilities.value = config;
    const selectedFacilityId = ref(opts.selectedFacilityId ?? '');
    const location = ref(opts.location ?? { lat: '', lng: '', address: undefined, displayName: '' });

    // Wrap the composable in an effect scope so the watcher callbacks it
    // registers get cleaned up between tests. Without this, every setup()
    // leaks two watchers into the global reactive graph and later tests
    // see cross-talk when they mutate `mockFacilities`.
    const scope = effectScope();
    activeScopes.push(scope);
    const api = scope.run(() => useFacilityReporting({ selectedFacilityId, location }))!;

    return {
        ...api,
        selectedFacilityId,
        location,
        scope
    };
};

// ============================================================================
// Tests
// ============================================================================

beforeEach(() => {
    clearMockState();
    mockFacilities.value = null;
});

afterEach(() => {
    while (activeScopes.length) {
        activeScopes.pop()?.stop();
    }
});

describe('useFacilityReporting.resolveSavedFacilityIdForLocation', () => {
    it('returns undefined when no saved facility id is supplied', () => {
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        expect(resolveSavedFacilityIdForLocation(undefined, { lat: 52.37, lng: 4.89 })).toBeUndefined();
        expect(resolveSavedFacilityIdForLocation('', { lat: 52.37, lng: 4.89 })).toBeUndefined();
        expect(resolveSavedFacilityIdForLocation(null, { lat: 52.37, lng: 4.89 })).toBeUndefined();
    });

    it('preserves the saved id when facility UI is disabled', () => {
        // Disabled tenants have nothing to validate against — caller's
        // initializeSelection will short-circuit the actual selection.
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: false,
            items: [FACILITY_CENTRAAL]
        });

        expect(resolveSavedFacilityIdForLocation('centraal', { lat: 0, lng: 0 })).toBe('centraal');
    });

    it('preserves the saved id when no location is supplied', () => {
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL]
        });

        expect(resolveSavedFacilityIdForLocation('centraal', null)).toBe('centraal');
        expect(resolveSavedFacilityIdForLocation('centraal', undefined)).toBe('centraal');
        expect(resolveSavedFacilityIdForLocation('centraal', { lat: '', lng: '' })).toBe('centraal');
        expect(resolveSavedFacilityIdForLocation('centraal', { lat: null, lng: null })).toBe('centraal');
    });

    it('preserves the saved id when mapCenter is within nearestSnapRadius', () => {
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            nearestSnapRadius: 100,
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        // Exact facility coords -> distance 0 -> within any radius.
        expect(
            resolveSavedFacilityIdForLocation('centraal', {
                lat: FACILITY_CENTRAAL.lat,
                lng: FACILITY_CENTRAAL.lng
            })
        ).toBe('centraal');
    });

    it('drops the saved id when mapCenter is outside nearestSnapRadius', () => {
        // 50m default radius; Centraal -> Zuid is ~4.6km.
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        expect(
            resolveSavedFacilityIdForLocation('centraal', {
                lat: FACILITY_ZUID.lat,
                lng: FACILITY_ZUID.lng
            })
        ).toBeUndefined();
    });

    it('honors a widened nearestSnapRadius configured per tenant', () => {
        // Same 4.6km gap, but 10km radius keeps the facility valid.
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            nearestSnapRadius: 10000,
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        expect(
            resolveSavedFacilityIdForLocation('centraal', {
                lat: FACILITY_ZUID.lat,
                lng: FACILITY_ZUID.lng
            })
        ).toBe('centraal');
    });

    it('preserves the saved id when it no longer matches an active facility', () => {
        // The caller's initializeSelection -> resolveValidFacilityId drops
        // orphans; here we must NOT second-guess that by returning undefined,
        // because that would be indistinguishable from "spatially stale" and
        // callers need to differentiate the two paths.
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL]
        });

        expect(
            resolveSavedFacilityIdForLocation('removed', { lat: 52.37, lng: 4.89 })
        ).toBe('removed');
    });

    it('preserves the saved id when mapCenter coords are not finite', () => {
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL]
        });

        expect(
            resolveSavedFacilityIdForLocation('centraal', { lat: 'not-a-number', lng: 'nope' })
        ).toBe('centraal');
    });

    it('applies in optional mode just like exclusive mode', () => {
        // Optional mode has its own self-healing via useFacilityPositionTag,
        // but on form reopen the draft's facilityId is restored before the
        // position watcher can react. The spatial-coherence check must fire
        // in optional mode too to avoid a brief stale-tag flash.
        const { resolveSavedFacilityIdForLocation } = setupComposable({
            enabled: true,
            mode: 'optional',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        expect(
            resolveSavedFacilityIdForLocation('centraal', {
                lat: FACILITY_ZUID.lat,
                lng: FACILITY_ZUID.lng
            })
        ).toBeUndefined();
    });
});

describe('useFacilityReporting.initializeSelection', () => {
    it('adopts a valid saved id', () => {
        const { initializeSelection, selectedFacilityId } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        initializeSelection('zuid');
        expect(selectedFacilityId.value).toBe('zuid');
    });

    it('falls back to empty when the preferred id no longer exists', () => {
        const { initializeSelection, selectedFacilityId } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL]
        });

        initializeSelection('removed');
        expect(selectedFacilityId.value).toBe('');
    });

    it('is a no-op when facility UI is disabled', () => {
        const { initializeSelection, selectedFacilityId } = setupComposable({
            enabled: false,
            items: []
        });
        selectedFacilityId.value = 'preset';

        initializeSelection('anything');
        // Disabled mode does NOT touch the ref — caller owns it.
        expect(selectedFacilityId.value).toBe('preset');
    });
});

// ============================================================================
// Regression: classic-draft location preservation (#363)
// ============================================================================
//
// The form component restores a draft's `location` ref in `onMounted`, then
// calls `initializeSelection(savedState.facilityId)` to hydrate the facility
// ref. If the composable's `selectedFacility` watcher fires eagerly (old
// `{ immediate: true }` path) or unconditionally wipes on `facility === null`,
// it destroys the restored coordinates between the two steps. The fix drops
// `immediate` on the selectedFacility watcher AND guards the null branch of
// `syncLocationFromFacility` so a populated location survives even when the
// watcher does fire under benign circumstances (e.g. async client config).

describe('useFacilityReporting draft location preservation (#363)', () => {
    it('keeps a restored classic-draft location when facility mode is exclusive and no facilityId is set', async () => {
        const { location, selectedFacilityId } = setupComposable(
            {
                enabled: true,
                mode: 'exclusive',
                items: [FACILITY_CENTRAAL, FACILITY_ZUID]
            },
            {
                // Classic draft: user had a free-form pick, no facility.
                selectedFacilityId: '',
                location: { lat: '52.370000', lng: '4.895000', displayName: 'Restored draft pick' }
            }
        );

        await nextTick();

        expect(selectedFacilityId.value).toBe('');
        expect(location.value.lat).toBe('52.370000');
        expect(location.value.lng).toBe('4.895000');
        expect(location.value.displayName).toBe('Restored draft pick');
    });

    it('hydrates the location from the facility when a valid facilityId is restored and drives it', async () => {
        const { location, selectedFacilityId } = setupComposable(
            {
                enabled: true,
                mode: 'exclusive',
                items: [FACILITY_CENTRAAL, FACILITY_ZUID]
            },
            {
                // Draft has no location yet; facility id is restored first,
                // watcher must fill the location from the facility coords.
                selectedFacilityId: '',
                location: { lat: '', lng: '' }
            }
        );

        // Form restores facility id AFTER onMounted; emulate that here.
        selectedFacilityId.value = 'centraal';
        await nextTick();

        expect(location.value.lat).toBe(String(FACILITY_CENTRAAL.lat));
        expect(location.value.lng).toBe(String(FACILITY_CENTRAAL.lng));
    });

    it('overwrites the location when the user manually switches to a different facility', async () => {
        const { location, selectedFacilityId } = setupComposable(
            {
                enabled: true,
                mode: 'exclusive',
                items: [FACILITY_CENTRAAL, FACILITY_ZUID]
            },
            {
                selectedFacilityId: 'centraal',
                location: {
                    lat: String(FACILITY_CENTRAAL.lat),
                    lng: String(FACILITY_CENTRAAL.lng)
                }
            }
        );

        await nextTick();

        selectedFacilityId.value = 'zuid';
        await nextTick();

        expect(location.value.lat).toBe(String(FACILITY_ZUID.lat));
        expect(location.value.lng).toBe(String(FACILITY_ZUID.lng));
    });

    it('preserves the location when the user deselects a facility (no clobber)', async () => {
        const { location, selectedFacilityId } = setupComposable(
            {
                enabled: true,
                mode: 'exclusive',
                items: [FACILITY_CENTRAAL, FACILITY_ZUID]
            },
            {
                selectedFacilityId: 'centraal',
                location: {
                    lat: String(FACILITY_CENTRAAL.lat),
                    lng: String(FACILITY_CENTRAAL.lng),
                    displayName: FACILITY_CENTRAAL.address
                }
            }
        );

        await nextTick();

        // User clears the facility (e.g. via the FacilitySelect clear action).
        // In exclusive mode the watcher would previously wipe location to
        // empty strings; the guard keeps the last known coordinates so the
        // pin on the map does not jump back to the jurisdiction centroid.
        selectedFacilityId.value = '';
        await nextTick();

        expect(location.value.lat).toBe(String(FACILITY_CENTRAAL.lat));
        expect(location.value.lng).toBe(String(FACILITY_CENTRAAL.lng));
    });

    it('does not wipe a populated location when exclusive facility mode flips on asynchronously', async () => {
        // Simulate the async client-config path: facilities config arrives
        // AFTER the form has already hydrated a classic-draft location.
        const { location } = setupComposable(null, {
            location: { lat: '52.370000', lng: '4.895000', displayName: 'Classic pick' }
        });

        await nextTick();
        expect(location.value.lat).toBe('52.370000');

        // Now the config arrives and exclusive mode goes live with no
        // facility selected.
        mockFacilities.value = {
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        };
        await nextTick();

        // Mode watcher fires but must not nuke the restored location.
        expect(location.value.lat).toBe('52.370000');
        expect(location.value.lng).toBe('4.895000');
    });

    it('survives the synchronous immediate-fire when facilities config is already present at mount', () => {
        // Review nit case: facilities config is live BEFORE the composable
        // is constructed AND a classic draft location is pre-seeded. The
        // `facilityUIEnabled` watcher runs synchronously because of
        // `immediate: true`, so there is no nextTick between composable
        // setup and the first firing. The `locationHasCoords` guard is the
        // only thing standing between the draft coords and
        // `syncLocationFromFacility(null)`'s clear branch. Verify that this
        // synchronous path does not clobber the draft — no awaits, assertion
        // runs against the ref immediately after setup.
        const { location, selectedFacilityId } = setupComposable(
            {
                enabled: true,
                mode: 'exclusive',
                items: [FACILITY_CENTRAAL, FACILITY_ZUID]
            },
            {
                selectedFacilityId: '',
                location: {
                    lat: '52.370000',
                    lng: '4.895000',
                    displayName: 'Classic pick, config already live'
                }
            }
        );

        // No nextTick. The immediate fire already ran during setupComposable.
        expect(selectedFacilityId.value).toBe('');
        expect(location.value.lat).toBe('52.370000');
        expect(location.value.lng).toBe('4.895000');
        expect(location.value.displayName).toBe('Classic pick, config already live');
    });

    it('initializes an empty location to empty when no facility is chosen', async () => {
        // Sanity check: when there is nothing to preserve, the clear path
        // still runs so stale leftovers (empty strings) stay consistent.
        const { location, selectedFacilityId } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL]
        });

        selectedFacilityId.value = 'centraal';
        await nextTick();
        selectedFacilityId.value = '';
        await nextTick();

        // Previous facility value is kept (no clobber rule). This asserts
        // the guard does not paradoxically overwrite a facility-derived
        // location either, which is the desired user-facing behavior:
        // the pin stays put until the user actively moves it or picks a
        // different facility.
        expect(location.value.lat).toBe(String(FACILITY_CENTRAAL.lat));
    });
});

// ============================================================================
// Regression: URL-preselect one-shot consumption (#361)
// ============================================================================
//
// `?facility=<id>` seeds the initial selection on mount. Before #361 the
// facility-UI watcher re-applied the URL value on every dep change, so a
// subsequent manual clear (`setFacilityId('')`) was silently overwritten by
// the preselect. The fix consumes the URL value exactly once: after the
// initial reconcile, `preselectedFacilityId` yields `''` no matter how many
// times the watcher fires.

describe('useFacilityReporting URL preselect (?facility=<id>)', () => {
    afterEach(() => {
        mockRouteData.query = {};
    });

    it('applies ?facility=<id> when no facility is pre-selected on mount', async () => {
        mockRouteData.query = { facility: 'centraal' };

        const { selectedFacilityId } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        await nextTick();
        expect(selectedFacilityId.value).toBe('centraal');
    });

    it('survives config-arrives-later when ?facility=<id> is in the URL', async () => {
        mockRouteData.query = { facility: 'zuid' };

        const { selectedFacilityId } = setupComposable(null);

        await nextTick();
        // Config not yet live -> no selection yet.
        expect(selectedFacilityId.value).toBe('');

        mockFacilities.value = {
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        };
        await nextTick();

        expect(selectedFacilityId.value).toBe('zuid');
    });

    it('does NOT re-apply ?facility=<id> after the user clears the select', async () => {
        mockRouteData.query = { facility: 'centraal' };

        const { selectedFacilityId } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        await nextTick();
        expect(selectedFacilityId.value).toBe('centraal');

        // User clears the select. The watcher re-evaluates because the
        // activeFacilities-id dep fingerprint is unchanged but
        // selectedFacilityId is now '' — resolveValidFacilityId yields ''.
        selectedFacilityId.value = '';
        await nextTick();

        // Before #361 this would snap back to 'centraal' via the URL
        // preselect branch. After the fix it stays empty.
        expect(selectedFacilityId.value).toBe('');
    });

    it('does NOT re-apply ?facility=<id> after a facility swap followed by a clear', async () => {
        mockRouteData.query = { facility: 'centraal' };

        const { selectedFacilityId } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        await nextTick();
        expect(selectedFacilityId.value).toBe('centraal');

        selectedFacilityId.value = 'zuid';
        await nextTick();
        expect(selectedFacilityId.value).toBe('zuid');

        selectedFacilityId.value = '';
        await nextTick();
        expect(selectedFacilityId.value).toBe('');
    });
});

// ============================================================================
// Mixed mode: derived showMapPicker + clearFacilitySelection (#361)
// ============================================================================

describe('useFacilityReporting.showMapPicker (#361)', () => {
    it('keeps the map picker visible in disabled mode', () => {
        const { showMapPicker } = setupComposable({
            enabled: false,
            items: []
        });
        expect(showMapPicker.value).toBe(true);
    });

    it('keeps the map picker visible in optional mode regardless of hideMapPicker', () => {
        const { showMapPicker } = setupComposable({
            enabled: true,
            mode: 'optional',
            hideMapPicker: true,
            items: [FACILITY_CENTRAAL]
        });
        expect(showMapPicker.value).toBe(true);
    });

    it('hides the map picker in exclusive mode when hideMapPicker=true', () => {
        const { showMapPicker, isMixedMode } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            hideMapPicker: true,
            items: [FACILITY_CENTRAAL]
        });
        expect(showMapPicker.value).toBe(false);
        expect(isMixedMode.value).toBe(false);
    });

    it('shows the map picker in exclusive mixed mode (hideMapPicker=false)', () => {
        const { showMapPicker, isMixedMode } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            hideMapPicker: false,
            items: [FACILITY_CENTRAAL]
        });
        expect(showMapPicker.value).toBe(true);
        expect(isMixedMode.value).toBe(true);
    });
});

describe('useFacilityReporting.clearFacilitySelection (#361)', () => {
    it('clears the facility ref and burns the URL preselect', async () => {
        mockRouteData.query = { facility: 'centraal' };

        const { selectedFacilityId, clearFacilitySelection } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            hideMapPicker: false,
            items: [FACILITY_CENTRAAL, FACILITY_ZUID]
        });

        await nextTick();
        expect(selectedFacilityId.value).toBe('centraal');

        clearFacilitySelection();
        await nextTick();
        expect(selectedFacilityId.value).toBe('');

        // Even a follow-up selection+clear cycle must not resurrect the URL.
        selectedFacilityId.value = 'zuid';
        await nextTick();
        selectedFacilityId.value = '';
        await nextTick();
        expect(selectedFacilityId.value).toBe('');
    });

    it('is a no-op when nothing is selected', async () => {
        const { selectedFacilityId, clearFacilitySelection } = setupComposable({
            enabled: true,
            mode: 'exclusive',
            hideMapPicker: false,
            items: [FACILITY_CENTRAAL]
        });

        await nextTick();
        expect(selectedFacilityId.value).toBe('');

        clearFacilitySelection();
        await nextTick();
        expect(selectedFacilityId.value).toBe('');
    });

    it('announces the clear via toast in mixed mode when a facility was selected', async () => {
        const toastAdd = vi.fn();
        const originalUseToast = globalThis.useToast;
        globalThis.useToast = () => ({
            add: toastAdd,
            remove: () => undefined,
            update: () => undefined,
            clear: () => undefined
        });

        try {
            const { selectedFacilityId, clearFacilitySelection } = setupComposable({
                enabled: true,
                mode: 'exclusive',
                hideMapPicker: false,
                items: [FACILITY_CENTRAAL]
            }, { selectedFacilityId: 'centraal' });

            await nextTick();
            clearFacilitySelection();
            await nextTick();

            expect(selectedFacilityId.value).toBe('');
            expect(toastAdd).toHaveBeenCalledTimes(1);
            const toastPayload = toastAdd.mock.calls[0][0];
            // Id is scoped to the cleared facility id so multiple rapid
            // clears of different facilities don't dedup against each other.
            expect(toastPayload.id).toBe('facility-deselected-map-pick-centraal');
            // Param-interpolation stub from setup.ts: `${key}{label=Kindergarten Centraal}`.
            expect(toastPayload.title).toContain('Kindergarten Centraal');
        } finally {
            globalThis.useToast = originalUseToast;
        }
    });

    it('suppresses the toast when called with silent: true (locate-me path)', async () => {
        const toastAdd = vi.fn();
        const originalUseToast = globalThis.useToast;
        globalThis.useToast = () => ({
            add: toastAdd,
            remove: () => undefined,
            update: () => undefined,
            clear: () => undefined
        });

        try {
            const { clearFacilitySelection } = setupComposable({
                enabled: true,
                mode: 'exclusive',
                hideMapPicker: false,
                items: [FACILITY_CENTRAAL]
            }, { selectedFacilityId: 'centraal' });

            await nextTick();
            clearFacilitySelection({ silent: true });
            await nextTick();

            expect(toastAdd).not.toHaveBeenCalled();
        } finally {
            globalThis.useToast = originalUseToast;
        }
    });

    it('does not fire toast in exclusive-hidden mode (no mixed behavior)', async () => {
        const toastAdd = vi.fn();
        const originalUseToast = globalThis.useToast;
        globalThis.useToast = () => ({
            add: toastAdd,
            remove: () => undefined,
            update: () => undefined,
            clear: () => undefined
        });

        try {
            const { clearFacilitySelection } = setupComposable({
                enabled: true,
                mode: 'exclusive',
                hideMapPicker: true,
                items: [FACILITY_CENTRAAL]
            }, { selectedFacilityId: 'centraal' });

            await nextTick();
            clearFacilitySelection();
            await nextTick();

            expect(toastAdd).not.toHaveBeenCalled();
        } finally {
            globalThis.useToast = originalUseToast;
        }
    });
});
