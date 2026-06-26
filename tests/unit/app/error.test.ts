import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref, nextTick, onMounted } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorPage from '../../../app/error.vue';
import { clearMockState, mockRuntimeConfigData } from '../__mocks__/nuxt';

const translations = {
    nl: {
        'error.404.title': 'Pagina niet gevonden',
        'error.404.description': 'De pagina die je zoekt bestaat niet of is verplaatst.',
        'error.actions.home': 'Terug naar home',
        'error.actions.back': 'Ga terug',
        'error.actions.retry': 'Opnieuw proberen',
        'map.controls.toggle_language': 'Taal wijzigen'
    },
    en: {
        'error.404.title': 'Page not found',
        'error.404.description': 'The page you\'re looking for doesn\'t exist or has been moved.',
        'error.actions.home': 'Back to home',
        'error.actions.back': 'Go back',
        'error.actions.retry': 'Try again',
        'map.controls.toggle_language': 'Change language'
    }
} as const;

const localeRef = ref<'nl' | 'en'>('nl');
const clearErrorMock = vi.fn();
const loadLocaleMessagesMock = vi.fn().mockResolvedValue(undefined);

(globalThis as any).onMounted = onMounted;

function setNavigatorLanguage(language: string) {
    Object.defineProperty(window.navigator, 'language', {
        configurable: true,
        value: language
    });
}

const UButtonStub = defineComponent({
    inheritAttrs: false,
    props: {
        disabled: {
            type: Boolean,
            default: false
        }
    },
    emits: ['click'],
    template: `
      <button
        v-bind="$attrs"
        :disabled="disabled"
        @click="$emit('click', $event)"
      >
        <slot />
      </button>
    `
});

const UDropdownMenuStub = defineComponent({
    props: {
        items: {
            type: Array,
            default: () => []
        }
    },
    setup(props, { slots }) {
        const open = ref(false);

        return () => h('div', {
            onClick: () => {
                open.value = !open.value;
            }
        }, [
            ...(slots.default?.() || []),
            open.value
                ? h('div', {},
                    (props.items as Array<Array<{ label: string, onSelect?: () => unknown }>>)
                        .flat()
                        .map(item => h('button', {
                            role: 'menuitem',
                            onClick: () => item.onSelect?.()
                        }, item.label))
                )
                : null
        ]);
    }
});

async function mountErrorPage() {
    const Host = defineComponent({
        components: { ErrorPage },
        data() {
            return {
                error: {
                    statusCode: 404,
                    url: '/amsterdam/does-not-exist'
                }
            };
        },
        template: `
          <Suspense>
            <ErrorPage :error="error" />
          </Suspense>
        `
    });

    const wrapper = mount(Host, {
        global: {
            stubs: {
                UButton: UButtonStub,
                UDropdownMenu: UDropdownMenuStub,
                UIcon: true
            }
        }
    });

    await flushPromises();
    await nextTick();

    return wrapper;
}

describe('app/error.vue', () => {
    beforeEach(() => {
        clearMockState();
        clearErrorMock.mockReset();
        loadLocaleMessagesMock.mockClear();
        localeRef.value = 'nl';
        mockRuntimeConfigData.public.clientConfig = {
            languages: {
                defaultLocale: 'de'
            }
        } as any;

        (globalThis as any).useErrorPageJurisdiction = vi.fn(async () => ref({
            logos: {
                light: '/sites/default/files/amsterdam-light.svg',
                dark: '/sites/default/files/amsterdam-dark.svg'
            },
            defaultLocale: 'nl',
            availableLocales: ['nl', 'en'],
            locales: [
                { code: 'nl', name: 'Nederlands', iso: 'nl-NL' },
                { code: 'en', name: 'English', iso: 'en-US' }
            ]
        }));

        (globalThis as any).useI18n = () => ({
            locale: localeRef,
            t: (key: string) => translations[localeRef.value][key as keyof (typeof translations)['nl']] || key
        });

        (globalThis as any).useNuxtApp = vi.fn(() => ({
            $i18n: {
                locale: localeRef,
                loadLocaleMessages: loadLocaleMessagesMock
            }
        }));

        (globalThis as any).clearError = clearErrorMock;
        window.history.replaceState({}, '', '/amsterdam/does-not-exist');
    });

    it('shows a language switcher only when the browser locale differs from the tenant default', async () => {
        setNavigatorLanguage('en-US');
        const wrapper = await mountErrorPage();

        const languageTrigger = wrapper.find('button[aria-label]');
        expect(languageTrigger.exists()).toBe(true);
        expect(languageTrigger.text()).toContain('NL');

        wrapper.unmount();

        setNavigatorLanguage('nl-NL');
        const sameLocaleWrapper = await mountErrorPage();
        expect(sameLocaleWrapper.find('button[aria-label]').exists()).toBe(false);
    });

    it('hides the language switcher when i18n is unavailable and the page falls back to static strings', async () => {
        setNavigatorLanguage('en-US');
        (globalThis as any).useI18n = () => {
            throw new Error('i18n unavailable');
        };

        const wrapper = await mountErrorPage();

        expect(wrapper.find('button[aria-label]').exists()).toBe(false);
        expect(wrapper.find('h1').text()).toBe('Page not found');
    });

    it('switches the error page language in place using only tenant locales', async () => {
        setNavigatorLanguage('en-US');
        const wrapper = await mountErrorPage();

        const initialHeading = wrapper.find('h1').text();
        expect(initialHeading).toBe('Pagina niet gevonden');

        await wrapper.find('button[aria-label]').trigger('click');
        await nextTick();

        const menuItems = wrapper.findAll('[role="menuitem"]');
        expect(menuItems.map(item => item.text())).toEqual(['Nederlands', 'English']);

        await menuItems[1]?.trigger('click');
        await flushPromises();
        await nextTick();

        expect(loadLocaleMessagesMock).toHaveBeenCalledWith('en');
        expect(localeRef.value).toBe('en');
        expect(wrapper.find('h1').text()).toBe('Page not found');
        expect(wrapper.text()).toContain('Back to home');
        expect(wrapper.find('button[aria-label]').text()).toContain('EN');
        expect(window.location.pathname).toBe('/amsterdam/does-not-exist');
        expect(clearErrorMock).not.toHaveBeenCalled();
    });
});
