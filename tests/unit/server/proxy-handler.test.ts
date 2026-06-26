/**
 * Tests for the main proxy handler (server/api/[...path].ts).
 *
 * The handler is the security boundary between the Nuxt frontend and Drupal.
 * It handles: path validation, api_key injection, JSON:API rewriting,
 * session-aware auth, cookie rewriting, error pass-through, and more.
 *
 * Strategy: We import the handler's default export (which is a defineEventHandler
 * callback) and invoke it with a mock H3 event object. All external dependencies
 * ($fetch, useRuntimeConfig, h3, rate-limiter, logger, geocoding) are mocked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import { parseCookies, readBody } from 'h3';
import { checkRateLimit } from '~/server/api/utils/rate-limiter';

// ---------------------------------------------------------------------------
// Import the handler (must come after globalThis setup)
// ---------------------------------------------------------------------------
// The default export is defineEventHandler(async (event) => { ... })
// defineEventHandler returns the handler function directly in h3
import handlerModule, {
    jsonApiRequestNeedsServiceRequestJurisdictionScope,
    jsonApiRequestNeedsServiceRequestPrivateFieldAccess,
    jsonApiRequestNeedsStatusDefinitionAccess
} from '~/server/api/[...path]';

// ---------------------------------------------------------------------------
// Module mocks (must be defined before imports)
// ---------------------------------------------------------------------------

vi.mock('~/server/api/utils/logger', () => ({
    logRequest: vi.fn(),
    logGeocoding: vi.fn()
}));

vi.mock('~/server/api/utils/rate-limiter', () => ({
    getEndpointType: vi.fn((path: string | string[]) => {
        const cleanPath = Array.isArray(path) ? path.join('/') : String(path || '');
        const normalizedPath = cleanPath.replace(/^(?:api\/)+/i, '');
        return normalizedPath === 'vision/analyze' || normalizedPath.startsWith('vision/analyze/')
            ? 'vision'
            : null;
    }),
    isAlwaysRateLimitedPath: vi.fn((path: string | string[] | undefined, method: string) => {
        const cleanPath = Array.isArray(path) ? path.join('/') : String(path || '');
        const normalizedPath = cleanPath.replace(/^(?:api\/)+/i, '');
        const isWrite = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase());
        const matchesVisionAnalyze = normalizedPath === 'vision/analyze' || normalizedPath.startsWith('vision/analyze/');
        const isVisionAnalyze = method.toUpperCase() === 'POST' &&
          matchesVisionAnalyze;
        return (cleanPath.startsWith('georeport/') && method.toUpperCase() === 'POST') || (
            isVisionAnalyze
        ) || (
            method.toUpperCase() === 'POST' && (
                cleanPath.startsWith('jsonapi/node/service_request') ||
                cleanPath.startsWith('jsonapi/media/') ||
                cleanPath.startsWith('jsonapi/file/')
            )
        ) || (
            isWrite && (
                cleanPath === 'feedback' ||
                cleanPath.startsWith('feedback/') ||
                cleanPath === 'api/feedback' ||
                cleanPath.startsWith('api/feedback/') ||
                cleanPath === 'competition' ||
                cleanPath.startsWith('competition/') ||
                cleanPath === 'api/competition' ||
                cleanPath.startsWith('api/competition/') ||
                cleanPath.startsWith('group-members/claim/') ||
                cleanPath.startsWith('api/group-members/claim/') ||
                cleanPath === 'mark-a-spot-settings' ||
                cleanPath.startsWith('mark-a-spot-settings/') ||
                cleanPath === 'api/mark-a-spot-settings' ||
                cleanPath.startsWith('api/mark-a-spot-settings/')
            )
        );
    }),
    checkRateLimit: vi.fn()
}));

vi.mock('~/server/api/handlers/geocoding', () => ({
    handleGeocodingRequest: vi.fn(),
    transformGeocodingResponse: vi.fn((r: unknown) => r)
}));

// Partial h3 mock: keep createError real, mock parseCookies
vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3');
    return {
        ...actual,
        parseCookies: vi.fn(() => ({})),
        readBody: vi.fn(() => ({}))
    };
});

// Mock https Agent to avoid TLS issues in tests
vi.mock('https', () => {
    const AgentMock = function () {
        return {};
    };
    const mod = { Agent: AgentMock };
    return { ...mod, default: mod };
});

const mockParseCookies = parseCookies as ReturnType<typeof vi.fn>;
const mockReadBody = readBody as ReturnType<typeof vi.fn>;
const mockCheckRateLimit = checkRateLimit as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Mock $fetch and useRuntimeConfig (Nitro auto-imports)
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
(globalThis as any).$fetch = mockFetch;

const defaultRuntimeConfig = {
    public: {
        apiBase: 'https://backend.example.com',
        geoReportApiBase: '',
        clientConfig: {
            features: {
                allowGeoreportPost: true
            }
        }
    },
    proxy: {
        rejectUnauthorized: false,
        timeoutSeconds: 30
    },
    private: {}
};

(globalThis as any).useRuntimeConfig = vi.fn(() => defaultRuntimeConfig);

// h3's defineEventHandler returns the handler; unwrap if needed
const handler = typeof handlerModule === 'function'
    ? handlerModule
    : (handlerModule as any).__handler || handlerModule;

// ---------------------------------------------------------------------------
// Helper: create a minimal H3-like event
// ---------------------------------------------------------------------------
function createEvent(options: {
    method?: string
    path?: string
    url?: string
    headers?: Record<string, string>
    cookie?: string
    ip?: string
    rawBody?: Buffer | string | Record<string, unknown>
} = {}): any {
    const method = options.method || 'GET';
    const path = options.path || 'georeport/v2/requests';
    const url = options.url || `/${path}`;
    const headers = { ...(options.headers || {}) };

    const res = {
        statusCode: 200,
        writableEnded: false,
        setHeader: vi.fn()
    };

    return {
        method,
        context: { params: { path } },
        node: {
            req: {
                url,
                headers: { host: 'frontend.example.com', ...headers, cookie: options.cookie },
                socket: { remoteAddress: options.ip || '127.0.0.1' },
                destroyed: false,
                on: vi.fn(), // for abort controller's 'close' listener
                rawBody: options.rawBody
            },
            res
        }
    };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
const originalEnv = { ...process.env };

beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ data: 'ok' });
    mockParseCookies.mockReturnValue({});
    mockReadBody.mockResolvedValue({});
    mockCheckRateLimit.mockImplementation(() => {});
    (globalThis as any).useRuntimeConfig = vi.fn(() => defaultRuntimeConfig);
    process.env.GEOREPORT_API_KEY = 'test-api-key';
    delete process.env.JSONAPI_RANDOM_PATH;
    // suppress console noise
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
});

// ===================================================================
// Tests
// ===================================================================

describe('Proxy Handler - Path validation', () => {
    it('rejects path traversal attempts with 400', async () => {
        const event = createEvent({ path: '../etc/passwd' });
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('blocks JSON:API index endpoint with 404', async () => {
        const event = createEvent({ path: 'jsonapi' });
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('blocks JSON:API index with trailing slash', async () => {
        const event = createEvent({ path: 'jsonapi/' });
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('Proxy Handler - Status definition access detection', () => {
    it('requires auth when service status fields are unrestricted', () => {
        expect(jsonApiRequestNeedsStatusDefinitionAccess(
            'jsonapi/taxonomy_term/service_status',
            new URLSearchParams()
        )).toBe(true);
    });

    it('requires auth when field_status_definition is requested explicitly', () => {
        expect(jsonApiRequestNeedsStatusDefinitionAccess(
            'jsonapi/taxonomy_term/service_status',
            new URLSearchParams({
                'fields[taxonomy_term--service_status]': 'name,field_status_definition'
            })
        )).toBe(true);
    });

    it('requires auth when duplicate field params include field_status_definition', () => {
        const params = new URLSearchParams();
        params.append('fields[taxonomy_term--service_status]', 'drupal_internal__tid,name');
        params.append('fields[taxonomy_term--service_status]', 'field_status_definition');

        expect(jsonApiRequestNeedsStatusDefinitionAccess(
            'jsonapi/taxonomy_term/service_status',
            params
        )).toBe(true);
    });

    it('allows public service status reads that omit field_status_definition', () => {
        expect(jsonApiRequestNeedsStatusDefinitionAccess(
            'jsonapi/taxonomy_term/service_status',
            new URLSearchParams({
                'fields[taxonomy_term--service_status]': 'drupal_internal__tid,name,field_status_hex'
            })
        )).toBe(false);
    });

    it('requires auth for internal status taxonomy reads', () => {
        expect(jsonApiRequestNeedsStatusDefinitionAccess(
            'jsonapi/taxonomy_term/internal_status',
            new URLSearchParams({
                'fields[taxonomy_term--internal_status]': 'drupal_internal__tid,name'
            })
        )).toBe(true);
    });
});

describe('Proxy Handler - Service request private JSON:API access detection', () => {
    it('requires auth when service request fields are unrestricted', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams()
        )).toBe(true);
    });

    it('allows public sparse service request fields', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title,body,field_address'
            })
        )).toBe(false);
    });

    it('requires auth when contact fields are requested explicitly', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,field_e_mail,field_phone'
            })
        )).toBe(true);
    });

    it('requires auth when the node author relationship is requested explicitly', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title,uid'
            })
        )).toBe(true);
    });

    it('requires auth when revision metadata is requested explicitly', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title,revision_uid,revision_log,revision_timestamp'
            })
        )).toBe(true);
    });

    it('requires auth when the node author relationship is included', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title',
                'include': 'uid',
                'fields[user--user]': 'display_name'
            })
        )).toBe(true);
    });

    it('requires auth when the revision author relationship is included', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title',
                'include': 'revision_uid',
                'fields[user--user]': 'display_name'
            })
        )).toBe(true);
    });

    it('requires auth when internal service request fields are requested explicitly', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': [
                    'request_id',
                    'field_object_id',
                    'field_feedback',
                    'field_service_provider',
                    'field_service_provider_status',
                    'field_service_provider_feedback',
                    'field_service_provider_files',
                    'field_boilerplates_sp',
                    'field_status_internal',
                    'field_status_internal_term',
                    'field_reclamation_number',
                    'field_approved',
                    'field_escalation'
                ].join(',')
            })
        )).toBe(true);
    });

    it('requires auth for unknown service request field fields so sparse fieldsets fail closed', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title,field_future_management_only'
            })
        )).toBe(true);
    });

    it('treats only explicitly public service request fields as public', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title,body,field_address,field_geolocation,field_category,field_status'
            })
        )).toBe(false);

        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title,field_organisation'
            })
        )).toBe(true);
    });

    it('requires auth when duplicate field params include private fields', () => {
        const params = new URLSearchParams();
        params.append('fields[node--service_request]', 'request_id,title');
        params.append('fields[node--service_request]', 'field_phone');

        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            params
        )).toBe(true);
    });

    it('requires auth when filters search private contact paths', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title',
                'filter[email][condition][path]': 'field_e_mail',
                'filter[email][condition][operator]': 'CONTAINS',
                'filter[email][condition][value]': 'person@example.com'
            })
        )).toBe(true);
    });

    it('requires auth when direct filters target private contact fields', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title',
                'filter[field_phone]': '0228'
            })
        )).toBe(true);
    });

    it('requires auth when shorthand filters target private contact fields', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title',
                'filter[field_phone][operator]': 'CONTAINS',
                'filter[field_phone][value]': '0228'
            })
        )).toBe(true);
    });

    it('requires auth when sorting by private contact fields', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title',
                'sort': 'field_phone'
            })
        )).toBe(true);
    });

    it('requires auth when descending sort targets private contact fields', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title',
                'sort': '-field_e_mail'
            })
        )).toBe(true);
    });

    it('requires auth when structured sort targets private contact fields', () => {
        expect(jsonApiRequestNeedsServiceRequestPrivateFieldAccess(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title',
                'sort[email][path]': 'field_e_mail',
                'sort[email][direction]': 'ASC'
            })
        )).toBe(true);
    });

    it('requires jurisdiction scope for public collection requests', () => {
        expect(jsonApiRequestNeedsServiceRequestJurisdictionScope(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,title'
            })
        )).toBe(true);
    });

    it('requires jurisdiction scope for private collection requests', () => {
        expect(jsonApiRequestNeedsServiceRequestJurisdictionScope(
            'jsonapi/node/service_request',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,field_e_mail'
            })
        )).toBe(true);
    });

    it('does not require collection jurisdiction scope for direct entity reads', () => {
        expect(jsonApiRequestNeedsServiceRequestJurisdictionScope(
            'jsonapi/node/service_request/11111111-1111-4111-8111-111111111111',
            new URLSearchParams({
                'fields[node--service_request]': 'request_id,field_e_mail'
            })
        )).toBe(false);
    });
});

describe('Proxy Handler - Service request private JSON:API access enforcement', () => {
    const tenantModeratorStatus = {
        authenticated: true,
        user: {
            uid: '42',
            roles: ['authenticated', 'moderator'],
            groups: [
                {
                    id: '19',
                    type: 'jur',
                    roles: [{ id: 'jur-moderator' }]
                },
                {
                    id: '20',
                    type: 'jur',
                    roles: [{ id: 'jur-member' }]
                }
            ]
        }
    };

    const roleScopedModeratorStatus = {
        authenticated: true,
        user: {
            uid: '44',
            roles: ['authenticated', 'moderator'],
            groups: [
                {
                    id: '19',
                    type: 'jur',
                    roles: []
                },
                {
                    id: '20',
                    type: 'jur',
                    roles: [{ id: 'jur-member' }]
                }
            ]
        }
    };

    const tenantAdminStatus = {
        authenticated: true,
        user: {
            uid: '43',
            roles: ['authenticated', 'tenant_admin'],
            groups: [
                {
                    id: '19',
                    type: 'jur',
                    roles: [{ id: 'jur-tenant_admin' }]
                },
                {
                    id: '20',
                    type: 'jur',
                    roles: [{ id: 'jur-member' }]
                }
            ]
        }
    };

    it('rejects anonymous service request private fieldsets before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,field_e_mail'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for service request private fields'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous service request author includes before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request/11111111-1111-4111-8111-111111111111',
            url: '/jsonapi/node/service_request/11111111-1111-4111-8111-111111111111?fields[node--service_request]=request_id,title,uid&include=uid&fields[user--user]=display_name'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous service request email searches before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&filter[email][condition][path]=field_e_mail&filter[email][condition][operator]=CONTAINS&filter[email][condition][value]=person@example.com'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for service request private fields'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous service request shorthand contact searches before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&filter[field_phone][operator]=CONTAINS&filter[field_phone][value]=0228'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for service request private fields'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous service request private contact sorts before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&sort=field_phone'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for service request private fields'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous descending private contact sorts before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&sort=-field_e_mail'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for service request private fields'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous structured private contact sorts before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&sort[email][path]=field_e_mail&sort[email][direction]=ASC'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for service request private fields'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous unscoped public collection reads before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for service request collection'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous public collection reads even when client-scoped to a jurisdiction', async () => {
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&filter[field_jurisdiction.meta.drupal_internal__target_id]=19'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for service request collection'
        });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('injects the staff jurisdiction scope for private searches without a jurisdiction filter', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(tenantModeratorStatus)
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&filter[phone][condition][path]=field_phone&filter[phone][condition][operator]=CONTAINS&filter[phone][condition][value]=0228',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const fetchedUrl = mockFetch.mock.calls[1][0];
        expect(fetchedUrl).toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bpath%5D=field_jurisdiction.meta.drupal_internal__target_id');
        expect(fetchedUrl).toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
        expect(fetchedUrl).not.toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B1%5D=20');
    });

    it('keeps synced tenant_admin site roles scoped to their elevated jurisdiction membership', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(tenantAdminStatus)
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&filter[email][condition][path]=field_e_mail&filter[email][condition][operator]=CONTAINS&filter[email][condition][value]=person@example.com',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const fetchedUrl = mockFetch.mock.calls[1][0];
        expect(fetchedUrl).toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
        expect(fetchedUrl).not.toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B1%5D=20');
    });

    it('forwards staff private searches scoped to an accessible jurisdiction', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(tenantModeratorStatus)
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&filter[email][condition][path]=field_e_mail&filter[email][condition][operator]=CONTAINS&filter[email][condition][value]=person@example.com&filter[field_jurisdiction.meta.drupal_internal__target_id]=19',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const fetchedUrl = mockFetch.mock.calls[1][0];
        expect(fetchedUrl).toContain('/jsonapi/node/service_request');
        expect(fetchedUrl).toContain('filter%5Bemail%5D%5Bcondition%5D%5Bpath%5D=field_e_mail');
        expect(fetchedUrl).toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
    });

    it('forwards role-scoped moderators through their jurisdiction memberships without elevated group roles', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(roleScopedModeratorStatus)
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title,field_status_notes&filter[field_jurisdiction.meta.drupal_internal__target_id]=19',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const fetchedUrl = mockFetch.mock.calls[1][0];
        expect(fetchedUrl).toContain('/jsonapi/node/service_request');
        expect(fetchedUrl).toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
    });

    it('rejects staff private searches scoped to a foreign jurisdiction', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch.mockResolvedValueOnce(tenantModeratorStatus);
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&filter[email][condition][path]=field_e_mail&filter[email][condition][operator]=CONTAINS&filter[email][condition][value]=person@example.com&filter[field_jurisdiction.meta.drupal_internal__target_id]=20',
            cookie
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Jurisdiction scope required for service request private fields'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('injects the staff jurisdiction scope for public sparse collection reads', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(tenantModeratorStatus)
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const fetchedUrl = mockFetch.mock.calls[1][0];
        expect(fetchedUrl).toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
    });

    it('injects staff jurisdiction scope for internal status taxonomy reads', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(tenantModeratorStatus)
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/taxonomy_term/internal_status',
            url: '/jsonapi/taxonomy_term/internal_status?fields[taxonomy_term--internal_status]=drupal_internal__tid,name',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const fetchedUrl = mockFetch.mock.calls[1][0];
        expect(fetchedUrl).toContain('/jsonapi/taxonomy_term/internal_status');
        expect(fetchedUrl).toContain('filter%5B_mas_internal_status_scope%5D%5Bcondition%5D%5Bpath%5D=field_jurisdiction.meta.drupal_internal__target_id');
        expect(fetchedUrl).toContain('filter%5B_mas_internal_status_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
        expect(fetchedUrl).not.toContain('filter%5B_mas_internal_status_scope%5D%5Bcondition%5D%5Bvalue%5D%5B1%5D=20');
    });

    it('injects staff jurisdiction scope for service status definition reads', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(tenantModeratorStatus)
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/taxonomy_term/service_status',
            url: '/jsonapi/taxonomy_term/service_status?fields[taxonomy_term--service_status]=drupal_internal__tid,name,field_status_definition',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const fetchedUrl = mockFetch.mock.calls[1][0];
        expect(fetchedUrl).toContain('/jsonapi/taxonomy_term/service_status');
        expect(fetchedUrl).toContain('filter%5B_mas_service_status_scope%5D%5Bcondition%5D%5Bpath%5D=field_jurisdiction.meta.drupal_internal__target_id');
        expect(fetchedUrl).toContain('filter%5B_mas_service_status_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
        expect(fetchedUrl).not.toContain('filter%5B_mas_service_status_scope%5D%5Bcondition%5D%5Bvalue%5D%5B1%5D=20');
    });

    it('rejects service status definition reads scoped to a foreign jurisdiction', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch.mockResolvedValueOnce(tenantModeratorStatus);
        const event = createEvent({
            path: 'jsonapi/taxonomy_term/service_status',
            url: '/jsonapi/taxonomy_term/service_status?fields[taxonomy_term--service_status]=field_status_definition&filter[field_jurisdiction.meta.drupal_internal__target_id]=20',
            cookie
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Jurisdiction scope required for service status definitions'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('rejects internal status taxonomy reads scoped to a foreign jurisdiction', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch.mockResolvedValueOnce(tenantModeratorStatus);
        const event = createEvent({
            path: 'jsonapi/taxonomy_term/internal_status',
            url: '/jsonapi/taxonomy_term/internal_status?fields[taxonomy_term--internal_status]=drupal_internal__tid,name&filter[field_jurisdiction.meta.drupal_internal__target_id]=20',
            cookie
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Jurisdiction scope required for internal status definitions'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('rejects direct internal status reads for scoped dashboard users', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch.mockResolvedValueOnce(tenantModeratorStatus);
        const event = createEvent({
            path: 'jsonapi/taxonomy_term/internal_status/11111111-1111-4111-8111-111111111111',
            url: '/jsonapi/taxonomy_term/internal_status/11111111-1111-4111-8111-111111111111?fields[taxonomy_term--internal_status]=drupal_internal__tid,name',
            cookie
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Direct internal status reads require global dashboard access'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('keeps request_id-only private detail fallback scoped after GeoReport edit validation', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(tenantModeratorStatus)
            .mockResolvedValueOnce({
                service_request_id: '16-2024',
                extended_attributes: {
                    markaspot: {
                        editable: true
                    }
                }
            })
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,field_phone&filter[request_id]=16-2024&include=field_status_notes',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(mockFetch.mock.calls[1][0]).toContain('/georeport/v2/requests/16-2024.json');
        const fetchedUrl = mockFetch.mock.calls[2][0];
        expect(fetchedUrl).toContain('filter%5Brequest_id%5D=16-2024');
        expect(fetchedUrl).toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
    });

    it('keeps request_id-only private detail fallback scoped when GeoReport edit validation fails', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce(tenantModeratorStatus)
            .mockResolvedValueOnce({
                service_request_id: '16-2024',
                extended_attributes: {
                    markaspot: {
                        editable: false
                    }
                }
            })
            .mockResolvedValueOnce({ data: [] });
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,field_phone&filter[request_id]=16-2024&include=field_status_notes',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(3);
        const fetchedUrl = mockFetch.mock.calls[2][0];
        expect(fetchedUrl).toContain('filter%5Brequest_id%5D=16-2024');
        expect(fetchedUrl).toContain('filter%5B_mas_jurisdiction_scope%5D%5Bcondition%5D%5Bvalue%5D%5B0%5D=19');
    });

    it('rejects synced tenant_admin private searches scoped to a foreign jurisdiction', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch.mockResolvedValueOnce(tenantAdminStatus);
        const event = createEvent({
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request?fields[node--service_request]=request_id,title&filter[email][condition][path]=field_e_mail&filter[email][condition][operator]=CONTAINS&filter[email][condition][value]=person@example.com&filter[field_jurisdiction.meta.drupal_internal__target_id]=20',
            cookie
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Jurisdiction scope required for service request private fields'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('rejects non-global direct service request private reads', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch.mockResolvedValueOnce(tenantModeratorStatus);
        const event = createEvent({
            path: 'jsonapi/node/service_request/11111111-1111-4111-8111-111111111111',
            url: '/jsonapi/node/service_request/11111111-1111-4111-8111-111111111111?fields[node--service_request]=request_id,field_phone',
            cookie
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Direct service request private field reads require global dashboard access'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('rejects synced tenant_admin direct service request private reads', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch.mockResolvedValueOnce(tenantAdminStatus);
        const event = createEvent({
            path: 'jsonapi/node/service_request/11111111-1111-4111-8111-111111111111',
            url: '/jsonapi/node/service_request/11111111-1111-4111-8111-111111111111?fields[node--service_request]=request_id,field_phone',
            cookie
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Direct service request private field reads require global dashboard access'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});

describe('Proxy Handler - User JSON:API access enforcement', () => {
    it('rejects anonymous user collection reads before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/user/user',
            url: '/jsonapi/user/user?fields[user--user]=display_name'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous direct user reads before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/user/user/11111111-1111-4111-8111-111111111111',
            url: '/jsonapi/user/user/11111111-1111-4111-8111-111111111111?fields[user--user]=display_name'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous user relationship reads before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/page/11111111-1111-4111-8111-111111111111/relationships/uid',
            url: '/jsonapi/node/page/11111111-1111-4111-8111-111111111111/relationships/uid'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous user related resource reads before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/page/11111111-1111-4111-8111-111111111111/uid',
            url: '/jsonapi/node/page/11111111-1111-4111-8111-111111111111/uid'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous includes that request user references before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/page/11111111-1111-4111-8111-111111111111',
            url: '/jsonapi/node/page/11111111-1111-4111-8111-111111111111?include=uid'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous sparse fieldsets that request user references before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/page/11111111-1111-4111-8111-111111111111',
            url: '/jsonapi/node/page/11111111-1111-4111-8111-111111111111?fields[node--page]=title,uid'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous filters that target user references before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/page',
            url: '/jsonapi/node/page?filter[author][condition][path]=uid&filter[author][condition][value]=1'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects anonymous sorts that target user references before upstream fetch', async () => {
        const event = createEvent({
            path: 'jsonapi/node/page',
            url: '/jsonapi/node/page?sort=-uid'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('forwards user reads when auth status confirms a Drupal session', async () => {
        mockFetch.mockResolvedValueOnce({
            authenticated: true,
            user: {
                uid: '42',
                roles: ['authenticated', 'moderator'],
                groups: []
            }
        });
        const event = createEvent({
            path: 'jsonapi/user/user',
            url: '/jsonapi/user/user?fields[user--user]=display_name',
            cookie: 'SSESSabc=staff-session'
        });

        await expect(handler(event)).resolves.toEqual({ data: 'ok' });
        expect(mockFetch).toHaveBeenNthCalledWith(
            1,
            'https://backend.example.com/api/auth/status',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    cookie: 'SSESSabc=staff-session'
                })
            })
        );
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/jsonapi/user/user?fields%5Buser--user%5D=display_name'),
            expect.objectContaining({
                method: 'GET'
            })
        );
    });

    it('rejects spoofed Drupal session cookies when auth status is not authenticated', async () => {
        mockFetch.mockResolvedValueOnce({
            authenticated: false
        });
        const event = createEvent({
            path: 'jsonapi/user/user',
            url: '/jsonapi/user/user?fields[user--user]=display_name',
            cookie: 'SSESSspoofed=not-a-real-session'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for user resources'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
            'https://backend.example.com/api/auth/status',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    cookie: 'SSESSspoofed=not-a-real-session'
                })
            })
        );
    });
});

describe('Proxy Handler - Demo mode service request writes', () => {
    it('rejects service request JSON:API creates without demo confirmation in demo mode', async () => {
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: {
                ...defaultRuntimeConfig.public,
                demoMode: true
            }
        }));
        const event = createEvent({
            method: 'POST',
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Demo submission confirmation required'
        });
        expect(mockReadBody).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('forwards confirmed demo service request creates and strips the internal header', async () => {
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: {
                ...defaultRuntimeConfig.public,
                demoMode: true
            }
        }));
        mockReadBody.mockResolvedValue({
            data: { type: 'node--service_request', attributes: { title: 'Demo' } }
        });
        const event = createEvent({
            method: 'POST',
            path: 'jsonapi/node/service_request',
            url: '/jsonapi/node/service_request',
            headers: {
                'x-demo-submission-confirmed': 'true'
            }
        });

        await handler(event);

        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['x-demo-submission-confirmed']).toBeUndefined();
        expect(fetchOptions.body).toEqual({
            data: { type: 'node--service_request', attributes: { title: 'Demo' } }
        });
    });
});

describe('Proxy Handler - Custom API prefix restoration', () => {
    it('adds /api prefix for mark-a-spot-settings', async () => {
        const event = createEvent({ path: 'mark-a-spot-settings' });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('/api/mark-a-spot-settings');
    });

    it('preserves valid session cookies for authenticated settings refreshes', async () => {
        process.env.NODE_ENV = 'development';
        mockParseCookies.mockReturnValue({
            SSESS2353132e3d683d65d503fbcb1dd1ea6f: 'session-value'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: {
                ...defaultRuntimeConfig.public,
                apiBase: 'http://web'
            }
        }));

        const event = createEvent({
            path: 'mark-a-spot-settings',
            url: '/mark-a-spot-settings?jurisdiction=amsterdam',
            headers: { host: 'dev.ddev.site:3001' },
            cookie: 'SSESS2353132e3d683d65d503fbcb1dd1ea6f=session-value'
        });
        await handler(event);

        const fetchedUrl = mockFetch.mock.calls[0][0];
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchedUrl).toBe('https://dev.ddev.site/api/mark-a-spot-settings?jurisdiction=amsterdam');
        expect(fetchOptions.headers.cookie).toBe('SSESS2353132e3d683d65d503fbcb1dd1ea6f=session-value');
        expect(fetchOptions.headers['X-Forwarded-Host']).toBe('dev.ddev.site');
    });

    it('rejects anonymous management form mode settings before upstream fetch', async () => {
        const event = createEvent({
            path: 'mark-a-spot-form-mode-settings/node/service_request/management',
            url: '/mark-a-spot-form-mode-settings/node/service_request/management'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Authentication required for management form settings'
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('allows elevated dashboard users to fetch management form mode settings', async () => {
        const cookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce({
                authenticated: true,
                user: {
                    uid: '43',
                    roles: ['authenticated', 'tenant_admin'],
                    groups: [
                        {
                            id: '19',
                            type: 'jur',
                            roles: [{ id: 'jur-tenant_admin' }]
                        }
                    ]
                }
            })
            .mockResolvedValueOnce({ fields: {} });
        const event = createEvent({
            path: 'mark-a-spot-form-mode-settings/node/service_request/management',
            url: '/mark-a-spot-form-mode-settings/node/service_request/management',
            cookie
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch.mock.calls[1][0]).toContain('/api/mark-a-spot-form-mode-settings/node/service_request/management');
    });

    it('adds /api prefix for feedback endpoint', async () => {
        const event = createEvent({ path: 'feedback' });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('/api/feedback');
    });

    it('adds /api prefix for nested custom path', async () => {
        const event = createEvent({ path: 'emergency-mode/status' });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('/api/emergency-mode/status');
    });

    it('does not add /api prefix for SSO service-provider endpoints', async () => {
        const event = createEvent({ path: 'auth/sso/keycloak/acs' });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('/auth/sso/keycloak/acs');
        expect(fetchedUrl).not.toContain('/api/auth/sso/keycloak/acs');
    });

    it('does not double-prefix if already has api/', async () => {
    // Path already starts with api/ should not get double-prefixed
        const event = createEvent({ path: 'georeport/v2/requests' });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).not.toContain('/api/api/');
    });
});

describe('Proxy Handler - API key injection (GET)', () => {
    it('injects api_key as query param AND request header for GeoReport GET without session', async () => {
        const event = createEvent({
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });
        await handler(event);
        // additive: api_key must be in BOTH the query string and the request
        // header, so instances reading api_key_get_parameter_name (query) and
        // those reading api_key_request_header_name (header) both authenticate
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('api_key=test-api-key');
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['api_key']).toBe('test-api-key');
    });

    it('skips api_key when Drupal session cookie present', async () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        const event = createEvent({
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).not.toContain('api_key');
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['api_key']).toBeUndefined();
    });

    it('strips incoming query api_key for GET when Drupal session cookie is present', async () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        const event = createEvent({
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests?api_key=user-key-123&status=open'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).not.toContain('api_key=user-key-123');
        expect(fetchedUrl).toContain('status=open');
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['api_key']).toBeUndefined();
    });

    it('uses incoming api_key over proxy api_key for GET, sent as query param + header', async () => {
        const event = createEvent({
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests?api_key=user-key-123'
        });
        await handler(event);
        // additive: the incoming key is forwarded in BOTH the query and the header
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('api_key=user-key-123');
        // collision case (incoming key + proxy env key both set): the incoming key
        // wins and the env key is NOT additionally appended — exactly one api_key
        // in the query, guarding against a double-append regression.
        expect((fetchedUrl.match(/api_key=/g) || []).length).toBe(1);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['api_key']).toBe('user-key-123');
    });

    it('does not require body-style auth for GeoReport HEAD requests', async () => {
        const event = createEvent({
            method: 'HEAD',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });

        await expect(handler(event)).resolves.toBeDefined();
        // additive: api_key in BOTH query and request header for HEAD too
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('api_key=test-api-key');
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['api_key']).toBe('test-api-key');
    });

    it('does not inject api_key for non-supported GeoReport paths (stats)', async () => {
        const event = createEvent({
            path: 'georeport/v2/stats',
            url: '/georeport/v2/stats'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        // Should not contain api_key since stats is not in API_KEY_SUPPORTED_PATHS
        expect(fetchedUrl).not.toContain('api_key=test-api-key');
    });

    it('does not inject api_key for near-prefix GeoReport paths', async () => {
        const event = createEvent({
            path: 'georeport/v2/requests-foo',
            url: '/georeport/v2/requests-foo'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).not.toContain('api_key=test-api-key');
    });

    it('does not inject api_key for dotted non-format GeoReport paths', async () => {
        const event = createEvent({
            path: 'georeport/v2/requests.foo',
            url: '/georeport/v2/requests.foo'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).not.toContain('api_key=test-api-key');
    });

    it('rejects anonymous POSTs to non-supported GeoReport paths before reading the body', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/stats',
            url: '/georeport/v2/stats'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 405 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects anonymous writes to near-prefix GeoReport paths before reading the body', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests-foo',
            url: '/georeport/v2/requests-foo'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 405 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects anonymous PATCH requests to non-supported GeoReport paths before reading the body', async () => {
        const event = createEvent({
            method: 'PATCH',
            path: 'georeport/v2/stats',
            url: '/georeport/v2/stats'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 405 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects anonymous writes to read-only GeoReport endpoints before reading the body', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/services',
            url: '/georeport/v2/services'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 405 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects session-backed writes to read-only GeoReport endpoints before reading the body', async () => {
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/discovery',
            url: '/georeport/v2/discovery'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 405 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects nested GeoReport request member writes before reading the body', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests/123',
            url: '/georeport/v2/requests/123'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 405 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects dotted non-format GeoReport write paths before reading the body', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests.foo',
            url: '/georeport/v2/requests.foo'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 405 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects session-backed GeoReport POSTs when allowGeoreportPost is disabled', async () => {
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: {
                ...defaultRuntimeConfig.public,
                clientConfig: {
                    features: {
                        allowGeoreportPost: false
                    }
                }
            }
        }));
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 405,
            message: 'Write requests are not allowed for georeport endpoints'
        });
        expect(mockReadBody).not.toHaveBeenCalled();
    });
});

describe('Proxy Handler - API key injection (POST body)', () => {
    it('accepts api_key from JSON body for GeoReport POST without query fallback', async () => {
        mockReadBody.mockResolvedValue({ description: 'pothole', api_key: 'body-key-123' });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.body).toHaveProperty('api_key', 'body-key-123');
        expect(fetchOptions.body).toHaveProperty('description', 'pothole');
    });

    it('accepts api_key from form-encoded body for GeoReport POST without query fallback', async () => {
        mockReadBody.mockResolvedValue('description=pothole&lat=50.9&api_key=body-key-123');
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.body).toContain('api_key=body-key-123');
        expect(fetchOptions.body).toContain('description=pothole');
    });

    it('rejects GeoReport PATCH requests before reading the body', async () => {
        const event = createEvent({
            method: 'PATCH',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 405,
            message: 'Only POST is allowed for GeoReport write requests'
        });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('preserves form-encoded bodies with charset content-type', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests',
            headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            rawBody: 'description=pothole&lat=50.9&api_key=body-key-123'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(typeof fetchOptions.body).toBe('string');
        expect(fetchOptions.body).toContain('api_key=body-key-123');
        expect(fetchOptions.headers['content-type']).toBe('application/x-www-form-urlencoded;charset=UTF-8');
    });

    it('moves query api_key into JSON body for GeoReport POST as a compatibility fallback', async () => {
        mockReadBody.mockResolvedValue({ description: 'pothole' });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests?api_key=query-key-123'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchOptions.body).toHaveProperty('api_key', 'query-key-123');
        expect(fetchedUrl).not.toContain('api_key=query-key-123');
    });

    it('moves query api_key into form-encoded string body', async () => {
        mockReadBody.mockResolvedValue('description=pothole&lat=50.9');
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests?api_key=query-key-123'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchOptions.body).toContain('api_key=query-key-123');
        expect(fetchOptions.body).toContain('description=pothole');
        expect(fetchedUrl).not.toContain('api_key=query-key-123');
    });

    it('strips query api_key for POST when Drupal session cookie is present', async () => {
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockReadBody.mockResolvedValue({ description: 'pothole' });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests?api_key=query-key-123&format=json'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchOptions.body).not.toHaveProperty('api_key');
        expect(fetchedUrl).not.toContain('api_key=query-key-123');
        expect(fetchedUrl).toContain('format=json');
    });

    it('does not overwrite existing api_key in JSON body', async () => {
        mockReadBody.mockResolvedValue({ description: 'test', api_key: 'existing-key' });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.body.api_key).toBe('existing-key');
    });

    it('does not overwrite existing api_key in form-encoded body', async () => {
        mockReadBody.mockResolvedValue('description=test&api_key=existing-key');
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.body).toContain('api_key=existing-key');
    });

    it('rejects GeoReport POST without api_key in body or query', async () => {
        mockReadBody.mockResolvedValue({ description: 'missing key' });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('strips body api_key when session cookie present for JSON bodies', async () => {
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockReadBody.mockResolvedValue({ description: 'pothole', api_key: 'body-key-123' });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.body).not.toHaveProperty('api_key');
        expect(fetchOptions.body).toHaveProperty('description', 'pothole');
    });

    it('strips body api_key when session cookie present for form bodies', async () => {
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockReadBody.mockResolvedValue('description=pothole&api_key=body-key-123&lat=50.9');
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests'
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.body).toContain('description=pothole');
        expect(fetchOptions.body).toContain('lat=50.9');
        expect(fetchOptions.body).not.toContain('api_key=');
    });

    it('rejects oversized GeoReport POST bodies before parsing', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests',
            headers: { 'content-length': '70000' }
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 413 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects oversized anonymous GeoReport POST bodies without Content-Length before parsing', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests',
            rawBody: 'x'.repeat(70000)
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 413 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects octet-stream bodies for anonymous GeoReport POSTs before buffering uploads', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests',
            headers: { 'content-type': 'application/octet-stream', 'content-length': '1024' }
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 415 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects octet-stream bodies with parameters and mixed casing for anonymous GeoReport POSTs', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests',
            headers: { 'content-type': 'Application/Octet-Stream; charset=binary', 'content-length': '1024' }
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 415 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects multipart bodies for anonymous GeoReport POSTs before buffering uploads', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests',
            headers: { 'content-type': 'multipart/form-data; boundary=logo', 'content-length': '1024' }
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 415 });
        expect(mockReadBody).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('forwards tenant-settings multipart logo uploads as raw buffers', async () => {
        const rawBody = Buffer.from([
            '--logo',
            'Content-Disposition: form-data; name="logo_light"; filename="logo.png"',
            'Content-Type: image/png',
            '',
            'png-bytes',
            '--logo--',
            ''
        ].join('\r\n'));
        const event = createEvent({
            method: 'POST',
            path: 'tenant-settings/68/logo',
            url: '/tenant-settings/68/logo',
            headers: {
                'content-type': 'multipart/form-data; boundary=logo',
                'content-length': String(rawBody.length),
                'x-csrf-token': 'csrf'
            },
            rawBody
        });

        await handler(event);

        const [fetchedUrl, fetchOptions] = mockFetch.mock.calls[0];
        expect(fetchedUrl).toContain('/api/tenant-settings/68/logo');
        expect(fetchOptions.headers['content-type']).toBe('multipart/form-data; boundary=logo');
        expect(fetchOptions.headers['x-csrf-token']).toBe('csrf');
        expect(fetchOptions.headers['content-length']).toBeUndefined();
        expect(Buffer.isBuffer(fetchOptions.body)).toBe(true);
        expect(fetchOptions.body.toString('utf8')).toContain('filename="logo.png"');
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects multipart uploads outside tenant logo endpoint before buffering', async () => {
        const event = createEvent({
            method: 'PATCH',
            path: 'tenant-settings/68/branding',
            url: '/tenant-settings/68/branding',
            headers: {
                'content-type': 'multipart/form-data; boundary=logo',
                'content-length': '1024',
                'x-csrf-token': 'csrf'
            },
            rawBody: Buffer.from('multipart-body')
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 415 });
        expect(mockReadBody).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects oversized tenant logo multipart uploads before forwarding', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'tenant-settings/68/logo',
            url: '/tenant-settings/68/logo',
            headers: {
                'content-type': 'multipart/form-data; boundary=logo',
                'content-length': '1572865',
                'x-csrf-token': 'csrf'
            }
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 413 });
        expect(mockReadBody).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects malformed GeoReport JSON bodies with charset before auth fallback handling', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests',
            headers: { 'content-type': 'application/json; charset=utf-8' },
            rawBody: '{invalid json'
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
        expect(mockReadBody).not.toHaveBeenCalled();
    });
});

describe('Proxy Handler - JSON:API path rewriting', () => {
    it('rewrites jsonapi/ to randomized prefix from env', async () => {
        process.env.JSONAPI_RANDOM_PATH = 'abc123jsonapi';
        const event = createEvent({
            path: 'jsonapi/taxonomy_term/service_category',
            url: '/jsonapi/taxonomy_term/service_category?fields[taxonomy_term--service_category]=name'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('/abc123jsonapi/');
        expect(fetchedUrl).not.toMatch(/\/jsonapi\//);
    });

    it('does not rewrite when JSONAPI_RANDOM_PATH equals "jsonapi"', async () => {
        process.env.JSONAPI_RANDOM_PATH = 'jsonapi';
        const event = createEvent({
            path: 'jsonapi/taxonomy_term/service_category',
            url: '/jsonapi/taxonomy_term/service_category?fields[taxonomy_term--service_category]=name'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('/jsonapi/');
    });

    it('strips surrounding quotes from JSONAPI_RANDOM_PATH', async () => {
        process.env.JSONAPI_RANDOM_PATH = '"my-secret-path"';
        const event = createEvent({
            path: 'jsonapi/taxonomy_term/service_category',
            url: '/jsonapi/taxonomy_term/service_category?fields[taxonomy_term--service_category]=name'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('/my-secret-path/');
        expect(fetchedUrl).not.toContain('"');
    });

    it('drops body-derived transport headers for JSON:API writes', async () => {
        mockFetch.mockResolvedValueOnce({ data: 'ok' });
        mockReadBody.mockResolvedValue({
            data: {
                type: 'media--request_image',
                attributes: { name: 'Face smoke test' }
            }
        });
        const event = createEvent({
            method: 'POST',
            path: 'jsonapi/media/request_image',
            url: '/jsonapi/media/request_image',
            headers: {
                'content-type': 'application/vnd.api+json',
                'content-length': '2048',
                'transfer-encoding': 'chunked',
                'connection': 'keep-alive',
                'x-csrf-token': 'csrf'
            }
        });

        await handler(event);

        const fetchOptions = mockFetch.mock.calls.at(-1)?.[1];
        expect(fetchOptions.headers['content-type']).toBe('application/vnd.api+json');
        expect(fetchOptions.headers['x-csrf-token']).toBe('csrf');
        expect(fetchOptions.headers['content-length']).toBeUndefined();
        expect(fetchOptions.headers['transfer-encoding']).toBeUndefined();
        expect(fetchOptions.headers.connection).toBeUndefined();
        expect(fetchOptions.body).toMatchObject({
            data: { type: 'media--request_image' }
        });
    });

    it('forwards request image writes through the randomized JSON:API prefix', async () => {
        process.env.JSONAPI_RANDOM_PATH = 'abc123jsonapi';
        mockFetch.mockResolvedValueOnce({ data: 'ok' });
        const event = createEvent({
            method: 'POST',
            path: 'abc123jsonapi/media/request_image/field_media_image',
            url: '/abc123jsonapi/media/request_image/field_media_image',
            headers: { 'content-type': 'application/octet-stream' },
            rawBody: 'allowed'
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0][0]).toContain('/abc123jsonapi/media/request_image/field_media_image');
    });

    it('allows request image writes', async () => {
        mockFetch.mockResolvedValueOnce({ data: 'ok' });
        mockReadBody.mockResolvedValue({
            data: {
                type: 'media--request_image',
                attributes: { name: 'upload.jpg' }
            }
        });
        const event = createEvent({
            method: 'POST',
            path: 'jsonapi/media/request_image',
            url: '/jsonapi/media/request_image',
            headers: { 'content-type': 'application/vnd.api+json' }
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0][0]).toContain('/jsonapi/media/request_image');
        expect(mockFetch.mock.calls[0][1].body).toMatchObject({
            data: { type: 'media--request_image' }
        });
    });

    it('blocks already api-prefixed vision analysis when runtime photo reporting is disabled', async () => {
        mockFetch.mockResolvedValueOnce({
            features: {
                photoReporting: false,
                aiAnalysis: true
            }
        });
        mockReadBody.mockResolvedValue({
            media_ids: ['media-uuid'],
            jurisdiction_id: 'amsterdam'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'amsterdam'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'api/vision/analyze',
            url: '/api/vision/analyze',
            headers: { 'content-type': 'application/json' }
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Vision analysis is disabled'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0][0]).toContain('/api/mark-a-spot-settings');
        expect(mockFetch.mock.calls[0][0]).toContain('jurisdiction=amsterdam');
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('blocks api/api vision analysis bypass when runtime AI analysis is disabled', async () => {
        mockFetch.mockResolvedValueOnce({
            features: {
                photoReporting: true,
                aiAnalysis: false
            }
        });
        mockReadBody.mockResolvedValue({
            media_ids: ['media-uuid'],
            jurisdiction_id: 'amsterdam'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'amsterdam'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'api/vision/analyze',
            url: '/api/api/vision/analyze',
            headers: { 'content-type': 'application/json' }
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Vision analysis is disabled'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0][0]).toContain('/api/mark-a-spot-settings');
        expect(mockFetch.mock.calls[0][0]).toContain('jurisdiction=amsterdam');
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('blocks vision analysis when runtime photo reporting is absent', async () => {
        mockFetch.mockResolvedValueOnce({
            features: {
                aiAnalysis: true
            }
        });
        mockReadBody.mockResolvedValue({
            media_ids: ['media-uuid'],
            jurisdiction_id: 'amsterdam'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'amsterdam'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            url: '/vision/analyze',
            headers: { 'content-type': 'application/json' }
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Vision analysis is disabled'
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0][0]).toContain('/api/mark-a-spot-settings');
        expect(mockFetch.mock.calls[0][0]).toContain('jurisdiction=amsterdam');
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('treats stringy false Vision feature flags as disabled', async () => {
        mockFetch.mockResolvedValueOnce({
            features: {
                photoReporting: { enabled: 'false' },
                aiAnalysis: true
            }
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'amsterdam'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            url: '/vision/analyze',
            headers: { 'content-type': 'application/json' }
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Vision analysis is disabled'
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('allows vision analysis when runtime photo reporting is enabled and AI analysis is not disabled', async () => {
        mockFetch
            .mockResolvedValueOnce({
                features: {
                    photoReporting: true
                }
            })
            .mockResolvedValueOnce({ data: 'ok' });
        mockReadBody.mockResolvedValue({
            media_ids: ['media-uuid'],
            jurisdiction_id: 'amsterdam'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'amsterdam'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            url: '/vision/analyze',
            headers: {
                'content-type': 'application/json',
                'referer': 'https://frontend.example.com/amsterdam/report',
                'x-mas-jurisdiction': 'spoofed'
            }
        });

        await handler(event);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch.mock.calls[0][0]).toContain('/api/mark-a-spot-settings');
        expect(mockFetch.mock.calls[0][0]).toContain('jurisdiction=amsterdam');
        expect(mockFetch.mock.calls[0][0]).not.toContain('jurisdiction=spoofed');
        expect(mockFetch.mock.calls[1][0]).toContain('/api/vision/analyze');
        expect(mockFetch.mock.calls[1][1].headers['x-mas-jurisdiction']).toBeUndefined();
    });

    it('uses the trusted runtime jurisdiction for gating instead of body, query, or referer hints', async () => {
        mockFetch.mockResolvedValueOnce({
            features: {
                photoReporting: false,
                aiAnalysis: false
            }
        });
        mockReadBody.mockResolvedValue({
            media_ids: ['media-uuid'],
            jurisdiction_id: 'disabled-jurisdiction'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'runtime-jurisdiction'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            url: '/vision/analyze?jurisdiction=enabled-jurisdiction',
            headers: {
                'content-type': 'application/json',
                'referer': 'https://frontend.example.com/enabled-jurisdiction/report'
            }
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Vision analysis is disabled'
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0][0]).toContain('jurisdiction=runtime-jurisdiction');
        expect(mockFetch.mock.calls[0][0]).not.toContain('jurisdiction=disabled-jurisdiction');
        expect(mockFetch.mock.calls[0][0]).not.toContain('jurisdiction=enabled-jurisdiction');
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('fails closed when Vision body tries to borrow another jurisdiction in multi-tenant mode', async () => {
        mockReadBody.mockResolvedValue({
            media_ids: ['media-uuid'],
            jurisdiction_id: 'enabled-jurisdiction'
        });
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            url: '/vision/analyze',
            headers: { 'content-type': 'application/json' }
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Vision analysis is disabled'
        });
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('fails closed for Vision analysis without a trusted runtime jurisdiction in multi-tenant mode', async () => {
        mockReadBody.mockResolvedValue({
            media_ids: ['media-uuid']
        });
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            url: '/vision/analyze?jurisdiction=enabled-jurisdiction',
            headers: { 'content-type': 'application/json' }
        });

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Vision analysis is disabled'
        });
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects raw Vision uploads before reading the body', async () => {
        mockFetch.mockResolvedValueOnce({
            features: {
                photoReporting: true,
                aiAnalysis: true
            }
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'amsterdam'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            url: '/vision/analyze',
            headers: {
                'content-type': 'application/octet-stream',
                'content-length': '1024'
            }
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 415 });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0][0]).toContain('/api/mark-a-spot-settings');
        expect(mockReadBody).not.toHaveBeenCalled();
    });

    it('rejects multipart Vision uploads before reading the body', async () => {
        mockFetch.mockResolvedValueOnce({
            features: {
                photoReporting: true,
                aiAnalysis: true
            }
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'amsterdam'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            url: '/vision/analyze',
            headers: {
                'content-type': 'multipart/form-data; boundary=vision',
                'content-length': '1024'
            }
        });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 415 });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch.mock.calls[0][0]).toContain('/api/mark-a-spot-settings');
        expect(mockReadBody).not.toHaveBeenCalled();
    });
});

describe('Proxy Handler - Rate limiting', () => {
    it('calls checkRateLimit for unauthenticated requests', async () => {
        const event = createEvent({ path: 'georeport/v2/requests' });
        await handler(event);
        expect(mockCheckRateLimit).toHaveBeenCalled();
    });

    it('uses the socket IP and ignores client-controlled forwarding headers', async () => {
        const event = createEvent({
            path: 'georeport/v2/requests',
            ip: '127.0.0.1',
            headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.5' }
        });
        await handler(event);
        expect(mockCheckRateLimit).toHaveBeenCalledWith(event, '127.0.0.1', null, 'GET');
    });

    it('skips rate limiting for non-public-submit requests when session cookie present', async () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        const event = createEvent({ path: 'jsonapi/taxonomy_term/service_category' });
        await handler(event);
        expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });

    it('rate limits GeoReport writes even when a Drupal-looking cookie is present', async () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        const event = createEvent({ method: 'POST', path: 'georeport/v2/requests' });
        await handler(event);
        expect(mockCheckRateLimit).toHaveBeenCalledWith(event, '127.0.0.1', null, 'POST');
    });

    it('rate limits JSON:API service request creates even when a Drupal-looking cookie is present', async () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        const event = createEvent({
            method: 'POST',
            path: 'jsonapi/node/service_request',
            headers: { 'content-type': 'application/vnd.api+json' },
            rawBody: {
                data: {
                    type: 'node--service_request',
                    attributes: { title: 'Pothole' }
                }
            }
        });

        await handler(event);

        expect(mockCheckRateLimit).toHaveBeenCalledWith(event, '127.0.0.1', null, 'POST');
    });

    it('rate limits JSON:API media uploads even when a Drupal-looking cookie is present', async () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        const event = createEvent({
            method: 'POST',
            path: 'jsonapi/media/request_image',
            headers: { 'content-type': 'application/vnd.api+json' },
            rawBody: {
                data: {
                    type: 'media--request_image',
                    attributes: { name: 'upload.jpg' }
                }
            }
        });

        await handler(event);

        expect(mockCheckRateLimit).toHaveBeenCalledWith(event, '127.0.0.1', null, 'POST');
    });

    it('rate limits public custom endpoint writes even when a Drupal-looking cookie is present', async () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });

        for (const { method, path } of [
            { method: 'POST', path: 'feedback' },
            { method: 'POST', path: 'competition' },
            { method: 'POST', path: 'group-members/claim/invite-token' },
            { method: 'PATCH', path: 'mark-a-spot-settings' }
        ]) {
            mockCheckRateLimit.mockClear();
            const event = createEvent({ method, path });
            await handler(event);
            expect(mockCheckRateLimit).toHaveBeenCalledWith(event, '127.0.0.1', null, method);
        }
    });

    it('rate limits Vision analysis even when a Drupal-looking cookie is present', async () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        mockFetch
            .mockResolvedValueOnce({
                features: {
                    photoReporting: true,
                    aiAnalysis: true
                }
            })
            .mockResolvedValueOnce({ data: 'ok' });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            jurisdictionId: 'amsterdam'
        }));
        const event = createEvent({
            method: 'POST',
            path: 'vision/analyze',
            headers: { 'content-type': 'application/json' }
        });

        await handler(event);

        expect(mockCheckRateLimit).toHaveBeenCalledWith(event, '127.0.0.1', 'vision', 'POST');
    });
});

describe('Proxy Handler - Cookie rewriting', () => {
    it('adds SameSite=None and Secure to set-cookie headers in embed context', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        getSetCookie: () => ['SESS123=abc; HttpOnly; Path=/']
                    }
                }
            });
            return { data: 'ok' };
        });

        const event = createEvent({
            path: 'georeport/v2/requests',
            headers: { referer: 'https://example.com/embed/map' }
        });
        const res = event.node.res;
        await handler(event);

        expect(res.setHeader).toHaveBeenCalledWith('set-cookie', expect.any(Array));
        const cookies = res.setHeader.mock.calls[0][1] as string[];
        expect(cookies[0]).toContain('SameSite=None');
        expect(cookies[0]).toContain('Secure');
    });

    it('does not duplicate SameSite=None if already present in embed context', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        getSetCookie: () => ['SESS123=abc; SameSite=None; Secure']
                    }
                }
            });
            return { data: 'ok' };
        });

        const event = createEvent({
            path: 'georeport/v2/requests',
            headers: { referer: 'https://example.com/embed/map' }
        });
        await handler(event);
        const cookies = event.node.res.setHeader.mock.calls[0][1] as string[];
        // Count SameSite occurrences - should be exactly 1
        const count = (cookies[0].match(/SameSite/gi) || []).length;
        expect(count).toBe(1);
    });

    it('preserves original cookies without SameSite rewrite in non-embed context', async () => {
        const originalCookie = 'SESS123=abc; HttpOnly; Path=/; SameSite=Lax';
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        getSetCookie: () => [originalCookie]
                    }
                }
            });
            return { data: 'ok' };
        });

        const event = createEvent({
            path: 'georeport/v2/requests',
            headers: { referer: 'https://example.com/amsterdam/report/123' }
        });
        const res = event.node.res;
        await handler(event);

        expect(res.setHeader).toHaveBeenCalledWith('set-cookie', [originalCookie]);
    });
});

describe('Proxy Handler - Stats endpoint', () => {
    it('appends _format=json for stats requests', async () => {
        const event = createEvent({
            path: 'stats/overview',
            url: '/stats/overview'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('_format=json');
    });
});

describe('Proxy Handler - GeoReport Content-Type forwarding', () => {
    it('forwards upstream XML Content-Type for GeoReport responses', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        get: (name: string) =>
                            name.toLowerCase() === 'content-type' ? 'application/xml' : null
                    }
                }
            });
            return '<?xml version="1.0"?><services/>';
        });

        const event = createEvent({ path: 'georeport/v2/services.xml' });
        await handler(event);

        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
    });

    it('preserves safe XML charset parameters', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        get: (name: string) =>
                            name.toLowerCase() === 'content-type' ? 'text/xml; charset=utf-8' : null
                    }
                }
            });
            return '<?xml version="1.0" encoding="utf-8"?><services/>';
        });

        const event = createEvent({ path: 'georeport/v2/services.xml' });
        await handler(event);

        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'text/xml; charset=utf-8');
    });

    it('does not relabel unsafe upstream HTML responses as XML', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        get: (name: string) =>
                            name.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null
                    }
                }
            });
            return '<html>unexpected</html>';
        });

        const event = createEvent({ path: 'georeport/v2/services.xml' });
        await handler(event);

        const contentTypeCalls = event.node.res.setHeader.mock.calls
            .filter((c: any[]) => c[0] === 'content-type');
        expect(contentTypeCalls).toHaveLength(0);
    });

    it('does not override Content-Type for JSON GeoReport responses', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        get: (name: string) =>
                            name.toLowerCase() === 'content-type' ? 'application/json' : null
                    }
                }
            });
            return { services: [] };
        });

        const event = createEvent({ path: 'georeport/v2/services' });
        await handler(event);

        const contentTypeCalls = event.node.res.setHeader.mock.calls
            .filter((c: any[]) => c[0] === 'content-type');
        expect(contentTypeCalls).toHaveLength(0);
    });

    it('does not force a Content-Type for JSON endpoints with no upstream header or body', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        get: () => null
                    }
                }
            });
            return undefined;
        });

        const event = createEvent({ path: 'georeport/v2/services' });
        await handler(event);

        const contentTypeCalls = event.node.res.setHeader.mock.calls
            .filter((c: any[]) => c[0] === 'content-type');
        expect(contentTypeCalls).toHaveLength(0);
    });

    it('falls back to application/xml when upstream omits Content-Type but body is XML', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        get: () => null
                    }
                }
            });
            return '<?xml version="1.0"?><services/>';
        });

        const event = createEvent({ path: 'georeport/v2/services.xml' });
        await handler(event);

        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
    });

    it('falls back to application/xml for service_requests XML roots when Content-Type is missing', async () => {
        mockFetch.mockImplementation((_url: string, opts: any) => {
            opts.onResponse({
                response: {
                    headers: {
                        get: () => null
                    }
                }
            });
            return '<service_requests></service_requests>';
        });

        const event = createEvent({ path: 'georeport/v2/requests.xml' });
        await handler(event);

        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
    });
});

describe('Proxy Handler - Query parameter forwarding', () => {
    it('forwards original query parameters', async () => {
        const event = createEvent({
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests?status=open&page=2'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('status=open');
        expect(fetchedUrl).toContain('page=2');
    });

    it('strips api_key from query for POST (goes into body instead)', async () => {
        mockReadBody.mockResolvedValue({ description: 'test' });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests',
            url: '/georeport/v2/requests?api_key=incoming-key&format=json'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        // api_key should NOT be in the URL for POST
        expect(fetchedUrl).not.toContain('api_key=incoming-key');
        // Other params should still be there
        expect(fetchedUrl).toContain('format=json');
    });
});

describe('Proxy Handler - Headers', () => {
    it('sets Accept-Language from incoming header', async () => {
        const event = createEvent({
            path: 'georeport/v2/requests',
            headers: { 'accept-language': 'en-US' }
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['Accept-Language']).toBe('en-US');
    });

    it('defaults Accept-Language to "de" when not provided', async () => {
        const event = createEvent({ path: 'georeport/v2/requests' });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['Accept-Language']).toBe('de');
    });

    it('uses content-language for JSON:API write operations', async () => {
        mockReadBody.mockResolvedValue({ data: {} });
        const event = createEvent({
            method: 'PATCH',
            path: 'jsonapi/node/service_request/abc-123',
            url: '/jsonapi/node/service_request/abc-123',
            headers: { 'content-language': 'fr', 'accept-language': 'en' }
        });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        // JSON:API write should use content-language for Accept-Language
        expect(fetchOptions.headers['Accept-Language']).toBe('fr');
    });

    it('strips citizen notification from JSON:API service request write bodies', async () => {
        mockReadBody.mockResolvedValue({
            data: {
                type: 'node--service_request',
                attributes: {
                    title: 'Demo',
                    field_priority: true,
                    field_notification: true
                }
            }
        });
        const event = createEvent({
            method: 'PATCH',
            path: 'jsonapi/node/service_request/abc-123',
            url: '/jsonapi/node/service_request/abc-123'
        });

        await handler(event);

        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.body.data.attributes).toEqual({
            title: 'Demo',
            field_priority: true
        });
    });

    it('removes host header before forwarding', async () => {
        const event = createEvent({ path: 'georeport/v2/requests' });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers).not.toHaveProperty('host');
    });

    it('sets X-Forwarded-Host from apiBase config, not client host', async () => {
        const event = createEvent({ path: 'georeport/v2/requests' });
        await handler(event);
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['X-Forwarded-Host']).toBe('backend.example.com');
    });

    it('strips client-supplied forwarding headers before setting canonical values', async () => {
        const event = createEvent({
            path: 'georeport/v2/requests',
            headers: {
                'forwarded': 'for=203.0.113.10;host=evil.example;proto=http',
                'x-forwarded-for': '203.0.113.10',
                'x-forwarded-host': 'evil.example',
                'x-forwarded-proto': 'http',
                'x-forwarded-port': '80',
                'x-real-ip': '203.0.113.10'
            }
        });

        await handler(event);

        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchOptions.headers['X-Forwarded-Host']).toBe('backend.example.com');
        expect(fetchOptions.headers['X-Forwarded-Proto']).toBe('https');
        expect(fetchOptions.headers.forwarded).toBeUndefined();
        expect(fetchOptions.headers['x-forwarded-for']).toBeUndefined();
        expect(fetchOptions.headers['x-forwarded-host']).toBeUndefined();
        expect(fetchOptions.headers['x-forwarded-proto']).toBeUndefined();
        expect(fetchOptions.headers['x-forwarded-port']).toBeUndefined();
        expect(fetchOptions.headers['x-real-ip']).toBeUndefined();
    });

    it('uses DDEV_HOSTNAME as canonical host for local Drupal sessions', async () => {
        process.env.DDEV_HOSTNAME = 'dev.ddev.site';
        mockParseCookies.mockReturnValue({
            SSESS2353132e3d683d65d503fbcb1dd1ea6f: 'session-value'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: {
                ...defaultRuntimeConfig.public,
                apiBase: 'http://web'
            }
        }));

        const event = createEvent({
            path: 'auth/status',
            url: '/auth/status',
            cookie: 'SSESS2353132e3d683d65d503fbcb1dd1ea6f=session-value'
        });
        await handler(event);

        const fetchedUrl = mockFetch.mock.calls[0][0];
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchedUrl).toBe('https://dev.ddev.site/api/auth/status');
        expect(fetchOptions.headers['X-Forwarded-Host']).toBe('dev.ddev.site');
    });

    it('uses request host in local dev when Drupal backend host is internal', async () => {
        process.env.NODE_ENV = 'development';
        delete process.env.DDEV_HOSTNAME;
        delete process.env.NUXT_CANONICAL_HOST;
        delete process.env.NUXT_PUBLIC_CANONICAL_HOST;
        delete process.env.DRUPAL_PUBLIC_HOST;
        mockParseCookies.mockReturnValue({
            SSESS2353132e3d683d65d503fbcb1dd1ea6f: 'session-value'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: {
                ...defaultRuntimeConfig.public,
                apiBase: 'http://web'
            }
        }));

        const event = createEvent({
            path: 'auth/status',
            url: '/auth/status',
            headers: { host: 'dev.ddev.site:3001' },
            cookie: 'SSESS2353132e3d683d65d503fbcb1dd1ea6f=session-value'
        });
        await handler(event);

        const fetchedUrl = mockFetch.mock.calls[0][0];
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchedUrl).toBe('https://dev.ddev.site/api/auth/status');
        expect(fetchOptions.headers['X-Forwarded-Host']).toBe('dev.ddev.site');
    });

    it('does not use arbitrary request host for local session upstream', async () => {
        process.env.NODE_ENV = 'development';
        delete process.env.DDEV_HOSTNAME;
        delete process.env.NUXT_CANONICAL_HOST;
        delete process.env.NUXT_PUBLIC_CANONICAL_HOST;
        delete process.env.DRUPAL_PUBLIC_HOST;
        mockParseCookies.mockReturnValue({
            SSESS2353132e3d683d65d503fbcb1dd1ea6f: 'session-value'
        });
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: {
                ...defaultRuntimeConfig.public,
                apiBase: 'http://web'
            }
        }));

        const event = createEvent({
            path: 'auth/status',
            url: '/auth/status',
            headers: { host: 'attacker.example' },
            cookie: 'SSESS2353132e3d683d65d503fbcb1dd1ea6f=session-value'
        });
        await handler(event);

        const fetchedUrl = mockFetch.mock.calls[0][0];
        const fetchOptions = mockFetch.mock.calls[0][1];
        expect(fetchedUrl).toBe('http://web/api/auth/status');
        expect(fetchOptions.headers['X-Forwarded-Host']).toBe('web');
    });
});

describe('Proxy Handler - GeoReport media URL transformation', () => {
    it('transforms media URLs in GeoReport responses', async () => {
        mockFetch.mockResolvedValue({
            requests: [
                { service_request_id: '1', media_url: 'https://backend.example.com/sites/default/files/photo.jpg' }
            ]
        });
        const event = createEvent({ path: 'georeport/v2/requests' });
        const result = await handler(event) as any;
        expect(result.requests[0].media_url).toContain('/api/images/');
    });
});

describe('Proxy Handler - Error pass-through', () => {
    it('formats local XML 405 errors from the rate limiter', async () => {
        mockCheckRateLimit.mockImplementation(() => {
            const err = new Error('Write requests are not allowed for georeport endpoints') as any;
            err.statusCode = 405;
            throw err;
        });

        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests.xml',
            url: '/georeport/v2/requests.xml'
        });

        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(405);
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
        expect(result).toContain('<status>405</status>');
        expect(result).toContain('<message>Write requests are not allowed for georeport endpoints</message>');
    });

    it('formats local XML 401 errors for missing api_key', async () => {
        mockReadBody.mockResolvedValue({ description: 'missing key' });
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/requests.xml',
            url: '/georeport/v2/requests.xml'
        });

        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(401);
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
        expect(result).toContain('<status>401</status>');
    });

    it('formats local XML 405 errors for non-POST GeoReport write methods', async () => {
        const event = createEvent({
            method: 'PATCH',
            path: 'georeport/v2/requests.xml',
            url: '/georeport/v2/requests.xml'
        });

        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(405);
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
        expect(result).toContain('<status>405</status>');
        expect(result).toContain('<message>Only POST is allowed for GeoReport write requests</message>');
    });

    it('formats local XML 405 errors for unsupported GeoReport XML POST endpoints', async () => {
        const event = createEvent({
            method: 'POST',
            path: 'georeport/v2/stats.xml',
            url: '/georeport/v2/stats.xml'
        });

        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(405);
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
        expect(result).toContain('<status>405</status>');
        expect(result).toContain('<message>Write requests are not allowed for this georeport endpoint</message>');
    });

    it('passes through XML 404 bodies for GeoReport XML endpoints', async () => {
        const xmlBody = '<?xml version="1.0"?><error>Not Found</error>';
        mockFetch.mockRejectedValue({
            status: 404,
            message: 'Not Found',
            response: {
                status: 404,
                _data: xmlBody,
                headers: {
                    get: (name: string) =>
                        name.toLowerCase() === 'content-type' ? 'application/xml' : null
                }
            },
            data: xmlBody
        });

        const event = createEvent({ path: 'georeport/v2/services.xml' });
        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(404);
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
        expect(result).toBe(xmlBody);
    });

    it('passes through 422 validation errors', async () => {
        const validationData = {
            errors: [{ title: 'Validation failed', detail: 'Missing field' }]
        };
        mockFetch.mockRejectedValue({
            status: 422,
            message: 'Unprocessable Entity',
            response: { status: 422, _data: validationData },
            data: validationData
        });

        const event = createEvent({ path: 'georeport/v2/requests' });
        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(422);
        expect(result).toEqual(validationData);
    });

    it('passes through XML 422 bodies for GeoReport XML endpoints', async () => {
        const xmlBody = '<?xml version="1.0"?><error>Invalid</error>';
        mockFetch.mockRejectedValue({
            status: 422,
            message: 'Unprocessable Entity',
            response: {
                status: 422,
                _data: xmlBody,
                headers: {
                    get: (name: string) =>
                        name.toLowerCase() === 'content-type' ? 'text/xml; charset=utf-8' : null
                }
            },
            data: xmlBody
        });

        const event = createEvent({ path: 'georeport/v2/requests.xml' });
        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(422);
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'text/xml; charset=utf-8');
        expect(result).toBe(xmlBody);
    });

    it('formats XML 400 errors for GeoReport XML endpoints', async () => {
        const errorData = { message: 'Bad request payload' };
        mockFetch.mockRejectedValue({
            status: 400,
            message: 'Bad Request',
            response: { status: 400, _data: errorData },
            data: errorData
        });

        const event = createEvent({ path: 'georeport/v2/requests.xml' });
        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(400);
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
        expect(result).toContain('<status>400</status>');
    });

    it('formats XML 429 errors for GeoReport XML endpoints', async () => {
        const rateLimitData = { message: 'Rate limit exceeded' };
        mockFetch.mockRejectedValue({
            status: 429,
            message: 'Rate limit exceeded',
            response: { status: 429, _data: rateLimitData },
            data: rateLimitData
        });

        const event = createEvent({ path: 'georeport/v2/requests.xml' });
        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(429);
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'application/xml');
        expect(result).toContain('<status>429</status>');
    });

    it('passes through 429 rate limit errors', async () => {
        const rateLimitData = { message: 'Rate limit exceeded' };
        mockFetch.mockRejectedValue({
            status: 429,
            message: 'Too Many Requests',
            response: { status: 429, _data: rateLimitData },
            data: rateLimitData
        });

        const event = createEvent({ path: 'georeport/v2/requests' });
        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(429);
        expect(result).toEqual(rateLimitData);
    });

    it('passes through 403 forbidden errors', async () => {
        mockFetch.mockRejectedValue({
            status: 403,
            message: 'Forbidden',
            response: { status: 403, _data: { message: 'Access denied' } },
            data: { message: 'Access denied' }
        });

        const event = createEvent({ path: 'georeport/v2/requests' });
        const result = await handler(event) as any;
        expect(event.node.res.statusCode).toBe(403);
        expect(result.message).toBe('Access denied');
    });

    it('normalizes upstream HTML 403 bodies to JSON', async () => {
        mockFetch.mockRejectedValue({
            status: 403,
            message: 'Forbidden',
            response: {
                status: 403,
                _data: '<!DOCTYPE html><html><body>Access denied</body></html>',
                headers: {
                    get: (name: string) =>
                        name.toLowerCase() === 'content-type' ? 'text/html; charset=UTF-8' : null
                }
            },
            data: '<!DOCTYPE html><html><body>Access denied</body></html>'
        });

        const event = createEvent({ path: 'fastmap/usage/5' });
        const result = await handler(event) as any;

        expect(event.node.res.statusCode).toBe(403);
        expect(result).toEqual({ statusCode: 403, message: 'Access denied' });
    });

    it('passes through 409 conflict errors', async () => {
        const conflictData = { message: 'Resource conflict' };
        mockFetch.mockRejectedValue({
            status: 409,
            message: 'Conflict',
            response: { status: 409, _data: conflictData },
            data: conflictData
        });

        const event = createEvent({ path: 'georeport/v2/requests' });
        const result = await handler(event);
        expect(event.node.res.statusCode).toBe(409);
    });
});

describe('Proxy Handler - Error mapping', () => {
    it('maps ECONNREFUSED to 502', async () => {
        mockFetch.mockRejectedValue({
            message: 'connect ECONNREFUSED',
            code: 'ECONNREFUSED'
        });

        const event = createEvent({ path: 'georeport/v2/requests' });
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 502 });
    });

    it('maps ETIMEDOUT to 504', async () => {
        mockFetch.mockRejectedValue({
            message: 'timed out',
            code: 'ETIMEDOUT'
        });

        const event = createEvent({ path: 'georeport/v2/requests' });
        await expect(handler(event)).rejects.toMatchObject({ statusCode: 504 });
    });

    it('maps CSRF token error to 403', async () => {
        mockFetch.mockRejectedValue({
            message: 'CSRF token validation failed',
            status: 403
        });

        const event = createEvent({ path: 'georeport/v2/requests' });
        const result = await handler(event) as any;
        // 403 gets pass-through treatment
        expect(event.node.res.statusCode).toBe(403);
    });
});

describe('Proxy Handler - Auth endpoint safe defaults', () => {
    it('returns {authenticated: false} for auth/status 404', async () => {
        mockFetch.mockRejectedValue({
            status: 404,
            message: 'Not Found',
            response: { status: 404 }
        });

        const event = createEvent({ path: 'auth/status' });
        const result = await handler(event) as any;
        expect(result.authenticated).toBe(false);
    });

    it('returns auth_endpoint_not_available for other auth 404', async () => {
        mockFetch.mockRejectedValue({
            status: 404,
            message: 'Not Found',
            response: { status: 404 }
        });

        const event = createEvent({ path: 'auth/login' });
        const result = await handler(event) as any;
        expect(result.authenticated).toBe(false);
        expect(result.error).toBe('auth_endpoint_not_available');
    });

    it('does not treat auth paths containing status as the canonical status endpoint', async () => {
        for (const path of ['auth/check-status', 'auth/status-foobar', 'auth/legacy-status-check']) {
            mockFetch.mockRejectedValueOnce({
                status: 404,
                message: 'Not Found',
                response: { status: 404 }
            });

            const event = createEvent({ path });
            const result = await handler(event) as any;
            expect(event.node.res.statusCode).toBe(404);
            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('auth_endpoint_not_available');
        }
    });
});

describe('Proxy Handler - Media file routing', () => {
    it('uses geoReportApiBase for media file requests when configured', async () => {
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: {
                ...defaultRuntimeConfig.public,
                geoReportApiBase: 'https://cdn.example.com'
            }
        }));

        const event = createEvent({
            path: 'sites/default/files/photo.jpg',
            url: '/sites/default/files/photo.jpg'
        });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('cdn.example.com');
    });
});

describe('Proxy Handler - URL construction', () => {
    it('builds absolute URL from apiBase', async () => {
        const event = createEvent({ path: 'georeport/v2/services' });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toMatch(/^https:\/\/backend\.example\.com\//);
    });

    it('handles relative apiBase using request host', async () => {
        (globalThis as any).useRuntimeConfig = vi.fn(() => ({
            ...defaultRuntimeConfig,
            public: { ...defaultRuntimeConfig.public, apiBase: '/backend' }
        }));

        const event = createEvent({ path: 'georeport/v2/requests' });
        await handler(event);
        const fetchedUrl = mockFetch.mock.calls[0][0];
        expect(fetchedUrl).toContain('frontend.example.com');
    });
});

// ===================================================================
// Triage inbox (markaspot-ui#482): authenticated-only pre-gate +
// binary attachment passthrough.
// ===================================================================
describe('Proxy Handler - Inbound mail (triage inbox)', () => {
    const SESSION_COOKIE = 'SSESSabcdef0123456789abcdef0123456789=session-value';
    const authedCookies = { SSESSabcdef0123456789abcdef0123456789: 'session-value' };

    it('rejects unauthenticated inbound-mail list requests with 401 before reaching Drupal', async () => {
        mockParseCookies.mockReturnValue({});
        const event = createEvent({ path: 'inbound-mail' });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated attachment downloads with 401 before reaching Drupal', async () => {
        mockParseCookies.mockReturnValue({});
        const event = createEvent({ path: 'inbound-mail/7/attachment/11' });

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('streams an authenticated attachment through with the upstream Content-Type and nosniff', async () => {
        mockParseCookies.mockReturnValue(authedCookies);
        const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic bytes
        const rawMock = vi.fn().mockResolvedValue({
            _data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
            headers: new Headers({
                'content-type': 'image/jpeg',
                'content-disposition': 'inline; filename="photo.jpg"'
            })
        });
        (mockFetch as any).raw = rawMock;

        const event = createEvent({ path: 'inbound-mail/7/attachment/11', cookie: SESSION_COOKIE });
        const result = await handler(event);

        // Forwarded the attachment path to Drupal with the api/ prefix restored.
        expect(rawMock).toHaveBeenCalledTimes(1);
        expect(rawMock.mock.calls[0][0]).toContain('/api/inbound-mail/7/attachment/11');
        expect(rawMock.mock.calls[0][1]).toMatchObject({ responseType: 'arrayBuffer' });
        // Session cookie forwarded.
        expect(rawMock.mock.calls[0][1].headers.cookie).toBe(SESSION_COOKIE);

        // Upstream headers projected onto the event response.
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-type', 'image/jpeg');
        expect(event.node.res.setHeader).toHaveBeenCalledWith('x-content-type-options', 'nosniff');
        expect(event.node.res.setHeader).toHaveBeenCalledWith('content-disposition', 'inline; filename="photo.jpg"');

        // Raw bytes returned intact (not parsed as JSON).
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result).toEqual(bytes);
        // The JSON $fetch pipeline must not be used for the binary path.
        expect(mockFetch).not.toHaveBeenCalled();
    });
});
