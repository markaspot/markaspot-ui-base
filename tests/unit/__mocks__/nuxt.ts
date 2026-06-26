/**
 * Mock Nuxt Composables for Unit Testing
 *
 * This file provides mock implementations of Nuxt's built-in composables
 * that can be used in unit tests without requiring the full Nuxt runtime.
 *
 * These are exported both as mockXxx (for test configuration) and as the
 * actual Nuxt names (useState, useRoute, etc.) for auto-import compatibility.
 */

import { ref, readonly, computed, type Ref } from 'vue';
import { vi } from 'vitest';

// ============================================================================
// State Management
// ============================================================================

/**
 * Shared state map for useState
 * In real Nuxt: useState provides SSR-friendly reactive state
 * In tests: We simulate this with a simple Map
 */
const stateMap = new Map<string, Ref<any>>();
const stateInitializers = new Map<string, (() => any) | undefined>();

/**
 * Mock route data - can be modified in tests
 */
export const mockRouteData = {
    query: {} as Record<string, string>,
    params: {} as Record<string, string>,
    path: '/',
    fullPath: '/',
    name: 'index'
};

/**
 * Mock runtime config - can be modified in tests
 *
 * NOTE: jurisdictionId is server-only (NOT in public) to prevent build-time baking.
 * It is set here at the top level, mirroring the real runtimeConfig structure.
 */
export const mockRuntimeConfigData = {
    jurisdictionId: '', // server-only, read by SSR code via runtimeConfig.jurisdictionId
    public: {
        apiBase: 'https://dev.ddev.site',
        ssoBackendOrigin: '',
        useProxy: false,
        proxyPath: '/api/proxy'
    }
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Mock useState - Returns a ref that persists across calls with the same key
 */
export const mockUseState = <T>(key: string, init?: () => T): Ref<T> => {
    if (!stateMap.has(key)) {
        const initialValue = init ? init() : (null as T);
        stateMap.set(key, ref(initialValue));
        stateInitializers.set(key, init);
    }
    return stateMap.get(key) as Ref<T>;
};

type ClearNuxtStateSelector = string | string[] | ((key: string) => boolean);

export const mockClearNuxtState = vi.fn((selector?: ClearNuxtStateSelector) => {
    if (selector === undefined) {
        for (const [key, state] of stateMap.entries()) {
            const init = stateInitializers.get(key);
            state.value = init ? init() : undefined;
        }
        return;
    }

    const shouldClear = typeof selector === 'function'
        ? selector
        : Array.isArray(selector)
            ? (key: string) => selector.includes(key)
            : (key: string) => key === selector;

    for (const key of Array.from(stateMap.keys())) {
        if (shouldClear(key)) {
            const init = stateInitializers.get(key);
            stateMap.get(key)!.value = init ? init() : undefined;
        }
    }
});

/**
 * Mock useAsyncData - Simulates Nuxt's data fetching composable
 */
export const mockUseAsyncData = vi.fn((key: string, handler: () => Promise<any>, options?: any) => {
    const data = ref(options?.default ? options.default() : null);
    const error = ref(null);
    const pending = ref(false);

    const execute = async () => {
        pending.value = true;
        try {
            const result = await handler();
            data.value = result;
            error.value = null;
        } catch (err) {
            error.value = err;
        } finally {
            pending.value = false;
        }
    };

    if (options?.server !== false || options?.client !== false) {
        execute();
    }

    return {
        data,
        error,
        pending,
        refresh: execute,
        execute
    };
});

/**
 * Mock useRuntimeConfig - Returns mock config
 */
export const mockUseRuntimeConfig = vi.fn(() => mockRuntimeConfigData);

/**
 * Mock useRoute - Returns mock route object
 */
export const mockUseRoute = vi.fn(() => mockRouteData);

/**
 * Mock useRouter - Returns a router-like object whose `currentRoute.value`
 * is the same `mockRouteData` we already expose to useRoute().
 *
 * useMarkASpotConfig switched from useRoute() to useRouter().currentRoute.value
 * to silence the Nuxt 4 "useRoute called within middleware" warning emitted
 * via workspace-visibility.global.ts. Tests that drive routes through
 * mockRouteData therefore need this mock so the composable's
 * `currentJurisdictionId` computed resolves identically.
 */
export const mockUseRouter = vi.fn(() => ({
    currentRoute: { value: mockRouteData },
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    resolve: vi.fn(),
    beforeEach: vi.fn(),
    afterEach: vi.fn()
}));

/**
 * Mock useNuxtApp - Returns mock Nuxt app instance
 */
export const mockUseNuxtApp = vi.fn(() => ({
    $t: (key: string, params?: Record<string, any>) => {
        if (key === 'service_unavailable.retry') {
            return `Service temporarily unavailable. Retrying in ${params?.seconds}s`;
        }
        return key;
    },
    $i18n: {
        t: (key: string) => key
    }
}));

/**
 * Mock navigateTo - records redirects without invoking a router.
 */
export const mockNavigateTo = vi.fn((target: unknown, options?: unknown) => ({
    target,
    options
}));

// ============================================================================
// Mock Composables that are Auto-Imported
// ============================================================================

/**
 * Mock online status
 */
export const mockIsOnline = ref(true);

export const mockUseOnlineStatus = vi.fn(() => ({
    isOnline: readonly(mockIsOnline),
    isOffline: computed(() => !mockIsOnline.value),
    lastOnlineAt: readonly(ref(Date.now())),
    offlineDuration: computed(() => 0),
    offlineDurationText: computed(() => '')
}));

/**
 * Mock jurisdiction data
 */
export const mockCurrentJurisdiction = ref<{ id: number, name: string, slug: string } | null>(null);

export const mockUseJurisdictions = vi.fn(() => ({
    jurisdictions: computed(() => []),
    count: computed(() => 0),
    hasMultiple: computed(() => false),
    loaded: computed(() => true),
    loading: computed(() => false),
    error: computed(() => null),
    currentJurisdiction: computed(() => mockCurrentJurisdiction.value),
    defaultJurisdiction: computed(() => mockCurrentJurisdiction.value),
    currentSlugFromPath: computed(() => null),
    needsSlugRouting: computed(() => false),
    allSlugs: computed(() => []),
    fetchJurisdictions: vi.fn(),
    getBySlug: vi.fn(),
    getById: vi.fn(),
    buildPath: (path: string) => path,
    stripJurisdictionPrefix: (path: string) => path
}));

// ============================================================================
// Export with Nuxt Names (for auto-import compatibility)
// ============================================================================

export const useState = mockUseState;
export const clearNuxtState = mockClearNuxtState;
export const useRoute = mockUseRoute;
export const useRouter = mockUseRouter;
export const useRuntimeConfig = mockUseRuntimeConfig;
export const useAsyncData = mockUseAsyncData;
export const useNuxtApp = mockUseNuxtApp;
export const navigateTo = mockNavigateTo;
export const useOnlineStatus = mockUseOnlineStatus;
export const useJurisdictions = mockUseJurisdictions;

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Clear all state between tests
 */
export const clearMockState = () => {
    stateMap.clear();
    stateInitializers.clear();
    mockRouteData.query = {};
    mockRouteData.params = {};
    mockRouteData.path = '/';
    mockRouteData.fullPath = '/';
    mockRuntimeConfigData.jurisdictionId = '';
    mockIsOnline.value = true;
    mockCurrentJurisdiction.value = null;
    vi.clearAllMocks();
};

/**
 * Get state map for debugging
 */
export const getStateMap = () => stateMap;
