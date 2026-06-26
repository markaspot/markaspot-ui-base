/**
 * Form Validation Tests
 *
 * Tests the canSubmit gate (7 ANDed conditions), formRequirements
 * computation, validation error generation, and field state management.
 * This composable guards ALL form submissions in the application.
 *
 * @see app/composables/form/useFormValidation.ts
 */
import { describe, it, expect, vi } from 'vitest';
import { ref, computed, nextTick } from 'vue';
import { useFormValidation } from '@/composables/form/useFormValidation';

// ============================================================================
// Helpers
// ============================================================================

function createDefaultFields() {
    return {
        description: ref(''),
        category: ref(''),
        email: ref(''),
        prename: ref(''),
        name: ref(''),
        phone: ref(''),
        gdprAccepted: ref(false),
        uploadedMedia: ref<any[]>([]),
        location: ref({ lat: '', lng: '', address: null, displayName: '' })
    };
}

function createDefaultOptions(overrides: Record<string, any> = {}) {
    const fields = overrides.fields || createDefaultFields();
    return {
        settings: ref({
            fields: {
                body: { required: true },
                field_category: { required: true },
                field_geolocation: { required: true },
                field_e_mail: { required: false },
                field_gdpr: { required: true },
                field_request_media: { required: false },
                ...overrides.settingsFields
            }
        }),
        formElement: ref(null as HTMLFormElement | null),
        requirementsIndicator: ref(null as any),
        fields,
        isPhotoRequired: computed(() => overrides.photoRequired ?? false),
        isPhotoCategoryRequired: computed(() => overrides.photoCategoryRequired ?? false),
        isEmailRequired: computed(() => overrides.emailRequired ?? false),
        isEmailCategoryRequired: computed(() => overrides.emailCategoryRequired ?? false),
        isLocationRequired: computed(() => overrides.locationRequired ?? true),
        isCategoryRequired: computed(() => overrides.categoryRequired ?? true),
        isDescriptionRequired: computed(() => overrides.descriptionRequired ?? true),
        formDisabled: ref(overrides.formDisabled ?? false),
        fieldExistsInApi: overrides.fieldExistsInApi ?? ((name: string) => name === 'field_gdpr'),
        ...overrides
    };
}

function createValidForm(overrides: Record<string, any> = {}) {
    const fields = createDefaultFields();
    fields.description.value = 'A pothole on Main Street';
    fields.category.value = 'cat-uuid-123';
    fields.location.value = { lat: '50.9375', lng: '6.9603', address: null, displayName: 'Domplatz' };
    fields.gdprAccepted.value = true;
    return createDefaultOptions({ fields, ...overrides });
}

// ============================================================================
// canSubmit gate logic
// ============================================================================

describe('canSubmit', () => {
    it('returns false when all fields are empty', () => {
        const { canSubmit } = useFormValidation(createDefaultOptions() as any);
        expect(canSubmit.value).toBe(false);
    });

    it('returns true when all required fields are filled', async () => {
        const opts = createValidForm();
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    it('returns false when category is empty and required', async () => {
        const opts = createValidForm();
        opts.fields.category.value = '';
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('returns true when category is empty but NOT required', async () => {
        const opts = createValidForm({ categoryRequired: false });
        opts.fields.category.value = '';
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    it('returns false when description is empty and required', async () => {
        const opts = createValidForm();
        opts.fields.description.value = '  '; // whitespace only
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('returns false when location is empty and required', async () => {
        const opts = createValidForm();
        opts.fields.location.value = { lat: '', lng: '', address: null, displayName: '' };
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('returns true when location is empty but NOT required', async () => {
        const opts = createValidForm({ locationRequired: false });
        opts.fields.location.value = { lat: '', lng: '', address: null, displayName: '' };
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    it('returns false when selected location coordinates are invalid', async () => {
        const opts = createValidForm();
        const { canSubmit, handleFieldValidation } = useFormValidation(opts as any);
        handleFieldValidation('field_geolocation', false);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('returns false when email is invalid and required', async () => {
        const opts = createValidForm({ emailRequired: true });
        opts.fields.email.value = 'not-an-email';
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('returns true when email is valid and required', async () => {
        const opts = createValidForm({ emailRequired: true });
        opts.fields.email.value = 'test@example.com';
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    it('returns false when photo is required but none uploaded', async () => {
        const opts = createValidForm({ photoRequired: true });
        opts.fields.uploadedMedia.value = [];
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('returns true when photo is required and uploaded', async () => {
        const opts = createValidForm({ photoRequired: true });
        opts.fields.uploadedMedia.value = [{ id: 'img-1', isUploading: false }];
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    it('returns false when GDPR is required but not accepted', async () => {
        const opts = createValidForm();
        opts.fields.gdprAccepted.value = false;
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('ignores privacyNoticeEnabled when field_gdpr is not required (decoupled since 11.9.x)', async () => {
        // Regression guard for the privacyNotice/field_gdpr decoupling:
        // privacyNoticeEnabled controls only the disclosure modal display.
        // The GDPR consent requirement is now gated solely by
        // fields.field_gdpr.required. With required=false, an unaccepted
        // GDPR checkbox must NOT block submission even if the modal is on.
        const origFlags = globalThis.useFeatureFlags;
        globalThis.useFeatureFlags = () => ({
            ...origFlags(),
            privacyNoticeEnabled: computed(() => true)
        });
        try {
            const opts = createValidForm({
                settingsFields: { field_gdpr: { required: false } }
            });
            opts.fields.gdprAccepted.value = false;
            const { canSubmit } = useFormValidation(opts as any);
            await nextTick();
            expect(canSubmit.value).toBe(true);
        } finally {
            globalThis.useFeatureFlags = origFlags;
        }
    });

    it('skips GDPR check when field_gdpr does not exist in API', async () => {
        const opts = createValidForm({
            fieldExistsInApi: () => false // field_gdpr not in API
        });
        opts.fields.gdprAccepted.value = false;
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    it('returns false when form is disabled', async () => {
        const opts = createValidForm();
        opts.formDisabled.value = true;
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('reacts to field changes', async () => {
        const opts = createValidForm();
        opts.fields.description.value = '';
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);

        opts.fields.description.value = 'Now filled in';
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    // #473: privacy hard-block. Submission is gated only when the tenant opts
    // in AND an AI privacy warning is active; default behavior is unchanged.
    it('is unaffected when no privacyBlocked option is provided (default off)', async () => {
        const opts = createValidForm();
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    it('returns false when privacyBlocked is active on an otherwise valid form', async () => {
        const opts = createValidForm({ privacyBlocked: ref(true) });
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('returns true when privacyBlocked is present but false', async () => {
        const opts = createValidForm({ privacyBlocked: ref(false) });
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);
    });

    it('reacts to privacyBlocked toggling', async () => {
        const privacyBlocked = ref(false);
        const opts = createValidForm({ privacyBlocked });
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(true);

        privacyBlocked.value = true;
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });

    it('keeps canSubmit false when privacyBlocked is active regardless of other validity', async () => {
        // Every other condition is satisfied; only the privacy block holds it down.
        const opts = createValidForm({ privacyBlocked: ref(true) });
        const { canSubmit } = useFormValidation(opts as any);
        await nextTick();
        expect(canSubmit.value).toBe(false);
    });
});

// ============================================================================
// formRequirements — privacy hard-block (#473 U2)
// ============================================================================

describe('formRequirements privacy block', () => {
    it('does not add a privacyBlock requirement when not blocking', async () => {
        const opts = createValidForm({ privacyBlocked: ref(false) });
        const { formRequirements } = useFormValidation(opts as any);
        await nextTick();
        const fields = formRequirements.value.map((r: any) => r.field);
        expect(fields).not.toContain('privacyBlock');
    });

    it('adds an incomplete privacyBlock requirement when blocking', async () => {
        const opts = createValidForm({ privacyBlocked: ref(true) });
        const { formRequirements } = useFormValidation(opts as any);
        await nextTick();
        const req = formRequirements.value.find((r: any) => r.field === 'privacyBlock');
        expect(req).toBeDefined();
        // Never completes: the only resolution is replacing/removing the photo,
        // which clears the block entirely (the requirement disappears).
        expect(req?.complete).toBe(false);
    });

    it('appends privacyBlock last, independent of requirementsOrder', async () => {
        const opts = createValidForm({
            privacyBlocked: ref(true),
            requirementsOrder: ['description', 'category']
        });
        const { formRequirements } = useFormValidation(opts as any);
        await nextTick();
        const fields = formRequirements.value.map((r: any) => r.field);
        expect(fields[fields.length - 1]).toBe('privacyBlock');
    });
});

// ============================================================================
// isValidEmail
// ============================================================================

describe('isValidEmail', () => {
    it('accepts valid email', () => {
        const { isValidEmail } = useFormValidation(createDefaultOptions() as any);
        expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('rejects empty string', () => {
        const { isValidEmail } = useFormValidation(createDefaultOptions() as any);
        expect(isValidEmail('')).toBe(false);
    });

    it('rejects missing @', () => {
        const { isValidEmail } = useFormValidation(createDefaultOptions() as any);
        expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('rejects missing domain', () => {
        const { isValidEmail } = useFormValidation(createDefaultOptions() as any);
        expect(isValidEmail('test@')).toBe(false);
    });

    it('rejects undefined', () => {
        const { isValidEmail } = useFormValidation(createDefaultOptions() as any);
        expect(isValidEmail(undefined)).toBe(false);
    });
});

// ============================================================================
// handleFieldValidation
// ============================================================================

describe('handleFieldValidation', () => {
    it('updates fieldValidationStates', () => {
        const { handleFieldValidation, fieldValidationStates } = useFormValidation(createDefaultOptions() as any);
        handleFieldValidation('body', true);
        expect(fieldValidationStates.value['body']).toBe(true);
    });

    it('updates isLocationValid for field_geolocation', () => {
        const { handleFieldValidation, isLocationValid } = useFormValidation(createDefaultOptions() as any);
        handleFieldValidation('field_geolocation', false);
        expect(isLocationValid.value).toBe(false);
    });

    it('calls onFieldValidation callback', () => {
        const callback = vi.fn();
        const opts = createDefaultOptions({ onFieldValidation: callback });
        const { handleFieldValidation } = useFormValidation(opts as any);
        handleFieldValidation('body', true);
        expect(callback).toHaveBeenCalledWith('body', true);
    });
});

// ============================================================================
// formRequirements
// ============================================================================

describe('formRequirements', () => {
    it('includes only required fields', () => {
        const opts = createDefaultOptions({
            categoryRequired: true,
            descriptionRequired: true,
            locationRequired: true,
            photoRequired: false,
            emailRequired: false
        });
        const { formRequirements } = useFormValidation(opts as any);
        const fields = formRequirements.value.map((r: any) => r.field);
        expect(fields).toContain('category');
        expect(fields).toContain('location');
        expect(fields).toContain('description');
        expect(fields).not.toContain('photo');
        expect(fields).not.toContain('email');
    });

    it('includes GDPR when field_gdpr exists and is required', () => {
        const opts = createDefaultOptions({
            settingsFields: { field_gdpr: { required: true } },
            fieldExistsInApi: (name: string) => name === 'field_gdpr'
        });
        const { formRequirements } = useFormValidation(opts as any);
        const fields = formRequirements.value.map((r: any) => r.field);
        expect(fields).toContain('privacy');
    });

    it('marks complete fields as complete: true', async () => {
        const opts = createValidForm();
        const { formRequirements } = useFormValidation(opts as any);
        await nextTick();
        const catReq = formRequirements.value.find((r: any) => r.field === 'category');
        expect(catReq?.complete).toBe(true);
    });

    it('marks empty fields as complete: false', () => {
        const opts = createDefaultOptions({ categoryRequired: true });
        const { formRequirements } = useFormValidation(opts as any);
        const catReq = formRequirements.value.find((r: any) => r.field === 'category');
        expect(catReq?.complete).toBe(false);
    });

    it('marks location incomplete when coordinates are present but location validation failed', async () => {
        const opts = createValidForm();
        const { formRequirements, handleFieldValidation } = useFormValidation(opts as any);
        handleFieldValidation('field_geolocation', false);
        await nextTick();
        const locationReq = formRequirements.value.find((r: any) => r.field === 'location');
        expect(locationReq?.complete).toBe(false);
    });

    it('respects custom requirementsOrder', () => {
        const opts = createDefaultOptions({
            categoryRequired: true,
            descriptionRequired: true,
            locationRequired: true,
            requirementsOrder: ['description', 'location', 'category']
        });
        const { formRequirements } = useFormValidation(opts as any);
        const fields = formRequirements.value.map((r: any) => r.field);
        expect(fields).toEqual(['description', 'location', 'category']);
    });
});

// ============================================================================
// getValidationErrors
// ============================================================================

describe('getValidationErrors', () => {
    it('returns location error when lat/lng empty', () => {
        const opts = createDefaultOptions();
        const { getValidationErrors } = useFormValidation(opts as any);
        const errors = getValidationErrors();
        const locationError = errors.find(e => e.detail.includes('field_geolocation'));
        expect(locationError).toBeDefined();
    });

    it('returns no errors when all required fields filled', async () => {
        const opts = createValidForm();
        const { getValidationErrors } = useFormValidation(opts as any);
        await nextTick();
        const errors = getValidationErrors();
        expect(errors).toHaveLength(0);
    });

    it('returns an out-of-bounds error when the selected location is outside the jurisdiction', async () => {
        const opts = createValidForm();
        const { getValidationErrors, handleFieldValidation } = useFormValidation(opts as any);
        // Boundary check fails (strict tenant, out of bounds). isLocationValid is
        // now fed purely by the boundary result; a missing postcode never gets here.
        handleFieldValidation('field_geolocation', false);
        await nextTick();
        const errors = getValidationErrors();
        const locationError = errors.find(e => e.detail.includes('location_out_of_bounds'));
        expect(locationError).toBeDefined();
        // Regression guard: the misleading "Postal Code is required" label is gone.
        expect(errors.some(e => e.detail.includes('postal_code'))).toBe(false);
    });

    it('does NOT produce a location error for a valid in-boundary location (no postcode needed)', async () => {
        const opts = createValidForm();
        const { getValidationErrors, handleFieldValidation } = useFormValidation(opts as any);
        // Geocoder returned no postcode, but the point is inside the boundary.
        handleFieldValidation('field_geolocation', true);
        await nextTick();
        const errors = getValidationErrors();
        const locationError = errors.find(
            e => e.detail.includes('location_out_of_bounds') || e.detail.includes('postal_code')
        );
        expect(locationError).toBeUndefined();
    });

    it('returns error for empty required description', () => {
        const opts = createValidForm();
        opts.fields.description.value = '';
        const { getValidationErrors } = useFormValidation(opts as any);
        const errors = getValidationErrors();
        const bodyError = errors.find(e => e.detail.includes('body'));
        expect(bodyError).toBeDefined();
    });

    it('skips description validation when not required', () => {
        const opts = createValidForm({ descriptionRequired: false });
        opts.fields.description.value = '';
        const { getValidationErrors } = useFormValidation(opts as any);
        const errors = getValidationErrors();
        const bodyError = errors.find(e => e.detail.includes('body'));
        expect(bodyError).toBeUndefined();
    });

    it('adds email error from category requirement', () => {
        const opts = createValidForm({ emailRequired: true });
        opts.fields.email.value = '';
        const { getValidationErrors } = useFormValidation(opts as any);
        const errors = getValidationErrors();
        const emailError = errors.find(e => e.detail.includes('field_e_mail'));
        expect(emailError).toBeDefined();
    });

    it('avoids duplicate email error when API settings also require it', () => {
        const opts = createValidForm({
            emailRequired: true,
            settingsFields: {
                body: { required: true },
                field_category: { required: true },
                field_geolocation: { required: true },
                field_e_mail: { required: true },
                field_gdpr: { required: true }
            }
        });
        opts.fields.email.value = '';
        const { getValidationErrors } = useFormValidation(opts as any);
        const errors = getValidationErrors();
        const emailErrors = errors.filter(e => e.detail.includes('field_e_mail'));
        // Should have exactly one email error, not duplicated
        expect(emailErrors).toHaveLength(1);
    });

    it('adds photo error when photo required but none uploaded', () => {
        const opts = createValidForm({ photoRequired: true });
        opts.fields.uploadedMedia.value = [];
        const { getValidationErrors } = useFormValidation(opts as any);
        const errors = getValidationErrors();
        const photoError = errors.find(e => e.detail.includes('field_request_media'));
        expect(photoError).toBeDefined();
    });
});

// ============================================================================
// State management
// ============================================================================

describe('initializeValidationStates', () => {
    it('sets initial validation from current field values', () => {
        const opts = createValidForm();
        const { initializeValidationStates, fieldValidationStates } = useFormValidation(opts as any);
        initializeValidationStates();
        expect(fieldValidationStates.value['body']).toBe(true);
        expect(fieldValidationStates.value['field_category']).toBe(true);
    });

    it('sets optional fields as valid', () => {
        const opts = createDefaultOptions({
            settingsFields: {
                body: { required: true },
                field_phone: { required: false }
            }
        });
        const { initializeValidationStates, fieldValidationStates } = useFormValidation(opts as any);
        initializeValidationStates();
        expect(fieldValidationStates.value['field_phone']).toBe(true);
    });
});

describe('resetValidationState', () => {
    it('clears interaction state', () => {
        const { handleFieldValidation, fieldHasInteracted, resetValidationState } = useFormValidation(createDefaultOptions() as any);
        fieldHasInteracted.value['body'] = true;
        resetValidationState();
        expect(fieldHasInteracted.value).toEqual({});
    });

    it('resets required fields to invalid', () => {
        const opts = createValidForm();
        const { initializeValidationStates, resetValidationState, fieldValidationStates } = useFormValidation(opts as any);
        initializeValidationStates();
        expect(fieldValidationStates.value['body']).toBe(true);

        resetValidationState();
        expect(fieldValidationStates.value['body']).toBe(false);
    });
});
