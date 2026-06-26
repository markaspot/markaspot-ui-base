// composables/useApiClient.ts
import { navigateTo, useRoute, useRuntimeConfig } from '#app';
import { useTokenCache } from '~/composables/api/useTokenCache';
import { useServiceStatus } from '~/composables/core/useServiceStatus';
import {
    clearLogoutScopedLocalStorage,
    clearLogoutScopedNuxtState
} from '@/utils/authLogoutCleanup';
import { getCurrentLocale } from '@/utils/locale';
import type { AuthUser } from '~~/types/auth';

/**
 * ApiClient Composable
 *
 * Provides HTTP client functionality for API communication with error handling and request/response interceptors.
 * Automatically injects jurisdiction parameter for GeoReport API calls.
 *
 * @returns Reactive state and methods for apiclient functionality
 */

interface ApiClientOptions {
    baseURL?: string
    defaultHeaders?: Record<string, string>
}

interface RequestOptions extends RequestInit {
    params?: Record<string, string>
    headers?: Record<string, string>
    onUploadProgress?: (progress: ProgressEvent) => void
    /** Suppress error logging for expected errors (e.g., 404 for optional endpoints) */
    silent?: boolean
}

interface AuthRedirectRoute {
    path?: string
    fullPath?: string
}

// Error key mapping for i18n - components can use these keys to display translated messages
export const API_ERROR_KEYS: Record<number, string> = {
    429: 'errors.api.rate_limit',
    401: 'errors.api.unauthorized',
    403: 'errors.api.forbidden',
    404: 'errors.api.not_found',
    500: 'errors.api.server_error',
    502: 'errors.api.server_error'
};

const INVALID_API_RESPONSE_MESSAGE = 'Server returned an invalid response. Please try again later.';

const CUSTOM_API_SCOPE_KEYS = new Set([
    'group_id',
    'groupId',
    'org_id',
    'orgId',
    'jurisdiction_id',
    'jurisdictionId'
]);

const SCOPED_CUSTOM_API_PATHS = [
    '/group-members',
    '/tenant-settings',
    '/moderation',
    '/dashboard/alerts'
];

// Inbound-mail (#482) is jurisdiction-scoped server-side via the session's
// group membership, so it is intentionally NOT in SCOPED_CUSTOM_API_PATHS:
// the contract carries no jurisdiction_id param/body, and the client-side
// scope guard would 400 ("Missing Scope") on every call. The backend enforces
// per-jurisdiction access from the authenticated session instead.

const UNSCOPED_CUSTOM_API_PATHS = [
    '/group-members/claim'
];

const toGroupId = (value: unknown): string | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    return null;
};

const normalizeScopeKey = (key: string): string => key.replace(/\[\]$/, '');

const isScopeKey = (key: string): boolean => CUSTOM_API_SCOPE_KEYS.has(normalizeScopeKey(key));

const addGroupIdValue = (ids: Set<string>, value: unknown) => {
    if (Array.isArray(value)) {
        value.forEach(item => addGroupIdValue(ids, item));
        return;
    }
    const id = toGroupId(value);
    if (id) ids.add(id);
};

const collectScopedGroupIds = (value: unknown, ids = new Set<string>()): Set<string> => {
    if (!value || typeof value !== 'object' || value instanceof FormData || value instanceof ArrayBuffer) {
        return ids;
    }

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        if (isScopeKey(key)) {
            addGroupIdValue(ids, nestedValue);
            continue;
        }

        if (key === 'memberships' && nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
            Object.keys(nestedValue as Record<string, unknown>).forEach(id => addGroupIdValue(ids, id));
            continue;
        }

        if (nestedValue && typeof nestedValue === 'object') {
            collectScopedGroupIds(nestedValue, ids);
        }
    }

    return ids;
};

const parseJsonBody = (body: BodyInit | null | undefined): unknown => {
    if (typeof body !== 'string') return null;
    try {
        return JSON.parse(body);
    } catch {
        return null;
    }
};

const collectQueryGroupIds = (endpoint: string): Set<string> => {
    const ids = new Set<string>();
    const query = endpoint.split('?')[1];
    if (!query) return ids;

    const searchParams = new URLSearchParams(query);
    for (const [key, value] of searchParams.entries()) {
        if (isScopeKey(key)) {
            addGroupIdValue(ids, value);
        }
    }

    return ids;
};

const decodePathSegment = (segment: string): string => {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
};

const collectPathScopeIds = (endpointWithoutQuery: string): Set<string> => {
    const ids = new Set<string>();
    const tenantSettingsMatch = endpointWithoutQuery.match(/^\/tenant-settings\/([^/]+)/);
    if (tenantSettingsMatch) {
        addGroupIdValue(ids, decodePathSegment(tenantSettingsMatch[1]));
    }
    const alertsMatch = endpointWithoutQuery.match(/^\/dashboard\/alerts\/([^/]+)/);
    if (alertsMatch) {
        addGroupIdValue(ids, decodePathSegment(alertsMatch[1]));
    }
    return ids;
};

export class ApiError extends Error {
    public errorKey?: string;

    constructor(
        public status: number,
        public statusText: string,
        public data: unknown
    ) {
        type ApiErrorData = { data?: { errors?: Array<{ detail?: string, title?: string }> }, errors?: Array<{ detail?: string, title?: string }> };
        const errorData = (data as ApiErrorData)?.data || data as { errors?: Array<{ detail?: string, title?: string }> };
        const flatError = (data as { error?: unknown })?.error;
        // Flat `message` field carried by H3/createSafeError error bodies (e.g. the
        // proxy's "Backend service unavailable…" for a 503, or a backend message).
        // Without this, non-JSON:API errors fall through to the unhelpful
        // "API Error: <status>" fallback below.
        const flatMessage = (data as { message?: unknown })?.message ??
          (errorData as { message?: unknown })?.message;
        let errorDetail = errorData?.errors?.[0]?.detail ||
          errorData?.errors?.[0]?.title ||
          (typeof flatError === 'string' ? flatError : undefined) ||
          (typeof flatMessage === 'string' ? flatMessage : undefined);

        // Store error key for i18n translation in components
        const errorKey = API_ERROR_KEYS[status];

        // Provide fallback messages in English for logging (components should use errorKey for i18n)
        if (!errorDetail) {
            switch (status) {
                case 429:
                    errorDetail = 'Too many requests. Please wait and try again.';
                    break;
                case 401:
                    errorDetail = 'Not authorized. Please sign in again.';
                    break;
                case 403:
                    errorDetail = 'Access denied.';
                    break;
                case 404:
                    errorDetail = 'Resource not found.';
                    break;
                case 500:
                    errorDetail = 'Server error. Please try again later.';
                    break;
                case 502:
                    errorDetail = INVALID_API_RESPONSE_MESSAGE;
                    break;
                case 503:
                    errorDetail = 'Service temporarily unavailable. Please try again shortly.';
                    break;
                default:
                    errorDetail = `API Error: ${status}`;
            }
        }

        super(errorDetail);
        this.name = 'ApiError';
        this.errorKey = errorKey;
        this.data = data;
    }
}

function createInvalidApiResponseError(): ApiError {
    // No detail/title: the ApiError constructor resolves the user-facing
    // message from the status (502 -> INVALID_API_RESPONSE_MESSAGE) and sets
    // errorKey to 'errors.api.server_error' for i18n. Keeping the raw upstream
    // body out of the envelope is the whole point of this error path.
    return new ApiError(502, 'Bad Gateway', { errors: [{ status: '502' }] });
}

export const useApiClient = (options: ApiClientOptions = {}) => {
    const tokenCache = useTokenCache();
    const config = useRuntimeConfig();
    const route = useRoute();
    // Shared CSRF token: only fetch once per rendering context
    const csrfToken = useState<string | null>('csrfToken', () => null);

    // Always use /jsonapi as the client-side path - the proxy will handle translation
    const jsonApiBasePath = '/jsonapi';

    const getAuthUserGroupIds = (): Set<string> => {
        // Accept both numeric IDs and URL slugs so callers using either form
        // pass the path-segment scope check at validateCustomApiScope.
        // currentJurisdictionId returns slug in FastMap mode, numeric in
        // single-tenant; without slug acceptance tenant admins 403 client-side
        // before the request even leaves the browser. See markaspot-ui #438.
        const authUser = useState<AuthUser | null>('auth_user', () => null);
        const ids = new Set<string>();
        for (const group of authUser.value?.groups ?? []) {
            const numeric = toGroupId(group.id);
            if (numeric) ids.add(numeric);
            const slug = toGroupId(group.slug);
            // Drupal already rejects digit-only slugs at emission, but defend
            // in depth: a digit-only slug in the Set would alias an unrelated
            // numeric group id and let the path-scope guard accept the wrong
            // group, e.g. slug "42" granting access to group id 42.
            if (slug && !/^\d+$/.test(slug)) ids.add(slug);
        }
        return ids;
    };

    const isGlobalAdmin = (): boolean => {
        const authUser = useState<AuthUser | null>('auth_user', () => null);
        return authUser.value?.roles?.includes('administrator') === true;
    };

    const isAuthEndpoint = (endpoint: string): boolean => {
        const endpointWithoutQuery = endpoint.split('?')[0];
        return endpointWithoutQuery === '/auth' || endpointWithoutQuery.startsWith('/auth/');
    };

    const routePath = (currentRoute: AuthRedirectRoute): string => {
        return currentRoute.path || currentRoute.fullPath?.split('?')[0] || '/';
    };

    const isAuthRoute = (currentRoute: AuthRedirectRoute): boolean => {
        return routePath(currentRoute).split('/').filter(Boolean).includes('auth');
    };

    const buildLoginRedirectTarget = (currentRoute: AuthRedirectRoute): string => {
        const fullPath = currentRoute.fullPath || currentRoute.path || '/';
        const path = routePath(currentRoute);
        const segments = path.split('/').filter(Boolean);
        const reservedFirstSegments = new Set([
            'api',
            'auth',
            'dashboard',
            'embed',
            'impressum',
            'lite',
            'privacy',
            'requests',
            'report',
            'terms'
        ]);
        const slug = segments[0] && !reservedFirstSegments.has(segments[0])
            ? segments[0]
            : null;
        const loginPath = slug ? `/${slug}/auth/login` : '/auth/login';

        return `${loginPath}?redirect=${encodeURIComponent(fullPath)}`;
    };

    const clearLocalAuthState = () => {
        useState<AuthUser | null>('auth_user', () => null).value = null;
        useState<boolean>('auth_code_requested', () => false).value = false;
        useState<string | null>('auth_code_email', () => null).value = null;
        useState<number | null>('auth_expires_at', () => null).value = null;
        useState<string | null>('auth_error', () => null).value = null;
        csrfToken.value = null;
        tokenCache.invalidateToken();
        clearLogoutScopedNuxtState();

        if (typeof localStorage !== 'undefined') {
            clearLogoutScopedLocalStorage();
        }
    };

    const handleUnauthorizedResponse = async (endpoint: string) => {
        if (isAuthEndpoint(endpoint)) {
            return;
        }

        // A 401 for a user who was never authenticated (anonymous) is NOT a
        // session expiry — it means the endpoint requires a permission the
        // anon role lacks (e.g. the documented `create field_address` gotcha on
        // report submit). Redirecting an anonymous citizen to /auth/login here
        // would discard their filled-in report (text, photos, location) and
        // force a pointless login. Let the error fall through to
        // processApiErrors / FormErrorDisplay instead, preserving form state.
        const currentUser = useState<AuthUser | null>('auth_user', () => null).value;
        if (!currentUser) {
            return;
        }

        clearLocalAuthState();

        if (typeof window !== 'undefined') {
            if (!isAuthRoute(route)) {
                await navigateTo(buildLoginRedirectTarget(route), { replace: true });
            }
        }
    };

    // Allowlist of permitted JSON API endpoints, using relative paths after the jsonApiBasePath
    // The proxy will handle rewriting these to the actual randomized backend path
    const ALLOWED_JSONAPI_RELATIVE_PATHS = [
        '/media/request_image/field_media_image',
        '/media/request_image',
        '/node/service_request',
        '/node/page',
        '/taxonomy_term/service_category',
        '/taxonomy_term/service_status',
        '/taxonomy_term/internal_status',
        '/taxonomy_term/district',
        '/citizen_entity/citizen_entity',
        // Dashboard-specific endpoints
        '/user/user',
        '/group/jur',
        '/group/org',
        '/group/organisation',
        '/taxonomy_term/priority',
        '/taxonomy_term/service_provider',
        '/taxonomy_term/service_provider_status',
        '/taxonomy_term/sublocality',
        '/paragraph/status',
        '/paragraph/internal_remark',
        '/node/boilerplate',
        '/file/file'
    ];

    // Custom API endpoints that don't use jsonApiBasePath
    // Note: These paths should NOT include /api prefix as the proxy adds it automatically
    const ALLOWED_CUSTOM_API_PATHS = [
        '/mark-a-spot-form-mode-settings/node/service_request/default',
        '/mark-a-spot-form-mode-settings/node/service_request/management',
        '/mark-a-spot-settings',
        '/organisations',
        '/feedback',
        '/competition',
        '/markaspotshstweak',
        '/auth/request-code',
        '/auth/verify-code',
        '/auth/status',
        '/auth/logout',
        '/auth/preferences',
        '/contact/submit',
        '/contact/info',
        '/group-members',
        '/vision/analyze',
        '/tenant-settings',
        '/moderation/flagged-requests',
        '/moderation/flags',
        '/dashboard/alerts',
        '/inbound-mail'
    ];

    // Build the complete allowed endpoint paths
    const ALLOWED_JSONAPI_ENDPOINTS = ALLOWED_JSONAPI_RELATIVE_PATHS.map(
        path => `${jsonApiBasePath}${path}`
    );

    // Check if an endpoint is allowed
    const validateJsonApiEndpoint = (endpoint: string) => {
        // Check for custom API endpoints first
        if (ALLOWED_CUSTOM_API_PATHS.some(path => endpoint === path || endpoint.startsWith(path + '/'))) {
            return true;
        }

        // If it's not a JSON API endpoint, allow it
        if (!endpoint.startsWith(jsonApiBasePath + '/')) {
            return true;
        }

        // Strip query parameters before validation
        const endpointWithoutQuery = endpoint.split('?')[0];

        // Allow any media type endpoint for imagelist service definition attributes.
        // Media types are admin-created, JSON:API enforces Drupal permissions.
        const mediaTypePath = endpointWithoutQuery.replace(jsonApiBasePath, '');
        if (/^\/media\/[a-z][a-z0-9_]*$/.test(mediaTypePath)) {
            return true;
        }

        // For JSON API endpoints with UUIDs, extract the base path
        // This regex matches UUIDs in the format: 00000000-0000-0000-0000-000000000000
        const uuidPattern = /\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(\/.*)?$/;

        const basePath = endpointWithoutQuery.replace(uuidPattern, '');

        // Check if the base path is in our allowlist
        const isAllowed = ALLOWED_JSONAPI_ENDPOINTS.some((allowed) => {
            return basePath === allowed || endpointWithoutQuery.startsWith(allowed + '/');
        });

        if (!isAllowed) {
            console.error(`Blocked unauthorized API access to: ${endpoint}`);
        }

        return isAllowed;
    };

    const validateCustomApiScope = (
        endpoint: string,
        params?: Record<string, string>,
        body?: BodyInit | null
    ) => {
        const endpointWithoutQuery = endpoint.split('?')[0];
        const shouldValidate = SCOPED_CUSTOM_API_PATHS.some(
            path => endpointWithoutQuery === path || endpointWithoutQuery.startsWith(path + '/')
        );
        const isUnscopedPath = UNSCOPED_CUSTOM_API_PATHS.some(
            path => endpointWithoutQuery === path || endpointWithoutQuery.startsWith(path + '/')
        );
        if (!shouldValidate || isUnscopedPath) {
            return;
        }

        const requestedGroupIds = collectPathScopeIds(endpointWithoutQuery);
        collectQueryGroupIds(endpoint).forEach(id => requestedGroupIds.add(id));
        collectScopedGroupIds(params, requestedGroupIds);
        const parsedBody = parseJsonBody(body);
        collectScopedGroupIds(parsedBody, requestedGroupIds);

        if (requestedGroupIds.size === 0) {
            throw new ApiError(400, 'Bad Request', {
                errors: [{
                    status: '400',
                    title: 'Missing Scope',
                    detail: 'Scoped custom API requests require an explicit group or jurisdiction scope'
                }]
            });
        }

        if (isGlobalAdmin()) {
            return;
        }

        const allowedGroupIds = getAuthUserGroupIds();
        const blockedGroupIds = [...requestedGroupIds].filter(id => !allowedGroupIds.has(id));

        if (blockedGroupIds.length > 0) {
            throw new ApiError(403, 'Forbidden', {
                errors: [{
                    status: '403',
                    title: 'Access Denied',
                    detail: 'Requested scope is outside the authenticated user scope'
                }]
            });
        }
    };

    /**
     * Get jurisdiction identifier (slug preferred, numeric ID as fallback) from config state.
     * Avoids circular dependency with useMarkASpotConfig.
     * Returns undefined if not yet loaded.
     *
     * The backend's resolveJurisdictionId() accepts all of: numeric ID, slug, gid, and
     * jurisdiction param (markaspot-ui#284). We always prefer the slug so that the
     * jurisdiction_id query param is human-readable and the backend does not need to
     * do an extra numeric-to-slug lookup.
     *
     * Priority:
     * 1. mas-config-jurisdiction-key (slug or numeric string stored at config-fetch time,
     *    covers both FastMap and standard multi-tenant mode)
     * 2. Numeric ID from loaded config state (standard single-tenant fallback)
     */
    const getJurisdictionId = (): string | number | undefined => {
        // Prefer the jurisdiction key stored when config was fetched. In multi-tenant
        // (FastMap and standard slug-routed) mode this holds the slug (e.g. "amsterdam");
        // in numeric single-tenant mode it holds the numeric string (e.g. "1").
        const configJurisdictionKey = useState<string>('mas-config-jurisdiction-key');
        if (configJurisdictionKey.value) {
            return configJurisdictionKey.value;
        }

        // Fallback: numeric ID from loaded config state (e.g. NUXT_JURISDICTION_ID=1 env).
        const configState = useState<{ jurisdiction?: { id?: number } } | null>('mas-config-state');
        return configState.value?.jurisdiction?.id;
    };

    /**
     * Check if endpoint should have jurisdiction automatically injected
     * Request IDs are scoped per jurisdiction, so all GeoReport endpoints need jurisdiction_id
     */
    const shouldInjectJurisdiction = (endpoint: string): boolean => {
        // Only inject for GeoReport API endpoints
        if (!endpoint.includes('/georeport/')) {
            return false;
        }

        return true;
    };

    const buildUrl = (endpoint: string, params?: Record<string, string>) => {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

        // Validate the endpoint - throw error for unauthorized JSON API access
        if (!validateJsonApiEndpoint(cleanEndpoint)) {
            throw new ApiError(403, 'Forbidden', {
                errors: [{
                    status: '403',
                    title: 'Access Denied',
                    detail: 'Unauthorized access to restricted JSON API endpoint'
                }]
            });
        }

        // Auto-inject jurisdiction_id for GeoReport endpoints
        // This enables multi-tenant data isolation without client-side knowledge
        // Skip injection when group_filter, org_id, or group_id is present:
        // - group_filter: backend filters by user's session/groups
        // - org_id/group_id: backend knows the group's jurisdiction, injecting a different one causes 0 results
        // Consume _noJurisdiction flag before it reaches the API
        const noJurisdiction = params?._noJurisdiction;
        if (noJurisdiction && params) {
            const { _noJurisdiction, ...rest } = params;
            params = rest;
        }
        if (shouldInjectJurisdiction(cleanEndpoint)) {
            const jurisdictionId = getJurisdictionId();
            const hasGroupParam = params?.group_filter || params?.org_id || params?.group_id;
            const hasJurisdictionParam = params?.jurisdiction_id || params?.jurisdiction || params?.gid;
            if (jurisdictionId && !hasJurisdictionParam && !hasGroupParam && !noJurisdiction) {
                params = { ...params, jurisdiction_id: String(jurisdictionId) };
            }
        }

        const shouldUseProxy = import.meta.client && config.public.useProxy === true;
        let baseUrl = shouldUseProxy
            ? (config.public.proxyPath || '/api/proxy')
            : config.public.apiBase;

        baseUrl = baseUrl.replace(/\/$/, '');

        let finalUrl = `${baseUrl}${cleanEndpoint}`;

        // Add query parameters if provided
        if (params && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, value);
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                finalUrl += `?${queryString}`;
            }
        }

        return finalUrl;
    };

    const getHeaders = async (customHeaders: Record<string, string> = {}) => {
        if (!csrfToken.value) {
            await refreshCsrfToken();
        }

        // Get current locale for Accept-Language header
        const locale = getCurrentLocale();

        const headers: Record<string, string> = {
            'Accept': 'application/vnd.api+json',
            'Accept-Language': locale,
            // Browser fetch cannot reliably override Accept-Language. The proxy
            // gives this header precedence and forwards it to Drupal.
            'X-Translation-Language': locale,
            // Note: Content-Language should only be set explicitly when updating
            // specific translations. Don't set by default - let Drupal use entity's langcode.
            'X-CSRF-Token': csrfToken.value || '',
            ...options.defaultHeaders,
            ...customHeaders
        };

        const jurisdictionId = getJurisdictionId();
        if (jurisdictionId && !headers['X-MAS-Jurisdiction']) {
            headers['X-MAS-Jurisdiction'] = String(jurisdictionId);
        }

        if (!customHeaders['Content-Type']) {
            headers['Content-Type'] = 'application/vnd.api+json';
        }

        // Filter out undefined or null headers
        const filteredHeaders = Object.fromEntries(
            Object.entries(headers).filter(([_, value]) => value !== undefined && value !== null)
        );

        // Replace the headers object with the filtered version
        // Using a new object instead of dynamic property deletion
        return filteredHeaders;
    };

    const refreshCsrfToken = async () => {
        // Check if we already have a valid cached token
        const cachedToken = tokenCache.getCachedToken();
        if (cachedToken) {
            csrfToken.value = cachedToken;
            return;
        }

        // If there's already a pending token fetch, wait for it
        const pendingFetch = tokenCache.getPendingFetch();
        if (pendingFetch) {
            await pendingFetch;
            // After waiting, check if token is now available
            const token = tokenCache.getCachedToken();
            if (token) {
                csrfToken.value = token;
            }
            return;
        }

        const serviceStatus = useServiceStatus();
        // If the backend is marked as unavailable and retry window has not elapsed, skip token fetch
        if (!serviceStatus.shouldRetry()) {
            console.warn('[api] Skipping CSRF token refresh while backend is unavailable');
            return;
        }

        // Create and store the pending promise
        const fetchPromise = (async (): Promise<string | null> => {
            let tokenUrl = '';
            try {
                tokenUrl = buildUrl('/session/token');

                const response = await fetch(tokenUrl, {
                    credentials: 'include',
                    // Important: Don't cache this request
                    cache: 'no-store'
                });

                // Special handling for 503 status code
                if (response.status === 503) {
                    // Log metadata only — never the raw body, which may carry
                    // a Drupal maintenance page or other server internals.
                    const responseText = await response.text();
                    console.error('503 Service Unavailable detected in token refresh', {
                        contentType: response.headers.get('content-type'),
                        length: responseText.length
                    });
                    // Register the service failure and abort token refresh silently
                    serviceStatus.registerServiceFailure({ statusCode: 503 } as any);
                    return null;
                }

                if (!response.ok) {
                    // responseText is kept for maintenance-mode detection below,
                    // but only its metadata is logged — never the raw body.
                    const responseText = await response.text();
                    console.error(`CSRF token fetch failed: Status ${response.status} ${response.statusText}`, {
                        contentType: response.headers.get('content-type'),
                        length: responseText.length
                    });
                    // Detect maintenance mode and register failure
                    if (responseText.includes('maintenance mode') ||
                      responseText.includes('Wartungsmodus') ||
                      responseText.includes('503 Service') ||
                      responseText.toLowerCase().includes('maintenance')) {
                        console.error('Maintenance mode detected in response text');
                        serviceStatus.registerServiceFailure({ statusCode: response.status } as any);
                        return null;
                    }
                    if (response.status >= 500) {
                        serviceStatus.registerServiceFailure({ statusCode: response.status } as any);
                    }
                    return null;
                }

                const token = await response.text();
                csrfToken.value = token;
                tokenCache.setCachedToken(token);

                // Mark service as available on successful token fetch
                serviceStatus.registerServiceSuccess();
                return token;
            } catch (error: unknown) {
                console.error('Error refreshing CSRF token:', error);
                // Only register failure for genuine errors (not initial network misses)
                if (!((error as any).name === 'TypeError' && !csrfToken.value)) {
                    serviceStatus.registerServiceFailure({
                        statusCode: (error as any).status || 500
                    } as any);
                }
                // Abort silently without throwing to prevent full page reload loops
                return null;
            } finally {
                tokenCache.setPendingFetch(null);
            }
        })();

        tokenCache.setPendingFetch(fetchPromise);
        await fetchPromise;
    };

    // Get service status
    const serviceStatus = useServiceStatus();

    const request = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
        const { params, headers: customHeaders, onUploadProgress, ...fetchOptions } = options;
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        validateCustomApiScope(cleanEndpoint, params, fetchOptions.body);
        const url = buildUrl(endpoint, params);
        const requestMethod = (fetchOptions.method || 'GET').toUpperCase();
        const cacheMode = fetchOptions.cache ?? (requestMethod === 'GET' ? 'no-store' : undefined);

        // Check if service is down and we shouldn't retry yet
        if (!serviceStatus.shouldRetry()) {
            throw new ApiError(
                503,
                'Service Unavailable',
                { message: serviceStatus.getServiceDownMessage() }
            );
        }

        try {
            const headers = await getHeaders(customHeaders);

            let fetchPromise: Promise<Response>;

            if (onUploadProgress && fetchOptions.body instanceof FormData) {
                const xhr = new XMLHttpRequest();
                fetchPromise = new Promise((resolve, reject) => {
                    xhr.open(fetchOptions.method || 'GET', url);

                    // Set headers
                    Object.keys(headers).forEach((key) => {
                        xhr.setRequestHeader(key, headers[key]);
                    });

                    xhr.withCredentials = true;

                    xhr.upload.addEventListener('progress', onUploadProgress);

                    xhr.onload = () => {
                        const response = new Response(xhr.response, {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: new Headers(
                                xhr.getAllResponseHeaders().split('\r\n')
                                    .filter(Boolean)
                                    .reduce((acc, line) => {
                                        const [key, value] = line.split(': ');
                                        acc[key.toLowerCase()] = value;
                                        return acc;
                                    }, {})
                            )
                        });
                        resolve(response);
                    };

                    xhr.onerror = () => {
                        console.error('XHR request failed');
                        reject(new Error('Network request failed'));
                    };
                    xhr.send(fetchOptions.body as XMLHttpRequestBodyInit);
                });
            } else {
                fetchPromise = fetch(url, {
                    ...fetchOptions,
                    cache: cacheMode,
                    headers,
                    credentials: 'include'
                });
            }

            const response = await fetchPromise;

            // Only mark service available on HTTP 2xx
            if (response.ok) {
                serviceStatus.registerServiceSuccess();
            }

            if (!response.ok) {
                // Handle service unavailable specifically
                if (response.status === 503) {
                    serviceStatus.registerServiceFailure(response);
                    throw new ApiError(503, 'Service Unavailable', {
                        message: serviceStatus.getServiceDownMessage()
                    });
                }

                if (response.status === 401) {
                    await handleUnauthorizedResponse(cleanEndpoint);
                }

                if (!options.silent) {
                    console.error(`API Error: ${response.status} ${response.statusText} for ${url}`);
                }

                let responseText, errorData;
                try {
                    responseText = await response.text();
                    if (!options.silent) {
                        // Metadata only: the raw body can be a Drupal HTML error
                        // page, SMTP debug output, or a stack trace.
                        console.error('Error response body received', {
                            status: response.status,
                            contentType: response.headers.get('content-type'),
                            length: responseText?.length
                        });
                    }

                    // We'll only check for 503 status codes
                    // and handle them above in the status checks

                    try {
                        errorData = JSON.parse(responseText);

                        // We're only checking for 503 status codes
                        // rather than content matching

                        if (response.status === 429) {
                            // Rate limited - handled by retry logic
                        } else if (response.status === 422) {
                            // Check if we have the Drupal JSON:API error format
                            if (errorData?.errors?.length > 0) {
                                // Log each validation error for easier debugging

                                errorData.errors.forEach((error: any, index: number) => {
                                    const field = error.source?.pointer?.replace('/data/attributes/', '') || 'unknown';
                                    console.error(`Validation error ${index + 1}: Field "${field}" - ${error.detail || error.title}`);
                                });
                            }
                        }

                        if (response.status === 429 && errorData.message) {
                            errorData.originalMessage = errorData.message;
                        }
                    } catch (jsonError) {
                        console.error('Failed to parse error response as JSON:', jsonError);

                        // For 429 errors, try to use the raw response text
                        if (response.status === 429) {
                            errorData = {
                                status: 429,
                                message: responseText,
                                originalMessage: responseText
                            };
                        } else {
                            // Non-JSON upstream bodies can contain HTML, SMTP debug output,
                            // or stack traces. Never surface them as user-facing detail.
                            errorData = {
                                errors: [{
                                    status: response.status.toString(),
                                    title: '',
                                    detail: ''
                                }]
                            };
                        }
                    }
                } catch (textError) {
                    console.error('Failed to read error response body:', textError);
                    errorData = {
                        errors: [{
                            status: response.status.toString(),
                            title: response.statusText,
                            detail: 'Failed to read error response'
                        }]
                    };
                }

                // Create a custom ApiError with additional info for rate limit errors
                const apiError = new ApiError(
                    response.status,
                    response.statusText,
                    errorData
                );

                // For rate limit errors, attach the original message
                if (response.status === 429 && errorData.message) {
                    (apiError as any).originalMessage = errorData.message;
                }

                throw apiError;
            }

            // Parse successful response
            const text = await response.text();

            if (!text) {
                return null as T;
            }

            try {
                const result = JSON.parse(text) as T;
                return result;
            } catch {
                console.error(`Invalid JSON response for ${endpoint}`, {
                    status: response.status,
                    contentType: response.headers.get('content-type')
                });
                throw createInvalidApiResponseError();
            }
        } catch (error) {
            // Only log errors if not silenced (for expected errors like 404 on optional endpoints)
            if (!options.silent) {
                console.error(`Request failed for ${endpoint}:`, error);
            }

            if (error instanceof ApiError) {
                if (!options.silent) {
                    console.error('ApiError details:', {
                        status: error.status,
                        statusText: error.statusText,
                        data: error.data
                    });
                }
                throw error;
            }

            if (error instanceof TypeError) {
                if (!options.silent) {
                    console.error('Network error details:', error);
                }
                throw new Error(`Network error for ${endpoint}: ${error.message}`);
            }

            // Check for 503 error
            if (error && (
                error.status === 503 ||
                (error.response && error.response.status === 503)
            )) {
                serviceStatus.registerServiceFailure();
            }

            if (!options.silent) {
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
    };

    return {
        get: <T>(endpoint: string, params?: Record<string, string>, options?: RequestOptions) =>
            request<T>(endpoint, { ...options, method: 'GET', params }),

        post: <T>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
            request<T>(endpoint, {
                ...options,
                method: 'POST',
                body: data instanceof File || data instanceof FormData || data instanceof ArrayBuffer
                    ? data
                    : (data ? JSON.stringify(data) : undefined)
            }),

        put: <T>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
            request<T>(endpoint, {
                ...options,
                method: 'PUT',
                body: data ? JSON.stringify(data) : undefined
            }),

        patch: <T>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
            request<T>(endpoint, {
                ...options,
                method: 'PATCH',
                body: data ? JSON.stringify(data) : undefined
            }),

        delete: <T>(endpoint: string, options: RequestOptions = {}) =>
            request<T>(endpoint, {
                ...options,
                method: 'DELETE'
            }),

        getBaseUrl: () => {
            const shouldUseProxy = import.meta.client && config.public.useProxy === true;
            return shouldUseProxy ? config.public.proxyPath : config.public.apiBase?.replace(/\/$/, '');
        },

        getCsrfToken: async () => {
            if (!csrfToken.value) {
                await refreshCsrfToken();
            }
            return csrfToken.value;
        },
        refreshCsrfToken
    };
};
