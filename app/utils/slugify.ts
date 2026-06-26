/**
 * Convert a free-form label into a URL-safe slug.
 *
 * Used by the facilities admin form (facility slug derived from label) and
 * any other admin-facing rename surface that needs a stable, hyphenated,
 * ASCII-only identifier the URL can carry without percent-escaping.
 *
 * Rules in order:
 *   1. Replace German umlauts and ß with their two-letter latin equivalents
 *      (ä→ae, ö→oe, ü→ue, ß→ss). Done before NFKD so the diacritics-strip
 *      step doesn't drop them to bare a/o/u — German municipal directories
 *      universally expect "muenchen", not "munchen".
 *   2. NFKD-normalise + strip combining marks. Catches everything else
 *      (Polish ł, Spanish ñ, French é, etc.) without bespoke maps.
 *   3. Lowercase + replace anything outside [a-z0-9] with a single hyphen.
 *   4. Collapse consecutive hyphens, trim leading/trailing hyphens.
 *
 * Returns an empty string for empty / whitespace-only input. Never throws.
 */
export function slugify(input: string): string {
    if (!input) return '';

    const umlautMap: Record<string, string> = {
        ä: 'ae', Ä: 'ae',
        ö: 'oe', Ö: 'oe',
        ü: 'ue', Ü: 'ue',
        ß: 'ss'
    };
    const withoutUmlauts = input.replace(/[äÄöÖüÜß]/g, ch => umlautMap[ch] || ch);

    const stripped = withoutUmlauts
        .normalize('NFKD')
        .replace(/\p{Mn}/gu, '');

    return stripped
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Whether a string is already a valid slug (the shape slugify() produces).
 *
 * Used by form validators so admins who hand-type a slug get the same
 * acceptance rule as the auto-fill path. An empty string is NOT valid here
 * (the field is required); callers gate on emptiness separately.
 */
export function isValidSlug(input: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input);
}
