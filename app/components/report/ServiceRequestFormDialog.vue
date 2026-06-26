/**
 * ServiceRequestFormDialog
 *
 * A comprehensive dialog component for creating service requests with multiple form types
 * (photo and classic reporting). Handles success states, AI analysis, geolocation,
 * and provides proper accessibility and mobile responsiveness.
 */
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useNuxtApp, useRuntimeConfig } from '#app';
// Desktop-only; mobile uses route-based form in pages/report.vue

// Form Components
import PhotoReportForm from '@/components/report/PhotoReportForm.vue';
import ClassicReportForm from '@/components/report/ClassicReportForm.vue';
import CompetitionForm from '@/components/report/CompetitionForm.vue';
import PrivacyNotice from '@/components/form/PrivacyNotice.vue';
import ErrorBoundary from '@/components/core/ErrorBoundary.vue';
// Mobile drawer path removed; mobile uses pages/report.vue route

interface Props {
    /**
     * Whether the dialog is visible
     */
    modelValue: boolean
    /**
     * Type of form to show
     */
    type: 'photo' | 'classic'
    /**
     * Map center coordinates for initialization
     */
    mapCenter?: {
        lat?: number
        lng?: number
        address?: string
        addressObj?: Record<string, unknown>
    }
    /**
     * Geolocated coordinates from the map
     */
    geolocatedCoords?: {
        lat?: number
        lng?: number
        address?: string
    }
}

interface Emits {
    /**
     * Emitted when the dialog visibility changes
     */
    'update:modelValue': [value: boolean]
    /**
     * Emitted when the dialog is closed
     */
    'close': []
    /**
     * Emitted when user requests to create a new report
     */
    'create-new': []
    /**
     * Emitted when a report is successfully created
     */
    'success': [data: any]
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composables
const { t, te } = useI18n();
const toast = useToast();
const { $config } = useNuxtApp();
const runtimeConfig = useRuntimeConfig();
const { clientConfig } = useMarkASpotConfig();
const serviceRequestStore = useServiceRequestStore();
const { canSubmit } = useWorkspaceVisibility();
const { aiAnalysisEnabled, photoReportAvailable } = useFeatureFlags();

// Prevent dialog from opening if submissions are not allowed
watch(() => props.modelValue, (isOpen) => {
    if (isOpen && !canSubmit.value) {
        emit('update:modelValue', false);
    }
});

// Reactive state
const showSuccess = ref(false);
const showCompetitionForm = ref(false);
const shouldTriggerGeolocation = ref(false);
const shouldResetOnClose = ref(false);
const formRef = ref();
const formKey = ref(0); // Used to force form remount on reset

// Use saved draft from store
const savedFormState = computed(() => serviceRequestStore.formDraft);

// Success state data
const currentRequestId = ref<string>('');
const competitionRequestId = ref<string>('');
const competitionRequestUuid = ref<string>('');
const hasVisibilityLimitations = ref(true); // Assume limited visibility by default

// For auto-follow functionality
const reportAutoFollowed = ref(false);

// Computed properties
// Desktop-only component: mobile uses route-based form (pages/report.vue)

// Two-way model for Nuxt UI 3 (v-model:open) - only for desktop modal
const isOpen = computed({
    get: () => props.modelValue,
    set: (val: boolean) => {
        // When UModal dismisses itself (X button, overlay click, Escape),
        // reka-ui sets open=false which triggers this setter.
        // Save the form draft BEFORE propagating the close, because
        // the leave transition will destroy the form content.
        if (!val && props.modelValue) {
            saveFormDraftBeforeClose();
        }
        emit('update:modelValue', val);
    }
});

// Derived UI state: show sticky footer only when the child form explicitly reports canSubmit = true
const showStickyFooter = computed(() => {
    const fr: any = formRef.value;
    if (!fr) return false;
    // Support both exposed refs and plain booleans
    const cs = fr.canSubmit;
    return cs === true || cs?.value === true;
});

// Handle opening the form - responsive behavior
const openForm = () => {
    // Simply emit the modelValue change - the watch will handle the rest
    emit('update:modelValue', true);
};

const effectiveType = computed(() => props.type === 'photo' && !photoReportAvailable.value ? 'classic' : props.type);

const dialogTitle = computed(() => {
    if (showSuccess.value) {
        return t('success.report_submitted');
    }
    if (showCompetitionForm.value) {
        return t('competition.title');
    }
    return effectiveType.value === 'photo' ? t('report.title.photo') : t('report.title.classic');
});

// Accessible description with robust i18n fallback
const modalDescription = computed(() => {
    if (te('report.form.modal_description')) return t('report.form.modal_description');
    if (te('report.title.photo') && effectiveType.value === 'photo') return t('report.title.photo');
    if (te('report.title.classic') && effectiveType.value === 'classic') return t('report.title.classic');
    return 'Service request form dialog';
});

const formTitle = computed(() => effectiveType.value === 'photo' ? t('report.title.photo') : t('report.title.classic'));

// UModal handles desktop dialog rendering; mobile uses pages/report.vue

/**
 * Eagerly save the form draft while formRef is still alive.
 *
 * Called from the isOpen setter (before the leave transition destroys the
 * form content) and from handleClose (explicit programmatic close).
 *
 * getFormState() is async because it converts blob preview URLs to base64.
 * Blob URLs remain valid even after the component unmounts (they are not
 * revoked during media cleanup), so the async conversion
 * completes reliably even if Presence destroys the form mid-flight.
 */
// Monotonic counter to guard against stale async draft saves.
// If the user quickly closes and reopens the modal, an earlier save's
// blob-to-base64 conversion may resolve after a newer save has started.
// The counter ensures only the latest save writes to the store.
let activeSaveId = 0;

const saveFormDraftBeforeClose = () => {
    if (shouldResetOnClose.value) return;
    if (!formRef.value?.getFormState) return;

    const saveId = ++activeSaveId;

    // Capture the async promise. The form content still exists at this point,
    // but the leave transition will start on the next tick. The blob URLs
    // remain valid after unmount, so the base64 conversion will succeed.
    const savePromise = formRef.value.getFormState();
    savePromise.then((draft: any) => {
        // Only save if no newer save has been initiated
        if (!draft || saveId !== activeSaveId) return;

        const hasData = draft.description || draft.category ||
          draft.uploadedMedia?.length > 0 ||
          (draft.location?.lat && draft.location?.lng);

        serviceRequestStore.saveFormDraft(draft);

        if (hasData) {
            toast.add({
                title: t('report.form.draft_saved'),
                icon: 'i-heroicons-bookmark',
                color: 'neutral' as const,
                duration: 2000
            });
        }
    }).catch((err: any) => {
        console.warn('Failed to save form draft on close:', err);
    });
};

const handleClose = () => {
    // Draft is saved by the isOpen setter when it transitions to false.
    if (shouldResetOnClose.value) {
        resetForm();
    }

    emit('update:modelValue', false);
};

const handleSuccess = (data: any) => {
    console.log('🎉 ServiceRequestFormDialog handleSuccess called with:', data);
    console.log('Full data object:', JSON.stringify(data, null, 2));

    // Handle both old format and new JSON:API format
    const resource = data && typeof data === 'object'
        ? ('data' in data && data.data) || data
        : undefined;
    const attrs = resource?.attributes;

    console.log('Parsed resource:', resource);
    console.log('Parsed attributes:', attrs);

    // Set request ID - try multiple formats
    if (attrs?.request_id) {
        // JSON:API format with request_id
        currentRequestId.value = attrs.request_id;
    } else if (data.service_request_id) {
        // Legacy format
        currentRequestId.value = data.service_request_id;
    } else if (resource?.id) {
        currentRequestId.value = resource.id;
    } else if (data.id) {
        currentRequestId.value = data.id;
    } else {
        currentRequestId.value = 'N/A';
    }

    // Set visibility limitations
    hasVisibilityLimitations.value = data.has_visibility_limitations || attrs?.has_visibility_limitations || false;

    // Auto-follow the report (simplified for now)
    reportAutoFollowed.value = true;

    // Check if we should show competition form
    const showCompetition = (clientConfig.value.features as any)?.competition?.enabled;
    const fieldAddData = data.field_add_data || attrs?.field_add_data;
    const userWantsCompetition = fieldAddData === true || fieldAddData === 1;
    const serviceUuid = data.service_request_uuid || attrs?.uuid || data.id;

    console.log('Competition check:', {
        showCompetition,
        fieldAddData,
        userWantsCompetition,
        serviceUuid,
        hasUuid: !!serviceUuid
    });

    if (showCompetition && userWantsCompetition && serviceUuid) {
        competitionRequestId.value = data.service_request_id || data.id || '';
        competitionRequestUuid.value = serviceUuid;
        showCompetitionForm.value = true;
        showSuccess.value = false; // Ensure success state is off
        console.log('Showing competition form - showCompetitionForm:', showCompetitionForm.value, 'showSuccess:', showSuccess.value);
        // Don't emit success to parent - we're showing competition form instead
    } else {
        console.log('Setting showSuccess to true, currentRequestId:', currentRequestId.value);

        // Clear draft immediately on success - no need to save it anymore
        serviceRequestStore.clearFormDraft();

        showSuccess.value = true;
        showCompetitionForm.value = false; // Ensure competition form is off
        console.log('showSuccess.value is now:', showSuccess.value);

        // Mark form for reset after successful submission
        shouldResetOnClose.value = true;

        emit('success', data);
    }
};

const handleCompetitionSuccess = () => {
    showCompetitionForm.value = false;
    showSuccess.value = true;

    // Mark form for reset after successful submission
    shouldResetOnClose.value = true;

    // Now emit success to parent since competition is complete
    // Use the same format as the original service request data but mark it as competition completed
    emit('success', {
        type: 'node--service_request',
        id: competitionRequestUuid.value,
        attributes: {
            request_id: currentRequestId.value,
            competition_completed: true,
            // Include the auto-follow state so it gets added to followed reports
            auto_followed: reportAutoFollowed.value,
            has_visibility_limitations: hasVisibilityLimitations.value
        }
    });
};

const resetForm = async () => {
    console.log('🔄 ServiceRequestFormDialog resetForm called');

    // CRITICAL: Clear saved draft FIRST before hiding success (which remounts form)
    serviceRequestStore.clearFormDraft();

    showSuccess.value = false;
    showCompetitionForm.value = false;
    currentRequestId.value = '';
    competitionRequestId.value = '';
    competitionRequestUuid.value = '';
    hasVisibilityLimitations.value = false;

    // Force complete form remount via key change to ensure pristine state.
    // This is more reliable than manually resetting 20+ form fields and nested states.
    // Vue efficiently handles the remount with minimal performance impact.
    // Only increment when we're resetting after a successful submission
    if (shouldResetOnClose.value) {
        formKey.value++;
        shouldResetOnClose.value = false;
    }

    // Wait for form to be remounted before calling its reset method
    await nextTick();

    console.log('🔍 formRef.value exists?', !!formRef.value);
    console.log('🔍 formRef.value.resetForm exists?', !!formRef.value?.resetForm);

    if (formRef.value?.resetForm) {
        console.log('✅ Calling formRef.value.resetForm()');
        formRef.value.resetForm();
    } else {
        console.warn('❌ formRef.value.resetForm not available');
    }

    emit('create-new');
};

const handleFormSubmit = () => {
    // Guard against race condition - prevent multiple submissions
    if (formRef.value?.isSubmitting || formRef.value?.loading) {
        return;
    }

    // If form can't submit, scroll to requirements and highlight
    if (formRef.value && !formRef.value.canSubmit) {
        scrollToRequirementsWithHighlight();
        // Still call handleSubmit to trigger field validation/interaction marking
        if (formRef.value?.handleSubmit) {
            formRef.value.handleSubmit();
        }
        return;
    }
    // Delegate to form component's submit method
    if (formRef.value?.handleSubmit) {
        formRef.value.handleSubmit();
    }
};

// Submit button text - shows different text for AI processing vs actual submission
const submitButtonText = computed(() => {
    if (formRef.value?.isSubmitting) return t('report.form.submit.submitting');
    if (formRef.value?.isAIProcessing) return t('report.form.submit.processing');
    return t('report.form.submit.button');
});

// Scroll to requirements and highlight when form is invalid
const scrollToRequirementsWithHighlight = () => {
    // Set state on the form component to show and highlight requirements indicator
    if (formRef.value) {
        formRef.value.showRequirements = true;
        formRef.value.highlightRequirements = true;
        // Reset highlight after animation completes
        setTimeout(() => {
            if (formRef.value) {
                formRef.value.highlightRequirements = false;
            }
        }, 1500);
    }

    // Scroll to requirements indicator
    const reqIndicator = document.querySelector('.requirements-indicator');
    if (reqIndicator) {
        reqIndicator.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
};

// Handle focus on submit section - scroll to requirements if form is incomplete
const handleSubmitSectionFocus = () => {
    if (formRef.value && !formRef.value.canSubmit) {
        scrollToRequirementsWithHighlight();
    }
};

const handleModalOpen = () => {
    // Modal opened - reset the shouldResetOnClose flag
    // This ensures form data persists when reopening (e.g., after refining location)
    // Form will only reset after successful submission (when shouldResetOnClose is set to true)
    shouldResetOnClose.value = false;
};

// Beforeunload guard: show browser-native "Leave site?" warning when
// the form has data worth protecting. Pinia store doesn't survive page
// reload, so this is the last line of defense against accidental data loss.
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    const fr: any = formRef.value;
    if (!fr) return;
    // canSubmit indicates the form has enough data to be submittable,
    // but even partial data (description, category) is worth protecting.
    const cs = fr.canSubmit;
    const hasFormData = cs === true || cs?.value === true;
    if (hasFormData) {
        e.preventDefault();
    }
};

// Handle modal open/close events
const handleModalOpenEvent = () => {
    handleModalOpen();
    // Trigger geolocation after a short delay when dialog becomes visible
    shouldTriggerGeolocation.value = true;
    // Guard against accidental page close while form has data
    if (import.meta.client) {
        window.addEventListener('beforeunload', handleBeforeUnload);
    }
    // Ensure background is non-focusable while modal is open
    if (import.meta.client) {
        const nuxtRoot = document.getElementById('__nuxt');
        if (nuxtRoot) {
            nuxtRoot.setAttribute('inert', '');
            // Remove aria-hidden if a modal library applied it; rely on inert instead
            if (nuxtRoot.hasAttribute('aria-hidden')) {
                nuxtRoot.removeAttribute('aria-hidden');
            }

            // Set up a MutationObserver to prevent aria-hidden being re-applied
            try {
                const observer = new MutationObserver((records) => {
                    for (const record of records) {
                        const target = record.target as HTMLElement;
                        if (target === nuxtRoot && target.getAttribute('aria-hidden') === 'true') {
                            target.removeAttribute('aria-hidden');
                            // Ensure inert stays on while modal open
                            if (!target.hasAttribute('inert')) target.setAttribute('inert', '');
                        }
                    }
                });
                observer.observe(nuxtRoot, { attributes: true, attributeFilter: ['aria-hidden'] });
                (window as any).__masModalObserver = observer;
            } catch {
                // noop
            }
        }
    }

    // Ensure the actual dialog element has aria-modal
    if (import.meta.client) {
        // Use a short timeout to run after paint without tying work to rAF
        setTimeout(() => {
            const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')) as HTMLElement[];
            const dialog = dialogs[dialogs.length - 1];
            if (dialog) {
                dialog.setAttribute('aria-modal', 'true');
            }
        }, 0);
    }
};

/**
 * Called after the UModal leave transition completes and content is destroyed.
 *
 * At this point, formRef is null. Draft saving already happened eagerly
 * in saveFormDraftBeforeClose (triggered from isOpen setter or handleClose).
 * This handler performs post-close cleanup only.
 */
const handleModalAfterLeave = () => {
    // Remove beforeunload guard
    if (import.meta.client) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    // Reset state after successful submission. Form content is already
    // destroyed by the leave transition, so we inline the cleanup
    // instead of calling resetForm() (which would warn about null formRef).
    if (shouldResetOnClose.value) {
        serviceRequestStore.clearFormDraft();
        showSuccess.value = false;
        showCompetitionForm.value = false;
        currentRequestId.value = '';
        competitionRequestId.value = '';
        competitionRequestUuid.value = '';
        hasVisibilityLimitations.value = false;
        formKey.value++;
        shouldResetOnClose.value = false;
    }

    // Turn off geolocation trigger
    shouldTriggerGeolocation.value = false;

    // Emit close for side-effects
    emit('close');

    // Restore background interactivity
    if (import.meta.client) {
        const nuxtRoot = document.getElementById('__nuxt');
        if (nuxtRoot) {
            nuxtRoot.removeAttribute('inert');
            if (nuxtRoot.hasAttribute('aria-hidden')) {
                nuxtRoot.removeAttribute('aria-hidden');
            }
        }
        const obs = (window as any).__masModalObserver as MutationObserver | undefined;
        if (obs) {
            obs.disconnect();
            (window as any).__masModalObserver = undefined;
        }
    }
};

// Watch for modelValue changes to handle geolocation trigger (mobile + desktop)
watch(() => props.modelValue, (newValue, oldValue) => {
    if (newValue && !oldValue) {
        // When opening, trigger geolocation on next paint
        nextTick(() => {
            shouldTriggerGeolocation.value = true;
        });
    } else if (!newValue && oldValue) {
        // When closing, turn off geolocation trigger
        shouldTriggerGeolocation.value = false;
    }
}, { immediate: false });

// Initialize geolocation trigger when dialog becomes visible
onMounted(() => {
    if (props.modelValue) {
        shouldTriggerGeolocation.value = true;
        // If dialog starts open on desktop, ensure background is inert
        if (import.meta.client) {
            const nuxtRoot = document.getElementById('__nuxt');
            if (nuxtRoot) {
                nuxtRoot.setAttribute('inert', '');
                if (nuxtRoot.hasAttribute('aria-hidden')) {
                    nuxtRoot.removeAttribute('aria-hidden');
                }
                // Ensure observer is running in this case too
                try {
                    const observer = new MutationObserver((records) => {
                        for (const record of records) {
                            const target = record.target as HTMLElement;
                            if (target === nuxtRoot && target.getAttribute('aria-hidden') === 'true') {
                                target.removeAttribute('aria-hidden');
                                if (!target.hasAttribute('inert')) target.setAttribute('inert', '');
                            }
                        }
                    });
                    observer.observe(nuxtRoot, { attributes: true, attributeFilter: ['aria-hidden'] });
                    (window as any).__masModalObserver = observer;
                } catch {
                    // noop
                }
            }
        }
    }
});

onUnmounted(() => {
    // Remove beforeunload guard
    if (import.meta.client) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
    // Safety: remove inert if still present
    if (import.meta.client) {
        const nuxtRoot = document.getElementById('__nuxt');
        if (nuxtRoot) {
            nuxtRoot.removeAttribute('inert');
            if (nuxtRoot.hasAttribute('aria-hidden')) {
                nuxtRoot.removeAttribute('aria-hidden');
            }
        }
        const obs = (window as any).__masModalObserver as MutationObserver | undefined;
        if (obs) {
            obs.disconnect();
            (window as any).__masModalObserver = undefined;
        }
    }
});

// Get form state (delegate to child form) - async because media needs to be converted
const getFormState = async () => {
    if (formRef.value?.getFormState) {
        return await formRef.value.getFormState();
    }
    return null;
};

// Modal body ref for scroll management
const modalBodyRef = ref<HTMLElement | null>(null);

// Reset scroll position when competition form is shown
watch(showCompetitionForm, (isShowing) => {
    if (isShowing) {
        nextTick(() => {
            // Scroll the modal body to top when competition form appears
            if (modalBodyRef.value) {
                modalBodyRef.value.scrollTop = 0;
            }
        });
    }
});

// Expose methods for external access
defineExpose({
    openForm,
    getFormState
});
</script>

<template>
  <div>
    <!-- Trigger slot for manual activation -->
    <slot @click="openForm" />

    <!-- Desktop Modal Mode -->
    <Teleport to="body">
      <UModal
        v-model:open="isOpen"
        :title="dialogTitle"
        :close="true"
        aria-modal="true"
        :ui="{
          content: 'z-[70] pt-safe pb-safe',
          overlay: 'fixed inset-0',
        }"
        @after:enter="handleModalOpenEvent"
        @after:leave="handleModalAfterLeave"
      >
        <template #description>
          <p class="sr-only">
            {{ modalDescription }}
          </p>
        </template>

        <template #body>
          <div
            ref="modalBodyRef"
            class="p-6 pt-2"
          >
            <!-- AI Badge for photo reports -->
            <div
              v-if="effectiveType === 'photo' && aiAnalysisEnabled"
              class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-4"
            >
              <div class="w-2 h-2 rounded-full bg-primary-500" />
              <span>{{ t('report.ai.powered') }}</span>
            </div>

            <!-- Success State -->
            <div
              v-if="showSuccess"
              class="space-y-4"
            >
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-heroicons-check-circle"
                  class="w-8 h-8 text-green-500 flex-shrink-0"
                />
                <div class="space-y-2">
                  <h3 class="font-medium">
                    {{ t('success.report_submitted') }}
                  </h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-300">
                    {{ t('success.moderation_notice') }}
                    <span class="font-medium">{{ currentRequestId }}</span>
                  </p>
                  <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <UIcon
                      name="i-heroicons-star"
                      class="w-4 h-4 text-yellow-500"
                      aria-hidden="true"
                    />
                    <span>{{ t('success.auto_followed') }}</span>
                  </div>
                  <div
                    v-if="hasVisibilityLimitations"
                    class="flex items-start gap-2 mt-2 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                  >
                    <UIcon
                      name="i-heroicons-information-circle"
                      class="w-5 h-5 text-primary-500 flex-shrink-0"
                    />
                    <p class="text-sm">
                      {{ t('success.visibility_limitation_notice') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Competition Form -->
            <div v-else-if="showCompetitionForm">
              <CompetitionForm
                :service-request-id="competitionRequestId"
                :service-request-uuid="competitionRequestUuid"
                @success="handleCompetitionSuccess"
                @close="handleClose"
              />
            </div>

            <!-- Main Form Content -->
            <div v-else>
              <ErrorBoundary
                :fallback-message="t('error.form_error_fallback', 'An error occurred while loading the form. Please try again.')"
                @error="(err) => console.error('Form error caught by boundary:', err)"
              >
                <ClassicReportForm
                  v-if="effectiveType === 'classic'"
                  :key="`classic-${formKey}`"
                  ref="formRef"
                  :map-center="{
                    lat: props.mapCenter?.lat,
                    lng: props.mapCenter?.lng,
                    address: props.mapCenter?.address,
                    addressObj: props.mapCenter?.addressObj,
                  }"
                  :geolocated-coords="props.geolocatedCoords"
                  :saved-state="savedFormState"
                  :auto-trigger-geolocation="shouldTriggerGeolocation"
                  :hide-submit-button="true"
                  context="modal"
                  @success="handleSuccess"
                  @close="handleClose"
                />
                <PhotoReportForm
                  v-else-if="effectiveType === 'photo' && photoReportAvailable"
                  :key="`photo-${formKey}`"
                  ref="formRef"
                  :map-center="{
                    lat: props.mapCenter?.lat,
                    lng: props.mapCenter?.lng,
                    address: props.mapCenter?.address,
                    addressObj: props.mapCenter?.addressObj,
                  }"
                  :geolocated-coords="props.geolocatedCoords"
                  :saved-state="savedFormState"
                  :auto-trigger-geolocation="shouldTriggerGeolocation"
                  :hide-submit-button="true"
                  context="modal"
                  @success="handleSuccess"
                  @close="handleClose"
                />
              </ErrorBoundary>

              <!-- Non-sticky actions when form is disabled: placed inside scrollable body -->
              <div
                v-if="!showStickyFooter && !showCompetitionForm"
                class="mt-6 space-y-4"
              >
                <PrivacyNotice />
                <UButton
                  type="submit"
                  :loading="formRef?.isSubmitting || formRef?.isAIProcessing"
                  :disabled="formRef?.isSubmitting || formRef?.isAIProcessing || formRef?.formDisabled"
                  block
                  size="lg"
                  color="primary"
                  @click="handleFormSubmit"
                >
                  <template #leading>
                    <AppSpinner
                      v-if="formRef?.isSubmitting || formRef?.isAIProcessing"
                      size="md"
                    />
                  </template>
                  {{ submitButtonText }}
                </UButton>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div
            v-if="showSuccess"
            class="flex gap-3 justify-end"
          >
            <UButton
              variant="outline"
              @click="handleClose"
            >
              {{ t('common.close') }}
            </UButton>
            <UButton
              color="primary"
              @click="resetForm"
            >
              {{ t('success.submit_another') }}
            </UButton>
          </div>

          <!-- Sticky footer actions only when form is enabled (not disabled) -->
          <div
            v-else
            v-show="!showCompetitionForm && showStickyFooter"
            class="w-full space-y-4"
            @focusin="handleSubmitSectionFocus"
          >
            <PrivacyNotice />
            <UButton
              type="submit"
              :loading="formRef?.isSubmitting || formRef?.isAIProcessing"
              :disabled="formRef?.isSubmitting || formRef?.isAIProcessing || formRef?.formDisabled"
              block
              size="lg"
              color="primary"
              @click="handleFormSubmit"
            >
              <template #leading>
                <AppSpinner
                  v-if="formRef?.isSubmitting || formRef?.isAIProcessing"
                  size="md"
                />
              </template>
              {{ submitButtonText }}
            </UButton>
          </div>
        </template>
      </UModal>
    </Teleport>
  </div>
</template>
