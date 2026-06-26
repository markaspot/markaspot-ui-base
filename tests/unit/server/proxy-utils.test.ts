/**
 * Tests for server-side proxy utility functions.
 *
 * Covers:
 *   - isSuspiciousPath (path traversal detection)
 *   - error-handling helpers (stripSensitive, redactApiKeys, etc.)
 *   - processMediaUrl / transformGeoReportMediaUrls (media URL rewriting)
 *   - hasValidDrupalSession (session cookie detection)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// 1. isSuspiciousPath
// ---------------------------------------------------------------------------
import { isSuspiciousPath } from '~/server/utils/path';

// ---------------------------------------------------------------------------
// 2. error-handling helpers
// ---------------------------------------------------------------------------
import {
    stripSensitive,
    redactApiKeys,
    redactApiKeyFromUrl,
    sanitizeErrorData
} from '~/server/utils/error-handling';

import { processMediaUrl, transformGeoReportMediaUrls } from '~/server/utils/media-url';

import { parseCookies } from 'h3';
import { hasValidDrupalSession, isMinimalExtendedAttributes } from '~/server/utils/session';

describe('isSuspiciousPath', () => {
    it('detects raw ".." traversal', () => {
        expect(isSuspiciousPath('../etc/passwd')).toBe(true);
        expect(isSuspiciousPath('foo/../../bar')).toBe(true);
    });

    it('detects URL-encoded ".." traversal', () => {
        expect(isSuspiciousPath('foo/%2e%2e/bar')).toBe(true);
        expect(isSuspiciousPath('%2e%2e%2fetc%2fpasswd')).toBe(true);
    });

    it('rejects absolute http(s) URLs', () => {
        expect(isSuspiciousPath('http://evil.com/path')).toBe(true);
        expect(isSuspiciousPath('https://evil.com')).toBe(true);
    });

    it('rejects protocol-relative URLs', () => {
        expect(isSuspiciousPath('//evil.com/path')).toBe(true);
    });

    it('allows normal paths', () => {
        expect(isSuspiciousPath('georeport/v2/requests')).toBe(false);
        expect(isSuspiciousPath('jsonapi/node/service_request')).toBe(false);
        expect(isSuspiciousPath('sites/default/files/image.jpg')).toBe(false);
    });

    it('allows paths with dots that are not traversal', () => {
        expect(isSuspiciousPath('georeport/v2/requests/123.json')).toBe(false);
        expect(isSuspiciousPath('api/auth/status.json')).toBe(false);
    });

    it('handles malformed URL-encoded input gracefully', () => {
    // %ZZ is not valid percent-encoding - decodeURIComponent will throw
        expect(isSuspiciousPath('foo/%ZZ/bar')).toBe(false);
    });
});

describe('stripSensitive', () => {
    it('removes "stack" keys from objects', () => {
        const input = { message: 'fail', stack: 'at line 1', code: 42 };
        expect(stripSensitive(input)).toEqual({ message: 'fail', code: 42 });
    });

    it('removes "stacktrace" case-insensitively', () => {
        const input = { msg: 'x', StackTrace: 'secret' };
        expect(stripSensitive(input)).toEqual({ msg: 'x' });
    });

    it('recurses into nested objects', () => {
        const input = { outer: { inner: 'ok', stack: 'hidden' } };
        const result = stripSensitive(input) as Record<string, unknown>;
        expect(result.outer).toEqual({ inner: 'ok' });
    });

    it('recurses into arrays', () => {
        const input = [{ stack: 'a', msg: 'b' }, { stack: 'c', msg: 'd' }];
        expect(stripSensitive(input)).toEqual([{ msg: 'b' }, { msg: 'd' }]);
    });

    it('passes through strings unchanged', () => {
        expect(stripSensitive('hello')).toBe('hello');
    });

    it('passes through falsy values', () => {
        expect(stripSensitive(null)).toBe(null);
        expect(stripSensitive(undefined)).toBe(undefined);
        expect(stripSensitive(0)).toBe(0);
    });
});

describe('redactApiKeys', () => {
    it('redacts api_key= values in strings', () => {
        expect(redactApiKeys('url?api_key=SECRET123&foo=bar'))
            .toBe('url?api_key=[REDACTED]&foo=bar');
    });

    it('redacts multiple api_key occurrences', () => {
        const input = 'api_key=AAA and api_key=BBB';
        expect(redactApiKeys(input)).toBe('api_key=[REDACTED] and api_key=[REDACTED]');
    });

    it('leaves strings without api_key untouched', () => {
        expect(redactApiKeys('normal string')).toBe('normal string');
    });
});

describe('redactApiKeyFromUrl', () => {
    it('redacts api_key param in well-formed URLs', () => {
        const url = 'https://example.com/api?api_key=SECRET&format=json';
        const result = redactApiKeyFromUrl(url);
        expect(result).toContain('api_key=%5BREDACTED%5D');
        expect(result).not.toContain('SECRET');
    });

    it('falls back to regex redaction for malformed URLs', () => {
        const bad = 'not-a-url api_key=SECRET';
        expect(redactApiKeyFromUrl(bad)).toBe('not-a-url api_key=[REDACTED]');
    });

    it('returns URL unchanged when no api_key present', () => {
        const url = 'https://example.com/api?foo=bar';
        expect(redactApiKeyFromUrl(url)).toBe(url);
    });
});

describe('sanitizeErrorData', () => {
    it('redacts api_key in string data', () => {
        expect(sanitizeErrorData('error api_key=SECRET here'))
            .toBe('error api_key=[REDACTED] here');
    });

    it('strips stack and redacts api_key in objects', () => {
        const input = {
            message: 'fail api_key=X',
            stack: 'trace',
            code: 500
        };
        const result = sanitizeErrorData(input) as Record<string, unknown>;
        expect(result).not.toHaveProperty('stack');
        expect(result.message).toBe('fail api_key=[REDACTED]');
        expect(result.code).toBe(500);
    });

    it('passes through falsy data', () => {
        expect(sanitizeErrorData(null)).toBe(null);
        expect(sanitizeErrorData(undefined)).toBe(undefined);
    });

    it('passes through numbers', () => {
        expect(sanitizeErrorData(42)).toBe(42);
    });
});

// ---------------------------------------------------------------------------
// 3. processMediaUrl / transformGeoReportMediaUrls
// ---------------------------------------------------------------------------

// Mock the logger to suppress output
vi.mock('~/server/api/utils/logger', () => ({
    logRequest: vi.fn(),
    logGeocoding: vi.fn()
}));

describe('processMediaUrl', () => {
    it('rewrites full Drupal file URL to image proxy', () => {
        const url = 'https://example.com/sites/default/files/2024-01/photo.jpg';
        expect(processMediaUrl(url)).toBe('/api/images/sites/default/files/2024-01/photo.jpg');
    });

    it('rewrites absolute path with Drupal file directory', () => {
        expect(processMediaUrl('/sites/default/files/image.png'))
            .toBe('/api/images/sites/default/files/image.png');
    });

    it('rewrites system/files paths', () => {
        expect(processMediaUrl('/system/files/doc.pdf'))
            .toBe('/api/images/system/files/doc.pdf');
    });

    it('skips URLs already using image proxy', () => {
        const url = '/api/images/sites/default/files/photo.jpg';
        expect(processMediaUrl(url)).toBe(url);
    });

    it('handles relative path with Drupal files directory', () => {
        expect(processMediaUrl('sites/default/files/photo.jpg'))
            .toBe('/api/images/sites/default/files/photo.jpg');
    });

    it('returns empty/blank strings unchanged', () => {
        expect(processMediaUrl('')).toBe('');
        expect(processMediaUrl('   ')).toBe('   ');
    });

    it('encodes full external URLs without Drupal file path as fallback', () => {
        const url = 'https://cdn.example.com/random-image.jpg';
        const result = processMediaUrl(url);
        expect(result).toContain('/api/images/');
        expect(result).toContain(encodeURIComponent(url));
    });

    it('strips path prefixes before Drupal file path in full URLs', () => {
        const url = 'https://example.com/management/sites/default/files/photo.jpg';
        expect(processMediaUrl(url)).toBe('/api/images/sites/default/files/photo.jpg');
    });

    it('rewrites multisite file URLs (sites/{sitename}/files)', () => {
        const url = 'https://management.demo.mark-a-spot.com/sites/demo/files/photo.jpg';
        expect(processMediaUrl(url)).toBe('/api/images/sites/demo/files/photo.jpg');
    });

    it('rewrites multisite file URLs for other tenants', () => {
        const url = 'https://management.bleckede.markaspot.de/sites/bleckede/files/eps_nest.jpg';
        expect(processMediaUrl(url)).toBe('/api/images/sites/bleckede/files/eps_nest.jpg');
    });

    it('rewrites relative multisite file paths', () => {
        expect(processMediaUrl('/sites/demo/files/image.png'))
            .toBe('/api/images/sites/demo/files/image.png');
    });
});

describe('transformGeoReportMediaUrls', () => {
    it('transforms wrapped response format {requests: [...]}', () => {
        const response = {
            requests: [
                { service_request_id: '1', media_url: 'https://example.com/sites/default/files/a.jpg' },
                { service_request_id: '2', media_url: '' }
            ],
            meta: { count: 2 }
        };
        const result = transformGeoReportMediaUrls(response) as typeof response;
        expect(result.requests[0].media_url).toBe('/api/images/sites/default/files/a.jpg');
        expect(result.requests[1].media_url).toBe('');
        expect(result.meta).toEqual({ count: 2 });
    });

    it('transforms plain array format', () => {
        const response = [
            { service_request_id: '1', media_url: '/sites/default/files/b.jpg' }
        ];
        const result = transformGeoReportMediaUrls(response) as typeof response;
        expect(result[0].media_url).toBe('/api/images/sites/default/files/b.jpg');
    });

    it('transforms single item format', () => {
        const response = {
            service_request_id: '1',
            media_url: '/sites/default/files/c.jpg'
        };
        const result = transformGeoReportMediaUrls(response) as typeof response;
        expect(result.media_url).toBe('/api/images/sites/default/files/c.jpg');
    });

    it('handles comma-separated media URLs', () => {
        const response = {
            service_request_id: '1',
            media_url: '/sites/default/files/a.jpg, /sites/default/files/b.jpg'
        };
        const result = transformGeoReportMediaUrls(response) as typeof response;
        expect(result.media_url).toContain('/api/images/sites/default/files/a.jpg');
        expect(result.media_url).toContain('/api/images/sites/default/files/b.jpg');
    });

    it('passes through non-object responses unchanged', () => {
        expect(transformGeoReportMediaUrls(null)).toBe(null);
        expect(transformGeoReportMediaUrls('string')).toBe('string');
        expect(transformGeoReportMediaUrls(42)).toBe(42);
    });

    it('passes through objects without media_url', () => {
        const response = { service_request_id: '1', status: 'open' };
        expect(transformGeoReportMediaUrls(response)).toEqual(response);
    });
});

// ---------------------------------------------------------------------------
// 4. hasValidDrupalSession
// ---------------------------------------------------------------------------

// We need to mock h3's parseCookies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3');
    return {
        ...actual,
        parseCookies: vi.fn()
    };
});

const mockParseCookies = parseCookies as ReturnType<typeof vi.fn>;

describe('hasValidDrupalSession', () => {
    const fakeEvent = {} as any;

    beforeEach(() => {
        mockParseCookies.mockReset();
    });

    it('returns true for SESS cookie with 32 hex chars', () => {
        mockParseCookies.mockReturnValue({
            SESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        expect(hasValidDrupalSession(fakeEvent)).toBe(true);
    });

    it('returns true for SSESS (HTTPS) cookie with 32 hex chars', () => {
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'session-value'
        });
        expect(hasValidDrupalSession(fakeEvent)).toBe(true);
    });

    it('returns false when no session cookie present', () => {
        mockParseCookies.mockReturnValue({
            other_cookie: 'value'
        });
        expect(hasValidDrupalSession(fakeEvent)).toBe(false);
    });

    it('returns false for SESS cookie with wrong length', () => {
        mockParseCookies.mockReturnValue({
            SESSabc123: 'value' // too short
        });
        expect(hasValidDrupalSession(fakeEvent)).toBe(false);
    });

    it('returns false for cookie with non-hex chars after SESS', () => {
        mockParseCookies.mockReturnValue({
            SESSzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz: 'value' // z is not hex
        });
        expect(hasValidDrupalSession(fakeEvent)).toBe(false);
    });

    it('returns false for empty cookies', () => {
        mockParseCookies.mockReturnValue({});
        expect(hasValidDrupalSession(fakeEvent)).toBe(false);
    });

    // Stale-cookie scenarios: cookie name is valid but value signals deletion.
    it('returns false for SESS cookie with empty value (stale after logout)', () => {
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: ''
        });
        expect(hasValidDrupalSession(fakeEvent)).toBe(false);
    });

    it('returns false for SESS cookie with value "deleted" (stale after logout)', () => {
        mockParseCookies.mockReturnValue({
            SSESSabcdef0123456789abcdef0123456789: 'deleted'
        });
        expect(hasValidDrupalSession(fakeEvent)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 5. isMinimalExtendedAttributes
// ---------------------------------------------------------------------------

describe('isMinimalExtendedAttributes', () => {
    it('returns true when extended_attributes is absent', () => {
        const response = [{ service_request_id: '1', status: 'open' }];
        expect(isMinimalExtendedAttributes(response)).toBe(true);
    });

    it('returns true when extended_attributes is null', () => {
        const response = [{ service_request_id: '1', extended_attributes: null }];
        expect(isMinimalExtendedAttributes(response)).toBe(true);
    });

    it('returns true when extended_attributes is an empty object', () => {
        const response = [{ service_request_id: '1', extended_attributes: {} }];
        expect(isMinimalExtendedAttributes(response)).toBe(true);
    });

    it('returns true when extended_attributes is only { escalated: false }', () => {
        const response = [{ service_request_id: '1', extended_attributes: { escalated: false } }];
        expect(isMinimalExtendedAttributes(response)).toBe(true);
    });

    it('returns false when extended_attributes has additional keys', () => {
        const response = [{
            service_request_id: '1',
            extended_attributes: { escalated: false, status_color: '#ff0000' }
        }];
        expect(isMinimalExtendedAttributes(response)).toBe(false);
    });

    it('returns false when extended_attributes has escalated: true', () => {
        const response = [{ service_request_id: '1', extended_attributes: { escalated: true } }];
        expect(isMinimalExtendedAttributes(response)).toBe(false);
    });

    it('handles wrapped { requests: [...] } response format', () => {
        const response = {
            requests: [{ service_request_id: '1', extended_attributes: { escalated: false } }],
            meta: { count: 1 }
        };
        expect(isMinimalExtendedAttributes(response)).toBe(true);
    });

    it('returns false for wrapped format with enriched extended_attributes', () => {
        const response = {
            requests: [{
                service_request_id: '1',
                extended_attributes: { escalated: false, category_icon: 'pot-hole' }
            }]
        };
        expect(isMinimalExtendedAttributes(response)).toBe(false);
    });

    it('returns false for single-item response with enriched extended_attributes', () => {
        const response = {
            service_request_id: '42',
            extended_attributes: { escalated: false, service_code: 'road-damage' }
        };
        expect(isMinimalExtendedAttributes(response)).toBe(false);
    });

    it('handles empty array gracefully', () => {
        expect(isMinimalExtendedAttributes([])).toBe(false);
    });

    it('handles non-object inputs gracefully', () => {
        expect(isMinimalExtendedAttributes(null)).toBe(false);
        expect(isMinimalExtendedAttributes('string')).toBe(false);
        expect(isMinimalExtendedAttributes(42)).toBe(false);
    });
});
