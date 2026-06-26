import { beforeEach, describe, expect, it, vi } from 'vitest';
import middleware from '@/middleware/emergency.global';

const mockNavigateTo = vi.fn((target: string) => target);
const mockFetch = vi.fn();
const bypassCookie = { value: null as string | null };

// State store backing the useState stub. Module-level so it persists across
// the hoisted vi.mock factory call (which runs before variable init below).
const _stateStore: Record<string, { value: unknown }> = {};

vi.mock('#imports', () => ({
    defineNuxtRouteMiddleware: (handler: (to: any) => any) => handler,
    navigateTo: (target: string, options?: Record<string, unknown>) => mockNavigateTo(target, options),
    useCookie: () => bypassCookie,
    useState: <T>(key: string, init: () => T) => {
        if (!(_stateStore[key])) {
            _stateStore[key] = { value: init() };
        }
        return _stateStore[key] as { value: T };
    }
}));

const runMiddleware = middleware as (to: { path: string, query: Record<string, string> }) => Promise<unknown>;

// Build an active-emergency response matching the new API contract
// (top-level booleans, no details.*).
function activeEmergencyStatus(overrides: Record<string, unknown> = {}) {
    return {
        emergency_mode: true,
        status: 'active',
        mode_type: 'disaster',
        lite_ui: true,
        force_redirect: true,
        available_categories: [],
        allowed_urls: [],
        banner: null,
        ...overrides
    };
}

describe('emergency.global middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('$fetch', mockFetch);
        bypassCookie.value = null;
        // Reset state store so TTL cache does not carry over between tests.
        for (const key of Object.keys(_stateStore)) {
            Reflect.deleteProperty(_stateStore, key);
        }
        mockFetch.mockResolvedValue(activeEmergencyStatus());
    });

    // --- Bypass paths ---

    it('allows jurisdiction-prefixed auth routes during emergencies', async () => {
        const result = await runMiddleware({ path: '/amsterdam/auth/login', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('allows jurisdiction-prefixed dashboard routes during emergencies', async () => {
        const result = await runMiddleware({ path: '/amsterdam/dashboard/requests', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('allows jurisdiction-prefixed report routes during emergencies', async () => {
        const result = await runMiddleware({ path: '/amsterdam/report', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('allows unprefixed auth route', async () => {
        const result = await runMiddleware({ path: '/auth/login', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('allows unprefixed dashboard route', async () => {
        const result = await runMiddleware({ path: '/dashboard', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    // --- Redirect behavior ---

    it('redirects non-critical routes to /lite during emergencies', async () => {
        const result = await runMiddleware({ path: '/amsterdam/privacy', query: {} });
        expect(result).toBe('/lite');
        expect(mockNavigateTo).toHaveBeenCalledWith('/lite', { external: true });
    });

    it('redirects root to /lite during emergencies', async () => {
        const result = await runMiddleware({ path: '/', query: {} });
        expect(result).toBe('/lite');
        expect(mockNavigateTo).toHaveBeenCalledWith('/lite', { external: true });
    });

    it('does not redirect when already at /lite', async () => {
        const result = await runMiddleware({ path: '/lite', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    // --- New contract: top-level emergency_mode flag ---

    it('does not redirect when emergency_mode is false', async () => {
        mockFetch.mockResolvedValue(activeEmergencyStatus({ emergency_mode: false }));
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('does not redirect when emergency_mode is null (fail-open)', async () => {
        mockFetch.mockResolvedValue({ emergency_mode: null });
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('does not redirect when active but neither force_redirect nor lite_ui is set', async () => {
        mockFetch.mockResolvedValue(activeEmergencyStatus({ force_redirect: false, lite_ui: false }));
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('redirects when emergency_mode=true and only lite_ui=true (force_redirect false)', async () => {
        mockFetch.mockResolvedValue(activeEmergencyStatus({ force_redirect: false, lite_ui: true }));
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBe('/lite');
    });

    it('redirects when emergency_mode=true and only force_redirect=true (lite_ui false)', async () => {
        mockFetch.mockResolvedValue(activeEmergencyStatus({ force_redirect: true, lite_ui: false }));
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBe('/lite');
    });

    // --- Maintenance mode ---

    it('redirects on maintenance mode with force_redirect=true', async () => {
        mockFetch.mockResolvedValue({
            emergency_mode: false,
            mode_type: 'maintenance',
            force_redirect: true,
            lite_ui: false,
            allowed_urls: []
        });
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBe('/lite');
    });

    it('does not redirect on maintenance mode without force_redirect', async () => {
        mockFetch.mockResolvedValue({
            emergency_mode: false,
            mode_type: 'maintenance',
            force_redirect: false,
            lite_ui: false,
            allowed_urls: []
        });
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBeUndefined();
    });

    // --- allowed_urls with jurisdiction prefix ---

    it('respects allowed_urls without jurisdiction prefix', async () => {
        mockFetch.mockResolvedValue(activeEmergencyStatus({ allowed_urls: ['/status-page'] }));
        const result = await runMiddleware({ path: '/status-page', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    it('respects allowed_urls when accessed with jurisdiction prefix', async () => {
        mockFetch.mockResolvedValue(activeEmergencyStatus({ allowed_urls: ['/status-page'] }));
        const result = await runMiddleware({ path: '/amsterdam/status-page', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    // --- Bypass cookie and query ---

    it('respects lite_bypass cookie (no redirect)', async () => {
        bypassCookie.value = '1';
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBeUndefined();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sets bypass cookie on ?full=1 and does not redirect', async () => {
        const result = await runMiddleware({ path: '/amsterdam', query: { full: '1' } });
        expect(result).toBeUndefined();
        expect(bypassCookie.value).toBe('1');
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });

    // --- Fail-open on fetch error ---

    it('fails open (no redirect) when status endpoint throws', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));
        const result = await runMiddleware({ path: '/amsterdam', query: {} });
        expect(result).toBeUndefined();
        expect(mockNavigateTo).not.toHaveBeenCalled();
    });
});
