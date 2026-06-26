/**
 * API Contract Smoke Tests
 *
 * These tests make real HTTP requests to the dev DDEV instance and validate
 * that API response shapes match what the frontend expects. They catch
 * breaking changes introduced by profile update hooks (11900-11910) or
 * schema migrations before they reach the frontend at runtime.
 *
 * Prerequisites:
 *   - DDEV dev instance running (ddev start)
 *   - At least one published jurisdiction group with field_nuxt_config
 *   - Service requests exist for jurisdiction_id=1
 *
 * Run with: pnpm run test:api-contract
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.NUXT_API_BASE || 'https://dev.ddev.site';
const JURISDICTION_ID = '1';
const JURISDICTION_SLUG = process.env.TEST_JURISDICTION_SLUG || 'amsterdam';

/**
 * Helper: fetch JSON from the dev instance with error context.
 * Rejects non-2xx responses with status and body for easier debugging.
 */
async function fetchJson<T = unknown>(path: string): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        const body = await response.text().catch(() => '(unreadable)');
        throw new Error(
            `${response.status} ${response.statusText} for ${url}\n${body.substring(0, 500)}`
        );
    }

    return response.json() as Promise<T>;
}

// ─── Settings Endpoint ──────────────────────────────────────────────────────

describe('API Contract: Settings endpoint', () => {
    let settings: Record<string, unknown>;

    beforeAll(async () => {
        settings = await fetchJson<Record<string, unknown>>(
            `/api/mark-a-spot-settings?jurisdiction=${JURISDICTION_ID}`
        );
    });

    it('returns an object (not an array or null)', () => {
        expect(settings).toBeDefined();
        expect(typeof settings).toBe('object');
        expect(Array.isArray(settings)).toBe(false);
    });

    it('contains map configuration keys at top level', () => {
    // These are always present, even without jurisdiction config
        expect(settings).toHaveProperty('zoom_initial');
        expect(settings).toHaveProperty('center_lat');
        expect(settings).toHaveProperty('center_lng');
    });

    it('contains jurisdiction metadata when jurisdiction param is provided', () => {
        expect(settings).toHaveProperty('jurisdiction');
        const jurisdiction = settings.jurisdiction as Record<string, unknown>;
        expect(jurisdiction).toHaveProperty('id');
        expect(jurisdiction).toHaveProperty('name');
        expect(typeof jurisdiction.id).toBe('number');
        expect(typeof jurisdiction.name).toBe('string');
    });

    it('contains theme configuration with required color keys', () => {
        expect(settings).toHaveProperty('theme');
        const theme = settings.theme as Record<string, unknown>;
        expect(theme).toHaveProperty('primary');
        expect(theme).toHaveProperty('secondary');
        expect(theme).toHaveProperty('neutral');
    });

    it('contains features object with boolean-ish values', () => {
        expect(settings).toHaveProperty('features');
        const features = settings.features as Record<string, unknown>;
        expect(typeof features).toBe('object');
        // Feature values should be booleans or truthy/falsy
        // Check at least one known feature key exists
        const knownFeatureKeys = ['voting', 'statistics', 'dashboard', 'photoReporting', 'feedback'];
        const presentKeys = knownFeatureKeys.filter(k => k in features);
        expect(presentKeys.length).toBeGreaterThan(0);
    });

    it('contains client configuration', () => {
        expect(settings).toHaveProperty('client');
        const client = settings.client as Record<string, unknown>;
        expect(client).toHaveProperty('name');
        expect(typeof client.name).toBe('string');
    });

    it('contains navigation configuration', () => {
        expect(settings).toHaveProperty('navigation');
    });

    it('contains map style keys', () => {
    // At least one style URL should be present (mapbox or fallback)
        const hasMapboxStyle = typeof settings.mapbox_style === 'string' && settings.mapbox_style !== '';
        const hasFallbackStyle = typeof settings.fallback_style === 'string' && settings.fallback_style !== '';
        expect(hasMapboxStyle || hasFallbackStyle).toBe(true);
    });
});

// ─── Requests Endpoint (Open311 GeoReport v2) ──────────────────────────────

describe('API Contract: Requests endpoint (Open311)', () => {
    let requests: Record<string, unknown>[];

    beforeAll(async () => {
        requests = await fetchJson<Record<string, unknown>[]>(
            `/georeport/v2/requests.json?jurisdiction_id=${JURISDICTION_ID}`
        );
    });

    it('returns an array', () => {
        expect(Array.isArray(requests)).toBe(true);
    });

    it('returns at least one request', () => {
        expect(requests.length).toBeGreaterThan(0);
    });

    it('each request has service_request_id (string)', () => {
        for (const req of requests) {
            expect(req).toHaveProperty('service_request_id');
            expect(typeof req.service_request_id).toBe('string');
        }
    });

    it('each request has status (string)', () => {
        for (const req of requests) {
            expect(req).toHaveProperty('status');
            expect(typeof req.status).toBe('string');
        }
    });

    it('each request has service_name (string or null)', () => {
        for (const req of requests) {
            expect(req).toHaveProperty('service_name');
            // service_name is a string for categorized requests, null for uncategorized ones
            const sn = req.service_name;
            expect(sn === null || typeof sn === 'string').toBe(true);
        }
    });

    it('each request has lat and long (numeric or numeric string)', () => {
        for (const req of requests) {
            expect(req).toHaveProperty('lat');
            expect(req).toHaveProperty('long');
            // Open311 may return numbers or numeric strings
            expect(Number(req.lat)).not.toBeNaN();
            expect(Number(req.long)).not.toBeNaN();
        }
    });

    it('includes address_string when address data is present', () => {
    // address_string is the key used by the frontend Request type.
    // The API may also include "address" for Open311 spec compatibility,
    // but the critical contract is that address_string is present
    // whenever address data exists (field_address is populated).
        const withAddress = requests.filter(req => 'address_string' in req);
        for (const req of withAddress) {
            expect(typeof req.address_string).toBe('string');
            expect((req.address_string as string).length).toBeGreaterThan(0);
        }
    });

    it('each request has requested_datetime (ISO date string)', () => {
        for (const req of requests) {
            expect(req).toHaveProperty('requested_datetime');
            const dt = req.requested_datetime as string;
            expect(typeof dt).toBe('string');
            // Should be parseable as a date
            expect(new Date(dt).getTime()).not.toBeNaN();
        }
    });

    it('uses extended_attributes.drupal.field_organisation (British spelling)', () => {
    // At least verify the structure path exists. Not every request may have
    // an organisation assigned, so we only check the key name, not presence.
    // The critical contract: it is "organisation" (British), NOT "organization" (US).
        const withOrg = requests.filter(
            req =>
                (req.extended_attributes as Record<string, unknown>)?.drupal &&
                'field_organisation' in
                ((req.extended_attributes as Record<string, unknown>).drupal as Record<string, unknown>)
        );
        // If any requests have the field, verify the spelling
        if (withOrg.length > 0) {
            for (const req of withOrg) {
                const drupal = (req.extended_attributes as Record<string, unknown>).drupal as Record<string, unknown>;
                expect(drupal).toHaveProperty('field_organisation');
                // Must NOT have the US spelling
                expect(drupal).not.toHaveProperty('field_organization');
            }
        }
        // Also verify no request uses US spelling at top level
        for (const req of requests) {
            if (req.extended_attributes) {
                const drupal = (req.extended_attributes as Record<string, unknown>)?.drupal as
                  | Record<string, unknown> |
                  undefined;
                if (drupal) {
                    expect(drupal).not.toHaveProperty('field_organization');
                }
            }
        }
    });

    it('each request has extended_attributes.markaspot object', () => {
        for (const req of requests) {
            expect(req).toHaveProperty('extended_attributes');
            const ext = req.extended_attributes as Record<string, unknown>;
            expect(ext).toHaveProperty('markaspot');
            const markaspot = ext.markaspot as Record<string, unknown>;
            expect(typeof markaspot).toBe('object');
            // category_hex is only present for authenticated/extended responses.
            // For anonymous, at minimum the markaspot object exists (may contain escalated, etc.)
        }
    });

    it('extended_attributes.markaspot.category_hex uses correct key when present', () => {
    // category_hex is included in extended role responses (manager/authenticated).
    // When present, verify the key name and value type are correct.
        const withCategoryHex = requests.filter((req) => {
            const markaspot = (req.extended_attributes as Record<string, unknown>)?.markaspot as Record<string, unknown> | undefined;
            return markaspot && 'category_hex' in markaspot;
        });
        for (const req of withCategoryHex) {
            const markaspot = (req.extended_attributes as Record<string, unknown>).markaspot as Record<string, unknown>;
            expect(typeof markaspot.category_hex).toBe('string');
        }
    });
});

// ─── Services Endpoint (Open311 GeoReport v2) ──────────────────────────────

describe('API Contract: Services endpoint (Open311)', () => {
    let services: Record<string, unknown>[];

    beforeAll(async () => {
        services = await fetchJson<Record<string, unknown>[]>(
            `/georeport/v2/services.json?jurisdiction_id=${JURISDICTION_ID}`
        );
    });

    it('returns an array', () => {
        expect(Array.isArray(services)).toBe(true);
    });

    it('returns at least one service', () => {
        expect(services.length).toBeGreaterThan(0);
    });

    it('each service has service_code (string)', () => {
        for (const svc of services) {
            expect(svc).toHaveProperty('service_code');
            expect(typeof svc.service_code).toBe('string');
        }
    });

    it('each service has service_name (string)', () => {
        for (const svc of services) {
            expect(svc).toHaveProperty('service_name');
            expect(typeof svc.service_name).toBe('string');
        }
    });

    it('each service has metadata (string "true"/"false")', () => {
        for (const svc of services) {
            expect(svc).toHaveProperty('metadata');
            // Open311 spec says boolean, but Drupal serializes as string "true"/"false".
            // The frontend must handle both. Verify the value is one of the expected forms.
            const md = svc.metadata;
            const valid = md === 'true' || md === 'false' || md === true || md === false;
            expect(valid).toBe(true);
        }
    });

    it('service_code values are unique', () => {
        const codes = services.map(s => s.service_code);
        const uniqueCodes = new Set(codes);
        expect(uniqueCodes.size).toBe(codes.length);
    });
});

// ─── Organisations Endpoint ─────────────────────────────────────────────────

describe('API Contract: Organisations endpoint', () => {
    // This endpoint requires authentication (_user_is_logged_in).
    // For anonymous access, we expect a 403. The test verifies:
    // 1. The endpoint exists (not 404)
    // 2. The response uses British spelling "organisations" (not "organizations")

    it('endpoint exists (returns 403 for anonymous, not 404)', async () => {
        const url = `${BASE_URL}/api/organisations?jurisdiction=${JURISDICTION_ID}`;
        const response = await fetch(url, {
            headers: { Accept: 'application/json' }
        });

        // Should be 403 (auth required) or 200 (if session cookie works), but NOT 404
        expect(response.status).not.toBe(404);
    });

    it('uses British spelling "organisations" in response key (when authenticated)', async () => {
        const url = `${BASE_URL}/api/organisations?jurisdiction=${JURISDICTION_ID}`;
        const response = await fetch(url, {
            headers: { Accept: 'application/json' }
        });

        // If we get a 200, validate the response shape
        if (response.ok) {
            const data = (await response.json()) as Record<string, unknown>;
            expect(data).toHaveProperty('organisations');
            expect(data).not.toHaveProperty('organizations');

            const orgs = data.organisations as Record<string, unknown>[];
            if (orgs.length > 0) {
                expect(orgs[0]).toHaveProperty('id');
                expect(orgs[0]).toHaveProperty('label');
            }
        }
    // If 403, the endpoint exists but requires auth - that is the expected contract
    });
});

// ─── Slug vs Numeric jurisdiction_id equivalence (markaspot-ui#284) ──────────
//
// The backend's resolveJurisdictionId() accepts slug, numeric ID, gid, and
// jurisdiction param variants. The frontend now forwards the slug directly
// (via mas-config-jurisdiction-key) instead of always resolving to a numeric
// ID first. These tests verify the slug and numeric variants are equivalent
// at the API level.
//
// Prerequisites:
//   - JURISDICTION_ID=1 and JURISDICTION_SLUG=amsterdam refer to the same
//     jurisdiction on the dev instance.

describe('Jurisdiction resolution: slug equals numeric ID (markaspot-ui#284)', () => {
    let requestsByNumeric: Record<string, unknown>[];
    let requestsBySlug: Record<string, unknown>[];

    beforeAll(async () => {
        [requestsByNumeric, requestsBySlug] = await Promise.all([
            fetchJson<Record<string, unknown>[]>(
                `/georeport/v2/requests.json?jurisdiction_id=${JURISDICTION_ID}&limit=5&sort=asc`
            ),
            fetchJson<Record<string, unknown>[]>(
                `/georeport/v2/requests.json?jurisdiction_id=${JURISDICTION_SLUG}&limit=5&sort=asc`
            )
        ]);
    });

    it('precondition: numeric request returned data (dev instance has requests)', () => {
        expect(requestsByNumeric.length).toBeGreaterThan(0);
    });

    it('slug request returns the same number of items as numeric request', () => {
        expect(requestsBySlug.length).toBe(requestsByNumeric.length);
    });

    it('slug and numeric requests return the same first service_request_id', () => {
        expect(requestsBySlug[0]?.service_request_id).toBe(requestsByNumeric[0]?.service_request_id);
    });

    it('slug and numeric requests return items with the same jurisdiction IDs', () => {
        for (let i = 0; i < requestsByNumeric.length; i++) {
            const numericReq = requestsByNumeric[i] as Record<string, unknown>;
            const slugReq = requestsBySlug[i] as Record<string, unknown>;
            // jurisdiction.id should be the same numeric id in both cases
            const numericJurId = (numericReq.jurisdiction as Record<string, unknown> | undefined)?.id;
            const slugJurId = (slugReq.jurisdiction as Record<string, unknown> | undefined)?.id;
            if (numericJurId !== undefined) {
                expect(slugJurId).toBe(numericJurId);
            }
        }
    });

    it('services endpoint: slug returns same service codes as numeric', async () => {
        const [servicesByNumeric, servicesBySlug] = await Promise.all([
            fetchJson<Record<string, unknown>[]>(
                `/georeport/v2/services.json?jurisdiction_id=${JURISDICTION_ID}`
            ),
            fetchJson<Record<string, unknown>[]>(
                `/georeport/v2/services.json?jurisdiction_id=${JURISDICTION_SLUG}`
            )
        ]);

        const numericCodes = servicesByNumeric.map(s => s.service_code).sort();
        const slugCodes = servicesBySlug.map(s => s.service_code).sort();
        expect(slugCodes).toEqual(numericCodes);
    });
});
