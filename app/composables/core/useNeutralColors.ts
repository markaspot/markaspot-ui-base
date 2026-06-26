/**
 * Centralized neutral color management for light/dark mode compatibility
 *
 * Provides consistent neutral colors that work well in both themes
 */

/**
 * Get neutral colors that provide good contrast in both light and dark modes
 */
export function useNeutralColors() {
    const colorMode = useColorMode();

    // For dynamic color values that need good contrast in both modes
    const neutralDefault = computed(() => {
        // Use gray-500 for light mode, gray-400 for dark mode
        return colorMode.value === 'dark' ? '#9ca3af' : '#6b7280';
    });

    const neutralMedium = computed(() => {
        // Use gray-600 for light mode, gray-300 for dark mode
        return colorMode.value === 'dark' ? '#d1d5db' : '#4b5563';
    });

    const neutralLight = computed(() => {
        // Use gray-400 for light mode, gray-500 for dark mode
        return colorMode.value === 'dark' ? '#6b7280' : '#9ca3af';
    });

    const neutralFallback = computed(() => {
        // Use gray-500 as a middle ground that works in both modes
        return '#6b7280';
    });

    // Tailwind class equivalents for template usage
    const neutralDefaultClass = computed(() => {
        return colorMode.value === 'dark' ? 'gray-400' : 'gray-500';
    });

    const neutralMediumClass = computed(() => {
        return colorMode.value === 'dark' ? 'gray-300' : 'gray-600';
    });

    const neutralLightClass = computed(() => {
        return colorMode.value === 'dark' ? 'gray-500' : 'gray-400';
    });

    return {
        // Hex values for dynamic usage (e.g., in canvas, SVG, or JS calculations)
        neutralDefault,
        neutralMedium,
        neutralLight,
        neutralFallback,

        // Tailwind classes for template usage
        neutralDefaultClass,
        neutralMediumClass,
        neutralLightClass,

        // Static values when color mode doesn't matter
        staticNeutral: '#6b7280', // gray-500
        staticNeutralLight: '#9ca3af', // gray-400
        staticNeutralDark: '#4b5563' // gray-600
    };
}
