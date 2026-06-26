/**
 * DynamicFieldInput unit tests
 *
 * Verifies the per-branch render decisions: boolean -> USwitch with on_label,
 * list_string in both array and keyed-object form, fallback to UInput, and
 * the type of value emitted on update:modelValue.
 *
 * Uses lightweight component stubs so tests don't depend on Nuxt UI internals.
 */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';

import DynamicFieldInput from '../../../../../app/components/dashboard/form/DynamicFieldInput.vue';

const passthroughProps = ['modelValue', 'label', 'ariaLabel', 'placeholder', 'items', 'type', 'rows', 'loading', 'valueKey', 'labelKey', 'class'];

const makeStub = (tag: string) => defineComponent({
    name: tag,
    inheritAttrs: false,
    props: {
        modelValue: { type: [String, Number, Boolean, Object, Array, null], default: undefined },
        label: { type: String, default: '' },
        placeholder: { type: String, default: '' },
        items: { type: Array, default: () => [] },
        type: { type: String, default: '' },
        rows: { type: [String, Number], default: 0 },
        loading: { type: Boolean, default: false },
        valueKey: { type: String, default: '' },
        labelKey: { type: String, default: '' }
    },
    emits: ['update:modelValue'],
    setup(props, { emit, slots, attrs }) {
        return () => h(
            'div',
            {
                'data-stub': tag,
                'data-model-value': JSON.stringify(props.modelValue ?? null),
                'data-label': props.label,
                'data-aria-label': (attrs['aria-label'] as string) ?? '',
                'data-type': props.type,
                'data-items': JSON.stringify(props.items),
                'data-rows': String(props.rows),
                'data-loading': String(props.loading)
            },
            [
                slots.default?.(),
                h('button', {
                    'data-testid': `${tag}-emit-true`,
                    'onClick': () => emit('update:modelValue', true)
                }),
                h('button', {
                    'data-testid': `${tag}-emit-false`,
                    'onClick': () => emit('update:modelValue', false)
                }),
                h('button', {
                    'data-testid': `${tag}-emit-text`,
                    'onClick': () => emit('update:modelValue', 'hello')
                })
            ]
        );
    }
});

const stubs = {
    UInput: makeStub('UInput'),
    UTextarea: makeStub('UTextarea'),
    USwitch: makeStub('USwitch'),
    USelectMenu: makeStub('USelectMenu')
};

const mountInput = (props: Record<string, unknown>) =>
    mount(DynamicFieldInput, {
        props,
        global: { stubs }
    });

describe('DynamicFieldInput', () => {
    it('boolean field renders a USwitch with no visible label (outer UFormField owns it)', () => {
        const wrapper = mountInput({
            fieldName: 'field_reassign_sp',
            fieldConfig: {
                field_type: 'boolean',
                label: 'Dienstleister neu zuweisen',
                settings: { on_label: 'An', off_label: 'Aus' }
            },
            modelValue: false
        });

        const sw = wrapper.find('[data-stub="USwitch"]');
        expect(sw.exists()).toBe(true);
        // Inner switch must NOT render a per-field label — the outer
        // UFormField provides the visual + accessible name. Otherwise
        // we re-introduce the double-label / locale-mismatch bug.
        expect(sw.attributes('data-label')).toBe('');
        // Aria-label still exists as a screen-reader fallback when the
        // switch is rendered outside of a UFormField wrapper.
        expect(sw.attributes('data-aria-label')).toBe('Dienstleister neu zuweisen');
    });

    it('boolean field with modelValue=false does NOT render literal "false" string anywhere', () => {
        const wrapper = mountInput({
            fieldName: 'field_reassign_sp',
            fieldConfig: {
                field_type: 'boolean',
                label: 'Reassign SP',
                settings: { on_label: 'Yes' }
            },
            modelValue: false
        });

        // No fallback UInput should appear
        expect(wrapper.find('[data-stub="UInput"]').exists()).toBe(false);
        // Visible text content must not contain the literal token "false"
        expect(wrapper.text()).not.toContain('false');
    });

    it('boolean field coerces stringy "false" to unchecked', () => {
        const wrapper = mountInput({
            fieldName: 'field_reassign_sp',
            fieldConfig: {
                field_type: 'boolean',
                settings: { on_label: 'On' }
            },
            modelValue: 'false'
        });

        const sw = wrapper.find('[data-stub="USwitch"]');
        expect(sw.exists()).toBe(true);
        expect(sw.attributes('data-model-value')).toBe('false');
    });

    it('boolean field renders USwitch when widget=boolean_checkbox even if field_type missing', () => {
        const wrapper = mountInput({
            fieldName: 'field_some_flag',
            fieldConfig: {
                field_type: 'string',
                widget: 'boolean_checkbox',
                label: 'Some Flag',
                settings: { on_label: 'Active' }
            },
            modelValue: true
        });

        const sw = wrapper.find('[data-stub="USwitch"]');
        expect(sw.exists()).toBe(true);
        expect(sw.attributes('data-aria-label')).toBe('Some Flag');
    });

    it('boolean field aria-label falls back to humanized fieldName when label is empty', () => {
        const wrapper = mountInput({
            fieldName: 'field_reassign_sp',
            fieldConfig: {
                field_type: 'boolean'
            },
            modelValue: false
        });

        const sw = wrapper.find('[data-stub="USwitch"]');
        expect(sw.attributes('data-aria-label')).toBe('Reassign Sp');
    });

    it('boolean field aria-label falls back to common.toggle when label and fieldName resolve to empty', () => {
        const wrapper = mountInput({
            fieldName: '',
            fieldConfig: { field_type: 'boolean' },
            modelValue: false
        });

        const sw = wrapper.find('[data-stub="USwitch"]');
        // global useI18n stub returns te()=false, so the i18n branch falls
        // through to the literal 'Toggle' default.
        expect(sw.attributes('data-aria-label')).toBe('Toggle');
    });

    it('boolean field coerces stringy "FALSE" (uppercase, surrounding spaces) to unchecked', () => {
        const wrapper = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean' },
            modelValue: '  FALSE '
        });

        const sw = wrapper.find('[data-stub="USwitch"]');
        expect(sw.attributes('data-model-value')).toBe('false');
    });

    it('boolean field coerces unknown string ("foo") to unchecked, not checked', () => {
        const wrapper = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean' },
            modelValue: 'foo'
        });

        const sw = wrapper.find('[data-stub="USwitch"]');
        // Old logic would have rendered this as checked (else->true).
        // New opt-in semantics: only "true" / "1" count as truthy.
        expect(sw.attributes('data-model-value')).toBe('false');
    });

    it('boolean field coerces stringy "TRUE" (uppercase) to checked', () => {
        const wrapper = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean' },
            modelValue: 'TRUE'
        });

        const sw = wrapper.find('[data-stub="USwitch"]');
        expect(sw.attributes('data-model-value')).toBe('true');
    });

    it('boolean state-text span is clickable and toggles the switch', async () => {
        const wrapper = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean' },
            modelValue: false
        });

        // Find the state-text span (test-id hook, sibling of USwitch).
        const span = wrapper.find('[data-testid="boolean-state-text"]');
        expect(span.exists()).toBe(true);
        await span.trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const last = emitted![emitted!.length - 1];
        // false -> click -> true
        expect(last[0]).toBe(true);
        expect(typeof last[0]).toBe('boolean');
    });

    it('boolean field renders localized state-text next to the switch (aria-hidden, derived from booleanValue)', () => {
        const a = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean' },
            modelValue: true
        });
        // The mocked useI18n returns the key literal, so a checked switch
        // renders the `common.on` token. Real i18n resolves to `On`/`An`/etc.
        expect(a.text()).toContain('common.on');
        expect(a.text()).not.toContain('common.off');

        const b = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean' },
            modelValue: false
        });
        expect(b.text()).toContain('common.off');
        expect(b.text()).not.toContain('common.on');
    });

    it('boolean field coerces numeric 1 / 0 correctly', () => {
        const a = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean' },
            modelValue: 1
        });
        expect(a.find('[data-stub="USwitch"]').attributes('data-model-value')).toBe('true');

        const b = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean' },
            modelValue: 0
        });
        expect(b.find('[data-stub="USwitch"]').attributes('data-model-value')).toBe('false');
    });

    it('list_string with object-keyed allowed_values renders USelectMenu items', () => {
        const wrapper = mountInput({
            fieldName: 'field_priority',
            fieldConfig: {
                field_type: 'list_string',
                settings: {
                    allowed_values: { low: 'Low', high: 'High' }
                }
            },
            modelValue: 'low'
        });

        const sel = wrapper.find('[data-stub="USelectMenu"]');
        expect(sel.exists()).toBe(true);
        const items = JSON.parse(sel.attributes('data-items') || '[]');
        expect(items).toEqual([
            { value: 'low', label: 'Low' },
            { value: 'high', label: 'High' }
        ]);
    });

    it('list_string with array allowed_values renders USelectMenu items', () => {
        const wrapper = mountInput({
            fieldName: 'field_priority',
            fieldConfig: {
                field_type: 'list_string',
                settings: {
                    allowed_values: [
                        { value: 'low', label: 'Low' },
                        { value: 'high', label: 'High' }
                    ]
                }
            },
            modelValue: 'high'
        });

        const sel = wrapper.find('[data-stub="USelectMenu"]');
        expect(sel.exists()).toBe(true);
        const items = JSON.parse(sel.attributes('data-items') || '[]');
        expect(items).toEqual([
            { value: 'low', label: 'Low' },
            { value: 'high', label: 'High' }
        ]);
    });

    it('field_type=string falls back to UInput', () => {
        const wrapper = mountInput({
            fieldName: 'field_object_id',
            fieldConfig: { field_type: 'string' },
            modelValue: 'abc'
        });

        const inp = wrapper.find('[data-stub="UInput"]');
        expect(inp.exists()).toBe(true);
        expect(inp.attributes('data-model-value')).toBe('"abc"');
    });

    it('field_type=email renders UInput type=email', () => {
        const wrapper = mountInput({
            fieldName: 'field_email',
            fieldConfig: { field_type: 'email' },
            modelValue: 'a@b.de'
        });

        const inp = wrapper.find('[data-stub="UInput"]');
        expect(inp.attributes('data-type')).toBe('email');
    });

    it('field_type=text_long renders UTextarea', () => {
        const wrapper = mountInput({
            fieldName: 'field_notes',
            fieldConfig: { field_type: 'text_long' },
            modelValue: 'foo'
        });

        expect(wrapper.find('[data-stub="UTextarea"]').exists()).toBe(true);
    });

    it('entity_reference with selectItems renders USelectMenu and passes loading', () => {
        const wrapper = mountInput({
            fieldName: 'field_service_provider_status',
            fieldConfig: { field_type: 'entity_reference' },
            modelValue: { id: 7 },
            selectItems: [
                { value: 1, label: 'New' },
                { value: 7, label: 'Done' }
            ],
            selectLoading: true
        });

        const sel = wrapper.find('[data-stub="USelectMenu"]');
        expect(sel.exists()).toBe(true);
        expect(sel.attributes('data-loading')).toBe('true');
    });

    it('entity_reference WITHOUT selectItems falls back to UInput', () => {
        const wrapper = mountInput({
            fieldName: 'field_other_ref',
            fieldConfig: { field_type: 'entity_reference' },
            modelValue: ''
        });

        expect(wrapper.find('[data-stub="UInput"]').exists()).toBe(true);
        expect(wrapper.find('[data-stub="USelectMenu"]').exists()).toBe(false);
    });

    it('boolean branch emits real boolean on update:modelValue', async () => {
        const wrapper = mountInput({
            fieldName: 'field_flag',
            fieldConfig: { field_type: 'boolean', settings: { on_label: 'On' } },
            modelValue: false
        });

        await wrapper.find('[data-testid="USwitch-emit-true"]').trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const last = emitted![emitted!.length - 1];
        expect(last[0]).toBe(true);
        expect(typeof last[0]).toBe('boolean');
    });

    it('text input branch emits string on update:modelValue', async () => {
        const wrapper = mountInput({
            fieldName: 'field_object_id',
            fieldConfig: { field_type: 'string' },
            modelValue: ''
        });

        await wrapper.find('[data-testid="UInput-emit-text"]').trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const last = emitted![emitted!.length - 1];
        expect(last[0]).toBe('hello');
        expect(typeof last[0]).toBe('string');
    });

    it('null modelValue does not render literal "null" or "false" in fallback input', () => {
        const wrapper = mountInput({
            fieldName: 'field_object_id',
            fieldConfig: { field_type: 'string' },
            modelValue: null
        });

        const inp = wrapper.find('[data-stub="UInput"]');
        expect(inp.exists()).toBe(true);
        // Coerced to ''
        expect(inp.attributes('data-model-value')).toBe('""');
        expect(wrapper.text()).not.toContain('false');
        expect(wrapper.text()).not.toContain('null');
    });
});

// Suppress unused-binding warning for `passthroughProps` (kept for reference).
void passthroughProps;
