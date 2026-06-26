import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, ref } from 'vue';
import type { FacilitiesConfig } from '@@/types/clientConfig';
import { clearMockState } from '../../__mocks__/nuxt';
import {
    FACILITY_DRAFT_FIELD,
    FACILITY_FORM_FIELD,
    useFacilityFormMode
} from '@/composables/form/useFacilityFormMode';

const FACILITY = {
    id: 'school-1',
    label: 'School One',
    lat: 52.37,
    lng: 4.89,
    address: 'School Street 1',
    active: true
};

const mockFacilities = ref<FacilitiesConfig | null>(null);
const activeScopes: Array<ReturnType<typeof effectScope>> = [];

globalThis.useMarkASpotConfig = () => ({
    clientConfig: computed(() => ({
        facilities: mockFacilities.value
    })),
    config: computed(() => ({ facilities: mockFacilities.value })),
    fetchConfig: vi.fn(),
    clearCache: vi.fn()
}) as any;

const setupComposable = (
    config: FacilitiesConfig | null,
    options: { facilityId?: string } = {}
) => {
    mockFacilities.value = config;
    const facilityId = ref(options.facilityId ?? '');
    const location = ref({ lat: '', lng: '', address: undefined, displayName: '' });
    const fieldHasInteracted = ref<Record<string, boolean | undefined>>({});

    const scope = effectScope();
    activeScopes.push(scope);
    const api = scope.run(() => useFacilityFormMode({ facilityId, location }))!;

    return {
        ...api,
        fieldHasInteracted,
        location
    };
};

beforeEach(() => {
    clearMockState();
    mockFacilities.value = null;
});

afterEach(() => {
    while (activeScopes.length) {
        activeScopes.pop()?.stop();
    }
});

describe('useFacilityFormMode', () => {
    it('gates exclusive hidden-map mode on a required facility pick', () => {
        const mode = setupComposable({
            enabled: true,
            mode: 'exclusive',
            hideMapPicker: true,
            label: { singular: 'School', plural: 'Schools' },
            items: [FACILITY]
        });

        const facilityError = mode.getFacilityError(mode.fieldHasInteracted);

        expect(mode.facilityFieldName).toBe(FACILITY_FORM_FIELD);
        expect(mode.draftFieldName).toBe(FACILITY_DRAFT_FIELD);
        expect(mode.isExclusive.value).toBe(true);
        expect(mode.showMapPicker.value).toBe(false);
        expect(mode.facilityPickRequired.value).toBe(true);
        expect(mode.canSubmitWithFacility(true)).toBe(false);
        expect(facilityError.value).toBeUndefined();

        mode.markFacilityInteracted(mode.fieldHasInteracted);

        expect(facilityError.value).toBe('form.facility_required{label=School}');
        expect(mode.getFacilityValidationError()).toEqual({
            status: '400',
            title: 'Validation Error',
            detail: 'form.facility_required{label=School}'
        });

        mode.setFacilityId('school-1', mode.fieldHasInteracted);

        expect(mode.facilityId.value).toBe('school-1');
        expect(mode.fieldHasInteracted.value[FACILITY_FORM_FIELD]).toBe(true);
        expect(mode.canSubmitWithFacility(true)).toBe(true);
        expect(mode.getFacilityValidationError()).toBeNull();
        expect(mode.getSubmissionFields()).toEqual({ field_facility: 'school-1' });
    });

    it('keeps optional mode as a tag on top of the normal location requirement', () => {
        const mode = setupComposable({
            enabled: true,
            mode: 'optional',
            label: { singular: 'School', plural: 'Schools' },
            items: [FACILITY]
        });

        expect(mode.isOptional.value).toBe(true);
        expect(mode.showMapPicker.value).toBe(true);
        expect(mode.facilityPickRequired.value).toBe(false);
        expect(mode.canSubmitWithFacility(true)).toBe(true);
        expect(mode.getFacilityValidationError()).toBeNull();

        mode.setFacilityId('school-1');

        expect(mode.getSubmissionFields()).toEqual({ field_facility: 'school-1' });
    });

    it('fails open for disabled facility mode and suppresses stale payload ids', () => {
        const mode = setupComposable({
            enabled: false,
            mode: 'exclusive',
            label: { singular: 'School', plural: 'Schools' },
            items: [FACILITY]
        }, { facilityId: 'school-1' });

        expect(mode.facilityUIEnabled.value).toBe(false);
        expect(mode.showMapPicker.value).toBe(true);
        expect(mode.facilityPickRequired.value).toBe(false);
        expect(mode.canSubmitWithFacility(true)).toBe(true);
        expect(mode.submittableFacilityId.value).toBe('');
        expect(mode.getSubmissionFields()).toEqual({});
    });
});
