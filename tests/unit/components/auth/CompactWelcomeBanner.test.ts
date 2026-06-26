import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CompactWelcomeBanner from '@/components/auth/CompactWelcomeBanner.vue';
import { clearMockState } from '../../__mocks__/nuxt';

const originalUseFeatureFlags = globalThis.useFeatureFlags;
const originalUsePasswordlessAuth = globalThis.usePasswordlessAuth;
const originalUseJurisdictions = globalThis.useJurisdictions;

const UButton = defineComponent({
    name: 'UButton',
    props: {
        to: {
            type: String,
            default: undefined
        },
        icon: {
            type: String,
            default: undefined
        },
        external: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { attrs, slots }) {
        return () => {
            const children = [
                props.icon ? h('span', { 'data-icon': props.icon }) : null,
                slots.default?.()
            ];

            if (props.to) {
                return h('a', {
                    ...attrs,
                    'href': props.to,
                    'data-icon': props.icon,
                    'data-external': props.external ? 'true' : undefined
                }, children);
            }

            return h('button', {
                ...attrs,
                'type': 'button',
                'data-icon': props.icon
            }, children);
        };
    }
});

const mountBanner = ({ dashboardEnabled = true } = {}) => {
    const user = ref({
        uid: '7',
        name: 'Header Tester',
        email: 'header.tester@example.test'
    });

    vi.stubGlobal('useFeatureFlags', () => ({
        dashboardEnabled: computed(() => dashboardEnabled)
    }));
    vi.stubGlobal('usePasswordlessAuth', () => ({
        user,
        isAuthenticated: computed(() => Boolean(user.value)),
        isLoading: ref(false),
        logout: vi.fn()
    }));
    vi.stubGlobal('useJurisdictions', () => ({
        buildPath: (path: string) => `/amsterdam${path}`
    }));

    return mount(CompactWelcomeBanner, {
        global: {
            mocks: {
                $t: (key: string, params?: Record<string, string>) => {
                    if (!params) return key;
                    return `${key}{${Object.entries(params).map(([name, value]) => `${name}=${value}`).join(',')}}`;
                }
            },
            stubs: {
                UButton
            }
        }
    });
};

describe('CompactWelcomeBanner', () => {
    beforeEach(() => {
        clearMockState();
    });

    afterEach(() => {
        if (originalUseFeatureFlags) {
            vi.stubGlobal('useFeatureFlags', originalUseFeatureFlags);
        }
        if (originalUsePasswordlessAuth) {
            vi.stubGlobal('usePasswordlessAuth', originalUsePasswordlessAuth);
        } else {
            Reflect.deleteProperty(globalThis, 'usePasswordlessAuth');
        }
        if (originalUseJurisdictions) {
            vi.stubGlobal('useJurisdictions', originalUseJurisdictions);
        }
    });

    it('renders a larger visible dashboard link for authenticated users', () => {
        const wrapper = mountBanner();

        const dashboardLink = wrapper.get('a[href="/amsterdam/dashboard"]');
        const label = dashboardLink.findAll('span').at(1);

        expect(dashboardLink.text()).toContain('nav.dashboard');
        expect(dashboardLink.attributes('aria-label')).toBe('nav.dashboard');
        expect(dashboardLink.attributes('title')).toBeUndefined();
        expect(dashboardLink.attributes('data-external')).toBe('true');
        expect(dashboardLink.classes()).toContain('min-h-10');
        expect(dashboardLink.classes()).toContain('min-w-10');
        expect(dashboardLink.classes()).toContain('px-2.5');
        expect(label?.classes()).toEqual(expect.arrayContaining(['hidden', 'md:inline', 'max-w-24', 'truncate']));
    });

    it('keeps the dashboard action hidden when the feature flag is disabled', () => {
        const wrapper = mountBanner({ dashboardEnabled: false });

        expect(wrapper.find('a[href="/amsterdam/dashboard"]').exists()).toBe(false);
    });
});
