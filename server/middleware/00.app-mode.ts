import { createError, defineEventHandler, getRequestURL } from 'h3';
import { resolveAppMode } from '../utils/app-mode-resolver';
import { hasValidDrupalSession } from '../utils/session';

/**
 * App Mode Server Middleware
 *
 * Controls which routes are accessible based on app mode.
 * This runs on the server (Nitro) level and cannot be bypassed from the client.
 *
 * Mode resolution priority:
 * 1. NUXT_APP_MODE ENV variable (static, always wins)
 * 2. Drupal jurisdiction host mapping (dynamic, fetched from /api/jurisdiction-hosts)
 * 3. Default: 'full'
 *
 * Modes:
 * - 'full' (default): All routes accessible (citizen + dashboard + auth)
 * - 'citizen': Only citizen routes. Blocks /dashboard/*, /auth/*, and auth API endpoints.
 *              Session cookies are stripped so no authenticated actions are possible.
 */

// API paths that are blocked in citizen mode (auth, session, dashboard data, user management)
const BLOCKED_API_PATHS = [
    'auth/',
    'session',
    'user/login',
    'user/logout',
    'user/register',
    'dashboard/',
    'group-members/',
    'escalation/',
    'delegation/'
];

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const envMode = config.appMode as string;

    // Priority 1: ENV override (static, no Drupal lookup needed)
    // Priority 2: Dynamic resolution from Drupal jurisdiction config
    // Priority 3: Default 'full'
    let mode: string;
    if (envMode === 'citizen' || envMode === 'full') {
        mode = envMode;
    } else {
        const hostname = getRequestURL(event).hostname;
        mode = await resolveAppMode(hostname);
    }

    // Store mode on event context for downstream handlers (proxy, etc.)
    event.context.appMode = mode;

    // Detect Drupal session cookie and expose on event context.
    // Route middleware can't reliably read request headers during SSR,
    // so we bridge the information here at the Nitro (H3) level.
    event.context.hasDrupalSession = hasValidDrupalSession(event);

    // Full mode: everything is accessible
    if (mode === 'full') {
        return;
    }

    let pathname: string;
    try {
        pathname = decodeURIComponent(getRequestURL(event).pathname).toLowerCase();
    } catch {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    if (mode === 'citizen') {
        // --- Page routes ---
        // Normalize: strip optional jurisdiction prefix (e.g. /Stadt-Koeln/dashboard -> /dashboard)
        const segments = pathname.split('/').filter(Boolean);
        const isDashboard = segments.includes('dashboard');
        const isAuth = segments.includes('auth');

        if (isDashboard || isAuth) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found'
            });
        }

        // --- API routes ---
        // Block auth/session/dashboard API endpoints so login is impossible
        if (pathname.startsWith('/api/')) {
            const apiPath = pathname.slice(5); // strip '/api/'

            const isBlocked = BLOCKED_API_PATHS.some(
                blocked => apiPath === blocked.replace(/\/$/, '') || apiPath.startsWith(blocked)
            );

            if (isBlocked) {
                throw createError({
                    statusCode: 403,
                    statusMessage: 'Not available in citizen mode'
                });
            }

            // Block PATCH/DELETE on content endpoints (defense in depth)
            // POST is allowed (anonymous report creation)
            if (['PATCH', 'PUT', 'DELETE'].includes(event.method)) {
                const isContentPath = apiPath.startsWith('jsonapi/') ||
                  apiPath.startsWith('georeport/');

                if (isContentPath) {
                    throw createError({
                        statusCode: 403,
                        statusMessage: 'Not available in citizen mode'
                    });
                }
            }
        }

        // --- Strip session cookies ---
        // Without session cookies, Drupal treats every request as anonymous.
        // This is the hardest enforcement: even if someone crafts a request
        // with a stolen session cookie, the proxy won't forward it.
        const rawCookies = event.node.req.headers.cookie;
        if (rawCookies) {
            // Remove Drupal session cookies (SESS* / SSESS*), keep others (e.g. consent)
            const filtered = rawCookies
                .split(';')
                .map(c => c.trim())
                .filter(c => !(/^S?SESS[a-f0-9]{32,}=/.test(c)))
                .join('; ');

            event.node.req.headers.cookie = filtered || undefined;
        }
    }
});
