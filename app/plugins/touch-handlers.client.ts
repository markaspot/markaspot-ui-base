/**
 * Touch Event Handlers Plugin
 *
 * This plugin helps prevent unwanted zooming and improves touch behavior
 * in both PWA and browser contexts, particularly addressing double-tap zoom issues.
 */
export default defineNuxtPlugin((nuxtApp) => {
    if (import.meta.client) {
    // Add event handlers only in client-side code

        const isStandalone = () =>
            (window.navigator as any).standalone === true ||
            window.matchMedia('(display-mode: standalone)').matches;

        const _isPWA = isStandalone();

        // Prevent double-tap zoom by catching quick consecutive taps
        let lastTapTime = 0;
        const handleTouchStart = (event: TouchEvent) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;

            // If double-tap detected (< 300ms between taps) and event is cancelable
            if (tapLength < 300 && tapLength > 0 && event.cancelable) {
                // Only prevent default on specific elements that need it
                const target = event.target as HTMLElement;
                if (target && (target.matches('button, a, [role="button"], .prevent-zoom') || target.closest('.prevent-zoom'))) {
                    event.preventDefault();
                }
            }

            lastTapTime = currentTime;
        };

        // Determine if we should use passive listeners
        const _shouldBePassive = (element: Element) => {
            // Only use non-passive for elements that need to prevent default
            return !element.matches('button, a, input, [role="button"], .interactive');
        };

        // Apply touch handlers to document for global prevention
        document.addEventListener('DOMContentLoaded', () => {
            // Apply document-level handler with passive false to allow preventDefault
            // Note: passive: true would ignore preventDefault calls, causing inconsistent behavior between browsers
            document.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });

            // Only add non-passive listeners to elements that specifically need zoom prevention
            const zoomPreventElements = document.querySelectorAll('.prevent-zoom, [data-prevent-zoom]');
            zoomPreventElements.forEach((el) => {
                // Use non-passive only for elements that explicitly need zoom prevention
                el.addEventListener('touchstart', handleTouchStart, { passive: false });
            });

            // Set up mutation observer to handle dynamically added elements
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node as HTMLElement;
                                if (element.matches('.prevent-zoom, [data-prevent-zoom]')) {
                                    element.addEventListener('touchstart', handleTouchStart, { passive: false });
                                }

                                // Check for matching elements inside the added node
                                const childElements = element.querySelectorAll('.prevent-zoom, [data-prevent-zoom]');
                                childElements.forEach((el) => {
                                    el.addEventListener('touchstart', handleTouchStart, { passive: false });
                                });
                            }
                        });
                    }
                });
            });

            // Start observing the document with the configured parameters
            observer.observe(document.body, { childList: true, subtree: true });

            // Log for debugging
        });

        // Clean up on app unmount
        nuxtApp.hook('app:unmounted' as any, () => {
            document.removeEventListener('touchstart', handleTouchStart);

            const zoomPreventElements = document.querySelectorAll('.prevent-zoom, [data-prevent-zoom]');
            zoomPreventElements.forEach((el) => {
                el.removeEventListener('touchstart', handleTouchStart);
            });
        });
    }
});
