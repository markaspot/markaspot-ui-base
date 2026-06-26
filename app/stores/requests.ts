import { defineStore } from 'pinia';
import clientConfig from '../../config/clients/index';
import { useCacheStore } from './cache';
import type { Request, Marker, BoundsType } from '~~/types';
import {
    filterRequestsByBounds,
    requestsToMarkers,
    processRequestData,
    validateRequestData,
    normalizeRequestId,
    buildRequestParams
} from '@/utils/requestFilters';
import { handleApiError, withRetry, safeAsync, logError } from '@/utils/errorHandling';
import { getCurrentLocale } from '@/utils/locale';

/**
 * Response type for GeoReport API when meta=true
 * The API wraps the requests array with metadata for pagination
 */
interface GeoReportResponse {
    requests: Request[]
    meta: {
        total: number
        limit: number
        offset: number
    }
}

/**
 * Extract requests array from API response
 * Handles both wrapped format (meta=true) and plain array format
 */
function extractRequestsFromResponse(response: Request[] | GeoReportResponse): Request[] {
    if (Array.isArray(response)) {
        return response;
    }
    return response?.requests || [];
}

/**
 * Module-level in-flight registry. Multiple unrelated effects (bootstrap,
 * jurisdiction watcher, map mount) can race to fetch the same bounds on
 * page load. The cache only fills *after* a request resolves, so without
 * dedupe all three race-to-fetch and produce the L6 "3× requests.json"
 * smoketest finding. Keying on cacheKey collapses identical concurrent
 * requests into a single network call.
 */
const inflightRequests = new Map<string, Promise<number>>();

/**
 * Requests Store - Central state management for service requests
 *
 * Manages all service request data, filtering, caching, and API interactions.
 * Integrates with the cache store for performance optimization and provides
 * computed getters for filtered and transformed request data.
 *
 * Features:
 * - Centralized request data storage and management
 * - Spatial filtering by map bounds
 * - Request-to-marker transformation for map visualization
 * - Comprehensive error handling and retry logic
 * - Integration with caching layer for performance
 * - Support for individual request fetching and bulk operations
 */
export const useRequestsStore = defineStore('requests', {
    state: () => ({
    // Core request data
        allRequests: {} as Record<string, Request>,

        // UI state
        isLoading: false,
        isFetching: false, // Guard against concurrent fetches
        errorMessage: '',

        // Filter state
        currentBounds: null as BoundsType | null,
        currentService: null as string | null,

        // Search state
        currentSearchTerm: null as string | null,

        // Configuration
        itemsPerPage: clientConfig.requests?.itemsPerPage || 20,
        maxRequests: clientConfig.requests?.maxRequests || 100
    }),

    getters: {
        /**
         * Flatten stored requests once so downstream consumers can reuse
         * a single reactive array instead of rebuilding Object.values().
         */
        allRequestsList(): Request[] {
            return Object.values(this.allRequests);
        },

        /**
         * Cached count for consumers that only need the total size.
         */
        requestsCount(): number {
            return Object.keys(this.allRequests).length;
        },

        /**
         * Get requests filtered by current bounds
         */
        filteredRequests(): Request[] {
            return filterRequestsByBounds(this.allRequestsList, this.currentBounds);
        },

        /**
     * Convert filtered requests to map markers
     */
        visibleMarkers(): Marker[] {
            return requestsToMarkers(this.filteredRequests);
        },

        /**
     * Get request count by status
     */
        requestsByStatus() {
            return this.allRequestsList.reduce((acc, request) => {
                const status = request.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        },

        /**
     * Check if store has any data
     */
        hasRequests(): boolean {
            return this.requestsCount > 0;
        },

        /**
     * Get loading state info
     */
        loadingState(): { isLoading: boolean, hasError: boolean, errorMessage: string, hasData: boolean } {
            return {
                isLoading: this.isLoading,
                hasError: !!this.errorMessage,
                errorMessage: this.errorMessage,
                hasData: this.requestsCount > 0
            };
        },

        /**
     * Check if server search is active
     */
        isSearchActive: (state): boolean => {
            return !!state.currentSearchTerm && state.currentSearchTerm.trim().length > 0;
        }
    },

    actions: {
    /**
     * Fetch requests with caching and error handling
     */
        async fetchRequests(bounds: BoundsType, serviceCode: string | null = null, page = 1): Promise<number> {
            // Workspace visibility: skip fetch if anonymous user can't view
            const { canViewMap } = useWorkspaceVisibility();
            if (!canViewMap.value) {
                return 0;
            }

            const cacheStore = useCacheStore();
            // Get current locale, jurisdiction, and auth state for cache key.
            // Auth state must be part of the key: authenticated managers see
            // additional fields (organisation, internal notes) that anonymous
            // callers must not pick up via a shared cache entry or in-flight
            // Promise.
            const locale = getCurrentLocale();
            const { currentJurisdictionId } = useMarkASpotConfig();
            const { isAuthenticated } = usePasswordlessAuth();
            const cacheKey = cacheStore.generateCacheKey(
                bounds,
                serviceCode,
                page,
                locale,
                currentJurisdictionId.value,
                isAuthenticated.value
            );

            // Try cache first (only for first page)
            if (page === 1) {
                const cachedData = cacheStore.getCachedRequests(cacheKey);
                if (cachedData) {
                    this.addRequestsToStore(cachedData);
                    this.currentBounds = bounds;
                    if (serviceCode) this.currentService = serviceCode;
                    return cachedData.length;
                }
            }

            // Dedupe concurrent fetches for the same cacheKey. Bootstrap,
            // jurisdiction-watcher and map-mount can all fire before any of
            // them resolves; collapsing them prevents redundant network calls.
            // Client-only: the module-level Map is shared across SSR requests
            // on the same Node process, so we never put SSR Promises in it.
            if (import.meta.client) {
                const existing = inflightRequests.get(cacheKey);
                if (existing) {
                    return existing;
                }

                const pending = this.fetchRequestsFromApi(bounds, serviceCode, page, cacheKey)
                    .finally(() => {
                        inflightRequests.delete(cacheKey);
                    });
                inflightRequests.set(cacheKey, pending);
                return pending;
            }

            return this.fetchRequestsFromApi(bounds, serviceCode, page, cacheKey);
        },

        /**
     * Fetch requests from API with error handling
     */
        async fetchRequestsFromApi(
            bounds: BoundsType,
            serviceCode: string | null,
            page: number,
            cacheKey: string
        ): Promise<number> {
            this.isLoading = true;
            this.errorMessage = '';

            // Workspace visibility: skip fetch if anonymous user can't view
            const { canViewMap } = useWorkspaceVisibility();
            if (!canViewMap.value) {
                this.isLoading = false;
                return 0;
            }

            try {
                // Check authentication status for including organisation field
                const { isAuthenticated } = usePasswordlessAuth();
                // Get current locale for translated content
                const locale = getCurrentLocale();
                const { currentJurisdictionId } = useMarkASpotConfig();
                const params = buildRequestParams(bounds, serviceCode, page, this.itemsPerPage, undefined, isAuthenticated.value, locale, currentJurisdictionId.value);
                const api = useApiClient();

                let data: Request[] = [];

                // Check if we're in a client-side context after hydration
                if (import.meta.client && window.document) {
                    // Use $fetch for client-side requests after component mount
                    const rawResponse = await withRetry(
                        () => api.get<Request[] | GeoReportResponse>('/georeport/v2/requests.json', params),
                        3,
                        1000
                    );
                    // Extract requests array from wrapped response (meta=true format)
                    data = extractRequestsFromResponse(rawResponse);
                } else {
                    // Use useAsyncData for SSR and initial hydration
                    const { data: asyncData, error: asyncError } = await useAsyncData(
                        `requests-${cacheKey}`,
                        () => withRetry(
                            () => api.get<Request[] | GeoReportResponse>('/georeport/v2/requests.json', params),
                            3,
                            1000
                        ),
                        {
                            server: false, // Skip SSR for dynamic data with bounds
                            default: () => [] as Request[]
                        }
                    );

                    if (asyncError.value) {
                        throw asyncError.value;
                    }

                    // Extract requests array from wrapped response
                    data = extractRequestsFromResponse(asyncData.value || []);
                }

                // Process and validate data
                const validRequests = data
                    .filter(validateRequestData)
                    .map(processRequestData);

                // Cache first page results
                if (page === 1) {
                    const cacheStore = useCacheStore();
                    cacheStore.setCachedRequests(cacheKey, validRequests);
                }

                // Update store
                this.addRequestsToStore(validRequests);
                this.currentBounds = bounds;
                if (serviceCode) this.currentService = serviceCode;

                return validRequests.length;
            } catch (error) {
                const appError = handleApiError(error, 'fetch requests');
                this.errorMessage = appError.message;
                logError(appError);
                return 0;
            } finally {
                this.isLoading = false;
            }
        },

        /**
     * Fetch single request by ID
     */
        async fetchRequestById(
            id: string,
            options?: { crossJurisdiction?: boolean, silent?: boolean }
        ): Promise<Request | null> {
            this.isLoading = true;

            const result = await safeAsync(async () => {
                // Get current locale for translated content
                const locale = getCurrentLocale();

                const rawResponse = await useApiClient().get<any>(
                    `/georeport/v2/requests/${id}.json`,
                    {
                        extensions: 'true', meta: 'true', langcode: locale,
                        ...(options?.crossJurisdiction ? { _noJurisdiction: 'true' } : {})
                    },
                    options?.silent ? { silent: true } : undefined
                );

                // Handle wrapped response format (meta=true returns {requests: [...], meta: {...}})
                // Also handle plain array or single object for backwards compatibility
                let response: any;
                if (rawResponse?.requests && Array.isArray(rawResponse.requests)) {
                    // Wrapped format: { requests: [...], meta: {...} }
                    response = rawResponse.requests[0];
                } else if (Array.isArray(rawResponse)) {
                    // Plain array format
                    response = rawResponse[0];
                } else {
                    // Single object
                    response = rawResponse;
                }

                if (!response) {
                    throw new Error(`Request ${id} not found`);
                }

                if (!validateRequestData(response)) {
                    throw new Error(`Invalid request data for ${id}`);
                }

                const processedRequest = processRequestData(response);
                const requestId = normalizeRequestId(processedRequest);

                // Store the processed request
                this.allRequests[requestId] = processedRequest;

                return processedRequest;
            }, null, (error) => {
                const appError = handleApiError(error, `fetch request ${id}`);
                this.errorMessage = appError.message;
                // Honor the silent flag: a silent caller (e.g. the followed-reports
                // poller fetching a freshly-submitted, still-unpublished report)
                // expects a null return, not a logged App Error.
                if (!options?.silent) {
                    logError(appError);
                }
            });

            this.isLoading = false;
            return result;
        },

        /**
     * Handle bounds updates for map interactions
     */
        async handleBoundsUpdate(bounds: BoundsType, isDetailView = false): Promise<void> {
            if (isDetailView) return;
            await this.fetchRequests(bounds, this.currentService);
        },

        /**
     * Get request by ID from store
     */
        getRequestById(id: string): Request | null {
            return this.allRequests[id] || null;
        },

        /**
     * Add multiple requests to store with validation
     * Enforces maxRequests limit to prevent unbounded memory growth (SSR memory leak fix)
     */
        addRequestsToStore(requests: Request[]): void {
            requests.forEach((request) => {
                const requestId = normalizeRequestId(request);
                if (requestId) {
                    // Always update with fresh data to ensure translations and other
                    // dynamic content is reflected (e.g., after locale change)
                    this.allRequests[requestId] = processRequestData(request);
                }
            });

            // Reassign the object so computed chains depending on Object.values()
            // invalidate even when we only replaced existing IDs in place.
            this.allRequests = { ...this.allRequests };

            // MEMORY LEAK FIX: Enforce max size to prevent unbounded growth in SSR
            const requestIds = Object.keys(this.allRequests);
            if (requestIds.length > this.maxRequests) {
                // Remove oldest requests (simple LRU - first added, first removed)
                const toRemove = requestIds.length - this.maxRequests;
                requestIds.slice(0, toRemove).forEach((id) => {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete this.allRequests[id];
                });
            }
        },

        /**
     * Update or add single request to store
     */
        updateRequestInList(request: Request): void {
            if (!request) {
                console.warn('Attempted to update a null or undefined request');
                return;
            }

            const requestId = normalizeRequestId(request);

            if (requestId) {
                // Create a standardized request object
                const updatedRequest = processRequestData(request);
                updatedRequest.service_request_id = requestId;

                // Store the request
                this.allRequests[requestId] = updatedRequest;
            } else {
                console.warn('Cannot update request in store: missing ID', request);
            }
        },

        /**
     * Clear all data and reset state
     */
        clearStore(): void {
            this.allRequests = {};
            this.currentBounds = null;
            this.currentService = null;
            this.errorMessage = '';
        },

        /**
     * Clear only error state
     */
        clearError(): void {
            this.errorMessage = '';
        },

        /**
     * Refresh current data
     */
        async refresh(): Promise<void> {
            if (this.currentBounds) {
                await this.fetchRequests(this.currentBounds, this.currentService);
            }
        },

        /**
     * Fetch requests with custom limit (for preloading)
     * Properly handles itemsPerPage within the action to maintain reactivity
     */
        async fetchRequestsWithLimit(
            bounds: BoundsType,
            limit: number,
            serviceCode: string | null = null
        ): Promise<number> {
            const originalLimit = this.itemsPerPage;
            this.itemsPerPage = limit;
            try {
                return await this.fetchRequests(bounds, serviceCode, 1);
            } finally {
                this.itemsPerPage = originalLimit;
            }
        },

        /**
     * Get store statistics for debugging
     */
        getStats() {
            return {
                totalRequests: this.requestsCount,
                filteredRequests: this.filteredRequests.length,
                isLoading: this.isLoading,
                hasError: !!this.errorMessage,
                currentBounds: this.currentBounds,
                currentService: this.currentService
            };
        },

        /**
     * Fetch requests with search term (server-side search)
     * When bounds is null, searches the entire database
     */
        async fetchRequestsWithSearch(
            bounds: BoundsType | null,
            searchTerm: string,
            serviceCode: string | null = null
        ): Promise<number> {
            this.isLoading = true;
            this.errorMessage = '';
            this.currentSearchTerm = searchTerm;

            // Workspace visibility: skip fetch if anonymous user can't view
            const { canViewMap } = useWorkspaceVisibility();
            if (!canViewMap.value) {
                this.isLoading = false;
                return 0;
            }

            try {
                // Check authentication status for including organisation field
                const { isAuthenticated } = usePasswordlessAuth();
                // Get current locale for translated content
                const locale = getCurrentLocale();
                const { currentJurisdictionId: jurisdictionId } = useMarkASpotConfig();
                const params = buildRequestParams(
                    bounds,
                    serviceCode,
                    1,
                    this.itemsPerPage,
                    searchTerm, // Add search term to params
                    isAuthenticated.value,
                    locale,
                    jurisdictionId.value
                );

                const api = useApiClient();

                const rawResponse = await withRetry(
                    () => api.get<Request[] | GeoReportResponse>('/georeport/v2/requests.json', params),
                    3,
                    1000
                );

                // Extract requests array from wrapped response (extensions=true format)
                const data = extractRequestsFromResponse(rawResponse);

                const validRequests = data
                    .filter(validateRequestData)
                    .map(processRequestData);

                // Merge server results into store (don't replace)
                this.addRequestsToStore(validRequests);
                // Don't update bounds when doing whole-database search
                if (bounds) this.currentBounds = bounds;
                if (serviceCode) this.currentService = serviceCode;

                return validRequests.length;
            } catch (error) {
                const appError = handleApiError(error, 'search requests');
                this.errorMessage = appError.message;
                logError(appError);
                return 0;
            } finally {
                this.isLoading = false;
            }
        },

        /**
     * Clear search and return to bounds-based mode
     */
        clearSearch(): void {
            this.currentSearchTerm = null;
            // Optionally trigger refresh of bounds-based data
        }
    }
});

// Enable Pinia HMR in development to prevent "getActivePinia()" errors
// when Vite hot-reloads this store module
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useRequestsStore, import.meta.hot));
}
