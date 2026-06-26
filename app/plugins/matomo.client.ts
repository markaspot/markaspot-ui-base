// plugins/matomo.client.ts
export default defineNuxtPlugin({
    name: 'matomo',
    async setup() {
        const config = useRuntimeConfig();
        const matomo = config.public.clientConfig?.features?.analytics?.matomo;

        if (!matomo?.enabled) {
            return;
        }

        // Utility: schedule non‑critical work when idle or after load
        const schedule = (fn: () => void) => {
            if (typeof (window as any).requestIdleCallback === 'function') {
                (window as any).requestIdleCallback(fn, { timeout: (matomo as any)?.deferTimeout ?? 4000 });
            } else if (document.readyState === 'complete') {
                setTimeout(fn, 0);
            } else {
                window.addEventListener('load', () => fn(), { once: true });
            }
        };

        // Initialize Matomo Tag Manager
        const initMatomoTagManager = () => {
            if (!matomo.containerId || !matomo.containerUrl) {
                console.warn('Matomo Tag Manager: containerId and containerUrl are required');
                return;
            }

            // Guard against double insertion
            if (window._mtm && document.querySelector(`script[src="${matomo.containerUrl}"]`)) return;

            // Initialize MTM tracking array
            window._mtm = window._mtm || [];
            window._mtm.push({
                'mtm.startTime': (new Date().getTime()),
                'event': 'mtm.Start'
            });

            // Optionally preconnect
            try {
                if ((matomo as any)?.preconnect !== false) {
                    const u = new URL(matomo.containerUrl);
                    if (!document.querySelector(`link[rel="preconnect"][href="${u.origin}"]`)) {
                        const link = document.createElement('link');
                        link.rel = 'preconnect';
                        link.href = u.origin;
                        link.crossOrigin = 'anonymous';
                        document.head.appendChild(link);
                    }
                }
            } catch (error) {
                // Silently ignore preconnect errors as they're not critical
            }

            const load = () => {
                // Load MTM container script
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.async = true;
                script.src = matomo.containerUrl;
                script.setAttribute('data-matomo', 'mtm');

                const firstScript = document.getElementsByTagName('script')[0];
                firstScript?.parentNode?.insertBefore(script, firstScript);
            };

            // Defer load if configured (default: true)
            if ((matomo as any)?.deferLoad !== false) {
                schedule(load);
            } else {
                load();
            }
        };

        // Initialize traditional Matomo tracking
        const initMatomoTracking = () => {
            if (!matomo.siteId || !matomo.trackerUrl) {
                console.warn('Matomo Tracking: siteId and trackerUrl are required');
                return;
            }

            // Create Matomo tracking code
            window._paq = window._paq || [];

            // Configure tracking options
            if (matomo.doNotTrack !== false) {
                window._paq.push(['setDoNotTrack', true]);
            }

            if (matomo.disableCookies) {
                window._paq.push(['disableCookies']);
            }

            if (matomo.cookieDomain) {
                window._paq.push(['setCookieDomain', matomo.cookieDomain]);
            }

            if (matomo.enableLinkTracking !== false) {
                window._paq.push(['enableLinkTracking']);
            }

            if (matomo.enableHeartBeatTimer) {
                window._paq.push(['enableHeartBeatTimer']);
            }

            // Set site ID and tracker URL
            window._paq.push(['setTrackerUrl', matomo.trackerUrl + 'matomo.php']);
            window._paq.push(['setSiteId', matomo.siteId]);

            // Track initial page view if enabled
            if (matomo.trackPageView !== false) {
                window._paq.push(['trackPageView']);
            }

            const load = () => {
                // Avoid double insertion
                if (document.querySelector(`script[src="${matomo.trackerUrl}matomo.js"]`)) return;
                // Load Matomo script
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.async = true;
                script.src = matomo.trackerUrl + 'matomo.js';
                script.setAttribute('data-matomo', 'tracker');

                const firstScript = document.getElementsByTagName('script')[0];
                firstScript?.parentNode?.insertBefore(script, firstScript);
            };

            if ((matomo as any)?.deferLoad !== false) {
                schedule(load);
            } else {
                load();
            }
        };

        // Initialize appropriate Matomo mode when DOM is ready
        const initAnalytics = () => {
            if (matomo.mode === 'tag-manager') {
                initMatomoTagManager();
            } else {
                initMatomoTracking();
            }
        };

        if (import.meta.client) {
            // Respect Save-Data by deferring to idle (if configured)
            const conn = (navigator as any).connection;
            const prefersDefer = (matomo as any)?.deferLoad !== false || (conn?.saveData === true);
            if (prefersDefer) {
                schedule(initAnalytics);
            } else if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initAnalytics, { once: true });
            } else {
                initAnalytics();
            }
        }

        // Provide tracking methods
        return {
            provide: {
                matomo: {
                    trackEvent: (category: string, action: string, name?: string, value?: number) => {
                        if (matomo.mode === 'tag-manager' && window._mtm) {
                            // For MTM, push custom events
                            window._mtm.push({
                                event: 'customEvent',
                                eventCategory: category,
                                eventAction: action,
                                eventName: name,
                                eventValue: value
                            });
                        } else if (window._paq) {
                            window._paq.push(['trackEvent', category, action, name, value]);
                        }
                    },
                    trackPageView: (title?: string) => {
                        if (matomo.mode === 'tag-manager' && window._mtm) {
                            window._mtm.push({
                                event: 'mtm.PageView',
                                customTitle: title
                            });
                        } else if (window._paq) {
                            if (title) {
                                window._paq.push(['setDocumentTitle', title]);
                            }
                            window._paq.push(['trackPageView']);
                        }
                    },
                    trackSiteSearch: (keyword: string, category?: string, resultsCount?: number) => {
                        if (matomo.mode === 'tag-manager' && window._mtm) {
                            window._mtm.push({
                                event: 'siteSearch',
                                searchKeyword: keyword,
                                searchCategory: category,
                                searchResultsCount: resultsCount
                            });
                        } else if (window._paq) {
                            window._paq.push(['trackSiteSearch', keyword, category, resultsCount]);
                        }
                    },
                    setCustomVariable: (index: number, name: string, value: string, scope?: 'visit' | 'page') => {
                        if (matomo.mode === 'tag-manager' && window._mtm) {
                            window._mtm.push({
                                event: 'customVariable',
                                customVariableIndex: index,
                                customVariableName: name,
                                customVariableValue: value,
                                customVariableScope: scope || 'page'
                            });
                        } else if (window._paq) {
                            window._paq.push(['setCustomVariable', index, name, value, scope || 'page']);
                        }
                    }
                }
            }
        };
    }
});

// Extend global types
declare global {
    interface Window {
        _paq: any[]
        _mtm: any[]
    }
}
