import type { SsoProvider } from '~~/types/clientConfig';

type SsoProviderInput = string | Pick<SsoProvider, 'id'>;

const AUTH_SEGMENT = 'auth';
const INTERNAL_BACKEND_HOSTS = new Set(['web', 'cloud-drupal', 'cloud-nginx', 'drupal']);
const SSO_AUTH_ERROR_KEY = 'auth.error.sso_failed';
const SSO_AUTH_ERROR_FALLBACK = 'Sign-in failed. Please try again.';

const decodeRepeatedly = (value: string): string => {
    let decoded = value;
    for (let i = 0; i < 2; i++) {
        try {
            const next = decodeURIComponent(decoded);
            if (next === decoded) break;
            decoded = next;
        } catch {
            break;
        }
    }
    return decoded;
};

const isSafeReturnPath = (path: string): boolean => {
    if (!path.startsWith('/') || path.startsWith('//')) return false;
    if (/[\r\n\\]/.test(path)) return false;

    const pathname = path.split(/[?#]/)[0] ?? path;
    const decodedPathname = decodeRepeatedly(pathname);
    const decodedPath = decodeRepeatedly(path);
    if (
        decodedPathname.startsWith('//') ||
        decodedPathname.startsWith('/\\') ||
        /[\r\n\\]/.test(decodedPath)
    ) {
        return false;
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        try {
            const normalized = new URL(path, window.location.origin);
            if (normalized.origin !== window.location.origin) return false;
        } catch {
            return false;
        }
    }

    const segments = decodedPathname.split('/').filter(Boolean);
    const authIndex = segments.indexOf(AUTH_SEGMENT);
    return authIndex === -1 || segments[authIndex + 1] === 'sso-callback';
};

const isLocalBrowserHost = (hostname: string): boolean => {
    return hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.ddev.site');
};

const isPrivateIpAddress = (hostname: string): boolean => {
    return /^10\./.test(hostname) ||
      /^127\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
      /^192\.168\./.test(hostname);
};

const browserSafeOrigin = (value?: string | null, allowLocalHosts = false): string => {
    if (!value) return '';

    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        const hostname = url.hostname.toLowerCase();
        const isLocalHost = isLocalBrowserHost(hostname);
        if (isLocalHost && !allowLocalHosts) return '';
        if (url.protocol !== 'https:' && !isLocalHost) return '';
        if (INTERNAL_BACKEND_HOSTS.has(hostname)) return '';
        if (!isLocalHost && !hostname.includes('.')) return '';
        if (!isLocalHost && isPrivateIpAddress(hostname)) return '';
        if (!isLocalHost && /(^|[-.])(nginx|drupal|web)([-.]|$)/.test(hostname)) return '';
        return url.origin;
    } catch {
        return '';
    }
};

const ddevBackendOrigin = (): string => {
    if (typeof window === 'undefined' || !window.location) return '';

    const { protocol, hostname, port } = window.location;
    if (hostname.endsWith('.ddev.site') && port) {
        return `${protocol}//${hostname}`;
    }

    return '';
};

const translateSsoError = (): string => {
    try {
        const t = (useNuxtApp().$i18n as { t?: (k: string) => string } | undefined)?.t;
        const translated = t?.(SSO_AUTH_ERROR_KEY);
        return translated && translated !== SSO_AUTH_ERROR_KEY ? translated : SSO_AUTH_ERROR_FALLBACK;
    } catch {
        return SSO_AUTH_ERROR_FALLBACK;
    }
};

export const useSsoLogin = () => {
    const apiClient = useApiClient();
    const tokenCache = useTokenCache();
    const { checkStatus } = usePasswordlessAuth();
    const route = useRoute();
    const runtimeConfig = useRuntimeConfig();

    const isLoading = useState<boolean>('sso_login_loading', () => false);
    const activeProviderId = useState<string | null>('sso_login_provider', () => null);
    const error = useState<string | null>('sso_login_error', () => null);

    const providerId = (provider: SsoProviderInput): string => {
        return typeof provider === 'string' ? provider : provider.id;
    };

    const sanitizeReturnTo = (returnTo?: string | null): string => {
        const candidate = returnTo || route.fullPath || '/';
        return isSafeReturnPath(candidate) ? candidate : '/';
    };

    const relayStateFor = (returnTo?: string | null): string => {
        const safePath = sanitizeReturnTo(returnTo);
        if (typeof window === 'undefined' || !window.location?.origin) {
            return safePath;
        }

        return new URL(safePath, window.location.origin).toString();
    };

    const ssoBackendOrigin = (): string => {
        const publicConfig = runtimeConfig.public as Record<string, unknown>;
        return browserSafeOrigin(String(publicConfig.ssoBackendOrigin || ''), import.meta.dev) ||
          (import.meta.dev ? ddevBackendOrigin() : '');
    };

    const clearSsoError = () => {
        error.value = null;
    };

    const startSsoLogin = (provider: SsoProviderInput, returnTo?: string | null): string => {
        const id = providerId(provider);
        const loginPath = `/auth/sso/${encodeURIComponent(id)}/login?returnTo=${encodeURIComponent(relayStateFor(returnTo))}`;
        const backendOrigin = ssoBackendOrigin();
        activeProviderId.value = id;
        error.value = null;
        isLoading.value = true;

        if (!backendOrigin) {
            error.value = translateSsoError();
            isLoading.value = false;
            activeProviderId.value = null;
            return '';
        }

        const target = `${backendOrigin}${loginPath}`;
        if (import.meta.client) {
            window.location.assign(target);
        }

        return target;
    };

    const resumeSsoLogin = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            tokenCache.invalidateToken();
            await apiClient.refreshCsrfToken();
            const status = await checkStatus();
            if (!status?.authenticated) {
                error.value = translateSsoError();
                throw new Error('SSO authentication did not complete');
            }
            return status;
        } catch (e: unknown) {
            error.value ||= translateSsoError();
            throw e;
        } finally {
            isLoading.value = false;
            activeProviderId.value = null;
        }
    };

    return {
        isLoading,
        activeProviderId,
        error,
        sanitizeReturnTo,
        relayStateFor,
        ssoBackendOrigin,
        clearSsoError,
        startSsoLogin,
        resumeSsoLogin
    };
};
