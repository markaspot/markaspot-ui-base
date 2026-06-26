import type { H3Event } from 'h3';

/**
 * Shared server-side types for the API proxy and related utilities.
 */

// ---------------------------------------------------------------------------
// Fetch / Error types
// ---------------------------------------------------------------------------

/** Shape of an error thrown by ofetch ($fetch). */
export interface ProxyFetchError {
    status?: number
    statusCode?: number
    statusMessage?: string
    message: string
    code?: string
    type?: string
    errno?: string
    name?: string
    stack?: string
    body?: unknown
    data?: unknown
    response?: {
        status?: number
        _data?: unknown
        data?: unknown
        headers?: Headers & {
            raw?: () => Record<string, string[]>
            getSetCookie?: () => string[]
        }
    }
}

/** Options passed to `createSafeError`. */
export interface SafeErrorData {
    statusCode: number
    message: string
    data?: unknown
}

// ---------------------------------------------------------------------------
// GeoReport types
// ---------------------------------------------------------------------------

export interface GeoReportItem {
    media_url?: string
    service_request_id?: string
    [key: string]: unknown
}

export interface GeoReportWrappedResponse {
    requests?: GeoReportItem[]
    meta?: Record<string, unknown>
    [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Geocoding types
// ---------------------------------------------------------------------------

export interface GeocodingAddress {
    street: string | null
    houseNumber: string | null
    housenumber: string | null
    city: string | null
    state: string | null
    country: string | null
    countryCode: string | null
    postcode: string | null
    neighborhood?: string | null
    district?: string | null
}

export interface GeocodingResult {
    lat: number
    lng: number
    displayName: string
    address: GeocodingAddress
    raw: unknown
}

// Mapbox -----------------------------------------------------------------

export interface MapboxContextItem {
    id: string
    text: string
    short_code?: string
}

export interface MapboxFeature {
    center: [number, number]
    text?: string
    address?: string
    place_name?: string
    place_type?: string[]
    context?: MapboxContextItem[]
}

export interface MapboxResponse {
    features?: MapboxFeature[]
}

// Photon ------------------------------------------------------------------

export interface PhotonProperties {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    state?: string
    country?: string
    countrycode?: string
    postcode?: string
}

export interface PhotonFeature {
    geometry: {
        coordinates: [number, number]
    }
    properties: PhotonProperties
}

export interface PhotonResponse {
    features?: PhotonFeature[]
}

// ---------------------------------------------------------------------------
// Log data (loose record for logging utilities)
// ---------------------------------------------------------------------------

export type LogData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Lite route types
// ---------------------------------------------------------------------------

export interface LiteFormBody {
    category?: string
    description?: string
    lat?: string
    lng?: string
    email?: string
    gdpr?: string
}

export interface BannerData {
    message?: string
    title?: string
    level?: string
    mode_type?: string
    emergency_active?: boolean
}

/** JSON:API category term shape as returned by Drupal. */
export interface CategoryTerm {
    id: string
    attributes?: {
        name?: string
        weight?: number
        drupal_internal__tid?: number
    }
    relationships?: {
        parent?: {
            data?: Array<{ id: string }>
        }
    }
}

/** JSON:API paginated response. */
export interface JsonApiListResponse<T = unknown> {
    data?: T[]
    links?: {
        next?: string | { href: string }
    }
}

// ---------------------------------------------------------------------------
// Emergency mode types
// ---------------------------------------------------------------------------

// Re-exported from the shared types/ root so both server/ and app/ code can
// import from their respective canonical locations without duplication.
export type { EmergencyStatusResponse } from '../../types/index';
