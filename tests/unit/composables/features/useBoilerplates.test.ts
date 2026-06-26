import { describe, expect, it } from 'vitest';
import {
    isBoilerplateAvailableForOrganisations,
    normalizeBoilerplateType
} from '~/composables/features/useBoilerplates';

const orgA = '11111111-1111-4111-8111-111111111111';
const orgB = '22222222-2222-4222-8222-222222222222';
const orgC = '33333333-3333-4333-8333-333333333333';

describe('useBoilerplates organisation scope helpers', () => {
    it('keeps unscoped boilerplates visible for any organisation scope', () => {
        expect(isBoilerplateAvailableForOrganisations({ organisationIds: [] }, undefined)).toBe(true);
        expect(isBoilerplateAvailableForOrganisations({ organisationIds: [] }, orgA)).toBe(true);
    });

    it('keeps jurisdiction boilerplates visible when no organisation scope is active', () => {
        expect(isBoilerplateAvailableForOrganisations({ organisationIds: [orgA] }, undefined)).toBe(true);
        expect(isBoilerplateAvailableForOrganisations({ organisationIds: [orgA] }, [])).toBe(true);
        expect(isBoilerplateAvailableForOrganisations({ organisationIds: [orgA] }, '13')).toBe(true);
    });

    it('filters scoped boilerplates when a valid organisation scope is active', () => {
        expect(isBoilerplateAvailableForOrganisations({ organisationIds: [orgA] }, orgB)).toBe(false);
        expect(isBoilerplateAvailableForOrganisations({ organisationIds: [orgA] }, orgA)).toBe(true);
        expect(isBoilerplateAvailableForOrganisations({ organisationIds: [orgA, orgB] }, [orgC, orgB])).toBe(true);
    });
});

describe('useBoilerplates type normalization', () => {
    it('normalizes Drupal list_string values from JSON:API', () => {
        expect(normalizeBoilerplateType(['service_provider'])).toBe('service_provider');
        expect(normalizeBoilerplateType(['status_notes'])).toBe('status_notes');
        expect(normalizeBoilerplateType('remarks')).toBe('remarks');
        expect(normalizeBoilerplateType([])).toBe('status_notes');
        expect(normalizeBoilerplateType(null)).toBe('status_notes');
    });
});
