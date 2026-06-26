/**
 * Dynamic icon registry for handling Drupal-provided icon classes
 */

interface IconMapping {
    [key: string]: string
}

interface IconSet {
    name: string
    prefix: string
    icons: IconMapping
    loaded: boolean
}

// Global state for icon registry
const iconSets = ref<Map<string, IconSet>>(new Map());
const loadingIcons = ref<Set<string>>(new Set());
const iconCache = ref<Map<string, string>>(new Map());

export function useIconRegistry() {
    /**
   * Register an icon set (e.g., FontAwesome, Heroicons)
   */
    const registerIconSet = (name: string, prefix: string, icons: IconMapping = {}) => {
        iconSets.value.set(name, {
            name,
            prefix,
            icons,
            loaded: false
        });
    };

    /**
   * Load icon set dynamically based on usage
   */
    const loadIconSet = async (setName: string): Promise<boolean> => {
        if (loadingIcons.value.has(setName)) {
            // Already loading, wait for completion
            return new Promise((resolve) => {
                const checkLoaded = () => {
                    const iconSet = iconSets.value.get(setName);
                    if (iconSet?.loaded || !loadingIcons.value.has(setName)) {
                        resolve(iconSet?.loaded || false);
                    } else {
                        setTimeout(checkLoaded, 50);
                    }
                };
                checkLoaded();
            });
        }

        if (iconSets.value.get(setName)?.loaded) {
            return true;
        }

        loadingIcons.value.add(setName);

        try {
            // Dynamic import based on icon set
            let iconData: IconMapping = {};

            switch (setName) {
                case 'fontawesome':
                    // Load FontAwesome mappings (commonly used in Drupal)
                    iconData = await loadFontAwesomeIcons();
                    break;
                case 'heroicons':
                    // Load Heroicons (already available via @nuxt/ui)
                    iconData = await loadHeroicons();
                    break;
                case 'custom':
                    // Load custom client icons
                    iconData = await loadCustomIcons();
                    break;
                default:
                    console.warn(`Unknown icon set: ${setName}`);
                    return false;
            }

            const iconSet = iconSets.value.get(setName);
            if (iconSet) {
                iconSet.icons = { ...iconSet.icons, ...iconData };
                iconSet.loaded = true;
            }

            return true;
        } catch (error) {
            console.error(`Failed to load icon set ${setName}:`, error);
            return false;
        } finally {
            loadingIcons.value.delete(setName);
        }
    };

    /**
   * Resolve Drupal icon class to usable icon identifier
   */
    const resolveIcon = async (drupalIconClass: string): Promise<string | null> => {
    // Check cache first
        if (iconCache.value.has(drupalIconClass)) {
            return iconCache.value.get(drupalIconClass) || null;
        }

        // Parse Drupal icon class (e.g., "fa-home", "fa-solid fa-user")
        const iconInfo = parseIconClass(drupalIconClass);
        if (!iconInfo) {
            console.warn(`Cannot parse icon class: ${drupalIconClass}`);
            return null;
        }

        const { set, iconName } = iconInfo;

        // Ensure icon set is loaded
        const loaded = await loadIconSet(set);
        if (!loaded) {
            return null;
        }

        // Resolve icon
        const iconSet = iconSets.value.get(set);
        const resolvedIcon = iconSet?.icons[iconName] || iconName;

        // Cache the result
        iconCache.value.set(drupalIconClass, resolvedIcon);

        return resolvedIcon;
    };

    /**
   * Parse icon class from Drupal (handles FA, custom, etc.)
   */
    const parseIconClass = (iconClass: string): { set: string, iconName: string } | null => {
    // Handle FontAwesome classes
        if (iconClass.startsWith('fa-')) {
            return {
                set: 'fontawesome',
                iconName: iconClass
            };
        }

        // Handle Heroicons (if using custom mapping)
        if (iconClass.startsWith('hero-')) {
            return {
                set: 'heroicons',
                iconName: iconClass.replace('hero-', '')
            };
        }

        // Handle custom icons
        if (iconClass.startsWith('custom-')) {
            return {
                set: 'custom',
                iconName: iconClass.replace('custom-', '')
            };
        }

        // Default to custom set for unknown patterns
        return {
            set: 'custom',
            iconName: iconClass
        };
    };

    /**
   * Preload commonly used icons
   */
    const preloadCommonIcons = async (iconClasses: string[]) => {
        const promises = iconClasses.map(iconClass => resolveIcon(iconClass));
        await Promise.allSettled(promises);
    };

    /**
   * Get icon component name for Nuxt UI
   */
    const getIconComponent = (resolvedIcon: string, set = 'heroicons'): string => {
        switch (set) {
            case 'heroicons':
                return `i-heroicons-${resolvedIcon}`;
            case 'fontawesome':
                // Use local icons from /public/icons/ instead of external Iconify
                return `/icons/${resolvedIcon}.svg`;
            default:
                return `i-heroicons-${resolvedIcon}`;
        }
    };

    return {
    // State
        iconSets: computed(() => iconSets.value),
        isLoading: (setName: string) => loadingIcons.value.has(setName),

        // Methods
        registerIconSet,
        loadIconSet,
        resolveIcon,
        preloadCommonIcons,
        getIconComponent,

        // Utilities
        clearCache: () => iconCache.value.clear(),
        getCacheSize: () => iconCache.value.size
    };
}

/**
 * Load FontAwesome icon mappings
 */
async function loadFontAwesomeIcons(): Promise<IconMapping> {
    // Map FontAwesome icon classes to local SVG files in /public/icons/
    // Remove fa- prefix since the files are named without it
    return {
        'fa-home': 'home',
        'fa-user': 'user',
        'fa-envelope': 'envelope',
        'fa-phone': 'phone',
        'fa-map-marker': 'map-marker',
        'fa-calendar': 'calendar',
        'fa-clock': 'clock',
        'fa-camera': 'camera',
        'fa-file': 'file',
        'fa-search': 'search',
        'fa-trash': 'trash',
        'fa-trash-o': 'trash-o',
        'fa-edit': 'edit',
        'fa-plus': 'plus',
        'fa-minus': 'minus',
        'fa-check': 'check',
        'fa-times': 'times',
        'fa-info': 'info',
        'fa-warning': 'warning',
        'fa-error': 'error',
        'fa-envira': 'envira',
        'fa-tint': 'tint'
        // Add more mappings as needed for icons available in /public/icons/
    };
}

/**
 * Load Heroicons mappings
 */
async function loadHeroicons(): Promise<IconMapping> {
    // Heroicons are already available via @nuxt/ui
    // Return identity mapping
    return {};
}

/**
 * Load custom client icons
 */
async function loadCustomIcons(): Promise<IconMapping> {
    // Load custom icon mappings from client config or API
    return {};
}
