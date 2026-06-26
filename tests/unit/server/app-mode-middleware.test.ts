import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import middleware from '~/server/middleware/00.app-mode';

const mockResolveAppMode = vi.fn(async () => 'full');

vi.mock('~/server/utils/app-mode-resolver', () => ({
    resolveAppMode: (...args: unknown[]) => mockResolveAppMode(...args)
}));

vi.mock('h3', () => ({
    createError: (opts: { statusCode?: number, statusMessage?: string }) => {
        const err = new Error(opts.statusMessage || 'Error') as Error & { statusCode?: number, statusMessage?: string };
        err.statusCode = opts.statusCode;
        err.statusMessage = opts.statusMessage;
        return err;
    },
    defineEventHandler: (handler: (event: any) => unknown) => handler,
    getRequestURL: (event: { node: { req: { headers: { host?: string }, url?: string } } }) => {
        const host = event.node.req.headers.host || 'frontend.example.com';
        const url = event.node.req.url || '/';
        return new URL(`https://${host}${url}`);
    },
    parseCookies: (event: { node: { req: { headers: { cookie?: string } } } }) => {
        const header = event.node.req.headers.cookie || '';
        return Object.fromEntries(
            header
                .split(';')
                .map(part => part.trim())
                .filter(Boolean)
                .map((part) => {
                    const [key, ...rest] = part.split('=');
                    return [key, rest.join('=')];
                })
        );
    }
}));

const handler = middleware as (event: any) => Promise<unknown>;

function createEvent(cookie?: string) {
    return {
        method: 'GET',
        context: {},
        node: {
            req: {
                url: '/amsterdam/dashboard',
                headers: {
                    host: 'frontend.example.com',
                    cookie
                }
            }
        }
    };
}

describe('00.app-mode middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResolveAppMode.mockResolvedValue('full');
    });

    it('sets hasDrupalSession for a valid Drupal session cookie', async () => {
        const event = createEvent('SSESSabcdef0123456789abcdef0123456789=session-value');
        await handler(event);
        expect(event.context.hasDrupalSession).toBe(true);
    });

    it('does not treat a deleted session cookie as an active session', async () => {
        const event = createEvent('SSESSabcdef0123456789abcdef0123456789=deleted');
        await handler(event);
        expect(event.context.hasDrupalSession).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Citizen mode enforcement
// ---------------------------------------------------------------------------
// In citizen mode the middleware locks the app down to anonymous report
// creation only: dashboard + auth page routes 404, auth/session/dashboard API
// endpoints 403, mutating content verbs 403, and any Drupal session cookie is
// stripped from the forwarded request so no authenticated action is possible.
// We drive citizen mode via the ENV override path (config.appMode === 'citizen'),
// which short-circuits the resolveAppMode lookup entirely.

// Build an event in citizen mode. Method + url + cookie are configurable so a
// single helper covers page routes, API routes and cookie-strip assertions.
function createCitizenEvent(opts: { url: string, method?: string, cookie?: string }) {
    return {
        method: opts.method ?? 'GET',
        context: {} as Record<string, unknown>,
        node: {
            req: {
                url: opts.url,
                headers: {
                    host: 'frontend.example.com',
                    cookie: opts.cookie
                } as { host: string, cookie?: string }
            }
        }
    };
}

describe('00.app-mode middleware (citizen mode)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // resolveAppMode must never be consulted: the ENV override wins.
        mockResolveAppMode.mockResolvedValue('full');
        // Force the ENV-override branch: config.appMode === 'citizen'.
        vi.stubGlobal('useRuntimeConfig', () => ({ appMode: 'citizen' }));
    });

    afterEach(() => {
        // Restore the setup.ts global useRuntimeConfig for the rest of the suite.
        vi.unstubAllGlobals();
    });

    it('does not consult resolveAppMode when ENV forces citizen mode', async () => {
        await expect(handler(createCitizenEvent({ url: '/amsterdam' })))
            .resolves.toBeUndefined();
        expect(mockResolveAppMode).not.toHaveBeenCalled();
    });

    // --- (1) Page routes: 404 for dashboard + auth ---

    it('returns 404 for a /dashboard page route', async () => {
        await expect(handler(createCitizenEvent({ url: '/dashboard' })))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns 404 for a jurisdiction-prefixed auth route (/x/auth/login)', async () => {
        await expect(handler(createCitizenEvent({ url: '/x/auth/login' })))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('allows a plain citizen page route', async () => {
        await expect(handler(createCitizenEvent({ url: '/amsterdam' })))
            .resolves.toBeUndefined();
    });

    // --- (2) API routes: blocked for auth/session + dashboard ---
    //
    // NOTE on status codes: the page-route gate (segments.includes('auth' |
    // 'dashboard')) runs BEFORE the /api/ block, and an API path like
    // /api/auth/status splits into segments ['api','auth','status'] which
    // contains 'auth'. So these requests are rejected with 404 by the page
    // gate, never reaching the 403 API branch. Either way the endpoint is
    // unreachable in citizen mode. We assert the real behaviour (404) here and
    // cover the dedicated 403 API branch with a path whose segments contain
    // neither 'auth' nor 'dashboard' (e.g. /api/session, /api/escalation/...).

    it('blocks the /api/auth/status endpoint (404 via the page gate)', async () => {
        await expect(handler(createCitizenEvent({ url: '/api/auth/status' })))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('blocks a /api/dashboard/... endpoint (404 via the page gate)', async () => {
        await expect(handler(createCitizenEvent({ url: '/api/dashboard/requests' })))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns 403 from the BLOCKED_API_PATHS branch for /api/session', async () => {
        // 'session' is in BLOCKED_API_PATHS and its segments hold no 'auth'/'dashboard',
        // so it reaches and triggers the dedicated 403 API guard.
        await expect(handler(createCitizenEvent({ url: '/api/session' })))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    it('returns 403 from the BLOCKED_API_PATHS branch for /api/escalation/...', async () => {
        await expect(handler(createCitizenEvent({ url: '/api/escalation/123' })))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    // --- (3) Mutating verbs: 403 PATCH on content, POST report allowed ---

    it('returns 403 for a PATCH to /api/jsonapi/...', async () => {
        await expect(handler(createCitizenEvent({
            url: '/api/jsonapi/node/service_request/abc',
            method: 'PATCH'
        }))).rejects.toMatchObject({ statusCode: 403 });
    });

    it('allows a POST to /api/georeport (anonymous report creation)', async () => {
        await expect(handler(createCitizenEvent({
            url: '/api/georeport',
            method: 'POST'
        }))).resolves.toBeUndefined();
    });

    // --- (4) Session cookie stripping ---

    it('strips the Drupal SSESS session cookie but keeps consent=1', async () => {
        // 32-hex SSESS cookie matches /^S?SESS[a-f0-9]{32,}=/ and gets removed;
        // the consent cookie is unrelated and must survive the forward.
        const sessionCookie = 'SSESSabcdef0123456789abcdef0123456789=session-value';
        const event = createCitizenEvent({
            url: '/api/georeport',
            cookie: `${sessionCookie}; consent=1`
        });

        await expect(handler(event)).resolves.toBeUndefined();

        const forwarded = event.node.req.headers.cookie;
        expect(forwarded).toBe('consent=1');
        expect(forwarded).not.toContain('SSESS');
    });

    it('clears the cookie header entirely when only a session cookie was present', async () => {
        // A lone SESS cookie leaves an empty string after filtering, which the
        // middleware normalises to undefined so nothing is forwarded.
        const event = createCitizenEvent({
            url: '/api/georeport',
            cookie: 'SESSabcdef0123456789abcdef0123456789=session-value'
        });

        await expect(handler(event)).resolves.toBeUndefined();
        expect(event.node.req.headers.cookie).toBeUndefined();
    });
});
