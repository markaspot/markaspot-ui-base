import type { Report } from '~~/types';
import { useJurisdictions } from '~/composables/core/useJurisdictions';

/**
 * Share Composable
 *
 * Provides native sharing and social share URL builders for service requests.
 * SSR-safe: navigator.share detection deferred to onMounted.
 */
export function useShare() {
    const { buildPath } = useJurisdictions();
    const canNativeShare = ref(false);

    /**
     * Detect native share API availability (client-side only).
     * Call this inside onMounted to stay SSR-safe.
     */
    const detectNativeShare = () => {
        if (import.meta.client) {
            canNativeShare.value = typeof navigator !== 'undefined' && !!navigator.share;
        }
    };

    /**
     * Build the canonical URL for a report.
     */
    const buildReportUrl = (report: Report): string => {
        const path = buildPath(`/requests/${report.service_request_id}`);
        if (import.meta.client) {
            return `${window.location.origin}${path}`;
        }
        // SSR fallback: return relative path
        return path;
    };

    /**
     * Truncate text to a maximum length, appending ellipsis if needed.
     */
    const truncateText = (text: string, maxLength: number): string => {
        if (!text || text.length <= maxLength) return text || '';
        return `${text.slice(0, maxLength).trimEnd()}...`;
    };

    /**
     * Build share data from a report.
     */
    const buildShareData = (report: Report) => {
        const title = report.service_name || '';
        const text = truncateText(report.description || '', 120);
        const url = buildReportUrl(report);
        return { title, text, url };
    };

    /**
     * Trigger the native Web Share API.
     * Returns true on success, false on cancellation or error.
     */
    const shareNative = async (report: Report): Promise<boolean> => {
        if (!canNativeShare.value) return false;
        const { title, text, url } = buildShareData(report);
        try {
            await navigator.share({ title, text, url });
            return true;
        } catch {
            // User cancelled or share failed
            return false;
        }
    };

    /**
     * Social share URL builders.
     * All return full URLs suitable for opening in a new tab.
     */
    const shareWhatsApp = (report: Report): string => {
        const { title, text, url } = buildShareData(report);
        const message = `${title}: ${text} ${url}`;
        return `https://wa.me/?text=${encodeURIComponent(message)}`;
    };

    const shareX = (report: Report): string => {
        const { title, url } = buildShareData(report);
        return `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    };

    const shareFacebook = (report: Report): string => {
        const { url } = buildShareData(report);
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    };

    const shareEmail = (report: Report): string => {
        const { title, text, url } = buildShareData(report);
        const body = `${text}\n\n${url}`;
        return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    };

    return {
        canNativeShare: readonly(canNativeShare),
        detectNativeShare,
        buildReportUrl,
        buildShareData,
        shareNative,
        shareWhatsApp,
        shareX,
        shareFacebook,
        shareEmail
    };
}
