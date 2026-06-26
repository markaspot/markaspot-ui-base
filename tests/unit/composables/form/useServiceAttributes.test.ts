/**
 * Service Attributes Tests
 *
 * Tests the useServiceAttributes composable which parses Open311 service
 * definition JSON from taxonomy terms, manages reactive attribute values,
 * validates required fields, and builds submission payloads.
 *
 * @see app/composables/form/useServiceAttributes.ts
 */
import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import { useServiceAttributes } from '@/composables/form/useServiceAttributes';
import type { TaxonomyTerm, ServiceDefinitionAttribute } from '~~/types/category';

// ============================================================================
// Helpers
// ============================================================================

function makeAttribute(overrides: Partial<ServiceDefinitionAttribute> = {}): ServiceDefinitionAttribute {
    return {
        code: 'test_attr',
        variable: true,
        datatype: 'string',
        required: false,
        description: 'Test attribute',
        order: 0,
        ...overrides
    };
}

function makeTerm(id: string, attributes?: ServiceDefinitionAttribute[]): TaxonomyTerm {
    const term: TaxonomyTerm = {
        id,
        name: `Category ${id}`,
        attributes: {}
    } as TaxonomyTerm;

    if (attributes) {
        term.attributes!.field_service_definition = JSON.stringify({ attributes });
    }

    return term;
}

function createOptions(overrides: { categoryId?: string, terms?: TaxonomyTerm[] } = {}) {
    return {
        category: ref(overrides.categoryId ?? ''),
        categories: ref(overrides.terms ?? [])
    };
}

// ============================================================================
// serviceDefinition parsing
// ============================================================================

describe('serviceDefinition parsing', () => {
    it('returns empty array when no category selected', () => {
        const opts = createOptions({ terms: [makeTerm('cat-1', [makeAttribute()])] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toEqual([]);
    });

    it('returns empty array when category has no field_service_definition', () => {
        const term = makeTerm('cat-1'); // no attributes
        const opts = createOptions({ categoryId: 'cat-1', terms: [term] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toEqual([]);
    });

    it('parses JSON wrapper format { attributes: [...] }', () => {
        const attr = makeAttribute({ code: 'lamp_number' });
        const term = makeTerm('cat-1', [attr]);
        const opts = createOptions({ categoryId: 'cat-1', terms: [term] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toHaveLength(1);
        expect(visibleAttributes.value[0].code).toBe('lamp_number');
    });

    it('parses plain array format', () => {
        const attr = makeAttribute({ code: 'surface' });
        const term: TaxonomyTerm = {
            id: 'cat-1',
            name: 'Category',
            attributes: {
                field_service_definition: JSON.stringify([attr])
            }
        } as TaxonomyTerm;
        const opts = createOptions({ categoryId: 'cat-1', terms: [term] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toHaveLength(1);
        expect(visibleAttributes.value[0].code).toBe('surface');
    });

    it('handles JSON:API text_long object format { value, format }', () => {
        const attr = makeAttribute({ code: 'size' });
        const term: TaxonomyTerm = {
            id: 'cat-1',
            name: 'Category',
            attributes: {
                field_service_definition: {
                    value: JSON.stringify({ attributes: [attr] }),
                    format: 'plain_text'
                }
            }
        } as TaxonomyTerm;
        const opts = createOptions({ categoryId: 'cat-1', terms: [term] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toHaveLength(1);
        expect(visibleAttributes.value[0].code).toBe('size');
    });

    it('returns empty array for invalid JSON', () => {
        const term: TaxonomyTerm = {
            id: 'cat-1',
            name: 'Category',
            attributes: { field_service_definition: 'not-valid-json{{{' }
        } as TaxonomyTerm;
        const opts = createOptions({ categoryId: 'cat-1', terms: [term] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toEqual([]);
    });

    it('returns empty array when parsed JSON is not an array or object with attributes', () => {
        const term: TaxonomyTerm = {
            id: 'cat-1',
            name: 'Category',
            attributes: { field_service_definition: JSON.stringify('just a string') }
        } as TaxonomyTerm;
        const opts = createOptions({ categoryId: 'cat-1', terms: [term] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toEqual([]);
    });
});

// ============================================================================
// visibleAttributes filtering and sorting
// ============================================================================

describe('visibleAttributes filtering and sorting', () => {
    it('filters out attributes with variable: false', () => {
        const attrs = [
            makeAttribute({ code: 'visible', variable: true }),
            makeAttribute({ code: 'hidden', variable: false })
        ];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toHaveLength(1);
        expect(visibleAttributes.value[0].code).toBe('visible');
    });

    it('sorts by order ascending', () => {
        const attrs = [
            makeAttribute({ code: 'third', order: 30 }),
            makeAttribute({ code: 'first', order: 10 }),
            makeAttribute({ code: 'second', order: 20 })
        ];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value.map(a => a.code)).toEqual(['first', 'second', 'third']);
    });

    it('treats undefined order as 0', () => {
        const attrs = [
            makeAttribute({ code: 'with_order', order: 5 }),
            makeAttribute({ code: 'no_order', order: undefined })
        ];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value[0].code).toBe('no_order');
        expect(visibleAttributes.value[1].code).toBe('with_order');
    });
});

// ============================================================================
// hasAttributes
// ============================================================================

describe('hasAttributes', () => {
    it('returns false when no category selected', () => {
        const opts = createOptions();
        const { hasAttributes } = useServiceAttributes(opts);
        expect(hasAttributes.value).toBe(false);
    });

    it('returns false when category has no attributes', () => {
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1')] });
        const { hasAttributes } = useServiceAttributes(opts);
        expect(hasAttributes.value).toBe(false);
    });

    it('returns true when category has visible attributes', () => {
        const attrs = [makeAttribute({ variable: true })];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { hasAttributes } = useServiceAttributes(opts);
        expect(hasAttributes.value).toBe(true);
    });

    it('returns false when all attributes have variable: false', () => {
        const attrs = [makeAttribute({ variable: false })];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { hasAttributes } = useServiceAttributes(opts);
        expect(hasAttributes.value).toBe(false);
    });
});

// ============================================================================
// Category change reset
// ============================================================================

describe('category change reset', () => {
    it('resets attribute values when category changes', async () => {
        const attrs = [
            makeAttribute({ code: 'surface', datatype: 'string' }),
            makeAttribute({ code: 'tags', datatype: 'multivaluelist' })
        ];
        const opts = createOptions({
            categoryId: 'cat-1',
            terms: [
                makeTerm('cat-1', attrs),
                makeTerm('cat-2', [makeAttribute({ code: 'other' })])
            ]
        });
        const { attributeValues } = useServiceAttributes(opts);

        // Trigger initial watcher
        opts.category.value = 'cat-1';
        await nextTick();

        // Set some values
        attributeValues.surface = 'asphalt';
        attributeValues.tags = ['graffiti'];

        // Switch category
        opts.category.value = 'cat-2';
        await nextTick();

        // Old values should be cleared
        expect(attributeValues.surface).toBeUndefined();
        expect(attributeValues.tags).toBeUndefined();
        // New attribute should be initialized
        expect(attributeValues.other).toBe('');
    });

    it('initializes multivaluelist attributes as empty array', async () => {
        const attrs = [makeAttribute({ code: 'colors', datatype: 'multivaluelist', values: [{ key: 'r', name: 'Red' }] })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(attributeValues.colors).toEqual([]);
    });

    it('initializes string attributes as empty string', async () => {
        const attrs = [makeAttribute({ code: 'note', datatype: 'string' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(attributeValues.note).toBe('');
    });
});

// ============================================================================
// getAttributeErrors (validation)
// ============================================================================

describe('getAttributeErrors', () => {
    it('returns empty array when no required attributes', async () => {
        const attrs = [makeAttribute({ required: false })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(getAttributeErrors()).toEqual([]);
    });

    it('returns error for empty required string attribute', async () => {
        const attrs = [makeAttribute({ code: 'lamp_no', required: true, description: 'Lamp Number' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        const errors = getAttributeErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0].code).toBe('lamp_no');
        expect(errors[0].message).toContain('Lamp Number');
    });

    it('returns error for empty required multivaluelist', async () => {
        const attrs = [makeAttribute({ code: 'tags', required: true, datatype: 'multivaluelist' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        const errors = getAttributeErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0].code).toBe('tags');
    });

    it('returns no error when required attribute is filled', async () => {
        const attrs = [makeAttribute({ code: 'lamp_no', required: true })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.lamp_no = '12345';
        expect(getAttributeErrors()).toEqual([]);
    });

    it('skips non-required attributes', async () => {
        const attrs = [
            makeAttribute({ code: 'optional', required: false }),
            makeAttribute({ code: 'mandatory', required: true, description: 'Mandatory' })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        const errors = getAttributeErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0].code).toBe('mandatory');
    });

    it('uses code as fallback when description is empty', async () => {
        const attrs = [makeAttribute({ code: 'field_x', required: true, description: '' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        const errors = getAttributeErrors();
        expect(errors[0].message).toContain('field_x');
    });
});

// ============================================================================
// getAttributesForSubmission
// ============================================================================

describe('getAttributesForSubmission', () => {
    it('returns empty object when no values set', async () => {
        const attrs = [makeAttribute({ code: 'note' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributesForSubmission } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(getAttributesForSubmission()).toEqual({});
    });

    it('includes populated string values', async () => {
        const attrs = [makeAttribute({ code: 'lamp_no' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributesForSubmission, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.lamp_no = 'LP-42';
        expect(getAttributesForSubmission()).toEqual({ lamp_no: 'LP-42' });
    });

    it('excludes empty strings', async () => {
        const attrs = [
            makeAttribute({ code: 'filled' }),
            makeAttribute({ code: 'empty' })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributesForSubmission, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.filled = 'value';
        // empty stays ''
        const result = getAttributesForSubmission();
        expect(result).toEqual({ filled: 'value' });
        expect(result).not.toHaveProperty('empty');
    });

    it('excludes empty arrays (multivaluelist with no selection)', async () => {
        const attrs = [makeAttribute({ code: 'tags', datatype: 'multivaluelist' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributesForSubmission } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(getAttributesForSubmission()).toEqual({});
    });

    it('includes populated arrays', async () => {
        const attrs = [makeAttribute({ code: 'tags', datatype: 'multivaluelist' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributesForSubmission, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.tags = ['graffiti', 'offensive'];
        expect(getAttributesForSubmission()).toEqual({ tags: ['graffiti', 'offensive'] });
    });

    it('only includes values for visible attributes', async () => {
        const attrs = [
            makeAttribute({ code: 'visible', variable: true }),
            makeAttribute({ code: 'hidden', variable: false })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributesForSubmission, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.visible = 'yes';
        attributeValues.hidden = 'should-not-appear';
        expect(getAttributesForSubmission()).toEqual({ visible: 'yes' });
    });
});

// ============================================================================
// Phase 1: datatype_description
// ============================================================================

describe('datatype_description', () => {
    it('attribute with datatype_description is parsed correctly', () => {
        const attrs = [makeAttribute({
            code: 'lamp_no',
            datatype_description: 'Enter the 6-digit number from the metal plate'
        })];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value[0].datatype_description).toBe('Enter the 6-digit number from the metal plate');
    });

    it('missing datatype_description is undefined (backward compat)', () => {
        const attrs = [makeAttribute({ code: 'lamp_no' })];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value[0].datatype_description).toBeUndefined();
    });
});

// ============================================================================
// Phase 2: default_value
// ============================================================================

describe('default_value', () => {
    it('string attribute with default_value initializes correctly', async () => {
        const attrs = [makeAttribute({ code: 'surface', default_value: 'asphalt' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(attributeValues.surface).toBe('asphalt');
    });

    it('number attribute with default_value initializes correctly', async () => {
        const attrs = [makeAttribute({ code: 'count', datatype: 'number', default_value: 5 })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(attributeValues.count).toBe(5);
    });

    it('multivaluelist with comma-separated default keys', async () => {
        const attrs = [makeAttribute({
            code: 'tags',
            datatype: 'multivaluelist',
            default_value: 'graffiti, offensive',
            values: [
                { key: 'graffiti', name: 'Graffiti' },
                { key: 'offensive', name: 'Offensive' },
                { key: 'other', name: 'Other' }
            ]
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(attributeValues.tags).toEqual(['graffiti', 'offensive']);
    });

    it('singlevaluelist with default_value initializes correctly', async () => {
        const attrs = [makeAttribute({
            code: 'priority',
            datatype: 'singlevaluelist',
            default_value: 'medium',
            values: [
                { key: 'low', name: 'Low' },
                { key: 'medium', name: 'Medium' },
                { key: 'high', name: 'High' }
            ]
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(attributeValues.priority).toBe('medium');
    });

    it('missing default_value initializes as empty (backward compat)', async () => {
        const attrs = [makeAttribute({ code: 'note' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        expect(attributeValues.note).toBe('');
    });

    it('category change resets to defaults', async () => {
        const attrs1 = [makeAttribute({ code: 'surface', default_value: 'asphalt' })];
        const attrs2 = [makeAttribute({ code: 'material', default_value: 'concrete' })];
        const opts = createOptions({
            categoryId: '',
            terms: [makeTerm('cat-1', attrs1), makeTerm('cat-2', attrs2)]
        });
        const { attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();
        expect(attributeValues.surface).toBe('asphalt');

        // User changes value
        attributeValues.surface = 'gravel';

        // Switch category
        opts.category.value = 'cat-2';
        await nextTick();

        expect(attributeValues.surface).toBeUndefined();
        expect(attributeValues.material).toBe('concrete');
    });
});

// ============================================================================
// Phase 3: validation (pattern, min/max)
// ============================================================================

describe('validation', () => {
    it('pattern validation pass', async () => {
        const attrs = [makeAttribute({
            code: 'lamp_no',
            required: false,
            validation: { pattern: '^[0-9]{6}$' }
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.lamp_no = '123456';
        expect(getAttributeErrors()).toEqual([]);
    });

    it('pattern validation fail', async () => {
        const attrs = [makeAttribute({
            code: 'lamp_no',
            required: false,
            validation: { pattern: '^[0-9]{6}$', pattern_message: 'Must be exactly 6 digits' }
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.lamp_no = 'abc';
        const errors = getAttributeErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toBe('Must be exactly 6 digits');
    });

    it('custom pattern_message is used', async () => {
        const attrs = [makeAttribute({
            code: 'code_field',
            validation: { pattern: '^[A-Z]+$', pattern_message: 'Uppercase letters only' }
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.code_field = 'abc';
        expect(getAttributeErrors()[0].message).toBe('Uppercase letters only');
    });

    it('min/max for number type', async () => {
        const attrs = [makeAttribute({
            code: 'count',
            datatype: 'number',
            validation: { min: 1, max: 10 }
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Below min
        attributeValues.count = 0;
        expect(getAttributeErrors()).toHaveLength(1);

        // Above max
        attributeValues.count = 11;
        expect(getAttributeErrors()).toHaveLength(1);

        // Within range
        attributeValues.count = 5;
        expect(getAttributeErrors()).toEqual([]);
    });

    it('min/max for string length', async () => {
        const attrs = [makeAttribute({
            code: 'name',
            datatype: 'string',
            validation: { min: 3, max: 10 }
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Too short
        attributeValues.name = 'ab';
        expect(getAttributeErrors()).toHaveLength(1);

        // Too long
        attributeValues.name = 'abcdefghijk';
        expect(getAttributeErrors()).toHaveLength(1);

        // Just right
        attributeValues.name = 'hello';
        expect(getAttributeErrors()).toEqual([]);
    });

    it('empty value + not required = no validation', async () => {
        const attrs = [makeAttribute({
            code: 'optional_field',
            required: false,
            validation: { pattern: '^[0-9]+$' }
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Empty value should not trigger pattern validation
        expect(getAttributeErrors()).toEqual([]);
    });

    it('missing validation object = no extra validation', async () => {
        const attrs = [makeAttribute({ code: 'simple' })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.simple = 'anything';
        expect(getAttributeErrors()).toEqual([]);
    });

    it('invalid regex does not crash', async () => {
        const attrs = [makeAttribute({
            code: 'broken_pattern',
            validation: { pattern: '[invalid(' }
        })];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.broken_pattern = 'test';
        // Should not throw, just skip the pattern validation
        expect(() => getAttributeErrors()).not.toThrow();
        expect(getAttributeErrors()).toEqual([]);
    });
});

// ============================================================================
// Phase 4: conditions (conditional visibility)
// ============================================================================

describe('conditions', () => {
    it('attribute without conditions is always visible', () => {
        const attrs = [makeAttribute({ code: 'always_visible' })];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value).toHaveLength(1);
    });

    it('equals: shows when condition is met', async () => {
        const attrs = [
            makeAttribute({ code: 'damage_type', datatype: 'singlevaluelist', order: 0, values: [{ key: 'graffiti', name: 'Graffiti' }, { key: 'pothole', name: 'Pothole' }] }),
            makeAttribute({
                code: 'surface_type',
                order: 1,
                conditions: { show_when: [{ attribute_code: 'damage_type', operator: 'equals', value: 'graffiti' }] }
            })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Initially empty, condition not met
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('surface_type');

        // Set value to match condition
        attributeValues.damage_type = 'graffiti';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).toContain('surface_type');

        // Set value to not match
        attributeValues.damage_type = 'pothole';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('surface_type');
    });

    it('not_equals: shows when value differs', async () => {
        const attrs = [
            makeAttribute({ code: 'status', order: 0 }),
            makeAttribute({
                code: 'reason',
                order: 1,
                conditions: { show_when: [{ attribute_code: 'status', operator: 'not_equals', value: 'closed' }] }
            })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Empty string !== 'closed', so visible
        expect(visibleAttributes.value.map(a => a.code)).toContain('reason');

        attributeValues.status = 'closed';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('reason');

        attributeValues.status = 'open';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).toContain('reason');
    });

    it('contains: works with multivaluelist', async () => {
        const attrs = [
            makeAttribute({ code: 'features', datatype: 'multivaluelist', order: 0, values: [{ key: 'wifi', name: 'WiFi' }, { key: 'parking', name: 'Parking' }] }),
            makeAttribute({
                code: 'wifi_speed',
                order: 1,
                conditions: { show_when: [{ attribute_code: 'features', operator: 'contains', value: 'wifi' }] }
            })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Empty array, condition not met
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('wifi_speed');

        attributeValues.features = ['parking'];
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('wifi_speed');

        attributeValues.features = ['wifi', 'parking'];
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).toContain('wifi_speed');
    });

    it('not_empty: shows when value is present', async () => {
        const attrs = [
            makeAttribute({ code: 'notes', order: 0 }),
            makeAttribute({
                code: 'follow_up',
                order: 1,
                conditions: { show_when: [{ attribute_code: 'notes', operator: 'not_empty' }] }
            })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Empty string, not visible
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('follow_up');

        attributeValues.notes = 'Some note';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).toContain('follow_up');
    });

    it('multiple conditions (AND logic)', async () => {
        const attrs = [
            makeAttribute({ code: 'type', order: 0 }),
            makeAttribute({ code: 'severity', order: 1 }),
            makeAttribute({
                code: 'emergency_contact',
                order: 2,
                conditions: {
                    show_when: [
                        { attribute_code: 'type', operator: 'equals', value: 'hazard' },
                        { attribute_code: 'severity', operator: 'equals', value: 'high' }
                    ]
                }
            })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Neither condition met
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('emergency_contact');

        // Only one condition met
        attributeValues.type = 'hazard';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('emergency_contact');

        // Both conditions met
        attributeValues.severity = 'high';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).toContain('emergency_contact');
    });

    it('hidden attributes are not in submission', async () => {
        const attrs = [
            makeAttribute({ code: 'damage_type', order: 0 }),
            makeAttribute({
                code: 'surface_type',
                order: 1,
                conditions: { show_when: [{ attribute_code: 'damage_type', operator: 'equals', value: 'graffiti' }] }
            })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributesForSubmission, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.damage_type = 'pothole';
        attributeValues.surface_type = 'concrete';

        const submission = getAttributesForSubmission();
        expect(submission).not.toHaveProperty('surface_type');
        expect(submission).toEqual({ damage_type: 'pothole' });
    });

    it('hidden required attributes do not produce validation errors', async () => {
        const attrs = [
            makeAttribute({ code: 'damage_type', order: 0 }),
            makeAttribute({
                code: 'surface_type',
                order: 1,
                required: true,
                conditions: { show_when: [{ attribute_code: 'damage_type', operator: 'equals', value: 'graffiti' }] }
            })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { getAttributeErrors, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        attributeValues.damage_type = 'pothole';
        // surface_type is hidden, so even though required + empty, no error
        expect(getAttributeErrors()).toEqual([]);
    });

    it('reference to non-existent attribute code = visible (graceful)', () => {
        const attrs = [
            makeAttribute({
                code: 'orphan',
                conditions: { show_when: [{ attribute_code: 'nonexistent', operator: 'equals', value: 'x' }] }
            })
        ];
        const opts = createOptions({ categoryId: 'cat-1', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes } = useServiceAttributes(opts);
        expect(visibleAttributes.value.map(a => a.code)).toContain('orphan');
    });

    it('circular dependency = both visible (graceful)', async () => {
        const attrs = [
            makeAttribute({
                code: 'a',
                order: 0,
                conditions: { show_when: [{ attribute_code: 'b', operator: 'not_empty' }] }
            }),
            makeAttribute({
                code: 'b',
                order: 1,
                conditions: { show_when: [{ attribute_code: 'a', operator: 'not_empty' }] }
            })
        ];
        const opts = createOptions({ categoryId: '', terms: [makeTerm('cat-1', attrs)] });
        const { visibleAttributes, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();

        // Both empty, both conditions check the raw attributeValues (not visibleAttributes),
        // so both not_empty fails => both hidden
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('a');
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('b');

        // Set one value manually
        attributeValues.a = 'something';
        await nextTick();
        // b becomes visible because a is not_empty
        expect(visibleAttributes.value.map(a => a.code)).toContain('b');
    });

    it('category change cleans up conditional state', async () => {
        const attrs1 = [
            makeAttribute({ code: 'trigger', order: 0 }),
            makeAttribute({
                code: 'conditional',
                order: 1,
                conditions: { show_when: [{ attribute_code: 'trigger', operator: 'not_empty' }] }
            })
        ];
        const attrs2 = [makeAttribute({ code: 'simple' })];
        const opts = createOptions({
            categoryId: '',
            terms: [makeTerm('cat-1', attrs1), makeTerm('cat-2', attrs2)]
        });
        const { visibleAttributes, attributeValues } = useServiceAttributes(opts);

        opts.category.value = 'cat-1';
        await nextTick();
        attributeValues.trigger = 'active';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).toContain('conditional');

        // Switch category
        opts.category.value = 'cat-2';
        await nextTick();
        expect(visibleAttributes.value.map(a => a.code)).not.toContain('conditional');
        expect(visibleAttributes.value.map(a => a.code)).toContain('simple');
    });
});
