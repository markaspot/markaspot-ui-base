import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'

/**
 * Geocoder Proxy API Route
 *
 * Proxies geocoding requests to the Drupal-served Cologne geocoder library.
 * This allows the frontend to call geocoder endpoints without CORS issues.
 *
 * Routes:
 * - GET /api/geocoder/search?q=address
 * - GET /api/geocoder/reverse?lat=50.9377&lon=6.9441
 */

const hasTraversal = (value: string): boolean => {
    const candidates = [value]
    try {
        const decoded = decodeURIComponent(value)
        if (decoded !== value) {
            candidates.push(decoded)
        }
    } catch {
        // ignore decode errors
    }
    return candidates.some(candidate =>
        candidate.split('/').some(segment => segment === '..')
    )
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const path = getRouterParam(event, 'path')
    const query = getQuery(event)

    if (!path || hasTraversal(String(path))) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid path'
        })
    }

    // Build the backend geocoder URL
    const backendBase = config.public.apiBase || ''
    const geocoderUrl = `${backendBase}/libraries/geocoder/${path}`

    // Build query string
    const queryString = new URLSearchParams(query as Record<string, string>).toString()
    const fullUrl = queryString ? `${geocoderUrl}?${queryString}` : geocoderUrl

    console.log('[Geocoder Proxy] Request:', { path })

    try {
        // Proxy request to Drupal
        const response = await $fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mark-a-Spot/Nuxt'
            }
        })

        console.log('[Geocoder Proxy] Success:', { path })

        return response

    } catch (error: unknown) {
        const err = error as Record<string, unknown>;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Geocoder Proxy] Error:', {
            path,
            error: errorMessage,
            status: (err.response as Record<string, unknown> | undefined)?.status
        })

        // Return user-friendly error
        throw createError({
            statusCode: ((err.response as Record<string, unknown> | undefined)?.status as number) || 500,
            statusMessage: 'Geocoding request failed',
            data: {
                error: errorMessage
            }
        })
    }
})
