import { createError, defineEventHandler, setResponseHeader, send } from 'h3'
import { Agent } from 'https'
import { URL } from 'url'

// In-memory cache for font files (persists across requests)
const fontCache = new Map<string, { data: Buffer, contentType: string, timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const MAX_CACHE_SIZE = 50 // Maximum number of fonts to cache

/**
 * API route handler for proxying font files from Drupal to the frontend
 *
 * This handler:
 * 1. Handles requests to /api/fonts/*
 * 2. Caches fonts in memory after first fetch (24h TTL)
 * 3. Proxies the request to the configured backend (Drupal server)
 * 4. Provides proper caching headers for font files
 */
export default defineEventHandler(async (event) => {
  // Get runtime config
  const config = useRuntimeConfig()

  // Get font path from route params
  const pathParam = event.context.params?.path
  const fontPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam

  if (!fontPath) {
    throw createError({
      statusCode: 400,
      message: 'Font path is required'
    })
  }

  // Security: Validate path length
  if (fontPath.length > 500) {
    throw createError({
      statusCode: 400,
      message: 'Font path too long'
    })
  }

  // Security: Block path traversal attempts
  if (fontPath.includes('..') || fontPath.includes('//') || fontPath.includes('\0')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid path: path traversal not allowed'
    })
  }

  // Get backend URL from runtime config
  const fontBackend = config.public.imageProxyBackend || config.public.geoReportApiBase || config.public.apiBase

  if (!fontBackend) {
    throw createError({
      statusCode: 500,
      message: 'Font proxy backend URL is not configured'
    })
  }

  try {
    // Pattern to match common Drupal file paths
    const drupalFilePathPattern = /(?:^|.*\/)((?:sites\/(?:default\/)?files|system\/files)\/.*)/

    let processedPath = fontPath

    // Handle full URLs (strip to just the file path)
    if (fontPath.startsWith('http://') || fontPath.startsWith('https://')) {
      try {
        const parsedUrl = new URL(decodeURIComponent(fontPath))
        const drupalPathMatch = parsedUrl.pathname.match(drupalFilePathPattern)
        if (drupalPathMatch && drupalPathMatch[1]) {
          processedPath = drupalPathMatch[1]
        } else {
          processedPath = parsedUrl.pathname + parsedUrl.search
        }
      } catch {
        processedPath = fontPath
      }
    } else {
      // For relative paths, strip any prefix
      const drupalPathMatch = fontPath.match(drupalFilePathPattern)
      if (drupalPathMatch && drupalPathMatch[1]) {
        processedPath = drupalPathMatch[1]
      }
    }

    // Remove leading slash for proper URL construction
    const normalizedPath = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath

    // Security: Whitelist allowed Drupal file directories (supports multisite paths)
    const allowedPrefixes = ['sites/default/files/', 'sites/files/', 'system/files/']
    const isAllowed = allowedPrefixes.some(prefix => normalizedPath.startsWith(prefix))
      || /^sites\/[a-z0-9_-]+\/files\//.test(normalizedPath)
    if (!isAllowed) {
      throw createError({
        statusCode: 403,
        message: 'Access to this path is not allowed'
      })
    }

    // Build the target URL
    const targetUrl = new URL(normalizedPath, fontBackend as string)

    // Content type hints for fonts
    const extension = fontPath.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'woff2': 'font/woff2',
      'woff': 'font/woff',
      'ttf': 'font/ttf',
      'otf': 'font/otf'
    }
    const contentType = (extension && mimeTypes[extension]) || 'application/octet-stream'

    // Long cache for font files (1 year)
    const cacheDuration = 31536000
    setResponseHeader(event, 'cache-control', `public, max-age=${cacheDuration}, immutable`)
    setResponseHeader(event, 'access-control-allow-origin', '*')
    setResponseHeader(event, 'access-control-allow-methods', 'GET')
    setResponseHeader(event, 'content-type', contentType)

    // Check server-side cache first
    const cacheKey = normalizedPath
    const cached = fontCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[Font Proxy] Cache HIT: ${cacheKey}`)
      }
      return send(event, cached.data)
    }

    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[Font Proxy] Cache MISS, fetching: ${targetUrl.href}`)
    }

    // Fetch from backend
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'Accept': contentType
      },
      // @ts-ignore - Node.js fetch supports agent
      agent: new Agent({
        rejectUnauthorized: useRuntimeConfig().proxy?.rejectUnauthorized ?? false
      })
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `Failed to fetch font: ${response.statusText}`
      })
    }

    // Get font data as buffer
    const fontData = Buffer.from(await response.arrayBuffer())

    // Store in cache (with size limit)
    if (fontCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = fontCache.keys().next().value
      if (oldestKey) fontCache.delete(oldestKey)
    }
    fontCache.set(cacheKey, {
      data: fontData,
      contentType,
      timestamp: Date.now()
    })

    return send(event, fontData)
  } catch (error) {
    console.error('Font proxy error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to proxy font',
      cause: error
    })
  }
})
