/**
 * Unit Tests for Multi-Org Display Helpers
 *
 * Tests the display logic used in ReportDetail, ReportDetailSheet,
 * ReportPrintSheet, and the dashboard requests table to render
 * organisation labels from single or multiple org references.
 *
 * @see /app/components/report/ReportDetail.vue
 * @see /app/components/print/ReportPrintSheet.vue
 * @see markaspot/markaspot-ui#274
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helper: mirrors the display pattern used across components
// ---------------------------------------------------------------------------

interface DisplayOrg {
    id?: string
    label: string
}

/**
 * Resolves the display string for organisation(s) on a request.
 * This pattern is used consistently in:
 * - ReportDetail.vue: `report.organisations?.map(o => o.label).join(', ') || report.organisation?.label`
 * - ReportPrintSheet.vue: same pattern in computed
 * - Dashboard table: same pattern in template
 * - CSV export: same pattern with name fallback
 */
function getOrganisationDisplay(request: {
    organisation?: DisplayOrg
    organisations?: DisplayOrg[]
}): string {
    if (request.organisations?.length) {
        return request.organisations.map(o => o.label).join(', ');
    }
    return request.organisation?.label || '';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Multi-Org Display Helpers', () => {
    it('joins multiple org labels with comma', () => {
        const result = getOrganisationDisplay({
            organisations: [
                { id: '1', label: 'A' },
                { id: '2', label: 'B' }
            ]
        });

        expect(result).toBe('A, B');
    });

    it('returns single label without comma', () => {
        const result = getOrganisationDisplay({
            organisations: [
                { id: '1', label: 'A' }
            ]
        });

        expect(result).toBe('A');
    });

    it('falls back to singular organisation label', () => {
        const result = getOrganisationDisplay({
            organisation: { id: '1', label: 'Legacy Org' }
        });

        expect(result).toBe('Legacy Org');
    });

    it('returns empty string when no orgs', () => {
        const result = getOrganisationDisplay({});

        expect(result).toBe('');
    });

    it('prefers organisations array over singular organisation', () => {
        const result = getOrganisationDisplay({
            organisation: { id: '1', label: 'Singular' },
            organisations: [
                { id: '2', label: 'From Array' }
            ]
        });

        // organisations takes precedence when it has entries
        expect(result).toBe('From Array');
    });

    it('falls back to singular when organisations is empty array', () => {
        const result = getOrganisationDisplay({
            organisation: { id: '1', label: 'Fallback' },
            organisations: []
        });

        // Empty array has no length, so falls back to singular
        expect(result).toBe('Fallback');
    });

    it('handles three or more organisations', () => {
        const result = getOrganisationDisplay({
            organisations: [
                { label: 'Alpha' },
                { label: 'Beta' },
                { label: 'Gamma' }
            ]
        });

        expect(result).toBe('Alpha, Beta, Gamma');
    });
});
