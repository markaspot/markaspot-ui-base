/**
 * Calculate relative luminance of a HEX color (WCAG 2.1).
 * @param hex - The hex color code (with or without #).
 * @returns Relative luminance value between 0 and 1.
 */
export function getLuminance(hex: string): number {
    const rgb = hex.replace('#', '').match(/\w\w/g)!.map(c => parseInt(c, 16) / 255);
    return rgb.map(v =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    ).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i]!, 0);
}

/**
 * Invert a HEX color or return black/white for maximum contrast.
 * Uses perceived brightness formula (ITU-R BT.601), not WCAG luminance.
 * @param hex - The hex color to invert.
 * @param bw - Whether to return only black or white for best contrast.
 * @returns The inverted color or black/white for best contrast.
 */
export function invertColor(hex: string, bw: boolean): string {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
        console.warn('Invalid hex color detected:', hex);
        return bw ? '#000000' : '#ffffff';
    }

    hex = hex.slice(1);
    const isShortHex = hex.length === 3;

    const r = parseInt(isShortHex ? hex[0]! + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(isShortHex ? hex[1]! + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(isShortHex ? hex[2]! + hex[2] : hex.substring(4, 6), 16);

    return bw
        ? (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#ffffff'
        : `#${((1 << 24) + ((255 - r) << 16) + ((255 - g) << 8) + (255 - b)).toString(16).slice(1)}`;
}

/**
 * Calculate the contrast ratio between two colors (WCAG 2.1).
 * @param color1 - First color (hex format with #).
 * @param color2 - Second color (hex format with #).
 * @returns The contrast ratio (1:1 to 21:1).
 */
export function getContrastRatio(color1: string, color2: string): number {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastTextOptions {
    /** Minimum contrast ratio required (default: 4.5 for WCAG AA). */
    minContrast?: number
    /** Dark text color (default: '#000000'). */
    darkColor?: string
    /** Light text color (default: '#ffffff'). */
    lightColor?: string
    /**
     * Whether the UI is in dark mode. In dark mode, prefers light text on
     * medium-luminance backgrounds to avoid the "black-on-gray-in-dark-UI"
     * anti-pattern (e.g. #808080 → black text is technically WCAG-valid
     * but looks wrong on a dark-mode canvas).
     */
    isDark?: boolean
}

/**
 * Get the best text color (black or white) for a background color based on WCAG contrast guidelines.
 * @param bgColor - Background color in hex format (with #).
 * @param options - Configuration options.
 * @returns The recommended text color (#000000 or #ffffff).
 */
export function getContrastingTextColor(bgColor: string, options: ContrastTextOptions = {}): string {
    const {
        minContrast = 4.5,
        darkColor = '#000000',
        lightColor = '#ffffff',
        isDark = false
    } = options;

    if (!bgColor || typeof bgColor !== 'string' || !bgColor.startsWith('#')) {
        console.warn('Invalid background color:', bgColor);
        return lightColor;
    }

    const darkContrast = getContrastRatio(bgColor, darkColor);
    const lightContrast = getContrastRatio(bgColor, lightColor);

    // In dark mode, prefer light text unless dark is clearly superior (>1.5x better).
    // This prevents "black text on medium-gray badge in a dark UI" -- technically WCAG-compliant
    // but visually inconsistent with dark-mode conventions.
    if (isDark && lightContrast >= 3.0 && darkContrast <= lightContrast * 1.5) {
        return lightColor;
    }

    if (darkContrast >= minContrast && darkContrast >= lightContrast) {
        return darkColor;
    } else if (lightContrast >= minContrast && lightContrast >= darkContrast) {
        return lightColor;
    }

    return darkContrast > lightContrast ? darkColor : lightColor;
}

/**
 * Get the computed value of a CSS custom property.
 * @param propertyName - CSS custom property name (e.g., '--color-neutral-default').
 * @returns The computed color value, or gray-500 fallback on SSR.
 */
export function getCSSVariable(propertyName: string): string {
    if (typeof window === 'undefined') {
        return '#6b7280'; // SSR fallback: Tailwind gray-500
    }
    return getComputedStyle(document.documentElement)
        .getPropertyValue(propertyName)
        .trim();
}

/**
 * Get neutral color that adapts to light/dark mode via CSS variables.
 * @param variant - 'default' | 'light' | 'medium' | 'soft'
 */
export function getNeutralColor(variant: 'default' | 'light' | 'medium' | 'soft' = 'default'): string {
    return getCSSVariable(`--color-neutral-${variant}`);
}

/**
 * Fallback hex colors for contexts where CSS variables aren't available
 * (SSR, canvas operations before DOM is ready).
 */
export const NEUTRAL_FALLBACKS = {
    DEFAULT: '#6b7280', // gray-500
    LIGHT: '#9ca3af', // gray-400
    MEDIUM: '#4b5563', // gray-600
    SOFT: '#d1d5db' // gray-300
} as const;
