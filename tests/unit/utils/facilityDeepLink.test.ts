import { describe, it, expect } from 'vitest';
import { buildFacilityDeepLink } from '~/utils/facilityDeepLink';

describe('buildFacilityDeepLink', () => {
    it('composes a multi-tenant URL with slug pointing at /report', () => {
        const url = buildFacilityDeepLink({
            origin: 'https://app.example.org',
            slug: 'amsterdam',
            facilityId: 'kita-001'
        });
        expect(url).toBe('https://app.example.org/amsterdam/report?facility=kita-001');
    });

    it('falls back to /report on the root for single-tenant deployments', () => {
        const url = buildFacilityDeepLink({
            origin: 'https://citizen.example.org',
            facilityId: 'town-hall'
        });
        expect(url).toBe('https://citizen.example.org/report?facility=town-hall');
    });

    it('treats null and empty slugs as single-tenant', () => {
        const a = buildFacilityDeepLink({ origin: 'https://x.test', slug: null, facilityId: 'a' });
        const b = buildFacilityDeepLink({ origin: 'https://x.test', slug: '', facilityId: 'a' });
        expect(a).toBe(b);
        expect(a).toBe('https://x.test/report?facility=a');
    });

    it('strips trailing slashes from origin and trims slug', () => {
        const url = buildFacilityDeepLink({
            origin: 'https://app.example.org/',
            slug: '  /amsterdam/  ',
            facilityId: 'kita-001'
        });
        expect(url).toBe('https://app.example.org/amsterdam/report?facility=kita-001');
    });

    it('encodes facility ids with reserved characters', () => {
        const url = buildFacilityDeepLink({
            origin: 'https://x.test',
            slug: 'rotterdam',
            facilityId: 'kita & spielplatz'
        });
        expect(url).toBe('https://x.test/rotterdam/report?facility=kita%20%26%20spielplatz');
    });

    it('returns empty string when facilityId is missing', () => {
        expect(buildFacilityDeepLink({ origin: 'https://x.test', facilityId: '' })).toBe('');
        expect(buildFacilityDeepLink({ origin: 'https://x.test', facilityId: '   ' })).toBe('');
    });

    it('returns empty string when origin is missing', () => {
        expect(buildFacilityDeepLink({ origin: '', facilityId: 'a' })).toBe('');
    });

    it('encodes path-traversal segments in slug (defence in depth)', () => {
        // Defence-in-depth: an attacker who pre-loads `?jurisdiction=../../evil`
        // cannot get a verbatim `..` segment into the clipboard / QR payload.
        const url = buildFacilityDeepLink({
            origin: 'https://x.test',
            slug: '../../evil',
            facilityId: 'a'
        });
        expect(url).toBe('https://x.test/..%2F..%2Fevil/report?facility=a');
        expect(url).not.toContain('/../');
    });
});
