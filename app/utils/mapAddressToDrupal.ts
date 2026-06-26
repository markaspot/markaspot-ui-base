import type { FacilityAddress } from '~~/types/clientConfig';

/** Geocoding address structure from reverse geocode results */
export interface GeocodingAddress {
    street?: string
    housenumber?: string
    houseNumber?: string
    city?: string
    postcode?: string
    country?: string
    countryCode?: string
    state?: string
}

/** Country name to ISO 3166-1 alpha-2 mapping */
const COUNTRY_NAME_MAP: Record<string, string> = {
    'Deutschland': 'DE',
    'Germany': 'DE',
    'United States': 'US',
    'United Kingdom': 'GB',
    'France': 'FR',
    'Austria': 'AT',
    'Switzerland': 'CH',
    'Netherlands': 'NL'
};

/**
 * Map geocoding address data to Drupal field_address format.
 *
 * Transforms the structured address returned by Mapbox/Photon/Nominatim
 * into the format expected by Drupal's address module (field_address).
 */
export function mapAddressToDrupal(address: GeocodingAddress | undefined) {
    if (!address) return undefined;

    // Prefer the ISO code if available, otherwise map from country name
    let countryCode = (address.countryCode || '').toUpperCase();

    if (!countryCode && address.country) {
        countryCode = COUNTRY_NAME_MAP[address.country] || '';
        if (!countryCode) {
            console.warn(`[mapAddressToDrupal] Unknown country name "${address.country}", leaving countryCode empty`);
        }
    }

    const mapped = {
        country_code: countryCode,
        postal_code: String(address.postcode || ''),
        locality: address.city || '',
        address_line1: [address.street, address.houseNumber || address.housenumber]
            .filter(Boolean).join(' ') || ''
    };

    // WBD #126 (scenario B): never emit an all-empty address. A failed map-pick
    // reverse-geocode yields `{}`, which would otherwise overwrite a stored
    // field_address with blanks. Returning undefined makes callers omit the
    // field entirely, preserving the coordinates instead of clobbering data.
    if (!mapped.country_code && !mapped.postal_code && !mapped.locality && !mapped.address_line1) {
        return undefined;
    }

    return mapped;
}

/**
 * Normalize a facility address to the Drupal field_address shape.
 *
 * Handles both the new structured `FacilityAddress` (written by the admin UI
 * after reverse geocoding at save time) and the legacy plain string form
 * (tenants that configured facilities before this change). The plain-string
 * path produces `{ address_line1: str }` with empty country_code/locality/
 * postal_code — Drupal accepts this on lenient tenants and the report won't
 * 422 due to a missing country_code where that field is not strictly required.
 *
 * Returns `undefined` when the input is absent, so callers can safely omit
 * `field_address` from the payload when no address is configured.
 */
export function facilityAddressToDrupal(
    address: FacilityAddress | string | undefined
): { country_code: string, postal_code: string, locality: string, address_line1: string } | undefined {
    if (!address) return undefined;

    if (typeof address === 'string') {
        const trimmed = address.trim();
        if (!trimmed) return undefined;
        // Legacy plain-string graceful-degradation path.
        return {
            address_line1: trimmed,
            country_code: '',
            locality: '',
            postal_code: ''
        };
    }

    // Structured FacilityAddress — use values as-is.
    return {
        address_line1: address.address_line1 || '',
        country_code: address.country_code || '',
        locality: address.locality || '',
        postal_code: address.postal_code || ''
    };
}
