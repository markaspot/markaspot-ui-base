/**
 * Composable to fetch form display settings for any entity/bundle/form_mode.
 * Uses the Drupal endpoint provided by markaspot_nuxt module.
 */
import { useState } from '#app';

/**
 * Fetch form mode settings from Drupal JSON API.
 * @param entityType
 *   The entity type machine name (e.g. 'node', 'citizen_entity').
 * @param bundle
 *   The bundle/machine name of the entity (e.g. 'service_request', 'citizen_entity').
 * @param formMode
 *   The form mode (default: 'default').
 * @param stateKey
 *   Optional key to store the settings in state; auto-generated if omitted.
 * @returns {settings, fetchSettings}
 *   settings: State containing the form settings JSON
 *   fetchSettings: Function to load settings from server
 */
export function useEntityFormSettings(
    entityType: string,
    bundle: string,
    formMode: string = 'default',
    stateKey?: string
) {
    // Unique key in Nuxt state
    const key = stateKey || `${entityType}-${bundle}-${formMode}-form-settings`;
    const settings = useState<Record<string, unknown> | null>(key, () => null);

    /**
   * Load the form display settings from Drupal.
   * Stores result in settings.value
   */
    const fetchSettings = async () => {
        const url = `/api/mark-a-spot-form-mode-settings/${entityType}/${bundle}/${formMode}`;
        try {
            const api = useApiClient();

            let data: Record<string, unknown> | null = null;

            // Check if we're in a client-side context after hydration
            if (import.meta.client && window.document) {
                // Use direct API call for client-side requests after component mount
                data = await api.get(url);
            } else {
                // Use useAsyncData for SSR and initial hydration
                const { data: asyncData, error } = await useAsyncData(key, () =>
                    api.get(url), {
                    server: true,
                    default: () => null
                });

                if (error.value) {
                    throw error.value;
                }

                data = asyncData.value;
            }

            settings.value = data;
        } catch (err) {
            console.error(`Failed to fetch form settings (${entityType}.${bundle}.${formMode}):`, err);
        }
    };

    return { settings, fetchSettings };
}
