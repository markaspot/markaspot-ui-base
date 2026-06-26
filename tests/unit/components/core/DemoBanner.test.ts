/**
 * DemoBanner unit tests (issue #432)
 *
 * The banner is the first line of defence against real citizens submitting
 * real-looking reports on demo.mark-a-spot.com. It must:
 *   - render when `runtimeConfig.public.demoMode === true`
 *   - render NOTHING on production tenants (flag off)
 *   - be dismissible without disabling the submission gate
 *   - link to mark-a-spot.com via a raw anchor that ships
 *     `rel="noopener noreferrer"` together with target="_blank"
 */
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h } from 'vue';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import DemoBanner from '../../../../app/components/core/DemoBanner.vue';
import { mockRuntimeConfigData, clearMockState } from '../../__mocks__/nuxt';

const UIcon = defineComponent({
    name: 'UIcon',
    props: {
        name: { type: String, default: '' }
    },
    setup(props) {
        return () => h('span', { 'data-icon': props.name });
    }
});

const mountBanner = () => mount(DemoBanner, { global: { stubs: { UIcon } } });
let mockClientConfig: Record<string, any>;
let mockRoutePath: string;

describe('DemoBanner (#432)', () => {
    beforeEach(() => {
        clearMockState();
        mockClientConfig = {
            theme: {
                ui: {
                    leftSidebar: {
                        enabled: true,
                        width: '420px'
                    }
                }
            }
        };
        mockRoutePath = '/amsterdam';
        vi.stubGlobal('useMarkASpotConfig', () => ({
            clientConfig: computed(() => mockClientConfig)
        }));
        vi.stubGlobal('useRoute', () => ({ path: mockRoutePath }));
        mockRuntimeConfigData.public = {
            ...mockRuntimeConfigData.public,
            demoMode: false
        } as typeof mockRuntimeConfigData.public;
    });

    it('renders nothing when demoMode is off', () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = false;
        const wrapper = mountBanner();
        expect(wrapper.find('[data-testid="demo-mode-banner"]').exists()).toBe(false);
    });

    it('renders the banner when demoMode is on', () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        const wrapper = mountBanner();
        const banner = wrapper.find('[data-testid="demo-mode-banner"]');
        expect(banner.exists()).toBe(true);
        // Warning color, never destructive: citizens should not panic, but
        // must understand the message.
        expect(banner.classes().some(className => className.includes('warning'))).toBe(true);
        expect(wrapper.text()).toContain('demo_mode.banner.title');
    });

    it('can be dismissed', async () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        const wrapper = mountBanner();
        await wrapper.find('[data-testid="demo-mode-banner-close"]').trigger('click');
        expect(wrapper.find('[data-testid="demo-mode-banner"]').exists()).toBe(false);
    });

    it('does not render the global banner on dashboard routes', () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        mockRoutePath = '/amsterdam/dashboard';

        const wrapper = mountBanner();

        expect(wrapper.find('[data-testid="demo-mode-banner"]').exists()).toBe(false);
    });

    it('renders a raw anchor with rel="noopener noreferrer" and target="_blank"', () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        const wrapper = mountBanner();
        const cta = wrapper.find('[data-testid="demo-mode-banner-cta"]');
        expect(cta.exists()).toBe(true);
        // Tab-out attack mitigation: rel must not be omitted by the
        // framework. We render a real <a> exactly because we cannot trust
        // UButton's prop pass-through to preserve `rel`.
        expect(cta.attributes('href')).toBe('https://mark-a-spot.com');
        expect(cta.attributes('target')).toBe('_blank');
        expect(cta.attributes('rel')).toBe('noopener noreferrer');
    });

    it('uses editable banner copy from jurisdiction config when provided', () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        mockClientConfig.demoMode = {
            banner: {
                title: 'Configured demo',
                message: 'Configured warning text',
                linkLabel: 'Configured link',
                linkUrl: '/configured-target'
            }
        };

        const wrapper = mountBanner();
        const cta = wrapper.find('[data-testid="demo-mode-banner-cta"]');

        expect(wrapper.text()).toContain('Configured demo');
        expect(wrapper.text()).toContain('Configured warning text');
        expect(cta.text()).toContain('Configured link');
        expect(cta.attributes('href')).toBe('/configured-target');
    });

    it('falls back to the default CTA URL for unsafe configured links', () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        mockClientConfig.demoMode = {
            banner: {
                linkUrl: 'javascript:alert(1)'
            }
        };

        const wrapper = mountBanner();
        const cta = wrapper.find('[data-testid="demo-mode-banner-cta"]');

        expect(cta.attributes('href')).toBe('https://mark-a-spot.com');
    });

    it('keeps sidebar offset out of inline width so mobile can use full viewport width', () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;

        const wrapper = mountBanner();
        const banner = wrapper.find('[data-testid="demo-mode-banner"]');
        const style = banner.attributes('style') || '';

        expect(style).toContain('--demo-mode-sidebar-width: 420px');
        expect(style).not.toContain('left: calc(420px');
        expect(style).not.toContain('width: min(48rem, calc(100vw - 420px');
    });
});
