/**
 * Pinia Dev Guard Plugin (Client-side only)
 *
 * Prevents "getActivePinia() was called but there was no active Pinia" errors
 * during client-side hydration and error recovery.
 *
 * Root cause: In Vite dev mode, Nuxt's error recovery after hydration mismatches
 * can re-evaluate component setup code in a context where activePinia has been
 * cleared. Production builds are unaffected because the bundled chunk graph
 * guarantees correct initialization order.
 *
 * This plugin:
 * 1. Re-sets activePinia after the Pinia plugin has run (guard for initial hydration)
 * 2. Hooks into app:error to restore activePinia during error recovery
 * 3. Hooks into vue:error to restore activePinia on Vue-level errors
 */
import { setActivePinia } from 'pinia';
import type { Pinia } from 'pinia';

export default defineNuxtPlugin({
    name: 'mas-pinia-dev-guard',
    enforce: 'post',
    dependsOn: ['pinia'],

    setup(nuxtApp) {
        const pinia = nuxtApp.$pinia as Pinia | undefined;
        if (!pinia) return;

        // Ensure activePinia is set after all plugins have run.
        // The Pinia plugin sets it, but async plugin chains or error handlers
        // can clear it before component setup runs.
        setActivePinia(pinia);

        // Restore activePinia during Nuxt error recovery (dev only).
        // When a hydration mismatch triggers app:error, Nuxt may re-render
        // components whose setup() calls useStore(). Without activePinia,
        // those calls throw, producing the cascade:
        //   hydration mismatch -> pinia error -> "reading selectedReport" -> pinia error
        if (import.meta.dev) {
            nuxtApp.hook('app:error', () => {
                setActivePinia(pinia);
            });

            nuxtApp.hook('vue:error', () => {
                setActivePinia(pinia);
            });
        }
    }
});
