/**
 * Rate Limiter Tests
 *
 * Tests endpoint type detection, rate limit identifier construction,
 * sliding window rate tracking, and cleanup logic.
 *
 * @see server/api/utils/rate-limiter.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    getEndpointType,
    getRateLimitIdentifier,
    isAlwaysRateLimitedPath,
    checkRateLimit,
    rateLimits,
    rateTracker
} from '~/server/api/utils/rate-limiter';

const { runtimeConfigState } = vi.hoisted(() => ({
    runtimeConfigState: {
        allowGeoreportPost: false
    }
}));

// ============================================================================
// Mock h3 and #imports before importing the module
// ============================================================================

vi.mock('h3', () => ({
    createError: (opts: { statusCode: number, message: string, data?: any }) => {
        const err = new Error(opts.message) as any;
        err.statusCode = opts.statusCode;
        err.data = opts.data;
        return err;
    }
}));

vi.mock('#imports', () => ({
    useRuntimeConfig: () => ({
        public: {
            clientConfig: {
                features: {
                    allowGeoreportPost: runtimeConfigState.allowGeoreportPost
                }
            }
        }
    })
}));

// ============================================================================
// Helpers
// ============================================================================

function createMockEvent(path: string | string[], method = 'POST', headers: Record<string, string> = {}): any {
    return {
        context: { params: { path } },
        method,
        node: {
            req: {
                headers: {
                    'x-forwarded-for': '192.168.1.1',
                    ...headers
                }
            }
        }
    };
}

function clearRateTracker() {
    for (const key of Object.keys(rateTracker)) {
        Reflect.deleteProperty(rateTracker, key);
    }
}

// ============================================================================
// Tests
// ============================================================================

describe('getEndpointType', () => {
    it('detects jsonapi/service_requests', () => {
        expect(getEndpointType('jsonapi/service_requests')).toBe('service_requests');
        expect(getEndpointType('jsonapi/service_requests/123')).toBe('service_requests');
    });

    it('detects jsonapi/node/service_request (JSON:API)', () => {
        expect(getEndpointType('jsonapi/node/service_request')).toBe('service_requests');
        expect(getEndpointType('jsonapi/node/service_request/uuid-123')).toBe('service_requests');
    });

    it('detects jsonapi/service-request (hyphenated)', () => {
        expect(getEndpointType('jsonapi/service-request')).toBe('service_requests');
    });

    it('detects file endpoints', () => {
        expect(getEndpointType('jsonapi/file/file')).toBe('files');
    });

    it('detects media endpoints', () => {
        expect(getEndpointType('jsonapi/media/request_image')).toBe('media');
        expect(getEndpointType('jsonapi/media/request_image/field_media_image')).toBe('media');
    });

    it('detects georeport endpoints', () => {
        expect(getEndpointType('georeport/v2/requests.json')).toBe('georeport');
        expect(getEndpointType('georeport/v2/services.json')).toBe('georeport');
    });

    it('routes georeport submit POSTs to the tighter georeport_submit bucket', () => {
        expect(getEndpointType('georeport/v2/requests.json', 'POST')).toBe('georeport_submit');
        // GETs and reads stay on the generic georeport bucket.
        expect(getEndpointType('georeport/v2/requests.json', 'GET')).toBe('georeport');
        expect(getEndpointType('georeport/v2/services.json', 'POST')).toBe('georeport');
        // Without a method (legacy callers), default to the generic bucket.
        expect(getEndpointType('georeport/v2/requests.json')).toBe('georeport');
    });

    it('only treats the exact requests collection POST as a submit (anchored path)', () => {
        // Bare collection and explicit extensions are submits.
        expect(getEndpointType('georeport/v2/requests', 'POST')).toBe('georeport_submit');
        expect(getEndpointType('georeport/v2/requests.json', 'POST')).toBe('georeport_submit');
        expect(getEndpointType('georeport/v2/requests.xml', 'POST')).toBe('georeport_submit');
        // A sub-resource POST (update) is NOT a submit; it stays generic and
        // must not drain the tight submit budget.
        expect(getEndpointType('georeport/v2/requests/abc123', 'POST')).toBe('georeport');
        expect(getEndpointType('georeport/v2/requests/abc123.json', 'POST')).toBe('georeport');
        // Near-miss path that merely starts with "requests" is not a submit.
        expect(getEndpointType('georeport/v2/requestsXYZ', 'POST')).toBe('georeport');
    });

    it('matches the submit path case-insensitively (within the georeport prefix)', () => {
        // The leading `georeport/` prefix is matched lower-case (that is the
        // shape the proxy forwards); the anchored regex itself is /i, so the
        // collection segment and extension may be upper-case.
        expect(getEndpointType('georeport/V2/REQUESTS.JSON', 'POST')).toBe('georeport_submit');
        expect(getEndpointType('georeport/v2/Requests.Xml', 'POST')).toBe('georeport_submit');
    });

    it('detects feedback endpoints', () => {
        expect(getEndpointType('feedback/submit')).toBe('feedback');
        expect(getEndpointType('api/feedback')).toBe('feedback');
        expect(getEndpointType('api/feedback/submit')).toBe('feedback');
    });

    it('detects geocoding endpoints', () => {
        expect(getEndpointType('geocoding/search')).toBe('geocoding');
        expect(getEndpointType('geocoding/reverse')).toBe('geocoding');
    });

    it('detects competition endpoint', () => {
        expect(getEndpointType('api/competition')).toBe('competition');
    });

    it('detects Vision analysis endpoint across api prefixes', () => {
        expect(getEndpointType('vision/analyze', 'POST')).toBe('vision');
        expect(getEndpointType('api/vision/analyze', 'POST')).toBe('vision');
        expect(getEndpointType('api/api/vision/analyze', 'POST')).toBe('vision');
    });

    it('returns null for unknown paths', () => {
        expect(getEndpointType('api/unknown')).toBeNull();
        expect(getEndpointType('some/random/path')).toBeNull();
    });

    it('handles array path input', () => {
        expect(getEndpointType(['georeport', 'v2', 'requests.json'])).toBe('georeport');
        expect(getEndpointType(['jsonapi', 'node', 'service_request'])).toBe('service_requests');
    });
});

describe('getRateLimitIdentifier', () => {
    it('returns IP-only for georeport endpoints', () => {
        const event = createMockEvent('georeport/v2/requests.json', 'GET', {
            'x-csrf-token': 'abc123def456'
        });
        const id = getRateLimitIdentifier(event, '10.0.0.1');
        expect(id).toBe('10.0.0.1');
        expect(id).not.toContain('abc');
    });

    it('returns IP-only for JSON:API service request creates', () => {
        const event = createMockEvent('jsonapi/node/service_request', 'POST', {
            'x-csrf-token': 'abc123def456'
        });
        const id = getRateLimitIdentifier(event, '10.0.0.1');
        expect(id).toBe('10.0.0.1');
    });

    it('returns IP-only for JSON:API service request creates with array route params', () => {
        const event = createMockEvent(['jsonapi', 'node', 'service_request'], 'POST', {
            'x-csrf-token': 'abc123def456'
        });
        const id = getRateLimitIdentifier(event, '10.0.0.1');
        expect(id).toBe('10.0.0.1');
    });

    it('returns IP-only for media uploads with CSRF token', () => {
        const event = createMockEvent('jsonapi/media/request_image', 'POST', {
            'x-csrf-token': 'abc123def456'
        });
        const id = getRateLimitIdentifier(event, '10.0.0.1');
        expect(id).toBe('10.0.0.1');
    });

    it('returns IP-only for non-public-submit endpoints with CSRF token', () => {
        const event = createMockEvent('feedback/submit', 'POST', {
            'x-csrf-token': 'abcdefghijklmnop'
        });
        const id = getRateLimitIdentifier(event, '10.0.0.1');
        expect(id).toBe('10.0.0.1');
    });

    it('returns IP-only when no CSRF token present', () => {
        const event = createMockEvent('jsonapi/node/service_request', 'POST');
        const id = getRateLimitIdentifier(event, '10.0.0.1');
        expect(id).toBe('10.0.0.1');
    });
});

describe('getRateLimitIdentifier trusted-proxy resolution', () => {
    const ORIGINAL_TRUSTED_PROXY = process.env.NUXT_TRUSTED_PROXY_IP;

    function createProxyEvent(remoteAddress: string, forwardedFor?: string): any {
        return {
            context: { params: { path: 'georeport/v2/requests.json' } },
            method: 'POST',
            node: {
                req: {
                    headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
                    socket: { remoteAddress }
                }
            }
        };
    }

    afterEach(() => {
        if (ORIGINAL_TRUSTED_PROXY === undefined) {
            delete process.env.NUXT_TRUSTED_PROXY_IP;
        } else {
            process.env.NUXT_TRUSTED_PROXY_IP = ORIGINAL_TRUSTED_PROXY;
        }
    });

    it('ignores X-Forwarded-For when NUXT_TRUSTED_PROXY_IP is unset', () => {
        delete process.env.NUXT_TRUSTED_PROXY_IP;
        const event = createProxyEvent('172.20.0.5', '203.0.113.7');
        expect(getRateLimitIdentifier(event, '172.20.0.5')).toBe('172.20.0.5');
    });

    it('trusts leftmost X-Forwarded-For when peer matches the trusted proxy IP', () => {
        process.env.NUXT_TRUSTED_PROXY_IP = '172.20.0.5';
        const event = createProxyEvent('172.20.0.5', '203.0.113.7, 172.20.0.5');
        expect(getRateLimitIdentifier(event, '172.20.0.5')).toBe('203.0.113.7');
    });

    it('trusts X-Forwarded-For when peer falls inside the trusted CIDR', () => {
        process.env.NUXT_TRUSTED_PROXY_IP = '172.20.0.0/24';
        const event = createProxyEvent('172.20.0.42', '198.51.100.9');
        expect(getRateLimitIdentifier(event, '172.20.0.42')).toBe('198.51.100.9');
    });

    it('falls back to socket IP when peer is outside the trusted CIDR (spoof attempt)', () => {
        process.env.NUXT_TRUSTED_PROXY_IP = '172.20.0.0/24';
        const event = createProxyEvent('10.9.9.9', '203.0.113.7');
        expect(getRateLimitIdentifier(event, '10.9.9.9')).toBe('10.9.9.9');
    });

    it('matches IPv4-mapped IPv6 peer against IPv4 trusted proxy', () => {
        process.env.NUXT_TRUSTED_PROXY_IP = '172.20.0.5';
        const event = createProxyEvent('::ffff:172.20.0.5', '203.0.113.7');
        expect(getRateLimitIdentifier(event, '::ffff:172.20.0.5')).toBe('203.0.113.7');
    });

    it('falls back to socket IP when trusted peer sends empty X-Forwarded-For', () => {
        process.env.NUXT_TRUSTED_PROXY_IP = '172.20.0.5';
        const event = createProxyEvent('172.20.0.5');
        expect(getRateLimitIdentifier(event, '172.20.0.5')).toBe('172.20.0.5');
    });
});

describe('isAlwaysRateLimitedPath', () => {
    it('matches GeoReport write endpoints only', () => {
        expect(isAlwaysRateLimitedPath('georeport/v2/requests', 'GET')).toBe(false);
        expect(isAlwaysRateLimitedPath(['georeport', 'v2', 'requests'], 'POST')).toBe(true);
    });

    it('matches JSON:API public writes only for POST', () => {
        expect(isAlwaysRateLimitedPath('jsonapi/node/service_request', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath(['jsonapi', 'node', 'service_request'], 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('jsonapi/media/request_image', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('jsonapi/file/file', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('jsonapi/node/service_request', 'PATCH')).toBe(false);
        expect(isAlwaysRateLimitedPath('jsonapi/media/request_image', 'PATCH')).toBe(false);
    });

    it('matches public custom endpoint writes', () => {
        expect(isAlwaysRateLimitedPath('feedback', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('api/feedback/submit', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('competition', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('api/competition', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('group-members/claim/invite-token', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('mark-a-spot-settings', 'PATCH')).toBe(true);
        expect(isAlwaysRateLimitedPath('mark-a-spot-settings', 'GET')).toBe(false);
    });

    it('matches Vision analysis POSTs across api prefixes', () => {
        expect(isAlwaysRateLimitedPath('vision/analyze', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('api/vision/analyze', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('api/api/vision/analyze', 'POST')).toBe(true);
        expect(isAlwaysRateLimitedPath('vision/analyze', 'GET')).toBe(false);
    });
});

describe('checkRateLimit', () => {
    beforeEach(() => {
        clearRateTracker();
        runtimeConfigState.allowGeoreportPost = false;
    });

    it('rejects georeport POST when allowGeoreportPost is disabled', () => {
        const event = createMockEvent('georeport/v2/requests', 'POST');
        expect(() => checkRateLimit(event, '10.0.0.1', 'georeport', 'POST'))
            .toThrow('Write requests are not allowed for georeport endpoints');
    });

    it('does not treat georeport PATCH as a POST-gated rate-limiter path', () => {
        const event = createMockEvent('georeport/v2/requests', 'PATCH');
        expect(() => checkRateLimit(event, '10.0.0.1', 'georeport', 'PATCH')).not.toThrow();
    });

    it('does not treat georeport HEAD as a write when allowGeoreportPost is disabled', () => {
        const event = createMockEvent('georeport/v2/requests', 'HEAD');
        expect(() => checkRateLimit(event, '10.0.0.1', 'georeport', 'HEAD')).not.toThrow();
    });

    it('does not require query api_key for georeport POST when allowGeoreportPost is enabled', () => {
        runtimeConfigState.allowGeoreportPost = true;
        const event = createMockEvent('georeport/v2/requests', 'POST');
        expect(() => checkRateLimit(event, '10.0.0.1', 'georeport', 'POST')).not.toThrow();
    });

    it('allows requests under the limit', () => {
        const event = createMockEvent('jsonapi/node/service_request', 'POST');
        // Should not throw for first request
        expect(() => checkRateLimit(event, '10.0.0.1', 'service_requests', 'POST')).not.toThrow();
    });

    it('throws 429 when limit exceeded', () => {
        const event = createMockEvent('jsonapi/node/service_request', 'POST');
        const limit = rateLimits.service_requests.max;

        // Fill up to the limit
        for (let i = 0; i < limit; i++) {
            checkRateLimit(event, '10.0.0.1', 'service_requests', 'POST');
        }

        // Next request should throw
        expect(() => checkRateLimit(event, '10.0.0.1', 'service_requests', 'POST'))
            .toThrow('Too many requests');
    });

    it('does not allow rotated CSRF tokens to bypass JSON:API service request create limits', () => {
        const limit = rateLimits.service_requests.max;

        for (let i = 0; i < limit; i++) {
            const event = createMockEvent('jsonapi/node/service_request', 'POST', {
                'x-csrf-token': `rotated-token-${i}`
            });
            checkRateLimit(event, '10.0.0.1', 'service_requests', 'POST');
        }

        const blockedEvent = createMockEvent('jsonapi/node/service_request', 'POST', {
            'x-csrf-token': 'rotated-token-final'
        });
        expect(() => checkRateLimit(blockedEvent, '10.0.0.1', 'service_requests', 'POST'))
            .toThrow('Too many requests');
    });

    it('does not allow rotated CSRF tokens to bypass media upload limits', () => {
        const limit = rateLimits.media.max;

        for (let i = 0; i < limit; i++) {
            const event = createMockEvent('jsonapi/media/request_image', 'POST', {
                'x-csrf-token': `rotated-token-${i}`
            });
            checkRateLimit(event, '10.0.0.1', 'media', 'POST');
        }

        const blockedEvent = createMockEvent('jsonapi/media/request_image', 'POST', {
            'x-csrf-token': 'rotated-token-final'
        });
        expect(() => checkRateLimit(blockedEvent, '10.0.0.1', 'media', 'POST'))
            .toThrow('Too many requests');
    });

    it('skips GET requests for non-geocoding/georeport endpoints', () => {
        const event = createMockEvent('jsonapi/node/service_request', 'GET');
        // GET on service_requests should not be rate limited
        for (let i = 0; i < 100; i++) {
            expect(() => checkRateLimit(event, '10.0.0.1', 'service_requests', 'GET')).not.toThrow();
        }
    });

    it('rate limits GET requests for geocoding', () => {
        const event = createMockEvent('geocoding/search', 'GET');
        const limit = rateLimits.geocoding.max;

        for (let i = 0; i < limit; i++) {
            checkRateLimit(event, '10.0.0.1', 'geocoding', 'GET');
        }

        expect(() => checkRateLimit(event, '10.0.0.1', 'geocoding', 'GET'))
            .toThrow('Too many requests');
    });

    it('rate limits GET requests for georeport', () => {
        runtimeConfigState.allowGeoreportPost = true;
        const event = createMockEvent('georeport/v2/requests.json', 'GET');
        const limit = rateLimits.georeport.max;

        for (let i = 0; i < limit; i++) {
            checkRateLimit(event, '10.0.0.1', 'georeport', 'GET');
        }

        expect(() => checkRateLimit(event, '10.0.0.1', 'georeport', 'GET'))
            .toThrow('Too many requests');
    });

    it('rate limits georeport submit POSTs after 3 within the window', () => {
        runtimeConfigState.allowGeoreportPost = true;
        const event = createMockEvent('georeport/v2/requests.json', 'POST');
        const limit = rateLimits.georeport_submit.max;
        expect(limit).toBe(3);

        for (let i = 0; i < limit; i++) {
            expect(() => checkRateLimit(event, '10.0.0.1', 'georeport_submit', 'POST')).not.toThrow();
        }

        expect(() => checkRateLimit(event, '10.0.0.1', 'georeport_submit', 'POST'))
            .toThrow('Too many requests');
    });

    it('still enforces the 405 allowGeoreportPost gate on the georeport_submit bucket', () => {
        runtimeConfigState.allowGeoreportPost = false;
        const event = createMockEvent('georeport/v2/requests.json', 'POST');
        expect(() => checkRateLimit(event, '10.0.0.1', 'georeport_submit', 'POST'))
            .toThrow('Write requests are not allowed for georeport endpoints');
    });

    it('keeps georeport GET reads on the generous 60/min bucket independent of submits', () => {
        runtimeConfigState.allowGeoreportPost = true;
        const getEvent = createMockEvent('georeport/v2/requests.json', 'GET');
        const postEvent = createMockEvent('georeport/v2/requests.json', 'POST');

        // Exhaust the tight submit bucket.
        for (let i = 0; i < rateLimits.georeport_submit.max; i++) {
            checkRateLimit(postEvent, '10.0.0.1', 'georeport_submit', 'POST');
        }
        expect(() => checkRateLimit(postEvent, '10.0.0.1', 'georeport_submit', 'POST'))
            .toThrow('Too many requests');

        // GET reads remain unaffected up to the generous georeport limit.
        for (let i = 0; i < rateLimits.georeport.max; i++) {
            expect(() => checkRateLimit(getEvent, '10.0.0.1', 'georeport', 'GET')).not.toThrow();
        }
    });

    it('does nothing for unknown endpoint types', () => {
        const event = createMockEvent('unknown/path', 'POST');
        expect(() => checkRateLimit(event, '10.0.0.1', null, 'POST')).not.toThrow();
    });

    it('isolates rate limits per IP', () => {
        const event = createMockEvent('jsonapi/node/service_request', 'POST');
        const limit = rateLimits.service_requests.max;

        // IP 1 fills up
        for (let i = 0; i < limit; i++) {
            checkRateLimit(event, '10.0.0.1', 'service_requests', 'POST');
        }

        // IP 2 should still be allowed
        expect(() => checkRateLimit(event, '10.0.0.2', 'service_requests', 'POST')).not.toThrow();
    });

    it('isolates rate limits per endpoint type', () => {
        const event = createMockEvent('jsonapi/node/service_request', 'POST');
        const limit = rateLimits.service_requests.max;

        // Fill service_requests limit
        for (let i = 0; i < limit; i++) {
            checkRateLimit(event, '10.0.0.1', 'service_requests', 'POST');
        }

        // Media endpoint should still be allowed
        expect(() => checkRateLimit(event, '10.0.0.1', 'media', 'POST')).not.toThrow();
    });

    it('includes reset time in error', () => {
        const event = createMockEvent('jsonapi/node/service_request', 'POST');
        const limit = rateLimits.service_requests.max;

        for (let i = 0; i < limit; i++) {
            checkRateLimit(event, '10.0.0.1', 'service_requests', 'POST');
        }

        try {
            checkRateLimit(event, '10.0.0.1', 'service_requests', 'POST');
            expect.unreachable('Should have thrown');
        } catch (err: any) {
            expect(err.statusCode).toBe(429);
            expect(err.message).toContain('seconds');
            expect(err.data.resetTimeMs).toBeGreaterThan(0);
        }
    });
});

describe('rateLimits configuration', () => {
    it('has expected endpoint types', () => {
        expect(rateLimits).toHaveProperty('service_requests');
        expect(rateLimits).toHaveProperty('files');
        expect(rateLimits).toHaveProperty('media');
        expect(rateLimits).toHaveProperty('feedback');
        expect(rateLimits).toHaveProperty('geocoding');
        expect(rateLimits).toHaveProperty('georeport');
        expect(rateLimits).toHaveProperty('georeport_submit');
        expect(rateLimits).toHaveProperty('competition');
        expect(rateLimits).toHaveProperty('vision');
    });

    it('georeport_submit is far tighter than the georeport read bucket', () => {
        expect(rateLimits.georeport_submit.max).toBe(3);
        expect(rateLimits.georeport_submit.windowMs).toBe(60000);
        expect(rateLimits.georeport_submit.max).toBeLessThan(rateLimits.georeport.max);
    });

    it('all limits have max and windowMs', () => {
        for (const [type, config] of Object.entries(rateLimits)) {
            expect(config.max, `${type}.max`).toBeGreaterThan(0);
            expect(config.windowMs, `${type}.windowMs`).toBeGreaterThan(0);
        }
    });

    it('feedback and competition have the most restrictive limits', () => {
        expect(rateLimits.feedback.max).toBeLessThanOrEqual(rateLimits.service_requests.max);
        expect(rateLimits.competition.max).toBeLessThanOrEqual(rateLimits.service_requests.max);
        expect(rateLimits.vision.max).toBeLessThanOrEqual(rateLimits.service_requests.max);
    });
});
