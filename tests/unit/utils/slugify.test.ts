import { describe, it, expect } from 'vitest';
import { slugify, isValidSlug } from '~/utils/slugify';

describe('slugify', () => {
    it('lowercases and replaces spaces with hyphens', () => {
        expect(slugify('School Centrum')).toBe('school-centrum');
    });

    it('expands German umlauts to two-letter equivalents', () => {
        expect(slugify('Münchner Straße')).toBe('muenchner-strasse');
        expect(slugify('Bürgerbüro Köln')).toBe('buergerbuero-koeln');
    });

    it('strips other latin diacritics without expansion', () => {
        expect(slugify('Café résumé')).toBe('cafe-resume');
        expect(slugify('Łódź')).toBe('odz');
    });

    it('collapses consecutive separators', () => {
        expect(slugify('hello   world!!!')).toBe('hello-world');
        expect(slugify('a___b')).toBe('a-b');
    });

    it('trims leading and trailing hyphens', () => {
        expect(slugify('  hello  ')).toBe('hello');
        expect(slugify('!!!hello!!!')).toBe('hello');
    });

    it('returns empty string for empty or whitespace input', () => {
        expect(slugify('')).toBe('');
        expect(slugify('   ')).toBe('');
        expect(slugify('!!!')).toBe('');
    });

    it('preserves digits', () => {
        expect(slugify('Kita Nr. 42')).toBe('kita-nr-42');
    });
});

describe('isValidSlug', () => {
    it('accepts kebab-case lowercase ASCII', () => {
        expect(isValidSlug('school-centrum')).toBe(true);
        expect(isValidSlug('kita-42')).toBe(true);
        expect(isValidSlug('a')).toBe(true);
    });

    it('rejects empty string', () => {
        expect(isValidSlug('')).toBe(false);
    });

    it('rejects uppercase, whitespace, and non-ASCII', () => {
        expect(isValidSlug('School-Centrum')).toBe(false);
        expect(isValidSlug('school centrum')).toBe(false);
        expect(isValidSlug('schöne-kita')).toBe(false);
    });

    it('rejects leading, trailing, or consecutive hyphens', () => {
        expect(isValidSlug('-school')).toBe(false);
        expect(isValidSlug('school-')).toBe(false);
        expect(isValidSlug('school--centrum')).toBe(false);
    });
});
