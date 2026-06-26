/**
 * AI Analysis unit tests.
 *
 * Covers two pure helpers of the AI analysis composable:
 * - shouldShowPrivacyWarning: when the citizen privacy prompt is shown vs.
 *   suppressed after blur preprocessing.
 * - applyAIAttributes: the convergence loop that applies AI-suggested attribute
 *   values, handling conditional attributes at any chain depth.
 *
 * @see app/composables/form/useAIAnalysis.ts
 */
import { describe, it, expect } from 'vitest';
import { ref, reactive, computed } from 'vue';
import { applyAIAttributes, shouldShowPrivacyWarning, shouldRequestManualCategory, resolveBlurredPreview } from '@/composables/form/useAIAnalysis';
import type { ServiceDefinitionAttribute } from '~~/types/category';

// ============================================================================
// Helpers
// ============================================================================

function makeAttr(overrides: Partial<ServiceDefinitionAttribute> = {}): ServiceDefinitionAttribute {
    return {
        code: 'attr',
        variable: true,
        datatype: 'string',
        required: false,
        description: 'Test',
        order: 0,
        ...overrides
    };
}

/**
 * Build a visibleAttributes computed ref that mirrors the real useServiceAttributes:
 * filters to variable === true, evaluates conditions against attributeValues.
 */
function buildVisibleAttributes(
    allAttrs: ServiceDefinitionAttribute[],
    attributeValues: Record<string, any>
) {
    return computed(() => {
        return allAttrs
            .filter(a => a.variable)
            .filter((a) => {
                const conditions = a.conditions?.show_when;
                if (!conditions || conditions.length === 0) return true;

                return conditions.every((c) => {
                    // Mirror production: if referenced attribute doesn't exist, treat as visible
                    const depAttr = allAttrs.find(a => a.code === c.attribute_code);
                    if (!depAttr) return true;

                    const val = attributeValues[c.attribute_code];
                    switch (c.operator) {
                        case 'equals':
                            return String(val ?? '') === (c.value ?? '');
                        case 'not_equals':
                            return String(val ?? '') !== (c.value ?? '');
                        case 'contains':
                            return Array.isArray(val) && val.includes(c.value);
                        case 'not_empty':
                            return val !== undefined && val !== null && val !== '' &&
                              !(Array.isArray(val) && val.length === 0);
                        default:
                            return true;
                    }
                });
            })
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
}

// ============================================================================
// Basic application
// ============================================================================

describe('shouldShowPrivacyWarning', () => {
    it('shows warning for unhandled privacy issues', () => {
        expect(shouldShowPrivacyWarning({
            privacy_flag: true,
            privacy_issues: ['face visible']
        })).toBe(true);
    });

    it('suppresses warning when privacy was handled by blur', () => {
        expect(shouldShowPrivacyWarning({
            privacy_flag: true,
            privacy_issues: ['blurred face visible'],
            privacy_handled_by_blur: true
        })).toBe(false);
    });

    it('does not show warning without issues', () => {
        expect(shouldShowPrivacyWarning({
            privacy_flag: true,
            privacy_issues: []
        })).toBe(false);
    });

    it('does not show warning when privacy flag is false', () => {
        expect(shouldShowPrivacyWarning({
            privacy_flag: false,
            privacy_issues: []
        })).toBe(false);
    });

    it('shows warning when blur did not handle it (privacy_handled_by_blur false)', () => {
        // The backend sets privacy_handled_by_blur=false when the blur service
        // did not blur (no faces/plates detected); the notice must then show.
        expect(shouldShowPrivacyWarning({
            privacy_flag: true,
            privacy_issues: ['readable ID document visible'],
            privacy_handled_by_blur: false
        })).toBe(true);
    });
});

describe('shouldRequestManualCategory', () => {
    it('requests manual category when the image is not a reportable issue', () => {
        expect(shouldRequestManualCategory({ is_reportable_issue: false })).toBe(true);
    });

    it('does not request manual category for a reportable issue', () => {
        expect(shouldRequestManualCategory({ is_reportable_issue: true })).toBe(false);
    });

    it('keeps auto-fill (false) when the field is omitted by an older backend', () => {
        expect(shouldRequestManualCategory({})).toBe(false);
    });
});

describe('resolveBlurredPreview', () => {
    it('returns the data URL for a matching media id', () => {
        const previews = { 'uuid-1': 'data:image/jpeg;base64,AAAA' };
        expect(resolveBlurredPreview('uuid-1', previews)).toBe('data:image/jpeg;base64,AAAA');
    });

    it('returns null when the media id has no blurred preview', () => {
        expect(resolveBlurredPreview('uuid-2', { 'uuid-1': 'data:image/jpeg;base64,AAAA' })).toBeNull();
    });

    it('returns null when previews are absent', () => {
        expect(resolveBlurredPreview('uuid-1', undefined)).toBeNull();
    });

    it('rejects a non-data URL (guards against bad image src)', () => {
        expect(resolveBlurredPreview('uuid-1', { 'uuid-1': 'https://evil.example/x.jpg' })).toBeNull();
    });
});

describe('applyAIAttributes', () => {
    it('applies simple string attributes', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'note', datatype: 'string' })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'note', value: 'cracked sidewalk' }],
            values,
            visible
        );

        expect(count).toBe(1);
        expect(values.note).toBe('cracked sidewalk');
    });

    it('validates singlevaluelist against allowlist', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({
            code: 'severity',
            datatype: 'singlevaluelist',
            values: [{ key: 'low', name: 'Low' }, { key: 'high', name: 'High' }]
        })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'severity', value: 'medium' }],
            values,
            visible
        );

        expect(count).toBe(0);
        expect(values.severity).toBeUndefined();
    });

    it('applies valid singlevaluelist values', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({
            code: 'severity',
            datatype: 'singlevaluelist',
            values: [{ key: 'low', name: 'Low' }, { key: 'high', name: 'High' }]
        })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'severity', value: 'high' }],
            values,
            visible
        );

        expect(count).toBe(1);
        expect(values.severity).toBe('high');
    });

    it('strips HTML from values', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'desc', datatype: 'string' })];
        const visible = buildVisibleAttributes(attrs, values);

        applyAIAttributes(
            [{ code: 'desc', value: '<b>broken</b> light' }],
            values,
            visible
        );

        expect(values.desc).toBe('broken light');
    });

    it('skips null/empty values', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'a' }), makeAttr({ code: 'b' })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'a', value: null }, { code: 'b', value: '' }],
            values,
            visible
        );

        expect(count).toBe(0);
    });

    it('skips imagelist type', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'photo', datatype: 'imagelist' })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'photo', value: 'img-123' }],
            values,
            visible
        );

        expect(count).toBe(0);
    });

    it('validates number range', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({
            code: 'count',
            datatype: 'number',
            validation: { min: 1, max: 10 }
        })];
        const visible = buildVisibleAttributes(attrs, values);

        expect(applyAIAttributes([{ code: 'count', value: '0' }], values, visible)).toBe(0);
        expect(applyAIAttributes([{ code: 'count', value: '5' }], values, visible)).toBe(1);
        expect(values.count).toBe(5);
    });

    it('applies number without validation rules', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'amount', datatype: 'number' })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes([{ code: 'amount', value: '42' }], values, visible);

        expect(count).toBe(1);
        expect(values.amount).toBe(42);
    });

    it('rejects NaN for number type', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'amount', datatype: 'number' })];
        const visible = buildVisibleAttributes(attrs, values);

        expect(applyAIAttributes([{ code: 'amount', value: 'abc' }], values, visible)).toBe(0);
    });

    it('applies text datatype same as string', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'details', datatype: 'text' })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'details', value: 'Long description here' }],
            values,
            visible
        );

        expect(count).toBe(1);
        expect(values.details).toBe('Long description here');
    });

    it('validates datetime format', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'when', datatype: 'datetime' })];
        const visible = buildVisibleAttributes(attrs, values);

        expect(applyAIAttributes([{ code: 'when', value: 'yesterday' }], values, visible)).toBe(0);
        expect(applyAIAttributes([{ code: 'when', value: '2026-04-11T14:30' }], values, visible)).toBe(1);
        expect(values.when).toBe('2026-04-11T14:30');
    });

    it('trims whitespace from singlevaluelist values', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({
            code: 'level',
            datatype: 'singlevaluelist',
            values: [{ key: 'high', name: 'High' }]
        })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes([{ code: 'level', value: ' high ' }], values, visible);

        expect(count).toBe(1);
        expect(values.level).toBe('high');
    });
});

// ============================================================================
// Conditional attributes - depth 1
// ============================================================================

describe('conditional attributes - depth 1', () => {
    const buildChain1 = () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [
            makeAttr({
                code: 'damage_type',
                datatype: 'singlevaluelist',
                values: [{ key: 'structural', name: 'Structural' }, { key: 'cosmetic', name: 'Cosmetic' }],
                order: 0
            }),
            makeAttr({
                code: 'severity',
                datatype: 'singlevaluelist',
                values: [{ key: 'low', name: 'Low' }, { key: 'critical', name: 'Critical' }],
                order: 1,
                conditions: {
                    show_when: [{ attribute_code: 'damage_type', operator: 'equals' as const, value: 'structural' }]
                }
            })
        ];
        const visible = buildVisibleAttributes(attrs, values);
        return { values, visible };
    };

    it('applies conditional when trigger comes first', () => {
        const { values, visible } = buildChain1();

        const count = applyAIAttributes(
            [
                { code: 'damage_type', value: 'structural' },
                { code: 'severity', value: 'critical' }
            ],
            values,
            visible
        );

        expect(count).toBe(2);
        expect(values.damage_type).toBe('structural');
        expect(values.severity).toBe('critical');
    });

    it('applies conditional when trigger comes last (wrong order)', () => {
        const { values, visible } = buildChain1();

        const count = applyAIAttributes(
            [
                { code: 'severity', value: 'critical' },
                { code: 'damage_type', value: 'structural' }
            ],
            values,
            visible
        );

        expect(count).toBe(2);
        expect(values.damage_type).toBe('structural');
        expect(values.severity).toBe('critical');
    });

    it('does not apply conditional when trigger value mismatches', () => {
        const { values, visible } = buildChain1();

        const count = applyAIAttributes(
            [
                { code: 'damage_type', value: 'cosmetic' },
                { code: 'severity', value: 'critical' }
            ],
            values,
            visible
        );

        expect(count).toBe(1);
        expect(values.damage_type).toBe('cosmetic');
        expect(values.severity).toBeUndefined();
    });
});

// ============================================================================
// Conditional attributes - depth 2+ (the critical fix)
// ============================================================================

describe('conditional attributes - depth 2 chain', () => {
    const buildChain2 = () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [
            makeAttr({
                code: 'category',
                datatype: 'singlevaluelist',
                values: [{ key: 'road', name: 'Road' }, { key: 'park', name: 'Park' }],
                order: 0
            }),
            makeAttr({
                code: 'road_type',
                datatype: 'singlevaluelist',
                values: [{ key: 'pothole', name: 'Pothole' }, { key: 'crack', name: 'Crack' }],
                order: 1,
                conditions: {
                    show_when: [{ attribute_code: 'category', operator: 'equals' as const, value: 'road' }]
                }
            }),
            makeAttr({
                code: 'pothole_size',
                datatype: 'singlevaluelist',
                values: [{ key: 'small', name: 'Small' }, { key: 'large', name: 'Large' }],
                order: 2,
                conditions: {
                    show_when: [{ attribute_code: 'road_type', operator: 'equals' as const, value: 'pothole' }]
                }
            })
        ];
        const visible = buildVisibleAttributes(attrs, values);
        return { values, visible };
    };

    it('resolves full chain when AI delivers in correct order', () => {
        const { values, visible } = buildChain2();

        const count = applyAIAttributes(
            [
                { code: 'category', value: 'road' },
                { code: 'road_type', value: 'pothole' },
                { code: 'pothole_size', value: 'large' }
            ],
            values,
            visible
        );

        expect(count).toBe(3);
        expect(values.pothole_size).toBe('large');
    });

    it('resolves full chain when AI delivers in reverse order', () => {
        const { values, visible } = buildChain2();

        const count = applyAIAttributes(
            [
                { code: 'pothole_size', value: 'large' },
                { code: 'road_type', value: 'pothole' },
                { code: 'category', value: 'road' }
            ],
            values,
            visible
        );

        expect(count).toBe(3);
        expect(values.category).toBe('road');
        expect(values.road_type).toBe('pothole');
        expect(values.pothole_size).toBe('large');
    });

    it('resolves full chain when AI delivers in scrambled order', () => {
        const { values, visible } = buildChain2();

        const count = applyAIAttributes(
            [
                { code: 'road_type', value: 'pothole' },
                { code: 'pothole_size', value: 'large' },
                { code: 'category', value: 'road' }
            ],
            values,
            visible
        );

        expect(count).toBe(3);
        expect(values.pothole_size).toBe('large');
    });

    it('stops at the broken link when intermediate trigger mismatches', () => {
        const { values, visible } = buildChain2();

        const count = applyAIAttributes(
            [
                { code: 'category', value: 'road' },
                { code: 'road_type', value: 'crack' },
                { code: 'pothole_size', value: 'large' }
            ],
            values,
            visible
        );

        expect(count).toBe(2);
        expect(values.road_type).toBe('crack');
        expect(values.pothole_size).toBeUndefined();
    });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('edge cases', () => {
    it('terminates on circular conditions (no infinite loop)', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [
            makeAttr({
                code: 'a',
                conditions: { show_when: [{ attribute_code: 'b', operator: 'not_empty' as const }] }
            }),
            makeAttr({
                code: 'b',
                conditions: { show_when: [{ attribute_code: 'a', operator: 'not_empty' as const }] }
            })
        ];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'a', value: 'x' }, { code: 'b', value: 'y' }],
            values,
            visible
        );

        // Neither can be applied because both depend on the other
        expect(count).toBe(0);
    });

    it('handles multivaluelist with contains condition', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [
            makeAttr({
                code: 'tags',
                datatype: 'multivaluelist',
                values: [{ key: 'urgent', name: 'Urgent' }, { key: 'safety', name: 'Safety' }]
            }),
            makeAttr({
                code: 'escalation_note',
                datatype: 'string',
                conditions: {
                    show_when: [{ attribute_code: 'tags', operator: 'contains' as const, value: 'urgent' }]
                }
            })
        ];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [
                { code: 'escalation_note', value: 'needs immediate attention' },
                { code: 'tags', value: 'urgent,safety' }
            ],
            values,
            visible
        );

        expect(count).toBe(2);
        expect(values.tags).toEqual(['urgent', 'safety']);
        expect(values.escalation_note).toBe('needs immediate attention');
    });

    it('returns 0 for empty input', () => {
        const values = reactive<Record<string, any>>({});
        const visible = buildVisibleAttributes([], values);

        expect(applyAIAttributes([], values, visible)).toBe(0);
    });

    it('applies conditional with not_equals operator', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [
            makeAttr({
                code: 'status',
                datatype: 'singlevaluelist',
                values: [{ key: 'open', name: 'Open' }, { key: 'closed', name: 'Closed' }]
            }),
            makeAttr({
                code: 'reason',
                datatype: 'string',
                conditions: {
                    show_when: [{ attribute_code: 'status', operator: 'not_equals' as const, value: 'closed' }]
                }
            })
        ];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'status', value: 'open' }, { code: 'reason', value: 'still pending' }],
            values,
            visible
        );

        expect(count).toBe(2);
        expect(values.reason).toBe('still pending');
    });

    it('does not apply when not_equals condition fails', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [
            makeAttr({
                code: 'status',
                datatype: 'singlevaluelist',
                values: [{ key: 'open', name: 'Open' }, { key: 'closed', name: 'Closed' }]
            }),
            makeAttr({
                code: 'reason',
                datatype: 'string',
                conditions: {
                    show_when: [{ attribute_code: 'status', operator: 'not_equals' as const, value: 'closed' }]
                }
            })
        ];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'status', value: 'closed' }, { code: 'reason', value: 'done' }],
            values,
            visible
        );

        expect(count).toBe(1);
        expect(values.reason).toBeUndefined();
    });

    it('requires all show_when conditions (AND logic)', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [
            makeAttr({
                code: 'type',
                datatype: 'singlevaluelist',
                values: [{ key: 'road', name: 'Road' }]
            }),
            makeAttr({
                code: 'urgent',
                datatype: 'singlevaluelist',
                values: [{ key: 'yes', name: 'Yes' }, { key: 'no', name: 'No' }]
            }),
            makeAttr({
                code: 'dispatch_note',
                datatype: 'string',
                conditions: {
                    show_when: [
                        { attribute_code: 'type', operator: 'equals' as const, value: 'road' },
                        { attribute_code: 'urgent', operator: 'equals' as const, value: 'yes' }
                    ]
                }
            })
        ];
        const visible = buildVisibleAttributes(attrs, values);

        // Only one condition met: dispatch_note stays hidden
        const count1 = applyAIAttributes(
            [
                { code: 'type', value: 'road' },
                { code: 'dispatch_note', value: 'send crew' }
            ],
            values,
            visible
        );

        expect(count1).toBe(1);
        expect(values.dispatch_note).toBeUndefined();

        // Now set the second condition too
        const count2 = applyAIAttributes(
            [
                { code: 'urgent', value: 'yes' },
                { code: 'dispatch_note', value: 'send crew' }
            ],
            values,
            visible
        );

        expect(count2).toBe(2);
        expect(values.dispatch_note).toBe('send crew');
    });

    it('treats condition referencing non-existent attribute as visible', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [
            makeAttr({
                code: 'orphan',
                datatype: 'string',
                conditions: {
                    show_when: [{ attribute_code: 'deleted_field', operator: 'equals' as const, value: 'x' }]
                }
            })
        ];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'orphan', value: 'still works' }],
            values,
            visible
        );

        // Graceful: non-existent dependency = condition treated as true
        expect(count).toBe(1);
        expect(values.orphan).toBe('still works');
    });

    it('ignores unknown attribute codes', () => {
        const values = reactive<Record<string, any>>({});
        const attrs = [makeAttr({ code: 'known' })];
        const visible = buildVisibleAttributes(attrs, values);

        const count = applyAIAttributes(
            [{ code: 'unknown_field', value: 'something' }, { code: 'known', value: 'valid' }],
            values,
            visible
        );

        expect(count).toBe(1);
        expect(values.known).toBe('valid');
        expect(values.unknown_field).toBeUndefined();
    });
});
