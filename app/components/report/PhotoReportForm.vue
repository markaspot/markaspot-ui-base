<template>
  <div class="photo-report-form">
    <div
      ref="scrollContainer"
    >
      <div
        class="space-y-6"
        :class="{ 'form-fields-disabled': formDisabled }"
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
                :loading="isSubmitting"
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
          <!-- Photo upload skeleton -->
          <div class="space-y-2">
            <div class="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div class="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
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
          <!-- Media + Category -->
          <DynamicFormSection
            :model-value="allFieldsModel"
            :disabled="formDisabled"
            :include-only-fields="['field_request_media', 'field_category']"
            :field-specific-props="fieldSpecificProps"
            @update:model-value="handleAllFieldsUpdate"
            @field-validation="handleFieldValidation"
            @category-form-disabled="handleCategoryFormDisabled"
            @category-disable-media-upload="handleCategoryDisableMediaUpload"
          />

          <!-- Exclusive mode: facility dropdown. Required when the map picker
               is hidden (facility drives location). Mixed mode (#361) keeps
               the picker below, so the dropdown is purely a quick-pick. -->
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

          <!-- Optional mode: informational chip when the citizen's position
               landed inside a facility's snap radius. Purely informational —
               no dismiss action, the tag follows the pin. -->
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

          <!-- Service Definition Attributes (right after category) -->
          <ServiceAttributes
            v-if="hasAttributes"
            :attributes="visibleAttributes"
            :model-value="attributeValues"
            :errors="attributeErrorMap"
            @update:model-value="handleAttributeValuesUpdate"
          />

          <!-- Description, Location, Contact fields. field_geolocation is
               only excluded when the map picker is suppressed (exclusive +
               hideMapPicker=true). Optional and mixed mode (#361) keep it
               visible for free-form placement / mixed quick-pick + pin. -->
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
            <!-- U1a (#473): explain why submit is disabled. Without this the
                 grey button is a dead end for sighted and AT users alike. -->
            <p
              v-if="privacyBlocked"
              id="submit-privacy-block-reason"
              class="text-sm text-error-600 dark:text-error-400 flex items-start gap-2"
              role="alert"
            >
              <UIcon
                name="i-heroicons-eye-slash"
                class="w-4 h-4 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>{{ t('report.ai.privacy.required') }}</span>
            </p>
            <UButton
              type="submit"
              :loading="isSubmitting || isAIProcessing"
              :disabled="isSubmitting || isAIProcessing || formDisabled || isUploadingMedia || privacyBlocked"
              :aria-describedby="privacyBlocked ? 'submit-privacy-block-reason' : undefined"
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
 * PhotoReportForm Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import { pickLocationAddress } from '~/utils/pickLocationAddress';
import { privacyBlockValidationError, canDismissPrivacyWarning } from '~/utils/privacyBlock';

const { t } = useI18n();
const { settings, fetchSettings } = useFormSettings();
// Use dynamic config from API for per-jurisdiction feature flags
const { clientConfig } = useMarkASpotConfig();
const { aiAnalysisEnabled, privacyBlockEnabled } = useFeatureFlags();
const isAIEnabled = computed(() => aiAnalysisEnabled.value);

const allowParentCategorySelection = computed(() =>
    clientConfig.value?.features?.forms?.allowParentCategorySelection === true
);

// Field visibility computed properties based on API settings
const showEmailField = computed(() => fieldExistsInApi('field_e_mail'));
const showGdprField = computed(() => fieldExistsInApi('field_gdpr'));
const showPrenameField = computed(() => fieldExistsInApi('field_first_name'));
const showNameField = computed(() => fieldExistsInApi('field_last_name'));
const showPhoneField = computed(() => fieldExistsInApi('field_phone'));

// Computed map center data to handle null case
const mapCenterData = computed(() => {
    if (!props.mapCenter) return undefined;
    return {
        lat: props.mapCenter.lat,
        lng: props.mapCenter.lng,
        address: props.mapCenter.address
    };
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

// Field-specific props for complex components
const fieldSpecificProps = computed(() => ({
    field_category: {
        required: isCategoryRequired.value,
        useSearchable: true,
        formDisabled: formDisabled.value,
        hasInteracted: fieldHasInteracted.value['field_category'],
        allowParentSelection: allowParentCategorySelection.value,
        showDescriptions: true, // Enable category descriptions for form disabling functionality
        class: computed(() => {
            return activeField.value === 'category' ? 'ai-processing-field' : '';
        })
    },
    body: {
        label: t('form.body'),
        required: isDescriptionRequired.value,
        placeholder: t('form.body_ai_placeholder'),
        helpText: t('form.body_ai_description'),
        hasInteracted: fieldHasInteracted.value['body'],
        class: computed(() => {
            const classes = [];
            if (activeField.value === 'description') {
                classes.push('ai-processing-field', 'typing-cursor');
            }
            return classes.join(' ');
        })
    },
    field_request_media: {
        'uploadedMedia': uploadedMedia.value,
        'enable-a-i': isAIEnabled.value,
        'isRequired': isPhotoRequired.value,
        'hideRequiredLabeling': false,
        'disabled': formDisabled.value && disableMediaUpload.value,
        'hasInteracted': fieldHasInteracted.value['field_request_media'],
        'showAINotice': true, // Always show AI notice in PhotoReportForm
        'scrollContainer': scrollContainer.value, // Pass scroll container for modal scrolling
        // Event handlers for AI processing
        'onUpdate:media': handleMediaUpdate,
        'onFiles-selected': handleFilesSelected,
        'onLocation-detected': handleLocationDetected,
        // AI status props for MediaUploadField to display
        'isAIProcessing': isAIProcessing.value,
        'processingSteps': processingSteps.value,
        'privacyWarning': privacyWarning.value,
        'privacyBlockActive': privacyBlocked.value,
        'needsManualCategory': needsManualCategory.value,
        'onDismiss-privacy': safeDismissPrivacyWarning,
        'onReplace-media': handleReplaceMedia,
        'onRemove-media': handleClearMedia,
        'aiAnalysisFailed': aiAnalysisFailed.value
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
        hasInteracted: fieldHasInteracted.value['field_e_mail'],
        visible: showEmailField.value,
        required: isEmailRequired.value,
        categoryRequired: isEmailCategoryRequired.value,
        disabled: formDisabled.value
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

const emit = defineEmits<{
    'success': [response: any] // Make sure this is defined
    'close': []
    'bottom-focus': [] // Emit when bottom section (submit area) receives focus
    'pick-on-map': []
}>();

const props = defineProps<{
    mapCenter?: {
        lat: number
        lng: number
        address?: string
        addressObj?: Record<string, unknown>
    }
    autoTriggerGeolocation?: boolean
    savedState?: any
    hideSubmitButton?: boolean
    geolocatedCoords?: { lat: number, lng: number } | null
    context?: 'inline' | 'modal'
}>();

// Form refs
const scrollContainer = ref<HTMLElement | null>(null);
const errorContainer = ref<{ $el: HTMLElement } | null>(null);
const formElement = ref<HTMLFormElement | null>(null);
const requirementsIndicator = ref<{ scrollIntoView: () => void } | null>(null);

// Form state
const description = ref('');
const category = ref('');
const email = ref('');
const phone = ref('');
const name = ref('');
const prename = ref('');
const gdprAccepted = ref(false);
const formDisabled = ref(false);
const uploadedMedia = ref<Array<{ id: string, preview: string, response?: any, isUploading: boolean, error?: string, cachedId?: string, isOfflineCached?: boolean }>>([]);
const location = ref({ lat: '', lng: '', address: undefined, displayName: '' });
const selectedFacilityId = ref('');
// By default, disable media upload when the form is disabled, unless specified otherwise by the category
const disableMediaUpload = ref(true);

// Composables
const { categories, fetchCategories } = useCategories();
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

// Exclusive-hidden mode: locate-me click triggers a one-shot snap with toast
// feedback. In mixed mode (#361) we intentionally do NOT snap so free pins
// win — see `handleFacilityLocateMe` for the mixed-mode branch.
const facilityNearestSnapEnabled = computed(() => isExclusive.value && !showMapPicker.value);
const { processCoords: processFacilitySnapCoords } = useFacilityNearestSnap({
    geolocatedCoords: computed(() => props.geolocatedCoords ?? null),
    facilityModeEnabled: facilityNearestSnapEnabled,
    singularLabel,
    snapToNearestFacility
});

// Optional mode: every position change (map click, locate-me, search) silently
// re-evaluates the nearest facility. Tag auto-attaches in radius, auto-detaches
// out of radius — spatial consistency as UX invariant, no citizen action.
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
            // the facility quick-pick — same contract as a direct map click.
            // `silent` skips the map-pick deselect toast: this clear is a
            // direct consequence of the user tapping locate-me.
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
// Open311 service definition attributes (per-category extra fields)
const {
    attributeValues,
    visibleAttributes,
    hasAttributes,
    getAttributeErrors,
    getAttributesForSubmission
} = useServiceAttributes({ category, categories });

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

// AI analysis composable
const {
    isAIProcessing,
    aiAnalysisComplete,
    aiAnalysisFailed,
    aiSkippedBudget,
    activeField,
    processingSteps,
    privacyWarning,
    needsManualCategory,
    runAIAnalysis,
    resetAIState,
    dismissPrivacyWarning
} = useAIAnalysis({
    description,
    category,
    location,
    uploadedMedia,
    categories,
    onFieldValidation: (fieldName, isValid) => handleFieldValidation(fieldName, isValid),
    attributeValues,
    visibleAttributes
});

// #473: hard-block when an AI privacy warning is active and the tenant opted in.
// privacyWarning is only raised in the no-blur fallback (useAIAnalysis already
// gates on privacy_handled_by_blur), so no blur re-detection is needed here.
//
// Photo-flow-only by design: only this form runs vision analysis. ClassicReportForm
// mounts MediaUploadField with enableAI:false and never raises privacyWarning, so
// it cannot (and must not) trigger this block.
//
// Fail-open semantics: if AI analysis fails, times out, or is skipped (budget),
// privacyWarning stays null and the block never engages. This is intentional, the
// frontend block is a UX nudge, not the security boundary. The authoritative
// protection is the server-side unpublish gate (_markaspot_vision_publish_safe_media()),
// which depublishes privacy-flagged media regardless of what the frontend allows.
const privacyBlocked = computed(() =>
    privacyBlockEnabled.value && privacyWarning.value?.flag === true
);

// S2 (#473): dismissing the warning clears the block. When the tenant hard-blocks,
// suppress dismissal so a synthetic `dismiss-privacy` event cannot bypass the gate.
// The banner already hides the "continue" button in block mode; this closes the
// programmatic path too. Decision lives in canDismissPrivacyWarning (pure, tested).
const safeDismissPrivacyWarning = () => {
    if (canDismissPrivacyWarning(privacyBlockEnabled.value)) {
        dismissPrivacyWarning();
    }
};

// U4 (#473): clearing the photo is the second recovery path out of the block.
// Emptying uploadedMedia routes through handleMediaUpdate, which calls
// resetAIState() and so clears privacyWarning, lifting the block.
const handleClearMedia = () => {
    handleMediaUpdate([]);
};

// Computed properties
const submitButtonText = computed(() => {
    if (isSubmitting.value) return t('report.form.submit.submitting');
    if (isAIProcessing.value) return t('report.form.submit.processing');
    return t('report.form.submit.button');
});

// Function to check if a field exists in the API response
// This approach does not rely on a reactive getter and directly checks if the field exists
const fieldExistsInApi = (fieldName: string): boolean => {
    // Settings must exist and have fields
    if (!settings.value?.fields) return false;

    // Direct check if the field exists using Object.hasOwn (not prototype-based)
    const exists = Object.hasOwn(settings.value.fields, fieldName);
    return exists;
};

const resetForm = () => {
    description.value = '';
    uploadedMedia.value = [];
    category.value = '';
    facilityFormMode.setFacilityId('');
    email.value = '';
    gdprAccepted.value = false;
    location.value = { lat: '', lng: '', address: undefined, displayName: '' };

    // Reset all conditional fields to defaults
    resetConditionalFields();
    initializeSelection();
    // Reset user interaction and validation tracking
    resetAIState();
    resetValidationState();
    clearErrorState();
};

const handleMediaUpdate = async (media: Array<{ id: string, preview: string, response?: any, isUploading: boolean, error?: string, cachedId?: string, isOfflineCached?: boolean }>) => {
    const previousCount = uploadedMedia.value.length;
    uploadedMedia.value = media;

    // When all photos are deleted, reset AI-generated fields.
    if (media.length === 0) {
        resetAIState();
        description.value = '';
        category.value = '';
        return;
    }

    // When photos are removed (but some remain), reset AI and re-analyze.
    if (media.length < previousCount && previousCount > 0 && !media.some(m => m.isUploading)) {
        resetAIState();
        description.value = '';
        category.value = '';
        await runAIAnalysis();
        return;
    }
};

const handleFilesSelected = async (_count: number) => {
    // Reset AI completion flag so new uploads trigger re-analysis.
    if (aiAnalysisComplete.value) {
        aiAnalysisComplete.value = false;
    }
};

const handleReplaceMedia = () => {
    uploadedMedia.value = [];
    resetAIState();
    description.value = '';
    category.value = '';
};

const handleLocationDetected = (coords: { lat: number, lng: number }) => {
    // Only update location if it's not already set
    if (!location.value.lat || !location.value.lng) {
        location.value = {
            lat: coords.lat.toString(),
            lng: coords.lng.toString(),
            address: undefined,
            displayName: ''
        };

        // Trigger field validation and mark as interacted using nextTick
        nextTick(() => {
            handleFieldValidation('field_geolocation', true);
            fieldHasInteracted.value['field_geolocation'] = true;
        });
    }
};

onMounted(async () => {
    // Fetch form settings and categories
    await fetchSettings();
    await fetchCategories();

    // Initialize offline draft persistence (will restore draft if exists)
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

    // Restore saved state if available AND no draft was loaded.
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

    // If no media survived restoration (blob URLs expired, no Pinia backup),
    // clear AI-generated fields. A PhotoReport without photos has no valid
    // description/category since those come from AI analysis of the photo.
    const hasMedia = uploadedMedia.value.length > 0 ||
      (props.savedState?.uploadedMedia?.length > 0);
    if ((draftLoaded || props.savedState) && !hasMedia) {
        description.value = '';
        category.value = '';
        resetAIState();
    }

    // Always restore aiAnalysisComplete from savedState, even when the IndexedDB
    // draft was loaded (which skips restoreFormState). Without this, reopening
    // the modal re-triggers AI analysis on already-analyzed photos.
    if (draftLoaded && props.savedState?.aiAnalysisComplete) {
        aiAnalysisComplete.value = true;
    }

    // Then set location from mapCenter (will override saved location if provided)
    if (showMapPicker.value && props.mapCenter?.lat !== undefined && props.mapCenter?.lng !== undefined) {
        location.value = {
            lat: props.mapCenter.lat.toString(),
            lng: props.mapCenter.lng.toString(),
            address: props.mapCenter.addressObj || undefined,
            displayName: props.mapCenter.address || ''
        };
    }

    // Initialize validation states from API settings
    initializeValidationStates();
});

// Expose public API for parent components (dialogs/sheets/pages)

// Use the unified field requirements composable
const { isFieldRequired, isEmailRequiredForCategory } = useFieldRequirements();

// API-based required status with overrides for special cases
// Note: PhotoReportForm always requires photos, regardless of API settings
const isCategoryRequired = isFieldRequired('field_category', true);
const isDescriptionRequired = isFieldRequired('body', true);
const baseLocationRequired = isFieldRequired('field_geolocation', true);
// Required only when the map picker is actually rendered. In the
// hide-map-picker flavour of exclusive mode the facility select carries the
// required-ness via `facilityPickRequired` instead.
const isLocationRequired = computed(() => showMapPicker.value ? baseLocationRequired.value : false);
const isPhotoRequired = isFieldRequired('field_request_media', true);

// Check if email is required for the selected category
const isEmailRequired = computed(() => {
    // Get the category ID from the selected category
    const cat = categories.value.find(c => c.id === category.value);
    const categoryId = cat?.attributes?.drupal_internal__tid ?? null;

    // Get the email required categories from client config
    const emailRequiredCategories = (clientConfig.value?.features?.emailRequiredCategories || []) as number[];

    return isEmailRequiredForCategory(categoryId, emailRequiredCategories).value;
});

// Check if email is required specifically because of category (not Drupal API)
const isEmailCategoryRequired = computed(() => {
    const cat = categories.value.find(c => c.id === category.value);
    const categoryId = cat?.attributes?.drupal_internal__tid;
    if (typeof categoryId !== 'number') return false;
    const emailRequiredCategories = clientConfig.value?.features?.emailRequiredCategories || [];
    return emailRequiredCategories.includes(categoryId);
});

// Get the selected category name for displaying in alerts
const selectedCategoryName = computed(() => {
    if (!category.value) return '';
    const cat = categories.value.find(c => c.id === category.value);
    return cat?.attributes?.name || '';
});

// Form validation composable
const {
    fieldValidationStates,
    fieldHasInteracted,
    isLocationValid,
    showRequirements,
    highlightRequirements,
    canSubmit: baseCanSubmit,
    formRequirements,
    handleFieldValidation,
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
    isPhotoCategoryRequired: computed(() => false),
    isEmailRequired,
    isEmailCategoryRequired,
    isLocationRequired,
    isCategoryRequired,
    isDescriptionRequired,
    formDisabled,
    fieldExistsInApi,
    privacyBlocked,
    requirementsOrder: ['photo', 'category', 'location', 'description', 'email', 'privacy'],
    additionalInteractionFields: [facilityFieldName]
});

const facilityMapSelection = facilityFormMode.connectMapSelection({ fieldHasInteracted });

const canSubmit = computed(() => facilityFormMode.canSubmitWithFacility(baseCanSubmit.value));

// Disable the submit button (NOT canSubmit, which gates the sticky footer) while
// any media is still uploading, so a report cannot be submitted mid-upload (#14).
const isUploadingMedia = computed(() => uploadedMedia.value.some(m => m.isUploading));

const facilityError = facilityFormMode.getFacilityError(fieldHasInteracted);

// Use shared form state persistence composable
const { getFormState: getBaseFormState, restoreFormState: restoreBaseFormState, watchMapCenter } = useFormStatePersistence({
    description,
    category,
    email,
    phone,
    name,
    prename,
    facilityId: facilityFormMode.facilityId,
    gdprAccepted,
    uploadedMedia,
    location
});

// Offline draft persistence (IndexedDB)
const {
    initialize: initDraftPersistence,
    clearDraft,
    cacheMediaFile: _cacheMediaFile,
    hasUnsavedChanges: _hasUnsavedChanges,
    saveError: _draftSaveError
} = useFormDraftPersistence({
    description,
    category,
    email,
    phone,
    name,
    prename,
    facilityId: facilityFormMode.facilityId,
    gdprAccepted,
    uploadedMedia,
    location
});

// Build request data for PhotoReportForm
const buildRequestData = () => ({
    title: `Photo Report ${new Date().toISOString()}`,
    body: { value: description.value, format: 'plain_text' },
    field_e_mail: email.value,
    ...(showGdprField.value && { field_gdpr: gdprAccepted.value }),
    ...facilityFormMode.getSubmissionFields(),
    field_geolocation: {
        lat: parseFloat(location.value.lat),
        lng: parseFloat(location.value.lng)
    },
    field_category: category.value,
    field_request_media: submittableMediaIds(uploadedMedia.value),
    // Single-source rule: see app/utils/pickLocationAddress.ts. Exclusive
    // facility mode hands address authority to the facility; every other
    // mode keeps the citizen-picked pin's address.
    locationAddress: pickLocationAddress(
        isExclusive.value,
        selectedFacility.value,
        location.value.address
    ),
    ...(prename.value && { field_first_name: prename.value }),
    ...(name.value && { field_last_name: name.value }),
    ...(phone.value && { field_phone: phone.value }),
    // Conditional fields (only visible + populated, with boolean->0/1 conversion)
    ...getConditionalFieldsForSubmission(),
    // Service definition attributes (Open311 per-category extra fields)
    ...(() => {
        const attrs = getAttributesForSubmission();
        return Object.keys(attrs).length > 0 ? { attributes: attrs } : {};
    })()
});

// Extend validation errors with service definition attribute errors.
//
// S1 (#473): the privacy hard-block is enforced in three places by design,
// belt-and-suspenders so no single "simplification" can reopen the bypass:
//   1. submit button :disabled (blocks the mouse path)
//   2. canSubmit via useFormValidation's privacyBlocked input (gates the footer)
//   3. getValidationErrors below (blocks the keyboard/Enter native-submit path:
//      Enter in a text field fires @submit.prevent -> handleSubmit ->
//      getValidationErrors; without this entry that path would slip past 1+2)
// Do not collapse these into one check.
const getValidationErrors = () => {
    const errors = getBaseValidationErrors();
    const privacyError = privacyBlockValidationError(privacyBlocked.value, t('report.ai.privacy.required'));
    if (privacyError) errors.push(privacyError);
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
    isAIProcessing, getValidationErrors, showValidationFeedback,
    buildRequestData, errorContainer,
    onSuccess: (response: any) => {
        // Show info toast when AI analysis was skipped due to budget
        if (aiSkippedBudget.value) {
            const toast = useToast();
            toast.add({
                title: t('report.ai.budget_exhausted_title'),
                description: t('report.ai.budget_exhausted_submitted'),
                icon: 'i-heroicons-information-circle',
                color: 'info' as const,
                duration: 6000
            });
        }
        emit('success', response);
    },
    clearDraft
});

// Extend getFormState to include PhotoReport-specific fields + conditional fields
const getFormState = async () => {
    const baseState = await getBaseFormState();
    if (!baseState) return null;

    return {
        ...baseState,
        aiAnalysisComplete: aiAnalysisComplete.value,
        conditionalFields: getConditionalFieldsSnapshot()
    };
};

// Extend restoreFormState to restore PhotoReport-specific fields + conditional fields
const restoreFormState = (state: any) => {
    restoreBaseFormState(state);
    if (state?.aiAnalysisComplete !== undefined) {
        aiAnalysisComplete.value = state.aiAnalysisComplete;
    }
    if (state?.conditionalFields) {
        restoreConditionalFields(state.conditionalFields);
    }
};

// Now expose after computed deps are defined
defineExpose({
    handleSubmit,
    isSubmitting,
    isAIProcessing,
    canSubmit,
    formDisabled,
    resetForm,
    getFormState,
    showRequirements,
    highlightRequirements
});

// Setup mapCenter watcher. Enabled whenever the map picker is rendered —
// disabled mode, optional mode, and mixed mode (#361) all let the reporter
// move the pin around; exclusive-hidden is the only mode where the facility
// drives location.
watchMapCenter(computed(() => props.mapCenter), {
    enabled: showMapPicker
});

// Mixed mode (#361): a fresh map click / locate-me move means the reporter
// chose a different spot, so the previously-selected facility quick-pick is
// stale. Clearing here goes through `clearFacilitySelection`, which also
// burns the URL preselect so `?facility=<id>` doesn't snap back on the next
// dep-change pass.
watch(
    () => props.mapCenter && `${props.mapCenter.lat}:${props.mapCenter.lng}`,
    (fresh, stale) => {
        if (!isMixedMode.value) return;
        if (!fresh || fresh === stale) return;
        if (!selectedFacilityId.value) return;
        clearFacilitySelection();
    }
);

// Watch for media changes - only watch length and upload status, not deep changes
// This prevents infinite loops when nested properties change
watch(
    () => ({
        length: uploadedMedia.value.length,
        uploading: uploadedMedia.value.some(media => media.isUploading),
        hasErrors: uploadedMedia.value.some(media => media.error)
    }),
    async (newState, oldState) => {
        // Only trigger if the upload count changed or upload status changed
        const uploadCountChanged = oldState && newState.length !== oldState.length;
        const uploadStatusChanged = oldState && newState.uploading !== oldState.uploading;

        if ((uploadCountChanged || uploadStatusChanged) && !newState.uploading && !newState.hasErrors && newState.length > 0 && !isAIProcessing.value && !aiAnalysisComplete.value) {
            await runAIAnalysis();
        }
    }
);

// Handle focus on submit section (privacy notice + submit button)
function onSubmitSectionFocus() {
    emit('bottom-focus');
    // Scroll to requirements indicator if form is incomplete
    if (!canSubmit.value && requirementsIndicator.value) {
        requirementsIndicator.value.scrollIntoView();
    }
}
</script>

<style scoped>
.min-h-[100dvh] {
  min-height: 100dvh;
  min-height: 100vh; /* Fallback */
}

.max-h-[100dvh] {
  max-height: 100dvh;
  max-height: 100vh; /* Fallback */
}

/* Scroll container tuning for iOS Safari */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  /* Keep vertical scroll smooth and contained, but allow horizontal edge gesture */
  overscroll-behavior-y: contain;
  overscroll-behavior-x: auto;
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

/* Improve sticky positioning on iOS */
.sticky {
  position: -webkit-sticky;
  position: sticky;
}

/* Ensure proper button tap highlighting on mobile */
button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation; /* Prevent delay and allow only tap gestures */
}

/* Allow system back-swipe (edge gesture); avoid restricting horizontal pan on the whole form */
form,
.space-y-6,
.flex-1.overflow-y-auto {
  touch-action: auto;
  overscroll-behavior-x: auto;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* Ensure interactive elements work normally */
form input,
form textarea,
form select,
form button {
  touch-action: manipulation;
  -webkit-touch-callout: default;
  -webkit-user-select: auto;
  user-select: auto;
  pointer-events: auto;
}

/* Smooth transitions */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Enhanced category description styling when form is disabled */
:deep(.category-info-highlighted) {
  animation: info-box-pulse 4s infinite;
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

/* AI Processing animations */
.ai-processing-field {
  position: relative;
  overflow: hidden;
}

.ai-processing-field::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.2), transparent);
  animation: ai-processing-shine 2s infinite;
  z-index: 1;
}

@keyframes ai-processing-shine {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

/* Typewriter effect cursor */
.typing-cursor::after {
  content: '|';
  animation: blink 1s infinite;
  color: rgb(79, 70, 229);
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* Dark mode styling for category info is handled by the component itself */

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

/* Hide the red error notice in CategoryFieldWrapper since we use UAlert instead */
:deep(.category-field-wrapper .text-red-600) {
  display: none;
}

/* Make sure the CategoryDescription inside the highlighted area remains fully visible */
.category-info-highlighted :deep(*) {
  opacity: 1 !important;
  filter: none !important;
  pointer-events: auto !important;
}
</style>
