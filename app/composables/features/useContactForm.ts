import { useI18n } from 'vue-i18n';

/**
 * Contact Form Composable
 *
 * Handles contact form submission and state management.
 *
 * @returns Reactive state and methods for contact form functionality
 */

interface ContactFormData {
    name: string
    mail: string
    message: string
    copy: boolean
    gdpr: boolean
    website?: string
    form_token?: string
}

export const useContactForm = () => {
    const loading = ref(false);
    const hasSubmitted = ref(false);
    const submissionError = ref<string | null>(null);
    const apiClient = useApiClient();
    const { t } = useI18n();

    const submitContactForm = async (data: ContactFormData) => {
        loading.value = true;
        submissionError.value = null;
        try {
            const response = await apiClient.post<{ message?: string }>('/contact/submit', data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            hasSubmitted.value = true;
            return { success: true, message: response?.message || t('contact.success_message') };
        } catch (error: unknown) {
            const status = (error as any)?.status;
            const message = (error as any)?.message;
            if (status === 429) {
                submissionError.value = t('contact.flood_error');
            } else {
                submissionError.value = message || t('contact.submission_failed');
            }
            return { success: false, error: submissionError.value };
        } finally {
            loading.value = false;
        }
    };

    const resetState = () => {
        loading.value = false;
        hasSubmitted.value = false;
        submissionError.value = null;
    };

    return {
        loading,
        hasSubmitted,
        submissionError,
        submitContactForm,
        resetState
    };
};
