/**
 * Demo-mode robots header.
 *
 * Sets `X-Robots-Tag: noindex, nofollow` on every response (HTML AND API)
 * when `runtimeConfig.public.demoMode === true`. The blanket scope is
 * intentional: the header reaches non-JS crawlers that never execute the
 * `<meta name="robots">` injected via `useHead`, which is the failure mode
 * behind real Amsterdam citizens landing on demo.mark-a-spot.com via search
 * and submitting reports that go nowhere. A blanket header is safer than a
 * route-aware one because crawlers do not honour origin-side route logic.
 *
 * We resolve the flag through `useRuntimeConfig(event).public.demoMode`
 * (rather than `process.env.NUXT_PUBLIC_DEMO_MODE`) for parity with the
 * other server middlewares in this project (`00.app-mode.ts`, `host.ts`).
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/432
 */

export default defineEventHandler((event) => {
    if (useRuntimeConfig(event).public.demoMode !== true) return;
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow');
});
