import { createError, getRequestIP } from 'h3';
import { checkRateLimit } from './utils/rate-limiter';

const SERVICE_REQUEST_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * POST /api/flags
 *
 * Receives flag/report submissions from citizens.
 * Validates input, rate-limits, and proxies to Drupal backend
 * for persistence in the moderation queue.
 */
export default defineEventHandler(async (event) => {
    // Rate limit: 3 flags per 5 minutes per IP.
    // Do NOT trust X-Forwarded-For on public endpoints unless a trusted
    // reverse proxy (Cloudflare, Nginx) rewrites it at the edge.
    const ip = getRequestIP(event, { xForwardedFor: false }) ?? 'unknown';
    checkRateLimit(event, ip, 'flags', 'POST');

    const body = await readBody(event);

    // Validate service_request_id format
    if (
        !body?.service_request_id
        || typeof body.service_request_id !== 'string'
        || !SERVICE_REQUEST_ID_RE.test(body.service_request_id)
    ) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing or invalid service_request_id',
        });
    }

    const validReasons = ['spam', 'offensive', 'personal', 'location', 'other'];
    if (!body.reason || !validReasons.includes(body.reason)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing or invalid reason',
        });
    }

    // "other" requires details
    if (body.reason === 'other' && (!body.details || typeof body.details !== 'string' || !body.details.trim())) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Details required when reason is "other"',
        });
    }

    // Validate details length
    if (typeof body.details === 'string' && body.details.length > 500) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Details must not exceed 500 characters',
        });
    }

    const details = typeof body.details === 'string' ? body.details.trim() || undefined : undefined;

    // Proxy to Drupal backend for persistence and moderation queue.
    // Normalize errors to avoid exposing Drupal internals to citizens.
    const config = useRuntimeConfig();
    try {
        const drupalResponse = await $fetch(`${config.public.apiBase}/api/moderation/flags`, {
            method: 'POST',
            body: {
                service_request_id: body.service_request_id,
                reason: body.reason,
                details,
            },
        });
        return drupalResponse;
    } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
        if (status === 404) {
            throw createError({ statusCode: 404, statusMessage: 'Report not found.' });
        }
        if (status === 409 || status === 422) {
            throw createError({ statusCode: 409, statusMessage: 'Already flagged.' });
        }
        throw createError({ statusCode: 500, statusMessage: 'Flag submission failed.' });
    }
});
