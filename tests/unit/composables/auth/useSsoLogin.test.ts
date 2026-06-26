import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMockState, mockRouteData, mockRuntimeConfigData, useState } from '../../__mocks__/nuxt';
import { useSsoLogin } from '@/composables/useSsoLogin';

const refreshCsrfToken = vi.fn();
const invalidateToken = vi.fn();
const checkStatus = vi.fn();
let assignSpy: ReturnType<typeof vi.spyOn> | null = null;
let locationSpy: ReturnType<typeof vi.spyOn> | null = null;

const mockWindowLocation = (overrides: Partial<Location> = {}) => {
    locationSpy?.mockRestore();
    locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        protocol: 'https:',
        hostname: 'dev.ddev.site',
        port: '3001',
        origin: 'https://dev.ddev.site:3001',
        assign: assignSpy!,
        ...overrides
    } as Location);
};

describe('useSsoLogin', () => {
    beforeEach(() => {
        clearMockState();
        assignSpy?.mockRestore();
        assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
        mockWindowLocation();
        refreshCsrfToken.mockReset();
        invalidateToken.mockReset();
        checkStatus.mockReset();
        mockRuntimeConfigData.public.apiBase = 'https://dev.ddev.site';
        mockRuntimeConfigData.public.ssoBackendOrigin = '';

        vi.stubGlobal('useApiClient', () => ({
            refreshCsrfToken
        }));
        vi.stubGlobal('useTokenCache', () => ({
            invalidateToken
        }));
        vi.stubGlobal('usePasswordlessAuth', () => ({
            checkStatus
        }));
    });

    afterEach(() => {
        locationSpy?.mockRestore();
        locationSpy = null;
        assignSpy?.mockRestore();
        assignSpy = null;
    });

    it('builds a provider login URL with an encoded safe callback RelayState', () => {
        mockRuntimeConfigData.public.ssoBackendOrigin = 'https://sso.example.test';
        const { startSsoLogin } = useSsoLogin();

        const target = startSsoLogin(
            { id: 'keycloak', label: 'Stadt-Login' },
            '/amsterdam/auth/sso-callback?redirect=%2Famsterdam%2Fdashboard'
        );

        expect(target).toBe('https://sso.example.test/auth/sso/keycloak/login?returnTo=https%3A%2F%2Fdev.ddev.site%3A3001%2Famsterdam%2Fauth%2Fsso-callback%3Fredirect%3D%252Famsterdam%252Fdashboard');
        expect(useState('sso_login_loading').value).toBe(true);
        expect(useState('sso_login_provider').value).toBe('keycloak');
    });

    it('prefers an explicit browser SSO backend origin', () => {
        mockRuntimeConfigData.public.ssoBackendOrigin = 'https://login.example.test/';
        const { startSsoLogin } = useSsoLogin();

        expect(startSsoLogin('keycloak', '/amsterdam/auth/sso-callback'))
            .toBe('https://login.example.test/auth/sso/keycloak/login?returnTo=https%3A%2F%2Fdev.ddev.site%3A3001%2Famsterdam%2Fauth%2Fsso-callback');
    });

    it('does not derive a DDEV fallback origin outside dev mode', () => {
        mockRuntimeConfigData.public.apiBase = 'http://web';
        const { startSsoLogin } = useSsoLogin();

        expect(startSsoLogin('keycloak', '/amsterdam/auth/sso-callback'))
            .toBe('');
        expect(assignSpy).not.toHaveBeenCalled();
    });

    it('falls back to root for unsafe RelayState targets', () => {
        mockRuntimeConfigData.public.ssoBackendOrigin = 'https://sso.example.test';
        mockRouteData.fullPath = '/amsterdam/auth/login';
        const { startSsoLogin } = useSsoLogin();

        expect(startSsoLogin('keycloak', 'https://evil.example/admin'))
            .toBe('https://sso.example.test/auth/sso/keycloak/login?returnTo=https%3A%2F%2Fdev.ddev.site%3A3001%2F');
    });

    it.each([
        '/\\\\evil.example/path',
        '/%5C%5Cevil.example/path',
        '/%2F%2Fevil.example/path'
    ])('falls back to root for encoded or backslash redirect escapes: %s', (targetPath) => {
        mockRuntimeConfigData.public.ssoBackendOrigin = 'https://sso.example.test';
        const { startSsoLogin } = useSsoLogin();

        expect(startSsoLogin('keycloak', targetPath))
            .toBe('https://sso.example.test/auth/sso/keycloak/login?returnTo=https%3A%2F%2Fdev.ddev.site%3A3001%2F');
    });

    it('keeps the frontend port only in RelayState when backend origin is explicit', () => {
        mockRuntimeConfigData.public.ssoBackendOrigin = 'https://sso.example.test';
        mockWindowLocation({ port: '5501', origin: 'https://dev.ddev.site:5501' });
        const { startSsoLogin } = useSsoLogin();

        expect(startSsoLogin('keycloak', '/amsterdam/auth/sso-callback'))
            .toBe('https://sso.example.test/auth/sso/keycloak/login?returnTo=https%3A%2F%2Fdev.ddev.site%3A5501%2Famsterdam%2Fauth%2Fsso-callback');
    });

    it('fails closed when only an internal backend origin is configured outside DDEV', () => {
        mockRuntimeConfigData.public.apiBase = 'http://web';
        mockWindowLocation({
            hostname: 'app.example.test',
            port: '',
            origin: 'https://app.example.test'
        });
        const { startSsoLogin } = useSsoLogin();

        expect(startSsoLogin('keycloak', '/auth/sso-callback')).toBe('');
        expect(assignSpy).not.toHaveBeenCalled();
        expect(useState('sso_login_error').value).toBe('Sign-in failed. Please try again.');
        expect(useState('sso_login_loading').value).toBe(false);
    });

    it.each([
        'http://cloud-nginx',
        'http://tenant-nginx-1:8080',
        'http://10.0.0.5:8080',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://dev.ddev.site:3001',
        'http://backend.example.test'
    ])('rejects browser-unsafe SSO backend origins: %s', (origin) => {
        mockRuntimeConfigData.public.ssoBackendOrigin = origin;
        mockRuntimeConfigData.public.apiBase = '';
        mockWindowLocation({
            hostname: 'app.example.test',
            port: '',
            origin: 'https://app.example.test'
        });
        const { startSsoLogin } = useSsoLogin();

        expect(startSsoLogin('keycloak', '/auth/sso-callback')).toBe('');
        expect(assignSpy).not.toHaveBeenCalled();
        expect(useState('sso_login_error').value).toBe('Sign-in failed. Please try again.');
    });

    it('invalidates the cached CSRF token before checking auth status after SSO', async () => {
        refreshCsrfToken.mockResolvedValue(undefined);
        checkStatus.mockResolvedValue({ authenticated: true });
        const { resumeSsoLogin } = useSsoLogin();

        await expect(resumeSsoLogin()).resolves.toEqual({ authenticated: true });

        expect(invalidateToken).toHaveBeenCalledOnce();
        expect(refreshCsrfToken).toHaveBeenCalledOnce();
        expect(checkStatus).toHaveBeenCalledOnce();
        expect(useState('sso_login_loading').value).toBe(false);
        expect(useState('sso_login_provider').value).toBeNull();
    });

    it('treats unauthenticated SSO resume as a failed login', async () => {
        refreshCsrfToken.mockResolvedValue(undefined);
        checkStatus.mockResolvedValue({ authenticated: false });
        const { resumeSsoLogin } = useSsoLogin();

        await expect(resumeSsoLogin()).rejects.toThrow('SSO authentication did not complete');

        expect(useState('sso_login_error').value).toBe('Sign-in failed. Please try again.');
        expect(useState('sso_login_loading').value).toBe(false);
        expect(useState('sso_login_provider').value).toBeNull();
    });

    it('stores a generic error when SSO resume fails', async () => {
        refreshCsrfToken.mockRejectedValue(new Error('<html>backend details</html>'));
        const { resumeSsoLogin } = useSsoLogin();

        await expect(resumeSsoLogin()).rejects.toThrow('<html>backend details</html>');

        expect(useState('sso_login_error').value).toBe('Sign-in failed. Please try again.');
        expect(useState('sso_login_loading').value).toBe(false);
    });

    it('can clear SSO errors when switching auth method', () => {
        useState('sso_login_error').value = 'Sign-in failed. Please try again.';
        const { clearSsoError } = useSsoLogin();

        clearSsoError();

        expect(useState('sso_login_error').value).toBeNull();
    });
});
