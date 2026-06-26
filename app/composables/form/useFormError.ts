/**
 * FormError Composable
 *
 * Handles form validation errors with user-friendly messaging.
 *
 * @returns Reactive state and methods for formerror functionality
 */

export const useFormError = (formRef: Ref<HTMLFormElement | null>) => {
    const errorContainer = ref<HTMLElement | null>(null);
    const headerOffset = 80;

    const handleError = async (error: unknown) => {
        await nextTick();

        // Type guard for error structure
        const isApiError = (err: unknown): err is { response?: { data?: { errors?: Array<{ source?: { pointer?: string } }> } } } => {
            return typeof err === 'object' && err !== null;
        };

        const fields = isApiError(error)
            ? error.response?.data?.errors?.map(e =>
                e.source?.pointer?.replace('/data/attributes/', '')
            )?.filter(Boolean) || []
            : [];

        fields.forEach((field) => {
            const el = formRef.value?.querySelector(`[data-field="${field}"]`);
            if (el) {
                el.setAttribute('aria-invalid', 'true');
                el.setAttribute('aria-errormessage', `error-${field}`);
            }
        });

        if (errorContainer.value) {
            const elementPosition = errorContainer.value.getBoundingClientRect().top;
            const offsetPosition = elementPosition - headerOffset + window.pageYOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            setTimeout(() => {
                const firstInvalidField = formRef.value?.querySelector('[aria-invalid="true"]');
                if (firstInvalidField instanceof HTMLElement) {
                    firstInvalidField.focus();
                }
            }, 500);
        }
    };

    const clearErrors = () => {
        formRef.value?.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
            el.removeAttribute('aria-invalid');
            el.removeAttribute('aria-errormessage');
        });
    };

    return {
        errorContainer,
        handleError,
        clearErrors
    };
};
