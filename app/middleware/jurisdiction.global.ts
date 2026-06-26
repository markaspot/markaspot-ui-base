import {
    getFastmapLocaleFromPath,
    isFastmapMarketingPath,
    isFastmapReservedPathWithoutPage,
    stripFastmapLocalePrefix
} from '../../fastmap-layer/lib/locale-routing';
import type { AuthUser } from '~~/types/auth';

/**
 * Jurisdiction Middleware (Global)
 *
 * Handles jurisdiction-based URL routing with [[jurisdiction]] optional param:
 * 1. Loads available jurisdictions on first request
 * 2. Validates jurisdiction slug from URL if present
 * 3. Redirects to default jurisdiction when multiple exist and none specified
 *
 * URL patterns (via [[jurisdiction]] folder):
 * - /requests → works (jurisdiction undefined)
 * - /stadt-koeln/requests → works (jurisdiction = "stadt-koeln")
 *
 * Redirect behavior:
 * - Single jurisdiction: No redirect needed
 * - Multiple jurisdictions: /requests → /[default-slug]/requests
 *
 * Auth routes are under [[jurisdiction]]/auth/* so they inherit the
 * jurisdiction theme. Claim routes may receive freshly provisioned workspace
 * slugs before the public jurisdiction index has caught up.
 */

export default defineNuxtRouteMiddleware(async (to, _from) => {
    // Skip processing for API routes and assets.
    if (to.path.startsWith('/api/') || to.path.startsWith('/_')) {
        return;
    }
    // Skip FastMap marketing routes (handled by fastmap-layer, not jurisdiction).
    // Uses the shared isFastmapMarketingPath() as single source of truth.
    const strippedPath = stripFastmapLocalePrefix(to.path);
    if (isFastmapMarketingPath(strippedPath)) {
        // Some marketing paths are reserved as namespace prefixes but have no
        // top-level index page (e.g. /partner has only /partner/[slug]). Without
        // this explicit 404 Vue Router falls through to [[jurisdiction]]/index
        // and renders the workspace-picker landing instead of not-found.
        if (isFastmapReservedPathWithoutPage(strippedPath)) {
            return abortNavigation(createError({
                statusCode: 404,
                statusMessage: 'Not found'
            }));
        }
        return;
    }
    const pathSegments = to.path.split('/').filter(Boolean);
    const authSegmentIndex = pathSegments.indexOf('auth');
    const isAuthClaimRoute = authSegmentIndex !== -1 && pathSegments[authSegmentIndex + 1] === 'claim';
    if (isAuthClaimRoute) {
        return;
    }
    // Skip locale-prefixed routes (e.g. /de/, /pl/start/templates).
    // Server-side middleware rewrites these to unprefixed paths, but the
    // browser URL retains the prefix. Vue Router's [[jurisdiction]] catch-all
    // matches the locale code as a jurisdiction param. We must not treat
    // 2-letter locale codes as jurisdiction slugs.
    const localePrefix = getFastmapLocaleFromPath(to.path);
    if (localePrefix && isFastmapMarketingPath(stripFastmapLocalePrefix(to.path))) {
        return;
    }

    const { fetchJurisdictions, hasMultiple, getBySlug, getById, defaultJurisdiction, isSingleTenant, needsSlugRouting } = useJurisdictions();

    // Load jurisdictions (uses SSR-preloaded data if available, otherwise fetches)
    await fetchJurisdictions();

    // Single-tenant mode: skip slug redirects when the SSR plugin resolved the
    // jurisdiction from ENV (NUXT_JURISDICTION_ID). The flag is set in the SSR
    // plugin payload. We read it from useJurisdictions() which wraps the useState.
    // Also check needsSlugRouting which returns false for single-tenant setups.
    if (isSingleTenant.value || !needsSlugRouting.value) {
        return;
    }

    // Get jurisdiction from route params (set by [[jurisdiction]] routes)
    const jurisdictionParam = to.params.jurisdiction as string | undefined;

    if (jurisdictionParam) {
        // Validate jurisdiction slug
        const jurisdiction = getBySlug(jurisdictionParam);

        if (!jurisdiction) {
            // The slug is unknown - it might be a newly provisioned workspace
            // that was added after the last jurisdictions fetch (5-minute cache).
            // Force-refresh with cache bypass to get the latest list from Drupal.
            await fetchJurisdictions(true);
            const freshJurisdiction = getBySlug(jurisdictionParam);

            if (freshJurisdiction) {
                // Workspace now exists after refresh - continue with correct slug
                return;
            }

            // Platform-admin bypass: the public/user jurisdictions list does
            // not include workspaces the admin is not a member of. The dashboard
            // workspace switcher exposes those via /api/admin/jurisdictions.
            // Trust that endpoint as a secondary slug authority — it has its own
            // `platformAdminAccessCheck` access callback (uid=1 OR
            // 'administrator' role), so it cannot leak unpublished workspaces
            // to non-admin callers.
            //
            // SSR: mirror the workspace-visibility pattern. We cannot read the
            // role list server-side reliably (user.value is null pre-hydration
            // and the admin endpoint requires session role context). Use
            // hasDrupalSession as a proxy: no session → fall through to 404;
            // session present → let SSR proceed and defer the slug-validity
            // check to the client hydration pass. Without this branch, admin
            // bookmarks and hard refreshes on admin-only workspaces render an
            // SSR 404 that never re-runs middleware.
            if (import.meta.server) {
                // SSR: we cannot read role claims here (user state is null
                // pre-hydration). Returning here does NOT grant access — it
                // only prevents a false SSR 404 for admin bookmarks. The
                // client hydration pass re-runs isPlatformAdmin and calls
                // abortNavigation(404) if the user is not a platform admin.
                // DO NOT add SSR rendering of privileged data that depends on
                // this branch — only public default-jurisdiction config gets
                // emitted, never admin-only payloads.
                const event = useRequestEvent();
                if (event?.context?.hasDrupalSession) {
                    return;
                }
            } else {
                const authUser = useState<AuthUser | null>('auth_user');
                const u = authUser.value;
                const isPlatformAdmin = !!u &&
                  (String(u.uid ?? '') === '1' || (Array.isArray(u.roles) && u.roles.includes('administrator')));
                if (isPlatformAdmin) {
                    // Reuse the dashboard switcher's cached admin-jurisdictions
                    // state when fresh for the current uid, otherwise fetch.
                    const cachedAdminJurs = useState<Array<{ slug: string | null }>>(
                        'admin-jurisdictions',
                        () => []
                    );
                    const cachedLoadedFor = useState<string | null>(
                        'admin-jurisdictions-loaded',
                        () => null
                    );
                    const uidStr = String(u!.uid ?? '');
                    if (cachedLoadedFor.value === uidStr && cachedAdminJurs.value.length > 0) {
                        if (cachedAdminJurs.value.some(j => j.slug === jurisdictionParam)) {
                            return;
                        }
                    } else {
                        try {
                            const apiClient = useApiClient();
                            const data = await apiClient.get<{ jurisdictions?: Array<{ slug: string | null }> }>(
                                '/api/admin/jurisdictions'
                            );
                            const list = data?.jurisdictions ?? [];
                            cachedAdminJurs.value = list;
                            cachedLoadedFor.value = uidStr;
                            if (list.some(j => j.slug === jurisdictionParam)) {
                                return;
                            }
                        } catch (err) {
                            console.warn('[jurisdiction] admin-jurisdictions fetch failed', err);
                        }
                    }
                }
            }

            // Still not in the jurisdiction list after a forced refresh AND
            // not in the admin-only list. Refuse the navigation.
            return abortNavigation(createError({
                statusCode: 404,
                statusMessage: 'Jurisdiction not found'
            }));
        }

        // Valid jurisdiction - continue
        return;
    }

    // No jurisdiction in URL
    if (hasMultiple.value) {
        // Dashboard routes require an explicit jurisdiction slug for correct data
        // loading AND cross-tenant scope isolation. Without a slug the dashboard
        // listings load all published reports across all tenants — see
        // session_handoff_2026-05-13 (cross-tenant leak observed live on cp1).
        // We must redirect server-side too, not only client-side, because the
        // SSR-rendered HTML would otherwise contain the leaky listing before
        // the client middleware ever runs.
        const isDashboardRoute = to.path === '/dashboard' || to.path.startsWith('/dashboard/');
        if (isDashboardRoute) {
            let targetSlug: string | undefined;

            if (import.meta.server) {
                // SSR: auth_user is null pre-hydration. Use the SSR-resolved
                // jurisdiction key (set by 01.jurisdiction-ssr.ts) when present,
                // otherwise fall back to defaultJurisdiction so the SSR payload
                // is at least consistent. The client middleware will re-evaluate
                // with the hydrated auth_user.groups[0].slug for the precise
                // primary tenant of the user.
                const ssrEvent = useRequestEvent();
                if (!ssrEvent?.context?.hasDrupalSession) {
                    // Anonymous on /dashboard/* — redirect to login. We cannot
                    // defer this to pro-layer/app/middleware/auth.ts because
                    // that middleware short-circuits on SSR (`if
                    // (import.meta.server) return;`), so a 404 abort here would
                    // never reach the client-side auth flow. Build a
                    // jurisdiction-prefixed login URL when defaultJurisdiction
                    // is known, else unprefixed.
                    const loginSlug = defaultJurisdiction.value?.slug;
                    const loginPath = loginSlug ? `/${loginSlug}/auth/login` : '/auth/login';
                    return navigateTo({
                        path: loginPath,
                        // pro-layer/.../auth/login.vue:271 reads `route.query.redirect`.
                        // NOT `redirect_to` — those are different query params and the
                        // login page silently ignores the unknown one.
                        query: { redirect: to.fullPath }
                    }, { replace: true, redirectCode: 302 });
                }
                targetSlug = defaultJurisdiction.value?.slug;
            } else {
                // Client: prefer the slug from auth_user.groups directly.
                // getById() relies on the public jurisdictions cache which
                // EXCLUDES admin-only / demo workspaces (visibility != public).
                // A freshly provisioned demo tenant would fall through to
                // defaultJurisdiction here, sending the owner to a tenant they
                // do not belong to.
                const authUser = useState<AuthUser | null>('auth_user');
                const userJurs = (authUser.value?.groups || []).filter(g => g.type === 'jur');
                if (userJurs.length > 0) {
                    targetSlug = userJurs[0].slug || undefined;
                    if (!targetSlug) {
                        const userJur = getById(Number(userJurs[0].id));
                        if (userJur?.slug) targetSlug = userJur.slug;
                    }
                }
                if (!targetSlug) {
                    targetSlug = defaultJurisdiction.value?.slug;
                }
            }

            if (targetSlug) {
                return navigateTo({ path: `/${targetSlug}${to.path}`, query: to.query }, { replace: true });
            }
        }
    }
    // For public pages, the config system uses the default jurisdiction when no slug is specified.
});
