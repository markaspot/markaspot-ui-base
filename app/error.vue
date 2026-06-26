<template>
  <div class="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--ui-bg)] px-4 py-12 sm:px-6 lg:px-8">
    <!-- Background watermark: status code -->
    <div
      class="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
      aria-hidden="true"
    >
      <span
        class="text-[12rem] font-black leading-none text-[var(--ui-text-dimmed)] opacity-[0.04] sm:text-[16rem] md:text-[20rem]"
      >
        {{ error?.statusCode || '?' }}
      </span>
    </div>

    <!-- Subtle radial gradient decoration -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--ui-primary)_0%,transparent_70%)] opacity-[0.06]"
      aria-hidden="true"
    />

    <!-- Content -->
    <div class="relative z-10 mx-auto max-w-lg text-center">
      <!-- Logo: render both variants and toggle via Tailwind dark: class.
           Rendering both on SSR keeps the markup colorMode-agnostic so the
           client hydrates with zero mismatch (useColorMode() only knows the
           real preference post-mount). The @error handlers swap to the
           default asset when a jurisdiction logo 404s (e.g. when a tenant
           has a dark logo URL in config but the file is missing). -->
      <div
        v-if="logoLight || logoDark"
        class="mb-8 flex justify-center"
      >
        <img
          v-if="logoLight"
          ref="lightImgEl"
          :src="logoLight"
          alt=""
          class="h-8 w-auto opacity-80 sm:h-10 dark:hidden"
          @error="handleLogoError('light')"
        >
        <img
          v-if="logoDark"
          ref="darkImgEl"
          :src="logoDark"
          alt=""
          class="hidden h-8 w-auto opacity-80 sm:h-10 dark:block"
          @error="handleLogoError('dark')"
        >
      </div>

      <!-- Icon -->
      <div class="mb-6 flex justify-center">
        <UIcon
          :name="errorConfig.icon"
          class="size-16 text-[var(--ui-primary)] sm:size-20"
        />
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold tracking-tight text-[var(--ui-text)] sm:text-3xl">
        {{ t(errorConfig.titleKey) }}
      </h1>

      <!-- Description -->
      <p class="mt-3 text-base text-[var(--ui-text-muted)] sm:text-lg">
        {{ t(errorConfig.descriptionKey) }}
      </p>

      <!-- Dev-only error message. Must not reach production: upstream
           proxies can populate `error.message` with internal paths or SQL
           fragments that leak through untouched by the Nitro sanitiser. -->
      <p
        v-if="isDev && error?.message && error.message !== error.statusMessage"
        class="mt-4 rounded-md bg-[var(--ui-bg-elevated)] px-4 py-2 font-mono text-xs text-[var(--ui-text-dimmed)]"
      >
        {{ error.message }}
      </p>

      <!-- Action buttons -->
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <UButton
          v-if="hasHistory"
          color="primary"
          variant="outline"
          size="lg"
          icon="i-lucide-arrow-left"
          @click="goBack"
        >
          {{ t('error.actions.back') }}
        </UButton>

        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-home"
          @click="goHome"
        >
          {{ t('error.actions.home') }}
        </UButton>

        <UButton
          v-if="error?.statusCode === 500"
          color="primary"
          variant="soft"
          size="lg"
          icon="i-lucide-refresh-cw"
          @click="retry"
        >
          {{ t('error.actions.retry') }}
        </UButton>

        <UDropdownMenu
          v-if="showLanguageSwitcher"
          :items="languageMenuItems"
          :content="{ align: 'center' }"
        >
          <UButton
            color="primary"
            variant="outline"
            size="lg"
            icon="i-heroicons-language"
            class="gap-2 px-3"
            :aria-label="t('map.controls.toggle_language')"
            :disabled="isChangingLocale"
          >
            {{ currentLanguageDisplayCode }}
          </UButton>
        </UDropdownMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';
import {
    LOCALE_CODES,
    LOCALE_DISPLAY_CODES,
    LOCALE_LABELS
} from '../config/locales';

const props = defineProps<{
    error: NuxtError
}>();

const isDev = import.meta.dev;

// i18n with fallback for cases where the plugin may not be fully initialized.
// `i18nLocale` is a ref we can write to for the jurisdiction-default locale override.
const fallbackStrings: Record<string, string> = {
    'error.404.title': 'Page not found',
    'error.404.description': 'The page you\'re looking for doesn\'t exist or has been moved.',
    'error.403.title': 'Access denied',
    'error.403.description': 'You don\'t have permission to view this page.',
    'error.500.title': 'Something went wrong',
    'error.500.description': 'An unexpected error occurred. Please try again.',
    'error.fallback.title': 'Error',
    'error.fallback.description': 'An unexpected error occurred.',
    'error.actions.back': 'Go back',
    'error.actions.home': 'Back to home',
    'error.actions.retry': 'Try again',
    'map.controls.toggle_language': 'Change language'
};

let t: (key: string) => string;
let i18nLocale: { value: string } | null = null;

try {
    const { t: i18nT, locale } = useI18n();
    const testResult = i18nT('error.actions.home');
    if (testResult && testResult !== 'error.actions.home') {
        // Fall through to the built-in strings on a per-call basis for keys
        // that are missing from the active locale bundle (e.g. nl is missing
        // `error.actions.back`). Without this fallthrough the button would
        // render the raw key.
        t = (key: string) => {
            const result = i18nT(key);
            return (result && result !== key) ? result : (fallbackStrings[key] || key);
        };
        i18nLocale = locale as unknown as { value: string };
    } else {
        t = (key: string) => fallbackStrings[key] || key;
    }
} catch {
    t = (key: string) => fallbackStrings[key] || key;
}

interface ErrorConfig {
    icon: string
    titleKey: string
    descriptionKey: string
}

const errorConfigs: Record<number, ErrorConfig> = {
    404: {
        icon: 'i-lucide-search',
        titleKey: 'error.404.title',
        descriptionKey: 'error.404.description'
    },
    403: {
        icon: 'i-lucide-shield-off',
        titleKey: 'error.403.title',
        descriptionKey: 'error.403.description'
    },
    500: {
        icon: 'i-lucide-server-crash',
        titleKey: 'error.500.title',
        descriptionKey: 'error.500.description'
    }
};

const fallbackConfig: ErrorConfig = {
    icon: 'i-lucide-alert-triangle',
    titleKey: 'error.fallback.title',
    descriptionKey: 'error.fallback.description'
};

const errorConfig = computed<ErrorConfig>(() => {
    const code = props.error?.statusCode;
    if (code && errorConfigs[code]) {
        return errorConfigs[code];
    }
    return fallbackConfig;
});

const hasHistory = ref(false);

// Jurisdiction resolver: delegates to the SSR-safe composable.
// See useErrorPageJurisdiction for the resolution policy. We pass
// error.url explicitly, because useRequestURL() on the server-side error
// render yields Nuxt's internal /__nuxt_error route, not the original
// request path the visitor hit.
const runtimeConfig = useRuntimeConfig();
const resolved = await useErrorPageJurisdiction(props.error?.url);

// Build separate light and dark logo URLs so the template can render both
// and toggle via Tailwind `dark:` classes. This is SSR-safe: the server
// emits the exact same markup as the client, regardless of the visitor's
// color-mode preference, so hydration has nothing to reconcile.
function apiProxy(url: string | undefined | null): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `/api${url}`;
}

// Track runtime 404s on the jurisdiction logos so we can swap to the
// default asset. Drupal config can reference files that do not exist on
// disk (orphan file_managed entries), and the broken response is a real
// HTTP 404, not a transparent image. Two detection paths:
//
//   1. @error on the img element, for errors that fire after hydration.
//   2. onMounted naturalWidth check, for errors that fire before Vue
//      attaches the v-on handler (common for SSR-rendered imgs where the
//      browser starts loading during initial paint).
const lightLogoFailed = ref(false);
const darkLogoFailed = ref(false);
const lightImgEl = ref<HTMLImageElement | null>(null);
const darkImgEl = ref<HTMLImageElement | null>(null);

const logoLight = computed(() => {
    if (lightLogoFailed.value) return '/images/logo-light.svg';
    return apiProxy(resolved.value?.logos?.light) || '/images/logo-light.svg';
});
const logoDark = computed(() => {
    if (darkLogoFailed.value) return '/images/logo-dark.svg';
    return apiProxy(resolved.value?.logos?.dark) || '/images/logo-dark.svg';
});

const isChangingLocale = ref(false);
const browserLanguage = ref('');

const availableErrorLocales = computed(() => {
    return (resolved.value?.availableLocales || []).filter(code =>
        (LOCALE_CODES as readonly string[]).includes(code)
    );
});

const errorLocaleLabels = computed(() => {
    const labels: Record<string, string> = { ...LOCALE_LABELS };
    for (const localeDefinition of resolved.value?.locales || []) {
        if (localeDefinition.code) {
            labels[localeDefinition.code] = (
                localeDefinition.name ||
                labels[localeDefinition.code] ||
                localeDefinition.code.toUpperCase()
            );
        }
    }
    return labels;
});

const currentErrorLocale = computed(() => {
    const buildTimeDefault = (runtimeConfig.public?.clientConfig as { languages?: { defaultLocale?: string } } | undefined)
        ?.languages?.defaultLocale;
    return (
        i18nLocale?.value ||
        resolved.value?.defaultLocale ||
        buildTimeDefault ||
        'de'
    );
});

const currentLanguageDisplayCode = computed(() => {
    return (
        LOCALE_DISPLAY_CODES[currentErrorLocale.value] ||
        currentErrorLocale.value.split('-')[0]?.toUpperCase() ||
        currentErrorLocale.value.toUpperCase()
    );
});

const showLanguageSwitcher = computed(() => {
    const defaultLocale = resolved.value?.defaultLocale?.toLowerCase() || '';
    return Boolean(
        i18nLocale &&
        browserLanguage.value &&
        defaultLocale &&
        browserLanguage.value !== defaultLocale &&
        availableErrorLocales.value.length > 1
    );
});

async function switchErrorPageLocale(newLocale: string) {
    if (typeof window === 'undefined' || !i18nLocale) return;
    if (isChangingLocale.value || !availableErrorLocales.value.includes(newLocale)) return;
    if (newLocale === currentErrorLocale.value) return;

    try {
        isChangingLocale.value = true;
        const nuxtI18n = useNuxtApp().$i18n as {
            locale?: string | { value: string }
            loadLocaleMessages?: (locale: string) => Promise<void>
        };

        if (nuxtI18n?.loadLocaleMessages) {
            await nuxtI18n.loadLocaleMessages(newLocale);
        }

        if (typeof nuxtI18n?.locale === 'string') {
            nuxtI18n.locale = newLocale;
        } else if (nuxtI18n?.locale) {
            nuxtI18n.locale.value = newLocale;
        }

        i18nLocale.value = newLocale;
    } catch (error) {
        console.error('Failed to switch error-page language:', error);
    } finally {
        isChangingLocale.value = false;
    }
}

const languageMenuItems = computed(() => [
    availableErrorLocales.value.map(code => ({
        label: errorLocaleLabels.value[code] || code.toUpperCase(),
        icon: code === currentErrorLocale.value ? 'i-heroicons-check' : undefined,
        onSelect: () => switchErrorPageLocale(code)
    }))
]);

function handleLogoError(variant: 'light' | 'dark') {
    if (variant === 'light') lightLogoFailed.value = true;
    else darkLogoFailed.value = true;
}

// Locale override: jurisdiction default wins.
//
// Policy: the tenant's canonical language beats browser Accept-Language and
// cookie state. Even on a single-instance install a jurisdiction is always
// present via NUXT_PUBLIC_JURISDICTION_ID. We read the default in this
// order: resolved API value -> build-time clientConfig default.
// Apply via direct locale.value assignment, the same pattern useLanguage
// uses, because setLocale() from @nuxtjs/i18n re-triggers route-locale
// detection and resets the value.
function applyJurisdictionLocale() {
    if (!i18nLocale) return;
    const resolvedDefault = resolved.value?.defaultLocale;
    const buildTimeDefault = (runtimeConfig.public?.clientConfig as { languages?: { defaultLocale?: string } } | undefined)
        ?.languages?.defaultLocale;
    const target = resolvedDefault || buildTimeDefault;
    if (target && i18nLocale.value !== target) {
        i18nLocale.value = target;
    }
}

// Apply once inside setup. useAsyncData hydrates `resolved` from the SSR
// payload so the value is stable between server and client, no watch needed.
applyJurisdictionLocale();

onMounted(() => {
    hasHistory.value = window.history.length > 1;
    browserLanguage.value = (navigator.language || '').split('-')[0]?.toLowerCase() || '';

    // Post-hydration logo 404 check. The browser may have fired `error` on
    // an SSR-rendered img before Vue attached the v-on handler. `complete`
    // is true after loading resolved, `naturalWidth === 0` means the image
    // did not decode (HTTP error or bad content).
    const checkImg = (img: HTMLImageElement | null, variant: 'light' | 'dark') => {
        if (img && img.complete && img.naturalWidth === 0) {
            handleLogoError(variant);
        }
    };
    checkImg(lightImgEl.value, 'light');
    checkImg(darkImgEl.value, 'dark');
});

function goBack() {
    window.history.back();
}

function goHome() {
    clearError({ redirect: '/' });
}

function retry() {
    clearError({ redirect: window.location.pathname });
}
</script>
