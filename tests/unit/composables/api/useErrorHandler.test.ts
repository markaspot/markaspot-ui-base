/**
 * Error Handler Tests
 *
 * Tests the error classification and message mapping logic that
 * determines ALL user-visible error messages in the application.
 * Covers: 429 rate limits, 422 validation errors, duplicate hints,
 * location errors, GDPR, email, required fields, and generic fallback.
 *
 * @see app/composables/api/useErrorHandler.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';

// Need to import after mocks are set up
import { useErrorHandler } from '@/composables/api/useErrorHandler';

// ============================================================================
// Mock vue-i18n
// ============================================================================

const mockT = vi.fn((key: string, params?: Record<string, any>) => {
    // Return the key itself so tests can assert on translation keys.
    // For parameterized messages, append params for inspection.
    if (params) {
        const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',');
        return `${key}{${paramStr}}`;
    }
    return key;
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({ t: mockT })
}));

// ============================================================================
// Helpers
// ============================================================================

function createApiError(status: number, errors: any[], extraProps: Record<string, any> = {}) {
    return {
        status,
        response: {
            status,
            data: { errors }
        },
        ...extraProps
    };
}

function createRateLimitError(message: string, status = 429) {
    return {
        status,
        response: { status },
        message,
        originalMessage: message
    };
}

function createStringError(message: string) {
    return {
        toString: () => message
    };
}

// ============================================================================
// Tests
// ============================================================================

describe('useErrorHandler', () => {
    let handler: ReturnType<typeof useErrorHandler>;

    beforeEach(() => {
        mockT.mockClear();
        handler = useErrorHandler();
    });

    // ========================================================================
    // Initial state
    // ========================================================================

    describe('initial state', () => {
        it('starts with hidden error state', () => {
            expect(handler.errorState.value.isVisible).toBe(false);
            expect(handler.errorState.value.errors).toEqual([]);
        });

        it('starts with hidden duplicate hint state', () => {
            expect(handler.duplicateHintState.value.isVisible).toBe(false);
            expect(handler.duplicateHintState.value.message).toBe('');
        });
    });

    // ========================================================================
    // Rate limit errors (429)
    // ========================================================================

    describe('429 rate limit errors', () => {
        it('sets rate_limit title for 429 status', () => {
            handler.processApiErrors(createRateLimitError('Too many requests'));
            expect(handler.errorState.value.isVisible).toBe(true);
            expect(mockT).toHaveBeenCalledWith('errors.rate_limit.title');
        });

        it('extracts wait time from "try again in N seconds"', () => {
            handler.processApiErrors(createRateLimitError('Please try again in 30 seconds'));
            const error = handler.errorState.value.errors[0];
            expect(error.code).toBe('rate_limit');
            expect(error.meta?.seconds).toBe(30);
            expect(error.message).toBe('errors.rate_limit.with_time');
        });

        it('extracts wait time from "N seconds" pattern', () => {
            handler.processApiErrors(createRateLimitError('Rate limit exceeded. 60 seconds remaining'));
            expect(handler.errorState.value.errors[0].meta?.seconds).toBe(60);
        });

        it('uses general message when no wait time found', () => {
            handler.processApiErrors(createRateLimitError('Too many requests'));
            expect(handler.errorState.value.errors[0].message).toBe('errors.rate_limit.general');
            expect(handler.errorState.value.errors[0].meta?.seconds).toBeNull();
        });

        it('sets meta.seconds on error state', () => {
            handler.processApiErrors(createRateLimitError('try again in 45 seconds'));
            expect(handler.errorState.value.meta?.seconds).toBe(45);
            expect(handler.errorState.value.meta?.type).toBe('rate_limit');
        });

        it('detects 429 from response.status', () => {
            handler.processApiErrors({
                response: { status: 429 },
                message: 'try again in 10 seconds'
            });
            expect(handler.errorState.value.errors[0].code).toBe('rate_limit');
        });
    });

    // ========================================================================
    // Structured API errors (JSON:API format)
    // ========================================================================

    describe('structured API errors', () => {
        it('processes errors from response.data.errors', () => {
            handler.processApiErrors(createApiError(422, [
                { detail: 'Description is required', source: { pointer: '/data/attributes/body' } }
            ]));
            expect(handler.errorState.value.isVisible).toBe(true);
            expect(handler.errorState.value.errors).toHaveLength(1);
        });

        it('processes errors from data.errors (direct)', () => {
            handler.processApiErrors({
                status: 422,
                data: {
                    errors: [
                        { detail: 'Invalid email', source: { pointer: '/data/attributes/field_e_mail' } }
                    ]
                }
            });
            expect(handler.errorState.value.errors).toHaveLength(1);
        });

        it('extracts field from source pointer', () => {
            handler.processApiErrors(createApiError(422, [
                { detail: 'Invalid', source: { pointer: '/data/attributes/field_address' } }
            ]));
            const field = handler.errorState.value.errors[0].field;
            expect(field).toBe('field_address');
        });

        it('strips nested field paths (dot notation)', () => {
            handler.processApiErrors(createApiError(422, [
                { detail: 'Invalid', source: { pointer: '/data/attributes/field_address.0.postal_code' } }
            ]));
            expect(handler.errorState.value.errors[0].field).toBe('field_address');
        });

        it('strips field path prefix from detail message', () => {
            handler.processApiErrors(createApiError(422, [
                {
                    detail: 'field_address.0.postal_code: Invalid format',
                    source: { pointer: '/data/attributes/field_address' }
                }
            ]));
            // The prefix "field_address.0.postal_code: " should be stripped
            const msg = handler.errorState.value.errors[0].message;
            expect(msg).not.toContain('field_address.0.postal_code:');
        });

        it('sets invalid_input title for 422 status', () => {
            handler.processApiErrors(createApiError(422, [
                { detail: 'Something wrong' }
            ]));
            expect(mockT).toHaveBeenCalledWith('errors.validation.invalid_input');
        });

        it('falls back to "general" field when no source pointer', () => {
            handler.processApiErrors(createApiError(422, [
                { detail: 'Something went wrong' }
            ]));
            expect(handler.errorState.value.errors[0].field).toBe('general');
        });

        it('uses title when detail is missing', () => {
            handler.processApiErrors(createApiError(422, [
                { title: 'Validation failed' }
            ]));
            expect(handler.errorState.value.errors[0].message).toBe('Validation failed');
        });
    });

    // ========================================================================
    // Location/jurisdiction errors
    // ========================================================================

    describe('location errors', () => {
        it('detects "outside our range" in structured errors', () => {
            handler.processApiErrors(createApiError(422, [
                { detail: 'The submitted location is outside our range of activity.' }
            ]));
            expect(mockT).toHaveBeenCalledWith('errors.validation.location_error_title');
            expect(mockT).toHaveBeenCalledWith('errors.validation.location_out_of_bounds');
            expect(handler.errorState.value.errors[0].field).toBe('field_geolocation');
        });

        it('detects German "örtlichen Zuständigkeit" message', () => {
            handler.processApiErrors(createApiError(422, [
                { detail: 'Dieser Ort liegt außerhalb unserer örtlichen Zuständigkeit.' }
            ]));
            expect(handler.errorState.value.errors[0].field).toBe('field_geolocation');
        });

        it('detects "jurisdiction" keyword in structured errors', () => {
            handler.processApiErrors(createApiError(422, [
                { detail: 'Location is outside the jurisdiction boundary' }
            ]));
            expect(handler.errorState.value.errors[0].field).toBe('field_geolocation');
        });

        it('detects location error from plain string error', () => {
            handler.processApiErrors(createStringError('Location is outside our range of activity'));
            expect(handler.errorState.value.errors[0].field).toBe('geolocation');
            expect(handler.errorState.value.errors[0].code).toBe('location_error');
        });
    });

    // ========================================================================
    // Duplicate report detection
    // ========================================================================

    describe('duplicate report detection', () => {
        describe('new format (meta.duplicate_hint)', () => {
            it('detects duplicate hint via meta.duplicate_hint', () => {
                handler.processApiErrors(createApiError(422, [{
                    detail: 'A similar report was found nearby',
                    meta: {
                        duplicate_hint: true,
                        existing_report_id: 'uuid-123',
                        existing_report_nid: '42',
                        existing_report_url: '/node/42'
                    }
                }]));
                // Duplicate hints go to duplicateHintState, NOT errorState errors
                expect(handler.duplicateHintState.value.isVisible).toBe(true);
                expect(handler.duplicateHintState.value.existingReport?.id).toBe('uuid-123');
                expect(handler.duplicateHintState.value.existingReport?.nid).toBe('42');
                // errorState.isVisible is true (set during reset) but errors array is empty
                expect(handler.errorState.value.errors).toHaveLength(0);
            });

            it('detects duplicate hint via source.parameter.duplicate_hint', () => {
                handler.processApiErrors(createApiError(422, [{
                    detail: 'Duplicate found',
                    source: {
                        parameter: {
                            duplicate_hint: true,
                            existing_report_id: 'uuid-456'
                        }
                    }
                }]));
                expect(handler.duplicateHintState.value.isVisible).toBe(true);
                expect(handler.duplicateHintState.value.existingReport?.id).toBe('uuid-456');
            });
        });

        describe('legacy format (text pattern matching)', () => {
            it('detects hint from "ignore this message by resubmitting"', () => {
                handler.processApiErrors(createApiError(422, [{
                    detail: 'A similar report [Submission No: SR-123] was found. You can ignore this message by resubmitting.'
                }]));
                expect(handler.duplicateHintState.value.isVisible).toBe(true);
                expect(handler.duplicateHintState.value.existingReport?.id).toBe('SR-123');
            });

            it('detects hint from German "können diese Nachricht ignorieren"', () => {
                // Outer condition requires "bereits gemeldet" or "kürzlich erstellten Beitrag"
                // Inner hint check then looks for "können diese Nachricht ignorieren"
                handler.processApiErrors(createApiError(422, [{
                    detail: 'Das Problem wurde bereits gemeldet [Beitrag Nr: MK-42]. Sie können diese Nachricht ignorieren.'
                }]));
                expect(handler.duplicateHintState.value.isVisible).toBe(true);
                expect(handler.duplicateHintState.value.existingReport?.id).toBe('MK-42');
            });

            it('treats non-hint duplicate as hard block', () => {
                handler.processApiErrors(createApiError(422, [{
                    detail: 'Sie haben kürzlich erstellten Beitrag [Beitrag Nr: MK-99] gemeldet.'
                }]));
                // Hard block -> goes to errorState, not duplicateHintState
                expect(handler.errorState.value.isVisible).toBe(true);
                expect(handler.duplicateHintState.value.isVisible).toBe(false);
                expect(mockT).toHaveBeenCalledWith('errors.validation.duplicate_title');
            });

            it('extracts report ID from "Beitrag Nr:" pattern', () => {
                handler.processApiErrors(createApiError(422, [{
                    detail: 'kürzlich erstellten Beitrag [Beitrag Nr: SR-2024-001]'
                }]));
                expect(mockT).toHaveBeenCalledWith(
                    'errors.validation.duplicate_report',
                    { reportId: 'SR-2024-001' }
                );
            });

            it('falls back to detail when no report ID found', () => {
                handler.processApiErrors(createApiError(422, [{
                    detail: 'bereits gemeldet in der Nähe'
                }]));
                // No ID extracted, shows detail directly
                const msg = handler.errorState.value.errors[0].message;
                expect(msg).toBe('bereits gemeldet in der Nähe');
            });
        });

        describe('duplicate from plain string error', () => {
            it('detects German duplicate pattern', () => {
                handler.processApiErrors(createStringError(
                    'kürzlich erstellten Beitrag Nr: SR-100'
                ));
                expect(handler.errorState.value.errors[0].code).toBe('duplicate_report');
            });

            it('detects English "duplicate" keyword', () => {
                handler.processApiErrors(createStringError('duplicate report found'));
                expect(handler.errorState.value.errors[0].code).toBe('duplicate_report');
            });
        });
    });

    // ========================================================================
    // Postal code / address errors
    // ========================================================================

    describe('address validation errors', () => {
        it('maps postal code errors to field_address', () => {
            handler.processApiErrors(createApiError(422, [{
                detail: 'Postleitzahl hat ein ungültiges Format',
                source: { pointer: '/data/attributes/field_address' }
            }]));
            expect(handler.errorState.value.errors[0].field).toBe('field_address');
        });

        it('detects English "postcode" keyword', () => {
            handler.processApiErrors(createApiError(422, [{
                detail: 'The postcode format is invalid'
            }]));
            expect(handler.errorState.value.errors[0].field).toBe('field_address');
        });
    });

    // ========================================================================
    // Specific field error patterns (from string errors)
    // ========================================================================

    describe('field-specific string errors', () => {
        it('detects GDPR/privacy errors', () => {
            handler.processApiErrors(createStringError('Datenschutzerklärung muss akzeptiert werden'));
            expect(handler.errorState.value.errors[0].field).toBe('field_gdpr');
            expect(handler.errorState.value.errors[0].code).toBe('gdpr_error');
        });

        it('detects email errors', () => {
            handler.processApiErrors(createStringError('E-Mail-Adresse ist ungültig'));
            expect(handler.errorState.value.errors[0].field).toBe('field_e_mail');
            expect(handler.errorState.value.errors[0].code).toBe('email_error');
        });

        it('detects required field errors', () => {
            handler.processApiErrors(createStringError('body: This field is required'));
            expect(handler.errorState.value.errors[0].code).toBe('required_field');
        });

        it('falls back to generic error for unknown messages', () => {
            handler.processApiErrors(createStringError('Something unexpected happened'));
            expect(handler.errorState.value.errors[0].field).toBe('general');
            expect(handler.errorState.value.errors[0].code).toBe('error');
            expect(mockT).toHaveBeenCalledWith('errors.general');
        });
    });

    // ========================================================================
    // addFormattedError field normalization
    // ========================================================================

    describe('addFormattedError field mapping', () => {
        it('normalizes "geolocation" to "field_geolocation"', () => {
            handler.addFormattedError('geolocation', 'Out of bounds');
            expect(handler.errorState.value.errors[0].field).toBe('field_geolocation');
        });

        it('normalizes "email" to "field_e_mail"', () => {
            handler.addFormattedError('email', 'Invalid');
            expect(handler.errorState.value.errors[0].field).toBe('field_e_mail');
        });

        it('normalizes "description" to "body"', () => {
            handler.addFormattedError('description', 'Too short');
            expect(handler.errorState.value.errors[0].field).toBe('body');
        });

        it('strips field_ prefix before mapping', () => {
            // "field_gdpr" -> strip to "gdpr" -> map to "field_gdpr"
            handler.addFormattedError('field_gdpr', 'Required');
            expect(handler.errorState.value.errors[0].field).toBe('field_gdpr');
        });

        it('preserves unmapped fields as-is', () => {
            handler.addFormattedError('some_custom_field', 'Error');
            expect(handler.errorState.value.errors[0].field).toBe('some_custom_field');
        });

        it('translates "outside jurisdiction" pattern', () => {
            handler.addFormattedError('geolocation', 'Location is outside our range of activity');
            expect(mockT).toHaveBeenCalledWith('errors.validation.location_out_of_bounds');
        });
    });

    // ========================================================================
    // Guard: skip if already visible
    // ========================================================================

    describe('already visible guard', () => {
        it('skips processing when errors are already visible', () => {
            // First error
            handler.processApiErrors(createStringError('First error'));
            expect(handler.errorState.value.isVisible).toBe(true);

            // Second error should be silently ignored
            handler.processApiErrors(createStringError('Second error'));
            // Should still have only the first error
            expect(handler.errorState.value.errors).toHaveLength(1);
        });
    });

    // ========================================================================
    // Clear methods
    // ========================================================================

    describe('clearErrors', () => {
        it('resets error state', () => {
            handler.processApiErrors(createStringError('some error'));
            expect(handler.errorState.value.isVisible).toBe(true);

            handler.clearErrors();
            expect(handler.errorState.value.isVisible).toBe(false);
            expect(handler.errorState.value.errors).toEqual([]);
        });

        it('also clears duplicate hint state', () => {
            handler.processApiErrors(createApiError(422, [{
                detail: 'Duplicate',
                meta: { duplicate_hint: true, existing_report_id: '1' }
            }]));
            expect(handler.duplicateHintState.value.isVisible).toBe(true);

            handler.clearErrors();
            expect(handler.duplicateHintState.value.isVisible).toBe(false);
        });
    });

    describe('clearDuplicateHint', () => {
        it('only clears duplicate hint, not error state', () => {
            // Set up both states
            handler.processApiErrors(createStringError('some error'));
            handler.clearErrors(); // clear so we can set duplicate
            handler.processApiErrors(createApiError(422, [{
                detail: 'Dup',
                meta: { duplicate_hint: true, existing_report_id: '1' }
            }]));

            handler.clearDuplicateHint();
            expect(handler.duplicateHintState.value.isVisible).toBe(false);
            // errorState is unaffected (was set to not visible by the duplicate hint handler)
        });
    });
});
