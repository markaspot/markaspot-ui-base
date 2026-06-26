import { describe, expect, it } from 'vitest';
import { resolveTenantMetaDescription, resolveTenantMetaOverride } from '~/utils/pageMeta';

describe('resolveTenantMetaDescription', () => {
    it('prefers a tenant-provided translated meta description', () => {
        expect(resolveTenantMetaDescription({
            translatedDescription: ' Meldeplattform Radbuegel der Bundesstadt Bonn ',
            name: 'Radverkehrsmelder',
            tagline: 'Melden Sie Probleme im Radverkehr.'
        })).toBe('Meldeplattform Radbuegel der Bundesstadt Bonn');
    });

    it('falls back to tagline and tenant name for generic defaults', () => {
        expect(resolveTenantMetaDescription({
            translatedDescription: 'Mark-a-Spot',
            name: 'Radverkehrsmelder',
            tagline: 'Melden Sie Probleme im Radverkehr.'
        })).toBe('Melden Sie Probleme im Radverkehr. - Radverkehrsmelder');
    });

    it('falls back to a tenant-specific reporting description without a tagline', () => {
        expect(resolveTenantMetaDescription({
            translatedDescription: 'Mark-a-Spot Frontend',
            name: 'Radverkehrsmelder'
        })).toBe('Citizen Reporting - Radverkehrsmelder');
    });

    it('recognizes localized generic Mark-a-Spot descriptions', () => {
        const genericDescriptions = [
            'Frontend de Mark-a-Spot',
            'Frontend di Mark-a-Spot',
            'Mark-a-Spot-käyttöliittymä',
            'Mark-a-Spot-gränssnitt',
            'Mark-a-Spot-grensesnitt',
            'Frontend Mark-a-Spot'
        ];

        for (const translatedDescription of genericDescriptions) {
            expect(resolveTenantMetaDescription({
                translatedDescription,
                name: 'Radverkehrsmelder'
            })).toBe('Citizen Reporting - Radverkehrsmelder');
        }
    });

    it('keeps a stable default without tenant context', () => {
        expect(resolveTenantMetaDescription({ translatedDescription: '' })).toBe('Mark-a-Spot');
    });

    it('keeps tenant text as plain meta content', () => {
        const description = 'Bonn "Radverkehr" <script>alert(1)</script>';

        expect(resolveTenantMetaDescription({
            translatedDescription: description,
            name: 'Radverkehrsmelder'
        })).toBe(description);
    });

    it('resolves tenant meta descriptions from locale overrides', () => {
        const overrides = {
            de: {
                'meta.description': 'Meldeplattform Radbuegel der Bundesstadt Bonn'
            },
            en: {
                'meta.description': 'Bonn bicycle parking reporting platform'
            }
        };

        expect(resolveTenantMetaOverride(overrides, ['de-DE', 'en'])).toBe('Meldeplattform Radbuegel der Bundesstadt Bonn');
        expect(resolveTenantMetaOverride(overrides, ['fr', 'en'])).toBe('Bonn bicycle parking reporting platform');
        expect(resolveTenantMetaOverride(overrides, ['fr'])).toBeUndefined();
    });
});
