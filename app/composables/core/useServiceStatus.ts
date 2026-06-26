// composables/core/useServiceStatus.ts
import { useNuxtApp } from '#app';

const MAX_RETRY_INTERVAL = 30000; // 30 seconds

export function useServiceStatus() {
    // MEMORY LEAK FIX: Use useState for SSR-safe singleton pattern
    // This ensures state is properly scoped per SSR request context
    const isServiceDown = useState<boolean>('service-down', () => false);
    const lastCheckTime = useState<number | null>('service-last-check', () => null);
    const retryAfter = useState<number | null>('service-retry-after', () => null);
    const consecutiveFailures = useState<number>('service-failures', () => 0);
    // Safe translator accessor that works both on server and client.
    const getTranslator = () => {
        try {
            const app = useNuxtApp();
            const t = app?.$t || app?.$i18n?.t?.bind(app.$i18n);
            if (typeof t === 'function') return t as (k: string, p?: Record<string, unknown>) => string;
        } catch {
            // ignore
        }
        // Fallback translator
        return (key: string, params?: Record<string, unknown>) => {
            if (key === 'service_unavailable.retry') {
                const seconds = params?.seconds ?? '';
                return `Service temporarily unavailable. Retrying in ${seconds}s`;
            }
            if (key === 'service_unavailable.message') {
                return 'Service temporarily unavailable. Please try again shortly.';
            }
            return key;
        };
    };
    /**
   * Register a service failure (like a 503 error)
   * @param options Optional response object with headers and statusCode
   */
    const registerServiceFailure = (options: { headers?: unknown, statusCode?: number, status?: number } = {}) => {
        isServiceDown.value = true;
        lastCheckTime.value = Date.now();
        consecutiveFailures.value++;

        // Check for various input formats
        const response = options.headers ? options : null;
        const statusCode = options.statusCode || (response?.status ? response.status : null);

        // Always use 30 seconds for retry
        retryAfter.value = 30000; // Always use exactly 30 seconds

        console.warn(`Backend service unavailable. Status: ${statusCode}. Retry after: ${retryAfter.value}ms`);
    };

    /**
   * Register a successful service response
   */
    const registerServiceSuccess = () => {
        if (isServiceDown.value) {
            console.info('Backend service is now available');
        }
        isServiceDown.value = false;
        lastCheckTime.value = Date.now();
        consecutiveFailures.value = 0;
        retryAfter.value = null;
    };

    /**
   * Check if we should attempt a retry
   */
    const shouldRetry = () => {
        if (!isServiceDown.value) return true;
        if (!lastCheckTime.value || !retryAfter.value) return true;

        return Date.now() - lastCheckTime.value > retryAfter.value;
    };

    /**
   * Get message for service unavailable notification
   */
    const getServiceDownMessage = () => {
        const $t = getTranslator();
        if (retryAfter.value && retryAfter.value > 0) {
            const seconds = Math.ceil(retryAfter.value / 1000);
            return $t('service_unavailable.retry', { seconds });
        }
        return $t('service_unavailable.message');
    };

    return {
        isServiceDown: readonly(isServiceDown),
        retryAfter: readonly(retryAfter),
        registerServiceFailure,
        registerServiceSuccess,
        shouldRetry,
        getServiceDownMessage
    };
}
