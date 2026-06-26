// composables/useErrorHandler.ts
import { useI18n } from 'vue-i18n';
import type { ErrorState, DuplicateHintState } from '~~/types/error';

export const useErrorHandler = () => {
    const { t } = useI18n();
    const errorState = ref<ErrorState>({
        message: t('errors.validation.title'),
        errors: [],
        isVisible: false,
        meta: {}
    });

    // Separate state for duplicate hints (can be dismissed/acknowledged)
    const duplicateHintState = ref<DuplicateHintState>({
        isVisible: false,
        message: '',
        existingReport: undefined
    });

    /**
   * Process API errors from various sources and formats
   * @param error Any error object from API responses
   */
    const processApiErrors = (error: any) => {
        if (errorState.value.isVisible) return;

        // Reset error state
        errorState.value = {
            message: t('errors.validation.title'),
            errors: [],
            isVisible: true,
            meta: {}
        };

        // Special handling for rate limit errors (429)
        if (error.status === 429 || error.response?.status === 429) {
            // Get the error message from various possible sources
            // For rate limit errors, we need to check more properties to find the wait time
            const errorMessage = error.originalMessage || // Added to capture the original error message
              error.message ||
              error.response?.data?.message ||
              error.data?.message ||
              error.data || // Check if error.data is a string with the message
              'Too many requests';

            // Try to extract the waiting time from the error message - using multiple regex patterns
            const waitTimeMatch = errorMessage.match(/try again in (\d+) seconds/i) ||
              errorMessage.match(/Please try again in (\d+) seconds/i) ||
              errorMessage.match(/in (\d+) seconds/i) ||
              errorMessage.match(/(\d+) seconds/i);

            const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : null;

            // Use translation keys for the error messages
            errorState.value.message = t('errors.rate_limit.title');

            // Add metadata to the overall error state
            if (waitTime) {
                errorState.value.meta = {
                    seconds: waitTime,
                    type: 'rate_limit'
                };
            }

            // Add the error message using translation keys
            errorState.value.errors.push({
                field: 'general',
                message: waitTime
                    ? 'errors.rate_limit.with_time' // Translation key
                    : 'errors.rate_limit.general', // Translation key
                code: 'rate_limit',
                // Store the actual timeout seconds in metadata for UI display
                meta: { seconds: waitTime }
            });

            // Log the final error state for debugging

            return;
        }

        // Handle API errors with structured response (including 422 validation errors)
        if (error.response?.data?.errors || error.data?.errors) {
            const apiErrors = error.response?.data?.errors || error.data?.errors;

            // Check for duplicate hint (new backend format with acknowledgment support)
            const duplicateHintError = apiErrors.find((e: any) =>
                e.meta?.duplicate_hint === true ||
                e.source?.parameter?.duplicate_hint === true
            );

            if (duplicateHintError) {
                // This is a duplicate HINT (not a hard block) - user can acknowledge and resubmit
                const meta = duplicateHintError.meta || duplicateHintError.source?.parameter || {};
                duplicateHintState.value = {
                    isVisible: true,
                    message: duplicateHintError.detail || t('errors.validation.duplicate_hint_message'),
                    existingReport: {
                        id: meta.existing_report_id || '',
                        nid: meta.existing_report_nid || '',
                        url: meta.existing_report_url || ''
                    }
                };
                // Don't show as error - it's just a warning
                return;
            }

            // For validation errors, set a more specific error message title
            if (error.status === 422 || error.response?.status === 422) {
                errorState.value.message = t('errors.validation.invalid_input');
            }

            // Process all validation errors and show them all
            apiErrors.forEach((apiError: any) => {
                // Try to extract field name from source pointer
                const fieldMatch = apiError.source?.pointer?.match(/\/data\/attributes\/([^/]+)/);
                let field = fieldMatch ? fieldMatch[1] : 'general';
                // Clean up nested field paths like "field_address.0.postal_code" → "field_address"
                if (field.includes('.')) {
                    field = field.split('.')[0];
                }

                // Extract the error detail and clean up field path prefix
                let detail = apiError.detail || apiError.title || t('errors.general');
                // Strip field path prefix like "field_address.0.postal_code: " from message
                const fieldPrefixMatch = detail.match(/^field_[a-z_]+(\.\d+\.[a-z_]+)?:\s*/i);
                if (fieldPrefixMatch) {
                    detail = detail.slice(fieldPrefixMatch[0].length);
                }

                // Special handling for common validation errors
                if (detail.includes('örtlichen Zuständigkeit') || detail.includes('jurisdiction') ||
                  detail.includes('outside our range') || detail.includes('range of activity')) {
                    // Show full detailed error for geolocation issues
                    errorState.value.message = t('errors.validation.location_error_title');
                    addFormattedError('geolocation', t('errors.validation.location_out_of_bounds'));
                } else if (detail.includes('kürzlich erstellten Beitrag') || detail.includes('bereits gemeldet') ||
                  detail.includes('ignore this message by resubmitting')) {
                    // Handle duplicate report errors - check if it's a hint or hard block
                    // Legacy format: extract report ID from message
                    const reportIdMatch = detail.match(/\[Beitrag Nr:?\s*([^\]]+)\]/i) ||
                      detail.match(/\[Submission No:?\s*([^\]]+)\]/i) ||
                      detail.match(/ID\s+([A-Z0-9-]+)/i);
                    const reportId = reportIdMatch?.[1]?.trim();

                    // Check if this is a hint (contains resubmit instruction)
                    if (detail.includes('ignore this message by resubmitting') ||
                      detail.includes('können diese Nachricht ignorieren')) {
                        // Treat as hint - user can acknowledge
                        duplicateHintState.value = {
                            isVisible: true,
                            message: t('errors.validation.duplicate_hint_message'),
                            existingReport: {
                                id: reportId || '',
                                nid: '',
                                url: ''
                            }
                        };
                    } else {
                        // Hard block
                        errorState.value.message = t('errors.validation.duplicate_title');
                        if (reportId) {
                            addFormattedError('field_geolocation', t('errors.validation.duplicate_report', { reportId }));
                        } else {
                            addFormattedError('field_geolocation', detail);
                        }
                    }
                } else if (detail.includes('Postleitzahl') || detail.includes('postcode') || detail.includes('postal_code')) {
                    // Handle postal code format errors
                    addFormattedError('field_address', detail);
                } else if (detail.includes('nicht das richtige Format') || detail.includes('invalid format')) {
                    // Handle generic format errors - show the actual field and error
                    addFormattedError(field, detail);
                } else {
                    // For all other errors, show the detail with proper field mapping
                    addFormattedError(field, detail);
                }
            });

            return;
        }

        // Extract error message
        const errorMessage = error.toString().replace('ApiError: ', '');

        // Handle specific business error cases with regex pattern matching for more reliability
        if (errorMessage.match(/örtlichen\s+Zuständigkeit|jurisdiction|out\s+of\s+bounds|outside our range|range of activity/i)) {
            errorState.value.message = t('errors.validation.location_error_title');

            // Use translated error message instead of raw API message
            errorState.value.errors.push({
                field: 'geolocation', // Use the clean field name without prefix
                message: t('errors.validation.location_out_of_bounds'),
                code: 'location_error'
            });
        } else if (errorMessage.match(/kürzlich\s+erstellten\s+Beitrag|duplicate|similar\s+report/i)) {
            // Regex to extract report ID
            const reportIdMatch = errorMessage.match(/(?:Beitrag\s+Nr:|Report\s+No:)\s*([^\s]+)/i);
            const reportId = reportIdMatch?.[1]?.trim();

            errorState.value.errors.push({
                field: 'general',
                message: reportId
                    ? t('errors.validation.duplicate_report', { reportId })
                    : t('errors.validation.duplicate_found'),
                code: 'duplicate_report',
                meta: { reportId }
            });
        } else if (errorMessage.match(/Datenschutzerklärung|privacy\s+policy|gdpr/i)) {
            errorState.value.errors.push({
                field: 'field_gdpr',
                message: t('errors.validation.gdpr_required'),
                code: 'gdpr_error'
            });
        } else if (errorMessage.match(/E-Mail|email/i)) {
            errorState.value.errors.push({
                field: 'field_e_mail',
                message: t('errors.validation.email_invalid'),
                code: 'email_error'
            });
        } else if (errorMessage.match(/required|missing|mandatory/i)) {
            // Try to extract field name from the error message
            const fieldMatch = errorMessage.match(/^([^:]+):/);
            const field = fieldMatch ? fieldMatch[1].trim() : 'general';

            errorState.value.errors.push({
                field,
                message: t('errors.validation.required_field', { field: field }),
                code: 'required_field'
            });
        } else {
            // Generic error case
            errorState.value.errors.push({
                field: 'general',
                message: t('errors.general'),
                code: 'error'
            });
        }
    };

    /**
   * Add an error with proper formatting and field normalization
   */
    const addFormattedError = (field: string, message: string) => {
    // Clean field name by stripping any "field_" prefixes first to prevent duplicates
        const cleanField = field.replace(/^field_/, '');

        // Normalize field names from API to form field names
        const fieldMap: Record<string, string> = {
            geolocation: 'field_geolocation',
            gdpr: 'field_gdpr',
            e_mail: 'field_e_mail',
            email: 'field_e_mail',
            category: 'field_category',
            request_media: 'field_request_media',
            name: 'field_name',
            prename: 'field_prename',
            phone: 'field_phone',
            description: 'body',
            // Address field mapping
            address: 'field_address'
        };

        // Use mapping only if field is in our map
        const normalizedField = fieldMap[cleanField] || field;

        // Translate known error messages
        let translatedMessage = message;

        // Map of known error patterns to translation keys
        const errorPatterns = [
            { regex: /outside.+jurisdiction|range of activity|outside our range/i, key: 'errors.validation.location_out_of_bounds' },
            { regex: /field is required|required field/i, key: 'errors.validation.required_field', params: { field } },
            { regex: /invalid format|invalid email/i, key: 'errors.validation.invalid_format', params: { field } }
        ];

        // Find matching translation
        for (const pattern of errorPatterns) {
            if (pattern.regex.test(message)) {
                translatedMessage = pattern.params
                    ? t(pattern.key, pattern.params)
                    : t(pattern.key);
                break;
            }
        }

        errorState.value.errors.push({
            field: normalizedField,
            message: translatedMessage,
            code: 'validation_error'
        });
    };

    const clearErrors = () => {
        errorState.value = {
            message: t('errors.validation.title'),
            errors: [],
            isVisible: false,
            meta: {}
        };
        // Also clear duplicate hint when clearing errors
        duplicateHintState.value = {
            isVisible: false,
            message: '',
            existingReport: undefined
        };
    };

    const clearDuplicateHint = () => {
        duplicateHintState.value = {
            isVisible: false,
            message: '',
            existingReport: undefined
        };
    };

    return {
        errorState,
        duplicateHintState,
        processApiErrors,
        clearErrors,
        clearDuplicateHint,
        addFormattedError
    };
};
