// composables/useStatus.ts
import { useApiClient } from '~/composables/api/useApiClient';
import { NEUTRAL_FALLBACKS } from '~/utils/colorUtils';

/**
 * Status Composable
 *
 * Provides status functionality for the application.
 * Locale-aware: refetches when language changes.
 *
 * @returns Reactive state and methods for status functionality
 */

interface StatusAttributes {
    drupal_internal__tid: number
    name: string
    description?: {
        value: string
        processed: string
    }
    field_status_hex?: string
    field_status_icon?: string
    field_open311_mapping?: 'initial' | 'open' | 'closed'
    weight?: number
    changed?: string
}

interface DrupalStatus {
    id: string
    type: string
    attributes: StatusAttributes
    links: {
        self: string
    }
}

interface StatusResponse {
    data: DrupalStatus[]
    links: {
        self: string
    }
}

// Generation counter to discard stale fetch results when locale/jurisdiction changes mid-flight.
let fetchGeneration = 0;
const singleTenantRootRouteKeys = new Set(['dashboard']);

export const useStatus = () => {
    const api = useApiClient();
    const masConfig = useMarkASpotConfig();
    const { currentJurisdictionId, taxonomyJurisdictionId } = masConfig;
    const numericJurisdictionPattern = /^\d+$/;
    const configJurisdictionKey = useState<string>('mas-config-jurisdiction-key', () => '');
    const isSingleTenant = useState<boolean>('jurisdiction-single-tenant', () => false);

    // Root-resolved jurisdiction ID for taxonomy filtering.
    // Child jurisdictions inherit the root's service catalog.
    const currentJurisdictionKey = computed(() =>
        currentJurisdictionId.value ? String(currentJurisdictionId.value) : ''
    );
    const activeJurisdictionKey = computed(() => {
        const current = currentJurisdictionKey.value;
        if (
            isSingleTenant.value &&
            configJurisdictionKey.value &&
            (!current || current === configJurisdictionKey.value || singleTenantRootRouteKeys.has(current))
        ) {
            return configJurisdictionKey.value;
        }

        return current;
    });
    const configuredJurisdictionId = computed(() => {
        const id = masConfig.jurisdiction?.value?.id;
        return id ? String(id) : '';
    });

    const configMatchesCurrentJurisdiction = computed<boolean>(() => {
        const currentJur = activeJurisdictionKey.value;
        const configuredId = configuredJurisdictionId.value;
        // Without a route-resolved jurisdiction, or the SSR key for single-tenant
        // root routes, we cannot prove the loaded config belongs to the current
        // tenant. Refuse to match so stale config cannot leak into a fresh fetch.
        if (!currentJur) {
            return false;
        }

        if (numericJurisdictionPattern.test(currentJur)) {
            return configuredId === currentJur;
        }

        return masConfig.jurisdiction?.value?.slug === currentJur;
    });

    const effectiveJurisdictionId = computed(() => {
        if (configMatchesCurrentJurisdiction.value && taxonomyJurisdictionId.value) {
            return String(taxonomyJurisdictionId.value);
        }

        if (configMatchesCurrentJurisdiction.value && configuredJurisdictionId.value) {
            return configuredJurisdictionId.value;
        }

        return '';
    });

    // Use useState for shared state across components
    const statusItems = useState<DrupalStatus[]>('status_items', () => []);
    const loadedJurisdictionId = useState<string>('status_loaded_jur', () => '');
    const loadedLocale = useState<string>('status_loaded_locale', () => '');
    const loading = useState<boolean>('status_loading', () => false);
    const error = useState<string | null>('status_error', () => null);

    const { locale } = useI18n();

    const resetStatusState = () => {
        statusItems.value = [];
        loadedJurisdictionId.value = '';
        loadedLocale.value = '';
    };

    const fetchStatus = async (forceRefresh = false) => {
        // JSON:API entity-reference filters need a numeric group ID. Do not
        // issue an unscoped request while route/config jurisdiction resolution
        // is empty, still pending, or stale from a previous tenant.
        if (!effectiveJurisdictionId.value) {
            fetchGeneration++;
            resetStatusState();
            loading.value = false;
            error.value = null;
            return [];
        }

        const currentJur = effectiveJurisdictionId.value;

        // Skip if already loaded for the same jurisdiction AND locale (unless force refresh)
        if (statusItems.value.length > 0 && loadedJurisdictionId.value === currentJur && loadedLocale.value === locale.value && !forceRefresh) {
            return statusItems.value;
        }

        // Capture generation so we can discard results if locale/jurisdiction changed mid-flight
        const myGeneration = ++fetchGeneration;

        loading.value = true;
        error.value = null;

        try {
            const params: Record<string, string> = {
                // field_status_definition is intentionally omitted: it carries
                // staff-only internal process attributes. The citizen-facing UI
                // (status filters, public map) uses this composable, so it must
                // never request that field. Dashboard code reads definitions via
                // the dashboard-scoped useSettingsStatuses() composable instead.
                'fields[taxonomy_term--service_status]': 'drupal_internal__tid,name,description,field_status_hex,field_status_icon,field_open311_mapping,weight,changed',
                'sort': 'weight',
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': currentJur
            };
            const response = await api.get<StatusResponse>(
                '/jsonapi/taxonomy_term/service_status',
                params
            );

            // Discard results if a newer fetch was started
            if (myGeneration !== fetchGeneration) {
                console.log(`[Status] Discarding stale fetch (generation ${myGeneration}, current ${fetchGeneration})`);
                return [];
            }

            // Deduplicate: each org/group creates its own status terms
            // with different TIDs but identical names. Keep first by weight.
            const seen = new Set<string>();
            statusItems.value = response.data.filter((item: DrupalStatus) => {
                const name = item.attributes.name;
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            });
            loadedJurisdictionId.value = currentJur;
            loadedLocale.value = locale.value;
            return statusItems.value;
        } catch (e) {
            if (myGeneration === fetchGeneration) {
                error.value = e instanceof Error ? e.message : 'Error loading status';
            }
            console.error('Error fetching status:', e);
            return [];
        } finally {
            if (myGeneration === fetchGeneration) {
                loading.value = false;
            }
        }
    };

    // Helper to get status by ID
    const getStatusById = (id: string): DrupalStatus | undefined => {
        return statusItems.value.find(status => status.id === id);
    };

    // Helper to get status by name
    const getStatusByName = (name: string): DrupalStatus | undefined => {
        return statusItems.value.find(
            status => status.attributes.name.toLowerCase() === name.toLowerCase()
        );
    };

    // Get formatted status text with color
    const getStatusDisplay = (id: string) => {
        const status = getStatusById(id);
        if (!status) return null;

        return {
            name: status.attributes.name,
            color: status.attributes.field_status_hex || NEUTRAL_FALLBACKS.MEDIUM,
            icon: status.attributes.field_status_icon || 'default-icon'
        };
    };

    // Sort status items by weight
    const sortedStatus = computed(() => {
        return [...statusItems.value].sort((a, b) => {
            const weightA = a.attributes.weight || 0;
            const weightB = b.attributes.weight || 0;
            return weightA - weightB;
        });
    });

    // Watch for locale changes and refetch status
    watch(locale, async (newLocale, oldLocale) => {
        if (newLocale !== oldLocale) {
            console.log(`[Status] Locale changed from ${oldLocale} to ${newLocale}`);
            resetStatusState();
            await fetchStatus(true);
        }
    });

    // Watch for effective jurisdiction changes (root-resolved) and refetch
    watch(effectiveJurisdictionId, async (newJur, oldJur) => {
        if (newJur !== oldJur) {
            console.log(`[Status] Jurisdiction changed from ${oldJur} to ${newJur}`);
            resetStatusState();
            await fetchStatus(true);
        }
    });

    /**
     * Clear cached status state so the next fetchStatus() call hits the API.
     * Call this after creating, updating, or deleting a status term in the dashboard.
     */
    const clearCache = (): void => {
        resetStatusState();
        console.log('[Status] Cache cleared');
    };

    return {
        statusItems,
        sortedStatus,
        loading,
        error,
        fetchStatus,
        clearCache,
        getStatusById,
        getStatusByName,
        getStatusDisplay
    };
};
