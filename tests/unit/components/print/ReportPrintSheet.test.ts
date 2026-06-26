import { mount } from '@vue/test-utils';
import { computed, nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReportPrintSheet from '@/components/print/ReportPrintSheet.vue';

const makeRequest = () => ({
    service_request_id: 'BONN-1',
    created: '2026-05-27T10:00:00Z',
    description: 'Broken paving slab',
    status: 'open',
    statusLabel: 'Warteliste',
    category: {
        name: 'Radbügel',
        color: '#d82f4b'
    },
    location: {
        lat: 50.7,
        lon: 7.1,
        address: 'Bonn'
    },
    media: [],
    extended_attributes: {
        markaspot: {
            status_notes: []
        },
        drupal: {}
    }
});

describe('ReportPrintSheet', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.stubGlobal('useFormatters', () => ({
            formatDateTimeLong: (value: string) => `long:${value}`,
            formatDateTime: (value: string | Date) => typeof value === 'string' ? `short:${value}` : 'short:now'
        }));
        vi.stubGlobal('useClientAssets', () => ({
            logoLight: ''
        }));
        vi.stubGlobal('useMarkASpotConfig', () => ({
            clientConfig: computed(() => ({ client: { name: 'Bonn Mobility' } }))
        }));
        vi.stubGlobal('useFeatureFlags', () => ({
            organisationsEnabled: computed(() => true)
        }));
    });

    it('renders management fields only for staff print sheets', () => {
        const visible = mount(ReportPrintSheet, {
            props: {
                request: makeRequest(),
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: true,
                managementFields: [
                    { key: 'field_e_mail', label: 'Email', value: 'ada@example.test' },
                    { key: 'field_internal_remark', label: 'Internal remarks', value: 'Call back' }
                ]
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        expect(visible.text()).toContain('Email');
        expect(visible.text()).toContain('ada@example.test');
        expect(visible.text()).toContain('Internal remarks');

        const hidden = mount(ReportPrintSheet, {
            props: {
                request: makeRequest(),
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: false,
                managementFields: [
                    { key: 'field_e_mail', label: 'Email', value: 'ada@example.test' }
                ]
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        expect(hidden.text()).not.toContain('ada@example.test');
    });

    it('renders management field values as text, not HTML', () => {
        const wrapper = mount(ReportPrintSheet, {
            props: {
                request: makeRequest(),
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: true,
                managementFields: [
                    {
                        key: 'field_notes',
                        label: 'Notes',
                        value: '<img src=x onerror=alert(1)>'
                    }
                ]
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>');
        expect(wrapper.find('img[src="x"]').exists()).toBe(false);
    });

    it('keeps a placeholder for missing media images in the print photo grid', async () => {
        const wrapper = mount(ReportPrintSheet, {
            props: {
                request: {
                    ...makeRequest(),
                    media: [
                        { uuid: 'missing', url: '/api/images/missing.jpg', alt: 'Missing image' },
                        { uuid: 'ok', url: '/api/images/ok.jpg', alt: 'Available image' }
                    ]
                },
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: false
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        expect(wrapper.findAll('img.print-photo')).toHaveLength(2);

        await wrapper.find('img.print-photo').trigger('error');
        await nextTick();

        expect(wrapper.findAll('img.print-photo')).toHaveLength(1);
        expect(wrapper.find('.print-photo-missing').text()).toContain('print.image_unavailable');
        expect(wrapper.find('.print-photo-missing').text()).toContain('Missing image');
    });

    it('prints Open311 media_url values and keeps placeholders for missing files', async () => {
        const wrapper = mount(ReportPrintSheet, {
            props: {
                request: {
                    ...makeRequest(),
                    media: [],
                    media_url: '/api/images/missing.jpg, /api/images/available.jpg',
                    extended_attributes: {
                        markaspot: {
                            media_alt_text: ['Broken paving slab', 'Available image']
                        },
                        drupal: {}
                    }
                },
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: false
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        const images = wrapper.findAll('img.print-photo');
        expect(images).toHaveLength(2);
        expect(images[0]?.attributes('src')).toBe('/api/images/missing.jpg');
        expect(images[0]?.attributes('alt')).toBe('Broken paving slab');
        expect(images[1]?.attributes('src')).toBe('/api/images/available.jpg');
        expect(images[1]?.attributes('alt')).toBe('Available image');

        await images[0]?.trigger('error');
        await nextTick();

        expect(wrapper.findAll('img.print-photo')).toHaveLength(1);
        expect(wrapper.find('.print-photo-missing').text()).toContain('Broken paving slab');
    });

    it('uses Open311 media_url as a per-item fallback for media entities without usable URLs', () => {
        const wrapper = mount(ReportPrintSheet, {
            props: {
                request: {
                    ...makeRequest(),
                    media: [
                        { uuid: 'persisted-without-url', url: '', alt: '' }
                    ],
                    media_url: '/api/images/fallback.jpg'
                },
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: false
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        const image = wrapper.find('img.print-photo');
        expect(image.exists()).toBe(true);
        expect(image.attributes('src')).toBe('/api/images/fallback.jpg');
        expect(image.attributes('alt')).toBe('print.media 1');
    });

    it('does not render external Open311 media_url values directly', () => {
        const wrapper = mount(ReportPrintSheet, {
            props: {
                request: {
                    ...makeRequest(),
                    media: [],
                    media_url: 'https://example.invalid/private.jpg'
                },
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: false
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        expect(wrapper.find('img.print-photo').exists()).toBe(false);
        expect(wrapper.find('.print-photo-missing').text()).toContain('print.media 1');
    });

    it('tries Open311 media_url when a media entity image fails to load', async () => {
        const wrapper = mount(ReportPrintSheet, {
            props: {
                request: {
                    ...makeRequest(),
                    media: [
                        { uuid: 'broken', url: '/api/images/entity-broken.jpg', alt: 'Fallback capable image' }
                    ],
                    media_url: '/api/images/entity-fallback.jpg'
                },
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: false
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        expect(wrapper.find('img.print-photo').attributes('src')).toBe('/api/images/entity-broken.jpg');

        await wrapper.find('img.print-photo').trigger('error');
        await nextTick();

        expect(wrapper.find('img.print-photo').exists()).toBe(true);
        expect(wrapper.find('img.print-photo').attributes('src')).toBe('/api/images/entity-fallback.jpg');
        expect(wrapper.find('.print-photo-missing').exists()).toBe(false);
    });

    it('keeps a placeholder when a media entity has no usable image URL', () => {
        const wrapper = mount(ReportPrintSheet, {
            props: {
                request: {
                    ...makeRequest(),
                    media: [
                        { uuid: 'missing-url', url: '', alt: 'Persisted media without file URL' }
                    ]
                },
                mapImageUrl: null,
                qrCodeUrl: 'data:image/png;base64,qr',
                showInternalFields: false
            },
            global: {
                stubs: { Teleport: true }
            }
        });

        expect(wrapper.findAll('img.print-photo')).toHaveLength(0);
        expect(wrapper.find('.print-photo-missing').text()).toContain('Persisted media without file URL');
    });
});
