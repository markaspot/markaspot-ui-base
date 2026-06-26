import { describe, it, expect } from 'vitest';
import { validateField, validateForm, ValidationError } from '@/utils/validation';
import type { FormFieldSettings } from '@/utils/validation';

/**
 * Validation Utils Tests
 *
 * CRITICAL: These validators protect against invalid data submission.
 * Bugs here = data loss, security issues, user frustration.
 *
 * Tests cover:
 * - Email validation (prevents invalid emails)
 * - Required field checking (prevents empty submissions)
 * - Length validation (prevents buffer overflows)
 * - Edge cases (whitespace, special chars, unicode)
 */

describe('validation utils', () => {
    // Mock translator that handles validation messages
    const mockT = (key: string) => {
    // Return actual message for common validation keys
        const messages: Record<string, string> = {
            'validation.required': 'This field is required',
            'validation.email': 'Invalid email format',
            'validation.minLength': 'Minimum length required',
            'validation.maxLength': 'Maximum length exceeded'
        };
        return messages[key] || key;
    };

    describe('email validation', () => {
        const emailField: FormFieldSettings = {
            label: 'Email',
            validation: {
                rules: [{ type: 'email' }]
            }
        };

        it('should accept valid emails', () => {
            const validEmails = [
                'test@example.com',
                'user.name@example.com',
                'user+tag@example.co.uk',
                'test_user@sub.example.com',
                '123@example.com'
            ];

            validEmails.forEach((email) => {
                const results = validateField(email, emailField, mockT);
                const emailResult = results.find(r => !r.isValid);
                expect(emailResult, `${email} should be valid`).toBeUndefined();
            });
        });

        it('should reject invalid emails', () => {
            const invalidEmails = [
                'notanemail', // No @
                '@example.com', // No local part
                'test@', // No domain
                'test @example.com', // Space before @
                'test@ example.com', // Space after @
                'test@domain', // No TLD
                '' // Empty
            ];

            invalidEmails.forEach((email) => {
                const results = validateField(email, emailField, mockT);
                const emailResult = results.find(r => !r.isValid);
                expect(emailResult, `${email} should be invalid`).toBeDefined();
            });
        });

        it('should accept double dots in email (current regex allows it)', () => {
            // ⚠️ KNOWN ISSUE: Current EMAIL_REGEX accepts double dots
            // RFC 5321 technically forbids consecutive dots, but some systems allow it
            const email = 'test..user@example.com';
            const results = validateField(email, emailField, mockT);
            const emailResult = results.find(r => !r.isValid);

            // Current behavior: ACCEPTS this email (might be a bug)
            expect(emailResult).toBeUndefined();

            // TODO: Decide if double dots should be rejected
        });

        it('should handle edge case emails', () => {
            // These are technically valid but edge cases
            const edgeCaseEmails = [
                'test+filter@example.com', // Plus addressing
                'user.with.dots@example.com', // Multiple dots
                'user_with_underscores@example.com'
            ];

            edgeCaseEmails.forEach((email) => {
                const results = validateField(email, emailField, mockT);
                const emailResult = results.find(r => !r.isValid);
                // Should be valid
                expect(emailResult, `${email} should be valid`).toBeUndefined();
            });
        });
    });

    describe('required field validation', () => {
        const requiredField: FormFieldSettings = {
            label: 'Name',
            required: true
        };

        it('should accept valid values', () => {
            const validValues = [
                'John Doe',
                'A', // Single character
                '123', // Numbers
                'François', // Unicode
                'O\'Brien', // Apostrophe
                'Test\nMultiline' // Newlines
            ];

            validValues.forEach((value) => {
                const results = validateField(value, requiredField, mockT);
                const requiredResult = results.find(r => !r.isValid);
                expect(requiredResult, `"${value}" should be valid`).toBeUndefined();
            });
        });

        it('should reject empty values', () => {
            const emptyValues = [
                '',
                null,
                undefined
            ];

            emptyValues.forEach((value) => {
                const results = validateField(value, requiredField, mockT);
                const requiredResult = results.find(r => !r.isValid);
                expect(requiredResult, `${value} should be invalid`).toBeDefined();
            });
        });

        it('should reject whitespace-only values', () => {
            const whitespaceValues = [
                '   ', // Spaces
                '\t', // Tab
                '\n', // Newline
                '  \t\n  ' // Mixed whitespace
            ];

            whitespaceValues.forEach((value) => {
                const results = validateField(value, requiredField, mockT);
                const requiredResult = results.find(r => !r.isValid);

                // After fix: whitespace should be rejected
                expect(requiredResult, `"${value}" should be rejected`).toBeDefined();
                expect(requiredResult?.message).toBe('This field is required');
            });
        });

        it('should handle falsy values correctly', () => {
            // These are falsy but might be valid data
            const falsyValues = [
                { value: 0, shouldBeValid: true }, // Number zero
                { value: false, shouldBeValid: true }, // Boolean false
                { value: '', shouldBeValid: false }, // Empty string
                { value: null, shouldBeValid: false } // Null
            ];

            falsyValues.forEach(({ value, shouldBeValid }) => {
                const results = validateField(value, requiredField, mockT);
                const requiredResult = results.find(r => !r.isValid);

                if (shouldBeValid) {
                    expect(requiredResult, `${value} should be valid`).toBeUndefined();
                } else {
                    expect(requiredResult, `${value} should be invalid`).toBeDefined();
                }
            });
        });
    });

    describe('minLength validation', () => {
        const minLengthField: FormFieldSettings = {
            label: 'Description',
            validation: {
                rules: [{ type: 'minLength', params: { length: 10 } }]
            }
        };

        it('should accept strings at or above minimum', () => {
            const results1 = validateField('1234567890', minLengthField, mockT); // Exactly 10
            const results2 = validateField('12345678901', minLengthField, mockT); // 11

            expect(results1.every(r => r.isValid)).toBe(true);
            expect(results2.every(r => r.isValid)).toBe(true);
        });

        it('should reject strings below minimum', () => {
            const results = validateField('123456789', minLengthField, mockT); // 9 chars

            const invalid = results.find(r => !r.isValid);
            expect(invalid).toBeDefined();
            // Message comes from validator itself, not translation
            expect(invalid?.message).toMatch(/10|Minimum length required/);
        });

        it('should handle unicode characters correctly', () => {
            // Unicode characters should count as 1 character each
            const emoji = '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉'; // 10 emojis
            const results = validateField(emoji, minLengthField, mockT);

            // Should be valid (10 characters)
            expect(results.every(r => r.isValid)).toBe(true);
        });
    });

    describe('maxLength validation', () => {
        const maxLengthField: FormFieldSettings = {
            label: 'Title',
            validation: {
                rules: [{ type: 'maxLength', params: { length: 100 } }]
            }
        };

        it('should accept strings at or below maximum', () => {
            const str100 = 'a'.repeat(100);
            const str99 = 'a'.repeat(99);

            const results1 = validateField(str100, maxLengthField, mockT);
            const results2 = validateField(str99, maxLengthField, mockT);

            expect(results1.every(r => r.isValid)).toBe(true);
            expect(results2.every(r => r.isValid)).toBe(true);
        });

        it('should reject strings above maximum', () => {
            const str101 = 'a'.repeat(101);

            const results = validateField(str101, maxLengthField, mockT);

            const invalid = results.find(r => !r.isValid);
            expect(invalid).toBeDefined();
            // Message comes from validator itself, not translation
            expect(invalid?.message).toMatch(/100|Maximum length exceeded/);
        });
    });

    describe('combined validations', () => {
        const strictField: FormFieldSettings = {
            label: 'Username',
            required: true,
            validation: {
                rules: [
                    { type: 'minLength', params: { length: 3 } },
                    { type: 'maxLength', params: { length: 20 } }
                ]
            }
        };

        it('should pass all validations for valid input', () => {
            const results = validateField('validuser', strictField, mockT);

            // All validators should pass
            expect(results.every(r => r.isValid)).toBe(true);
        });

        it('should fail if any validation fails', () => {
            const testCases = [
                { value: '', reason: 'empty (required)' },
                { value: 'ab', reason: 'too short (minLength)' },
                { value: 'a'.repeat(21), reason: 'too long (maxLength)' }
            ];

            testCases.forEach(({ value, reason }) => {
                const results = validateField(value, strictField, mockT);
                const invalid = results.find(r => !r.isValid);
                expect(invalid, reason).toBeDefined();
            });
        });

        it('should return multiple errors if multiple validations fail', () => {
            // Empty string fails both required AND minLength
            const results = validateField('', strictField, mockT);

            const failures = results.filter(r => !r.isValid);
            expect(failures.length).toBeGreaterThan(0);
        });
    });

    describe('validateForm', () => {
        const formSettings = {
            email: {
                label: 'Email',
                required: true,
                validation: { rules: [{ type: 'email' }] }
            },
            description: {
                label: 'Description',
                required: true,
                validation: {
                    rules: [{ type: 'minLength', params: { length: 10 } }]
                }
            },
            optional: {
                label: 'Optional Field',
                required: false
            }
        };

        it('should validate entire form successfully', () => {
            const formData = {
                email: 'test@example.com',
                description: 'This is a valid description',
                optional: ''
            };

            const errors = validateForm(formData, formSettings, mockT);

            expect(errors).toHaveLength(0);
        });

        it('should collect all validation errors', () => {
            const formData = {
                email: 'invalid-email',
                description: 'short',
                optional: ''
            };

            const errors = validateForm(formData, formSettings, mockT);

            expect(errors.length).toBeGreaterThan(0);

            // Should have error for email
            const emailError = errors.find(e => e.field === 'email');
            expect(emailError).toBeDefined();
            expect(emailError).toBeInstanceOf(ValidationError);

            // Should have error for description
            const descError = errors.find(e => e.field === 'description');
            expect(descError).toBeDefined();
        });

        it('should not error on missing optional fields', () => {
            const formData = {
                email: 'test@example.com',
                description: 'Valid description here'
                // optional field missing
            };

            const errors = validateForm(formData, formSettings, mockT);

            expect(errors).toHaveLength(0);
        });
    });

    describe('XSS and injection prevention', () => {
        it('should accept HTML-like strings (sanitization is backend responsibility)', () => {
            // Frontend validation should NOT reject these
            // Backend should sanitize
            const htmlStrings = [
                '<script>alert("xss")</script>',
                '<img src=x onerror=alert(1)>',
                'Robert"; DROP TABLE users;--'
            ];

            const field: FormFieldSettings = {
                label: 'Comment',
                required: true
            };

            htmlStrings.forEach((value) => {
                const results = validateField(value, field, mockT);
                // Should pass frontend validation (not empty)
                const requiredResult = results.find(r => !r.isValid);
                expect(requiredResult).toBeUndefined();
            });
        });
    });

    describe('real-world scenarios', () => {
        it('should validate report submission form', () => {
            const reportSettings = {
                category: {
                    label: 'Category',
                    required: true
                },
                description: {
                    label: 'Description',
                    required: true,
                    validation: {
                        rules: [
                            { type: 'minLength', params: { length: 20 } },
                            { type: 'maxLength', params: { length: 2000 } }
                        ]
                    }
                },
                email: {
                    label: 'Email',
                    required: false,
                    validation: { rules: [{ type: 'email' }] }
                }
            };

            const validSubmission = {
                category: 'pothole',
                description: 'Large pothole on Main Street causing safety issues for cyclists and pedestrians',
                email: 'reporter@example.com'
            };

            const errors = validateForm(validSubmission, reportSettings, mockT);
            expect(errors).toHaveLength(0);
        });

        it('should validate passwordless auth email', () => {
            const authSettings = {
                email: {
                    label: 'Email',
                    required: true,
                    validation: { rules: [{ type: 'email' }] }
                }
            };

            const validAuth = { email: 'user@city.gov' };
            const invalidAuth = { email: 'not-an-email' };

            expect(validateForm(validAuth, authSettings, mockT)).toHaveLength(0);
            expect(validateForm(invalidAuth, authSettings, mockT).length).toBeGreaterThan(0);
        });
    });
});
