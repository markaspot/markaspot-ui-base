export const DEFAULT_BRANDING_ASSETS = Object.freeze({
    logoLight: '/images/logo-light.svg',
    logoDark: '/images/logo-dark.svg',
    favicon: '/favicon.svg',
    icon192: '/images/pwa-icon-192.png',
    icon512: '/images/pwa-icon-512.png'
});

function isUnsafeAssetPath(path: string): boolean {
    return path.includes('..') || path.includes('%2e') || path.includes('%2E') || path.startsWith('//') || /^https?:\/\//i.test(path);
}

export function resolveClientAssetPath(path: string | undefined, fallback = ''): string {
    if (!path || typeof path !== 'string') {
        return fallback;
    }

    const normalizedPath = path.trim();

    if (isUnsafeAssetPath(normalizedPath)) {
        return fallback;
    }

    if (normalizedPath.includes('/files/') || normalizedPath.startsWith('/sites/') || normalizedPath.startsWith('sites/')) {
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
        return `/api/images/${cleanPath}`;
    }

    if (normalizedPath.startsWith('/')) {
        return normalizedPath;
    }

    return fallback;
}
