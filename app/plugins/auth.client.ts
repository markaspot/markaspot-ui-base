/**
 * Auth Plugin (Client-side only)
 *
 * Checks authentication status when the app loads.
 * Runs only on client-side to avoid SSR issues with cookies.
 *
 * This plugin ALWAYS checks for existing Drupal sessions (via /api/auth/status),
 * regardless of whether passwordless feature is enabled. This ensures users
 * who logged in via Drupal admin are recognized in the frontend.
 */
export default defineNuxtPlugin({
    name: 'auth',
    async setup() {
        // Extra safety: only run on client
        if (!import.meta.client) {
            return;
        }

        const { checkStatus } = usePasswordlessAuth();
        const authChecked = useState<boolean>('auth_checked', () => false);

        try {
            await checkStatus();
        } catch (error) {
            // Don't crash the app - allow anonymous access
            // Error is already logged in checkStatus
        } finally {
            authChecked.value = true;
        }
    }
});
