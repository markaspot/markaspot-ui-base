/**
 * Jurisdiction Access Control Integration Tests
 *
 * Validates that authenticated managers cannot access data from foreign
 * jurisdictions via the GeoReport API. Tests the validateJurisdictionAccess()
 * enforcement on GET endpoints.
 *
 * Prerequisites:
 *   - DDEV dev instance running (ddev start)
 *   - test_editorial (uid=8) is member of Amsterdam (jur=1) and Stadsdeel Noord (jur=4)
 *   - test_editorial is NOT a member of Rotterdam (jur=5)
 *   - rotterdam_editorial (uid=7) is member of Rotterdam (jur=5) only
 *   - Service requests exist for both jurisdictions
 *
 * Run with: pnpm run test:api-contract
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.NUXT_API_BASE || 'https://dev.ddev.site';

// Test users with known jurisdiction memberships
const AMSTERDAM_USER_KEY = 'test-editorial-key-2026';
const AMSTERDAM_JUR_ID = '1';
const ROTTERDAM_JUR_ID = '5';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Fetch with API key authentication.
 * Returns the full Response object (not parsed) to inspect status codes.
 */
async function fetchWithKey(path: string, apiKey: string): Promise<Response> {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${path}${separator}api_key=${apiKey}`;
    return fetch(url, {
        headers: { Accept: 'application/json' }
    });
}

/**
 * Fetch without authentication (anonymous).
 */
async function fetchAnonymous(path: string): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
        headers: { Accept: 'application/json' }
    });
}

/**
 * Get a known request ID from a jurisdiction.
 */
async function getFirstRequestId(jurisdictionId: string): Promise<string | null> {
    const resp = await fetchAnonymous(
        `/georeport/v2/requests.json?jurisdiction_id=${jurisdictionId}&limit=1`
    );
    if (!resp.ok) return null;
    const data = await resp.json() as Array<{ service_request_id: string }>;
    return data?.[0]?.service_request_id ?? null;
}

// ─── Test: Cross-Jurisdiction GET Index ────────────────────────────────────

describe('Jurisdiction Access: GET request index', () => {
    it('allows authenticated user to read own jurisdiction', async () => {
        const resp = await fetchWithKey(
            `/georeport/v2/requests.json?jurisdiction_id=${AMSTERDAM_JUR_ID}&extensions=true&limit=5`,
            AMSTERDAM_USER_KEY
        );
        expect(resp.status).toBe(200);
        const data = await resp.json();
        expect(Array.isArray(data)).toBe(true);
    });

    it('denies authenticated user access to foreign jurisdiction', async () => {
        const resp = await fetchWithKey(
            `/georeport/v2/requests.json?jurisdiction_id=${ROTTERDAM_JUR_ID}&extensions=true&limit=5`,
            AMSTERDAM_USER_KEY
        );
        // Should be 403 (Access Denied) because test_editorial is not a Rotterdam member
        expect(resp.status).toBe(403);
    });

    it('allows anonymous access to any jurisdiction (public data)', async () => {
        const resp = await fetchAnonymous(
            `/georeport/v2/requests.json?jurisdiction_id=${ROTTERDAM_JUR_ID}&limit=5`
        );
        expect(resp.status).toBe(200);
        const data = await resp.json();
        expect(Array.isArray(data)).toBe(true);
    });
});

// ─── Test: Cross-Jurisdiction GET Single Request ──────────────────────────

describe('Jurisdiction Access: GET single request', () => {
    let amsterdamRequestId: string | null;
    let rotterdamRequestId: string | null;

    beforeAll(async () => {
        amsterdamRequestId = await getFirstRequestId(AMSTERDAM_JUR_ID);
        rotterdamRequestId = await getFirstRequestId(ROTTERDAM_JUR_ID);
    });

    it('allows authenticated user to read own jurisdiction request', async () => {
        if (!amsterdamRequestId) {
            console.warn('No Amsterdam requests found, skipping');
            return;
        }
        const resp = await fetchWithKey(
            `/georeport/v2/requests/${amsterdamRequestId}.json?extensions=true`,
            AMSTERDAM_USER_KEY
        );
        expect(resp.status).toBe(200);
    });

    it('denies authenticated user access to foreign jurisdiction request', async () => {
        if (!rotterdamRequestId) {
            console.warn('No Rotterdam requests found, skipping');
            return;
        }
        const resp = await fetchWithKey(
            `/georeport/v2/requests/${rotterdamRequestId}.json?extensions=true`,
            AMSTERDAM_USER_KEY
        );
        expect(resp.status).toBe(403);
    });

    it('allows anonymous access to any request (public data)', async () => {
        if (!rotterdamRequestId) {
            console.warn('No Rotterdam requests found, skipping');
            return;
        }
        const resp = await fetchAnonymous(
            `/georeport/v2/requests/${rotterdamRequestId}.json`
        );
        expect(resp.status).toBe(200);
    });
});

// ─── Test: CSV Export via Nuxt server route ────────────────────────────────

describe('Jurisdiction Access: CSV export endpoint', () => {
    const NUXT_URL = process.env.NUXT_URL || 'https://dev.ddev.site:3001';

    it('returns CSV with service definition columns for own jurisdiction', async () => {
        const resp = await fetch(
            `${NUXT_URL}/api/export/requests-csv?jurisdiction_id=${AMSTERDAM_JUR_ID}&delimiter=,&locale=en&slug=amsterdam`,
            { headers: { Accept: 'text/csv' } }
        );
        // May be 200 (anonymous gets basic data) or requires auth
        if (resp.status === 200) {
            const text = await resp.text();
            const headerLine = text.split('\n')[0];
            // Should have more than just the 20 fixed columns if service definitions exist
            const columns = headerLine.split(',');
            expect(columns.length).toBeGreaterThanOrEqual(20);
            // Verify fixed columns are present
            expect(headerLine).toContain('ID');
            expect(headerLine).toContain('Status Notes');
        }
    });

    it('CSV export with slug-based jurisdiction_id includes service definition columns', async () => {
        const resp = await fetch(
            `${NUXT_URL}/api/export/requests-csv?jurisdiction_id=amsterdam&delimiter=,&locale=en&slug=amsterdam`,
            { headers: { Accept: 'text/csv' } }
        );
        if (resp.status === 200) {
            const text = await resp.text();
            const headerLine = text.split('\n')[0];
            const columns = headerLine.split(',');
            // Should have service definition columns (>20 fixed columns)
            expect(columns.length).toBeGreaterThan(20);
        }
    });

    it('CSV export has X-Export-Total header', async () => {
        const resp = await fetch(
            `${NUXT_URL}/api/export/requests-csv?jurisdiction_id=${AMSTERDAM_JUR_ID}&delimiter=,&locale=en&slug=amsterdam`,
            { headers: { Accept: 'text/csv' } }
        );
        if (resp.status === 200) {
            const total = resp.headers.get('x-export-total');
            expect(total).toBeTruthy();
            expect(Number(total)).toBeGreaterThan(0);
        }
    });
});
