import { createError, defineEventHandler, getRequestURL } from 'h3';

const hasTraversal = (value: string): boolean => {
    const candidates = [value];
    try {
        const decoded = decodeURIComponent(value);
        if (decoded !== value) {
            candidates.push(decoded);
        }
    } catch {
    // ignore decode errors
    }

    return candidates.some(candidate =>
        candidate.split('/').some(segment => segment === '..')
    );
};

export default defineEventHandler((event) => {
    const rawUrl = event.node.req.url || '';
    const pathname = getRequestURL(event).pathname;

    const candidates = [rawUrl, pathname];
    try {
        const decodedRaw = decodeURIComponent(rawUrl);
        if (decodedRaw !== rawUrl) {
            candidates.push(decodedRaw);
        }
    } catch {
    // ignore decode errors
    }

    const hasBadSegments = candidates.some(value => hasTraversal(value));

    if (hasBadSegments) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid path'
        });
    }
});
