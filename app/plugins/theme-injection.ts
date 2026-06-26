/**
 * Theme Injection Plugin
 *
 * Injects CSS variables based on the backend theme configuration.
 * This enables runtime theming without rebuilding the application.
 *
 * Priority chain (highest to lowest):
 * 1. User theme preferences (if enabled) - profile page override
 * 2. Jurisdiction/settings theme - from Drupal group config
 * 3. Client config theme - from default.ts
 * 4. Fallback defaults - blue/violet/slate
 *
 * Runs after config.ts plugin has loaded the configuration.
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/63
 */
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import { useMarkASpotSettings } from '~/composables/core/useMarkASpotSettings';
import { useUserThemePreferences } from '~/composables/core/useUserThemePreferences';
import { isHexColor, generateShadesFromHex, isValidPalette, TAILWIND_COLORS } from '~/utils/colorPalette';

type TailwindPalette = keyof typeof TAILWIND_COLORS;

/**
 * Calculate the relative luminance of a hex color according to WCAG 2.1 specification.
 *
 * The relative luminance is the relative brightness of any point in a colorspace,
 * normalized to 0 for darkest black and 1 for lightest white.
 *
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 * @param hex - A hex color string (supports #rgb, #rrggbb, with or without #)
 * @returns A number between 0 (black) and 1 (white) representing relative luminance.
 *          Returns 0 for invalid input.
 *
 * @example
 * getLuminance('#ffffff') // Returns 1.0 (white)
 * getLuminance('#000000') // Returns 0.0 (black)
 * getLuminance('#3b82f6') // Returns ~0.26 (Tailwind blue-500)
 */
function getLuminance(hex: string): number {
    if (!hex || typeof hex !== 'string') {
        console.warn('[ThemeInjection] getLuminance: Invalid hex color input:', hex);
        return 0;
    }

    // Expand shorthand (#rgb to #rrggbb)
    const expandedHex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expandedHex);

    if (!result) {
        console.warn('[ThemeInjection] getLuminance: Malformed hex color:', hex);
        return 0;
    }

    const [r, g, b] = [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate the contrast ratio between two colors according to WCAG 2.1.
 *
 * Contrast ratio ranges from 1:1 (no contrast) to 21:1 (black on white).
 * WCAG AA requires at least 4.5:1 for normal text, 3:1 for large text.
 * WCAG AAA requires at least 7:1 for normal text, 4.5:1 for large text.
 *
 * @see https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 * @param foreground - Luminance of foreground color (0-1)
 * @param background - Luminance of background color (0-1)
 * @returns Contrast ratio as a number (e.g., 4.5 for 4.5:1)
 */
function getContrastRatio(foreground: number, background: number): number {
    const L1 = Math.max(foreground, background);
    const L2 = Math.min(foreground, background);
    return (L1 + 0.05) / (L2 + 0.05);
}

/**
 * Determine whether text on a given background color should be black or white
 * for optimal contrast according to WCAG accessibility guidelines.
 *
 * Compares the contrast ratio of black (#000000) and white (#ffffff) text
 * against the background color and returns the color with better contrast.
 *
 * @param backgroundColor - A hex color string for the background (#rgb or #rrggbb)
 * @returns 'black' if black text provides better contrast, 'white' otherwise
 *
 * @example
 * getContrastTextColor('#3b82f6') // Returns 'white' (blue background)
 * getContrastTextColor('#fbbf24') // Returns 'black' (bright yellow background)
 * getContrastTextColor('#22c55e') // Returns 'black' (bright green background)
 */
function getContrastTextColor(backgroundColor: string): 'black' | 'white' {
    const bgLuminance = getLuminance(backgroundColor);
    const blackLuminance = 0; // getLuminance('#000000')
    const whiteLuminance = 1; // getLuminance('#ffffff')

    // Calculate contrast ratios
    const blackContrast = getContrastRatio(blackLuminance, bgLuminance);
    const whiteContrast = getContrastRatio(whiteLuminance, bgLuminance);

    // Warn in dev mode if neither option meets WCAG AA (4.5:1)
    if (import.meta.dev) {
        const bestContrast = Math.max(blackContrast, whiteContrast);
        if (bestContrast < 4.5) {
            console.warn(
                `[ThemeInjection] Low contrast warning: Background ${backgroundColor} ` +
                `has contrast ratio ${bestContrast.toFixed(2)}:1 which is below WCAG AA (4.5:1). ` +
                `Consider choosing a darker or lighter primary color.`
            );
        }
    }

    return blackContrast >= whiteContrast ? 'black' : 'white';
}

/**
 * Validates font name to prevent CSS injection.
 * Only allows alphanumeric characters, spaces, hyphens, and quotes.
 */
function isValidFontName(fontName: string): boolean {
    return /^[a-zA-Z0-9\s\-'",]+$/.test(fontName) && fontName.length < 100;
}

/**
 * Resolves a Drupal file path through the fonts proxy.
 * Drupal paths like /sites/default/files/fonts/... are routed through /api/fonts/
 */
function resolveFontUrl(drupalPath: string): string {
    // If already a full URL or data URI, return as-is
    if (drupalPath.startsWith('http://') || drupalPath.startsWith('https://') || drupalPath.startsWith('data:')) {
        return drupalPath;
    }
    // If it's a Drupal file path, route through fonts proxy
    if (drupalPath.startsWith('/sites/') || drupalPath.includes('files/')) {
        const cleanPath = drupalPath.startsWith('/') ? drupalPath.substring(1) : drupalPath;
        return `/api/fonts/${cleanPath}`;
    }
    // Return as-is for other paths
    return drupalPath;
}

/**
 * Sanitizes custom CSS to prevent XSS attacks (defense-in-depth).
 * Backend already sanitizes, but this provides additional client-side protection.
 */
function sanitizeCustomCSS(css: string): string {
    const dangerousPatterns = [
        /@import/gi,
        /expression\s*\(/gi,
        /javascript\s*:/gi,
        /behavior\s*:/gi,
        /-moz-binding\s*:/gi,
        /<\s*script/gi
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(css)) {
            console.error('[ThemeInjection] Blocked dangerous CSS pattern:', pattern);
            return '/* blocked: dangerous pattern detected */';
        }
    }

    // Block external URLs in url() - allow relative and data: URIs
    css = css.replace(
        /url\s*\(\s*["']?(https?:\/\/[^"')\s]+)["']?\s*\)/gi,
        '/* external url blocked */'
    );

    return css;
}

/**
 * Generate CSS that maps semantic colors to actual palette values
 * Supports both Tailwind palette names (blue, cyan, etc.) and HEX colors (#3b82f6)
 */
function generatePaletteMapping(semantic: string, palette: string): string {
    let colors: Record<string, string>;

    // Check if it's a HEX color
    if (isHexColor(palette)) {
        if (import.meta.dev) {
            console.log(`[ThemeInjection] Generating shades from HEX color: ${palette}`);
        }
        try {
            colors = generateShadesFromHex(palette);
        } catch (error) {
            console.error(`[ThemeInjection] Failed to generate shades from HEX "${palette}":`, error);
            colors = TAILWIND_COLORS.blue; // Fallback
        }
    } else if (isValidPalette(palette)) {
        // Valid Tailwind palette name
        colors = TAILWIND_COLORS[palette];
    } else {
        // Invalid input - fallback to blue
        console.warn(`[ThemeInjection] Invalid palette "${palette}", falling back to blue`);
        colors = TAILWIND_COLORS.blue;
    }

    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

    return shades
        .map(shade => `--color-${semantic}-${shade}: ${colors[shade]};`)
        .join('\n      ');
}

/**
 * Generate complete theme CSS from config
 * Supports both flat structure (primary, secondary) and nested (colors.primary, colors.secondary)
 * Supports both Tailwind palette names and HEX colors
 */
function generateThemeCSS(theme: { primary?: string, secondary?: string, neutral?: string, colors?: { primary?: string, secondary?: string, neutral?: string } }): string {
    // Support both flat (from API) and nested (from merged config) structures
    const primary = theme.colors?.primary || theme.primary || 'blue';
    const secondary = theme.colors?.secondary || theme.secondary || 'violet';
    const neutral = theme.colors?.neutral || theme.neutral || 'slate';

    // Helper to get color palette (handles both Tailwind names and HEX)
    const getColorPalette = (color: string, fallback: string): Record<string, string> => {
        if (isHexColor(color)) {
            try {
                return generateShadesFromHex(color);
            } catch (error) {
                console.error(`[ThemeInjection] Failed to generate shades from HEX "${color}":`, error);
                return TAILWIND_COLORS[fallback as TailwindPalette];
            }
        }
        return TAILWIND_COLORS[isValidPalette(color) ? color : fallback];
    };

    // Get the actual color values for Nuxt UI sync
    const primaryColors = getColorPalette(primary, 'blue');
    const neutralColors = getColorPalette(neutral, 'slate');

    // Calculate contrasting text color for primary backgrounds (WCAG compliant)
    // Use actual black/white for best contrast, not neutral palette (which could be any color)
    const primaryTextColor = getContrastTextColor(primaryColors['500']);
    const invertedTextValue = primaryTextColor === 'black' ? '#000000' : '#ffffff';

    if (import.meta.dev) {
        console.log(`[ThemeInjection] Primary color ${primaryColors['500']} needs ${primaryTextColor} text for contrast`);
    }

    // Use html:root for higher specificity to override Nuxt UI's :root declarations
    return `
    html:root {
      /* Primary palette mapping - runtime theme override */
      ${generatePaletteMapping('primary', primary)}

      /* Dynamic inverted text color for primary backgrounds (accessibility) */
      --ui-text-inverted: ${invertedTextValue};

      /* Secondary palette mapping */
      ${generatePaletteMapping('secondary', secondary)}

      /* Neutral palette mapping */
      ${generatePaletteMapping('neutral', neutral)}

      /* Nuxt UI primary color sync - using actual values */
      --ui-primary: ${primaryColors['500']};
      --ui-color-primary-50: ${primaryColors['50']};
      --ui-color-primary-100: ${primaryColors['100']};
      --ui-color-primary-200: ${primaryColors['200']};
      --ui-color-primary-300: ${primaryColors['300']};
      --ui-color-primary-400: ${primaryColors['400']};
      --ui-color-primary-500: ${primaryColors['500']};
      --ui-color-primary-600: ${primaryColors['600']};
      --ui-color-primary-700: ${primaryColors['700']};
      --ui-color-primary-800: ${primaryColors['800']};
      --ui-color-primary-900: ${primaryColors['900']};
      --ui-color-primary-950: ${primaryColors['950']};

      /* Nuxt UI neutral color sync - using actual values */
      --ui-color-neutral-50: ${neutralColors['50']};
      --ui-color-neutral-100: ${neutralColors['100']};
      --ui-color-neutral-200: ${neutralColors['200']};
      --ui-color-neutral-300: ${neutralColors['300']};
      --ui-color-neutral-400: ${neutralColors['400']};
      --ui-color-neutral-500: ${neutralColors['500']};
      --ui-color-neutral-600: ${neutralColors['600']};
      --ui-color-neutral-700: ${neutralColors['700']};
      --ui-color-neutral-800: ${neutralColors['800']};
      --ui-color-neutral-900: ${neutralColors['900']};
      --ui-color-neutral-950: ${neutralColors['950']};

      /* Nuxt UI semantic colors that depend on neutral - light mode */
      --ui-bg-muted: ${neutralColors['50']};
      --ui-bg-elevated: ${neutralColors['100']};
      --ui-bg-accented: ${neutralColors['200']};
      --ui-bg-inverted: ${neutralColors['900']};
      --ui-border: ${neutralColors['200']};
      --ui-border-muted: ${neutralColors['200']};
      --ui-border-accented: ${neutralColors['300']};
      --ui-border-inverted: ${neutralColors['900']};
      --ui-text-dimmed: ${neutralColors['400']};
      --ui-text-muted: ${neutralColors['500']};
      --ui-text-toned: ${neutralColors['600']};
      --ui-text: ${neutralColors['700']};
      --ui-text-highlighted: ${neutralColors['900']};
    }

    /* Dark mode neutral overrides */
    html:root.dark, html.dark:root {
      --ui-bg-muted: ${neutralColors['900']};
      --ui-bg-elevated: ${neutralColors['800']};
      --ui-bg-accented: ${neutralColors['700']};
      --ui-bg-inverted: ${neutralColors['50']};
      --ui-border: ${neutralColors['800']};
      --ui-border-muted: ${neutralColors['700']};
      --ui-border-accented: ${neutralColors['700']};
      --ui-text-dimmed: ${neutralColors['500']};
      --ui-text-muted: ${neutralColors['400']};
      --ui-text-toned: ${neutralColors['300']};
      --ui-text: ${neutralColors['200']};
      --ui-text-highlighted: white;
    }
  `.trim();
}

export default defineNuxtPlugin({
    name: 'mas-theme-injection',
    enforce: 'post', // Run after config plugin
    dependsOn: ['mas-config'],

    setup(nuxtApp) {
        const { theme: configTheme, isReady, isPending } = useMarkASpotConfig();
        const { settings } = useMarkASpotSettings();
        const { effectiveTheme: userTheme, preferences: userPrefs } = useUserThemePreferences();

        // Single consolidated CSS ref for all theme styles.
        // Using one style tag avoids a useHead SSR bug where only the first of
        // multiple style entries gets its reactive content rendered to HTML.
        const allThemeCSS = ref('');

        useHead({
            style: [
                {
                    id: 'mas-runtime-theme',
                    innerHTML: allThemeCSS
                }
            ]
        });

        // Get effective theme with priority chain:
        // 1. User preferences (if enabled) > 2. Settings/jurisdiction > 3. Config > 4. Fallback
        const getEffectiveTheme = () => {
            // User theme preferences have highest priority (if enabled)
            if (userTheme.value) {
                if (import.meta.dev) {
                    console.log('[ThemeInjection] Using user theme preferences:', userTheme.value);
                }
                return userTheme.value;
            }

            // Settings theme (from /api/mark-a-spot-settings with jurisdiction) has second priority
            if (settings.value?.theme) {
                return settings.value.theme;
            }
            // Fallback to config theme
            return configTheme.value;
        };

        // Function to update theme CSS
        const updateThemeCSS = () => {
            const cssParts: string[] = [];

            // 1. Theme palette CSS (colors, contrast overrides)
            const theme = getEffectiveTheme();
            if (theme) {
                if (import.meta.dev) {
                    console.log('[ThemeInjection] Applying theme:', theme);
                }
                cssParts.push(generateThemeCSS(theme));
            }

            // 2. Font CSS variables (--font-heading, --font-body) as client-side fallback.
            // @font-face declarations and CSS vars are primarily delivered via
            // <link rel="stylesheet" href="/api/fonts.css"> (set by 01.jurisdiction-ssr.ts).
            // This block provides the CSS vars as fallback for client-side navigation
            // where the SSR stylesheet link may not re-execute.
            const settingsTheme = settings.value?.theme;
            const fonts = settingsTheme?.fonts;
            if (fonts?.heading || fonts?.body) {
                const fontVars: string[] = [];

                if (fonts.heading && isValidFontName(fonts.heading)) {
                    fontVars.push(`--font-heading: ${fonts.heading}, system-ui, sans-serif;`);
                }
                if (fonts.body && isValidFontName(fonts.body)) {
                    fontVars.push(`--font-body: ${fonts.body}, system-ui, sans-serif;`);
                }

                if (fontVars.length > 0) {
                    cssParts.push(`html:root {\n  ${fontVars.join('\n  ')}\n}`);
                    if (import.meta.dev) {
                        console.log('[ThemeInjection] Font vars fallback:', fontVars);
                    }
                }
            }

            // 3. Custom CSS (@font-face, color overrides) from jurisdiction config.
            // Injected here because the fonts.css <link> from 01.jurisdiction-ssr.ts
            // does not reliably load in production single-tenant mode.
            const customCss = settingsTheme?.customCss ||
              settings.value?.customCss;
            if (customCss && typeof customCss === 'string') {
                cssParts.push(customCss);
            }

            // Combine all parts into single style tag
            allThemeCSS.value = cssParts.join('\n\n');
        };

        // SSR: Apply immediately if config is ready
        if (isReady.value) {
            updateThemeCSS();
        }

        // Handle case where config is still loading (plugin dependency not guaranteed)
        // Client-only to prevent SSR memory leaks
        if (import.meta.client && isPending.value) {
            const unwatch = watch(isReady, (ready) => {
                if (ready) {
                    updateThemeCSS();
                    unwatch(); // Clean up watcher after first successful load
                }
            });
        }

        // Client-only: Watch for theme changes from both sources
        // IMPORTANT: These watchers MUST be client-only to prevent SSR memory leaks
        if (import.meta.client) {
            // Watch config theme
            watch(
                () => configTheme.value,
                (newTheme, oldTheme) => {
                    if (import.meta.dev) {
                        console.log('[ThemeInjection] Config theme changed:', {
                            old: oldTheme,
                            new: newTheme
                        });
                    }
                    updateThemeCSS();
                },
                { immediate: !isReady.value, deep: true }
            );

            // Watch settings theme (jurisdiction-specific)
            watch(
                () => settings.value?.theme,
                (newTheme, oldTheme) => {
                    if (import.meta.dev) {
                        console.log('[ThemeInjection] Settings theme changed:', {
                            old: oldTheme,
                            new: newTheme
                        });
                    }
                    if (newTheme) {
                        updateThemeCSS();
                    }
                },
                { deep: true }
            );

            // Watch user theme preferences (highest priority)
            // This single watch handles both color changes AND enable/disable toggle
            // because effectiveTheme is a computed that depends on preferences.enabled
            watch(
                () => userTheme.value,
                (newTheme, oldTheme) => {
                    if (import.meta.dev) {
                        console.log('[ThemeInjection] User theme preferences changed:', {
                            old: oldTheme,
                            new: newTheme,
                            enabled: userPrefs.value.enabled
                        });
                    }
                    updateThemeCSS();
                },
                { deep: true }
            );
        }
    }
});
