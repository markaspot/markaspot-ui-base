/**
 * Internal Status Composable
 *
 * Provides internal status options for service request forms.
 * Newer tenants use taxonomy-backed field_status_internal_term so internal
 * workflow states can be jurisdiction-relative and carry status definitions.
 * Older tenants fall back to the legacy field_status_internal list_string.
 *
 * @returns Reactive state and methods for internal status functionality
 */

import { useApiClient } from '~/composables/api/useApiClient';
import { useFormSettingsStore } from '~/stores/formSettings';

const TAXONOMY_FIELD = 'field_status_internal_term';
const LEGACY_FIELD = 'field_status_internal';

interface InternalStatusTerm {
    id: string
    attributes?: {
        name?: string
        drupal_internal__tid?: number
        field_internal_status_code?: string
        field_status_definition?: string | { value?: string }
    }
}

interface InternalStatusResponse {
    data?: InternalStatusTerm[]
}

export const useInternalStatus = () => {
    const store = useFormSettingsStore();
    const api = useApiClient();
    const { currentJurisdictionId, taxonomyJurisdictionId, jurisdiction } = useMarkASpotConfig();
    const loading = ref(true);
    const error = ref<string | null>(null);
    const taxonomyTerms = ref<InternalStatusTerm[]>([]);

    const numericJurisdictionPattern = /^\d+$/;

    const effectiveJurisdictionId = computed(() => {
        if (taxonomyJurisdictionId.value) {
            return String(taxonomyJurisdictionId.value);
        }
        if (jurisdiction.value?.id) {
            return String(jurisdiction.value.id);
        }
        const current = currentJurisdictionId.value ? String(currentJurisdictionId.value) : '';
        return numericJurisdictionPattern.test(current) ? current : '';
    });

    const usesTaxonomyInternalStatus = computed(() =>
        Boolean(store.managementFields?.[TAXONOMY_FIELD])
    );

    const internalStatusFieldName = computed(() =>
        usesTaxonomyInternalStatus.value ? TAXONOMY_FIELD : LEGACY_FIELD
    );

    /**
     * Computed internal status options for select components
     */
    const internalStatusOptions = computed(() => {
        if (usesTaxonomyInternalStatus.value) {
            return taxonomyTerms.value.map((term) => {
                const statusDefinition = term.attributes?.field_status_definition;
                return {
                    value: term.id,
                    label: term.attributes?.name || term.id,
                    ...(statusDefinition && { statusDefinition })
                };
            });
        }

        // Dashboard forms use the management form mode as the primary field contract.
        const fieldConfig = store.managementFields?.[LEGACY_FIELD] ||
          store.nuxtFields?.[LEGACY_FIELD];

        if (!fieldConfig?.settings?.allowed_values) {
            return [];
        }

        const allowedValues = fieldConfig.settings.allowed_values as Record<string, string>;

        // Transform allowed_values object to options array
        return Object.entries(allowedValues).map(([value, label]) => ({
            value,
            label
        }));
    });

    const internalStatusDefinitions = computed(() => {
        const definitions = new Map<string, string | { value?: string }>();
        for (const term of taxonomyTerms.value) {
            const raw = term.attributes?.field_status_definition;
            if (term.id && raw) {
                definitions.set(term.id, raw);
            }
        }
        return definitions;
    });

    const internalStatusLoadedTermIds = computed(() =>
        new Set(taxonomyTerms.value.map(term => term.id).filter(Boolean))
    );

    const fetchTaxonomyInternalStatus = async () => {
        if (!effectiveJurisdictionId.value) {
            taxonomyTerms.value = [];
            return;
        }

        const response = await api.get<InternalStatusResponse>(
            '/jsonapi/taxonomy_term/internal_status',
            {
                'fields[taxonomy_term--internal_status]': 'drupal_internal__tid,name,field_internal_status_code,field_status_definition,weight',
                'sort': 'weight,name',
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': effectiveJurisdictionId.value
            }
        );
        taxonomyTerms.value = response.data || [];
    };

    /**
     * Fetch internal status options
     * Uses form settings store which caches the API response
     */
    const fetchInternalStatus = async () => {
        loading.value = true;
        error.value = null;

        try {
            try {
                await store.fetchManagementFormMode();
            } catch (managementError) {
                console.warn('[InternalStatus] Management form mode unavailable, trying nuxt form mode', managementError);
            }

            if (store.managementFields?.[TAXONOMY_FIELD]) {
                await fetchTaxonomyInternalStatus();
                return;
            }

            if (!store.managementFields?.[LEGACY_FIELD]) {
                await store.fetchNuxtFormMode();
            }
        } catch (e: unknown) {
            console.error('[InternalStatus] Failed to fetch:', e);
            error.value = e instanceof Error ? e.message : 'Failed to fetch internal status options';
        } finally {
            loading.value = false;
        }
    };

    /**
     * Helper to get internal status label by value
     */
    const getInternalStatusLabel = (value: string): string | undefined => {
        const option = internalStatusOptions.value.find(opt => opt.value === value);
        return option?.label;
    };

    /**
     * Clear cache - delegates to form settings store
     */
    const clearCache = (): void => {
        store.clearCache('node.service_request.nuxt');
        store.clearCache('node.service_request.management');
        taxonomyTerms.value = [];
    };

    return {
        internalStatusFieldName,
        internalStatusOptions,
        internalStatusDefinitions,
        internalStatusLoadedTermIds,
        usesTaxonomyInternalStatus,
        loading,
        error,
        fetchInternalStatus,
        getInternalStatusLabel,
        clearCache
    };
};
