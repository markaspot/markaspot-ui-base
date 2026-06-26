/**
 * Drupal Text Utilities Tests
 *
 * Tests HTML stripping, entity decoding, and Drupal text field
 * extraction. The SSR regex path is always tested since happy-dom
 * environment has import.meta.client undefined.
 *
 * @see app/utils/drupalText.ts
 */
import { describe, it, expect } from 'vitest';
import { stripHtml, getPlainText, getSafeHtml, getRawValue } from '@/utils/drupalText';
import type { DrupalTextField } from '@/utils/drupalText';

// ============================================================================
// stripHtml
// ============================================================================

describe('stripHtml', () => {
    it('strips simple HTML tags', () => {
        expect(stripHtml('<p>Hello World</p>')).toBe('Hello World');
    });

    it('strips nested tags', () => {
        expect(stripHtml('<div><p>Hello <strong>World</strong></p></div>')).toBe('Hello World');
    });

    it('decodes &amp; entity', () => {
        expect(stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
    });

    it('decodes &lt; and &gt; entities', () => {
        expect(stripHtml('1 &lt; 2 &gt; 0')).toBe('1 < 2 > 0');
    });

    it('decodes &nbsp; to space', () => {
        expect(stripHtml('Hello&nbsp;World')).toBe('Hello World');
    });

    it('decodes &quot; entity', () => {
        expect(stripHtml('He said &quot;hi&quot;')).toBe('He said "hi"');
    });

    it('decodes &#39; entity (single quote)', () => {
        expect(stripHtml('it&#39;s fine')).toBe('it\'s fine');
    });

    it('collapses whitespace', () => {
        expect(stripHtml('Hello   \n\n   World')).toBe('Hello World');
    });

    it('trims result', () => {
        expect(stripHtml('  <p>  Hello  </p>  ')).toBe('Hello');
    });

    it('returns empty string for null/undefined', () => {
        expect(stripHtml(null)).toBe('');
        expect(stripHtml(undefined)).toBe('');
        expect(stripHtml('')).toBe('');
    });

    it('handles script tags', () => {
        // XSS surface: script content should be stripped
        const result = stripHtml('<script>alert("xss")</script>Safe text');
        expect(result).not.toContain('<script>');
        expect(result).toContain('Safe text');
    });

    it('handles self-closing tags (inserts space for line breaks)', () => {
        expect(stripHtml('Line 1<br/>Line 2')).toBe('Line 1 Line 2');
    });
});

// ============================================================================
// getPlainText
// ============================================================================

describe('getPlainText', () => {
    it('prefers processed over value', () => {
        const field: DrupalTextField = {
            value: '<p>Raw value</p>',
            processed: '<p>Processed value</p>'
        };
        expect(getPlainText(field)).toBe('Processed value');
    });

    it('falls back to value when no processed', () => {
        const field: DrupalTextField = {
            value: '<p>Raw value</p>'
        };
        expect(getPlainText(field)).toBe('Raw value');
    });

    it('handles string input directly', () => {
        expect(getPlainText('<p>Hello</p>')).toBe('Hello');
    });

    it('returns empty for null/undefined', () => {
        expect(getPlainText(null)).toBe('');
        expect(getPlainText(undefined)).toBe('');
    });

    it('returns empty for empty field', () => {
        expect(getPlainText({})).toBe('');
    });
});

// ============================================================================
// getSafeHtml
// ============================================================================

describe('getSafeHtml', () => {
    it('returns processed HTML for DrupalTextField', () => {
        const field: DrupalTextField = {
            value: '<script>alert("xss")</script>',
            processed: '<p>Safe HTML</p>'
        };
        expect(getSafeHtml(field)).toBe('<p>Safe HTML</p>');
    });

    it('strips raw value when no processed available', () => {
        const field: DrupalTextField = {
            value: '<p>Raw <script>xss</script> value</p>'
        };
        // Should strip HTML since there's no processed version
        const result = getSafeHtml(field);
        expect(result).not.toContain('<script>');
    });

    it('strips string input (cannot trust raw strings)', () => {
        const result = getSafeHtml('<p>Hello <script>xss</script></p>');
        expect(result).not.toContain('<script>');
    });

    it('returns empty for null/undefined', () => {
        expect(getSafeHtml(null)).toBe('');
        expect(getSafeHtml(undefined)).toBe('');
    });
});

// ============================================================================
// getRawValue
// ============================================================================

describe('getRawValue', () => {
    it('returns raw value from DrupalTextField', () => {
        const field: DrupalTextField = {
            value: '<p>Raw content</p>',
            processed: '<p>Processed</p>'
        };
        expect(getRawValue(field)).toBe('<p>Raw content</p>');
    });

    it('returns string input as-is', () => {
        expect(getRawValue('plain text')).toBe('plain text');
    });

    it('returns empty for null/undefined', () => {
        expect(getRawValue(null)).toBe('');
        expect(getRawValue(undefined)).toBe('');
    });

    it('returns empty for empty field', () => {
        expect(getRawValue({})).toBe('');
    });
});
