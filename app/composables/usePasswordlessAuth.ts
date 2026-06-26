/**
 * Passwordless Authentication Composable
 *
 * Provides Anthropic-style email verification code authentication
 * for headless Drupal integration.
 *
 * Features:
 * - Request 6-digit OTP via email
 * - Verify code and establish session
 * - Check authentication status
 * - Logout functionality
 * - Auto user creation on first login
 */

import { isLocaleCode } from '../../config/locales';
import {
    clearLogoutScopedLocalStorage,
    clearLogoutScopedNuxtState
} from '@/utils/authLogoutCleanup';
import type { AuthResponse, AuthStatusResponse, AuthUser } from '~~/types/auth';

interface UserPreferences {
    preferred_langcode?: string
}

// i18n keys for the two citizen-facing auth failures. The English literals
// are kept only as a fallback for contexts where $i18n is unavailable
// (SSR, the auth plugin running outside component setup).
const PASSWORDLESS_REQUEST_CODE_ERROR_KEY = 'auth.error.request_failed';
const PASSWORDLESS_REQUEST_CODE_ERROR_FALLBACK = 'Failed to send verification code. Please try again.';
const PASSWORDLESS_VERIFY_CODE_ERROR_KEY = 'auth.error.verify_failed';
const PASSWORDLESS_VERIFY_CODE_ERROR_FALLBACK = 'Invalid or expired verification code';
const RAW_SERVER_RESPONSE_ERROR_PATTERN = /invalid json response|unexpected token|smtp error|<!doctype|<html/i;

const getErrorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e)) ||
  'Network error. Please check your connection.';

/**
 * Resolve an i18n key against the active locale, falling back to English.
 *
 * Uses $i18n directly (not useI18n()) because this composable is also called
 * from the auth plugin, which runs outside component setup context. A missing
 * translator, a thrown lookup, or a translator that echoes the key back all
 * collapse to the English fallback.
 */
const translateAuthError = (key: string, fallback: string): string => {
    try {
        const t = (useNuxtApp().$i18n as { t?: (k: string) => string } | undefined)?.t;
        const translated = t?.(key);
        return translated && translated !== key ? translated : fallback;
    } catch {
        return fallback;
    }
};

/**
 * Decide whether a caught error message must be hidden from the citizen.
 *
 * 5xx responses and bodies matching the raw-leak pattern (SMTP debug, HTML
 * error pages, JSON parse failures) are replaced with a generic message so
 * server internals never reach the UI.
 */
const shouldHideRawError = (e: unknown, rawMessage: string): boolean => {
    const status = typeof (e as { status?: unknown })?.status === 'number'
        ? (e as { status: number }).status
        : null;
    return (status !== null && status >= 500) ||
      RAW_SERVER_RESPONSE_ERROR_PATTERN.test(rawMessage);
};

export const usePasswordlessAuth = () => {
    const apiClient = useApiClient();
    const tokenCache = useTokenCache();
    const { clearCache: clearConfigCache, currentJurisdictionId, languages } = useMarkASpotConfig();

    // Auth state - using useState for SSR compatibility
    const user = useState<AuthUser | null>('auth_user', () => null);
    const isLoading = useState<boolean>('auth_loading', () => false);
    const error = useState<string | null>('auth_error', () => null);

    // Track if auth endpoint is unavailable (404) to prevent repeated failed calls
    const endpointUnavailable = useState<boolean>('auth_endpoint_unavailable', () => false);

    // OTP flow state
    const codeRequested = useState<boolean>('auth_code_requested', () => false);
    const codeSentEmail = useState<string | null>('auth_code_email', () => null);
    const expiresAt = useState<number | null>('auth_expires_at', () => null);

    /**
     * Apply the user's preferred_langcode to the active i18n locale.
     *
     * Drupal is the source of truth for the user's language preference;
     * this hydrates the in-memory locale on login and on status refresh.
     *
     * Uses $i18n directly (not useLanguage/useI18n) because this composable
     * is called from the auth plugin which runs outside component setup context.
     * Client-only, because mutating the locale during SSR causes a hydration
     * mismatch.
     */
    const hydrateLocaleFromUser = async (u: AuthUser | null) => {
        if (!import.meta.client) return;
        if (!u?.preferred_langcode) return;
        try {
            const i18n = useNuxtApp().$i18n as any;
            const target = u.preferred_langcode;
            if (i18n.locale.value === target) return;
            if (!isLocaleCode(target)) return;
            // Only honor the user's preference if the jurisdiction offers it;
            // otherwise keep the tenant default (issue #465).
            const available = languages.value?.available;
            if (available?.length && !available.includes(target)) return;
            if (i18n.loadLocaleMessages) {
                await i18n.loadLocaleMessages(target);
            }
            if (typeof i18n.locale === 'string') {
                i18n.locale = target;
            } else {
                i18n.locale.value = target;
            }
        } catch (err) {
            console.warn('[Auth] hydrateLocaleFromUser failed:', err);
        }
    };

    /**
     * Request OTP code via email
     */
    const requestCode = async (email: string) => {
        isLoading.value = true;
        error.value = null;

        const locale = useNuxtApp().$i18n?.locale?.value || 'en';
        const jurisdictionId = currentJurisdictionId.value;

        try {
            const data = await apiClient.post<AuthResponse>(
                '/auth/request-code',
                {
                    email,
                    langcode: locale,
                    ...(jurisdictionId ? { jurisdiction_id: jurisdictionId } : {})
                }
            );

            if (data?.error) {
                error.value = data.error;
                return { success: false, error: data.error };
            }

            if (data?.success) {
                codeRequested.value = true;
                codeSentEmail.value = email;
                // Calculate expiration timestamp
                expiresAt.value = Date.now() + (data.expiresIn || 600) * 1000;

                return {
                    success: true,
                    message: data.message,
                    expiresIn: data.expiresIn
                };
            }

            const genericRequestError = translateAuthError(
                PASSWORDLESS_REQUEST_CODE_ERROR_KEY,
                PASSWORDLESS_REQUEST_CODE_ERROR_FALLBACK
            );
            return { success: false, error: genericRequestError };
        } catch (e: unknown) {
            const rawMessage = getErrorMessage(e);
            const errorMessage = shouldHideRawError(e, rawMessage)
                ? translateAuthError(PASSWORDLESS_REQUEST_CODE_ERROR_KEY, PASSWORDLESS_REQUEST_CODE_ERROR_FALLBACK)
                : rawMessage;
            error.value = errorMessage;
            return { success: false, error: errorMessage };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Verify OTP code and login
     */
    const verifyCode = async (email: string, code: string) => {
        isLoading.value = true;
        error.value = null;

        const jurisdictionId = currentJurisdictionId.value;

        try {
            const data = await apiClient.post<AuthResponse>(
                '/auth/verify-code',
                {
                    email,
                    code,
                    ...(jurisdictionId ? { jurisdiction_id: jurisdictionId } : {})
                }
            );

            if (data?.error) {
                error.value = data.error;
                return { success: false, error: data.error };
            }

            if (data?.success && data.user) {
                user.value = data.user;
                codeRequested.value = false;
                codeSentEmail.value = null;
                expiresAt.value = null;

                // CRITICAL: Invalidate cached token and refresh after login
                // user_login_finalize() regenerates the session, making the old token invalid
                // We MUST invalidate the cache first, otherwise refreshCsrfToken() returns the stale token
                tokenCache.invalidateToken();
                await apiClient.refreshCsrfToken();

                // Hydrate the i18n locale from the user's saved preference.
                // Awaited so the post-login redirect renders in the right
                // locale without a flash of the previous language.
                await hydrateLocaleFromUser(data.user);

                return {
                    success: true,
                    message: data.message,
                    user: data.user
                };
            }

            return {
                success: false,
                error: translateAuthError(PASSWORDLESS_VERIFY_CODE_ERROR_KEY, PASSWORDLESS_VERIFY_CODE_ERROR_FALLBACK)
            };
        } catch (e: unknown) {
            const rawMessage = getErrorMessage(e);
            const errorMessage = shouldHideRawError(e, rawMessage)
                ? translateAuthError(PASSWORDLESS_VERIFY_CODE_ERROR_KEY, PASSWORDLESS_VERIFY_CODE_ERROR_FALLBACK)
                : rawMessage;
            error.value = errorMessage;
            return { success: false, error: errorMessage };
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Check current authentication status
     */
    const checkStatus = async () => {
        // Skip if we know the endpoint doesn't exist (module not enabled)
        if (endpointUnavailable.value) {
            return { authenticated: false };
        }

        try {
            const data = await apiClient.get<AuthStatusResponse>(
                '/auth/status',
                undefined, // no params
                { silent: true } // suppress 404 error logging
            );

            if (data?.authenticated && data.user) {
                user.value = data.user;
                // Hydrate i18n locale from the user's saved preference on each
                // status refresh (covers full-reload, route navigation, etc.).
                hydrateLocaleFromUser(data.user);
            } else {
                user.value = null;
            }

            return data;
        } catch (e: unknown) {
            const err = e as { status?: number, statusCode?: number };
            const status = err?.status ?? err?.statusCode;

            // Detect 404 - endpoint doesn't exist (module not enabled in Drupal)
            if (status === 404) {
                endpointUnavailable.value = true;
                if (import.meta.dev) {
                    console.log('[Auth] Passwordless auth endpoint not available (module not enabled in Drupal)');
                }
            }

            // A 5xx is a server fault, not an authentication verdict. The
            // session may still be valid; the status check simply could not
            // be completed. Zeroing user.value here would falsely log the
            // user out and trigger a login redirect from the auth middleware
            // (see pro-layer/app/middleware/auth.ts) on any transient backend
            // 500. Preserve the existing auth state and report it unchanged so
            // route guards do not bounce an authenticated staff user to
            // /auth/login over a server error.
            if (typeof status === 'number' && status >= 500 && status < 600) {
                if (import.meta.dev) {
                    console.warn('[Auth] Status check failed with a server error; preserving current auth state');
                }
                return { authenticated: user.value !== null, user: user.value ?? undefined };
            }

            user.value = null;
            return { authenticated: false };
        }
    };

    /**
     * Logout user
     */
    const logout = async () => {
        isLoading.value = true;
        let apiSuccess = false;

        try {
            await apiClient.post('/auth/logout');
            apiSuccess = true;
        } catch (e: unknown) {
            console.warn('[Auth] Logout API call failed, clearing local state anyway:', e instanceof Error ? e.message : e);
        }

        // Always clear local state, even if the API call failed.
        // The user wants to log out: clear cookies, state, and caches regardless.
        // Note: Drupal session cookies are HttpOnly, so document.cookie cannot
        // read or delete them. Only the server-side Set-Cookie response (on API
        // success) actually removes the session cookie from the browser.
        try {
            user.value = null;
            codeRequested.value = false;
            codeSentEmail.value = null;
            expiresAt.value = null;
            error.value = null;

            // Invalidate CSRF token cache AND the csrfToken useState
            // (session changed, old token is invalid for the new anonymous session)
            tokenCache.invalidateToken();
            const csrfTokenState = useState<string | null>('csrfToken');
            csrfTokenState.value = null;

            // Clear config cache to ensure next user gets fresh data
            clearConfigCache();
            clearLogoutScopedNuxtState();

            // Clear all Mark-a-Spot localStorage caches and user-specific data
            if (import.meta.client) {
                clearLogoutScopedLocalStorage();
                console.log('[Auth] Cleared Mark-a-Spot caches on logout');
            }
        } catch (cleanupError) {
            console.error('[Auth] Error during logout cleanup:', cleanupError);
        } finally {
            isLoading.value = false;
        }

        return { success: apiSuccess };
    };

    /**
     * Update the authenticated user's preferences (currently: language).
     *
     * PATCHes /api/auth/preferences and replaces the local user state with
     * the response, so the dashboard reflects the new value immediately.
     */
    const updatePreferences = async (preferences: UserPreferences) => {
        try {
            const data = await apiClient.patch<AuthStatusResponse>(
                '/auth/preferences',
                preferences
            );

            if (data?.authenticated && data.user) {
                user.value = data.user;
                return { success: true, user: data.user };
            }

            return {
                success: false,
                error: 'Failed to update preferences'
            };
        } catch (e: unknown) {
            const errorMessage = (e instanceof Error ? e.message : String(e)) || 'Network error';
            console.error('[Auth] updatePreferences failed:', errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    /**
     * Update local auth state after the server records Terms acceptance.
     */
    const markTosAccepted = (acceptedAt: number | null) => {
        if (!user.value) return;
        user.value = {
            ...user.value,
            tos_accepted: true,
            tos_accepted_at: acceptedAt
        };
    };

    /**
     * Reset auth flow state
     */
    const resetFlow = () => {
        codeRequested.value = false;
        codeSentEmail.value = null;
        expiresAt.value = null;
        error.value = null;
    };

    /**
     * Computed: Is user authenticated
     */
    const isAuthenticated = computed(() => user.value !== null);

    /**
     * Computed: Time remaining for code expiration (in seconds)
     */
    const timeRemaining = computed(() => {
        if (!expiresAt.value) return 0;
        const remaining = Math.floor((expiresAt.value - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
    });

    /**
     * Computed: Is code expired
     */
    const isCodeExpired = computed(() => {
        return codeRequested.value && timeRemaining.value === 0;
    });

    return {
        // State
        user: readonly(user),
        isLoading: readonly(isLoading),
        error: readonly(error),
        codeRequested: readonly(codeRequested),
        codeSentEmail: readonly(codeSentEmail),
        expiresAt: readonly(expiresAt),

        // Computed
        isAuthenticated,
        timeRemaining,
        isCodeExpired,

        // Actions
        requestCode,
        verifyCode,
        checkStatus,
        logout,
        resetFlow,
        updatePreferences,
        markTosAccepted
    };
};
