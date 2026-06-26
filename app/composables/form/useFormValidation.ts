/**
 * Composable for form field validation state management.
 *
 * Handles: field validation states, interaction tracking, canSubmit logic,
 * form requirements indicator data, and validation watchers.
 */

import type { Ref, ComputedRef } from 'vue';

interface MediaItem {
    id: string
    isUploading: boolean
    error?: string | { key: string, params?: Record<string, any> }
    [key: string]: any
}

interface LocationValue {
    lat: string
    lng: string
    address: any
    displayName: string
}

interface FieldConfig {
    required?: boolean
    [key: string]: any
}

interface FormSettings {
    fields: Record<string, FieldConfig>
    [key: string]: any
}

interface UseFormValidationOptions {
    settings: Ref<FormSettings | null>
    formElement: Ref<HTMLFormElement | null>
    requirementsIndicator: Ref<{ scrollIntoView: () => void } | null>
    fields: {
        description: Ref<string>
        category: Ref<string>
        email: Ref<string>
        prename: Ref<string>
        name: Ref<string>
        phone: Ref<string>
        gdprAccepted: Ref<boolean>
        uploadedMedia: Ref<MediaItem[]>
        location: Ref<LocationValue>
    }
    isPhotoRequired: ComputedRef<boolean>
    isPhotoCategoryRequired?: ComputedRef<boolean>
    isEmailRequired: ComputedRef<boolean>
    isEmailCategoryRequired: ComputedRef<boolean>
    isLocationRequired: ComputedRef<boolean>
    isCategoryRequired: ComputedRef<boolean>
    isDescriptionRequired: ComputedRef<boolean>
    formDisabled: Ref<boolean>
    fieldExistsInApi: (fieldName: string) => boolean

    /**
     * Hard-block submission while an AI privacy warning is active (#473).
     * Driven by the `features.privacyBlockOnFlag` tenant flag AND an active
     * no-blur privacy warning. Defaults to a non-blocking computed when absent,
     * so existing behavior is unchanged.
     */
    privacyBlocked?: Ref<boolean> | ComputedRef<boolean>

    /** Order of requirements in the indicator. Defaults to photo-first. */
    requirementsOrder?: string[]
    /** Additional fields to mark as interacted on submit attempt */
    additionalInteractionFields?: string[]
    /** Called after base handleFieldValidation runs */
    onFieldValidation?: (fieldName: string, isValid: boolean) => void
}

export function useFormValidation(options: UseFormValidationOptions) {
    const { t } = useI18n();

    const {
        settings,
        formElement,
        requirementsIndicator,
        fields,
        isPhotoRequired,
        isPhotoCategoryRequired,
        isEmailRequired,
        isEmailCategoryRequired,
        isLocationRequired,
        isCategoryRequired,
        isDescriptionRequired,
        formDisabled,
        fieldExistsInApi,
        privacyBlocked,
        requirementsOrder,
        additionalInteractionFields,
        onFieldValidation
    } = options;

    const defaultOrder = ['photo', 'category', 'location', 'description', 'email', 'privacy'];
    const order = requirementsOrder || defaultOrder;

    // Validation state
    const fieldValidationStates = ref<Record<string, boolean>>({});
    const fieldHasInteracted = ref<Record<string, boolean>>({});
    const isLocationValid = ref(true);

    // Requirements indicator UI state
    const showRequirements = ref(false);
    const highlightRequirements = ref(false);

    // Basic email validation helper (fallback, server validates again)
    const isValidEmail = (val?: string) => !!val && /.+@.+\..+/.test(val);

    // Update validation state from field components
    const handleFieldValidation = (fieldName: string, isValid: boolean) => {
        fieldValidationStates.value[fieldName] = isValid;
        if (fieldName === 'field_geolocation') {
            isLocationValid.value = isValid;
        }
        // Allow forms to hook into validation (e.g. ClassicReportForm clears category on invalid)
        onFieldValidation?.(fieldName, isValid);
    };

    // Focus the first invalid required field for better UX
    const focusFirstInvalidField = () => {
        if (!settings.value?.fields || !formElement.value) return;

        const fieldPriority = [
            { name: 'field_request_media', isEmpty: () => isPhotoRequired.value && (!fields.uploadedMedia.value || fields.uploadedMedia.value.length === 0) },
            { name: 'field_category', isEmpty: () => !fields.category.value },
            { name: 'body', isEmpty: () => !fields.description.value?.trim() },
            { name: 'field_geolocation', isEmpty: () => !fields.location.value?.lat || !fields.location.value?.lng || !isLocationValid.value },
            { name: 'field_e_mail', isEmpty: () => isEmailRequired.value && !fields.email.value?.trim() },
            { name: 'field_first_name', isEmpty: () => !fields.prename.value?.trim() },
            { name: 'field_last_name', isEmpty: () => !fields.name.value?.trim() },
            { name: 'field_phone', isEmpty: () => !fields.phone.value?.trim() },
            { name: 'field_gdpr', isEmpty: () => !fields.gdprAccepted.value }
        ];

        for (const field of fieldPriority) {
            const fieldConfig = settings.value.fields[field.name];
            const isRequired = fieldConfig?.required ||
              (field.name === 'field_e_mail' && isEmailRequired.value) ||
              (field.name === 'field_request_media' && isPhotoRequired.value);

            if (isRequired && field.isEmpty()) {
                const fieldElement = formElement.value.querySelector(
                    `[id*="${field.name}"], [name="${field.name}"], [data-field="${field.name}"]`
                ) as HTMLElement;

                if (fieldElement) {
                    fieldElement.focus?.();
                    fieldElement.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }
        }
    };

    // Compute if the form meets minimal submission requirements
    const canSubmit = computed(() => {
        const categoryOk = !isCategoryRequired.value || !!fields.category.value;
        const descOk = !isDescriptionRequired.value || !!fields.description.value.trim();
        const locOk = !isLocationRequired.value || (!!fields.location.value.lat && !!fields.location.value.lng && isLocationValid.value);
        const emailNeeded = isEmailRequired.value === true;
        const emailOk = !emailNeeded || isValidEmail(fields.email.value);
        const photosOk = !isPhotoRequired.value || fields.uploadedMedia.value.length > 0;
        const gdprRequired = fieldExistsInApi('field_gdpr') && settings.value?.fields?.field_gdpr?.required === true;
        const gdprOk = !gdprRequired || fields.gdprAccepted.value === true;
        // #473: a privacy-critical photo with no automatic blurring hard-blocks
        // submission when the tenant opts in (features.privacyBlockOnFlag).
        const privacyOk = privacyBlocked?.value !== true;
        return categoryOk && descOk && locOk && emailOk && photosOk && gdprOk && privacyOk && !formDisabled.value;
    });

    // Form requirements for the indicator component (ordered by requirementsOrder option)
    const formRequirements = computed(() => {
        const requirementBuilders: Record<string, () => { field: string, label: string, complete: boolean, conditional?: boolean } | null> = {
            photo: () => {
                if (!isPhotoRequired.value) return null;
                return {
                    field: 'photo',
                    label: t('form.requirements.photo'),
                    complete: fields.uploadedMedia.value.length > 0,
                    conditional: isPhotoCategoryRequired?.value
                };
            },
            category: () => {
                if (!isCategoryRequired.value) return null;
                return {
                    field: 'category',
                    label: t('form.requirements.category'),
                    complete: !!fields.category.value
                };
            },
            location: () => {
                if (!isLocationRequired.value) return null;
                return {
                    field: 'location',
                    label: t('form.requirements.location'),
                    complete: !!(fields.location.value.lat && fields.location.value.lng && isLocationValid.value)
                };
            },
            description: () => {
                if (!isDescriptionRequired.value) return null;
                return {
                    field: 'description',
                    label: t('form.requirements.description'),
                    complete: !!fields.description.value?.trim()
                };
            },
            email: () => {
                if (!isEmailRequired.value) return null;
                return {
                    field: 'email',
                    label: t('form.requirements.email'),
                    complete: !!fields.email.value?.trim() && isValidEmail(fields.email.value),
                    conditional: isEmailCategoryRequired.value
                };
            },
            privacy: () => {
                const gdprRequired = fieldExistsInApi('field_gdpr') && settings.value?.fields?.field_gdpr?.required === true;
                if (!gdprRequired) return null;
                return {
                    field: 'privacy',
                    label: t('form.requirements.privacy'),
                    complete: fields.gdprAccepted.value === true
                };
            }
        };

        const requirements: Array<{ field: string, label: string, complete: boolean, conditional?: boolean }> = [];
        for (const key of order) {
            const builder = requirementBuilders[key];
            if (builder) {
                const req = builder();
                if (req) requirements.push(req);
            }
        }

        // U2 (#473): surface the privacy hard-block in the requirements indicator
        // so the checklist is not all-green while submit is blocked, and
        // showValidationFeedback/focusFirstInvalidField has a target. Always
        // appended last, independent of the caller's requirementsOrder, and only
        // present while actively blocking (never completes; the fix is to
        // replace/remove the photo, which clears the block entirely).
        if (privacyBlocked?.value === true) {
            requirements.push({
                field: 'privacyBlock',
                label: t('form.requirements.privacyBlock'),
                complete: false
            });
        }

        return requirements;
    });

    // Overall form validity (internal)
    const isFormValid = computed(() => {
        if (!settings.value?.fields) return false;

        const baseValidation = Object.entries(fieldValidationStates.value).every(([fieldName, isValid]) => {
            const fieldConfig = settings.value?.fields[fieldName];
            return !fieldConfig?.required || isValid;
        });

        const photoRequirement = !isPhotoRequired.value || (fields.uploadedMedia.value && fields.uploadedMedia.value.length > 0);
        const emailRequirement = !isEmailRequired.value || (fields.email.value && fields.email.value.trim());

        return baseValidation && photoRequirement && emailRequirement;
    });

    /**
     * Mark all fields as interacted and highlight requirements.
     * Used when the user tries to submit an incomplete form.
     */
    const showValidationFeedback = () => {
        const fieldsToMark = [
            'body', 'field_category', 'field_e_mail', 'field_first_name',
            'field_last_name', 'field_phone', 'field_gdpr', 'field_geolocation',
            'field_request_media',
            ...(additionalInteractionFields || [])
        ];
        fieldsToMark.forEach((field) => {
            fieldHasInteracted.value[field] = true;
        });

        showRequirements.value = true;
        highlightRequirements.value = true;
        setTimeout(() => {
            highlightRequirements.value = false;
        }, 1500);

        nextTick(() => {
            focusFirstInvalidField();
        });

        nextTick(() => {
            requirementsIndicator.value?.scrollIntoView();
        });
    };

    /**
     * Build client-side validation errors from current form state.
     * Returns an array of error objects; empty array means all valid.
     */
    const getValidationErrors = () => {
        const errors: Array<{ status: string, title: string, detail: string }> = [];

        if (isLocationRequired.value && (!fields.location.value || !fields.location.value.lat || !fields.location.value.lng)) {
            errors.push({
                status: '400',
                title: 'Validation Error',
                detail: t('errors.validation.required_field', { field: t('fields.field_geolocation') })
            });
        }

        if (isLocationRequired.value && fields.location.value?.lat && fields.location.value?.lng && !isLocationValid.value) {
            // isLocationValid is now fed purely by the boundary check (postcode no
            // longer gates — see utils/locationValidation.ts), so this only fires
            // for an out-of-boundary point on a strict tenant. Label it as such
            // instead of the misleading "Postal Code is required".
            errors.push({
                status: '400',
                title: 'Validation Error',
                detail: t('errors.validation.location_out_of_bounds')
            });
        }

        // Track which fields we've already validated to avoid duplicates
        const validatedFields = new Set<string>();

        if (settings.value?.fields) {
            Object.entries(settings.value.fields).forEach(([fieldName, fieldConfig]) => {
                if (fieldConfig.required) {
                    let isEmpty = false;
                    const fieldLabel = t(`fields.${fieldName}`, fieldName);

                    switch (fieldName) {
                        case 'body':
                            // Skip body validation if description is not required (e.g. photos required for category)
                            if (!isDescriptionRequired.value) break;
                            isEmpty = !fields.description.value?.trim();
                            break;
                        case 'field_category':
                            isEmpty = !fields.category.value;
                            break;
                        case 'field_e_mail':
                            isEmpty = !fields.email.value?.trim();
                            validatedFields.add('field_e_mail');
                            break;
                        case 'field_first_name':
                            isEmpty = !fields.prename.value?.trim();
                            break;
                        case 'field_last_name':
                            isEmpty = !fields.name.value?.trim();
                            break;
                        case 'field_phone':
                            isEmpty = !fields.phone.value?.trim();
                            break;
                        case 'field_gdpr':
                            isEmpty = !fields.gdprAccepted.value;
                            break;
                        case 'field_request_media':
                            isEmpty = isPhotoRequired.value && (!fields.uploadedMedia.value || fields.uploadedMedia.value.length === 0);
                            break;
                    }

                    if (isEmpty) {
                        errors.push({
                            status: '400',
                            title: 'Validation Error',
                            detail: t('errors.validation.required_field', { field: fieldLabel })
                        });
                    }
                }
            });
        }

        // Category-based email requirement (only if not already validated from API settings)
        if (!validatedFields.has('field_e_mail') && isEmailRequired.value && !fields.email.value?.trim()) {
            errors.push({
                status: '400',
                title: 'Validation Error',
                detail: t('errors.validation.required_field', { field: t('fields.field_e_mail') })
            });
        }

        // GDPR consent requirement is gated on fields.field_gdpr.required
        // (jurisdiction setting), decoupled from features.privacyNotice (UI).
        if (settings.value?.fields?.field_gdpr?.required === true && fieldExistsInApi('field_gdpr') && !fields.gdprAccepted.value) {
            const hasGdprError = errors.some(e => e.detail.includes(t('fields.field_gdpr')));
            if (!hasGdprError) {
                errors.push({
                    status: '400',
                    title: 'Validation Error',
                    detail: t('errors.validation.required_field', { field: t('fields.field_gdpr') })
                });
            }
        }

        // Category-based photo requirement (separate from API field_request_media.required)
        if (isPhotoRequired.value && (!fields.uploadedMedia.value || fields.uploadedMedia.value.length === 0)) {
            // Check if we already have this error from the settings loop
            const hasPhotoError = errors.some(e => e.detail.includes(t('fields.field_request_media')));
            if (!hasPhotoError) {
                errors.push({
                    status: '400',
                    title: 'Validation Error',
                    detail: t('errors.validation.required_field', { field: t('fields.field_request_media') })
                });
            }
        }

        return errors;
    };

    /**
     * Initialize validation states from API settings.
     * Call this after settings are loaded.
     */
    const initializeValidationStates = () => {
        fieldValidationStates.value = {};

        if (settings.value?.fields) {
            Object.entries(settings.value.fields).forEach(([fieldName, config]) => {
                if (fieldName === 'body') {
                    fieldValidationStates.value[fieldName] = !!fields.description.value.trim();
                } else if (fieldName === 'field_category') {
                    fieldValidationStates.value[fieldName] = !!fields.category.value;
                } else if (fieldName === 'field_gdpr') {
                    fieldValidationStates.value[fieldName] = fields.gdprAccepted.value;
                } else if (fieldName === 'field_geolocation') {
                    fieldValidationStates.value[fieldName] = !!(fields.location.value.lat && fields.location.value.lng);
                } else {
                    fieldValidationStates.value[fieldName] = !config.required;
                }
            });
        }
    };

    /**
     * Reset validation state for all fields.
     * Used when the form is reset after successful submission.
     */
    const resetValidationState = () => {
        fieldHasInteracted.value = {};
        if (settings.value?.fields) {
            fieldValidationStates.value = Object.entries(settings.value.fields).reduce((acc, [fieldName, config]) => {
                acc[fieldName] = !config.required;
                return acc;
            }, {} as Record<string, boolean>);
        }
    };

    // Validation watchers
    watch(() => fields.location.value,
        (newLocation) => {
            const isValid = !!(newLocation.lat && newLocation.lng);
            fieldValidationStates.value['field_geolocation'] = isValid;
            fieldValidationStates.value = { ...fieldValidationStates.value };
        },
        { deep: true, immediate: true }
    );

    watch(() => fields.description.value,
        (newDescription) => {
            const isValid = !!newDescription.trim();
            fieldValidationStates.value['body'] = isValid;
        }
    );

    watch(() => fields.gdprAccepted.value,
        (isAccepted) => {
            fieldValidationStates.value['field_gdpr'] = isAccepted;
        }
    );

    return {
        // State
        fieldValidationStates,
        fieldHasInteracted,
        isLocationValid,
        showRequirements,
        highlightRequirements,

        // Computed
        canSubmit,
        formRequirements,
        isFormValid,

        // Actions
        handleFieldValidation,
        focusFirstInvalidField,
        showValidationFeedback,
        getValidationErrors,
        initializeValidationStates,
        resetValidationState,
        isValidEmail
    };
}
