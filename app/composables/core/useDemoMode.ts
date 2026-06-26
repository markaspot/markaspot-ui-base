/**
 * useDemoMode
 *
 * Single source of truth for the demo-instance kill-switch.
 *
 * The flag is wired through `runtimeConfig.public.demoMode`, which is baked at
 * SSR build time from `NUXT_PUBLIC_DEMO_MODE=true`. We deliberately resolve
 * `useRuntimeConfig()` at setup time (not inside the computed) to avoid the
 * "inject() can only be used inside setup()" trap that hits when Vue 3
 * setup-only hooks are called lazily during scheduler flush.
 *
 * SSR safety: the modal's `isModalOpen` lives in `useState` so concurrent SSR
 * requests do not share visibility state through a Node module singleton. The
 * pending-resolver promise is a client-only concern (a real human clicking
 * Cancel/Continue is by definition browser-side); on the server the gate
 * resolves `true` synchronously and the dedicated `/lite` server block in
 * `server/routes/lite.{get,post}.ts` short-circuits non-JS submissions.
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/432
 */

import type { Ref } from 'vue';

export interface DemoSubmissionGate {
    /**
     * Open a blocking confirmation modal before a real GeoReport POST.
     *
     * Resolves `true` when the visitor explicitly clicks "Submit demo report"
     * and `false` when they cancel (Cancel button, ESC, or backdrop click —
     * see `DemoSubmitConfirmModal.vue` for the user-side semantics). When
     * demo mode is off this is a synchronous no-op pass-through, so
     * production tenants pay no UX cost.
     */
    confirmDemoSubmission: () => Promise<boolean>
    /** Whether the modal is currently visible. Drives the global mount point. */
    isModalOpen: Readonly<Ref<boolean>>
    /** Internal: resolve the pending gate (called by the modal component). */
    resolveModal: (confirmed: boolean) => void
}

// Pending resolver lives in the closure scope of a single browser session.
// Concurrent gate requests imply a UI bug (the submit button is disabled
// while submission is in flight); resolving false on re-entry is safer than
// queuing because queuing could submit after a user-cancelled prior gate.
let pendingResolver: ((value: boolean) => void) | null = null;

/**
 * Indirection over `import.meta.client` so unit tests can flip the SSR/CSR
 * branch via `__setIsClientForTests`. Production code should never call
 * either of these — they exist purely to make the gate's SSR-safety branch
 * testable under Vitest, which doesn't replace `import.meta.client` the way
 * the Nuxt build pipeline does.
 */
let isClientOverride: boolean | null = null;
const isClient = (): boolean =>
    isClientOverride !== null ? isClientOverride : import.meta.client === true;

export const useDemoMode = (): {
    isDemoMode: Readonly<Ref<boolean>>
    isBannerVisible: Readonly<Ref<boolean>>
    isModalOpen: Readonly<Ref<boolean>>
    dismissBanner: () => void
    confirmDemoSubmission: () => Promise<boolean>
    resolveModal: (confirmed: boolean) => void
} => {
    const runtimeConfig = useRuntimeConfig();
    const isDemoMode = computed(() => runtimeConfig.public.demoMode === true);

    // Per-request reactive flag. `useState` ensures SSR isolation between
    // concurrent visitors and hydrates correctly on the client.
    const isModalOpen = useState<boolean>('demoMode:isModalOpen', () => false);
    const isBannerDismissed = useState<boolean>('demoMode:isBannerDismissed', () => false);
    const isBannerVisible = computed(() => isDemoMode.value && !isBannerDismissed.value);

    const dismissBanner = (): void => {
        isBannerDismissed.value = true;
    };

    const confirmDemoSubmission = (): Promise<boolean> => {
        if (!isDemoMode.value) return Promise.resolve(true);
        // Server-rendered submissions never reach this composable from a real
        // form (those go through `/lite`, which has its own server-side
        // block). If somehow invoked during SSR, pass through — the lite
        // route is the canonical defense for non-JS clients.
        if (!isClient()) return Promise.resolve(true);
        if (pendingResolver) return Promise.resolve(false);
        return new Promise<boolean>((resolve) => {
            pendingResolver = resolve;
            isModalOpen.value = true;
        });
    };

    const resolveModal = (confirmed: boolean): void => {
        const resolver = pendingResolver;
        pendingResolver = null;
        isModalOpen.value = false;
        resolver?.(confirmed);
    };

    return {
        isDemoMode: readonly(isDemoMode),
        isBannerVisible: readonly(isBannerVisible),
        isModalOpen: readonly(isModalOpen),
        dismissBanner,
        confirmDemoSubmission,
        resolveModal
    };
};

/**
 * Test-only reset hook. Vitest mounts the same module across multiple cases,
 * so the `pendingResolver` closure must be cleared between tests to keep
 * suites independent. Production code never imports this.
 */
export const __resetDemoModeForTests = (): void => {
    pendingResolver = null;
    isClientOverride = null;
};

/**
 * Test-only override for the `import.meta.client` branch. Vitest does not
 * replace that constant the way the Nuxt build pipeline does, so the
 * SSR-safety guard would otherwise default to false in unit tests and turn
 * the gate into a permanent pass-through. Pass `true` to simulate a browser
 * tier, `false` to simulate SSR. Production code never imports this.
 */
export const __setIsClientForTests = (value: boolean | null): void => {
    isClientOverride = value;
};
