import type { Jurisdiction, JurisdictionsResponse } from '~~/server/api/jurisdictions.get';
import { getRequestScopedValue } from '@/utils/requestScope';

/**
 * Jurisdictions Composable
 *
 * Manages jurisdiction data for multi-tenant URL routing.
 * Provides:
 * - List of available jurisdictions
 * - Current jurisdiction detection from URL path
 * - Routing helpers for jurisdiction-prefixed URLs
 *
 * URL Pattern: /[jurisdiction-slug]/requests, /[jurisdiction-slug]/report
 * Fallback: / (default jurisdiction when only one exists)
 */

interface JurisdictionsState {
    jurisdictions: Jurisdiction[]
    count: number
    hasMultiple: boolean
    loaded: boolean
    loading: boolean
    error: string | null
}

interface RequestCache {
    fetchPromise: Promise<void> | null
}

const clientRequestCache: RequestCache = {
    fetchPromise: null
};

/**
 * Strip a single trailing slash from a path so it matches the
 * Vue Router-resolved path of the corresponding page record.
 *
 * Kept side-effect free and unit-testable: a bare `/` is preserved so
 * the helper never produces an empty string for the root path.
 */
export const stripTrailingSlash = (path: string): string => {
    if (path.length > 1 && path.endsWith('/')) {
        return path.slice(0, -1);
    }
    return path;
};

/**
 * Mirrors the backend depth cap in JurisdictionHierarchyResolver so malformed
 * parent data can never produce a runaway walk.
 */
const MAX_HIERARCHY_DEPTH = 50;

/**
 * Expand a jurisdiction id to the set that scopes to it: `[self, ...descendants]`.
 *
 * A parent jurisdiction "contains" its child jurisdictions, so a parent slug
 * must surface reports filed against any descendant jurisdiction. This mirrors
 * the backend's `JurisdictionHierarchyResolver::getDescendantIds`, but reads the
 * SAME source the backend does: the `parentId` (field_parent_jurisdiction) that
 * `/api/jurisdictions` already carries onto every jurisdiction. It is therefore
 * authoritative, not a slug heuristic.
 *
 * Side-effect free (takes the list as an argument) so it is unit-testable
 * without Nuxt state. Cycle-guarded (visited set) and depth-capped, mirroring
 * the backend. A flat single-root tenant, or an id absent from the list (e.g. a
 * freshly provisioned workspace), returns `[id]` -- i.e. today's exact-match
 * behaviour.
 */
export const expandJurisdictionWithDescendants = (
    jurisdictions: Pick<Jurisdiction, 'id' | 'parentId'>[],
    jurisdictionId: number
): number[] => {
    const root = Number(jurisdictionId);
    if (!Number.isFinite(root)) return [];

    // Build parent -> children adjacency once from the cached list. Unlike the
    // backend's getDescendantIds (which filters children to the `jur` bundle),
    // we rely on /api/jurisdictions already returning only `jur` groups, so no
    // non-jurisdiction group can enter this map. If that endpoint ever broadens
    // its payload, add a bundle guard here to avoid widening scope.
    const childrenByParent = new Map<number, number[]>();
    for (const j of jurisdictions) {
        if (j.parentId == null) continue;
        const siblings = childrenByParent.get(j.parentId);
        if (siblings) {
            siblings.push(j.id);
        } else {
            childrenByParent.set(j.parentId, [j.id]);
        }
    }

    const result: number[] = [];
    const visited = new Set<number>();
    let frontier: number[] = [root];
    let depth = 0;

    while (frontier.length > 0 && depth <= MAX_HIERARCHY_DEPTH) {
        const next: number[] = [];
        for (const id of frontier) {
            if (visited.has(id)) continue;
            visited.add(id);
            result.push(id);
            for (const child of childrenByParent.get(id) ?? []) {
                if (!visited.has(child)) next.push(child);
            }
        }
        frontier = next;
        depth++;
    }

    return result;
};

export const useJurisdictions = () => {
    // NOTE: useRoute() is called lazily inside computed properties to avoid
    // Nuxt 4 warning when composable is used in middleware (middleware should use to/from params)

    // Use useState for SSR-safe singleton state (prevents memory leaks)
    // This creates a single shared state instance per SSR request context
    // Single-tenant flag: set by SSR plugin when a runtime jurisdiction ID is configured.
    // Suppresses slug-based routing even when Drupal reports multiple jurisdictions.
    const singleTenantFlag = useState<boolean>('jurisdiction-single-tenant', () => false);
    const isSingleTenant = computed((): boolean => singleTenantFlag.value === true);
    const requestEvent = import.meta.server ? useRequestEvent() : null;
    const getRequestCache = (): RequestCache => getRequestScopedValue({
        event: requestEvent,
        key: '__jurisdictionsRequestCache',
        create: () => ({ fetchPromise: null }),
        clientValue: clientRequestCache
    });

    const state = useState<JurisdictionsState>('jurisdictions-state', () => ({
        jurisdictions: [],
        count: 0,
        hasMultiple: false,
        loaded: false,
        loading: false,
        error: null
    }));

    /**
   * Fetch jurisdictions from API (cached after first load)
   * Uses SSR-preloaded data when available, otherwise fetches
   */
    const fetchJurisdictions = async (force = false): Promise<void> => {
        // If SSR preloaded data and not forcing, skip fetch
        if (state.value.loaded && !force) {
            // Data already available (from SSR plugin or previous client fetch)
            return;
        }

        const requestCache = getRequestCache();

        // Reuse ongoing fetch to prevent duplicate requests
        if (requestCache.fetchPromise && !force) return requestCache.fetchPromise;

        state.value.loading = true;
        state.value.error = null;

        // Client-side: Use $fetch for data fetching
        // When force-refreshing, pass refresh=true to bypass the server-side
        // in-memory cache (e.g., after a new workspace was just provisioned)
        const url = force ? '/api/jurisdictions?refresh=true' : '/api/jurisdictions';
        requestCache.fetchPromise = $fetch<JurisdictionsResponse>(url)
            .then((response) => {
                state.value.jurisdictions = response.jurisdictions || [];
                state.value.count = response.count || 0;
                state.value.hasMultiple = response.hasMultiple ?? false;
                state.value.loaded = true;
                console.log(`[useJurisdictions] Loaded ${state.value.count} jurisdictions, hasMultiple: ${state.value.hasMultiple}`);
            })
            .catch((error) => {
                const msg = error instanceof Error ? error.message : 'Unknown error';
                console.error('[useJurisdictions] Fetch error:', msg);
                state.value.error = msg;
            })
            .finally(() => {
                state.value.loading = false;
                requestCache.fetchPromise = null; // Clear for next force fetch
            });

        return requestCache.fetchPromise;
    };

    /**
   * Get jurisdiction by slug
   */
    const getBySlug = (slug: string): Jurisdiction | undefined => {
        return state.value.jurisdictions.find(j => j.slug === slug);
    };

    /**
   * Get jurisdiction by ID
   */
    const getById = (id: number): Jurisdiction | undefined => {
        return state.value.jurisdictions.find(j => j.id === id);
    };

    /**
   * Expand a jurisdiction id to `[self, ...descendants]` using the cached list,
   * so a parent-jurisdiction view includes its child-jurisdiction reports
   * (parity with the backend hierarchy rollup). See the pure
   * `expandJurisdictionWithDescendants` for the walk semantics.
   */
    const expandWithDescendants = (jurisdictionId: number): number[] =>
        expandJurisdictionWithDescendants(state.value.jurisdictions, jurisdictionId);

    /**
   * Get the default jurisdiction
   */
    const defaultJurisdiction = computed((): Jurisdiction | undefined => {
        return state.value.jurisdictions.find(j => j.isDefault) || state.value.jurisdictions[0];
    });

    /**
   * Get jurisdiction slug from route params (set by [[jurisdiction]] routes)
   * Returns null if no jurisdiction param in URL
   *
   * Returns the slug even if not yet in the cached jurisdiction list,
   * because the jurisdiction middleware validates unknown slugs against the
   * Settings API before allowing navigation to proceed.
   */
    const currentSlugFromPath = computed((): string | null => {
        // Call useRoute() lazily to avoid middleware warning
        const route = useRoute();
        const jurisdictionParam = route.params.jurisdiction as string | undefined;
        return jurisdictionParam || null;
    });

    /**
   * Get current jurisdiction based on URL route params
   * Falls back to default if no jurisdiction in URL
   */
    const currentJurisdiction = computed((): Jurisdiction | undefined => {
        // Call useRoute() lazily to avoid middleware warning
        const route = useRoute();
        const jurisdictionParam = route.params.jurisdiction as string | undefined;
        if (jurisdictionParam) {
            const jurisdiction = getBySlug(jurisdictionParam);
            if (jurisdiction) return jurisdiction;
        }
        return defaultJurisdiction.value;
    });

    /**
   * Check if URL routing with slugs is needed
   * Only true when there are multiple jurisdictions
   */
    const needsSlugRouting = computed((): boolean => {
        return state.value.hasMultiple && !isSingleTenant.value;
    });

    /**
   * Build a jurisdiction-prefixed path
   * Only adds prefix when multiple jurisdictions exist
   *
   * The returned path is normalised so the resulting string matches the
   * route Nuxt generates for the page (no trailing slash, no double
   * slashes). This is critical for `aria-current="page"` to land on
   * sidebar links: Nuxt UI's `<UNavigationMenu>` derives the active flag
   * via NuxtLink's `isActive`, which in turn compares the link's resolved
   * route against the current route. When the link's `to` carries a
   * trailing slash but the route record has none (e.g. `[[jurisdiction]]/
   * index.vue` resolves to `/amsterdam`, not `/amsterdam/`), the match
   * fails for the *path* comparison and Reka UI's `NavigationMenuLink`
   * never stamps `aria-current="page"` -- which also breaks the visual
   * active state because the dashboard layout binds active styling to
   * `aria-[current=page]:text-highlighted`.
   *
   * @param path - The path without jurisdiction prefix (e.g., '/requests')
   * @param jurisdictionSlug - Optional jurisdiction slug (uses current if not provided)
   */
    const buildPath = (path: string, jurisdictionSlug?: string): string => {
        // Ensure path starts with /
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;

        // Explicit or current-route slugs may come from freshly provisioned
        // workspaces before /api/jurisdictions has populated hasMultiple.
        const slugFromPath = currentSlugFromPath.value;
        const earlySlug = jurisdictionSlug || slugFromPath;
        if (earlySlug && !isSingleTenant.value) {
            return stripTrailingSlash(`/${earlySlug}${normalizedPath}`);
        }

        // No prefix needed for single jurisdiction or single-tenant mode
        if (!state.value.hasMultiple || isSingleTenant.value) {
            return stripTrailingSlash(normalizedPath);
        }

        // Prefer the slug from the URL path (which may be a newly provisioned
        // workspace not yet in the cached list) over the resolved jurisdiction
        const slug = currentJurisdiction.value?.slug;
        if (!slug) {
            return stripTrailingSlash(normalizedPath);
        }

        return stripTrailingSlash(`/${slug}${normalizedPath}`);
    };

    /**
   * Strip jurisdiction prefix from a path
   * Returns the path without the jurisdiction slug prefix
   */
    const stripJurisdictionPrefix = (path: string): string => {
        const slug = currentSlugFromPath.value;
        if (!slug) return path;

        const prefix = `/${slug}`;
        if (path.startsWith(prefix)) {
            const stripped = path.slice(prefix.length);
            return stripped || '/';
        }
        return path;
    };

    /**
   * Get all jurisdiction slugs for route matching
   */
    const allSlugs = computed((): string[] => {
        return state.value.jurisdictions
            .map(j => j.slug)
            .filter((s): s is string => s !== null);
    });

    return {
    // State (readonly)
        jurisdictions: computed(() => state.value.jurisdictions),
        count: computed(() => state.value.count),
        hasMultiple: computed(() => state.value.hasMultiple),
        loaded: computed(() => state.value.loaded),
        loading: computed(() => state.value.loading),
        error: computed(() => state.value.error),

        // Flags
        isSingleTenant,

        // Computed
        defaultJurisdiction,
        currentJurisdiction,
        currentSlugFromPath,
        needsSlugRouting,
        allSlugs,

        // Methods
        fetchJurisdictions,
        getBySlug,
        getById,
        expandWithDescendants,
        buildPath,
        stripJurisdictionPrefix
    };
};
