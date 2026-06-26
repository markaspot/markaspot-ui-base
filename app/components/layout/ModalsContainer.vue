<template>
  <div>
    <!-- Success Toast Overlay (stays mounted even when modal closes) -->
    <!-- z-[10001] ensures it's above map (z-0), bottom sheet (z-50), and other overlays -->
    <div
      v-if="showSuccess"
      class="fixed inset-0 z-[10001] flex items-start justify-center pt-safe pointer-events-none"
      style="padding-top: max(1rem, calc(1rem + env(safe-area-inset-top, 0px)))"
    >
      <div
        class="bg-[var(--ui-bg)] rounded-lg shadow-2xl p-6 space-y-4 mx-4 max-w-xl pointer-events-auto animate-slide-down"
        style="touch-action: manipulation;"
        @click.stop
        @touchstart.stop
        @touchmove.stop
        @touchend.stop
      >
        <div class="flex items-start gap-3">
          <UIcon
            :name="isQueuedSubmission ? 'i-heroicons-cloud-arrow-up' : 'i-heroicons-check-circle'"
            :class="isQueuedSubmission ? 'w-8 h-8 text-blue-500 flex-shrink-0' : 'w-8 h-8 text-green-500 flex-shrink-0'"
          />
          <div class="space-y-2">
            <h3 class="font-medium dark:text-neutral-100">
              {{ t('success.report_submitted') }}
            </h3>
            <p
              v-if="isQueuedSubmission"
              class="text-sm text-neutral-600 dark:text-neutral-300"
            >
              {{ t('offline.sync.offlineWarning') }}
            </p>
            <p
              v-else
              class="text-sm text-neutral-600 dark:text-neutral-300"
            >
              {{ t('success.moderation_notice') }}
              <span class="font-medium">{{ currentRequestId }}</span>
            </p>
            <div
              v-if="!isQueuedSubmission"
              class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300"
            >
              <UIcon
                name="i-heroicons-star"
                class="w-4 h-4 text-yellow-500"
              />
              <span>{{ t('success.auto_followed') }}</span>
            </div>
          </div>
        </div>

        <!-- Fun Fact Section (configurable via features.funFacts.enabled) -->
        <div
          v-if="showFunFacts"
          class="mt-4 p-4 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20 rounded-lg border border-primary-100 dark:border-primary-800"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-1">
              <UIcon
                name="i-heroicons-light-bulb"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {{ t('common.did_you_know') }}
              </h4>
              <p class="text-sm text-[var(--ui-text)] leading-relaxed">
                {{ currentFunFact }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
            @click="closeSuccess"
          >
            {{ t('common.close') }}
          </UButton>
          <UButton
            color="primary"
            style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
            @click="createNew"
          >
            {{ t('success.submit_another') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Report Detail Modal -->
    <ReportDetail
      v-if="selectedReport"
      :report="selectedReport"
      :map-instance="mapInstance"
      @close="$emit('closeReport')"
      @follow-changed="(reportId: string, isFollowing: boolean) => $emit('followChanged', reportId, isFollowing)"
    />

    <!-- Report Form Dialog (desktop modal only) -->
    <!-- Note: Not lazy-loaded to support offline form submission -->
    <ServiceRequestFormDialog
      v-if="showDialog && shouldUseDesktopModal()"
      ref="formDialogRef"
      :model-value="showDialog"
      :type="reportType"
      :map-center="mapCenter"
      :geolocated-coords="geolocatedCoords"
      @close="$emit('closeDialog')"
      @update:model-value="(val) => !val && $emit('closeDialog')"
      @success="handleSuccess"
    />

    <!-- Page Content Modal -->
    <PageContent
      v-if="selectedPage"
      :page="selectedPage"
      @close="$emit('closePage')"
    />

    <!-- Feedback Modal (Pro only) -->
    <ClientOnly v-if="FeedbackModal && showFeedbackModal && feedbackUuid">
      <component
        :is="FeedbackModal"
        :model-value="showFeedbackModal"
        :feedback-uuid="feedbackUuid"
        @close="$emit('closeFeedback', $event)"
        @update:model-value="(val: boolean) => !val && $emit('closeFeedback', { _closeAction: true })"
      />
    </ClientOnly>

    <!-- Contact Modal -->
    <ClientOnly v-if="featureContactForm">
      <ContactModal
        v-if="showContactModal"
        :model-value="showContactModal"
        @close="$emit('closeContact', $event)"
        @update:model-value="(val) => !val && $emit('closeContact', { _closeAction: true })"
      />
    </ClientOnly>

    <!-- Confirmation Modal -->
    <ClientOnly>
      <ConfirmationModal
        v-if="showConfirmationModal && confirmationUuid"
        :model-value="showConfirmationModal"
        :uuid="confirmationUuid"
        @update:model-value="(val) => !val && $emit('closeConfirmation', { _closeAction: true })"
        @close="$emit('closeConfirmation', $event)"
      />
    </ClientOnly>

    <!-- Service Provider Response Modal (Pro only) -->
    <ClientOnly v-if="ServiceProviderResponseModal && showServiceProviderModal && serviceProviderUuid">
      <component
        :is="ServiceProviderResponseModal"
        :model-value="showServiceProviderModal"
        :response-uuid="serviceProviderUuid"
        @close="$emit('closeServiceProvider', $event)"
        @update:model-value="(val: boolean) => !val && $emit('closeServiceProvider', { _closeAction: true })"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
/**
 * ModalsContainer Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useRouter } from '#app';
import { resolveComponent, shallowRef, onMounted, type Component } from 'vue';
import { useResponsive } from '@/composables/core/useResponsive';
import { useI18n } from 'vue-i18n';
import ReportDetail from '~/components/report/ReportDetail.vue';
import ConfirmationModal from '~/components/modals/ConfirmationModal.vue';

// Composables
const { autoFollowNewReport } = useFollows();
const serviceRequestStore = useServiceRequestStore();
const { clientConfig, jurisdiction: configJurisdiction } = useMarkASpotConfig();
const route = useRoute();
const failedEdit = useFailedSubmissionEdit();
const { proAvailable, feedbackEnabled, funFactsEnabled } = useFeatureFlags();

const showFunFacts = computed(() => funFactsEnabled.value);

// Form dialog ref
const formDialogRef = ref();

// Success overlay state
const showSuccess = ref(false);
const currentRequestId = ref('');
const reportAutoFollowed = ref(false);
const currentFunFact = ref('');
const isQueuedSubmission = ref(false);

// Pro modals are auto-imported when pro layer is active
// Use shallowRef + resolveComponent for runtime resolution
const FeedbackModal = shallowRef<Component | null>(null);
const ServiceProviderResponseModal = shallowRef<Component | null>(null);

// Lazy load contact modal
const ContactModal = defineAsyncComponent(() => import('~/components/modals/ContactModal.vue'));

onMounted(() => {
    if (proAvailable.value) {
        // Resolve FeedbackModal
        if (feedbackEnabled.value) {
            try {
                const resolved = resolveComponent('FeedbackModal');
                if (typeof resolved !== 'string') {
                    FeedbackModal.value = resolved;
                }
            } catch {
                // Component not available
            }
        }

        // Resolve ServiceProviderResponseModal
        try {
            const resolved = resolveComponent('ServiceProviderResponseModal');
            if (typeof resolved !== 'string') {
                ServiceProviderResponseModal.value = resolved;
            }
        } catch {
            // Component not available
        }
    }
});

interface Props {
    selectedReport: any | null
    selectedPage: any | null
    showDialog: boolean
    showFeedbackModal: boolean
    feedbackUuid: string | null
    showConfirmationModal: boolean
    confirmationUuid: string | null
    showServiceProviderModal: boolean
    serviceProviderUuid: string | null
    reportType: 'photo' | 'classic'
    mapCenter: { lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> } | null
    geolocatedCoords: { lat: number, lng: number } | null
    mapInstance: any
    showContactModal: boolean
    featureContactForm: boolean
}

const props = defineProps<Props>();

// Access i18n at the top level
const { t } = useI18n();
const router = useRouter();
const { shouldUseDesktopModal } = useResponsive();

// Jurisdiction-aware report path for navigation (preserves tenant slug)
const reportPath = computed(() => {
    const jur = route.params.jurisdiction || configJurisdiction.value?.slug;
    return jur ? `/${jur}/report` : '/report';
});

// Get a random fun fact from i18n translations
const getRandomFunFact = () => {
    const fallback = '🌱 Jede Meldung, die Sie einreichen, trägt dazu bei, Ihre Stadt lebenswerter zu machen!';
    try {
        const funFacts = t('success.fun_facts', [], { returnObjects: true } as any) as unknown as string[];
        if (!Array.isArray(funFacts) || funFacts.length === 0) {
            return fallback;
        }
        const randomIndex = Math.floor(Math.random() * funFacts.length);
        return funFacts[randomIndex] || fallback;
    } catch {
        return fallback;
    }
};

const emit = defineEmits<{
    closeReport: []
    closeDialog: []
    closePage: []
    closeFeedback: [data?: any]
    closeConfirmation: [data?: any]
    closeContact: [data?: any]
    closeServiceProvider: [data?: any]
    success: []
    createNew: []
    followChanged: [reportId: string, isFollowing: boolean]
}>();

// Success overlay methods
const handleSuccess = (data: any) => {
    // Check if this is a queued (offline) submission
    if (data?.queued === true) {
        isQueuedSubmission.value = true;
        currentRequestId.value = ''; // No request ID yet for queued items
        reportAutoFollowed.value = false; // Can't auto-follow queued items

        // Set a random fun fact
        currentFunFact.value = getRandomFunFact();

        showSuccess.value = true;

        // Close the dialog and emit success
        emit('closeDialog');
        emit('success');
        return;
    }

    // Regular (online) submission flow
    isQueuedSubmission.value = false;

    // Extract request ID from various formats
    const resource = data && typeof data === 'object'
        ? ('data' in data && data.data) || data
        : undefined;
    const attrs = resource?.attributes;

    if (attrs?.request_id) {
        currentRequestId.value = attrs.request_id;
    } else if (data.service_request_id) {
        currentRequestId.value = data.service_request_id;
    } else if (resource?.id) {
        currentRequestId.value = resource.id;
    } else if (data.id) {
        currentRequestId.value = data.id;
    } else {
        currentRequestId.value = 'N/A';
    }

    // Auto-follow the report
    if (resource) {
        const followed = autoFollowNewReport({ data: resource });
        reportAutoFollowed.value = followed.value;
    } else if (data) {
        // Fallback for non-JSON:API format
        const followed = autoFollowNewReport({ data });
        reportAutoFollowed.value = followed.value;
    }

    // Set a random fun fact
    currentFunFact.value = getRandomFunFact();

    showSuccess.value = true;

    // If this was editing a failed submission, complete the edit (removes old item)
    if (failedEdit.isEditing.value) {
        console.log('🎉 Completing failed submission edit');
        failedEdit.completeEdit();
    }

    // Close the dialog and emit success
    emit('closeDialog');
    emit('success');
};

const closeSuccess = () => {
    showSuccess.value = false;
    currentRequestId.value = '';
    reportAutoFollowed.value = false;
    isQueuedSubmission.value = false;
};

const createNew = () => {
    showSuccess.value = false;
    currentRequestId.value = '';
    reportAutoFollowed.value = false;
    isQueuedSubmission.value = false;

    // CRITICAL: Clear the form draft to ensure the form starts fresh
    serviceRequestStore.clearFormDraft();

    // Emit event to parent to reopen the dialog with the same type
    emit('createNew');
};

// On mobile, prefer route-based full-screen form so iOS back-swipe works
watch(() => props.showDialog, (open) => {
    if (!open) return;
    if (shouldUseDesktopModal()) return; // desktop uses modal as before
    const query: Record<string, any> = { type: props.reportType };
    if (props.mapCenter?.lat != null && props.mapCenter?.lng != null) {
        query.lat = props.mapCenter.lat;
        query.lng = props.mapCenter.lng;
        if (props.mapCenter.address) query.address = props.mapCenter.address;
    }
    router.push({ path: reportPath.value, query });
    // Inform parent to close dialog state
    emit('closeDialog');
});

// Save form draft to store (called before closing dialog for pick mode)
const saveFormDraft = async () => {
    console.log('💾 MODALS: saveFormDraft called');
    if (formDialogRef.value?.getFormState) {
        const draft = await formDialogRef.value.getFormState();
        console.log('💾 MODALS: Got draft, saving to store:', { hasDraft: !!draft, mediaLength: draft?.uploadedMedia?.length });
        serviceRequestStore.saveFormDraft(draft);
        console.log('💾 MODALS: Draft saved to store');
    }
};

// Expose methods for external access
defineExpose({
    handleSuccess,
    saveFormDraft
});
</script>
