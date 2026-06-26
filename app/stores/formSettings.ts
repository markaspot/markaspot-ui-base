/**
 * Form Settings Store
 *
 * Caches Drupal form mode configurations to avoid repeated API calls.
 * Settings are fetched once per session and reused across all forms.
 */
import { defineStore, acceptHMRUpdate } from 'pinia';

interface FieldDisplaySettings {
    weight: number
    region: string
    type?: string
    settings?: Record<string, unknown>
}

interface FieldConfig {
    label: string
    description?: string
    required: boolean
    cardinality: number
    field_type: string
    widget: string
    widget_settings: Record<string, unknown>
    display_settings: FieldDisplaySettings
    validation?: unknown[]
    reference_type?: string
    settings?: {
        target_type?: string
        handler_settings?: {
            target_bundles?: Record<string, string>
        }
        // For list_string/list_integer fields
        allowed_values?: Record<string, string> | Array<{ value: string | number, label: string }>
        allowed_values_function?: string
    }
    default_value?: unknown[]
}

interface FieldGroupConfig {
    id: string
    label: string
    type: 'tabs' | 'tab' | 'fieldset' | 'details' | 'accordion' | 'accordion_item'
    weight: number
    region: string
    parent: string | null
    children: string[]
    settings?: {
        classes?: string
        id?: string
        description?: string
        required_fields?: boolean
        open?: boolean
    }
}

interface FormModeConfig {
    entity_type: string
    bundle: string
    form_mode: string
    fields: Record<string, FieldConfig>
    field_groups: Record<string, FieldGroupConfig>
}

export const useFormSettingsStore = defineStore('formSettings', {
    state: () => ({
        configs: {} as Record<string, FormModeConfig>,
        loading: {} as Record<string, boolean>,
        errors: {} as Record<string, string | null>
    }),

    getters: {
        /**
         * Get config for a specific form mode
         */
        getConfig: state => (key: string) => state.configs[key] || null,

        /**
         * Check if a config is loading
         */
        isLoading: state => (key: string) => state.loading[key] || false,

        /**
         * Get nuxt form mode for service_request
         */
        nuxtFormMode: state => state.configs['node.service_request.nuxt'] || null,

        /**
         * Get fields from nuxt form mode
         */
        nuxtFields: state => state.configs['node.service_request.nuxt']?.fields || {},

        /**
         * Get field groups from nuxt form mode
         */
        nuxtFieldGroups: state => state.configs['node.service_request.nuxt']?.field_groups || {},

        /**
         * Get management form mode for service_request (dashboard)
         */
        managementFormMode: state => state.configs['node.service_request.management'] || null,

        /**
         * Get fields from management form mode
         */
        managementFields: state => state.configs['node.service_request.management']?.fields || {},

        /**
         * Get field groups from management form mode
         */
        managementFieldGroups: state => state.configs['node.service_request.management']?.field_groups || {}
    },

    actions: {
        /**
         * Fetch form mode settings from API
         */
        async fetchFormMode(entityType: string, bundle: string, formMode: string) {
            const key = `${entityType}.${bundle}.${formMode}`;

            // Return cached if available
            if (this.configs[key]) {
                return this.configs[key];
            }

            // Skip if already loading
            if (this.loading[key]) {
                // Wait for existing request
                await new Promise((resolve) => {
                    const check = () => {
                        if (!this.loading[key]) {
                            resolve(true);
                        } else {
                            setTimeout(check, 50);
                        }
                    };
                    check();
                });
                return this.configs[key];
            }

            this.loading[key] = true;
            this.errors[key] = null;

            try {
                // Use /api/ proxy to avoid mixed content issues on client
                const response = await $fetch<FormModeConfig>(
                    `/api/mark-a-spot-form-mode-settings/${entityType}/${bundle}/${formMode}`
                );

                this.configs[key] = response;
                return response;
            } catch (e) {
                console.error(`Failed to fetch form mode ${key}:`, e);
                this.errors[key] = e instanceof Error ? e.message : 'Failed to load form settings';
                throw e;
            } finally {
                this.loading[key] = false;
            }
        },

        /**
         * Fetch nuxt form mode for service_request (convenience method)
         */
        async fetchNuxtFormMode() {
            return this.fetchFormMode('node', 'service_request', 'nuxt');
        },

        /**
         * Fetch management form mode for service_request (dashboard convenience method)
         */
        async fetchManagementFormMode() {
            return this.fetchFormMode('node', 'service_request', 'management');
        },

        /**
         * Clear cached config (useful for dev/testing)
         */
        clearCache(key?: string) {
            if (key) {
                this.configs = Object.fromEntries(
                    Object.entries(this.configs).filter(([k]) => k !== key)
                );
                this.loading = Object.fromEntries(
                    Object.entries(this.loading).filter(([k]) => k !== key)
                );
                this.errors = Object.fromEntries(
                    Object.entries(this.errors).filter(([k]) => k !== key)
                );
            } else {
                this.configs = {};
                this.loading = {};
                this.errors = {};
            }
        }
    }
});

// Enable Pinia HMR in development to prevent "getActivePinia()" errors
// when Vite hot-reloads this store module
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useFormSettingsStore, import.meta.hot));
}

// Export types
export type { FormModeConfig, FieldConfig, FieldGroupConfig };
