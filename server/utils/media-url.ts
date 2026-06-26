import type { GeoReportItem, GeoReportWrappedResponse } from '../types/proxy';
import { logRequest } from '../api/utils/logger';

const IMAGE_PROXY_PATH = '/api/images';

/**
 * Drupal file path regex: captures `sites/default/files/...` or `system/files/...`
 * Strips path prefixes like /management/ - only captures the core file path.
 */
const DRUPAL_FILE_PATH_RE = /(?:^|.*\/)((?:sites\/(?:[^/]+\/)?files|system\/files)\/.*)/;

/**
 * Rewrite a single media URL to use the image proxy.
 */
export const processMediaUrl = (originalUrl: string): string => {
    if (!originalUrl || originalUrl.trim() === '') return originalUrl;

    try {
    // Already using our image proxy
        if (originalUrl.startsWith(IMAGE_PROXY_PATH)) {
            return originalUrl;
        }

        // 1. Full URLs with domain
        if (/^https?:\/\//.test(originalUrl)) {
            try {
                const parsedUrl = new URL(originalUrl);
                const match = parsedUrl.pathname.match(DRUPAL_FILE_PATH_RE);
                if (match?.[1]) {
                    return `${IMAGE_PROXY_PATH}/${match[1]}`;
                }
                return `${IMAGE_PROXY_PATH}/${encodeURIComponent(originalUrl)}`;
            } catch {
                return `${IMAGE_PROXY_PATH}/${encodeURIComponent(originalUrl)}`;
            }
        }

        // 2. Path starting with '/'
        if (originalUrl.startsWith('/')) {
            const match = originalUrl.match(DRUPAL_FILE_PATH_RE);
            if (match?.[1]) {
                return `${IMAGE_PROXY_PATH}/${match[1]}`;
            }
            return `${IMAGE_PROXY_PATH}${originalUrl}`;
        }

        // 3. Relative path containing Drupal files directories
        if (
            originalUrl.includes('sites/default/files') ||
            originalUrl.includes('sites/files') ||
            originalUrl.includes('system/files')
        ) {
            const path = originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`;
            return `${IMAGE_PROXY_PATH}${path}`;
        }

        // 4. Already using the API proxy
        if (originalUrl.startsWith('/api/') && !originalUrl.startsWith('/api/images/')) {
            const apiPath = originalUrl.substring(4); // Remove '/api'
            const match = apiPath.match(DRUPAL_FILE_PATH_RE);
            if (match?.[1]) {
                return `${IMAGE_PROXY_PATH}/${match[1]}`;
            }
            return `${IMAGE_PROXY_PATH}/${apiPath}`;
        }

        // Fallback
        const path = originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`;
        return `${IMAGE_PROXY_PATH}${path}`;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logRequest('Error processing individual media URL', {
            error: errorMessage,
            url: originalUrl.substring(0, 50)
        });
        return originalUrl;
    }
};

/**
 * Rewrite `media_url` (single or comma-separated) on a GeoReport item.
 */
const transformItemMediaUrl = (item: GeoReportItem): GeoReportItem => {
    if (item && item.media_url && typeof item.media_url === 'string') {
        const original = item.media_url;

        if (original.includes(',')) {
            const urls = original.split(',').map(url => url.trim());
            item.media_url = urls.map(url => processMediaUrl(url)).join(',');
        } else {
            item.media_url = processMediaUrl(original);
        }

        logRequest('Transformed media_url', {
            original: original.substring(0, 50),
            transformed: item.media_url.substring(0, 50)
        });
    }
    return item;
};

/**
 * Transform media URLs in a GeoReport API response.
 * Handles wrapped (`{requests: [...]}`) and plain array/object formats.
 */
export const transformGeoReportMediaUrls = (response: unknown): unknown => {
    if (!response || typeof response !== 'object') {
        logRequest('Skipping media_url transformation', {
            reason: 'response is not an object',
            responseType: typeof response
        });
        return response;
    }

    try {
        const res = response as GeoReportWrappedResponse;

        // Wrapped format: {requests: [...], meta: {...}}
        if (res.requests && Array.isArray(res.requests)) {
            logRequest('Processing wrapped GeoReport response', {
                count: res.requests.length,
                sampleMediaUrl: res.requests[0]?.media_url?.substring(0, 80)
            });
            res.requests = res.requests.map(transformItemMediaUrl);
            logRequest('Wrapped response transformation complete', {
                sampleMediaUrl: res.requests[0]?.media_url?.substring(0, 80)
            });
            return res;
        }

        // Plain array of reports
        if (Array.isArray(response)) {
            logRequest('Processing array of GeoReport items', { count: response.length });
            return (response as GeoReportItem[]).map(transformItemMediaUrl);
        }

        // Single report
        const single = response as GeoReportItem;
        if (single.media_url && typeof single.media_url === 'string') {
            logRequest('Processing single GeoReport item', { id: single.service_request_id });
            return transformItemMediaUrl(single);
        }

        return response;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack?.substring(0, 200) : undefined;
        logRequest('Error transforming media_url', {
            error: errorMessage,
            stack: errorStack
        });
        return response;
    }
};
