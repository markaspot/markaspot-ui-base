import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFormError } from '@/composables/form/useFormError';

/**
 * useFormError Tests - Form Error Handling Logic
 *
 * Tests error parsing, field highlighting, and accessibility.
 * Critical because bugs here mean users don't know what's wrong.
 */

describe('useFormError', () => {
    let formElement: HTMLFormElement;
    let formRef: Ref<HTMLFormElement | null>;

    beforeEach(() => {
    // Create a real DOM form for each test
        formElement = document.createElement('form');
        formRef = ref<HTMLFormElement | null>(formElement);

        // Mock window.scrollTo (JSDOM doesn't implement it)
        window.scrollTo = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    /**
   * Test 1: Parse API errors and mark fields invalid
   * Most important - verifies error parsing works
   */
    it('should parse API errors and mark fields invalid', async () => {
    // Create form with email field
        const emailInput = document.createElement('input');
        emailInput.setAttribute('data-field', 'email');
        formElement.appendChild(emailInput);

        const { handleError } = useFormError(formRef);

        // Simulate API error response (Drupal JSON:API format)
        const apiError = {
            response: {
                data: {
                    errors: [
                        {
                            source: { pointer: '/data/attributes/email' }
                        }
                    ]
                }
            }
        };

        await handleError(apiError);

        // Field should be marked invalid
        expect(emailInput.getAttribute('aria-invalid')).toBe('true');
        expect(emailInput.getAttribute('aria-errormessage')).toBe('error-email');
    });

    /**
   * Test 2: Handle multiple field errors
   * Real-world: Multiple validation failures at once
   */
    it('should mark multiple fields invalid', async () => {
    // Create form with multiple fields
        const emailInput = document.createElement('input');
        emailInput.setAttribute('data-field', 'email');

        const descriptionInput = document.createElement('textarea');
        descriptionInput.setAttribute('data-field', 'description');

        formElement.appendChild(emailInput);
        formElement.appendChild(descriptionInput);

        const { handleError } = useFormError(formRef);

        const apiError = {
            response: {
                data: {
                    errors: [
                        { source: { pointer: '/data/attributes/email' } },
                        { source: { pointer: '/data/attributes/description' } }
                    ]
                }
            }
        };

        await handleError(apiError);

        // Both fields should be invalid
        expect(emailInput.getAttribute('aria-invalid')).toBe('true');
        expect(descriptionInput.getAttribute('aria-invalid')).toBe('true');
    });

    /**
   * Test 3: Clear all errors
   * Important: Reset form state after fixing issues
   */
    it('should clear all errors', () => {
    // Create field with existing error
        const input = document.createElement('input');
        input.setAttribute('data-field', 'email');
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-errormessage', 'error-email');
        formElement.appendChild(input);

        const { clearErrors } = useFormError(formRef);

        clearErrors();

        // All error attributes should be removed
        expect(input.getAttribute('aria-invalid')).toBeNull();
        expect(input.getAttribute('aria-errormessage')).toBeNull();
    });

    /**
   * Test 4: Clear multiple field errors
   */
    it('should clear errors from multiple fields', () => {
        const input1 = document.createElement('input');
        input1.setAttribute('aria-invalid', 'true');
        input1.setAttribute('aria-errormessage', 'error-1');

        const input2 = document.createElement('input');
        input2.setAttribute('aria-invalid', 'true');
        input2.setAttribute('aria-errormessage', 'error-2');

        formElement.appendChild(input1);
        formElement.appendChild(input2);

        const { clearErrors } = useFormError(formRef);
        clearErrors();

        expect(input1.getAttribute('aria-invalid')).toBeNull();
        expect(input2.getAttribute('aria-invalid')).toBeNull();
    });

    /**
   * Test 5: Handle missing form gracefully
   * Edge case: Function called before form renders
   */
    it('should handle null form ref without crashing', async () => {
        const nullFormRef = ref<HTMLFormElement | null>(null);
        const { handleError, clearErrors } = useFormError(nullFormRef);

        const apiError = {
            response: {
                data: {
                    errors: [{ source: { pointer: '/data/attributes/email' } }]
                }
            }
        };

        // Should not throw errors
        await expect(handleError(apiError)).resolves.not.toThrow();
        expect(() => clearErrors()).not.toThrow();
    });

    /**
   * Test 6: Handle malformed API error
   * Real-world: API returns unexpected format
   */
    it('should handle malformed error response', async () => {
        const { handleError } = useFormError(formRef);

        // Missing 'errors' array
        const malformedError = {
            response: {
                data: {}
            }
        };

        // Should not crash
        await expect(handleError(malformedError)).resolves.not.toThrow();
    });

    /**
   * Test 7: Handle error with no source pointer
   */
    it('should handle errors without field mapping', async () => {
        const input = document.createElement('input');
        input.setAttribute('data-field', 'email');
        formElement.appendChild(input);

        const { handleError } = useFormError(formRef);

        const errorWithoutPointer = {
            response: {
                data: {
                    errors: [
                        { title: 'Generic error', detail: 'Something went wrong' }
                    ]
                }
            }
        };

        await expect(handleError(errorWithoutPointer)).resolves.not.toThrow();

        // Field should NOT be marked invalid (no mapping)
        expect(input.getAttribute('aria-invalid')).toBeNull();
    });

    /**
   * Test 8: Scroll to error container
   * Accessibility: Users need to see what's wrong
   */
    it('should scroll to error container', async () => {
        const errorContainer = document.createElement('div');
        errorContainer.getBoundingClientRect = vi.fn(() => ({
            top: 500,
            left: 0,
            right: 0,
            bottom: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: () => ({})
        }));

        const { handleError, errorContainer: errorContainerRef } = useFormError(formRef);
        errorContainerRef.value = errorContainer;

        window.pageYOffset = 0;

        const apiError = {
            response: {
                data: {
                    errors: [{ source: { pointer: '/data/attributes/email' } }]
                }
            }
        };

        await handleError(apiError);

        // Should have scrolled
        expect(window.scrollTo).toHaveBeenCalled();
    });

    /**
   * Test 9: Focus first invalid field (accessibility)
   * Critical for keyboard navigation
   */
    it('should focus first invalid field after delay', async () => {
        vi.useFakeTimers();

        const input1 = document.createElement('input');
        input1.setAttribute('data-field', 'email');
        input1.focus = vi.fn();

        const input2 = document.createElement('input');
        input2.setAttribute('data-field', 'description');
        input2.focus = vi.fn();

        formElement.appendChild(input1);
        formElement.appendChild(input2);

        const errorContainer = document.createElement('div');
        errorContainer.getBoundingClientRect = vi.fn(() => ({
            top: 100, left: 0, right: 0, bottom: 0,
            width: 0, height: 0, x: 0, y: 0, toJSON: () => ({})
        }));

        const { handleError, errorContainer: errorContainerRef } = useFormError(formRef);
        errorContainerRef.value = errorContainer;

        const apiError = {
            response: {
                data: {
                    errors: [
                        { source: { pointer: '/data/attributes/email' } },
                        { source: { pointer: '/data/attributes/description' } }
                    ]
                }
            }
        };

        await handleError(apiError);

        // Fast-forward past the 500ms setTimeout
        vi.advanceTimersByTime(500);

        // First field should be focused
        expect(input1.focus).toHaveBeenCalled();

        vi.useRealTimers();
    });

    /**
   * Test 10: Real-world scenario - Form submission error flow
   * Shows complete user journey
   */
    it('real-world: complete error handling flow', async () => {
        vi.useFakeTimers();

        // Setup form
        const emailInput = document.createElement('input');
        emailInput.setAttribute('data-field', 'email');
        emailInput.focus = vi.fn();
        formElement.appendChild(emailInput);

        const errorContainer = document.createElement('div');
        errorContainer.getBoundingClientRect = vi.fn(() => ({
            top: 200, left: 0, right: 0, bottom: 0,
            width: 0, height: 0, x: 0, y: 0, toJSON: () => ({})
        }));

        const { handleError, clearErrors, errorContainer: errorContainerRef } = useFormError(formRef);
        errorContainerRef.value = errorContainer;

        // 1. User submits form with invalid data
        const apiError = {
            response: {
                data: {
                    errors: [{ source: { pointer: '/data/attributes/email' } }]
                }
            }
        };

        await handleError(apiError);

        // 2. Field marked invalid
        expect(emailInput.getAttribute('aria-invalid')).toBe('true');

        // 3. Page scrolls to error
        expect(window.scrollTo).toHaveBeenCalled();

        // 4. Field gets focus
        vi.advanceTimersByTime(500);
        expect(emailInput.focus).toHaveBeenCalled();

        // 5. User fixes error and resubmits
        clearErrors();
        expect(emailInput.getAttribute('aria-invalid')).toBeNull();

        vi.useRealTimers();
    });
});
