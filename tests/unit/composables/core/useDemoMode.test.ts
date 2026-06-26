/**
 * useDemoMode unit tests (issue #432)
 *
 * Covers the submission-gate semantics that protect the demo instance:
 *   - production tenants (flag off): no-op pass-through, resolves true
 *   - demo tenants (flag on): opens the modal and only resolves on
 *     explicit Cancel/Continue
 *   - re-entrant calls resolve false to avoid races
 *
 * The gate is the actual safeguard; the banner is reinforcement. Regressions
 * here put the demo back into "real citizens submit reports that go nowhere"
 * territory.
 */
import { describe, expect, it, beforeEach } from 'vitest';

import {
    useDemoMode,
    __resetDemoModeForTests,
    __setIsClientForTests
} from '../../../../app/composables/core/useDemoMode';
import { mockRuntimeConfigData, clearMockState } from '../../__mocks__/nuxt';

describe('useDemoMode (#432)', () => {
    beforeEach(() => {
        clearMockState();
        // Drop the closure-scoped pending resolver so cases stay isolated;
        // a leak here would let a Cancel from a prior test silently resolve
        // a Continue in the next.
        __resetDemoModeForTests();
        // Vitest doesn't replace `import.meta.client` the way the Nuxt build
        // does, so we simulate the browser tier by default. The SSR branch
        // has its own coverage in the dedicated test below.
        __setIsClientForTests(true);
        mockRuntimeConfigData.public = {
            ...mockRuntimeConfigData.public,
            demoMode: false
        } as typeof mockRuntimeConfigData.public;
    });

    it('reports demoMode false when the flag is off', () => {
        const { isDemoMode } = useDemoMode();
        expect(isDemoMode.value).toBe(false);
    });

    it('reports demoMode true when the runtime flag is set', () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        const { isDemoMode } = useDemoMode();
        expect(isDemoMode.value).toBe(true);
    });

    it('shows the banner in demo mode until dismissed without disabling the submission gate', async () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        const { isBannerVisible, dismissBanner, confirmDemoSubmission, isModalOpen, resolveModal } = useDemoMode();

        expect(isBannerVisible.value).toBe(true);
        dismissBanner();
        expect(isBannerVisible.value).toBe(false);

        const pending = confirmDemoSubmission();
        await Promise.resolve();
        expect(isModalOpen.value).toBe(true);
        resolveModal(false);
        await expect(pending).resolves.toBe(false);
    });

    it('passes submissions through synchronously when demo mode is off', async () => {
        const { confirmDemoSubmission, isModalOpen } = useDemoMode();
        await expect(confirmDemoSubmission()).resolves.toBe(true);
        // No modal mount on production tenants — that would be visual noise.
        expect(isModalOpen.value).toBe(false);
    });

    it('opens the modal and resolves true on Continue', async () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        const { confirmDemoSubmission, isModalOpen, resolveModal } = useDemoMode();

        const pending = confirmDemoSubmission();
        // Microtask flush so the resolver registers before we assert.
        await Promise.resolve();
        expect(isModalOpen.value).toBe(true);

        resolveModal(true);
        await expect(pending).resolves.toBe(true);
        expect(isModalOpen.value).toBe(false);
    });

    it('opens the modal and resolves false on Cancel — keeping the form intact', async () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        const { confirmDemoSubmission, isModalOpen, resolveModal } = useDemoMode();

        const pending = confirmDemoSubmission();
        await Promise.resolve();
        expect(isModalOpen.value).toBe(true);

        resolveModal(false);
        await expect(pending).resolves.toBe(false);
        expect(isModalOpen.value).toBe(false);
    });

    it('passes through on the server tier — the /lite route handles non-JS submissions', async () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        __setIsClientForTests(false);
        const { confirmDemoSubmission, isModalOpen } = useDemoMode();
        await expect(confirmDemoSubmission()).resolves.toBe(true);
        // The modal must NOT mount during SSR — it would have nowhere to
        // render a real human click anyway.
        expect(isModalOpen.value).toBe(false);
    });

    it('resolves a re-entrant call with false rather than queuing', async () => {
        (mockRuntimeConfigData.public as Record<string, unknown>).demoMode = true;
        const { confirmDemoSubmission, resolveModal } = useDemoMode();

        const first = confirmDemoSubmission();
        await Promise.resolve();
        // A second call while the first is still pending must NOT queue —
        // queuing would let a user-cancelled prior gate still fire after
        // the second resolves.
        await expect(confirmDemoSubmission()).resolves.toBe(false);

        resolveModal(true);
        await expect(first).resolves.toBe(true);
    });
});
