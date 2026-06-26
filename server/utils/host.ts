/**
 * Derive the canonical X-Forwarded-Host from server config.
 *
 * In production Docker builds, NUXT_API_BASE points to the internal hostname
 * (e.g. "http://web"). The proxy uses this to set X-Forwarded-Host, which
 * Drupal uses to compute the session cookie name (SESS + hash(hostname)).
 *
 * ALL server endpoints that forward session cookies to Drupal MUST use the
 * same X-Forwarded-Host. A mismatch causes Drupal to compute a different
 * session cookie name, silently dropping the authenticated session.
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/305
 */
function normaliseHost(raw: string | undefined): string {
    const value = String(raw || '').replace(/[\r\n\0]/g, '').trim();
    if (!value) return '';

    try {
        return value.includes('://')
            ? new URL(value).hostname
            : new URL(`http://${value}`).hostname;
    } catch {
        return value.split(':')[0];
    }
}

function isInternalBackendHost(host: string): boolean {
    return [
        'web',
        'drupal',
        'cloud-drupal',
        'localhost',
        '127.0.0.1',
        '::1'
    ].includes(host) || host.endsWith('.internal');
}

function isAllowedLocalDevHost(host: string): boolean {
    return [
        'localhost',
        '127.0.0.1',
        '::1'
    ].includes(host) || host.endsWith('.localhost') || host.endsWith('.ddev.site');
}

export function getCanonicalHost(requestHost?: string): string {
    const explicitHost = process.env.NUXT_CANONICAL_HOST ||
      process.env.NUXT_PUBLIC_CANONICAL_HOST ||
      process.env.DRUPAL_PUBLIC_HOST ||
      process.env.DDEV_HOSTNAME;

    if (explicitHost) {
        return normaliseHost(explicitHost);
    }

    const config = useRuntimeConfig();
    try {
        const configuredHost = new URL(String(config.apiBase || config.public.apiBase)).hostname;
        const localRequestHost = normaliseHost(requestHost);
        if (
            process.env.NODE_ENV !== 'production' &&
            localRequestHost &&
            isAllowedLocalDevHost(localRequestHost) &&
            isInternalBackendHost(configuredHost)
        ) {
            return localRequestHost;
        }

        return configuredHost;
    } catch (e) {
        console.error('[host] NUXT_API_BASE is missing or invalid, X-Forwarded-Host will be empty:', e);
        return '';
    }
}

export function getSessionAwareApiBase(
    apiBase: string | undefined,
    requestHost: string | undefined,
    hasSession: boolean
): string {
    const configuredBase = String(apiBase || '').replace(/\/+$/, '');
    if (!configuredBase || !hasSession || process.env.NODE_ENV === 'production') {
        return configuredBase;
    }

    try {
        const configuredUrl = new URL(configuredBase);
        if (!isInternalBackendHost(configuredUrl.hostname)) {
            return configuredBase;
        }

        const canonicalHost = getCanonicalHost(requestHost);
        if (!canonicalHost || isInternalBackendHost(canonicalHost) || !isAllowedLocalDevHost(canonicalHost)) {
            return configuredBase;
        }

        return `https://${canonicalHost}`;
    } catch {
        return configuredBase;
    }
}
