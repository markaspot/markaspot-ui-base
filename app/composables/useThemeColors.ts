import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';

/**
 * Unified composable for theme-based styling using configurable settings
 * Provides button, navigation, and shared color utilities
 * Uses standard Tailwind primary/secondary color classes instead of CSS variables
 *
 * MIGRATION NOTE: Switched from static import to runtime composable
 * - Before: import clientConfig from '../../config/clients'
 * - After:  const { clientConfig } = useMarkASpotConfig()
 */

// Shared token resolution utilities
const resolveBgToken = (token?: string) => {
    if (!token) return undefined;
    // Already has bg- prefix (standard Tailwind class)
    if (token.startsWith('bg-')) return token;
    // Convert token like 'primary-500' to standard Tailwind class 'bg-primary-500'
    const match = token.match(/^(primary|secondary)-(\d{2,3})$/);
    if (match) {
        return `bg-${match[1]}-${match[2]}`;
    }
    return `bg-${token}`;
};

// Normalize hover/active tokens (supports optional 'dark:' prefix)
const resolveStateClasses = (value: string | undefined, state: 'hover' | 'active') => {
    if (!value) return undefined;
    return value
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => {
            const re = new RegExp(`^(dark:)?${state}:(?:bg-)?(?:(primary|secondary)-(\\d{2,3}))$`);
            const m = part.match(re);
            if (m) {
                const dark = m[1] ? 'dark:' : '';
                const fam = m[2];
                const shade = m[3];
                return `${dark}${state}:bg-${fam}-${shade}`;
            }
            // Pass-through already normalized classes or unrelated utilities
            return part;
        })
        .join(' ');
};

/**
 * Button colors composable
 */
export function useButtonColors(variant: 'main' | 'tooltip' = 'main') {
    const { clientConfig } = useMarkASpotConfig();
    const colorMode = useColorMode();

    // Hover state management
    const primaryHovered = ref(false);
    const secondaryHovered = ref(false);

    const primaryButtonClass = computed(() => {
        const mode = colorMode.value === 'dark' ? 'dark' : 'light';
        const styles = clientConfig.value.theme.buttonStyles?.primary;

        if (!styles) {
            // Fallback to default styles
            return mode === 'dark'
                ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-400'
                : 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-300';
        }

        // Use tooltip-specific styles if variant is tooltip
        if (variant === 'tooltip' && styles.tooltip) {
            const tooltipBg = resolveBgToken(styles.tooltip.background[mode]) || resolveBgToken(styles.background[mode]);
            return `${tooltipBg} ${styles.tooltip.hover} ${styles.tooltip.active} ${styles.focus}`;
        }

        const background = resolveBgToken(styles.background[mode]) || 'bg-primary-500';
        const hover = resolveStateClasses(styles.hover, 'hover') || 'hover:bg-primary-600';
        const active = resolveStateClasses(styles.active, 'active') || 'active:bg-primary-700';
        return `${background} ${hover} ${active} ${styles.focus}`;
    });

    const secondaryButtonClass = computed(() => {
        const mode = colorMode.value === 'dark' ? 'dark' : 'light';
        const styles = clientConfig.value.theme.buttonStyles?.secondary;

        if (!styles) {
            // Fallback to default styles
            return mode === 'dark'
                ? 'bg-secondary-700 hover:bg-secondary-800 active:bg-secondary-900 focus:ring-secondary-400'
                : 'bg-secondary-500 hover:bg-secondary-600 active:bg-secondary-700 focus:ring-secondary-300';
        }

        // Use tooltip-specific styles if variant is tooltip
        if (variant === 'tooltip' && styles.tooltip) {
            const tooltipBg = resolveBgToken(styles.tooltip.background[mode]) || resolveBgToken(styles.background[mode]);
            return `${tooltipBg} ${styles.tooltip.hover} ${styles.tooltip.active} ${styles.focus}`;
        }

        const background = resolveBgToken(styles.background[mode]) || 'bg-secondary-500';
        const hover = resolveStateClasses(styles.hover, 'hover') || 'hover:bg-secondary-600';
        const active = resolveStateClasses(styles.active, 'active') || 'active:bg-secondary-700';
        return `${background} ${hover} ${active} ${styles.focus}`;
    });

    const primaryTextClass = computed(() => {
        const mode = colorMode.value === 'dark' ? 'dark' : 'light';
        // Use text-inverted for dynamic contrast based on primary color luminance
        return clientConfig.value.theme.buttonStyles?.primary?.text?.[mode] || 'text-inverted';
    });

    const secondaryTextClass = computed(() => {
        const mode = colorMode.value === 'dark' ? 'dark' : 'light';
        return clientConfig.value.theme.buttonStyles?.secondary?.text?.[mode] || 'text-white';
    });

    // Hover event handlers
    const primaryHoverHandlers = {
        mouseenter: () => {
            primaryHovered.value = true;
        },
        mouseleave: () => {
            primaryHovered.value = false;
        }
    };

    const secondaryHoverHandlers = {
        mouseenter: () => {
            secondaryHovered.value = true;
        },
        mouseleave: () => {
            secondaryHovered.value = false;
        }
    };

    return {
        primaryButtonClass,
        secondaryButtonClass,
        primaryTextClass,
        secondaryTextClass,
        primaryHovered,
        secondaryHovered,
        primaryHoverHandlers,
        secondaryHoverHandlers
    };
}

/**
 * Navigation colors composable
 */
export function useNavigationColors() {
    const { clientConfig } = useMarkASpotConfig();
    const colorMode = useColorMode();

    // Background for the navigation bar
    const navigationBackgroundClass = computed(() => {
        const mode = colorMode.value === 'dark' ? 'dark' : 'light';
        const styles = (clientConfig.value as any).theme?.navigationStyles?.background as { light?: string, dark?: string } | undefined;
        if (!styles) {
            return mode === 'dark' ? 'bg-primary-800' : 'bg-primary-500';
        }
        return resolveBgToken(styles[mode]) || (mode === 'dark' ? 'bg-primary-800' : 'bg-primary-500');
    });

    // Active tab pill background (and optional shadow)
    const navigationTabPillClass = computed(() => {
        const mode = colorMode.value === 'dark' ? 'dark' : 'light';
        const styles = (clientConfig.value as any).theme?.navigationStyles?.tabPill as any;
        if (!styles?.background) {
            return mode === 'dark' ? 'bg-primary-800' : 'bg-primary-400';
        }
        const background = resolveBgToken(styles.background[mode]) || (mode === 'dark' ? 'bg-primary-800' : 'bg-primary-400');
        const shadow = styles?.shadow || '';
        return `${background} ${shadow}`.trim();
    });

    // Tab text color
    const navigationTabTextClass = computed(() => {
        const mode = colorMode.value === 'dark' ? 'dark' : 'light';
        const styles = (clientConfig.value as any).theme?.navigationStyles?.tabPill as any;
        if (!styles) {
            const { tabTextClass } = useContrastText();
            return tabTextClass;
        }
        return styles.text?.[mode] || styles.text?.light || 'text-gray-900 dark:text-gray-100';
    });

    // Hover state for tabs
    const navigationTabHoverClass = computed(() => {
        const styles = (clientConfig.value as any).theme?.navigationStyles?.tabPill as any;
        if (!styles) {
            return 'hover:bg-primary-500';
        }
        return resolveStateClasses(styles.hover, 'hover') || 'hover:bg-primary-500';
    });

    // Active state for tabs
    const navigationTabActiveClass = computed(() => {
        const styles = (clientConfig.value as any).theme?.navigationStyles?.tabPill as any;
        if (!styles) {
            return 'active:bg-primary-600';
        }
        return resolveStateClasses(styles.active, 'active') || 'active:bg-primary-600';
    });

    // Focus ring class for tabs
    const navigationTabFocusClass = computed(() => {
        const styles = (clientConfig.value as any).theme?.navigationStyles?.tabPill as any;
        if (!styles) {
            return 'focus:ring-primary-300';
        }
        return styles.focus || 'focus:ring-primary-300';
    });

    return {
        navigationBackgroundClass,
        navigationTabPillClass,
        navigationTabTextClass,
        navigationTabHoverClass,
        navigationTabActiveClass,
        navigationTabFocusClass
    };
}

/**
 * Map color utilities (for MapLibre GL compatibility)
 * Reads CSS variables and converts to hex values that MapLibre GL can understand
 */
export function useMapColors() {
    // Helper to read CSS variable value from document
    const getCSSVariableValue = (variable: string): string => {
        if (import.meta.client) {
            const value = getComputedStyle(document.documentElement)
                .getPropertyValue(variable)
                .trim();

            if (value) {
                // Convert RGB values to hex if needed
                const rgbMatch = value.match(/(\d+)\s+(\d+)\s+(\d+)/);
                if (rgbMatch) {
                    const r = parseInt(rgbMatch[1]);
                    const g = parseInt(rgbMatch[2]);
                    const b = parseInt(rgbMatch[3]);
                    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                }
                return value;
            }
        }

        // Fallback colors for SSR or if CSS variables not found
        return variable.includes('primary') ? '#6366f1' : '#a855f7';
    };

    const primaryColor = computed(() => getCSSVariableValue('--color-primary-500'));
    const secondaryColor = computed(() => getCSSVariableValue('--color-secondary-500'));

    /**
     * Get color with opacity for MapLibre GL
     * @param opacity - Opacity value between 0 and 1
     * @returns RGBA color string
     */
    const getPrimaryWithOpacity = (opacity: number = 0.1) => {
        const hex = primaryColor.value;
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return `rgba(99, 102, 241, ${opacity})`; // Fallback
    };

    const getSecondaryWithOpacity = (opacity: number = 0.1) => {
        const hex = secondaryColor.value;
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return `rgba(168, 85, 247, ${opacity})`; // Fallback
    };

    return {
        primaryColor,
        secondaryColor,
        getPrimaryWithOpacity,
        getSecondaryWithOpacity
    };
}

/**
 * Shared theme utilities
 */
export function useThemeUtils() {
    return {
        resolveBgToken,
        resolveStateClasses
    };
}

/**
 * Complete theme colors composable that combines all color utilities
 */
export function useThemeColors(buttonVariant: 'main' | 'tooltip' = 'main') {
    const buttonColors = useButtonColors(buttonVariant);
    const navigationColors = useNavigationColors();
    const mapColors = useMapColors();
    const utils = useThemeUtils();

    return {
        // Button colors
        ...buttonColors,
        // Navigation colors
        ...navigationColors,
        // Map colors (hex values for MapLibre GL)
        ...mapColors,
        // Utilities
        ...utils
    };
}
