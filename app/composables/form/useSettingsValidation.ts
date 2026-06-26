import { useI18n } from 'vue-i18n';
import { useFormSettings } from '~/composables/form/useFormSettings';
import { validateField, validateForm, ValidationError, type FormFieldSettings } from '@/utils/validation';

/**
 * SettingsValidation Composable
 *
 * Provides  settings validation functionality for the application.
 *
 * @returns Reactive state and methods for settingsvalidation functionality
 */

export function useSettingsValidation() {
    const { settings } = useFormSettings();
    const { t } = useI18n();
    const validationErrors = ref<ValidationError[]>([]);

    const validateFormField = (fieldName: string, value: unknown): ValidationError | null => {
        const fieldSettings = settings.value?.fields?.[fieldName] as FormFieldSettings;
        if (!fieldSettings) return null;

        const results = validateField(value, fieldSettings, t);
        const invalid = results.find(r => !r.isValid);

        return invalid ? new ValidationError(fieldName, invalid.message || '') : null;
    };

    const validateFormData = (formData: Record<string, unknown>): boolean => {
        if (!settings.value?.fields) return true;

        validationErrors.value = validateForm(formData, settings.value.fields as Record<string, FormFieldSettings>, t);
        return validationErrors.value.length === 0;
    };

    const getFieldError = (fieldName: string): string | null => {
        const error = validationErrors.value.find(e => e.field === fieldName);
        return error?.message || null;
    };

    const clearValidation = () => {
        validationErrors.value = [];
    };

    return {
        validateField: validateFormField,
        validateForm: validateFormData,
        getFieldError,
        clearValidation,
        hasErrors: computed(() => validationErrors.value.length > 0),
        errors: computed(() => validationErrors.value)
    };
}
