import { createError } from 'h3';
import type { SafeErrorData } from '../types/proxy';

/**
 * Create an error that strips stack traces in production.
 */
export const createSafeError = (errorData: SafeErrorData) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        return createError(errorData);
    }

    const sanitizedError = createError({
        statusCode: errorData.statusCode,
        message: errorData.message,
        data: errorData.data
    });

    // Remove stack trace in production to prevent information leakage
    delete (sanitizedError as { stack?: string }).stack;

    return sanitizedError;
};

/**
 * Recursively strip sensitive keys (stack, stacktrace) from a value.
 * Used to sanitize error responses before sending to the client.
 */
export const stripSensitive = (val: unknown): unknown => {
    if (!val) return val;
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map(stripSensitive);
    if (typeof val === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
            if (k.toLowerCase() === 'stack' || k.toLowerCase() === 'stacktrace') continue;
            out[k] = stripSensitive(v);
        }
        return out;
    }
    return val;
};

/**
 * Redact API keys from a string.
 */
export const redactApiKeys = (str: string): string =>
    str.replace(/(api_key=)([^&\s"]+)/g, '$1[REDACTED]');

/**
 * Redact api_key from a URL string. Safer than regex for well-formed URLs.
 */
export const redactApiKeyFromUrl = (url: string): string => {
    try {
        const u = new URL(url);
        if (u.searchParams.has('api_key')) {
            u.searchParams.set('api_key', '[REDACTED]');
        }
        return u.toString();
    } catch {
        return redactApiKeys(url);
    }
};

/**
 * Sanitize error data: strip sensitive keys and redact API keys.
 */
export const sanitizeErrorData = (data: unknown): unknown => {
    if (!data) return data;

    if (typeof data === 'string') {
        return redactApiKeys(data);
    }

    if (typeof data === 'object') {
        const json = JSON.stringify(data);
        const redacted = redactApiKeys(json);
        return stripSensitive(JSON.parse(redacted));
    }

    return data;
};
