import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

/**
 * Composable for managing modals and page content
 *
 * Note: Feedback and Service Provider modal logic moved to pro layer
 * - pro-layer/app/composables/feedback/useFeedbackModal.ts
 * - pro-layer/app/composables/service-provider/useServiceProviderModal.ts
 */
export function useModalManager() {
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();
    const toast = useToast();
    const { jurisdiction: configJurisdiction } = useMarkASpotConfig();

    // Modal and page state
    const selectedPage = ref<Record<string, unknown> | null>(null);
    const showInfo = ref(false);
    const showConfirmationModal = ref(false);
    const confirmationUuid = ref<string | null>(null);
    const showContactModal = ref(false);

    /**
     * Handle page selection for content display
     */
    const handlePageSelect = (page: Record<string, unknown> | null) => {
        selectedPage.value = page;
    };

    /**
     * Toggle info panel visibility
     */
    const toggleInfo = () => {
        showInfo.value = !showInfo.value;
    };

    /**
     * Initialize confirmation modal with UUID
     */
    const initializeConfirmationModal = (uuid: string) => {
        confirmationUuid.value = uuid;
        showConfirmationModal.value = true;
    };

    /**
     * Handle confirmation close
     */
    const handleConfirmationClose = (data?: {
        success: boolean
        message: string
        _closeAction?: boolean
    }) => {
        // Only close if this was triggered by a direct close action
        if (!data || data._closeAction === true) {
            showConfirmationModal.value = false;
            confirmationUuid.value = null;

            // Redirect if we're on a confirmation URL (preserve jurisdiction context)
            if (window?.location.pathname.includes('/confirm/')) {
                const jur = route.params.jurisdiction || configJurisdiction.value?.slug;
                router.push(jur ? `/${jur}/` : '/');
            }

            // If we're closing without data, stop here
            if (!data) return;
        }

        // Handle confirmation result
        if (data?.success !== undefined) {
            handleConfirmationResult(data);
        }
    };

    /**
     * Handle confirmation result with toast notification
     */
    const handleConfirmationResult = (data: {
        success: boolean
        message: string
    }) => {
        const toastColor = data.success ? 'success' : 'error' as const;
        const title = data.success
            ? t('confirmation.success_notification')
            : t('confirmation.error_notification');

        // Show toast
        toast.add({
            title: data.message || title,
            color: toastColor,
            duration: 5000
        });
    };

    /**
     * Open contact form modal
     */
    const openContactModal = () => {
        showContactModal.value = true;
    };

    /**
     * Handle contact form close
     */
    const handleContactClose = (data?: { success?: boolean, _closeAction?: boolean }) => {
        showContactModal.value = false;

        if (data?.success) {
            toast.add({
                title: t('contact.success_title'),
                description: t('contact.success_message'),
                color: 'success' as const,
                duration: 5000
            });
        }
    };

    // Make page selection available globally
    provide('showPage', handlePageSelect);

    return {
        // State
        selectedPage,
        showInfo,
        showConfirmationModal,
        confirmationUuid: readonly(confirmationUuid),
        showContactModal,

        // Methods
        handlePageSelect,
        toggleInfo,
        initializeConfirmationModal,
        handleConfirmationClose,
        handleConfirmationResult,
        openContactModal,
        handleContactClose
    };
}
