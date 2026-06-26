import { createHash } from 'crypto';
import type { H3Event } from 'h3';

/**
 * In-memory rate limiter for the CSV export endpoint.
 *
 * Caps concurrent and short-window exports per user so that a privileged
 * moderator cannot trigger N parallel 50k-row exports and saturate the
 * Drupal PHP worker pool.
 *
 * Key strategy: session cookie hash for authenticated users, client IP
 * for anonymous. Session hashing avoids logging raw cookie values.
 */

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 3;

interface Bucket {
    timestamps: number[]
}

const buckets = new Map<string, Bucket>();

interface ExportRateLimitOptions {
    key?: string
    strategy?: 'auto' | 'ip'
}

function getIpKey(event: H3Event): string {
    // Trust X-Forwarded-For only if the upstream reverse proxy (DDEV/nginx
    // in dev, the Hetzner ingress in prod) sets it authoritatively and strips
    // client-supplied values. If this Nuxt server were ever exposed directly
    // to the internet, the client could rotate the header to defeat the
    // anonymous rate limit; on a properly fronted deployment that is not the
    // case.
    const forwardedFor = (event.node.req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
    const ip = forwardedFor || event.node.req.socket?.remoteAddress || 'unknown';
    return 'ip:' + ip;
}

function getKey(event: H3Event, options: ExportRateLimitOptions = {}): string {
    if (options.key) return options.key;
    if (options.strategy === 'ip') return getIpKey(event);

    const cookie = event.node.req.headers.cookie;
    if (cookie) {
        // Hash the cookie header so we don't keep raw session tokens in
        // memory. sha256 is overkill but cheap and avoids drift.
        return 'sess:' + createHash('sha256').update(cookie).digest('hex').slice(0, 16);
    }
    return getIpKey(event);
}

export interface RateLimitResult {
    allowed: boolean
    retryAfterSeconds: number
    remaining: number
}

/**
 * Check and record a single export attempt. Returns `allowed: false` when
 * the caller has exceeded `limit` attempts within the rolling window.
 */
export function checkExportRateLimit(
    event: H3Event,
    limit = DEFAULT_LIMIT,
    options: ExportRateLimitOptions = {}
): RateLimitResult {
    const key = getKey(event, options);
    const now = Date.now();
    const bucket = buckets.get(key) ?? { timestamps: [] };

    // Drop timestamps outside the window
    bucket.timestamps = bucket.timestamps.filter(t => now - t < WINDOW_MS);

    if (bucket.timestamps.length >= limit) {
        const oldest = bucket.timestamps[0];
        const retryAfter = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
        return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter), remaining: 0 };
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);

    // Opportunistic cleanup of stale buckets to keep memory bounded.
    if (buckets.size > 1000 && Math.random() < 0.05) {
        for (const [k, b] of buckets) {
            b.timestamps = b.timestamps.filter(t => now - t < WINDOW_MS);
            if (b.timestamps.length === 0) buckets.delete(k);
        }
    }

    return { allowed: true, retryAfterSeconds: 0, remaining: limit - bucket.timestamps.length };
}
