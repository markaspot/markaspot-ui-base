/**
 * useDocsLinks
 *
 * Single source of truth for contextual links into the end-user documentation
 * at https://docs.mark-a-spot.com (issue #191).
 *
 * Why a composable and not hardcoded URLs in every page:
 * - the docs base URL lives in ONE place (overridable via the
 *   `DOCS_BASE_URL` build/runtime arg the issue proposes — see `baseUrl`);
 * - settings pages map to a doc anchor by a stable key, so adding/retargeting
 *   a "Learn more" link is a one-line edit here, not a hunt across pages.
 *
 * URL convention: the user guide (Nuxt Content) strips numeric path prefixes,
 * so the live route for `content/4.settings/1.categories.md` is
 * `/settings/categories` — NOT `/4.settings/1.categories`. Every path below
 * was verified to return 200 against the live site before being added. When
 * adding a new target, curl it first; do not link to a 404.
 *
 * `DashboardTip.cta_url` (useDashboardTips) intentionally keeps its own
 * absolute URLs — those are data rows, not call sites, and predate this
 * composable. They share the same base host.
 */

/**
 * Default docs host. The issue proposes a `DOCS_BASE_URL` config knob; we read
 * the public runtime config when present and fall back to the product-wide
 * default so the links work in every deployment (not just FastMap/CivicSpot).
 */
const DEFAULT_DOCS_BASE_URL = 'https://docs.mark-a-spot.com';

/**
 * Settings-page key -> doc path (relative to the docs base, no leading slash
 * needed but tolerated). Keys mirror the settings page filename so callers can
 * pass a literal that matches their route. Only pages with a real, published
 * doc page are listed — pages without docs simply render no "Learn more" link.
 */
export const SETTINGS_DOC_PATHS = Object.freeze({
    'categories': 'settings/categories',
    'statuses': 'settings/statuses',
    'branding': 'settings/branding',
    'map': 'settings/map-area',
    'map-layers': 'settings/map-area',
    'members': 'settings/team-members'
} as const);

export type SettingsDocKey = keyof typeof SETTINGS_DOC_PATHS;

interface UseDocsLinksApi {
    /** Absolute docs base URL, e.g. https://docs.mark-a-spot.com */
    baseUrl: string
    /** Build an absolute docs URL from a relative path (or pass an anchor). */
    docUrl: (path: string) => string
    /** Resolve a settings-page key to an absolute docs URL, or null if undocumented. */
    settingsDocUrl: (key: string) => string | null
    /** Common, named deep links used outside the settings map. */
    links: {
        createReport: string
        gettingStarted: string
    }
}

export const useDocsLinks = (): UseDocsLinksApi => {
    // Runtime-config override (optional). Guarded so the composable also works
    // in unit tests / non-Nuxt contexts where useRuntimeConfig is absent.
    let baseUrl = DEFAULT_DOCS_BASE_URL;
    try {
        const cfg = useRuntimeConfig?.();
        const fromConfig = cfg?.public?.docsBaseUrl;
        if (typeof fromConfig === 'string' && fromConfig.trim() !== '') {
            baseUrl = fromConfig.trim();
        }
    } catch {
        // Not in a Nuxt runtime — keep the default.
    }

    const root = baseUrl.replace(/\/+$/, '');

    const docUrl = (path: string): string => {
        const clean = String(path ?? '').replace(/^\/+/, '');
        return clean ? `${root}/${clean}` : root;
    };

    const settingsDocUrl = (key: string): string | null => {
        const path = (SETTINGS_DOC_PATHS as Record<string, string>)[key];
        return path ? docUrl(path) : null;
    };

    return {
        baseUrl: root,
        docUrl,
        settingsDocUrl,
        links: {
            createReport: docUrl('reports/create-report'),
            gettingStarted: docUrl('getting-started')
        }
    };
};
