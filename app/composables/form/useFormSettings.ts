// composables/useFormSettings.ts
import { useApiClient } from '../api/useApiClient';

// Define the type for form field configuration
interface FieldConfig {
    label?: string
    description?: string
    required?: boolean
    validation_message?: string
    widget_settings?: {
        placeholder?: string
        [key: string]: unknown
    }
    [key: string]: unknown
}

// Define the type for the form configuration
interface FormConfig {
    entity_type: string
    bundle: string
    form_mode: string
    fields: {
        [fieldName: string]: FieldConfig
    }
}

// Cache structure for localStorage
interface CachedFormSettings {
    data: FormConfig
    timestamp: number
    version: string
}

// Module-level pending promise to deduplicate concurrent requests
let pendingFetch: Promise<FormConfig | null> | null = null;

// Cache configuration
const STORAGE_KEY = 'formSettings';
const CACHE_VERSION = import.meta.env.APP_VERSION || '1.0.0';
const CACHE_MAX_AGE = 60 * 60 * 1000; // 1 hour

/**
 * Form Settings Composable
 *
 * Fetches form field configuration from Drupal with localStorage caching.
 * Cache is automatically invalidated on app version change or after 1 hour.
 * Uses a shared pending promise to prevent duplicate requests.
 */
export const useFormSettings = () => {
    const api = useApiClient();
    const settings = useState<FormConfig | null>('form-settings', () => null);
    const loading = useState<boolean>('form-settings-loading', () => false);
    const error = useState<string | null>('form-settings-error', () => null);

    const isClient = typeof window !== 'undefined';

    /**
     * Load cached settings from localStorage with version and age validation
     */
    const loadFromCache = (): boolean => {
        if (!isClient) return false;

        const cached = localStorage.getItem(STORAGE_KEY);
        if (!cached) return false;

        try {
            const parsed: CachedFormSettings = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;

            // Validate version and age
            if (parsed.version === CACHE_VERSION && age < CACHE_MAX_AGE) {
                settings.value = parsed.data;
                console.log(`[FormSettings] Loaded from cache (v${CACHE_VERSION}, ${Math.round(age / 60000)}m old)`);
                return true;
            }

            // Cache is stale
            const reason = parsed.version !== CACHE_VERSION
                ? `version mismatch (cached: ${parsed.version}, current: ${CACHE_VERSION})`
                : `expired (${Math.round(age / 60000)}m old)`;
            console.log(`[FormSettings] Cache invalidated: ${reason}`);
            localStorage.removeItem(STORAGE_KEY);
            return false;
        } catch (e) {
            console.warn('[FormSettings] Failed to parse cache:', e);
            localStorage.removeItem(STORAGE_KEY);
            return false;
        }
    };

    /**
     * Save settings to localStorage with version and timestamp
     * Handles quota exceeded by clearing old caches
     */
    const saveToCache = (data: FormConfig): void => {
        if (!isClient) return;

        const cached: CachedFormSettings = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
            console.log(`[FormSettings] Saved to cache (v${CACHE_VERSION})`);
        } catch (e: unknown) {
            // Handle quota exceeded - clear old caches and retry
            if ((e as any)?.name === 'QuotaExceededError' || (e as any)?.code === 22) {
                console.warn('[FormSettings] Storage quota exceeded, clearing old caches');
                // Clear all formSettings and markASpotSettings caches
                Object.keys(localStorage)
                    .filter(k => k.startsWith('formSettings') || k.startsWith('markASpotSettings'))
                    .forEach(k => localStorage.removeItem(k));
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
                } catch {
                    console.warn('[FormSettings] Cache save failed after cleanup');
                }
            } else {
                console.warn('[FormSettings] Failed to save cache:', e);
            }
        }
    };

    /**
     * Clear the cache manually (useful for debugging or forced refresh)
     */
    const clearCache = (): void => {
        if (!isClient) return;
        localStorage.removeItem(STORAGE_KEY);
        settings.value = null;
        console.log('[FormSettings] Cache cleared');
    };

    const fetchSettings = async () => {
        // Skip if already loaded in memory
        if (settings.value) return;

        // Try loading from localStorage cache first (client only)
        if (isClient && loadFromCache()) return;

        // If there's already a pending request, wait for it and check result
        if (pendingFetch) {
            await pendingFetch;
            // After waiting, check if data was loaded successfully
            if (settings.value) return;
            // If still no data, fall through to retry
        }

        loading.value = true;
        error.value = null;

        // Create the fetch promise and store it
        pendingFetch = (async () => {
            try {
                const response = await api.get<FormConfig>('/mark-a-spot-form-mode-settings/node/service_request/default');
                settings.value = response;
                saveToCache(response);
                return response;
            } catch (e) {
                console.error('[FormSettings] Failed to fetch:', e);
                error.value = e instanceof Error ? e.message : 'Failed to load form settings';
                return null;
            } finally {
                loading.value = false;
                pendingFetch = null;
            }
        })();

        await pendingFetch;
    };

    /**
     * Strict field existence check - only returns true if the field explicitly exists in the API response
     * @param fieldName The field name to check
     * @returns Computed boolean indicating if the field exists in the API response
     */
    const hasField = (fieldName: string) => computed(() => {
        // Check if settings exist and have fields
        if (!settings.value?.fields) return false;

        // Explicitly check if the field exists as a property in the fields object
        return Object.prototype.hasOwnProperty.call(settings.value.fields, fieldName);
    });

    /**
     * Get field configuration from the API response
     * @param fieldName The field name to get configuration for
     * @returns Computed field configuration or undefined if not found
     */
    const getFieldConfig = (fieldName: string) => computed(() => {
        if (!settings.value?.fields) return undefined;
        return settings.value.fields[fieldName];
    });

    return {
        settings,
        loading,
        error,
        fetchSettings,
        hasField,
        getFieldConfig,
        clearCache
    };
};
