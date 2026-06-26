<template>
  <div class="classic-report-form">
    <div
      ref="scrollContainer"
    >
      <div
        class="space-y-6"
        :class="{ 'form-fields-disabled': formDisabled }"
        style=""
      >
        <!-- Success Message -->
        <UAlert
          v-if="successMessage"
          color="primary"
          variant="soft"
          icon="i-heroicons-check-circle"
        >
          {{ t('success.report_submitted') }}
        </UAlert>

        <!-- Error Messages -->
        <FormErrorDisplay
          v-if="errorState.isVisible"
          ref="errorContainer"
          :error-state="errorState"
          @clear="clearErrorState"
        />

        <!-- Duplicate Hint Warning (can be dismissed by resubmitting) -->
        <UAlert
          v-if="duplicateHintState.isVisible"
          color="warning"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          close-icon="i-heroicons-x-mark"
          :title="t('errors.validation.duplicate_hint_title')"
          :close="{ color: 'warning', variant: 'link' }"
          @update:open="clearDuplicateHint"
        >
          <template #description>
            <p class="mb-3">
              {{ t('errors.validation.duplicate_hint_message') }}
            </p>
            <p
              v-if="duplicateHintState.existingReport?.id"
              class="mb-3 text-sm"
            >
              {{ t('errors.validation.duplicate_existing_report', { reportId: duplicateHintState.existingReport.id }) }}
            </p>
            <div class="flex gap-2 mt-3">
              <UButton
                v-if="duplicateHintState.existingReport?.url"
                :to="duplicateHintState.existingReport.url"
                target="_blank"
                color="neutral"
                variant="outline"
                size="sm"
              >
                {{ t('errors.validation.view_existing_report') }}
              </UButton>
              <UButton
                color="warning"
                variant="solid"
                size="sm"
                :loading="loading"
                @click="submitWithAcknowledgment"
              >
                {{ t('errors.validation.submit_anyway') }}
              </UButton>
            </div>
          </template>
        </UAlert>

        <!-- Form Disabled Alert -->
        <UAlert
          v-if="formDisabled && selectedCategoryName"
          color="warning"
          variant="soft"
          icon="i-heroicons-information-circle"
          :title="t('form.category_disabled_notice')"
          :description="t('form.category_disabled.description', { category: selectedCategoryName })"
        />

        <!-- Form Requirements Indicator -->
        <FormRequirementsIndicator
          v-if="settings && !formDisabled && !successMessage"
          ref="requirementsIndicator"
          :requirements="formRequirements"
          :show-when-complete="false"
          :visible="showRequirements"
          :highlight="highlightRequirements"
        />

        <!-- Form Skeleton - shown while settings load or not yet available -->
        <div
          v-if="!settings"
          class="space-y-6 animate-pulse"
        >
          <!-- Category skeleton -->
          <div class="space-y-2">
            <div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
          <!-- Description skeleton -->
          <div class="space-y-2">
            <div class="h-4 w-28 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
          <!-- Location skeleton -->
          <div class="space-y-2">
            <div class="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
          <!-- Contact fields skeleton -->
          <div class="space-y-2">
            <div class="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
          <!-- Submit button skeleton -->
          <div class="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
        </div>

        <!-- Actual Form - shown when settings loaded -->
        <form
          v-else
          ref="formElement"
          class="space-y-6"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <!-- Media + Category fields first -->
          <DynamicFormSection
            :model-value="allFieldsModel"
            :disabled="formDisabled"
            :include-only-fields="primaryFieldNames"
            :field-specific-props="fieldSpecificProps"
            @update:model-value="handleAllFieldsUpdate"
            @field-validation="handleFieldValidation"
            @category-form-disabled="handleCategoryFormDisabled"
            @category-disable-media-upload="handleCategoryDisableMediaUpload"
          />

          <!-- Exclusive mode: facility dropdown. Required when the map picker
               is hidden (facility drives location). Mixed mode (#361) keeps
               the picker below, so the dropdown is purely a quick-pick and
               not required on its own. -->
          <FacilitySelect
            v-if="isExclusive"
            :model-value="selectedFacilityId"
            :items="facilityOptions"
            :facilities="activeFacilities"
            :label="facilityLabel"
            :placeholder="facilityPlaceholder"
            :search-placeholder="facilitySearchPlaceholder"
            :required="facilityPickRequired"
            :error="facilityError"
            :disabled="formDisabled"
            show-locate-button
            :is-locating="isFacilityLocating"
            @update:model-value="handleFacilityUpdate"
            @locate-me="handleFacilityLocateMe"
          />

          <!-- Optional mode: informational chip appears when the citizen's
               position landed inside a facility's snap radius. Tag follows
               the pin — no citizen action, no dismiss. -->
          <div
            v-else-if="isOptional && selectedFacility"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-elevated border border-default"
            role="status"
          >
            <UIcon
              name="i-heroicons-map-pin"
              class="size-4 text-primary shrink-0"
            />
            <span class="text-sm">
              {{ $t('form.facility_tagged_with', { label: selectedFacility.label }) }}
            </span>
          </div>

          <!-- Service Definition Attributes (Open311 per-category extra fields) -->
          <ServiceAttributes
            v-if="hasAttributes"
            :attributes="visibleAttributes"
            :model-value="attributeValues"
            :errors="attributeErrorMap"
            @update:model-value="handleAttributeValuesUpdate"
          />

          <!-- Remaining fields after category. field_geolocation is only
               excluded when the map picker is suppressed (exclusive mode +
               hideMapPicker=true). Optional mode and mixed mode (exclusive +
               hideMapPicker=false, #361) keep it visible so the reporter can
               drop a free pin alongside the facility quick-pick. -->
          <DynamicFormSection
            :model-value="allFieldsModel"
            :disabled="formDisabled"
            :exclude-fields="[
              'field_address',
              'field_request_media',
              'field_category',
              ...(showMapPicker ? [] : ['field_geolocation']),
            ]"
            :field-specific-props="fieldSpecificProps"
            @update:model-value="handleAllFieldsUpdate"
            @field-validation="handleFieldValidation"
            @pick-on-map="emit('pick-on-map')"
          />

          <!-- Submit Section -->
          <div
            v-if="!hideSubmitButton"
            class="mt-6 space-y-4"
            @focusin="onSubmitSectionFocus"
          >
            <PrivacyNotice />
            <UButton
              type="submit"
              :loading="loading"
              :disabled="loading || formDisabled || isUploadingMedia"
              block
              size="lg"
              color="primary"
            >
              {{ submitButtonText }}
            </UButton>
          </div>
        </form>
      </div>
    </div> <!-- end scrollContainer -->
  </div>

  <!-- Privacy Modal embedded in PrivacyNotice -->
</template>

<script setup lang="ts">
/**
 * ClassicReportForm Component
 *
 * Standard citizen reporting form with category-based conditional requirements.
 */

import { useI18n } from 'vue-i18n';
import { pickLocationAddress } from '~/utils/pickLocationAddress';

interface MapCenter {
    lat: number
    lng: number
    address?: string
    addressObj?: Record<string, unknown>
}

const props = defineProps<{
    mapCenter?: MapCenter | null
    autoTriggerGeolocation?: boolean
    savedState?: any
    hideSubmitButton?: boolean
    geolocatedCoords?: { lat: number, lng: number } | null
    context?: 'inline' | 'modal'
}>();

const emit = defineEmits<{
    'success': [response: any]
    'bottom-focus': [] // Emit when bottom section (submit area) receives focus
    'pick-on-map': []
}>();

const { t } = useI18n();
const { settings, fetchSettings } = useFormSettings();

// Function to check if a field exists in the API response
const fieldExistsInApi = (fieldName: string): boolean => {
    if (!settings.value?.fields) return false;
    return Object.hasOwn(settings.value.fields, fieldName);
};

// Form refs
const scrollContainer = ref<HTMLElement | null>(null);
const errorContainer = ref<HTMLElement | null>(null);
const formElement = ref<HTMLFormElement | null>(null);
const requirementsIndicator = ref<{ scrollIntoView: () => void } | null>(null);

// Form state
const description = ref('');
const category = ref('');
const email = ref('');
const gdprAccepted = ref(false);
const prename = ref('');
const name = ref('');
const phone = ref('');
const uploadedMedia = ref<Array<{ id: string, preview: string, progress?: number, error?: string, isUploading: boolean, cachedId?: string, isOfflineCached?: boolean }>>([]);
const location = ref({ lat: '', lng: '', address: undefined, displayName: '' });
const selectedFacilityId = ref('');
const formDisabled = ref(false);
const disableMediaUpload = ref(true);

// Categories
const { categories, fetchCategories } = useCategories();
const { clientConfig } = useMarkASpotConfig();
const facilityFormMode = useFacilityFormMode({
    facilityId: selectedFacilityId,
    location
});
const {
    isExclusive,
    isOptional,
    isMixedMode,
    showMapPicker,
    activeFacilities,
    selectedFacility,
    facilityOptions,
    singularLabel,
    nearestSnapRadius,
    initializeSelection,
    clearFacilitySelection,
    resolveSavedFacilityIdForLocation,
    snapToNearestFacility,
    facilityFieldName,
    facilityLabel,
    facilityPlaceholder,
    facilitySearchPlaceholder,
    facilityPickRequired
} = facilityFormMode;

// Exclusive mode WITHOUT the map picker: locate-me click triggers a one-shot
// snap with toast feedback (the FacilitySelect locate button is the only
// entry point to geolocation in that flavour). In mixed mode (exclusive +
// hideMapPicker=false) we intentionally do NOT snap — the reporter wants a
// free pin, so the facility selection is cleared instead (see
// `handleFacilityLocateMe` / `handleMapPickFreePick`).
const facilityNearestSnapEnabled = computed(() => isExclusive.value && !showMapPicker.value);
const { processCoords: processFacilitySnapCoords } = useFacilityNearestSnap({
    geolocatedCoords: computed(() => props.geolocatedCoords ?? null),
    facilityModeEnabled: facilityNearestSnapEnabled,
    singularLabel,
    snapToNearestFacility
});

// Optional mode: position changes silently re-evaluate facility tag (attach
// in radius, detach out of radius, switch when closer to a different one).
useFacilityPositionTag({
    position: location,
    isOptional,
    selectedFacilityId,
    activeFacilities,
    nearestSnapRadius
});

// Locate-me button inside the form (modal overlays the map-level button).
// Local ref avoids the useGeolocation singleton leaking loading state across
// components (e.g. map-level locate spinner also flipping this button).
const { getCurrentPosition: getFacilityLocatePosition } = useGeolocation();
const { reverse: reverseGeocodeForLocate, formatAddress: formatGeocodedAddress } = useGeocoding();
const isFacilityLocating = ref(false);
const handleFacilityLocateMe = async () => {
    isFacilityLocating.value = true;
    try {
        const coords = await getFacilityLocatePosition();
        if (isMixedMode.value) {
            // Mixed mode (#361): locate-me writes a free position and drops
            // the facility quick-pick. Keeps the map-picker path authoritative
            // so reverse geocoding can still fire downstream. `silent` skips
            // the map-pick deselect toast — the user just tapped locate-me,
            // they don't need a redundant "using your own location" banner.
            clearFacilitySelection({ silent: true });
            // Seed with raw coords so the form's required-location gate flips
            // immediately; the reverse-geocode below replaces the empty
            // displayName with a human-readable address inline. Without this
            // inline reverse, LocationInput's watcher would not trigger
            // (its non-empty searchInput from the previous facility blocks
            // the auto-reverse path) and the address pill would stay stale
            // until the next pin/drag.
            location.value = {
                lat: String(coords.lat),
                lng: String(coords.lng),
                address: undefined,
                displayName: ''
            };
            try {
                const result = await reverseGeocodeForLocate(coords.lat, coords.lng);
                location.value = {
                    lat: String(coords.lat),
                    lng: String(coords.lng),
                    address: result?.address ?? undefined,
                    displayName: result?.displayName || formatGeocodedAddress(result?.address)
                };
            } catch {
                // useGeocoding's own fallback already returns a coord-string
                // displayName on failure; if the call itself rejects (very
                // rare), leave the seeded blank state so the user can retry.
            }
        } else {
            processFacilitySnapCoords({ lat: coords.lat, lng: coords.lng });
        }
    } catch {
        // useGeolocation already surfaces a toast for permission / unavailable errors.
    } finally {
        isFacilityLocating.value = false;
    }
};

// Generic conditional fields (party, oktoberfest, objectId, etc. - all config-driven)
const {
    conditionalFieldNames,
    fieldValues: conditionalFieldValues,
    isFieldVisible,
    getConditionalFieldsForSubmission,
    resetConditionalFields,
    getConditionalFieldsSnapshot,
    restoreConditionalFields
} = useConditionalFields({ category, categories });

// Open311 service definition attributes (per-category extra fields)
const {
    attributeValues,
    visibleAttributes,
    hasAttributes,
    getAttributeErrors,
    getAttributesForSubmission
} = useServiceAttributes({ category, categories });

const allowParentCategorySelection = computed(() =>
    clientConfig.value?.features?.forms?.allowParentCategorySelection === true
);

// Attribute error map for ServiceAttributes component (code -> error message)
const attributeErrorMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const err of getAttributeErrors()) {
        map[err.code] = err.message;
    }
    return map;
});

// Handle attribute values update from ServiceAttributes component
const handleAttributeValuesUpdate = (updated: Record<string, any>) => {
    for (const [code, value] of Object.entries(updated)) {
        attributeValues[code] = value;
    }
};

// Field visibility
const showEmailField = computed(() => fieldExistsInApi('field_e_mail'));
const showGdprField = computed(() => fieldExistsInApi('field_gdpr'));
const showPrenameField = computed(() => fieldExistsInApi('field_first_name'));
const showNameField = computed(() => fieldExistsInApi('field_last_name'));
const showPhoneField = computed(() => fieldExistsInApi('field_phone'));

// Field requirements
const { isFieldRequired, isPhotoRequiredForCategory, isEmailRequiredForCategory } = useFieldRequirements();
const isCategoryRequired = isFieldRequired('field_category', true);
const baseLocationRequired = isFieldRequired('field_geolocation', true);
// Required only when the map picker is actually rendered. In the
// hide-map-picker flavour of exclusive mode the facility select carries the
// required-ness instead (gated via `facilityError` + `canSubmit`).
const isLocationRequired = computed(() => showMapPicker.value ? baseLocationRequired.value : false);

const isPhotoRequired = computed(() => {
    const cat = categories.value.find(c => c.id === category.value);
    const categoryId = cat?.attributes?.drupal_internal__tid ?? null;
    const photoRequiredCats = (clientConfig.value?.features?.photoRequiredCategories || []) as number[];
    return isPhotoRequiredForCategory(categoryId, photoRequiredCats).value;
});

const isDescriptionRequired = computed(() => {
    if (isPhotoRequired.value) return false;
    return isFieldRequired('body', true).value;
});

const isPhotoCategoryRequired = computed(() => {
    const cat = categories.value.find(c => c.id === category.value);
    const categoryId = cat?.attributes?.drupal_internal__tid;
    if (typeof categoryId !== 'number') return false;
    const photoRequiredCats = (clientConfig.value?.features?.photoRequiredCategories || []) as number[];
    return photoRequiredCats.includes(categoryId);
});

const isEmailRequired = computed(() => {
    const cat = categories.value.find(c => c.id === category.value);
    const categoryId = cat?.attributes?.drupal_internal__tid ?? null;
    const emailRequiredCats = (clientConfig.value?.features?.emailRequiredCategories || []) as number[];
    return isEmailRequiredForCategory(categoryId, emailRequiredCats).value;
});

const isEmailCategoryRequired = computed(() => {
    const cat = categories.value.find(c => c.id === category.value);
    const categoryId = cat?.attributes?.drupal_internal__tid;
    if (typeof categoryId !== 'number') return false;
    const emailRequiredCats = (clientConfig.value?.features?.emailRequiredCategories || []) as number[];
    return emailRequiredCats.includes(categoryId);
});

const selectedCategoryName = computed(() => {
    if (!category.value) return '';
    const cat = categories.value.find(c => c.id === category.value);
    return cat?.attributes?.name || '';
});

// Form validation composable
const {
    fieldHasInteracted,
    isLocationValid,
    showRequirements,
    highlightRequirements,
    canSubmit: baseCanSubmit,
    formRequirements,
    handleFieldValidation: baseHandleFieldValidation,
    showValidationFeedback,
    getValidationErrors: getBaseValidationErrors,
    initializeValidationStates,
    resetValidationState
} = useFormValidation({
    settings,
    formElement,
    requirementsIndicator,
    fields: { description, category, email, prename, name, phone, gdprAccepted, uploadedMedia, location },
    isPhotoRequired,
    isPhotoCategoryRequired,
    isEmailRequired,
    isEmailCategoryRequired,
    isLocationRequired,
    isCategoryRequired,
    isDescriptionRequired,
    formDisabled,
    fieldExistsInApi,
    requirementsOrder: ['category', 'location', 'description', 'photo', 'email', 'privacy'],
    additionalInteractionFields: [...conditionalFieldNames.value, facilityFieldName],
    onFieldValidation: (fieldName, isValid) => {
        // ClassicReportForm clears category on invalid
        if (fieldName === 'field_category' && !isValid) {
            category.value = '';
        }
        // Track interaction for conditional fields
        if (conditionalFieldNames.value.includes(fieldName)) {
            fieldHasInteracted.value[fieldName] = true;
        }
    }
});

const facilityMapSelection = facilityFormMode.connectMapSelection({ fieldHasInteracted });

const canSubmit = computed(() => facilityFormMode.canSubmitWithFacility(baseCanSubmit.value));

// Disable the submit button (NOT canSubmit, which gates the sticky footer) while
// any media is still uploading, so a report cannot be submitted mid-upload (#14).
const isUploadingMedia = computed(() =>
    uploadedMedia.value.some(m => m.isUploading)
);

const facilityError = facilityFormMode.getFacilityError(fieldHasInteracted);

// Wrap handleFieldValidation for template binding (DynamicFormSection emits this)
const handleFieldValidation = baseHandleFieldValidation;

// Extend validation errors with service definition attribute errors
const getValidationErrors = () => {
    const errors = getBaseValidationErrors();
    const facilityValidationError = facilityFormMode.getFacilityValidationError();
    if (facilityValidationError) errors.push(facilityValidationError);
    for (const attrErr of getAttributeErrors()) {
        errors.push({
            status: '400',
            title: 'Validation Error',
            detail: attrErr.message
        });
    }
    return errors;
};

// Build request data for ClassicReportForm
const buildRequestData = () => {
    // Single-source rule: see app/utils/pickLocationAddress.ts. Exclusive
    // facility mode hands address authority to the facility; every other
    // mode keeps the citizen-picked pin's address.
    const locationAddress = pickLocationAddress(
        isExclusive.value,
        selectedFacility.value,
        location.value.address
    );

    const requestData: Record<string, any> = {
        title: `Report ${new Date().toISOString()}`,
        body: { value: description.value, format: 'plain_text' },
        field_category: category.value,
        ...facilityFormMode.getSubmissionFields(),
        field_geolocation: {
            lat: parseFloat(location.value.lat),
            lng: parseFloat(location.value.lng)
        },
        field_request_media: submittableMediaIds(uploadedMedia.value),
        locationAddress
    };

    // Only add optional fields if they're in the API AND have values
    if (showEmailField.value && email.value) requestData.field_e_mail = email.value;
    if (showPrenameField.value && prename.value) requestData.field_first_name = prename.value;
    if (showNameField.value && name.value) requestData.field_last_name = name.value;
    if (showPhoneField.value && phone.value) requestData.field_phone = phone.value;
    if (showGdprField.value) requestData.field_gdpr = gdprAccepted.value;

    // Conditional fields (only visible + populated, with boolean->0/1 conversion)
    Object.assign(requestData, getConditionalFieldsForSubmission());

    // Open311 service definition attributes
    const attributes = getAttributesForSubmission();
    if (Object.keys(attributes).length > 0) {
        requestData.attributes = attributes;
    }

    return requestData;
};

// Offline draft persistence (must be before useFormSubmission which needs clearDraft)
const {
    initialize: initDraftPersistence,
    clearDraft
} = useFormDraftPersistence({
    description, category, email, phone, name, prename,
    facilityId: facilityFormMode.facilityId,
    gdprAccepted, uploadedMedia, location
});

// Form submission composable
const {
    isSubmitting,
    successMessage,
    errorState,
    clearErrorState,
    duplicateHintState,
    clearDuplicateHint,
    handleSubmit,
    submitWithAcknowledgment
} = useFormSubmission({
    description, category, email, phone, name, prename,
    gdprAccepted, uploadedMedia, location, selectedFacilityId: facilityFormMode.submittableFacilityId,
    getValidationErrors, showValidationFeedback,
    buildRequestData, errorContainer,
    onSuccess: (response: any) => emit('success', response),
    clearDraft
});

// Template uses `loading` for the submit button
const loading = computed(() => isSubmitting.value);

const submitButtonText = computed(() => {
    if (loading.value) return t('report.form.submit.submitting');
    return t('report.form.submit.button');
});

// Computed map center data
const mapCenterData = computed(() => {
    if (!props.mapCenter) return undefined;
    return { lat: props.mapCenter.lat, lng: props.mapCenter.lng, address: props.mapCenter.address };
});

// All fields model for dynamic rendering
const allFieldsModel = computed(() => ({
    body: description.value,
    field_category: category.value,
    field_request_media: uploadedMedia.value,
    field_e_mail: email.value,
    field_phone: phone.value,
    field_last_name: name.value,
    field_geolocation: location.value,
    field_first_name: prename.value,
    field_gdpr: gdprAccepted.value,
    // Conditional fields (dynamic from config, explicitly iterate for reactivity tracking)
    ...Object.fromEntries(
        conditionalFieldNames.value.map(name => [name, conditionalFieldValues[name]])
    )
}));
const primaryFieldNames = computed(() => ['field_request_media', 'field_category']);

// Field-specific props
const fieldSpecificProps = computed(() => ({
    field_category: {
        required: isCategoryRequired.value,
        useSearchable: true,
        formDisabled: formDisabled.value,
        hasInteracted: fieldHasInteracted.value['field_category'],
        allowParentSelection: allowParentCategorySelection.value
    },
    body: {
        label: t('report.form.description.label'),
        required: isDescriptionRequired.value,
        placeholder: t('report.form.description.placeholder'),
        helpText: t('report.form.description.help'),
        hasInteracted: fieldHasInteracted.value['body']
    },
    field_request_media: {
        uploadedMedia: uploadedMedia.value,
        enableAI: false,
        isRequired: isPhotoRequired.value,
        categoryRequired: isPhotoCategoryRequired.value,
        hideRequiredLabeling: false,
        disabled: formDisabled.value && disableMediaUpload.value,
        hasInteracted: fieldHasInteracted.value['field_request_media']
    },
    field_geolocation: {
        required: isLocationRequired.value,
        mapCenter: mapCenterData.value,
        triggeredFromAction: true,
        autoTriggerGeolocation: props.autoTriggerGeolocation,
        hasInteracted: fieldHasInteracted.value['field_geolocation'],
        context: props.context
    },
    field_e_mail: {
        required: isEmailRequired.value,
        categoryRequired: isEmailCategoryRequired.value,
        hideRequiredLabeling: false,
        disabled: formDisabled.value,
        hasInteracted: fieldHasInteracted.value['field_e_mail']
    },
    field_first_name: {
        hasInteracted: fieldHasInteracted.value['field_first_name'],
        visible: showPrenameField.value
    },
    field_last_name: {
        hasInteracted: fieldHasInteracted.value['field_last_name'],
        visible: showNameField.value
    },
    field_phone: {
        hasInteracted: fieldHasInteracted.value['field_phone'],
        visible: showPhoneField.value
    },
    field_gdpr: {
        hasInteracted: fieldHasInteracted.value['field_gdpr'],
        visible: showGdprField.value
    },
    // Conditional field props (dynamic from config)
    ...Object.fromEntries(
        conditionalFieldNames.value.map(fieldName => [
            fieldName,
            {
                disabled: formDisabled.value,
                hasInteracted: fieldHasInteracted.value[fieldName],
                visible: isFieldVisible(fieldName).value
            }
        ])
    )
}));

// Handle updates from all dynamic fields
const handleAllFieldsUpdate = (updatedFields: Record<string, any>) => {
    if (updatedFields.body !== undefined) description.value = updatedFields.body;
    if (updatedFields.field_category !== undefined) category.value = updatedFields.field_category;
    if (updatedFields.field_request_media !== undefined) uploadedMedia.value = updatedFields.field_request_media;
    if (updatedFields.field_e_mail !== undefined) email.value = updatedFields.field_e_mail;
    if (updatedFields.field_phone !== undefined) phone.value = updatedFields.field_phone;
    if (updatedFields.field_last_name !== undefined) name.value = updatedFields.field_last_name;
    if (updatedFields.field_geolocation !== undefined) location.value = updatedFields.field_geolocation;
    if (updatedFields.field_first_name !== undefined) prename.value = updatedFields.field_first_name;
    if (updatedFields.field_gdpr !== undefined) gdprAccepted.value = updatedFields.field_gdpr;
    // Handle conditional fields dynamically
    for (const fieldName of conditionalFieldNames.value) {
        if (updatedFields[fieldName] !== undefined) {
            conditionalFieldValues[fieldName] = updatedFields[fieldName];
        }
    }
};

const handleFacilityUpdate = (value: string) => {
    facilityFormMode.setFacilityId(value, fieldHasInteracted);
};

// Handle special category events
const handleCategoryFormDisabled = (disabled: boolean) => {
    formDisabled.value = disabled;
};

const handleCategoryDisableMediaUpload = (disabled: boolean) => {
    disableMediaUpload.value = disabled;
};

const resetForm = () => {
    description.value = '';
    category.value = '';
    facilityFormMode.setFacilityId('');
    email.value = '';
    gdprAccepted.value = false;
    prename.value = '';
    name.value = '';
    phone.value = '';
    location.value = { lat: '', lng: '', address: undefined, displayName: '' };
    uploadedMedia.value = [];
    // Reset all conditional fields to defaults
    resetConditionalFields();
    initializeSelection();
    resetValidationState();
    clearErrorState();
};

// Form state persistence
const { getFormState: getBaseFormState, restoreFormState: restoreBaseFormState, watchMapCenter } = useFormStatePersistence({
    description, category, email, phone, name, prename,
    facilityId: selectedFacilityId,
    gdprAccepted, uploadedMedia, location
});

// Extend form state to include conditional fields
const getFormState = async () => {
    const baseState = await getBaseFormState();
    if (!baseState) return null;
    return {
        ...baseState,
        conditionalFields: getConditionalFieldsSnapshot()
    };
};

const restoreFormState = (state: any) => {
    restoreBaseFormState(state);
    if (state?.conditionalFields) {
        restoreConditionalFields(state.conditionalFields);
    }
};

// Handle focus on submit section
function onSubmitSectionFocus() {
    emit('bottom-focus');
    if (!canSubmit.value && requirementsIndicator.value) {
        requirementsIndicator.value.scrollIntoView();
    }
}

// Setup mapCenter watcher. Enabled whenever the map picker is rendered —
// disabled mode, optional mode, and mixed mode (exclusive + hideMapPicker=false)
// all let the reporter move the pin around. The hide-map-picker flavour of
// exclusive mode is the only path where the facility drives location.
watchMapCenter(computed(() => props.mapCenter), {
    enabled: showMapPicker
});

// Mixed mode (#361): a fresh map click / locate-me move means the reporter
// chose a different spot, so the previously-selected facility quick-pick is
// now stale. Clearing here goes through `clearFacilitySelection`, which also
// burns the URL preselect so `?facility=<id>` doesn't snap back on the next
// dep-change pass. We only clear on actual coordinate changes (the shared
// watcher already skips no-op fires).
watch(
    () => props.mapCenter && `${props.mapCenter.lat}:${props.mapCenter.lng}`,
    (fresh, stale) => {
        if (!isMixedMode.value) return;
        if (!fresh || fresh === stale) return;
        if (!selectedFacilityId.value) return;
        clearFacilitySelection();
    }
);

onMounted(async () => {
    await fetchSettings();
    await fetchCategories();
    initializeValidationStates();

    const draftLoaded = await initDraftPersistence();

    // Cross-validate the draft's saved facility against the fresh mapCenter.
    // If the user closed the dialog with facility X pre-filled and then
    // clicked somewhere on the map farther than `nearestSnapRadius` from X,
    // the draft's facilityId + facility-synced location are stale and must
    // not be restored — otherwise the form snaps back to X on reopen even
    // though the user is clearly reporting elsewhere now.
    const effectiveFacilityId = resolveSavedFacilityIdForLocation(
        props.savedState?.facilityId,
        props.mapCenter
    );
    const droppedStaleFacility = Boolean(
        props.savedState?.facilityId &&
        effectiveFacilityId !== props.savedState.facilityId
    );

    // When the stale facility is dropped, also strip location ONLY in
    // exclusive mode: there `location` was synced from the facility coords,
    // so it is derived and must reseed from mapCenter. In optional mode
    // `location` is user-authored (the facility is just a position-tag),
    // so we keep it and only drop the now-invalid facilityId.
    if (props.savedState && !draftLoaded) {
        restoreFormState(
            droppedStaleFacility
                ? {
                    ...props.savedState,
                    facilityId: undefined,
                    ...(isExclusive.value ? { location: undefined } : {})
                }
                : props.savedState
        );
    }

    // initDraftPersistence writes straight into the reactive refs and can
    // clobber a fresher map-side pick that fired synchronously through
    // useMapFacilitySelection during setup. When the restored facility is
    // spatially stale relative to the current mapCenter, reset the refs
    // now so the fallthrough in initializeSelection below can pick up the
    // actual map click (or land on a clean slate).
    if (draftLoaded && droppedStaleFacility) {
        facilityFormMode.setFacilityId('');
        if (isExclusive.value) {
            location.value = { lat: '', lng: '', address: undefined, displayName: '' };
        }
    }

    // Precedence when the draft was stale: (1) map-side pick via shared
    // state (the user clicked a facility marker to open the dialog), else
    // (2) undefined -> initializeSelection falls through to current ref
    // state then route preselect. When the draft was not stale we honor
    // it exactly as before.
    const mapPickedFacilityId = facilityMapSelection.lastSelectedFacility.value?.id;
    initializeSelection(
        droppedStaleFacility ? mapPickedFacilityId : props.savedState?.facilityId
    );

    // The IndexedDB draft (pro-layer) does not cache media blobs by default,
    // so it may restore text fields but leave uploadedMedia empty.
    // Fill in media from the Pinia store draft if available.
    if (draftLoaded && uploadedMedia.value.length === 0 &&
      props.savedState?.uploadedMedia?.length > 0) {
        uploadedMedia.value = props.savedState.uploadedMedia;
    }

    if (showMapPicker.value && props.mapCenter?.lat !== undefined && props.mapCenter?.lng !== undefined) {
        location.value = {
            lat: props.mapCenter.lat.toString(),
            lng: props.mapCenter.lng.toString(),
            address: props.mapCenter.addressObj || undefined,
            displayName: props.mapCenter.address || ''
        };
    }
});

defineExpose({
    handleSubmit,
    isSubmitting,
    canSubmit,
    formDisabled,
    resetForm,
    getFormState,
    showRequirements,
    highlightRequirements
});
</script>

<style scoped>
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  scrollbar-gutter: stable;
}

.overflow-y-auto::-webkit-scrollbar {
  display: none;  /* Hide scrollbar for Chrome, Safari and Opera */
}

/* Fix the scrollbar gutter issue for all scroll containers in the form */
:deep(*) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(*::-webkit-scrollbar) {
  display: none;
}

.sticky {
  position: -webkit-sticky;
  position: sticky;
}

/* Highlighted category description when form is disabled */
.category-info-highlighted {
  padding: 1.5rem;
  margin: -0.5rem -0.5rem 0.5rem;
  border-radius: 0.5rem;
  border: 2px solid var(--color-primary-500);
  background-color: var(--color-primary-50);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: info-box-pulse 2s infinite;
  transition: all 0.3s ease;
  --color-primary-500-rgb: 79, 70, 229; /* Indigo-500 RGB values */
}

@keyframes info-box-pulse {
  0% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(var(--color-primary-500-rgb), 0.3), 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: scale(1.01);
  }
  100% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: scale(1);
  }
}

.dark .category-info-highlighted {
  background-color: var(--color-primary-900);
  border-color: var(--color-primary-700);
}

/* Disabled form styling */
.form-fields-disabled :deep(input:not([type="submit"])),
.form-fields-disabled :deep(textarea),
.form-fields-disabled :deep(.form-control),
.form-fields-disabled :deep(.media-upload),
.form-fields-disabled :deep(.location-input) {
  opacity: 0.4;
  filter: grayscale(40%);
  pointer-events: none;
  cursor: not-allowed;
}

/* Keep category select dropdown and media upload functional */
.form-fields-disabled .category-select-container :deep(select),
.form-fields-disabled .category-select-container :deep(*) {
  opacity: 1;
  filter: none;
  pointer-events: auto;
  cursor: pointer;
}

/* Make sure the CategoryDescription inside the highlighted area remains fully visible */
.category-info-highlighted :deep(*) {
  opacity: 1 !important;
  filter: none !important;
  pointer-events: auto !important;
}

/* Hide the red error notice in CategoryFieldWrapper since we use UAlert instead */
:deep(.category-field-wrapper .text-red-600) {
  display: none;
}
</style>
