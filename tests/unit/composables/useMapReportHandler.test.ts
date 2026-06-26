import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { useMapReportHandler } from '@/composables/useMapReportHandler';

/**
 * Regression suite for the "point without a geocoded address (no postal code)
 * blocks the report flow" bug.
 *
 * Symptom in the field (Amsterdam embed, FastMap/CivicSpot, Africa tenants):
 * clicking the report button on a point the reverse geocoder returned no postal
 * code for did nothing — the tooltip showed "Postal Code is required" and the
 * flow was stuck. A missing postcode must NEVER block; only strict boundary
 * validation may.
 *
 * @see app/composables/useMapReportHandler.ts
 * @see app/utils/locationValidation.ts
 */
function setup(overrides: {
    boundaryEnabled?: boolean
    strictValidation?: boolean
    tooltipLocationValid?: boolean
    tooltipHardInvalid?: boolean
    hasMarker?: boolean
} = {}) {
    const emit = vi.fn();
    const hasMarker = overrides.hasMarker ?? true;
    const currentMarker = ref(
        hasMarker ? ({ getLngLat: () => ({ lat: 52.354177, lng: 4.900444 }) } as never) : null
    );

    const { handleReportType } = useMapReportHandler({
        currentMarker,
        boundaryConfig: ref({
            enabled: overrides.boundaryEnabled ?? false,
            strictValidation: overrides.strictValidation ?? false
        }),
        tooltipLocationValid: ref(overrides.tooltipLocationValid ?? true),
        // Legacy ref that the old code hard-blocked on for a missing postcode.
        tooltipHardInvalid: ref(overrides.tooltipHardInvalid ?? false),
        selectedAddress: ref('52.354177, 4.900444'),
        currentAddressObj: ref({}),
        showLocationTooltip: ref(true),
        clearLocationState: vi.fn(),
        emit
    });

    return { handleReportType, emit };
}

describe('useMapReportHandler.handleReportType', () => {
    it('emits add-report for a point with NO postcode (legacy hardInvalid set)', () => {
        // This is the exact bug: geocoder returned no postcode, so the old code
        // set tooltipHardInvalid=true and the report did nothing.
        const { handleReportType, emit } = setup({
            tooltipHardInvalid: true,
            tooltipLocationValid: false,
            boundaryEnabled: false
        });

        handleReportType('photo');

        expect(emit).toHaveBeenCalledWith('add-report', 'photo', expect.objectContaining({
            lat: 52.354177,
            lng: 4.900444
        }));
    });

    it('still blocks when STRICT boundary validation fails (boundary is the only gate)', () => {
        const { handleReportType, emit } = setup({
            boundaryEnabled: true,
            strictValidation: true,
            tooltipLocationValid: false
        });

        handleReportType('classic');

        expect(emit).not.toHaveBeenCalled();
    });

    it('emits when inside a strict boundary even without a postcode', () => {
        const { handleReportType, emit } = setup({
            boundaryEnabled: true,
            strictValidation: true,
            tooltipLocationValid: true,
            tooltipHardInvalid: true // no postcode, but inside boundary
        });

        handleReportType('photo');

        expect(emit).toHaveBeenCalledWith('add-report', 'photo', expect.anything());
    });

    it('does not block on a non-strict boundary even when out of bounds', () => {
        const { handleReportType, emit } = setup({
            boundaryEnabled: true,
            strictValidation: false,
            tooltipLocationValid: false
        });

        handleReportType('photo');

        expect(emit).toHaveBeenCalledWith('add-report', 'photo', expect.anything());
    });
});
