// plugins/network-status.client.ts
// Client-only network status interceptor to toggle service-unavailable overlay
// immediately on backend 5xx responses or network failures, including when
// the frontend is served from a PWA service worker cache.

export default defineNuxtPlugin(() => {
    if (import.meta.server) return;

    const serviceStatus = useServiceStatus();

    // Avoid double patching
    if ((window as any).__masFetchPatched) return;
    (window as any).__masFetchPatched = true;

    const originalFetch = window.fetch.bind(window);

    const isApiUrl = (u: any) => {
        try {
            const url = typeof u === 'string' ? new URL(u, window.location.origin) : new URL(u.url, window.location.origin);
            return url.pathname.startsWith('/api/') || url.pathname.startsWith('/jsonapi');
        } catch {
            return false;
        }
    };

    window.fetch = async (...args: any[]) => {
        try {
            const res = await originalFetch(...args);
            if (isApiUrl(args[0])) {
                if (res.status >= 500 && res.status < 600) {
                    serviceStatus.registerServiceFailure({ statusCode: res.status } as any);
                } else if (res.ok) {
                    serviceStatus.registerServiceSuccess();
                }
            }
            return res;
        } catch (err: unknown) {
            if (isApiUrl(args[0])) {
                serviceStatus.registerServiceFailure({ statusCode: 500 } as any);
            }
            throw err;
        }
    };
});
