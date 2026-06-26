import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';

const { default: ServiceAttributes } = await import('../../../../app/components/form/ServiceAttributes.vue');

const optionGroupStub = (name: string) => defineComponent({
    name,
    inheritAttrs: false,
    props: {
        legend: { type: String, default: '' }
    },
    setup(props, { attrs }) {
        return () => h('fieldset', {
            ...attrs,
            'data-component': name
        }, [
            h('legend', props.legend)
        ]);
    }
});

const stubs = {
    ImageListSelector: defineComponent({ name: 'ImageListSelector', setup: () => () => h('div') }),
    UFormField: defineComponent({ name: 'UFormField', setup: (_props, { slots }) => () => h('div', slots.default?.()) }),
    UInput: defineComponent({ name: 'UInput', setup: () => () => h('input') }),
    UInputDate: defineComponent({ name: 'UInputDate', setup: () => () => h('input') }),
    UInputNumber: defineComponent({ name: 'UInputNumber', setup: () => () => h('input') }),
    URadioGroup: optionGroupStub('URadioGroup'),
    UCheckboxGroup: optionGroupStub('UCheckboxGroup'),
    USelectMenu: defineComponent({ name: 'USelectMenu', setup: () => () => h('select') }),
    UTextarea: defineComponent({ name: 'UTextarea', setup: () => () => h('textarea') })
};

describe('ServiceAttributes', () => {
    it('renders inline errors for radio and checkbox attributes', () => {
        const wrapper = mount(ServiceAttributes, {
            props: {
                attributes: [
                    {
                        code: 'damage_type',
                        datatype: 'singlevaluelist',
                        description: 'Damage type',
                        required: true,
                        values: [
                            { key: 'small', name: 'Small' },
                            { key: 'large', name: 'Large' }
                        ]
                    },
                    {
                        code: 'affected_parts',
                        datatype: 'multivaluelist',
                        description: 'Affected parts',
                        required: true,
                        values: [
                            { key: 'street', name: 'Street' },
                            { key: 'sidewalk', name: 'Sidewalk' }
                        ]
                    }
                ],
                modelValue: {},
                errors: {
                    damage_type: 'Choose a damage type.',
                    affected_parts: 'Choose at least one affected part.'
                }
            },
            global: { stubs }
        });

        const radio = wrapper.find('[data-component="URadioGroup"]');
        const checkbox = wrapper.find('[data-component="UCheckboxGroup"]');
        const radioError = wrapper.find('#service-attribute-error-damage_type');
        const checkboxError = wrapper.find('#service-attribute-error-affected_parts');

        expect(radio.attributes('aria-describedby')).toBe('service-attribute-error-damage_type');
        expect(checkbox.attributes('aria-describedby')).toBe('service-attribute-error-affected_parts');
        expect(radioError.attributes('role')).toBe('alert');
        expect(checkboxError.attributes('role')).toBe('alert');
        expect(radioError.text()).toBe('Choose a damage type.');
        expect(checkboxError.text()).toBe('Choose at least one affected part.');
    });
});
