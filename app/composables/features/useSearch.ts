import { useDebounceFn } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { useRuntimeConfig } from '#imports';
import type { Request } from '~~/types';
import { useRequestsStore } from '~/stores/requests';

/**
 * Search Composable
 *
 * Provides hybrid search functionality with client-side filtering
 * and optional server-side search expansion.
 *
 * Features:
 * - Client-side text search with debouncing
 * - User-controlled server search expansion
 * - Configurable search fields and thresholds
 * - Respects enable/disable config flags
 */

// Constants for debounce timing (not configurable - implementation details)
const CLIENT_SEARCH_DEBOUNCE = 150;

export function useSearch(requests: Ref<Request[]>, mapManager?: any) {
    const { t } = useI18n();
    const runtimeConfig = useRuntimeConfig();
    const { clientConfig } = useMarkASpotConfig();
    const requestsStore = useRequestsStore();

    // Get search configuration - dynamic config from API takes priority
    const searchConfig = computed(() =>
        clientConfig.value?.features?.search ||
        (runtimeConfig.public.clientConfig?.features as any)?.search
    );

    // Check if search is enabled (defaults to false if not configured)
    const isSearchEnabled = computed(() => searchConfig.value?.enabled === true);

    // Search state
    const searchQuery = ref<string>('');
    const isClientSearching = ref<boolean>(false);
    const isServerSearching = ref<boolean>(false);
    const serverSearchTriggered = ref<boolean>(false);
    const isFocused = ref<boolean>(false);

    // Focus management
    const setFocused = (value: boolean) => {
        isFocused.value = value;
    };

    /**
     * Client-side text search filtering
     */
    const clientSearchResults = computed(() => {
        if (!isSearchEnabled.value || !searchQuery.value || searchQuery.value.trim() === '') {
            return requests.value;
        }

        const query = searchQuery.value.toLowerCase().trim();
        const minLength = searchConfig.value?.minLength || 2;

        // Don't search if query too short
        if (query.length < minLength) {
            return requests.value;
        }

        // Get search fields from config or use defaults
        const searchFields = searchConfig.value?.fields || [
            'service_name',
            'description',
            'address_string',
            'title'
        ];

        // Filter requests by search query
        return requests.value.filter((request) => {
            return searchFields.some((field) => {
                const value = request[field as keyof Request];
                return value && String(value).toLowerCase().includes(query);
            });
        });
    });

    /**
     * Check if we should show the "Search entire database" button
     */
    const showExpandButton = computed(() => {
        if (!isSearchEnabled.value) return false;
        if (!searchQuery.value || searchQuery.value.trim().length < (searchConfig.value?.minLength || 2)) return false;
        if (serverSearchTriggered.value) return false; // Already triggered

        const threshold = searchConfig.value?.threshold || 5;
        return clientSearchResults.value.length < threshold && clientSearchResults.value.length >= 0;
    });

    /**
     * Check if no results found in client search
     */
    const hasNoResults = computed(() => {
        if (!searchQuery.value || searchQuery.value.trim().length < (searchConfig.value?.minLength || 2)) return false;
        return clientSearchResults.value.length === 0;
    });

    /**
     * Handle search input with debouncing
     */
    const handleSearchInput = useDebounceFn((query: string) => {
        // Reset server search state when query changes
        if (serverSearchTriggered.value) {
            serverSearchTriggered.value = false;
        }

        searchQuery.value = query;
        isClientSearching.value = true;

        // Wait for next tick to let computed properties update
        nextTick(() => {
            isClientSearching.value = false;
        });
    }, CLIENT_SEARCH_DEBOUNCE);

    /**
     * Trigger server-side search (user-controlled)
     * Searches the entire database without bounds restriction
     * and pans/zooms the map to show the results
     */
    const expandSearchToServer = async () => {
        if (!isSearchEnabled.value) return;
        if (!searchQuery.value || searchQuery.value.trim().length < (searchConfig.value?.minLength || 2)) return;

        const mode = searchConfig.value?.mode || 'hybrid';
        if (mode === 'client' || mode === 'off') {
            console.warn('Server search not available in current mode:', mode);
            return;
        }

        isServerSearching.value = true;
        serverSearchTriggered.value = true;

        try {
            // Store current count to detect new results
            const beforeCount = requestsStore.requestsCount;

            // Pass null for bounds to search entire database
            await requestsStore.fetchRequestsWithSearch(
                null,
                searchQuery.value.trim(),
                requestsStore.currentService
            );

            // After search completes, fit map to show search results
            const afterCount = requestsStore.requestsCount;

            if (afterCount > beforeCount && mapManager?.fitBoundsToRequests) {
                // Get the search results by filtering by search term
                const searchResults = requestsStore.allRequestsList.filter((request) => {
                    const query = searchQuery.value.toLowerCase().trim();
                    const searchFields = searchConfig.value?.fields || ['service_name', 'description', 'address_string', 'title'];
                    return searchFields.some((field) => {
                        const value = request[field as keyof Request];
                        return value && String(value).toLowerCase().includes(query);
                    });
                });

                // Fit map to show these results
                if (searchResults.length > 0) {
                    mapManager.fitBoundsToRequests(searchResults);
                }
            }
        } catch (error) {
            console.error('Server search failed:', error);
            const toast = useToast();
            toast.add({
                title: t('search.error.title'),
                description: t('search.error.message'),
                color: 'error'
            });
        } finally {
            isServerSearching.value = false;
        }
    };

    /**
     * Clear search and return to normal mode
     */
    const clearSearch = () => {
        searchQuery.value = '';
        serverSearchTriggered.value = false;
        isClientSearching.value = false;
        isServerSearching.value = false;

        // Clear server search state in store if active
        if (requestsStore.isSearchActive) {
            requestsStore.clearSearch();
        }
    };

    /**
     * Check if search is currently active
     */
    const isSearchActive = computed(() => {
        return searchQuery.value.trim().length >= (searchConfig.value?.minLength || 2);
    });

    /**
     * Watch client search results and pan map to show them
     * Debounced to prevent excessive map movements during typing
     * Uses deep: false and once: false to prevent repeated triggers
     */
    const debouncedFitBounds = useDebounceFn((results: Request[]) => {
        if (mapManager?.fitBoundsToRequests) {
            console.log('🗺️ Panning map to show', results.length, 'search results');
            mapManager.fitBoundsToRequests(results);
        }
    }, 500); // Wait 500ms after search stabilizes before panning

    watch(clientSearchResults, (results, oldResults) => {
        // Only pan if search is active, has results, and results actually changed
        if (isSearchActive.value && results.length > 0 && results !== oldResults) {
            debouncedFitBounds(results);
        }
    });

    return {
        // State
        searchQuery: readonly(searchQuery),
        isClientSearching: readonly(isClientSearching),
        isServerSearching: readonly(isServerSearching),
        serverSearchTriggered: readonly(serverSearchTriggered),
        isSearchEnabled: readonly(isSearchEnabled),
        isFocused: readonly(isFocused),

        // Computed
        clientSearchResults: readonly(clientSearchResults),
        showExpandButton: readonly(showExpandButton),
        hasNoResults: readonly(hasNoResults),
        isSearchActive: readonly(isSearchActive),

        // Actions
        handleSearchInput,
        expandSearchToServer,
        clearSearch,
        setFocused
    };
}
