/**
 * Service Provider Status Composable
 *
 * Manages service provider status taxonomy terms for use in service request forms.
 * These track the status of work assigned to external service providers.
 *
 * @returns Reactive state and methods for service provider status functionality
 */

import type { TaxonomyTerm } from '~~/types/category';

// Cache configuration
const STORAGE_KEY = 'service_provider_status';
const CACHE_VERSION = import.meta.env.APP_VERSION || '1.0.0';
const CACHE_MAX_AGE = 60 * 60 * 1000; // 1 hour

// Cache structure for localStorage
interface CachedServiceProviderStatus {
    data: TaxonomyTerm[]
    timestamp: number
    version: string
}

// Module-level pending promise to deduplicate concurrent requests
let pendingFetch: Promise<TaxonomyTerm[] | null> | null = null;

export const useServiceProviderStatus = () => {
    const api = useApiClient();
    const serviceProviderStatusItems = ref<TaxonomyTerm[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const { isOnline } = useOnlineStatus();

    const isClient = typeof window !== 'undefined';

    /**
     * Computed service provider status options for select components
     * Returns flat list sorted by weight and name
     */
    const serviceProviderStatusOptions = computed(() => {
        if (!serviceProviderStatusItems.value?.length) return [];

        return serviceProviderStatusItems.value
            .sort((a, b) => {
                const weightDiff = (a.attributes.weight || 0) - (b.attributes.weight || 0);
                return weightDiff !== 0 ? weightDiff : a.attributes.name.localeCompare(b.attributes.name);
            })
            .map(status => ({
                label: status.attributes.name,
                value: status.id
            }));
    });

    /**
     * Load cached service provider status from localStorage with version and age validation
     */
    const loadFromCache = (): boolean => {
        if (!isClient) return false;

        const cached = localStorage.getItem(STORAGE_KEY);
        if (!cached) return false;

        try {
            const parsed: CachedServiceProviderStatus = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;

            // Validate version and age
            if (parsed.version === CACHE_VERSION && age < CACHE_MAX_AGE) {
                serviceProviderStatusItems.value = parsed.data;
                console.log(`[ServiceProviderStatus] Loaded from cache (v${CACHE_VERSION}, ${Math.round(age / 60000)}m old, ${parsed.data.length} items)`);
                return true;
            }

            // Cache is stale but still usable when offline
            if (!isOnline.value && parsed.data?.length > 0) {
                serviceProviderStatusItems.value = parsed.data;
                console.log(`[ServiceProviderStatus] Using stale cache while offline (${parsed.data.length} items)`);
                return true;
            }

            const reason = parsed.version !== CACHE_VERSION
                ? `version mismatch (cached: ${parsed.version}, current: ${CACHE_VERSION})`
                : `expired (${Math.round(age / 60000)}m old)`;
            console.log(`[ServiceProviderStatus] Cache invalidated: ${reason}`);
            return false;
        } catch (e) {
            console.warn('[ServiceProviderStatus] Failed to parse cache:', e);
            return false;
        }
    };

    /**
     * Save service provider status to localStorage with version and timestamp
     */
    const saveToCache = (data: TaxonomyTerm[]): void => {
        if (!isClient) return;

        const cached: CachedServiceProviderStatus = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
            console.log(`[ServiceProviderStatus] Saved to cache (v${CACHE_VERSION}, ${data.length} items)`);
        } catch (e: unknown) {
            if ((e as any)?.name === 'QuotaExceededError' || (e as any)?.code === 22) {
                console.warn('[ServiceProviderStatus] Storage quota exceeded');
            } else {
                console.warn('[ServiceProviderStatus] Failed to save cache:', e);
            }
        }
    };

    /**
     * Clear the cache manually
     */
    const clearCache = (): void => {
        if (!isClient) return;
        localStorage.removeItem(STORAGE_KEY);
        serviceProviderStatusItems.value = [];
        console.log('[ServiceProviderStatus] Cache cleared');
    };

    /**
     * Fetch service provider status from API with caching and deduplication
     */
    const fetchServiceProviderStatus = async () => {
        // Skip if already loaded in memory
        if (serviceProviderStatusItems.value.length > 0) {
            loading.value = false;
            return;
        }

        // Try loading from localStorage cache first
        if (isClient && loadFromCache()) {
            loading.value = false;
            return;
        }

        // If offline and no cache, show error but don't block
        if (!isOnline.value) {
            loading.value = false;
            error.value = 'Service provider status unavailable offline';
            console.warn('[ServiceProviderStatus] Offline with no cache');
            return;
        }

        // If there's already a pending request, wait for it
        if (pendingFetch) {
            await pendingFetch;
            if (serviceProviderStatusItems.value.length > 0) {
                loading.value = false;
                return;
            }
        }

        loading.value = true;
        error.value = null;
        const allItems: TaxonomyTerm[] = [];

        // Create the fetch promise and store it
        pendingFetch = (async () => {
            try {
                let offset = 0;
                const limit = 50;

                // First page - use silent option to suppress 404 console errors
                // (service_provider_status taxonomy may not exist in some installations)
                let response = await api.get<DrupalJsonApiResponse<TaxonomyTerm[]>>(
                    '/jsonapi/taxonomy_term/service_provider_status',
                    {
                        'fields[taxonomy_term--service_provider_status]': 'name,weight,drupal_internal__tid',
                        'filter[status][value]': '1',
                        'sort': 'weight,name',
                        'page[offset]': offset.toString(),
                        'page[limit]': limit.toString()
                    },
                    { silent: true }
                );

                if (response?.data) {
                    allItems.push(...(response.data as TaxonomyTerm[]));
                    offset += limit;

                    // Get second page if needed
                    if (response.links?.next) {
                        response = await api.get<DrupalJsonApiResponse<TaxonomyTerm[]>>(
                            '/jsonapi/taxonomy_term/service_provider_status',
                            {
                                'fields[taxonomy_term--service_provider_status]': 'name,weight,drupal_internal__tid',
                                'filter[status][value]': '1',
                                'sort': 'weight,name',
                                'page[offset]': offset.toString(),
                                'page[limit]': limit.toString()
                            },
                            { silent: true }
                        );
                        if (response?.data) {
                            allItems.push(...(response.data as TaxonomyTerm[]));
                        }
                    }
                }

                serviceProviderStatusItems.value = allItems;
                saveToCache(allItems);
                return allItems;
            } catch (e: unknown) {
                // Silently ignore 404 - taxonomy may not exist in this installation
                if ((e as any)?.status === 404 || (e as any)?.statusCode === 404 || (e as any)?.message?.includes('404')) {
                    serviceProviderStatusItems.value = [];
                    return [];
                }
                console.error('[ServiceProviderStatus] Failed to fetch:', e);
                error.value = e instanceof Error ? e.message : 'Failed to fetch service provider status';
                return null;
            } finally {
                loading.value = false;
                pendingFetch = null;
            }
        })();

        await pendingFetch;
    };

    /**
     * Helper to get service provider status by ID
     */
    const getServiceProviderStatusById = (id: string): TaxonomyTerm | undefined => {
        return serviceProviderStatusItems.value.find(status => status.id === id);
    };

    return {
        serviceProviderStatusItems,
        serviceProviderStatusOptions,
        loading,
        error,
        fetchServiceProviderStatus,
        getServiceProviderStatusById,
        clearCache
    };
};
