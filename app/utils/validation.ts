/**
 * Validation Utilities
 *
 * Form and data validation utilities with comprehensive rule checking.
 *
 * Pure utility functions with no side effects for predictable behavior.
 */

export interface ValidationRule {
    type: string
    message?: string
    params?: Record<string, unknown>
}

export interface FieldValidation {
    required?: boolean
    rules?: ValidationRule[]
    validation_message?: string
}

export interface FormFieldSettings {
    label: string
    description?: string
    required?: boolean
    validation_message?: string
    widget_settings?: {
        placeholder?: string
        size?: number
        rows?: number
    }
    validation?: FieldValidation
}

export interface ValidationResult {
    isValid: boolean
    message?: string
}

export class ValidationError extends Error {
    constructor(
        public field: string,
        message: string
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validators = {
    required: (value: any, _params: any, message?: string): ValidationResult => {
        if (value == null || value === '') {
            return { isValid: false, message: message || 'This field is required' };
        }

        // For strings, reject whitespace-only values
        if (typeof value === 'string' && value.trim() === '') {
            return { isValid: false, message: message || 'This field is required' };
        }

        return { isValid: true };
    },

    email: (value: string, _params: any, message?: string): ValidationResult => ({
        isValid: EMAIL_REGEX.test(value),
        message: message || 'Invalid email format'
    }),

    minLength: (value: string, params: { length: number }, message?: string): ValidationResult => ({
        isValid: value.length >= params.length,
        message: message || `Must be at least ${params.length} characters`
    }),

    maxLength: (value: string, params: { length: number }, message?: string): ValidationResult => ({
        isValid: value.length <= params.length,
        message: message || `Must not exceed ${params.length} characters`
    })
};

export const validateField = (
    value: any,
    fieldSettings: FormFieldSettings,
    t: (key: string) => string
): ValidationResult[] => {
    const results: ValidationResult[] = [];

    if (fieldSettings.required) {
        results.push(validators.required(
            value,
            {},
            t(`validation.${fieldSettings.validation_message || 'required'}`)
        ));
    }

    fieldSettings.validation?.rules?.forEach((rule) => {
        const validator = validators[rule.type as keyof typeof validators];
        if (validator) {
            results.push(validator(
                value,
                rule.params as any,
                t(`validation.${rule.message || rule.type}`)
            ));
        }
    });

    return results;
};

export const validateForm = (
    formData: Record<string, unknown>,
    formSettings: Record<string, FormFieldSettings>,
    t: (key: string) => string
): ValidationError[] => {
    const errors: ValidationError[] = [];

    Object.entries(formSettings).forEach(([fieldName, settings]) => {
        const value = formData[fieldName];
        const results = validateField(value, settings, t);

        const invalid = results.find(r => !r.isValid);
        if (invalid) {
            errors.push(new ValidationError(fieldName, invalid.message || ''));
        }
    });

    return errors;
};
