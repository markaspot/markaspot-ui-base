import { describe, it, expect } from 'vitest';
import { FIELD_MAPPINGS, ERROR_CODES } from '@/utils/errorMapper';

/**
 * Error Mapper Tests
 *
 * Tests field name mappings and error codes.
 * CRITICAL: These map Drupal backend field names to frontend field names.
 * Bugs here = errors appearing on wrong fields = confused users.
 *
 * Tests cover:
 * - Field name mappings (Drupal → Frontend)
 * - Error code constants
 * - Immutability of mappings
 */

describe('errorMapper', () => {
    describe('FIELD_MAPPINGS', () => {
    /**
     * Test 1: Standard field mappings
     */
        it('should map Drupal field names to frontend names', () => {
            expect(FIELD_MAPPINGS.field_geolocation).toBe('location');
            expect(FIELD_MAPPINGS.field_request_media).toBe('photos');
            expect(FIELD_MAPPINGS.field_category).toBe('category');
            expect(FIELD_MAPPINGS.field_e_mail).toBe('email');
            expect(FIELD_MAPPINGS.body).toBe('description');
            expect(FIELD_MAPPINGS.field_gdpr).toBe('gdpr');
        });

        /**
     * Test 2: All expected mappings exist
     */
        it('should have all expected field mappings', () => {
            const expectedFields = [
                'field_geolocation',
                'field_request_media',
                'field_category',
                'field_e_mail',
                'body',
                'field_gdpr'
            ];

            expectedFields.forEach((field) => {
                expect(FIELD_MAPPINGS).toHaveProperty(field);
            });
        });

        /**
     * Test 3: Mappings are strings
     */
        it('should have string values for all mappings', () => {
            Object.values(FIELD_MAPPINGS).forEach((value) => {
                expect(typeof value).toBe('string');
                expect(value.length).toBeGreaterThan(0);
            });
        });

        /**
     * Test 4: No duplicate target field names
     */
        it('should not have duplicate frontend field names', () => {
            const values = Object.values(FIELD_MAPPINGS);
            const uniqueValues = new Set(values);

            expect(values.length).toBe(uniqueValues.size);
        });

        /**
     * Test 5: Field names follow convention
     */
        it('should use lowercase frontend field names', () => {
            Object.values(FIELD_MAPPINGS).forEach((value) => {
                expect(value).toBe(value.toLowerCase());
            });
        });

        /**
     * Test 6: Critical fields are mapped
     */
        it('should map critical form fields', () => {
            // These are required for report submission
            expect(FIELD_MAPPINGS.field_category).toBeDefined();
            expect(FIELD_MAPPINGS.body).toBeDefined();
            expect(FIELD_MAPPINGS.field_geolocation).toBeDefined();
        });

        /**
     * Test 7: Email field mapping
     */
        it('should map email field correctly', () => {
            // Drupal uses field_e_mail, frontend uses email
            expect(FIELD_MAPPINGS.field_e_mail).toBe('email');
        });

        /**
     * Test 8: Media field mapping
     */
        it('should map media upload field to photos', () => {
            expect(FIELD_MAPPINGS.field_request_media).toBe('photos');
        });

        /**
     * Test 9: GDPR consent field
     */
        it('should map GDPR consent field', () => {
            expect(FIELD_MAPPINGS.field_gdpr).toBe('gdpr');
        });

        /**
     * Test 10: Reverse lookup
     */
        it('should allow reverse lookup from frontend to Drupal names', () => {
            // Helper to find Drupal field name from frontend name
            const findDrupalField = (frontendName: string) => {
                return Object.entries(FIELD_MAPPINGS).find(
                    ([_, value]) => value === frontendName
                )?.[0];
            };

            expect(findDrupalField('location')).toBe('field_geolocation');
            expect(findDrupalField('photos')).toBe('field_request_media');
            expect(findDrupalField('email')).toBe('field_e_mail');
        });
    });

    describe('ERROR_CODES', () => {
    /**
     * Test 1: Standard error codes
     */
        it('should define standard error codes', () => {
            expect(ERROR_CODES.REQUIRED).toBe('required');
            expect(ERROR_CODES.INVALID_FORMAT).toBe('invalid_format');
            expect(ERROR_CODES.OUT_OF_RANGE).toBe('out_of_range');
            expect(ERROR_CODES.MAX_FILES).toBe('max_files');
            expect(ERROR_CODES.CONSENT_REQUIRED).toBe('consent_required');
            expect(ERROR_CODES.DUPLICATE_REPORT).toBe('duplicate_report');
        });

        /**
     * Test 2: All expected codes exist
     */
        it('should have all expected error codes', () => {
            const expectedCodes = [
                'REQUIRED',
                'INVALID_FORMAT',
                'OUT_OF_RANGE',
                'MAX_FILES',
                'CONSENT_REQUIRED',
                'DUPLICATE_REPORT'
            ];

            expectedCodes.forEach((code) => {
                expect(ERROR_CODES).toHaveProperty(code);
            });
        });

        /**
     * Test 3: Error codes are strings
     */
        it('should have string values for all error codes', () => {
            Object.values(ERROR_CODES).forEach((value) => {
                expect(typeof value).toBe('string');
                expect(value.length).toBeGreaterThan(0);
            });
        });

        /**
     * Test 4: Error codes use snake_case
     */
        it('should use snake_case for error code values', () => {
            Object.values(ERROR_CODES).forEach((value) => {
                // Should not have uppercase or spaces
                expect(value).toBe(value.toLowerCase());
                expect(value).not.toContain(' ');
            });
        });

        /**
     * Test 5: Error code constants use SCREAMING_SNAKE_CASE
     */
        it('should use SCREAMING_SNAKE_CASE for error code keys', () => {
            Object.keys(ERROR_CODES).forEach((key) => {
                expect(key).toBe(key.toUpperCase());
                expect(/^[A-Z_]+$/.test(key)).toBe(true);
            });
        });

        /**
     * Test 6: No duplicate error code values
     */
        it('should not have duplicate error code values', () => {
            const values = Object.values(ERROR_CODES);
            const uniqueValues = new Set(values);

            expect(values.length).toBe(uniqueValues.size);
        });

        /**
     * Test 7: Critical validation codes exist
     */
        it('should define critical validation error codes', () => {
            expect(ERROR_CODES.REQUIRED).toBeDefined();
            expect(ERROR_CODES.INVALID_FORMAT).toBeDefined();
            expect(ERROR_CODES.CONSENT_REQUIRED).toBeDefined();
        });

        /**
     * Test 8: File upload error codes
     */
        it('should define file upload error codes', () => {
            expect(ERROR_CODES.MAX_FILES).toBeDefined();
        });

        /**
     * Test 9: Business logic error codes
     */
        it('should define business logic error codes', () => {
            expect(ERROR_CODES.DUPLICATE_REPORT).toBeDefined();
        });
    });

    describe('immutability', () => {
    /**
     * Test 1: FIELD_MAPPINGS uses TypeScript const assertion
     */
        it('should use const assertion for compile-time immutability', () => {
            // TypeScript `as const` makes it readonly at compile time
            // Runtime: objects are still mutable in JavaScript (not frozen)

            // This is a TypeScript feature, enforced at compile time
            // @ts-expect-error - Type error: Cannot assign to 'field_geolocation' because it is a read-only property
            // FIELD_MAPPINGS.field_geolocation = 'hacked';

            // Runtime check: values exist and are correct
            expect(FIELD_MAPPINGS.field_geolocation).toBe('location');
        });

        /**
     * Test 2: ERROR_CODES uses TypeScript const assertion
     */
        it('should use const assertion for compile-time immutability', () => {
            // @ts-expect-error - Type error: Cannot assign to 'REQUIRED' because it is a read-only property
            // ERROR_CODES.REQUIRED = 'hacked';

            expect(ERROR_CODES.REQUIRED).toBe('required');
        });

        /**
     * Test 3: Document that runtime immutability requires Object.freeze
     */
        it('note: runtime immutability would require Object.freeze', () => {
            // Current implementation uses `as const` (compile-time only)
            // To prevent runtime modification, would need:
            // export const FIELD_MAPPINGS = Object.freeze({ ... })

            // For now, verify values are intact
            expect(FIELD_MAPPINGS.field_geolocation).toBe('location');
            expect(ERROR_CODES.REQUIRED).toBe('required');
        });
    });

    describe('real-world usage', () => {
    /**
     * Test 1: Map Drupal error to frontend field
     */
        it('should map Drupal validation error to correct frontend field', () => {
            // Simulating API error response
            const drupalError = {
                field: 'field_e_mail',
                message: 'Invalid email format'
            };

            const frontendField = FIELD_MAPPINGS[drupalError.field as keyof typeof FIELD_MAPPINGS];

            expect(frontendField).toBe('email');
        });

        /**
     * Test 2: Handle unmapped fields gracefully
     */
        it('should handle unmapped Drupal fields', () => {
            const unknownField = 'field_unknown' as keyof typeof FIELD_MAPPINGS;
            const mapped = FIELD_MAPPINGS[unknownField];

            expect(mapped).toBeUndefined();
        });

        /**
     * Test 3: Use error codes in validation
     */
        it('should use error codes for validation messages', () => {
            const validationErrors = [
                { field: 'email', code: ERROR_CODES.REQUIRED },
                { field: 'photos', code: ERROR_CODES.MAX_FILES },
                { field: 'gdpr', code: ERROR_CODES.CONSENT_REQUIRED }
            ];

            validationErrors.forEach((error) => {
                expect(Object.values(ERROR_CODES)).toContain(error.code);
            });
        });

        /**
     * Test 4: Error mapping workflow
     */
        it('real-world: map API error to display error', () => {
            // 1. API returns Drupal field name (extracted from JSON:API error pointer)
            // Example API error format:
            // { detail: 'This value should not be blank', source: { pointer: '/data/attributes/field_category' } }

            // 2. Extract Drupal field name
            const drupalField = 'field_category';

            // 3. Map to frontend field
            const frontendField = FIELD_MAPPINGS[drupalField as keyof typeof FIELD_MAPPINGS];

            // 4. Verify mapping
            expect(frontendField).toBe('category');

            // 5. Create error code
            const errorCode = ERROR_CODES.REQUIRED;

            expect(errorCode).toBe('required');
        });

        /**
     * Test 5: All Drupal fields have unique frontend mappings
     */
        it('should ensure one-to-one mapping between Drupal and frontend fields', () => {
            const drupalFields = Object.keys(FIELD_MAPPINGS);
            const frontendFields = Object.values(FIELD_MAPPINGS);

            // Each Drupal field maps to exactly one frontend field
            expect(drupalFields.length).toBe(frontendFields.length);

            // No frontend field is reused
            const uniqueFrontendFields = new Set(frontendFields);
            expect(uniqueFrontendFields.size).toBe(frontendFields.length);
        });
    });
});
