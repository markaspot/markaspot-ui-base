/**
 * Composable for calculating contrasting text colors on different backgrounds.
 *
 * This utility dynamically determines the best text color (black or white)
 * based on the background color's luminance to ensure WCAG AA compliance.
 *
 * @example
 * // Button with primary background
 * <button class="bg-primary">
 *   <span :class="buttonTextClass('primary')">Button Text</span>
 * </button>
 */
export function useContrastText() {
    /**
     * Calculate luminance of a color
     * @param r Red value (0-255)
     * @param g Green value (0-255)
     * @param b Blue value (0-255)
     * @returns Relative luminance value
     */
    const getLuminance = (r: number, g: number, b: number) => {
        const [rs, gs, bs] = [r, g, b].map((c) => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    /**
     * Calculate contrast ratio between two colors
     * @param l1 Luminance of color 1
     * @param l2 Luminance of color 2
     * @returns Contrast ratio
     */
    const getContrastRatio = (l1: number, l2: number) => {
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    };

    /**
     * Parse RGB values from a CSS color string
     * @param color Color string (hex or rgb)
     * @returns RGB values or null
     */
    const parseColor = (color: string): { r: number, g: number, b: number } | null => {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 3) {
                const r = parseInt(hex[0] + hex[0], 16);
                const g = parseInt(hex[1] + hex[1], 16);
                const b = parseInt(hex[2] + hex[2], 16);
                return { r, g, b };
            } else if (hex.length === 6) {
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                return { r, g, b };
            }
        }
        // Handle rgb() colors
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3])
            };
        }
        return null;
    };

    /**
     * Get the computed color value for a CSS variable
     * @param varName CSS variable name (e.g., '--color-primary')
     * @returns Resolved color value or null
     */
    const getCSSVariableColor = (varName: string): string | null => {
        if (typeof window === 'undefined') return null;
        const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return value || null;
    };

    /**
     * Determine if text should be black or white based on background luminance
     * @param backgroundColor Background color value
     * @returns 'black' or 'white'
     */
    const getContrastingTextColor = (backgroundColor: string): 'black' | 'white' => {
        const rgb = parseColor(backgroundColor);
        if (!rgb) return 'black'; // Default to black if parsing fails

        const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
        const blackContrast = getContrastRatio(luminance, 0); // Black has luminance 0
        const whiteContrast = getContrastRatio(luminance, 1); // White has luminance 1

        // Choose the color with better contrast, preferring black for tie
        return blackContrast >= whiteContrast ? 'black' : 'white';
    };

    /**
     * Get appropriate text color class for a button
     * Returns consistent classes that work with Tailwind's build process
     * @param colorType 'primary' or 'secondary'
     * @returns Tailwind text classes for optimal contrast
     */
    const buttonTextClass = (colorType: 'primary' | 'secondary' = 'primary') => {
        // Map controls sit on .map-control (bg-white dark:bg-black) - neutral background.
        // Use Nuxt UI 4 semantic utility: text-highlighted = var(--ui-text-highlighted)
        // which resolves to neutral-900 in light mode and white in dark mode,
        // adapting to the configured neutral color palette.
        return 'text-highlighted';
    };

    /**
   * Get text color for navigation tabs
   * @param isActive Whether the tab is active
   * @returns Tailwind text classes
   */
    const tabTextClass = (isActive: boolean = false) => {
        if (isActive) {
            // Active tab sits on bg-primary-400/950 - use text-inverted (WCAG auto-contrast)
            return 'text-inverted font-semibold';
        } else {
            return 'text-primary-900 dark:text-highlighted hover:text-primary-900 dark:hover:text-highlighted';
        }
    };

    return {
        buttonTextClass,
        tabTextClass
    };
}
