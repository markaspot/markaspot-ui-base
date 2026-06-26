/**
 * API Client Tests
 *
 * Tests endpoint allowlist validation, jurisdiction auto-injection,
 * CSRF token lifecycle (caching, deduplication, 503 handling),
 * and HTTP request error classification.
 *
 * The composable is the security boundary between the Nuxt frontend
 * and the Drupal backend - all API calls pass through it.
 *
 * @see app/composables/api/useApiClient.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearMockState, mockNavigateTo, mockRouteData, mockRuntimeConfigData } from '../../__mocks__/nuxt';

import { useApiClient, ApiError, API_ERROR_KEYS } from '@/composables/api/useApiClient';
import { useState } from '#app';

// ============================================================================
// Mock setup (must be before imports that use them)
// ============================================================================

let mockTokenCache: {
    getCachedToken: ReturnType<typeof vi.fn>
    setCachedToken: ReturnType<typeof vi.fn>
    invalidateToken: ReturnType<typeof vi.fn>
    getPendingFetch: ReturnType<typeof vi.fn>
    setPendingFetch: ReturnType<typeof vi.fn>
};

let mockServiceStatus: {
    shouldRetry: ReturnType<typeof vi.fn>
    registerServiceFailure: ReturnType<typeof vi.fn>
    registerServiceSuccess: ReturnType<typeof vi.fn>
    getServiceDownMessage: ReturnType<typeof vi.fn>
};

vi.mock('~/composables/api/useTokenCache', () => ({
    useTokenCache: () => mockTokenCache
}));

vi.mock('~/composables/core/useServiceStatus', () => ({
    useServiceStatus: () => mockServiceStatus
}));

vi.mock('@/utils/locale', () => ({
    getCurrentLocale: vi.fn(() => 'de')
}));

// ============================================================================
// Helpers
// ============================================================================

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: any, status = 200, statusText = 'OK') {
    return new Response(JSON.stringify(data), {
        status,
        statusText,
        headers: { 'Content-Type': 'application/json' }
    });
}

function textResponse(text: string, status = 200, statusText = 'OK') {
    return new Response(text, { status, statusText });
}

function setJurisdiction(id: number) {
    const state = useState('mas-config-state', () => ({ jurisdiction: { id } }));
    state.value = { jurisdiction: { id } };
}

function setJurisdictionSlug(slug: string) {
    const state = useState('mas-config-jurisdiction-key', () => slug);
    state.value = slug;
}

function setAuthUser(groups: Array<{ id: string | number, slug?: string | null }>, roles: string[] = ['authenticated', 'tenant_admin']) {
    const state = useState('auth_user', () => null);
    state.value = { roles, groups };
}

// ============================================================================
// Global setup
// ============================================================================

beforeEach(() => {
    clearMockState();
    localStorage.clear();
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});

    // Default: token cache always returns a cached token (no fetch needed)
    mockTokenCache = {
        getCachedToken: vi.fn(() => 'test-csrf-token'),
        setCachedToken: vi.fn(),
        invalidateToken: vi.fn(),
        getPendingFetch: vi.fn(() => null),
        setPendingFetch: vi.fn()
    };

    // Default: service is up, retry is allowed
    mockServiceStatus = {
        shouldRetry: vi.fn(() => true),
        registerServiceFailure: vi.fn(),
        registerServiceSuccess: vi.fn(),
        getServiceDownMessage: vi.fn(() => 'Service unavailable')
    };

    mockRuntimeConfigData.public.apiBase = 'https://dev.ddev.site';
    mockRuntimeConfigData.public.useProxy = false;
});

// ============================================================================
// ApiError class
// ============================================================================

describe('ApiError', () => {
    it('extracts detail from JSON:API error data', () => {
        const error = new ApiError(422, 'Unprocessable Entity', {
            errors: [{ detail: 'Title is required', title: 'Validation Error' }]
        });
        expect(error.message).toBe('Title is required');
        expect(error.status).toBe(422);
        expect(error.statusText).toBe('Unprocessable Entity');
        expect(error.name).toBe('ApiError');
    });

    it('extracts detail from nested data.errors format', () => {
        const error = new ApiError(422, 'Unprocessable Entity', {
            data: { errors: [{ detail: 'Nested error detail' }] }
        });
        expect(error.message).toBe('Nested error detail');
    });

    it('falls back to title when no detail', () => {
        const error = new ApiError(422, 'Unprocessable Entity', {
            errors: [{ title: 'Validation Error' }]
        });
        expect(error.message).toBe('Validation Error');
    });

    it('extracts the flat message field from H3/proxy error bodies', () => {
        // The image/jsonapi proxy surfaces upstream failures as
        // createSafeError({ statusCode, message, data }) — the message must be
        // shown instead of the unhelpful "API Error: <status>" fallback.
        const error = new ApiError(503, 'Service Unavailable', {
            statusCode: 503,
            message: 'Backend service unavailable: The requested service is temporarily unavailable'
        });
        expect(error.message).toBe('Backend service unavailable: The requested service is temporarily unavailable');
    });

    it('uses a friendly 503 fallback when no message is present', () => {
        expect(new ApiError(503, 'Service Unavailable', {}).message)
            .toBe('Service temporarily unavailable. Please try again shortly.');
    });

    it('uses status-specific fallback when no error data', () => {
        expect(new ApiError(429, 'Too Many Requests', {}).message)
            .toBe('Too many requests. Please wait and try again.');
        expect(new ApiError(401, 'Unauthorized', {}).message)
            .toBe('Not authorized. Please sign in again.');
        expect(new ApiError(403, 'Forbidden', {}).message)
            .toBe('Access denied.');
        expect(new ApiError(404, 'Not Found', {}).message)
            .toBe('Resource not found.');
        expect(new ApiError(500, 'Internal Server Error', {}).message)
            .toBe('Server error. Please try again later.');
    });

    it('uses generic fallback for unknown status', () => {
        const error = new ApiError(418, 'I\'m a Teapot', {});
        expect(error.message).toBe('API Error: 418');
        expect(error.errorKey).toBeUndefined();
    });

    it('sets errorKey from API_ERROR_KEYS mapping', () => {
        expect(new ApiError(429, '', {}).errorKey).toBe('errors.api.rate_limit');
        expect(new ApiError(401, '', {}).errorKey).toBe('errors.api.unauthorized');
        expect(new ApiError(403, '', {}).errorKey).toBe('errors.api.forbidden');
        expect(new ApiError(404, '', {}).errorKey).toBe('errors.api.not_found');
        expect(new ApiError(500, '', {}).errorKey).toBe('errors.api.server_error');
    });

    it('prefers error detail over fallback message', () => {
        const error = new ApiError(429, 'Too Many Requests', {
            errors: [{ detail: 'Custom rate limit message' }]
        });
        expect(error.message).toBe('Custom rate limit message');
    });

    it('preserves original data on the error', () => {
        const data = { errors: [{ detail: 'test' }], meta: { extra: true } };
        const error = new ApiError(422, 'Unprocessable', data);
        expect(error.data).toBe(data);
    });
});

// ============================================================================
// API_ERROR_KEYS
// ============================================================================

describe('API_ERROR_KEYS', () => {
    it('maps known status codes to i18n keys', () => {
        expect(API_ERROR_KEYS[429]).toBe('errors.api.rate_limit');
        expect(API_ERROR_KEYS[401]).toBe('errors.api.unauthorized');
        expect(API_ERROR_KEYS[403]).toBe('errors.api.forbidden');
        expect(API_ERROR_KEYS[404]).toBe('errors.api.not_found');
        expect(API_ERROR_KEYS[500]).toBe('errors.api.server_error');
    });

    it('returns undefined for unmapped status codes', () => {
        expect(API_ERROR_KEYS[418]).toBeUndefined();
        expect(API_ERROR_KEYS[422]).toBeUndefined();
        expect(API_ERROR_KEYS[503]).toBeUndefined();
    });
});

// ============================================================================
// Endpoint allowlist validation (tested via get/post)
// ============================================================================

describe('endpoint validation', () => {
    it('allows listed JSON:API endpoints', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
        const client = useApiClient();
        await client.get('/jsonapi/node/service_request');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/jsonapi/node/service_request'),
            expect.any(Object)
        );
    });

    it('allows JSON:API endpoint with UUID', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: {} }));
        const client = useApiClient();
        await client.get('/jsonapi/node/service_request/550e8400-e29b-41d4-a716-446655440000');
        expect(mockFetch).toHaveBeenCalled();
    });

    it('allows JSON:API endpoint with UUID and nested path', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: {} }));
        const client = useApiClient();
        await client.get('/jsonapi/node/service_request/550e8400-e29b-41d4-a716-446655440000/relationships/field_category');
        expect(mockFetch).toHaveBeenCalled();
    });

    it('allows custom API paths', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/mark-a-spot-settings'),
            expect.any(Object)
        );
    });

    it('allows custom API path with sub-path', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/auth/request-code');
        expect(mockFetch).toHaveBeenCalled();
    });

    it('allows group-members requests for groups in the authenticated user scope', async () => {
        setAuthUser([{ id: '1' }, { id: '2' }]);
        mockFetch.mockResolvedValueOnce(jsonResponse({ invitations: [] }));

        const client = useApiClient();
        await client.get('/group-members/invitations', { group_id: '2' });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/group-members/invitations?group_id=2'),
            expect.any(Object)
        );
    });

    it('blocks group-members query requests for groups outside the authenticated user scope', async () => {
        setAuthUser([{ id: '1' }]);

        const client = useApiClient();
        await expect(client.get('/group-members/invitations', { group_id: '5' }))
            .rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocks group-members URL query strings for groups outside the authenticated user scope', async () => {
        setAuthUser([{ id: '1' }]);

        const client = useApiClient();
        await expect(client.get('/group-members/invitations?group_id=5'))
            .rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocks group-members invite bodies for groups outside the authenticated user scope', async () => {
        setAuthUser([{ id: '1' }]);

        const client = useApiClient();
        await expect(client.post('/group-members/invite', {
            email: 'user@example.com',
            group_id: 5,
            roles: ['org-member']
        })).rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocks group-members membership updates for groups outside the authenticated user scope', async () => {
        setAuthUser([{ id: '1' }]);

        const client = useApiClient();
        await expect(client.patch('/group-members/42', {
            memberships: {
                1: { action: 'set', roles: ['jur-editor'] },
                5: { action: 'set', roles: ['org-member'] }
            }
        })).rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('allows administrator group-members requests without local group scope', async () => {
        setAuthUser([], ['authenticated', 'administrator']);
        mockFetch.mockResolvedValueOnce(jsonResponse({ invitations: [] }));

        const client = useApiClient();
        await client.get('/group-members/invitations', { group_id: '5' });

        expect(mockFetch).toHaveBeenCalled();
    });

    it('allows tenant-settings requests for jurisdictions in the authenticated user scope', async () => {
        setAuthUser([{ id: '5' }]);
        mockFetch.mockResolvedValueOnce(jsonResponse({}));

        const client = useApiClient();
        await client.get('/tenant-settings/5/features');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/tenant-settings/5/features'),
            expect.any(Object)
        );
    });

    it('blocks tenant-settings requests for jurisdictions outside the authenticated user scope', async () => {
        setAuthUser([{ id: '5' }]);

        const client = useApiClient();
        await expect(client.patch('/tenant-settings/8/features', {
            enabled: true
        })).rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('allows encoded tenant-settings path ids in the authenticated user scope', async () => {
        setAuthUser([{ id: '5' }]);
        mockFetch.mockResolvedValueOnce(jsonResponse({}));

        const client = useApiClient();
        await client.get('/tenant-settings/%35/features');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/tenant-settings/%35/features'),
            expect.any(Object)
        );
    });

    it('allows tenant-settings requests using the jurisdiction slug when slug is in auth_user scope', async () => {
        setAuthUser([{ id: '5', slug: 'rotterdam' }]);
        mockFetch.mockResolvedValueOnce(jsonResponse({}));

        const client = useApiClient();
        await client.get('/tenant-settings/rotterdam/features');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/tenant-settings/rotterdam/features'),
            expect.any(Object)
        );
    });

    it('blocks tenant-settings requests with a slug that is not in auth_user scope', async () => {
        setAuthUser([{ id: '5', slug: 'rotterdam' }]);

        const client = useApiClient();
        await expect(client.patch('/tenant-settings/amsterdam/features', { enabled: true }))
            .rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('still allows the numeric form when both forms are present in scope', async () => {
        setAuthUser([{ id: '5', slug: 'rotterdam' }]);
        mockFetch.mockResolvedValueOnce(jsonResponse({}));

        const client = useApiClient();
        await client.get('/tenant-settings/5/features');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/tenant-settings/5/features'),
            expect.any(Object)
        );
    });

    it('allows moderation requests for jurisdictions in the authenticated user scope', async () => {
        setAuthUser([{ id: '5' }]);
        mockFetch.mockResolvedValueOnce(jsonResponse({ requests: [] }));

        const client = useApiClient();
        await client.get('/moderation/flagged-requests', { jurisdiction_id: '5' });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/moderation/flagged-requests?jurisdiction_id=5'),
            expect.any(Object)
        );
    });

    it('blocks moderation query requests for jurisdictions outside the authenticated user scope', async () => {
        setAuthUser([{ id: '5' }]);

        const client = useApiClient();
        await expect(client.get('/moderation/flagged-requests?jurisdiction_id=8'))
            .rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocks arbitrary moderation prefix requests outside the authenticated user scope', async () => {
        setAuthUser([{ id: '5' }]);

        const client = useApiClient();
        await expect(client.get('/moderation/some-endpoint?jurisdiction_id=8'))
            .rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocks bracketed scope query keys outside the authenticated user scope', async () => {
        setAuthUser([{ id: '5' }]);

        const client = useApiClient();
        await expect(client.get('/moderation/flagged-requests?jurisdiction_id[]=8'))
            .rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocks moderation bodies for jurisdictions outside the authenticated user scope', async () => {
        setAuthUser([{ id: '5' }]);

        const client = useApiClient();
        await expect(client.post('/moderation/flags/123/dismiss', {
            jurisdiction_id: 8
        })).rejects.toMatchObject({ status: 403 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocks scoped custom API requests without explicit scope ids', async () => {
        setAuthUser([{ id: '5' }]);

        const client = useApiClient();
        await expect(client.get('/group-members'))
            .rejects.toMatchObject({ status: 400 });
        await expect(client.get('/tenant-settings'))
            .rejects.toMatchObject({ status: 400 });
        await expect(client.get('/moderation/flagged-requests'))
            .rejects.toMatchObject({ status: 400 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocks administrator scoped custom API requests without explicit scope ids', async () => {
        setAuthUser([], ['authenticated', 'administrator']);

        const client = useApiClient();
        await expect(client.get('/moderation/flagged-requests'))
            .rejects.toMatchObject({ status: 400 });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('allows public group-members claim requests without explicit scope ids', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ status: 'claimed' }));

        const client = useApiClient();
        await client.post('/group-members/claim/abc123');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/group-members/claim/abc123'),
            expect.any(Object)
        );
    });

    it('allows administrator scoped custom API requests without local group scope', async () => {
        setAuthUser([], ['authenticated', 'administrator']);
        mockFetch.mockResolvedValueOnce(jsonResponse({}));

        const client = useApiClient();
        await client.patch('/tenant-settings/8/features', { enabled: true });

        expect(mockFetch).toHaveBeenCalled();
    });

    it('blocks unauthorized JSON:API endpoints', async () => {
        const client = useApiClient();
        await expect(client.get('/jsonapi/user/secret'))
            .rejects.toThrow(ApiError);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('blocked endpoint throws 403 with detail', async () => {
        const client = useApiClient();
        try {
            await client.get('/jsonapi/config/system.site');
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as ApiError).status).toBe(403);
        }
    });

    it('allows non-JSON:API endpoints (pass-through)', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/session/token');
        expect(mockFetch).toHaveBeenCalled();
    });

    it('strips query params before validation', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
        const client = useApiClient();
        await client.get('/jsonapi/node/service_request', { 'filter[status]': 'open' });
        expect(mockFetch).toHaveBeenCalled();
    });

    it('allows configured JSON:API resource types', async () => {
        const paths = [
            '/jsonapi/media/request_image/field_media_image',
            '/jsonapi/media/request_image',
            '/jsonapi/node/service_request',
            '/jsonapi/node/page',
            '/jsonapi/taxonomy_term/service_category',
            '/jsonapi/taxonomy_term/service_status',
            '/jsonapi/taxonomy_term/internal_status',
            '/jsonapi/taxonomy_term/district',
            '/jsonapi/citizen_entity/citizen_entity',
            '/jsonapi/user/user',
            '/jsonapi/group/jur',
            '/jsonapi/group/org',
            '/jsonapi/group/organisation',
            '/jsonapi/taxonomy_term/priority',
            '/jsonapi/taxonomy_term/service_provider',
            '/jsonapi/file/file'
        ];
        for (const path of paths) {
            mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
            const client = useApiClient();
            await client.get(path);
        }
        expect(mockFetch).toHaveBeenCalledTimes(paths.length);
    });

    it('allows dynamic media type paths for imagelist', async () => {
        const dynamicPaths = [
            '/jsonapi/media/catalog_image',
            '/jsonapi/media/systemskizze',
            '/jsonapi/media/hazard_category_image'
        ];
        for (const path of dynamicPaths) {
            mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
            const client = useApiClient();
            await client.get(path);
        }
        expect(mockFetch).toHaveBeenCalledTimes(dynamicPaths.length);
    });

    it('rejects invalid media type paths', async () => {
        const invalidPaths = [
            '/jsonapi/media/../../etc/passwd',
            '/jsonapi/media/UPPER_CASE',
            '/jsonapi/media/123invalid'
        ];
        for (const path of invalidPaths) {
            const client = useApiClient();
            await expect(client.get(path)).rejects.toThrow();
        }
    });
});

// ============================================================================
// Jurisdiction auto-injection
// ============================================================================

describe('jurisdiction injection', () => {
    it('injects jurisdiction for GeoReport list endpoints', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction_id=14');
    });

    it('injects jurisdiction for GeoReport services endpoint', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/services.json');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction_id=14');
    });

    it('injects jurisdiction for single request by ID (request IDs are jurisdiction-scoped)', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/georeport/v2/requests/3029-2024.json');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction_id=14');
    });

    it('skips injection for non-GeoReport endpoints', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
        const client = useApiClient();
        await client.get('/jsonapi/node/service_request');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain('jurisdiction_id=');
    });

    it('skips injection when jurisdiction_id already in params', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/services.json', { jurisdiction_id: '15' });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction_id=15');
        // Should NOT also contain jurisdiction_id=14
        const matches = calledUrl.match(/jurisdiction_id=/g);
        expect(matches).toHaveLength(1);
    });

    it('skips injection when deprecated jurisdiction param present', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json', { jurisdiction: '15' });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain('jurisdiction_id=14');
        expect(calledUrl).toContain('jurisdiction=15');
    });

    it('skips injection when deprecated gid param present', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json', { gid: '15' });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain('jurisdiction_id=14');
        expect(calledUrl).toContain('gid=15');
    });

    it('skips injection when group_filter present', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json', { group_filter: 'true' });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain('jurisdiction_id=14');
    });

    it('skips injection when group_id present', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json', { group_id: '5' });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain('jurisdiction_id=14');
    });

    it('skips injection when org_id present', async () => {
        setJurisdiction(14);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json', { org_id: '5' });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain('jurisdiction_id=14');
        expect(calledUrl).toContain('org_id=5');
    });

    it('skips injection when no jurisdiction configured', async () => {
        // Don't call setJurisdiction
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain('jurisdiction_id=');
    });

    // ── Slug injection (markaspot-ui#284) ──────────────────────────────────
    // The backend's resolveJurisdictionId() accepts slugs in jurisdiction_id.
    // The frontend should pass the slug from mas-config-jurisdiction-key so the
    // API call is human-readable and no extra numeric-to-slug lookup is needed.

    it('injects slug from mas-config-jurisdiction-key (multi-tenant mode)', async () => {
        setJurisdictionSlug('amsterdam');
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction_id=amsterdam');
    });

    it('prefers slug over numeric ID when both are set', async () => {
        setJurisdictionSlug('rotterdam');
        setJurisdiction(5);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        // Slug must win
        expect(calledUrl).toContain('jurisdiction_id=rotterdam');
        expect(calledUrl).not.toContain('jurisdiction_id=5');
    });

    it('falls back to numeric ID when slug key is absent', async () => {
        // Only numeric state set, no slug key
        setJurisdiction(7);
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction_id=7');
    });

    it('does not inject when slug key is empty string', async () => {
        setJurisdictionSlug('');
        // No numeric state either
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).not.toContain('jurisdiction_id=');
    });

    it('slug injection is skipped when explicit jurisdiction_id param provided', async () => {
        setJurisdictionSlug('amsterdam');
        mockFetch.mockResolvedValueOnce(jsonResponse([]));
        const client = useApiClient();
        await client.get('/georeport/v2/requests.json', { jurisdiction_id: 'rotterdam' });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction_id=rotterdam');
        // Auto-injected slug must NOT duplicate
        const matches = calledUrl.match(/jurisdiction_id=/g);
        expect(matches).toHaveLength(1);
    });
});

// ============================================================================
// URL construction
// ============================================================================

describe('URL construction', () => {
    it('uses apiBase in SSR mode (import.meta.client undefined)', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toBe('https://dev.ddev.site/mark-a-spot-settings');
    });

    it('appends query parameters', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings', { jurisdiction: '14', lang: 'de' });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction=14');
        expect(calledUrl).toContain('lang=de');
    });

    it('prepends slash if missing', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('mark-a-spot-settings');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toBe('https://dev.ddev.site/mark-a-spot-settings');
    });

    it('strips trailing slash from baseUrl', async () => {
        mockRuntimeConfigData.public.apiBase = 'https://dev.ddev.site/';
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toBe('https://dev.ddev.site/mark-a-spot-settings');
    });

    it('filters null and undefined params', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings', {
            jurisdiction: '14',
            empty: undefined as any,
            nul: null as any
        });

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('jurisdiction=14');
        expect(calledUrl).not.toContain('empty');
        expect(calledUrl).not.toContain('nul');
    });
});

// ============================================================================
// CSRF token management
// ============================================================================

describe('refreshCsrfToken', () => {
    it('uses cached token without fetching', async () => {
        mockTokenCache.getCachedToken.mockReturnValue('cached-token');
        const client = useApiClient();
        const token = await client.getCsrfToken();

        expect(token).toBe('cached-token');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches new token when cache is empty', async () => {
        mockTokenCache.getCachedToken.mockReturnValue(null);
        mockFetch.mockResolvedValueOnce(textResponse('fresh-csrf-token-abc'));

        const client = useApiClient();
        const token = await client.getCsrfToken();

        expect(token).toBe('fresh-csrf-token-abc');
        expect(mockTokenCache.setCachedToken).toHaveBeenCalledWith('fresh-csrf-token-abc');
        expect(mockServiceStatus.registerServiceSuccess).toHaveBeenCalled();
    });

    it('fetches token from /session/token endpoint', async () => {
        mockTokenCache.getCachedToken.mockReturnValue(null);
        mockFetch.mockResolvedValueOnce(textResponse('token'));

        const client = useApiClient();
        await client.getCsrfToken();

        expect(mockFetch).toHaveBeenCalledWith(
            'https://dev.ddev.site/session/token',
            expect.objectContaining({
                credentials: 'include',
                cache: 'no-store'
            })
        );
    });

    it('waits for pending fetch instead of starting new one', async () => {
        mockTokenCache.getCachedToken
            .mockReturnValueOnce(null) // first check
            .mockReturnValueOnce('pending-token'); // after pending resolves
        mockTokenCache.getPendingFetch.mockReturnValue(Promise.resolve('pending-token'));

        const client = useApiClient();
        const token = await client.getCsrfToken();

        expect(token).toBe('pending-token');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles 503 by registering service failure', async () => {
        mockTokenCache.getCachedToken.mockReturnValue(null);
        mockFetch.mockResolvedValueOnce(
            textResponse('Service Unavailable', 503, 'Service Unavailable')
        );

        const client = useApiClient();
        await client.getCsrfToken();

        expect(mockServiceStatus.registerServiceFailure).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 503 })
        );
    });

    it('detects maintenance mode in non-OK response', async () => {
        mockTokenCache.getCachedToken.mockReturnValue(null);
        mockFetch.mockResolvedValueOnce(
            textResponse('<html>Site is in Wartungsmodus</html>', 500, 'Internal Server Error')
        );

        const client = useApiClient();
        await client.getCsrfToken();

        expect(mockServiceStatus.registerServiceFailure).toHaveBeenCalled();
    });

    it('skips fetch when service is down and retry window not elapsed', async () => {
        mockTokenCache.getCachedToken.mockReturnValue(null);
        mockServiceStatus.shouldRetry.mockReturnValue(false);

        const client = useApiClient();
        await client.getCsrfToken();

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('clears pending fetch in finally block', async () => {
        mockTokenCache.getCachedToken.mockReturnValue(null);
        mockFetch.mockResolvedValueOnce(textResponse('token-xyz'));

        const client = useApiClient();
        await client.getCsrfToken();

        // setPendingFetch called with the promise first, then null in finally
        expect(mockTokenCache.setPendingFetch).toHaveBeenCalledWith(null);
    });

    it('handles network error gracefully', async () => {
        mockTokenCache.getCachedToken.mockReturnValue(null);
        mockFetch.mockRejectedValueOnce(new Error('Network failure'));

        const client = useApiClient();
        const token = await client.getCsrfToken();

        // Should return null (no token), not throw
        expect(token).toBeNull();
        expect(mockTokenCache.setPendingFetch).toHaveBeenCalledWith(null);
    });
});

// ============================================================================
// Request headers
// ============================================================================

describe('request headers', () => {
    it('sets JSON:API Accept header', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        const headers = mockFetch.mock.calls[0][1].headers;
        expect(headers['Accept']).toBe('application/vnd.api+json');
    });

    it('sets Accept-Language from locale', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        const headers = mockFetch.mock.calls[0][1].headers;
        expect(headers['Accept-Language']).toBe('de');
    });

    it('sets X-Translation-Language from locale', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        const headers = mockFetch.mock.calls[0][1].headers;
        expect(headers['X-Translation-Language']).toBe('de');
    });

    it('sets X-CSRF-Token from cache', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        const headers = mockFetch.mock.calls[0][1].headers;
        expect(headers['X-CSRF-Token']).toBe('test-csrf-token');
    });

    it('sets default Content-Type for JSON:API', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        const headers = mockFetch.mock.calls[0][1].headers;
        expect(headers['Content-Type']).toBe('application/vnd.api+json');
    });

    it('allows custom Content-Type override', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.post('/feedback', {}, {
            headers: { 'Content-Type': 'application/json' }
        });

        const headers = mockFetch.mock.calls[0][1].headers;
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('sends credentials: include', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        expect(mockFetch.mock.calls[0][1].credentials).toBe('include');
    });

    it('uses no-store cache for GET requests', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        expect(mockFetch.mock.calls[0][1].cache).toBe('no-store');
    });
});

// ============================================================================
// HTTP method helpers
// ============================================================================

describe('HTTP methods', () => {
    it('GET sends correct method', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
        const client = useApiClient();
        await client.get('/jsonapi/node/service_request');

        expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    });

    it('POST stringifies JSON data', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: {} }));
        const client = useApiClient();
        const payload = { data: { type: 'node--service_request', attributes: {} } };
        await client.post('/jsonapi/node/service_request', payload);

        expect(mockFetch.mock.calls[0][1].method).toBe('POST');
        expect(mockFetch.mock.calls[0][1].body).toBe(JSON.stringify(payload));
    });

    it('PATCH sends correct method', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: {} }));
        const client = useApiClient();
        await client.patch('/jsonapi/node/service_request/550e8400-e29b-41d4-a716-446655440000', {});

        expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
    });

    it('DELETE sends correct method', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.delete('/jsonapi/node/service_request/550e8400-e29b-41d4-a716-446655440000');

        expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    });

    it('POST passes FormData as-is (no stringify)', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ data: {} }));
        const client = useApiClient();
        const formData = new FormData();
        formData.append('file', 'blob');
        await client.post('/jsonapi/media/request_image', formData);

        expect(mockFetch.mock.calls[0][1].body).toBeInstanceOf(FormData);
    });

    it('POST sends undefined body when no data', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.post('/auth/logout');

        expect(mockFetch.mock.calls[0][1].body).toBeUndefined();
    });
});

// ============================================================================
// Response handling
// ============================================================================

describe('response handling', () => {
    it('returns parsed JSON for successful response', async () => {
        const payload = { data: [{ id: '1', type: 'node--service_request' }] };
        mockFetch.mockResolvedValueOnce(jsonResponse(payload));
        const client = useApiClient();
        const result = await client.get('/jsonapi/node/service_request');

        expect(result).toEqual(payload);
    });

    it('returns null for empty response body', async () => {
        mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));
        const client = useApiClient();
        const result = await client.get('/mark-a-spot-settings');

        expect(result).toBeNull();
    });

    it('registers service success on 200', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}));
        const client = useApiClient();
        await client.get('/mark-a-spot-settings');

        expect(mockServiceStatus.registerServiceSuccess).toHaveBeenCalled();
    });

    it('throws a sanitized ApiError for invalid JSON success responses', async () => {
        mockFetch.mockResolvedValueOnce(
            new Response('SMTP error: internal.mail.local<br>{"success":false}', { status: 200, statusText: 'OK' })
        );
        const client = useApiClient();

        try {
            await client.get('/auth/request-code');
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as ApiError).status).toBe(502);
            expect((e as ApiError).message).toBe('Server returned an invalid response. Please try again later.');
            expect((e as ApiError).message).not.toContain('SMTP');
        }
    });
});

// ============================================================================
// Error handling
// ============================================================================

describe('error handling', () => {
    it('handles 401 by clearing local auth state and redirecting to tenant login', async () => {
        setAuthUser([{ id: '5' }]);
        useState<string | null>('csrfToken').value = 'stale-csrf-token';
        useState<boolean>('auth_code_requested').value = true;
        useState<string | null>('auth_code_email').value = 'admin@example.com';
        localStorage.setItem('markASpotConfig', 'cached');
        mockRouteData.path = '/noord/dashboard/members';
        mockRouteData.fullPath = '/noord/dashboard/members?tab=users';
        mockFetch.mockResolvedValueOnce(jsonResponse(
            { errors: [{ detail: 'Session expired' }] },
            401,
            'Unauthorized'
        ));

        const client = useApiClient();
        await expect(client.get('/group-members/invitations', { group_id: '5' }))
            .rejects.toMatchObject({ status: 401 });

        expect(useState('auth_user').value).toBeNull();
        expect(useState('csrfToken').value).toBeNull();
        expect(useState('auth_code_requested').value).toBe(false);
        expect(useState('auth_code_email').value).toBeNull();
        expect(mockTokenCache.invalidateToken).toHaveBeenCalled();
        expect(localStorage.getItem('markASpotConfig')).toBeNull();
        expect(mockNavigateTo).toHaveBeenCalledWith(
            '/noord/auth/login?redirect=%2Fnoord%2Fdashboard%2Fmembers%3Ftab%3Dusers',
            { replace: true }
        );
    });

    it('does not redirect on auth endpoint 401 responses', async () => {
        setAuthUser([{ id: '5' }]);
        mockRouteData.path = '/noord/auth/login';
        mockRouteData.fullPath = '/noord/auth/login';
        mockFetch.mockResolvedValueOnce(jsonResponse(
            { errors: [{ detail: 'Invalid code' }] },
            401,
            'Unauthorized'
        ));

        const client = useApiClient();
        await expect(client.post('/auth/verify-code', { code: '000000' }))
            .rejects.toMatchObject({ status: 401 });

        expect(useState('auth_user').value).toEqual({
            roles: ['authenticated', 'tenant_admin'],
            groups: [{ id: '5' }]
        });
        expect(mockTokenCache.invalidateToken).not.toHaveBeenCalled();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('clears auth state but does not redirect non-auth endpoint 401s while already on an auth route', async () => {
        setAuthUser([{ id: '5' }]);
        mockRouteData.path = '/noord/auth/login';
        mockRouteData.fullPath = '/noord/auth/login?redirect=%2Fnoord%2Fdashboard';
        mockFetch.mockResolvedValueOnce(jsonResponse(
            { errors: [{ detail: 'Session expired' }] },
            401,
            'Unauthorized'
        ));

        const client = useApiClient();
        await expect(client.get('/group-members/invitations', { group_id: '5' }))
            .rejects.toMatchObject({ status: 401 });

        expect(useState('auth_user').value).toBeNull();
        expect(mockTokenCache.invalidateToken).toHaveBeenCalled();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('redirects non-tenant routes to the unprefixed login page', async () => {
        setAuthUser([{ id: '5' }]);
        mockRouteData.path = '/requests/2026-1';
        mockRouteData.fullPath = '/requests/2026-1';
        mockFetch.mockResolvedValueOnce(jsonResponse(
            { errors: [{ detail: 'Session expired' }] },
            401,
            'Unauthorized'
        ));

        const client = useApiClient();
        await expect(client.get('/mark-a-spot-settings'))
            .rejects.toMatchObject({ status: 401 });

        expect(mockNavigateTo).toHaveBeenCalledWith(
            '/auth/login?redirect=%2Frequests%2F2026-1',
            { replace: true }
        );
    });

    it('does not redirect anonymous users on a non-auth 401 (preserves the form)', async () => {
        // No authenticated user: a 401 here is a missing-permission error
        // (e.g. anon lacks `create field_address` on report submit), not a
        // session expiry. Redirecting would discard the citizen's filled-in form,
        // so the error must fall through to the form instead.
        useState('auth_user').value = null;
        mockRouteData.path = '/requests/2026-1';
        mockRouteData.fullPath = '/requests/2026-1';
        mockFetch.mockResolvedValueOnce(jsonResponse(
            { errors: [{ detail: 'Forbidden' }] },
            401,
            'Unauthorized'
        ));

        const client = useApiClient();
        await expect(client.get('/mark-a-spot-settings'))
            .rejects.toMatchObject({ status: 401 });

        expect(mockNavigateTo).not.toHaveBeenCalled();
        expect(mockTokenCache.invalidateToken).not.toHaveBeenCalled();
    });

    it('throws ApiError for 503 and registers service failure', async () => {
        mockFetch.mockResolvedValueOnce(
            textResponse('Service Unavailable', 503, 'Service Unavailable')
        );
        const client = useApiClient();

        try {
            await client.get('/mark-a-spot-settings');
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as ApiError).status).toBe(503);
        }
        expect(mockServiceStatus.registerServiceFailure).toHaveBeenCalled();
    });

    it('throws 503 before fetch when service is down', async () => {
        // shouldRetry in request() is the first call because refreshCsrfToken
        // returns early when token cache has a value (no shouldRetry needed there)
        mockServiceStatus.shouldRetry.mockReturnValue(false);

        const client = useApiClient();
        try {
            await client.get('/mark-a-spot-settings');
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as ApiError).status).toBe(503);
        }
        // Fetch should NOT have been called
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws ApiError for 422 with JSON:API validation errors', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse(
            {
                errors: [{
                    status: '422',
                    title: 'Unprocessable Entity',
                    detail: 'body: This value should not be blank.',
                    source: { pointer: '/data/attributes/body' }
                }]
            },
            422,
            'Unprocessable Entity'
        ));
        const client = useApiClient();

        try {
            await client.post('/jsonapi/node/service_request', {});
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as ApiError).status).toBe(422);
            expect((e as ApiError).message).toBe('body: This value should not be blank.');
        }
    });

    it('attaches originalMessage for 429 with JSON body', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse(
            { message: 'Rate limit exceeded: 10/min' },
            429,
            'Too Many Requests'
        ));
        const client = useApiClient();

        try {
            await client.post('/jsonapi/node/service_request', {});
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as any).originalMessage).toBe('Rate limit exceeded: 10/min');
        }
    });

    it('handles 429 with non-JSON response body', async () => {
        mockFetch.mockResolvedValueOnce(
            textResponse('Too many requests', 429, 'Too Many Requests')
        );
        const client = useApiClient();

        try {
            await client.post('/feedback', {});
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as ApiError).status).toBe(429);
            expect((e as any).originalMessage).toBe('Too many requests');
        }
    });

    it('does not expose non-JSON server error bodies in ApiError messages', async () => {
        mockFetch.mockResolvedValueOnce(
            textResponse('SMTP error: internal.mail.local', 500, 'Internal Server Error')
        );
        const client = useApiClient();

        try {
            await client.post('/auth/request-code', { email: 'user@example.com' });
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as ApiError).status).toBe(500);
            expect((e as ApiError).message).toBe('Server error. Please try again later.');
            expect((e as ApiError).message).not.toContain('SMTP');
        }
    });

    it('wraps TypeError as network error', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const client = useApiClient();

        await expect(client.get('/mark-a-spot-settings'))
            .rejects.toThrow('Network error for /mark-a-spot-settings: Failed to fetch');
    });

    it('re-throws ApiError without wrapping', async () => {
        // Blocked endpoint produces ApiError directly from buildUrl
        const client = useApiClient();
        try {
            await client.get('/jsonapi/config/system.site');
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            // Should NOT be wrapped in generic Error
            expect(e).not.toBeInstanceOf(TypeError);
        }
    });

    it('handles unreadable response body gracefully', async () => {
        // Create a response where text() throws
        const badResponse = {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => {
                throw new Error('Body already consumed');
            },
            headers: new Headers()
        };
        mockFetch.mockResolvedValueOnce(badResponse);
        const client = useApiClient();

        try {
            await client.get('/mark-a-spot-settings');
            expect.unreachable('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            expect((e as ApiError).status).toBe(500);
        }
    });
});

// ============================================================================
// getBaseUrl
// ============================================================================

describe('getBaseUrl', () => {
    it('returns apiBase in SSR mode', () => {
        const client = useApiClient();
        // import.meta.client is undefined in test env -> uses apiBase
        expect(client.getBaseUrl()).toBe('https://dev.ddev.site');
    });

    it('strips trailing slash from apiBase', () => {
        mockRuntimeConfigData.public.apiBase = 'https://dev.ddev.site/';
        const client = useApiClient();
        expect(client.getBaseUrl()).toBe('https://dev.ddev.site');
    });
});
