/**
 * Composable for form submission handling.
 *
 * Handles: building request data, online/offline submission,
 * duplicate acknowledgment resubmit, and error handling.
 */

import type { Ref, ComputedRef } from 'vue';

import { facilityAddressToDrupal } from '@/utils/mapAddressToDrupal';

interface MediaItem {
    id: string
    isUploading: boolean
    cachedId?: string
    isOfflineCached?: boolean
    error?: string | { key: string, params?: Record<string, any> }
    [key: string]: any
}

interface LocationValue {
    lat: string
    lng: string
    address: any
    displayName: string
}

interface UseFormSubmissionOptions {
    // Form field refs (needed for offline queue formData)
    description: Ref<string>
    category: Ref<string>
    email: Ref<string>
    phone: Ref<string>
    name: Ref<string>
    prename: Ref<string>
    gdprAccepted: Ref<boolean>
    uploadedMedia: Ref<MediaItem[]>
    location: Ref<LocationValue>
    selectedFacilityId?: Ref<string> | ComputedRef<string>

    // Validation
    isAIProcessing?: Readonly<Ref<boolean>>
    getValidationErrors: () => Array<{ status: string, title: string, detail: string }>
    showValidationFeedback: () => void

    // Request data builder (provided by each form)
    buildRequestData: () => Record<string, any>

    // Error handling
    errorContainer: Ref<{ $el: HTMLElement } | HTMLElement | null>

    // Callbacks
    onSuccess: (response: any) => void
    clearDraft: () => Promise<void>
}

export function useFormSubmission(options: UseFormSubmissionOptions) {
    const { t } = useI18n();
    const { createServiceRequest, duplicateHintState, clearDuplicateHint } = useServiceRequest();
    const { isOnline } = useOnlineStatus();
    const { offlineEnabled } = useFeatureFlags();
    const { enqueue: enqueueOffline } = useOfflineQueue();
    const { jurisdiction, currentJurisdictionId } = useMarkASpotConfig();
    const { public: { fastmap: isFastmap } } = useRuntimeConfig();
    const { errorState, processApiErrors, clearErrors: clearErrorState } = useErrorHandler();
    const { confirmDemoSubmission } = useDemoMode();

    const {
        description, category, email, phone, name, prename,
        gdprAccepted, uploadedMedia, location, selectedFacilityId,
        isAIProcessing, getValidationErrors, showValidationFeedback,
        buildRequestData, errorContainer, onSuccess, clearDraft
    } = options;

    const isSubmitting = ref(false);
    const successMessage = ref('');
    const lastRequestData = ref<Record<string, any> | null>(null);

    const createDemoModeCancelledError = () => {
        const cancelled = new Error('demo_mode_cancelled');
        (cancelled as Error & { code?: string }).code = 'DEMO_MODE_CANCELLED';
        return cancelled;
    };

    const scrollToError = () => {
        nextTick(() => {
            const el = errorContainer.value;
            if (!el) return;
            // Support both Vue component refs ({ $el }) and plain HTMLElement refs
            const domEl = '$el' in el ? el.$el : el;
            domEl?.scrollIntoView?.({
                behavior: 'smooth',
                block: 'start'
            });
        });
    };

    /** Submit the form offline by queuing for later sync */
    const submitOffline = async (requestData: Record<string, any>, options?: { demoConfirmed?: boolean }) => {
        const cachedMediaIds = uploadedMedia.value
            .filter(m => m.cachedId)
            .map(m => m.cachedId as string);
        const offlineJurisdictionId = isFastmap ? currentJurisdictionId.value : jurisdiction.value?.id;
        const normalizedJurisdictionId = typeof offlineJurisdictionId === 'number'
            ? offlineJurisdictionId
            : Number.parseInt(String(offlineJurisdictionId ?? ''), 10);

        const formData = {
            description: description.value,
            category_id: category.value,
            email: email.value,
            first_name: prename.value,
            last_name: name.value,
            phone: phone.value,
            gdpr_accepted: gdprAccepted.value,
            facility_id: selectedFacilityId?.value || undefined,
            location: location.value.lat
                ? {
                    lat: location.value.lat,
                    lng: location.value.lng,
                    address: location.value.address,
                    address_string: location.value.displayName
                }
                : undefined,
            media_ids: cachedMediaIds
        };

        // Normalise legacy string locationAddress (tenants that saved facility
        // addresses before structured FacilityAddress landed) into the structured
        // shape the offline DB schema expects. Mirrors the online path in
        // useServiceRequest.ts which routes strings through facilityAddressToDrupal,
        // so reports queued offline ship the same field_address as reports
        // submitted online — instead of silently dropping the address only when
        // offline.
        const locAddr = requestData.locationAddress;
        let fieldAddress;
        if (typeof locAddr === 'string') {
            fieldAddress = facilityAddressToDrupal(locAddr);
        } else if (locAddr && typeof locAddr === 'object') {
            fieldAddress = locAddr;
        }

        const queuedId = await enqueueOffline(
            {
                title: requestData.title,
                body: requestData.body,
                field_e_mail: requestData.field_e_mail,
                ...(requestData.field_gdpr != null && { field_gdpr: requestData.field_gdpr }),
                field_geolocation: requestData.field_geolocation,
                field_category: requestData.field_category,
                ...(requestData.field_facility && { field_facility: requestData.field_facility }),
                ...(fieldAddress && { field_address: fieldAddress }),
                field_first_name: requestData.field_first_name,
                field_last_name: requestData.field_last_name,
                field_phone: requestData.field_phone
            },
            cachedMediaIds,
            Number.isFinite(normalizedJurisdictionId) ? normalizedJurisdictionId : undefined,
            formData,
            { demoConfirmed: options?.demoConfirmed === true }
        );

        if (queuedId) {
            successMessage.value = t('success.report_submitted');
            lastRequestData.value = null;
            await clearDraft();
            onSuccess({ queued: true, queuedId });
        } else {
            throw new Error(t('offline.sync.queueFailed'));
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting.value || isAIProcessing?.value) return;

        try {
            const validationErrors = getValidationErrors();
            if (validationErrors.length > 0) {
                showValidationFeedback();
                return;
            }

            isSubmitting.value = true;
            clearErrorState();
            clearDuplicateHint();
            successMessage.value = '';

            const requestData = buildRequestData();
            lastRequestData.value = requestData;

            if (!isOnline.value && offlineEnabled.value) {
                const proceed = await confirmDemoSubmission();
                if (!proceed) throw createDemoModeCancelledError();
                await submitOffline(requestData, { demoConfirmed: true });
                return;
            }

            const response = await createServiceRequest(requestData as any);
            successMessage.value = t('success.report_submitted');
            lastRequestData.value = null;
            await clearDraft();
            onSuccess(response);
        } catch (error) {
            // Demo-mode cancellation is a benign user action, not an API
            // failure — bail out silently with the form state intact.
            if ((error as { code?: string } | null)?.code === 'DEMO_MODE_CANCELLED') {
                return;
            }
            // Fallback: if online submission failed and we're now offline, queue it
            if (!isOnline.value && offlineEnabled.value && lastRequestData.value) {
                try {
                    await submitOffline(lastRequestData.value, { demoConfirmed: true });
                    return;
                } catch {
                    // Offline queue also failed, fall through to error handling
                }
            }
            processApiErrors(error);
            scrollToError();
        } finally {
            isSubmitting.value = false;
        }
    };

    const submitWithAcknowledgment = async () => {
        if (!lastRequestData.value || isSubmitting.value) {
            if (!lastRequestData.value) {
                console.error('No request data available for resubmission');
            }
            return;
        }

        isSubmitting.value = true;
        clearErrorState();
        clearDuplicateHint();

        try {
            const response = await createServiceRequest(lastRequestData.value as any, {
                acknowledgeDuplicate: true
            });
            successMessage.value = t('success.report_submitted');
            lastRequestData.value = null;
            await clearDraft();
            onSuccess(response);
        } catch (e: unknown) {
            // Same demo-mode cancellation contract as in handleSubmit: keep
            // the form state, clear the spinner, swallow the sentinel.
            if ((e as { code?: string } | null)?.code === 'DEMO_MODE_CANCELLED') {
                return;
            }
            console.error('Failed to submit report with acknowledgment:', e);
            processApiErrors(e);
            scrollToError();
        } finally {
            isSubmitting.value = false;
        }
    };

    return {
        isSubmitting,
        successMessage,
        errorState,
        clearErrorState,
        duplicateHintState,
        clearDuplicateHint,
        handleSubmit,
        submitWithAcknowledgment
    };
}
