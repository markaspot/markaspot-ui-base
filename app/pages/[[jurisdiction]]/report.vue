<script setup lang="ts">
import { computed, onMounted, ref, onErrorCaptured } from 'vue';
import { useRouter, useRoute, useRuntimeConfig } from '#app';
import { useI18n } from 'vue-i18n';
import { useResponsive } from '@/composables/core/useResponsive';
import { useFormFirstMode } from '@/composables/features/useFormFirstMode';
import PrivacyNotice from '@/components/form/PrivacyNotice.vue';
import CompetitionForm from '@/components/report/CompetitionForm.vue';

// Page meta - SSR handled by ClientOnly wrapper for viewport-dependent rendering
definePageMeta({});

const router = useRouter();
const route = useRoute();
const { jurisdiction } = useMarkASpotConfig();
// Jurisdiction-aware base path for navigation (preserves tenant slug)
// Fall back to config slug when URL has no jurisdiction (e.g. CivicSpot /report)
const basePath = computed(() => {
    const jur = route.params.jurisdiction || jurisdiction.value?.slug;
    return jur ? `/${jur}/` : '/';
});
const { t } = useI18n();
const { shouldUseDesktopModal } = useResponsive();
const { isFormFirstActive, setActiveTab } = useFormFirstMode();
const { photoReportAvailable } = useFeatureFlags();
const serviceRequestStore = useServiceRequestStore();
const failedEdit = useFailedSubmissionEdit();

// Form ref
const formRef = ref();
const pageEl = ref<HTMLElement | null>(null);

// Error state for catching async component loading failures (offline)
const formLoadError = ref(false);

// Patterns that indicate chunk/module loading failures (case-insensitive)
const CHUNK_ERROR_PATTERNS = [
    'dynamically imported module',
    'failed to fetch',
    'loading chunk',
    'loading css chunk'
] as const;

// Catch errors from child component loading (e.g., async chunks failing to load offline)
onErrorCaptured((err: unknown) => {
    const error = err as Error;
    const message = (error?.message ?? '').toLowerCase();

    // Check if this is a dynamic import/chunk loading error
    const isChunkError = CHUNK_ERROR_PATTERNS.some(pattern => message.includes(pattern));

    if (isChunkError) {
        console.warn('[Report] Form chunk loading failed (likely offline):', error?.message);
        formLoadError.value = true;
        return false; // Prevent error propagation
    }
    // Let other errors propagate normally
    return true;
});

// Competition state
const showCompetitionForm = ref(false);
const competitionRequestId = ref('');
const competitionRequestUuid = ref('');
const currentRequestId = ref('');

// Sticky footer visibility derived from child form readiness
const showStickyFooter = computed(() => {
    const fr: any = formRef.value;
    if (!fr) return false;
    const cs = fr.canSubmit;
    return cs === true || cs?.value === true;
});

// Form configuration from query params
const formType = computed(() => {
    const requested = (route.query.type as 'photo' | 'classic') || 'classic';
    return requested === 'photo' && !photoReportAvailable.value ? 'classic' : requested;
});
const mapCenter = computed(() => {
    if (route.query.lat && route.query.lng) {
        return {
            lat: parseFloat(route.query.lat as string),
            lng: parseFloat(route.query.lng as string),
            address: route.query.address as string
        };
    }
    return undefined;
});

// Handle form submission success
const handleSuccess = (data: any) => {
    // Clear draft immediately on success - no need to save it anymore
    serviceRequestStore.clearFormDraft();

    // If this was editing a failed submission, complete the edit (removes old item)
    if (failedEdit.isEditing.value) {
        console.log('🎉 Completing failed submission edit (mobile)');
        failedEdit.completeEdit();
    }

    // Extract request ID from various formats (same logic as desktop ModalsContainer)
    const resource = data && typeof data === 'object'
        ? ('data' in data && data.data) || data
        : undefined;
    const attrs = resource?.attributes;

    let requestId = 'N/A';
    if (attrs?.request_id) {
        requestId = attrs.request_id;
    } else if (data.service_request_id) {
        requestId = data.service_request_id;
    } else if (resource?.id) {
        requestId = resource.id;
    } else if (data.id) {
        requestId = data.id;
    }

    // Store request info for potential competition form
    currentRequestId.value = requestId;

    // Check if we should show competition form (same logic as desktop)
    const { clientConfig: reportClientConfig } = useMarkASpotConfig();
    const showCompetition = (reportClientConfig.value.features as any)?.competition?.enabled;
    const fieldAddData = data.field_add_data || attrs?.field_add_data;
    const userWantsCompetition = fieldAddData === true || fieldAddData === 1;
    const serviceUuid = data.service_request_uuid || attrs?.uuid || data.id;

    if (showCompetition && userWantsCompetition && serviceUuid) {
        // Show competition form instead of navigating immediately
        competitionRequestId.value = data.service_request_id || data.id || '';
        competitionRequestUuid.value = serviceUuid;
        showCompetitionForm.value = true;
    } else {
        // Navigate to success page with proper request ID
        router.push({
            path: basePath.value,
            query: {
                success: 'true',
                requestId: requestId,
                // Pass the full data structure for desktop-style success overlay
                successData: JSON.stringify(data)
            }
        });
    }
};

// Handle competition form success
const handleCompetitionSuccess = () => {
    showCompetitionForm.value = false;

    // Navigate to success page with proper request ID and auto-follow state
    router.push({
        path: basePath.value,
        query: {
            success: 'true',
            requestId: currentRequestId.value,
            // Pass competition completion data
            successData: JSON.stringify({
                type: 'node--service_request',
                id: competitionRequestUuid.value,
                attributes: {
                    request_id: currentRequestId.value,
                    competition_completed: true,
                    auto_followed: true
                }
            })
        }
    });
};

// Handle form close/cancel
const handleClose = async () => {
    console.log('📍 REPORT: handleClose called', { showCompetitionForm: showCompetitionForm.value });
    if (showCompetitionForm.value) {
        // Close competition form and show success
        handleCompetitionSuccess();
    } else {
        // Save form state before navigating away
        if (formRef.value?.getFormState) {
            const draft = await formRef.value.getFormState();
            serviceRequestStore.saveFormDraft(draft);
        }
        // Store current location in UI store for faster map restoration
        console.log('📍 REPORT: Checking mapCenter for storage', mapCenter.value);
        if (mapCenter.value?.lat != null && mapCenter.value?.lng != null) {
            const uiStore = useUIStore();
            console.log('📍 REPORT: Storing location before navigation');
            uiStore.setLastMapLocation({
                lat: mapCenter.value.lat,
                lng: mapCenter.value.lng,
                address: mapCenter.value.address
            });
        } else {
            console.log('📍 REPORT: No mapCenter to store');
        }

        // Navigate back to map (preserve jurisdiction context)
        console.log('📍 REPORT: Navigating to index');
        router.push(basePath.value);
    }
};

// Handle form submission
const handleFormSubmit = () => {
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

onMounted(() => {
    // If accessed from desktop, redirect to modal mode
    if (shouldUseDesktopModal()) {
        const query: Record<string, string> = { report: 'true' };

        // Preserve query parameters
        Object.entries(route.query).forEach(([key, value]) => {
            if (value) query[key] = value as string;
        });

        router.push({ path: basePath.value, query });
        return;
    }

    // If form-first mode is active on mobile, redirect to home page with form-first layout
    if (isFormFirstActive.value) {
        // Set the active tab based on URL type param
        const requestedTabType = (route.query.type as 'photo' | 'classic') || 'photo';
        const tabType = requestedTabType === 'photo' && !photoReportAvailable.value ? 'classic' : requestedTabType;
        setActiveTab(tabType);

        // Build query params for home page
        const query: Record<string, string> = { formFirst: tabType };

        // Preserve location params if present
        if (route.query.lat) query.lat = route.query.lat as string;
        if (route.query.lng) query.lng = route.query.lng as string;
        if (route.query.address) query.address = route.query.address as string;

        router.replace({ path: basePath.value, query });
    }
});

// Save form draft before leaving the page (for "Pick on map" navigation)
onBeforeRouteLeave(async (to, from, next) => {
    console.log('📍 ROUTE LEAVE: Navigation triggered', {
        to: to.path,
        from: from.path,
        showCompetitionForm: showCompetitionForm.value,
        hasFormRef: !!formRef.value,
        hasGetFormState: !!formRef.value?.getFormState
    });

    // Save form state synchronously only if going to home page for pick mode
    if ((to.path === basePath.value || to.path === '/') && formRef.value?.getFormState && !showCompetitionForm.value) {
        console.log('📍 ROUTE LEAVE: Saving draft synchronously before navigation');
        try {
            const draft = await formRef.value.getFormState();
            serviceRequestStore.saveFormDraft(draft);
            console.log('📍 ROUTE LEAVE: Draft saved successfully');
        } catch (error) {
            console.error('📍 ROUTE LEAVE: Error saving draft:', error);
        }

        // Store current location for faster map restoration (since handleClose won't be called)
        console.log('📍 ROUTE LEAVE: Checking mapCenter for storage', mapCenter.value);
        if (mapCenter.value?.lat != null && mapCenter.value?.lng != null) {
            const uiStore = useUIStore();
            console.log('📍 ROUTE LEAVE: Storing location before navigation');
            uiStore.setLastMapLocation({
                lat: mapCenter.value.lat,
                lng: mapCenter.value.lng,
                address: mapCenter.value.address
            });
        } else {
            console.log('📍 ROUTE LEAVE: No mapCenter to store');
        }
    }

    // Now allow navigation after state is saved
    next();
});

// Lightweight edge/back swipe for the full-screen route (mobile)
let tracking = false;
let startX = 0;
let startY = 0;
const EDGE = 40; // px from page's left edge
const START_ZONE = 96; // relaxed zone inside content
const TRIGGER = 56; // px to trigger back
const DIR_RATIO = 1.5; // must be mostly horizontal

const isFormControl = (el: EventTarget | null) => {
    if (!(el instanceof HTMLElement)) return false;
    return el.matches('input, textarea, select, [contenteditable="true"], .allow-text-selection *');
};

const onSwipeStart = (e: TouchEvent) => {
    if (shouldUseDesktopModal()) return; // desktop not handled here
    if (!e.touches || e.touches.length !== 1) return;
    if (isFormControl(e.target)) return; // don't hijack input gestures
    const t = e.touches[0];
    const left = pageEl.value?.getBoundingClientRect().left ?? 0;
    const relX = t.clientX - left;
    if (relX >= 0 && (relX <= EDGE || relX <= START_ZONE)) {
        tracking = true;
        startX = t.clientX;
        startY = t.clientY;
    }
};

const _onSwipeMove = (e: TouchEvent) => {
    if (!tracking) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = Math.abs(t.clientY - startY);
    if (dx > 0 && dx > DIR_RATIO * dy && dx >= TRIGGER) {
        if (e.cancelable) e.preventDefault();
        tracking = false;
        handleClose(); // navigate back
    }
};

const _onSwipeEnd = () => {
    tracking = false;
};
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)]">
    <ClientOnly>
      <!-- Mobile Full-Screen Form -->
      <FullScreenModal
        v-if="!shouldUseDesktopModal()"
        :model-value="true"
        :title="showCompetitionForm ? t('competition.title') : (formType === 'photo' ? t('report.title.photo') : t('report.title.classic'))"
        :is-dismissible="true"
        @close="handleClose"
      >
        <!-- Form Content -->
        <div class="h-full">
          <div
            class="flex-1 overflow-y-auto"
            style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;"
          >
            <div
              class="px-4 py-4 pb-24"
              style="-webkit-touch-callout: none;"
            >
              <!-- Offline Form Fallback - shown when form chunks fail to load -->
              <OfflineFormFallback
                v-if="formLoadError"
                @retry="formLoadError = false"
              />

              <!-- Competition Form -->
              <CompetitionForm
                v-else-if="showCompetitionForm"
                :service-request-id="competitionRequestId"
                :service-request-uuid="competitionRequestUuid"
                @success="handleCompetitionSuccess"
                @close="handleClose"
              />

              <!-- Main Report Forms -->
              <template v-else>
                <ClassicReportForm
                  v-if="formType === 'classic'"
                  ref="formRef"
                  :map-center="mapCenter"
                  :saved-state="serviceRequestStore.formDraft"
                  :auto-trigger-geolocation="true"
                  :hide-submit-button="true"
                  @success="handleSuccess"
                  @close="handleClose"
                />
                <PhotoReportForm
                  v-else-if="formType === 'photo'"
                  ref="formRef"
                  :map-center="mapCenter"
                  :saved-state="serviceRequestStore.formDraft"
                  :auto-trigger-geolocation="true"
                  :hide-submit-button="true"
                  @success="handleSuccess"
                  @close="handleClose"
                />

                <!-- Non-sticky actions while form not yet submittable -->
                <div
                  v-if="!showStickyFooter"
                  class="mt-6 space-y-3"
                >
                  <PrivacyNotice />
                  <!-- #477.1: the modal submit stays clickable under a privacy block so
                       the click -> scroll-to-requirements feedback (canSubmit) remains
                       discoverable; we surface the visible reason + aria-describedby for
                       parity with the in-form photo submit variant. -->
                  <p
                    v-if="formRef?.privacyBlocked"
                    id="report-privacy-block-reason-inline"
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
                    :loading="formRef?.isSubmitting || formRef?.isAIProcessing"
                    :disabled="formRef?.isSubmitting || formRef?.isAIProcessing || formRef?.formDisabled"
                    :aria-describedby="formRef?.privacyBlocked ? 'report-privacy-block-reason-inline' : undefined"
                    block
                    size="lg"
                    color="primary"
                    class="justify-center"
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
            </div>
          </div>
        </div>

        <!-- Footer -->
        <template #footer>
          <div
            v-show="showStickyFooter && !showCompetitionForm && !formLoadError"
            class="w-full px-4 py-2 space-y-3 pb-safe"
          >
            <!-- Privacy Notice -->
            <PrivacyNotice />

            <!-- #477.1: AT parity for the sticky footer submit (see inline block above). -->
            <p
              v-if="formRef?.privacyBlocked"
              id="report-privacy-block-reason-footer"
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

            <!-- Submit Button -->
            <UButton
              type="submit"
              :loading="formRef?.isSubmitting || formRef?.isAIProcessing"
              :disabled="formRef?.isSubmitting || formRef?.isAIProcessing || formRef?.formDisabled"
              :aria-describedby="formRef?.privacyBlocked ? 'report-privacy-block-reason-footer' : undefined"
              block
              size="lg"
              color="primary"
              class="justify-center"
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
      </FullScreenModal>

      <!-- Desktop Redirect Loading -->
      <AppLoadingState
        v-else
        :text="t('report.form.loading')"
        full-screen
      />

      <!-- Fallback while client-side JS loads -->
      <template #fallback>
        <AppLoadingState
          :text="t('report.form.loading')"
          full-screen
        />
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.swipe-surface {
  /* allow both pans so iOS edge/back is not blocked */
  touch-action: pan-x pan-y pinch-zoom;
  overscroll-behavior-x: auto;
}
</style>
