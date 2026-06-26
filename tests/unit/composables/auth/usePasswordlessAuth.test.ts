import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import { clearMockState, getStateMap, useState } from '../../__mocks__/nuxt';
import { usePasswordlessAuth } from '@/composables/usePasswordlessAuth';
import {
    clearLogoutScopedLocalStorage,
    isLogoutScopedStateKey,
    isLogoutScopedStorageKey
} from '@/utils/authLogoutCleanup';

const apiPost = vi.fn();
const clearConfigCache = vi.fn();
const invalidateToken = vi.fn();

describe('usePasswordlessAuth logout cleanup', () => {
    beforeEach(() => {
        clearMockState();
        localStorage.clear();
        apiPost.mockReset();
        clearConfigCache.mockReset();
        invalidateToken.mockReset();

        apiPost.mockResolvedValue({ success: true });

        vi.stubGlobal('useApiClient', () => ({
            post: apiPost
        }));
        vi.stubGlobal('useTokenCache', () => ({
            invalidateToken
        }));
        vi.stubGlobal('useMarkASpotConfig', () => ({
            clearCache: clearConfigCache,
            currentJurisdictionId: computed(() => null)
        }));
    });

    it('matches dashboard and auth-scoped Nuxt state keys', () => {
        expect(isLogoutScopedStateKey('dashboard-members-users')).toBe(true);
        expect(isLogoutScopedStateKey('dashboard_requests')).toBe(true);
        expect(isLogoutScopedStateKey('dashboard-requests-lastFetchKey')).toBe(true);
        expect(isLogoutScopedStateKey('organisations-all')).toBe(true);
        expect(isLogoutScopedStateKey('mas-config-state')).toBe(true);
        expect(isLogoutScopedStateKey('status_items')).toBe(false);
        expect(isLogoutScopedStorageKey('masConfig-amsterdam')).toBe(true);
        expect(isLogoutScopedStorageKey('markASpotSettings_j1_u7')).toBe(true);
        expect(isLogoutScopedStorageKey('unrelated')).toBe(false);
    });

    it('clears auth and downstream dashboard caches on logout', async () => {
        useState('auth_user', () => null).value = {
            uid: '7',
            groups: [{ id: '1', type: 'jur' }]
        };
        useState('csrfToken', () => null).value = 'stale-token';
        useState('dashboard-members-users', () => []).value = [{ uid: 7 }];
        useState('dashboard-members-groups', () => []).value = [{ id: 1, type: 'jur' }];
        useState('dashboard_requests', () => []).value = [{ service_request_id: 'SR-1' }];
        useState('dashboard-requests-lastFetchKey', () => null).value = 'jur-1:user-7';
        useState('organisations-all', () => []).value = [{ uuid: 'org-1', id: 11, label: 'Org 1' }];
        useState('organisations-jurisdiction', () => undefined).value = 1;
        useState('mas-config-state', () => null).value = { jurisdiction: { id: 1 } };
        useState('jurisdictions-state', () => null).value = { loaded: true };
        useState('status_items', () => []).value = [{ id: 'public-status' }];
        const { logout } = usePasswordlessAuth();

        await logout();

        expect(apiPost).toHaveBeenCalledWith('/auth/logout');
        expect(invalidateToken).toHaveBeenCalled();
        expect(clearConfigCache).toHaveBeenCalled();
        expect(useState('auth_user').value).toBeNull();
        expect(useState('csrfToken').value).toBeNull();
        expect(getStateMap().get('dashboard-members-users')?.value).toEqual([]);
        expect(getStateMap().get('dashboard-members-groups')?.value).toEqual([]);
        expect(getStateMap().get('dashboard_requests')?.value).toEqual([]);
        expect(getStateMap().get('dashboard-requests-lastFetchKey')?.value).toBeNull();
        expect(getStateMap().get('organisations-all')?.value).toEqual([]);
        expect(getStateMap().get('organisations-jurisdiction')?.value).toBeUndefined();
        expect(getStateMap().get('mas-config-state')?.value).toBeNull();
        expect(getStateMap().get('jurisdictions-state')?.value).toBeNull();
        expect(useState('status_items').value).toEqual([{ id: 'public-status' }]);
    });

    it('clears persistent logout-scoped browser caches', () => {
        localStorage.setItem('masConfig-amsterdam', 'stale-config');
        localStorage.setItem('markASpotSettings_j1_u7', 'stale-settings');
        localStorage.setItem('followedReports', 'stale-followed');
        localStorage.setItem('unrelated', 'kept');

        clearLogoutScopedLocalStorage();

        expect(localStorage.getItem('masConfig-amsterdam')).toBeNull();
        expect(localStorage.getItem('markASpotSettings_j1_u7')).toBeNull();
        expect(localStorage.getItem('followedReports')).toBeNull();
        expect(localStorage.getItem('unrelated')).toBe('kept');
    });

    it('updates local ToS state after server acceptance', () => {
        useState('auth_user', () => null).value = {
            uid: '7',
            roles: ['authenticated'],
            groups: [],
            tos_accepted: false,
            tos_accepted_at: null
        };

        const { markTosAccepted } = usePasswordlessAuth();

        markTosAccepted(1714567890);

        expect(useState('auth_user').value).toMatchObject({
            uid: '7',
            tos_accepted: true,
            tos_accepted_at: 1714567890
        });
    });

    it('sanitizes raw non-JSON request-code failures', async () => {
        apiPost.mockRejectedValueOnce(
            new Error('Invalid JSON response from /auth/request-code: Unexpected token S, "SMTP error"... is not valid JSON')
        );

        const { requestCode } = usePasswordlessAuth();
        const result = await requestCode('user@example.com');

        expect(result).toEqual({
            success: false,
            error: 'Failed to send verification code. Please try again.'
        });
        expect(useState('auth_error').value).toBe('Failed to send verification code. Please try again.');
    });

    it('sanitizes server failures during request-code', async () => {
        apiPost.mockRejectedValueOnce(
            Object.assign(new Error('Server returned an invalid response. Please try again later.'), { status: 502 })
        );

        const { requestCode } = usePasswordlessAuth();
        const result = await requestCode('user@example.com');

        expect(result).toEqual({
            success: false,
            error: 'Failed to send verification code. Please try again.'
        });
        expect(useState('auth_error').value).toBe('Failed to send verification code. Please try again.');
    });

    it('passes through legitimate non-5xx request-code errors', async () => {
        apiPost.mockRejectedValueOnce(
            Object.assign(new Error('Email address is not registered'), { status: 422 })
        );

        const { requestCode } = usePasswordlessAuth();
        const result = await requestCode('user@example.com');

        expect(result).toEqual({
            success: false,
            error: 'Email address is not registered'
        });
        expect(useState('auth_error').value).toBe('Email address is not registered');
    });

    it('sanitizes raw non-JSON verify-code failures', async () => {
        apiPost.mockRejectedValueOnce(
            new Error('Invalid JSON response from /auth/verify-code: Unexpected token <, "<!DOCTYPE "... is not valid JSON')
        );

        const { verifyCode } = usePasswordlessAuth();
        const result = await verifyCode('user@example.com', '123456');

        expect(result).toEqual({
            success: false,
            error: 'Invalid or expired verification code'
        });
        expect(useState('auth_error').value).toBe('Invalid or expired verification code');
    });

    it('sanitizes server failures during verify-code', async () => {
        apiPost.mockRejectedValueOnce(
            Object.assign(new Error('SMTP error: connection refused'), { status: 500 })
        );

        const { verifyCode } = usePasswordlessAuth();
        const result = await verifyCode('user@example.com', '123456');

        expect(result).toEqual({
            success: false,
            error: 'Invalid or expired verification code'
        });
        expect(useState('auth_error').value).toBe('Invalid or expired verification code');
    });
});

describe('usePasswordlessAuth checkStatus error handling', () => {
    const apiGet = vi.fn();

    beforeEach(() => {
        clearMockState();
        apiGet.mockReset();

        vi.stubGlobal('useApiClient', () => ({
            get: apiGet
        }));
        vi.stubGlobal('useTokenCache', () => ({
            invalidateToken
        }));
        vi.stubGlobal('useMarkASpotConfig', () => ({
            clearCache: clearConfigCache,
            currentJurisdictionId: computed(() => null)
        }));
    });

    it('preserves the authenticated user when the status check fails with a 500', async () => {
        const authUser = { uid: '7', roles: ['authenticated'], groups: [] };
        useState('auth_user', () => null).value = authUser;
        apiGet.mockRejectedValueOnce(
            Object.assign(new Error('Server error. Please try again later.'), { status: 500 })
        );

        const { checkStatus } = usePasswordlessAuth();
        const result = await checkStatus();

        // A 5xx is a server fault, not a logout: the staff user must stay
        // authenticated so route guards do not bounce them to /auth/login.
        expect(useState('auth_user').value).toEqual(authUser);
        expect(result).toEqual({ authenticated: true, user: authUser });
    });

    it('keeps an anonymous user anonymous when the status check fails with a 500', async () => {
        useState('auth_user', () => null).value = null;
        apiGet.mockRejectedValueOnce(
            Object.assign(new Error('Bad Gateway'), { status: 502 })
        );

        const { checkStatus } = usePasswordlessAuth();
        const result = await checkStatus();

        expect(useState('auth_user').value).toBeNull();
        expect(result).toEqual({ authenticated: false, user: undefined });
    });

    it('clears the user on a 401, which is a genuine auth failure', async () => {
        useState('auth_user', () => null).value = { uid: '7', roles: ['authenticated'], groups: [] };
        apiGet.mockRejectedValueOnce(
            Object.assign(new Error('Unauthorized'), { status: 401 })
        );

        const { checkStatus } = usePasswordlessAuth();
        const result = await checkStatus();

        expect(useState('auth_user').value).toBeNull();
        expect(result).toEqual({ authenticated: false });
    });

    it('marks the endpoint unavailable and clears the user on a 404', async () => {
        useState('auth_user', () => null).value = { uid: '7', roles: ['authenticated'], groups: [] };
        apiGet.mockRejectedValueOnce(
            Object.assign(new Error('Not Found'), { status: 404 })
        );

        const { checkStatus } = usePasswordlessAuth();
        const result = await checkStatus();

        expect(useState('auth_user').value).toBeNull();
        expect(useState('auth_endpoint_unavailable').value).toBe(true);
        expect(result).toEqual({ authenticated: false });
    });

    it('clears the user when the status check fails without a recognisable status', async () => {
        useState('auth_user', () => null).value = { uid: '7', roles: ['authenticated'], groups: [] };
        apiGet.mockRejectedValueOnce(new Error('Network error for /auth/status'));

        const { checkStatus } = usePasswordlessAuth();
        const result = await checkStatus();

        // A statusless failure (network drop, timeout) is treated conservatively:
        // the user is cleared, matching the pre-fix fail-closed behaviour.
        expect(useState('auth_user').value).toBeNull();
        expect(result).toEqual({ authenticated: false });
    });
});
