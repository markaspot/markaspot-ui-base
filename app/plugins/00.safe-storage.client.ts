/**
 * Safe localStorage polyfill for browsers that block storage access.
 *
 * Chrome blocks localStorage when "Block third-party cookies" or similar
 * privacy settings are active. Without this guard, the entire app crashes
 * with: "Failed to read the 'localStorage' property from 'Window'"
 *
 * Runs before all other plugins (00. prefix + enforce: pre) and provides
 * a Proxy-based in-memory fallback so the rest of the app works gracefully
 * without persistence. Uses Proxy to support Object.keys(localStorage)
 * which is used by cache-cleanup routines in 5+ composables.
 */
export default defineNuxtPlugin({
    name: 'safe-storage',
    enforce: 'pre',
    setup() {
        try {
            const key = '__storage_test__';
            localStorage.setItem(key, '1');
            localStorage.removeItem(key);
        } catch (err) {
            // Only install polyfill for SecurityError (blocked storage)
            // QuotaExceededError means storage works but is full
            const isBlocked = err instanceof DOMException && (
                err.name === 'SecurityError' ||
                err.name === 'InvalidAccessError'
            );
            if (!isBlocked) {
                console.warn('[SafeStorage] localStorage error (not blocked):', err);
                return;
            }

            const store = new Map<string, string>();

            const target: Storage = {
                getItem: (key: string) => store.get(key) ?? null,
                setItem: (key: string, value: string) => {
                    store.set(key, String(value));
                },
                removeItem: (key: string) => {
                    store.delete(key);
                },
                clear: () => store.clear(),
                get length() {
                    return store.size;
                },
                key: (index: number) => [...store.keys()][index] ?? null
            };

            // Proxy ensures Object.keys(localStorage) returns stored keys,
            // not method names. Required for cache-cleanup routines.
            const memoryStorage = new Proxy(target, {
                ownKeys: () => [...store.keys()],
                getOwnPropertyDescriptor: (_t, key) => {
                    if (typeof key === 'string' && store.has(key)) {
                        return { enumerable: true, configurable: true, value: store.get(key) };
                    }
                    return undefined;
                },
                get: (t, prop) => {
                    if (typeof prop === 'string' && store.has(prop)) return store.get(prop);
                    return (t as any)[prop];
                }
            });

            try {
                Object.defineProperty(window, 'localStorage', {
                    value: memoryStorage,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
            } catch {
                console.error('[SafeStorage] Cannot override localStorage');
                return;
            }

            console.warn('[SafeStorage] localStorage blocked by browser, using in-memory fallback');
        }
    }
});
