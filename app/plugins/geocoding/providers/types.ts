// plugins/geocoding/types.ts

/**
 * Types Plugin
 *
 * Plugin for types functionality.
 *
 * Nuxt plugin for application-wide functionality.
 */

export interface GeocodingResult {
    lat: number
    lng: number
    displayName: string
    address: {
        street?: string
        houseNumber?: string
        housenumber?: string // Add lowercase variant for compatibility
        postcode?: string
        city?: string
        district?: string // District/neighborhood/suburb
        state?: string
        country?: string
        countryCode?: string // ISO 3166-1 alpha-2 (e.g. "DE", "NL")
    }
    raw?: any // Provider-specific raw data
}

export interface GeocodingOptions {
    bbox?: string
    limit?: number
    language?: string
    centerPoint?: { lat: number, lng: number }
    radius?: number
    country?: string
    region?: string
    types?: string
    autocomplete?: boolean
}

export interface GeocodingProvider {
    name: string
    geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>
    reverseGeocode(lat: number, lng: number): Promise<GeocodingResult>
}
