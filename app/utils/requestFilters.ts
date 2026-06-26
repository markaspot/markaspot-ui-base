import type { Request, Marker, BoundsType } from '~~/types';
import { NEUTRAL_FALLBACKS } from '@/utils/colorUtils';

/**
 * Request Processing and Filtering Utilities
 *
 * Pure utility functions for processing, filtering, and transforming service request data.
 * These functions handle coordinate parsing, bounds checking, data validation,
 * and conversion between different data formats used throughout the application.
 *
 * All functions are stateless and side-effect free for predictable behavior.
 */

/**
 * Validate and parse coordinates from request data
 *
 * @param request - Service request object
 * @returns Parsed coordinates or null if invalid
 */
export function parseRequestCoordinates(request: Request): { lat: number, lng: number } | null {
    if (!request?.lat || !request?.long) {
        return null;
    }

    try {
        const lat = typeof request.lat === 'string' ? parseFloat(request.lat) : request.lat;
        const lng = typeof request.long === 'string' ? parseFloat(request.long) : request.long;

        // Check if parsing resulted in valid numbers
        if (isNaN(lat) || isNaN(lng)) {
            console.warn('Invalid coordinates for request:', request.service_request_id);
            return null;
        }

        return { lat, lng };
    } catch (error) {
        console.warn('Error parsing coordinates for request:', request.service_request_id, error);
        return null;
    }
}

/**
 * Check if request coordinates are within bounds
 */
export function isRequestInBounds(request: Request, bounds: BoundsType): boolean {
    const coords = parseRequestCoordinates(request);
    if (!coords) return false;

    const { lat, lng } = coords;
    const { minLat, maxLat, minLng, maxLng } = bounds;

    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Filter requests by geographical bounds
 */
export function filterRequestsByBounds(requests: Request[], bounds: BoundsType | null): Request[] {
    if (!bounds) {
        return requests;
    }

    return requests.filter(request => isRequestInBounds(request, bounds));
}

/**
 * Convert requests to map markers
 */
export function requestsToMarkers(requests: Request[]): Marker[] {
    return requests
        .map((request) => {
            const coords = parseRequestCoordinates(request);
            return coords ? { lat: coords.lat, lng: coords.lng } : null;
        })
        .filter((marker): marker is Marker => marker !== null);
}

/**
 * Process raw request data to standardized format
 */
export function processRequestData(rawRequest: any): Request {
    // Extract status hex with validation
    const statusHex = rawRequest.extended_attributes?.markaspot?.status_hex;

    if (!statusHex) {
        console.warn('Missing status_hex for request:', rawRequest.service_request_id);
    }

    const categoryIcon = rawRequest.extended_attributes?.markaspot?.category_icon || 'fa-map-marker';
    const categoryHex = rawRequest.extended_attributes?.markaspot?.category_hex || NEUTRAL_FALLBACKS.DEFAULT;

    // DEBUG: Log icon processing
    if (import.meta.dev) {
        console.log(`[processRequestData] Request ${rawRequest.service_request_id}:`, {
            rawIcon: rawRequest.extended_attributes?.markaspot?.category_icon,
            processedIcon: categoryIcon,
            rawHex: rawRequest.extended_attributes?.markaspot?.category_hex,
            processedHex: categoryHex
        });
    }

    return {
        ...rawRequest,
        category_hex: categoryHex,
        category_icon: categoryIcon,
        status_hex: statusHex || NEUTRAL_FALLBACKS.DEFAULT,
        status_descriptive_name: rawRequest.extended_attributes?.markaspot?.status_descriptive_name || null
    };
}

/**
 * Validate request data before processing
 */
export function validateRequestData(request: any): boolean {
    if (!request) {
        console.warn('Request data is null or undefined');
        return false;
    }

    if (!request.service_request_id) {
        console.warn('Request missing service_request_id:', request);
        return false;
    }

    const coords = parseRequestCoordinates(request);
    if (!coords) {
        console.warn('Request has invalid coordinates:', request.service_request_id);
        return false;
    }

    return true;
}

/**
 * Normalize request ID for consistent storage
 */
export function normalizeRequestId(request: any): string {
    return String(request.service_request_id || request.id || request.nid || '');
}

/**
 * Build API parameters for request fetching
 * When bounds is null, bbox parameter is omitted (searches entire database)
 * When isAuthenticated is true, includes field_organisation in response
 * When locale is provided, adds langcode parameter for translated content
 */
export function buildRequestParams(
    bounds: BoundsType | null,
    serviceCode: string | null,
    page: number,
    itemsPerPage: number,
    searchTerm?: string,
    isAuthenticated?: boolean,
    locale?: string,
    jurisdictionId?: string
): Record<string, string> {
    const params: Record<string, string> = {
        extensions: 'true',
        meta: 'true',
        sort: 'desc',
        start_date: '2001-01-01',
        limit: itemsPerPage.toString(),
        offset: ((page - 1) * itemsPerPage).toString()
    };

    // Add jurisdiction_id for multi-tenant filtering
    if (jurisdictionId) {
        params.jurisdiction_id = jurisdictionId;
    }

    // Add langcode parameter for translated content
    // This ensures the backend returns content in the requested language
    // and acts as a cache-buster for browser caching
    if (locale) {
        params.langcode = locale;
    }

    // Only add bbox if bounds are provided
    if (bounds) {
        params.bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
    }

    if (serviceCode) {
        params.service_code = serviceCode;
    }

    if (searchTerm && searchTerm.trim()) {
        params.q = searchTerm.trim();
    }

    // Build fields list for authenticated users
    if (isAuthenticated) {
        params.fields = 'field_organisation';
    }

    return params;
}
