/**
 * User Theme Preferences Composable
 *
 * Manages user-specific theme overrides that take priority over jurisdiction settings.
 * Preferences are stored in localStorage and can be toggled on/off.
 *
 * Priority chain:
 * 1. User theme override (if enabled) <- highest
 * 2. Jurisdiction/settings theme
 * 3. Client config theme
 * 4. Default fallback
 */

// Available Tailwind color palettes
export const AVAILABLE_COLORS = {
    primary: [
        { value: 'blue', label: 'Blue', hex: '#3b82f6' },
        { value: 'rose', label: 'Rose', hex: '#f43f5e' },
        { value: 'emerald', label: 'Emerald', hex: '#10b981' },
        { value: 'amber', label: 'Amber', hex: '#f59e0b' },
        { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
        { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
        { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
        { value: 'teal', label: 'Teal', hex: '#14b8a6' },
        { value: 'pink', label: 'Pink', hex: '#ec4899' },
        { value: 'orange', label: 'Orange', hex: '#f97316' }
    ],
    secondary: [
        { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
        { value: 'fuchsia', label: 'Fuchsia', hex: '#d946ef' },
        { value: 'purple', label: 'Purple', hex: '#a855f7' },
        { value: 'amber', label: 'Amber', hex: '#f59e0b' },
        { value: 'rose', label: 'Rose', hex: '#f43f5e' },
        { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
        { value: 'teal', label: 'Teal', hex: '#14b8a6' },
        { value: 'emerald', label: 'Emerald', hex: '#10b981' },
        { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
        { value: 'pink', label: 'Pink', hex: '#ec4899' }
    ],
    neutral: [
        { value: 'slate', label: 'Slate', hex: '#1e293b' }, // 800 shade - blue-gray tint
        { value: 'gray', label: 'Gray', hex: '#1f2937' }, // 800 shade - pure gray
        { value: 'zinc', label: 'Zinc', hex: '#27272a' }, // 800 shade - cool gray
        { value: 'neutral', label: 'Neutral', hex: '#262626' }, // 800 shade - true neutral
        { value: 'stone', label: 'Stone', hex: '#292524' }, // 800 shade - warm gray/brown tint
        // Tailwind v4.2+ neutrals (oklch values from tailwindcss/index.css)
        { value: 'mauve', label: 'Mauve', hex: 'oklch(26.3% 0.024 320.12)' }, // 800 - warm purple-tinted
        { value: 'olive', label: 'Olive', hex: 'oklch(28.6% 0.016 107.4)' }, // 800 - warm green-tinted
        { value: 'mist', label: 'Mist', hex: 'oklch(27.5% 0.011 216.9)' }, // 800 - cool blue-tinted
        { value: 'taupe', label: 'Taupe', hex: 'oklch(26.8% 0.011 36.5)' } // 800 - warm beige
    ]
} as const;

export type PrimaryColor = typeof AVAILABLE_COLORS.primary[number]['value'];
export type SecondaryColor = typeof AVAILABLE_COLORS.secondary[number]['value'];
export type NeutralColor = typeof AVAILABLE_COLORS.neutral[number]['value'];

export interface UserThemePreferences {
    enabled: boolean
    primary: PrimaryColor
    secondary: SecondaryColor
    neutral: NeutralColor
}

const STORAGE_KEY = 'mas-user-theme-preferences';

const DEFAULT_PREFERENCES: UserThemePreferences = {
    enabled: false,
    primary: 'blue',
    secondary: 'violet',
    neutral: 'slate'
};

/**
 * Get color hex value by name
 */
export function getColorHex(type: 'primary' | 'secondary' | 'neutral', value: string): string {
    const colors = AVAILABLE_COLORS[type];
    const found = colors.find(c => c.value === value);
    return found?.hex || '#6366f1';
}

/**
 * User Theme Preferences Composable
 */
export function useUserThemePreferences() {
    // Use useState for SSR-safe singleton pattern
    const preferences = useState<UserThemePreferences>('user-theme-prefs', () => ({ ...DEFAULT_PREFERENCES }));
    const isLoaded = useState<boolean>('user-theme-prefs-loaded', () => false);

    /**
     * Load preferences from localStorage
     */
    const loadPreferences = (): void => {
        if (!import.meta.client) return;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<UserThemePreferences>;
                preferences.value = {
                    enabled: parsed.enabled ?? DEFAULT_PREFERENCES.enabled,
                    primary: parsed.primary ?? DEFAULT_PREFERENCES.primary,
                    secondary: parsed.secondary ?? DEFAULT_PREFERENCES.secondary,
                    neutral: parsed.neutral ?? DEFAULT_PREFERENCES.neutral
                };
                console.log('[UserThemePreferences] Loaded:', preferences.value);
            }
        } catch (err) {
            console.warn('[UserThemePreferences] Failed to load:', err);
        }

        isLoaded.value = true;
    };

    /**
     * Save preferences to localStorage
     */
    const savePreferences = (): void => {
        if (!import.meta.client) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.value));
            console.log('[UserThemePreferences] Saved:', preferences.value);
        } catch (err) {
            console.warn('[UserThemePreferences] Failed to save:', err);
        }
    };

    /**
     * Toggle theme override on/off
     */
    const toggleEnabled = (value?: boolean): void => {
        preferences.value.enabled = value ?? !preferences.value.enabled;
        savePreferences();
    };

    /**
     * Set primary color
     */
    const setPrimaryColor = (color: PrimaryColor): void => {
        preferences.value.primary = color;
        savePreferences();
    };

    /**
     * Set secondary color
     */
    const setSecondaryColor = (color: SecondaryColor): void => {
        preferences.value.secondary = color;
        savePreferences();
    };

    /**
     * Set neutral color
     */
    const setNeutralColor = (color: NeutralColor): void => {
        preferences.value.neutral = color;
        savePreferences();
    };

    /**
     * Reset to default preferences
     */
    const resetPreferences = (): void => {
        preferences.value = { ...DEFAULT_PREFERENCES };
        savePreferences();
    };

    /**
     * Get effective theme (only if override is enabled)
     * Returns null if override is disabled
     */
    const effectiveTheme = computed(() => {
        if (!preferences.value.enabled) return null;
        return {
            primary: preferences.value.primary,
            secondary: preferences.value.secondary,
            neutral: preferences.value.neutral
        };
    });

    // Initialize on client
    if (import.meta.client && !isLoaded.value) {
        loadPreferences();
    }

    return {
        // State
        preferences: readonly(preferences),
        isLoaded: readonly(isLoaded),
        effectiveTheme,

        // Actions
        loadPreferences,
        toggleEnabled,
        setPrimaryColor,
        setSecondaryColor,
        setNeutralColor,
        resetPreferences,

        // Constants
        AVAILABLE_COLORS
    };
}
