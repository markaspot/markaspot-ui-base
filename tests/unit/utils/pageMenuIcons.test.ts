import { describe, expect, it } from 'vitest';
import lucideIcons from '@iconify-json/lucide/icons.json';

import { resolvePageMenuIcon } from '../../../app/utils/pageMenuIcons';

const expectLucideIconToExist = (icon: string) => {
    const name = icon.replace(/^i-lucide-/, '');
    expect(lucideIcons.icons).toHaveProperty(name);
};

describe('resolvePageMenuIcon', () => {
    it('keeps configured CMS icons as the source of truth', () => {
        expect(resolvePageMenuIcon('i-lucide-book-open', 'FAQ')).toBe('i-lucide-book-open');
    });

    it('uses distinct semantic fallback icons for Bonn page menu titles', () => {
        const icons = [
            resolvePageMenuIcon(null, 'Datenschutzhinweise und Regeln'),
            resolvePageMenuIcon(null, 'Erklärung zur Barrierefreiheit'),
            resolvePageMenuIcon(null, 'FAQ'),
            resolvePageMenuIcon(null, 'Impressum'),
            resolvePageMenuIcon(null, 'Informationen')
        ];

        expect(icons).toEqual([
            'i-lucide-shield-check',
            'i-lucide-accessibility',
            'i-lucide-circle-question-mark',
            'i-lucide-building-2',
            'i-lucide-info'
        ]);
        expect(new Set(icons).size).toBe(icons.length);
        icons.forEach(expectLucideIconToExist);
    });

    it('falls back to the generic document icon for unknown titles', () => {
        expect(resolvePageMenuIcon(null, 'Sonstiges')).toBe('i-lucide-file-text');
    });

    it('prefers specific matches over generic title fragments', () => {
        expect(resolvePageMenuIcon(null, 'Kontaktinformationen')).toBe('i-lucide-mail');
        expect(resolvePageMenuIcon(null, 'Unregelmäßigkeiten')).toBe('i-lucide-file-text');
        expect(resolvePageMenuIcon(null, 'Melderegeln')).toBe('i-lucide-list-checks');
    });
});
