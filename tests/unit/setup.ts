/**
 * Vitest Setup File
 *
 * This file runs before all tests and sets up global utilities
 * that are auto-imported in Nuxt but need to be manually provided in tests.
 */

import { ref, isRef, computed, reactive, readonly, watch, watchEffect, toRefs, toRef, toRaw, unref, nextTick, getCurrentScope, onScopeDispose, onMounted, onBeforeUnmount, onUnmounted } from 'vue';
import { acceptHMRUpdate } from 'pinia';
import {
    useState,
    clearNuxtState,
    useRoute,
    useRouter,
    useRuntimeConfig,
    useAsyncData,
    useNuxtApp,
    navigateTo,
    useOnlineStatus,
    useJurisdictions
} from './__mocks__/nuxt';

// Make Vue composition API functions available globally
// This simulates Nuxt's auto-import behavior
globalThis.ref = ref;
globalThis.isRef = isRef;
globalThis.computed = computed;
globalThis.reactive = reactive;
globalThis.readonly = readonly;
globalThis.watch = watch;
globalThis.watchEffect = watchEffect;
globalThis.toRefs = toRefs;
globalThis.toRef = toRef;
globalThis.toRaw = toRaw;
globalThis.unref = unref;
globalThis.nextTick = nextTick;
globalThis.getCurrentScope = getCurrentScope;
globalThis.onScopeDispose = onScopeDispose;
globalThis.onMounted = onMounted;
globalThis.onBeforeUnmount = onBeforeUnmount;
globalThis.onUnmounted = onUnmounted;

// Pinia auto-imports acceptHMRUpdate in the Nuxt app; stores call it inside an
// `if (import.meta.hot)` block that vitest evaluates truthy, so provide it here
// to avoid a ReferenceError when a store module is imported by a unit test.
globalThis.acceptHMRUpdate = acceptHMRUpdate;

// Make vue-i18n composable available globally (auto-imported by @nuxtjs/i18n)
globalThis.useI18n = () => ({
    t: (key: string, params?: Record<string, any>) => {
        if (params) return `${key}{${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')}}`;
        return key;
    },
    // `te` (translation-exists) defaults to false so call sites that gate on
    // `te(key) ? t(key) : fallback` exercise their fallback branch in tests.
    te: (_key: string) => false,
    // Reactive locale ref so call sites using `locale.value` (e.g.
    // formatFacilityAddress dispatch) don't crash in unit tests.
    locale: ref('en')
});

// Nuxt UI toast composable — stub with a vi.fn so tests can assert on calls.
// Call sites read the `.add` method exclusively; a no-op fn is enough.
globalThis.useToast = () => ({
    add: (() => undefined) as (...args: unknown[]) => void,
    remove: (() => undefined) as (...args: unknown[]) => void,
    update: (() => undefined) as (...args: unknown[]) => void,
    clear: (() => undefined) as () => void
});

// Feature flags composable (auto-imported, consumed by useFormValidation etc.)
globalThis.useFeatureFlags = () => ({
    privacyNoticeEnabled: computed(() => true),
    photoReportingEnabled: computed(() => true),
    photoReportAvailable: computed(() => true),
    statisticsEnabled: computed(() => false),
    dashboardEnabled: computed(() => false),
    passwordlessEnabled: computed(() => false),
    aiAnalysisEnabled: computed(() => false),
    aiAnalysisAvailable: computed(() => false),
    statusAttributesEnabled: computed(() => false),
    boundariesEnabled: computed(() => false),
    feedbackEnabled: computed(() => false),
    funFactsEnabled: computed(() => false),
    emergencyEnabled: computed(() => false),
    offlineEnabled: computed(() => false),
    offlineConfig: computed(() => undefined),
    organisationsEnabled: computed(() => false),
    serviceProvidersEnabled: computed(() => false),
    moderationEnabled: computed(() => true),
    dashboardRequestCreateEnabled: computed(() => false),
    proAvailable: computed(() => false)
});

// Make Nuxt composables available globally
// These are auto-imported in Nuxt but need to be explicitly provided in tests
globalThis.useState = useState;
globalThis.clearNuxtState = clearNuxtState;
globalThis.useRoute = useRoute;
globalThis.useRouter = useRouter;
globalThis.useRuntimeConfig = useRuntimeConfig;
globalThis.useAsyncData = useAsyncData;
globalThis.useNuxtApp = useNuxtApp;
globalThis.navigateTo = navigateTo;
globalThis.useOnlineStatus = useOnlineStatus;
globalThis.useJurisdictions = useJurisdictions;

// Network guard (#355): unit tests MUST be backend-free. Any real network call
// (raw fetch / XHR) throws so a backend-dependent test fails loudly instead of
// silently hitting a live server. Mock the API client or $fetch at the module
// level, or move the test to the integration layer — see tests/README.md.
const banNetwork = (api: string): never => {
    throw new Error(
        `[unit] ${api} is banned in unit tests — they must run with no backend. ` +
        'Mock the API client or $fetch at the module level, or move the test to ' +
        'the integration layer (test:api-contract / test:integration). See tests/README.md.'
    );
};
globalThis.fetch = (() => banNetwork('fetch()')) as unknown as typeof fetch;
globalThis.XMLHttpRequest = function XMLHttpRequest() {
    banNetwork('XMLHttpRequest');
} as unknown as typeof XMLHttpRequest;
