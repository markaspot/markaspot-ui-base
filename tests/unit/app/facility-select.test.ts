import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, useAttrs } from 'vue';
import { describe, expect, it } from 'vitest';

import FacilitySelect from '../../../app/components/form/FacilitySelect.vue';

const UFormFieldStub = defineComponent({
    setup(_, { slots }) {
        return () => h('div', {}, slots.default?.());
    }
});

const AppSelectMenuStub = defineComponent({
    inheritAttrs: false,
    props: {
        modelValue: {
            type: Object,
            default: null
        },
        items: {
            type: Array,
            default: () => []
        }
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const attrs = useAttrs();

        return () => h('div', {}, [
            h('div', { 'data-testid': 'searchable' }, String('searchable' in attrs)),
            h('div', { 'data-testid': 'data-field' }, String(attrs['data-field'] || '')),
            h('div', { 'data-testid': 'selected-label' }, (props.modelValue as { label?: string } | null)?.label || ''),
            h('button', {
                'type': 'button',
                'data-testid': 'select-second',
                'onClick': () => emit('update:modelValue', (props.items as Array<{ label: string, value: string }>)[1] || null)
            }, 'select')
        ]);
    }
});

describe('FacilitySelect', () => {
    it('maps primitive model values to select option objects and emits primitive ids back', async () => {
        const wrapper = mount(FacilitySelect, {
            props: {
                modelValue: 'stadsloket-centrum',
                items: [
                    { label: 'Stadsloket Centrum', value: 'stadsloket-centrum' },
                    { label: 'Stadsloket West', value: 'stadsloket-west' }
                ],
                facilities: [
                    {
                        id: 'stadsloket-centrum',
                        label: 'Stadsloket Centrum',
                        lat: 52.3676842,
                        lng: 4.9002256,
                        address: 'Amstel 1, 1011 PN Amsterdam',
                        active: true
                    },
                    {
                        id: 'stadsloket-west',
                        label: 'Stadsloket West',
                        lat: 52.3781391,
                        lng: 4.8452606,
                        address: 'Bos en Lommerplein 250, 1055 EK Amsterdam',
                        active: true
                    }
                ],
                label: 'Stadsloket',
                placeholder: 'Select stadsloket',
                searchPlaceholder: 'Search stadsloket'
            },
            global: {
                stubs: {
                    UFormField: UFormFieldStub,
                    AppSelectMenu: AppSelectMenuStub
                }
            }
        });

        expect(wrapper.get('[data-testid="selected-label"]').text()).toBe('Stadsloket Centrum');
        expect(wrapper.get('[data-testid="searchable"]').text()).toBe('true');
        expect(wrapper.get('[data-testid="data-field"]').text()).toBe('field_facility');
        expect(wrapper.text()).toContain('Amstel 1, 1011 PN Amsterdam');

        await wrapper.get('[data-testid="select-second"]').trigger('click');
        await nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['stadsloket-west']]);

        await wrapper.setProps({ modelValue: '' });
        await nextTick();

        expect(wrapper.get('[data-testid="selected-label"]').text()).toBe('');
        expect(wrapper.text()).not.toContain('Amstel 1, 1011 PN Amsterdam');
    });

    it('renders structured FacilityAddress as a human-readable display string', async () => {
        const wrapper = mount(FacilitySelect, {
            props: {
                modelValue: 'facility-a',
                items: [{ label: 'Facility A', value: 'facility-a' }],
                facilities: [
                    {
                        id: 'facility-a',
                        label: 'Facility A',
                        lat: 52.37,
                        lng: 4.89,
                        address: {
                            address_line1: 'Stadionplein 1',
                            country_code: 'NL',
                            locality: 'Amsterdam',
                            postal_code: '1076 BR'
                        },
                        active: true
                    }
                ],
                label: 'Facility',
                placeholder: 'Select facility',
                searchPlaceholder: 'Search'
            },
            global: {
                stubs: {
                    UFormField: UFormFieldStub,
                    AppSelectMenu: AppSelectMenuStub
                }
            }
        });

        // Should display formatted address, not [object Object]
        expect(wrapper.text()).toContain('Stadionplein 1');
        expect(wrapper.text()).toContain('1076 BR Amsterdam');
        expect(wrapper.text()).not.toContain('[object Object]');
    });

    it('announces that the facility homepage link opens in a new tab (a11y)', async () => {
        const wrapper = mount(FacilitySelect, {
            props: {
                modelValue: 'facility-a',
                items: [{ label: 'Facility A', value: 'facility-a' }],
                facilities: [
                    {
                        id: 'facility-a',
                        label: 'Facility A',
                        lat: 52.37,
                        lng: 4.89,
                        address: 'Dam 1, 1012 JS Amsterdam',
                        url: 'https://example.test/facility',
                        active: true
                    }
                ],
                label: 'Facility',
                placeholder: 'Select facility',
                searchPlaceholder: 'Search'
            },
            global: {
                stubs: {
                    UFormField: UFormFieldStub,
                    AppSelectMenu: AppSelectMenuStub
                }
            }
        });

        const link = wrapper.get('a[href="https://example.test/facility"]');
        expect(link.attributes('target')).toBe('_blank');
        expect(link.attributes('rel')).toContain('noopener');

        // The visually-hidden span carries the new-tab announcement for SR users.
        const srOnly = link.get('.sr-only');
        expect(srOnly.text()).toBe('form.facility_opens_in_new_tab');
    });

    it('renders nothing for address when no facility is selected', async () => {
        const wrapper = mount(FacilitySelect, {
            props: {
                modelValue: '',
                items: [{ label: 'Facility A', value: 'facility-a' }],
                facilities: [
                    {
                        id: 'facility-a',
                        label: 'Facility A',
                        lat: 52.37,
                        lng: 4.89,
                        address: {
                            address_line1: 'Dam 1',
                            country_code: 'NL',
                            locality: 'Amsterdam',
                            postal_code: '1012 JS'
                        },
                        active: true
                    }
                ],
                label: 'Facility',
                placeholder: 'Select facility',
                searchPlaceholder: 'Search'
            },
            global: {
                stubs: {
                    UFormField: UFormFieldStub,
                    AppSelectMenu: AppSelectMenuStub
                }
            }
        });

        expect(wrapper.text()).not.toContain('Dam 1');
    });
});
