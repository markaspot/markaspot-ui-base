/**
 * Deep-link URL composition for facility-based reporting (#379, #380).
 *
 * The URL contract (`?facility=<id>` query param) is consumed by
 * `useFacilityReporting.ts:132-136` to pre-select a facility on the public
 * report form. This helper builds the absolute URL that admins copy into
 * email / signage / QR codes.
 *
 * Permalink shape decision (#379): `<origin>/<slug>/report?facility=<id>` for
 * multi-tenant, `<origin>/report?facility=<id>` for single-tenant. The
 * `?facility=` query param is consumed exclusively by useFacilityReporting,
 * which is mounted on the report form route — so the deep-link MUST land on
 * `/report`, not on the jurisdiction landing page (which would silently drop
 * the param).
 *
 * Pure function: keeps origin + slug + id as inputs so unit tests don't need
 * a Vue setup context. The composable layer reads `window.location.origin`
 * and the active slug; this module just builds the string.
 */

export interface BuildFacilityDeepLinkInput {
    /** Absolute origin including protocol, e.g. "https://amsterdam.example.org". No trailing slash. */
    origin: string
    /** Active jurisdiction slug. Empty / undefined yields a slug-less URL (single-tenant). */
    slug?: string | null
    /** Facility id (admin-defined, treated opaque). Required. */
    facilityId: string
}

const stripTrailingSlash = (s: string): string => s.replace(/\/+$/, '');
const stripLeadingSlash = (s: string): string => s.replace(/^\/+/, '');

/**
 * Build the canonical deep-link URL for a facility.
 *
 * Throws nothing: a malformed origin or empty facilityId returns an empty
 * string so the caller can decide how to surface the error (toast vs. silent
 * skip). The admin form gates on `item.id` validation before exposing the
 * copy-link button, so the empty-string return is an unexpected-input
 * fallback, not a routine code path.
 */
export function buildFacilityDeepLink(input: BuildFacilityDeepLinkInput): string {
    const id = input.facilityId?.trim();
    const origin = input.origin?.trim();
    if (!id || !origin) return '';

    const cleanOrigin = stripTrailingSlash(origin);
    const cleanSlug = input.slug ? stripLeadingSlash(stripTrailingSlash(input.slug.trim())) : '';
    // Defence in depth: encode the slug as a single path segment. Slugs in
    // this codebase are always kebab-case single-segment ("amsterdam",
    // "bcp-council"), never path-shaped. encodeURIComponent maps `/` to %2F
    // and `.` stays literal — so a tampered `?jurisdiction=../../evil`
    // cannot place a verbatim `..` segment into the clipboard / QR payload.
    // Empty slugs collapse to single-tenant root.
    const encodedSlug = cleanSlug ? encodeURIComponent(cleanSlug) : '';
    const path = encodedSlug ? `/${encodedSlug}/report` : '/report';
    const encodedId = encodeURIComponent(id);

    return `${cleanOrigin}${path}?facility=${encodedId}`;
}
