/**
 * Icon Utils Tests
 *
 * Tests icon name normalization across multiple input formats:
 * iconify_field (lucide:tree-pine), fa_icon_class (i-lucide-tree-pine),
 * and legacy FontAwesome (fa-trash). Documents known bugs.
 *
 * @see app/utils/iconUtils.ts
 */
import { describe, it, expect } from 'vitest';
import { normalizeIconName, toUIconName } from '@/utils/iconUtils';

// ============================================================================
// normalizeIconName
// ============================================================================

describe('normalizeIconName', () => {
    describe('iconify_field format (collection:name)', () => {
        it('converts colon to dash', () => {
            expect(normalizeIconName('lucide:tree-pine')).toBe('lucide-tree-pine');
        });

        it('lowercases the result', () => {
            expect(normalizeIconName('Lucide:Tree-Pine')).toBe('lucide-tree-pine');
        });

        // BUG: triple-colon format drops the last segment
        it('KNOWN BUG: drops segments after second colon', () => {
            // fa:brands:github should become fa-brands-github
            // but split(':') destructuring only takes [collection, name]
            const result = normalizeIconName('fa:brands:github');
            // Actual behavior: 'fa-brands' (github dropped)
            expect(result).toBe('fa-brands');
            // Expected correct behavior would be: 'fa-brands-github'
        });
    });

    describe('fa_icon_class format (i-collection-name)', () => {
        it('strips i- prefix', () => {
            expect(normalizeIconName('i-lucide-tree-pine')).toBe('lucide-tree-pine');
        });

        it('lowercases the result', () => {
            expect(normalizeIconName('i-Lucide-Tree-Pine')).toBe('lucide-tree-pine');
        });
    });

    describe('FontAwesome legacy format', () => {
        it('strips fa- prefix', () => {
            expect(normalizeIconName('fa-trash')).toBe('trash');
        });

        it('strips fa: prefix', () => {
            expect(normalizeIconName('fa:trash')).toBe('fa-trash');
            // Note: fa: format hits the colon branch, not the FA branch
        });

        it('strips far/fas/fab prefix', () => {
            expect(normalizeIconName('far fa-envelope')).toBe('envelope');
            expect(normalizeIconName('fas fa-star')).toBe('star');
            expect(normalizeIconName('fab fa-github')).toBe('github');
        });

        it('strips -o suffix (outline variant)', () => {
            expect(normalizeIconName('fa-bell-o')).toBe('bell');
        });

        it('converts spaces to dashes', () => {
            expect(normalizeIconName('exclamation triangle')).toBe('exclamation-triangle');
        });
    });
});

// ============================================================================
// toUIconName
// ============================================================================

describe('toUIconName', () => {
    describe('iconify_field format', () => {
        it('converts to i- prefixed format', () => {
            expect(toUIconName('lucide:tree-pine')).toBe('i-lucide-tree-pine');
        });

        it('lowercases the result', () => {
            expect(toUIconName('Lucide:Tree-Pine')).toBe('i-lucide-tree-pine');
        });

        // BUG: same triple-colon issue as normalizeIconName
        it('KNOWN BUG: drops segments after second colon', () => {
            const result = toUIconName('fa:brands:github');
            expect(result).toBe('i-fa-brands'); // github dropped
        });
    });

    describe('already in UIcon format', () => {
        it('returns unchanged when already i- prefixed', () => {
            expect(toUIconName('i-lucide-tree-pine')).toBe('i-lucide-tree-pine');
        });

        it('lowercases existing i- format', () => {
            expect(toUIconName('i-Lucide-Tree-Pine')).toBe('i-lucide-tree-pine');
        });
    });

    describe('FontAwesome legacy format', () => {
        it('converts to i-lucide- prefixed fallback', () => {
            expect(toUIconName('fa-trash')).toBe('i-lucide-trash');
        });

        it('strips far/fas/fab and fa- before adding lucide prefix', () => {
            expect(toUIconName('fas fa-star')).toBe('i-lucide-star');
        });

        it('handles plain name', () => {
            expect(toUIconName('trash')).toBe('i-lucide-trash');
        });
    });
});
