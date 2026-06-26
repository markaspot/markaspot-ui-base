/**
 * Locale-aware display formatting for FacilityAddress.
 *
 * Four call sites previously hand-rolled `${address_line1}, ${postal_code} ${locality}`
 * which (a) drifted and (b) coerced the structured object to `[object Object]`
 * when an `address || label` fallback crept in. This single helper is the
 * canonical renderer: it accepts the full union shape (structured | plain string |
 * undefined), dispatches by locale to honour the reader's expected address
 * ordering, and never returns `[object Object]`.
 *
 * Intentionally simple. This is NOT a full Intl address formatter — it only
 * covers the field permutations we actually persist on a FacilityConfigItem
 * (line1 + postal + locality + optional country_code). A proper i18n address
 * library is out of scope until we hit a tenant in a country whose order we
 * don't cover here.
 */

import type { FacilityAddress } from '~~/types/clientConfig';

/**
 * Format a FacilityAddress for display, ordered by locale convention.
 *
 * Locale map:
 *  - de, de-ls, at, ch, fr, nl, en:  `{street}, {postal} {locality}`
 *  - it:                             `{street}, {postal} {locality} ({country_code})`
 *  - default:                        DE/EN order
 *
 * Plain-string input is returned as-is (legacy graceful-degradation path for
 * tenants that saved before structured addresses landed). Undefined/empty
 * input returns `''` so callers can chain `formatFacilityAddress(...) || label`.
 */
export function formatFacilityAddress(
    address: FacilityAddress | string | undefined,
    locale: string
): string {
    if (!address) return '';
    if (typeof address === 'string') return address;

    const line1 = address.address_line1?.trim() || '';
    const postal = address.postal_code?.trim() || '';
    const locality = address.locality?.trim() || '';
    const country = address.country_code?.trim().toUpperCase() || '';

    const cityPart = [postal, locality].filter(Boolean).join(' ');
    const base: string[] = [];
    if (line1) base.push(line1);
    if (cityPart) base.push(cityPart);

    const primary = base.join(', ');

    // Normalise to the language part of a BCP-47 tag (e.g. `de-DE` -> `de`).
    const lang = (locale || '').toLowerCase().split('-')[0];

    switch (lang) {
        case 'it':
            // Italian convention commonly appends the province/country in
            // parentheses. We only persist country_code, so append that.
            return country ? `${primary} (${country})`.trim() : primary;
        // FR, NL and DE/AT/CH/EN all render street first, then postal + locality.
        // Kept as explicit cases so future divergence is a one-line change,
        // not a rebuild of the switch.
        case 'de':
        case 'at':
        case 'ch':
        case 'fr':
        case 'nl':
        case 'en':
        default:
            return primary;
    }
}
