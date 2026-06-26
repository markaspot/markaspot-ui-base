// types/index.ts

// Re-export the canonical JSON:API response type so existing consumers that
// import it from '~/types' / './index' keep resolving to the single source of
// truth in './api'.
export type { DrupalJsonApiResponse } from './api';

/**
 * Organisation reference from Drupal Group entity
 */
export interface Organisation {
    id: string
    label: string
}

export interface Jurisdiction {
    id: string
    label: string
    chain?: Array<{ id: string, label: string }>
}

export interface Request {
    service_request_id: string
    title: string
    description: string
    lat: number | string
    long: number | string
    /** Alias for `long` used by some components */
    lng?: number | string
    address_string: string
    service_name: string
    requested_datetime: string
    updated_datetime?: string
    status: string
    media_url: string | null
    service_code: string
    uuid?: string
    organisation?: Organisation
    organisations?: Organisation[]
    jurisdiction?: Jurisdiction
    // Flattened by processRequestData for convenience
    status_hex?: string
    category_hex?: string
    category_icon?: string
    status_descriptive_name?: string | null
    extended_attributes?: RequestExtendedAttributes
}

/**
 * Extended attributes block returned by the GeoReport API (and assembled by the
 * JSON:API dashboard transform). Shared by both the public `Request` shape and
 * the dashboard `DashboardRequest` shape so member access narrows consistently.
 */
export interface RequestExtendedAttributes {
    markaspot?: {
        nid?: string | number
        category_hex?: string
        category_icon?: string
        status_hex?: string
        status_descriptive_name?: string
        status_notes?: StatusNote[]
        /** Server-assigned intake source channel, e.g. web, email, staff */
        source?: string
        /** Intake channel marker for dashboard-created requests */
        channel?: 'staff' | string
        media_alt_text?: string[]
        /** Display name of the staff member who last edited the request (staff-only) */
        last_editor?: string
        /** Formatted datetime of the last edit (staff-only) */
        last_edited?: string
        /** Node author exposed only to dashboard staff */
        created_by?: {
            display_name?: string
            uid?: string | number
        }
        published?: boolean
        escalated?: boolean
        escalation_target?: string
        permissions?: {
            update?: boolean
            escalate?: boolean
            delegate?: boolean
        }
    }
    media?: Array<{ url: string, uuid?: string, alt_text?: string }>
    /** Open311 service-definition attribute values (parsed from field_request_attributes) */
    attributes?: Record<string, unknown>
    drupal?: {
        field_organisation?: Organisation
        field_sentiment?: Array<{ value: string }>
        field_hazard_level?: Array<{ value: number }>
        field_ai_hazard_category?: Array<{ value: string }>
    }
}

/**
 * Report is a semantic alias for Request (Open311 API term).
 * Prevents clash with browser's built-in Report API type.
 */
export type Report = Request;

export interface DrupalPage {
    id: string
    type: string
    attributes?: {
        title: string
        body?: { value: string, processed?: string, format?: string }
        sticky?: boolean
        field_page_icon?: string
        drupal_internal__nid?: number
    }
}

export interface PagesResponse {
    data: DrupalPage[]
}

export interface GeocodingResult {
    lat: number
    lng: number
    displayName: string
    address: {
        street?: string
        houseNumber?: string
        housenumber?: string
        postcode?: string
        city?: string
        district?: string
        state?: string
        country?: string
        countryCode?: string // ISO 3166-1 alpha-2 (e.g. "DE", "NL")
    }
    raw?: any
}

export interface GeocodingProvider {
    name: string
    geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>
    reverseGeocode(lat: number, lng: number): Promise<GeocodingResult>
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

export interface Marker {
    lat: number
    lng: number
}

export interface BoundsType {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
}

export interface StatusNote {
    status_note: string
    status: string
    updated_datetime: string
    status_descriptive_name?: string
    status_hex?: string
    status_icon?: string
}

export interface OperatorData {
    name?: string
    email?: string
    address?: {
        organization?: string
        address_line1?: string
        locality?: string
        postal_code?: string
        country_code?: string
    }
}

export type LegalPageType = 'impressum' | 'privacy' | 'terms';

// ---------------------------------------------------------------------------
// Emergency mode
// ---------------------------------------------------------------------------

/**
 * Shape of GET /api/emergency-mode/status (canonical API contract).
 *
 * `emergency_mode` is:
 *   true   = emergency is active
 *   false  = emergency is not active
 *   null   = backend unreachable (fail-open; treat as inactive)
 *
 * The `details` subtree is absent: the backend only emits it to authenticated
 * users with `view emergency status` and the frontend must never depend on it.
 */
export interface EmergencyStatusResponse {
    emergency_mode: boolean | null
    status?: string
    mode_type?: string
    lite_ui?: boolean
    force_redirect?: boolean
    available_categories?: Array<{ id: number, name: string, weight: number, color: string | null, icon: string | null }>
    allowed_urls?: string[]
    banner?: {
        message?: string
        title?: string
        level?: string
        mode_type?: string
        emergency_active?: boolean
    } | null
}
