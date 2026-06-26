// composables/useDebounceFn.ts

// Define a more specific function type using generics

/**
 * DebounceFn Composable
 *
 * Provides  debounce fn functionality for the application.
 *
 * @returns Reactive state and methods for debouncefn functionality
 */

export function useDebounceFn<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}
