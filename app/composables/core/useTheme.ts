// composables/useTheme.ts
import { useColorMode } from '#imports';

/**
 * Theme Composable
 *
 * Manages application theming with dark/light mode and custom color schemes.
 *
 * @returns Reactive state and methods for theme functionality
 */

export const useTheme = () => {
    const colorMode = useColorMode();

    const isDark = computed(() => colorMode.value === 'dark');
    const preference = computed({
        get: () => colorMode.preference,
        set: (value) => {
            colorMode.preference = value;
        }
    });

    const toggle = () => {
        colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark';
    };

    return {
        isDark,
        preference,
        toggle,
        colorMode
    };
};
