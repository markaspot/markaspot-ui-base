/**
 * Color Palette Utilities
 *
 * Shared functions for HEX-to-HSL conversion, palette generation from
 * a single HEX color, HEX validation, and CSS sanitization.
 *
 * Extracted from theme-injection.ts so they can be reused in the
 * branding settings page and other components.
 */

/**
 * Tailwind CSS v4 color palettes with actual hex values.
 * Single source of truth for resolving palette names to hex colors.
 * Used by theme-injection.ts (client) and server/utils/color-resolver.ts (server).
 */
export const TAILWIND_COLORS: Record<string, Record<string, string>> = {
    slate: {
        50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
        500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617'
    },
    gray: {
        50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af',
        500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712'
    },
    zinc: {
        50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa',
        500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b'
    },
    neutral: {
        50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3',
        500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717', 950: '#0a0a0a'
    },
    stone: {
        50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e',
        500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917', 950: '#0c0a09'
    },
    // Tailwind v4.2+ warm/organic neutrals.
    mauve: {
        50: '#fafafa', 100: '#f3f1f3', 200: '#e7e4e7', 300: '#d7d0d7', 400: '#a89ea9',
        500: '#79697b', 600: '#594c5b', 700: '#463947', 800: '#2a212c', 900: '#1d161e', 950: '#0c090c'
    },
    olive: {
        50: '#fbfbf9', 100: '#f4f4f0', 200: '#e8e8e3', 300: '#d8d8d0', 400: '#abab9c',
        500: '#7c7c67', 600: '#5b5b4b', 700: '#474739', 800: '#2b2b22', 900: '#1d1d16', 950: '#0c0c09'
    },
    mist: {
        50: '#f9fbfb', 100: '#f1f3f3', 200: '#e3e7e8', 300: '#d0d6d8', 400: '#9ca8ab',
        500: '#67787c', 600: '#4b585b', 700: '#394447', 800: '#22292b', 900: '#161b1d', 950: '#090b0c'
    },
    taupe: {
        50: '#fbfaf9', 100: '#f3f1f1', 200: '#e8e4e3', 300: '#d8d2d0', 400: '#aba09c',
        500: '#7c6d67', 600: '#5b4f4b', 700: '#473c39', 800: '#2b2422', 900: '#1d1816', 950: '#0c0a09'
    },
    red: {
        50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
        500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a'
    },
    orange: {
        50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
        500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407'
    },
    amber: {
        50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
        500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03'
    },
    yellow: {
        50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15',
        500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12', 950: '#422006'
    },
    lime: {
        50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 400: '#a3e635',
        500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', 800: '#3f6212', 900: '#365314', 950: '#1a2e05'
    },
    green: {
        50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
        500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16'
    },
    emerald: {
        50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
        500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22'
    },
    teal: {
        50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
        500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e'
    },
    cyan: {
        50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee',
        500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344'
    },
    sky: {
        50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8',
        500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49'
    },
    blue: {
        50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
        500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
    },
    indigo: {
        50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
        500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
    },
    violet: {
        50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
        500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
    },
    purple: {
        50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc',
        500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764'
    },
    fuchsia: {
        50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9',
        500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75', 950: '#4a044e'
    },
    pink: {
        50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6',
        500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843', 950: '#500724'
    },
    rose: {
        50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
        500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519'
    }
};

/**
 * Valid Tailwind CSS palette names that can be used as theme colors.
 */
export const TAILWIND_PALETTE_NAMES = [
    'slate', 'gray', 'zinc', 'neutral', 'stone',
    // Tailwind v4.2+ warm/organic neutrals.
    'mauve', 'olive', 'mist', 'taupe',
    'red', 'orange', 'amber', 'yellow', 'lime',
    'green', 'emerald', 'teal', 'cyan', 'sky',
    'blue', 'indigo', 'violet', 'purple', 'fuchsia',
    'pink', 'rose'
] as const;

export type TailwindPaletteName = typeof TAILWIND_PALETTE_NAMES[number];

/**
 * Check if a string is a valid Tailwind palette name.
 */
export function isValidPalette(name: string): name is TailwindPaletteName {
    return name in TAILWIND_COLORS;
}

/**
 * Resolve a color value (Tailwind name or hex) to a hex string.
 * Used for theme-color meta, manifest theme_color, etc.
 */
export function resolveColorToHex(color: string, shade: string = '500'): string {
    if (isHexColor(color)) return color;
    return TAILWIND_COLORS[color]?.[shade] ?? '#000000';
}

/**
 * Check if a string is a valid HEX color (#rgb or #rrggbb).
 */
export function isHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{3}){1,2}$/.test(color);
}

/**
 * Convert a HEX color to HSL (Hue, Saturation, Lightness) color space.
 *
 * @param hex - A hex color string (#rgb or #rrggbb)
 * @returns An object with h (0-360), s (0-100), and l (0-100) values
 * @throws {Error} If the hex color format is invalid
 */
export function hexToHSL(hex: string): { h: number, s: number, l: number } {
    if (!hex || typeof hex !== 'string') {
        throw new Error(`Invalid hex color input: ${hex}`);
    }

    // Expand shorthand form (#rgb to #rrggbb)
    const expandedHex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expandedHex);
    if (!result) {
        throw new Error(`Malformed hex color: ${hex}. Expected format: #rgb or #rrggbb`);
    }

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to HEX.
 */
export function hslToHex(h: number, s: number, l: number): string {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a complete color palette (11 shades from 50-950) from a single HEX color.
 *
 * Uses HSL color space manipulation to create lighter and darker variations
 * while preserving the hue. The 500 shade stays close to the original color.
 *
 * @param hex - A hex color string (#rgb or #rrggbb)
 * @returns An object mapping shade names ('50', '100', ..., '950') to hex colors
 */
export function generateShadesFromHex(hex: string): Record<string, string> {
    if (!hex || !isHexColor(hex)) {
        console.warn('[colorPalette] generateShadesFromHex: Invalid hex color, using blue fallback:', hex);
        // Return a basic blue palette as fallback
        return {
            50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
            500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
        };
    }

    const { h, s, l } = hexToHSL(hex);

    // Mapping: shade -> lightness adjustment
    // 500 stays close to original, 50 very light, 950 very dark
    const lightnessMap: Record<string, number> = {
        50: 96,
        100: 92,
        200: 84,
        300: 72,
        400: 58,
        500: l,
        600: Math.max(l - 15, 30),
        700: Math.max(l - 25, 22),
        800: Math.max(l - 35, 15),
        900: Math.max(l - 45, 10),
        950: 6
    };

    const shades: Record<string, string> = {};

    for (const [shade, targetLightness] of Object.entries(lightnessMap)) {
        // Adjust saturation slightly for extreme lightness values
        let adjustedS = s;
        if (targetLightness > 90) {
            adjustedS = s * 0.5;
        } else if (targetLightness < 15) {
            adjustedS = s * 0.7;
        }

        shades[shade] = hslToHex(h, adjustedS, targetLightness);
    }

    return shades;
}

/**
 * Sanitize custom CSS to prevent XSS attacks (defense-in-depth).
 * Backend already sanitizes, but this provides additional client-side protection.
 *
 * @returns Object with valid flag and optional error message
 */
export function sanitizeCustomCSS(css: string): { valid: boolean, error?: string } {
    const dangerousPatterns: Array<{ pattern: RegExp, label: string }> = [
        { pattern: /@import/gi, label: '@import' },
        { pattern: /expression\s*\(/gi, label: 'expression()' },
        { pattern: /javascript\s*:/gi, label: 'javascript:' },
        { pattern: /behavior\s*:/gi, label: 'behavior:' },
        { pattern: /-moz-binding\s*:/gi, label: '-moz-binding:' },
        { pattern: /<\s*script/gi, label: '<script>' }
    ];

    for (const { pattern, label } of dangerousPatterns) {
        if (pattern.test(css)) {
            return { valid: false, error: `Blocked pattern: ${label}` };
        }
    }

    // Check for external URLs in url()
    if (/url\s*\(\s*["']?(https?:\/\/)/gi.test(css)) {
        return { valid: false, error: 'External URLs are not allowed' };
    }

    return { valid: true };
}

/**
 * Compute a deterministic short hash from splash screen render inputs.
 *
 * Must match the server-side implementation in server/utils/splash-generator.ts
 * so that SSR-generated splash URLs align with the server route's canonical hash.
 *
 * @returns 6-char base36 hash
 */
export function computeSplashHash(neutralHex: string, primaryHex: string, logoPath: string): string {
    let h = 0;
    const s = `${neutralHex}-${primaryHex}-${logoPath}`;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return (h >>> 0).toString(36).padStart(6, '0').slice(0, 6);
}
