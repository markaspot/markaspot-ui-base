import { ref, computed } from 'vue'
import { useFormSettings } from '~/composables/form/useFormSettings'
import { useI18n } from 'vue-i18n'
import { validateField, validateForm, type ValidationError, type FormFieldSettings } from '~/utils/validation'

export function useSettingsValidation() {
    const { settings } = useFormSettings()
    const { t } = useI18n()
    const validationErrors = ref<ValidationError[]>([])

    const validateFormField = (fieldName: string, value: any): ValidationError | null => {
        const fieldSettings = settings.value?.fields?.[fieldName] as FormFieldSettings
        if (!fieldSettings) return null

        const results = validateField(value, fieldSettings, t)
        const invalid = results.find(r => !r.isValid)

        return invalid ? new ValidationError(fieldName, invalid.message || '') : null
    }

    const validateFormData = (formData: Record<string, any>): boolean => {
        if (!settings.value?.fields) return true

        validationErrors.value = validateForm(formData, settings.value.fields, t)
        return validationErrors.value.length === 0
    }

    const getFieldError = (fieldName: string): string | null => {
        const error = validationErrors.value.find(e => e.field === fieldName)
        return error?.message || null
    }

    const clearValidation = () => {
        validationErrors.value = []
    }

    return {
        validateField: validateFormField,
        validateForm: validateFormData,
        getFieldError,
        clearValidation,
        hasErrors: computed(() => validationErrors.value.length > 0),
        errors: computed(() => validationErrors.value)
    }
}