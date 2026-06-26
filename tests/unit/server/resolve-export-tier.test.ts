/**
 * Export Tier Resolution Tests
 *
 * Guards against Drupal role name drift. If any of these role names is
 * renamed in Drupal (user.role.*), the corresponding test will fail and
 * point at the function that needs updating.
 *
 * @see server/api/export/requests-csv.get.ts
 */
import { describe, it, expect, vi } from 'vitest';

import { resolveExportTier } from '~/server/api/export/requests-csv.get';

// Mock the runtime config access used by buildFetchAgent (not exercised
// by resolveExportTier itself but imported by the module).
vi.mock('#imports', () => ({
    useRuntimeConfig: () => ({ public: {}, proxy: { rejectUnauthorized: false } })
}));

describe('resolveExportTier', () => {
    it('returns full tier for administrator', () => {
        const result = resolveExportTier(['authenticated', 'administrator']);
        expect(result.tier).toBe('full');
        expect(result.limit).toBeGreaterThanOrEqual(500000);
    });

    it('returns full tier for editorial_board', () => {
        const result = resolveExportTier(['authenticated', 'editorial_board']);
        expect(result.tier).toBe('full');
        expect(result.limit).toBeGreaterThanOrEqual(500000);
    });

    it('administrator wins over moderator', () => {
        const result = resolveExportTier(['moderator', 'administrator']);
        expect(result.tier).toBe('full');
    });

    it('returns moderator tier for moderator', () => {
        const result = resolveExportTier(['authenticated', 'moderator']);
        expect(result.tier).toBe('moderator');
        expect(result.limit).toBe(50000);
    });

    it('returns authenticated tier for plain authenticated users', () => {
        const result = resolveExportTier(['authenticated']);
        expect(result.tier).toBe('authenticated');
        expect(result.limit).toBe(5000);
    });

    it('returns anonymous tier for empty role list (fail-secure)', () => {
        const result = resolveExportTier([]);
        expect(result.tier).toBe('anonymous');
        expect(result.limit).toBe(1000);
    });

    it('returns anonymous tier for unknown roles only', () => {
        const result = resolveExportTier(['some_custom_role']);
        expect(result.tier).toBe('anonymous');
        expect(result.limit).toBe(1000);
    });

    it('treats role names case-sensitively', () => {
        // Drupal uses lowercase role IDs; 'Administrator' should NOT escalate
        const result = resolveExportTier(['Administrator']);
        expect(result.tier).toBe('anonymous');
    });
});
