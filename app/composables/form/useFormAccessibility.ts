// composables/useFormAccessibility.ts

/**
 * Composable for improving form accessibility
 * Provides utilities for keyboard navigation, focus management, and ARIA
 */
export const useFormAccessibility = () => {
    // Track focus state for components
    const hasFocus = ref(false);

    /**
   * Scroll to a form error when it appears
   * @param errorSelector - CSS selector for the error element
   */
    const scrollToError = (errorSelector: string) => {
        nextTick(() => {
            const errorElement = document.querySelector(errorSelector);
            if (errorElement) {
                // Smooth scroll to the error with offset
                errorElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Set focus on the error or closest focusable element
                const focusableElement =
                    errorElement.querySelector('input, select, textarea, button, [tabindex]') ||
                    errorElement;

                if (focusableElement instanceof HTMLElement) {
                    focusableElement.focus();
                }
            }
        });
    };

    /**
   * Handle keyboard navigation for dropdown options
   * @param event - Keyboard event
   * @param options - Array of options
   * @param currentIndex - Current focused index
   * @param selectOption - Callback to select an option
   */
    const handleKeyboardNavigation = <T = unknown>(
        event: KeyboardEvent,
        options: T[],
        currentIndex: number,
        selectOption: (option: T, index: number) => void
    ) => {
        if (!options.length) return;

        // Declare indices outside of switch cases
        let nextIndex: number;
        let prevIndex: number;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                selectOption(options[nextIndex], nextIndex);
                break;

            case 'ArrowUp':
                event.preventDefault();
                prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                selectOption(options[prevIndex], prevIndex);
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                if (currentIndex >= 0) {
                    selectOption(options[currentIndex], currentIndex);
                }
                break;

            case 'Escape':
                event.preventDefault();
                // Close dropdown or clear selection, should be handled by component
                break;
        }
    };

    /**
   * Create ARIA attributes for a form field
   * @param params - ARIA attribute parameters
   * @returns Object with ARIA attributes
   */
    const createAriaAttributes = (params: {
        id: string
        label: string
        required?: boolean
        hasError?: boolean
        errorId?: string
        describedBy?: string[]
        expanded?: boolean
        controls?: string
        selected?: boolean
        role?: string
    }) => {
        const ariaAttrs: Record<string, string | boolean> = {
            'id': params.id,
            'aria-label': params.label
        };

        if (params.required) {
            ariaAttrs['aria-required'] = 'true';
        }

        if (params.hasError) {
            ariaAttrs['aria-invalid'] = 'true';
        }

        // Combine all describedBy references
        const describedBy = [...(params.describedBy || [])];
        if (params.hasError && params.errorId) {
            describedBy.push(params.errorId);
        }

        if (describedBy.length > 0) {
            ariaAttrs['aria-describedby'] = describedBy.join(' ');
        }

        if (params.expanded !== undefined) {
            ariaAttrs['aria-expanded'] = params.expanded.toString();
        }

        if (params.controls) {
            ariaAttrs['aria-controls'] = params.controls;
        }

        if (params.selected !== undefined) {
            ariaAttrs['aria-selected'] = params.selected.toString();
        }

        if (params.role) {
            ariaAttrs.role = params.role;
        }

        return ariaAttrs;
    };

    /**
   * Setup focus tracking for a component
   * @param elementRef - Vue ref to the DOM element
   */
    const setupFocusTracking = (elementRef: Ref<HTMLElement | null>) => {
        const onFocus = () => {
            hasFocus.value = true;
        };

        const onBlur = () => {
            hasFocus.value = false;
        };

        onMounted(() => {
            const element = elementRef.value;
            if (element) {
                element.addEventListener('focus', onFocus);
                element.addEventListener('blur', onBlur);
            }
        });

        onUnmounted(() => {
            const element = elementRef.value;
            if (element) {
                element.removeEventListener('focus', onFocus);
                element.removeEventListener('blur', onBlur);
            }
        });

        return { hasFocus };
    };

    return {
        scrollToError,
        handleKeyboardNavigation,
        createAriaAttributes,
        setupFocusTracking,
        hasFocus
    };
};
