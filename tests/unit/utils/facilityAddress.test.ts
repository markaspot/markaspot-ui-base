import { describe, expect, it } from 'vitest';

import { formatFacilityAddress } from '@/utils/facilityAddress';

describe('formatFacilityAddress', () => {
    it('returns empty string for undefined address', () => {
        expect(formatFacilityAddress(undefined, 'en')).toBe('');
    });

    it('returns the plain string as-is (legacy graceful-degradation path)', () => {
        expect(formatFacilityAddress('Main Street 1, 50667 Cologne', 'de')).toBe(
            'Main Street 1, 50667 Cologne'
        );
    });

    it('never returns "[object Object]" for structured input', () => {
        const result = formatFacilityAddress(
            { address_line1: 'Main Street 1', postal_code: '50667', locality: 'Cologne' },
            'en'
        );
        expect(result).not.toContain('[object Object]');
    });

    it('formats DE address as "street, postal locality"', () => {
        expect(
            formatFacilityAddress(
                { address_line1: 'Hauptstraße 1', postal_code: '50667', locality: 'Köln', country_code: 'de' },
                'de'
            )
        ).toBe('Hauptstraße 1, 50667 Köln');
    });

    it('formats FR address with street, postal, locality order', () => {
        expect(
            formatFacilityAddress(
                { address_line1: '1 rue de Rivoli', postal_code: '75001', locality: 'Paris', country_code: 'fr' },
                'fr'
            )
        ).toBe('1 rue de Rivoli, 75001 Paris');
    });

    it('formats NL address with street, postal, locality order', () => {
        expect(
            formatFacilityAddress(
                { address_line1: 'Damrak 1', postal_code: '1012', locality: 'Amsterdam', country_code: 'nl' },
                'nl'
            )
        ).toBe('Damrak 1, 1012 Amsterdam');
    });

    it('formats IT address with country code in parentheses', () => {
        expect(
            formatFacilityAddress(
                { address_line1: 'Via Roma 1', postal_code: '00100', locality: 'Roma', country_code: 'it' },
                'it'
            )
        ).toBe('Via Roma 1, 00100 Roma (IT)');
    });

    it('uppercases country code for IT output', () => {
        expect(
            formatFacilityAddress(
                { address_line1: 'Via Roma 1', postal_code: '00100', locality: 'Roma', country_code: 'It' },
                'it'
            )
        ).toContain('(IT)');
    });

    it('falls back to DE order for unknown locale', () => {
        expect(
            formatFacilityAddress(
                { address_line1: 'Main Street 1', postal_code: '50667', locality: 'Cologne' },
                'zz'
            )
        ).toBe('Main Street 1, 50667 Cologne');
    });

    it('strips BCP-47 region variant when dispatching (en-US -> en)', () => {
        expect(
            formatFacilityAddress(
                { address_line1: 'Via Roma 1', postal_code: '00100', locality: 'Roma', country_code: 'it' },
                'it-IT'
            )
        ).toBe('Via Roma 1, 00100 Roma (IT)');
    });

    it('tolerates partial addresses without crashing', () => {
        expect(formatFacilityAddress({ address_line1: 'Only this' }, 'en')).toBe('Only this');
        expect(
            formatFacilityAddress({ address_line1: '', postal_code: '50667', locality: 'Cologne' }, 'en')
        ).toBe('50667 Cologne');
    });
});
