import { createError, defineEventHandler, setResponseHeader, send } from 'h3'
import { Agent } from 'https'
import { URL } from 'url'
import { isSuspiciousPath } from '../../utils/path'

// In-memory cache for static images (logos, icons - persists across requests)
const imageCache = new Map<string, { data: Buffer, contentType: string, timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const MAX_CACHE_SIZE = 100 // Maximum number of images to cache
const MAX_CACHEABLE_SIZE = 500 * 1024 // Only cache images under 500KB

// File extensions that should be cached (static assets)
const CACHEABLE_EXTENSIONS = ['svg', 'ico', 'png', 'jpg', 'jpeg', 'webp', 'gif']
const FALLBACK_IMAGE_DATA = Buffer.from(
  // Wide aspect (matches typical photo containers) with a small centered glyph,
  // so `object-fit: cover` does not blow the icon up several times over (a square
  // viewBox over a wide/short box scaled ~5x). The dark rect still fills the slot.
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 192" role="presentation" aria-hidden="true"><rect width="480" height="192" rx="12" fill="#27272a"/><g transform="translate(196,58)" fill="none" stroke="#6b7280" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><rect x="0" y="0" width="88" height="76" rx="8"/><circle cx="61" cy="23" r="8" fill="#6b7280" stroke="none"/><path d="M7 68 L31 42 L48 60 L60 48 L81 69"/></g></svg>',
  'utf8'
)

function sendFallbackImage(event: Parameters<typeof send>[0], reason: string) {
  event.node.res.statusCode = 200
  event.node.res.setHeader('Cache-Control', 'no-store')
  event.node.res.setHeader('X-Image-Proxy-Fallback', reason === 'exception' ? 'error' : 'unavailable')
  setResponseHeader(event, 'content-type', 'image/svg+xml')
  return send(event, FALLBACK_IMAGE_DATA)
}

/**
 * API route handler for proxying images from Drupal to the frontend
 *
 * This handler:
 * 1. Handles requests to /api/images/*
 * 2. Caches static images (logos, icons) in memory after first fetch
 * 3. Proxies the request to the configured backend (Drupal server)
 * 4. Manages various URL formats and provides proper caching headers
 */
export default defineEventHandler(async (event) => {
  // Get runtime config
  const config = useRuntimeConfig()
  const clientConfig = config.public.clientConfig
  
  // Check if image proxying is enabled
  const proxyEnabled = clientConfig?.features?.media?.proxy?.enabled !== false
  if (!proxyEnabled) {
    throw createError({
      statusCode: 404,
      message: 'Image proxy is not enabled'
    })
  }
  
  // Get cache duration from config
  const cacheDuration = clientConfig?.features?.media?.proxy?.cacheDuration || 86400 // Default to 1 day
  
  // Get image path from route params
  const pathParam = event.context.params.path
  const imagePath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam

  // Defence-in-depth: reject traversal, absolute URLs, and protocol-relative paths
  if (isSuspiciousPath(imagePath)) {
    throw createError({ statusCode: 400, message: 'Invalid image path' })
  }

  // Get backend URL from runtime config
  const imageBackend = config.public.imageProxyBackend || config.public.geoReportApiBase || config.public.apiBase
  
  // Debug logging in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Image Proxy] Backend URLs available:`)
    console.log(`  imageProxyBackend: ${config.public.imageProxyBackend}`)
    console.log(`  geoReportApiBase: ${config.public.geoReportApiBase}`)
    console.log(`  apiBase: ${config.public.apiBase}`)
    console.log(`  host: ${event.node.req.headers.host}`)
    console.log(`  Selected: ${imageBackend}`)
  }

  if (!imageBackend) {
    throw createError({
      statusCode: 500,
      message: 'Image proxy backend URL is not configured'
    })
  }

  try {
    // Smart URL decoding: only decode if it's a full URL, preserve filename encoding
    let processedPath = imagePath
    let targetUrl: URL
    
    // Pattern to match common Drupal file paths (both public and private)
    // Supports multisite paths: sites/default/files, sites/{sitename}/files, system/files
    // Strips path prefixes like /management/ - only captures the core file path
    const drupalFilePathPattern = /(?:^|.*\/)((?:sites\/(?:[^/]+\/)?files|system\/files)\/.*)/
    
    // Only decode if it's a full URL (starts with http/https, encoded or not)
    const isFullUrl = imagePath.startsWith('http://') || imagePath.startsWith('https://') ||
                      imagePath.startsWith('http%3A') || imagePath.startsWith('https%3A')
    if (isFullUrl) {
      const decodedPath = decodeURIComponent(imagePath)
        try {
          // For full URLs, we want to extract just the file path
          // This avoids exposing internal hostnames and makes proxying more reliable
          const parsedUrl = new URL(decodedPath)
          
          // Extract Drupal file path if it exists
          const drupalPathMatch = parsedUrl.pathname.match(drupalFilePathPattern)
          if (drupalPathMatch && drupalPathMatch[1]) {
            // We found a typical Drupal file path, use just that
            processedPath = drupalPathMatch[1]
            
            if (process.env.NODE_ENV !== 'production') {
              console.debug(`[Image Proxy] Extracted Drupal path: ${processedPath} from original: ${imagePath}`)
            }
          } else {
            // If no Drupal file path found, use the full pathname
            processedPath = parsedUrl.pathname + parsedUrl.search
          }
        } catch (parseError) {
          // If URL parsing fails, use the path as is
          console.error('Error parsing URL in image proxy:', parseError)
          processedPath = imagePath
        }
    } else {
      // For relative paths (like Drupal file paths), strip any prefix and keep core path
      // This handles paths like /management/system/files/... -> system/files/...
      const drupalPathMatch = imagePath.match(drupalFilePathPattern)
      if (drupalPathMatch && drupalPathMatch[1]) {
        processedPath = drupalPathMatch[1]
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[Image Proxy] Stripped prefix from path: ${imagePath} -> ${processedPath}`)
        }
      } else {
        processedPath = imagePath
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[Image Proxy] Preserving encoding for relative path: ${imagePath}`)
        }
      }
    }
    
    // Remove leading slash for proper URL construction
    const normalizedPath = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath
    
    // Build the target URL using the image backend and the processed path
    targetUrl = new URL(normalizedPath, imageBackend as string)

    // Post-normalisation allowlist: only allow paths within Drupal file directories.
    // URL constructor resolves '..' segments, so we check the final pathname.
    const targetPathname = targetUrl.pathname
    const isAllowedPath = /^\/(?:sites\/[^/]+\/files|system\/files)\//.test(targetPathname)
    if (!isAllowedPath) {
      throw createError({ statusCode: 400, message: 'Invalid image path' })
    }

    // Determine content type and if cacheable
    const extension = normalizedPath.split('.').pop()?.toLowerCase() || ''
    const isCacheable = CACHEABLE_EXTENSIONS.includes(extension)
    const mimeTypes: Record<string, string> = {
      'svg': 'image/svg+xml',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'ico': 'image/x-icon'
    }

    // Add cache control headers for images
    event.node.res.setHeader('Cache-Control', `public, max-age=${cacheDuration}, s-maxage=${cacheDuration}`)
    event.node.res.setHeader('Vary', 'Accept')
    event.node.res.setHeader('Accept-Ranges', 'bytes')

    // Check server-side cache first (only for cacheable extensions)
    const requestUrl = new URL(event.node.req.url || '/', 'http://localhost')
    const versionKey = requestUrl.searchParams.get('v')
    const cacheKey = versionKey ? `${normalizedPath}?v=${versionKey}` : normalizedPath
    if (isCacheable) {
      const cached = imageCache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[Image Proxy] Cache HIT: ${cacheKey}`)
        }
        setResponseHeader(event, 'content-type', cached.contentType)
        return send(event, cached.data)
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[Image Proxy] ${isCacheable ? 'Cache MISS' : 'Not cacheable'}, fetching: ${targetUrl.href}`)
    }

    // Fetch from backend
    // Only use HTTPS agent for HTTPS URLs
    const fetchOptions: RequestInit & { agent?: InstanceType<typeof Agent> } = {
      headers: {
        'Accept': mimeTypes[extension] || 'image/*'
      }
    }

    // Add HTTPS agent only for HTTPS URLs
    if (targetUrl.protocol === 'https:') {
      // @ts-ignore - Node.js fetch supports agent
      fetchOptions.agent = new Agent({
        rejectUnauthorized: useRuntimeConfig().proxy?.rejectUnauthorized ?? false
      })
    }

    const response = await fetch(targetUrl.toString(), fetchOptions)

    if (!response.ok) {
      console.warn(`[Image Proxy] Upstream image unavailable (${response.status}) for ${normalizedPath}`)
      return sendFallbackImage(event, String(response.status))
    }

    // Get image data as buffer to preserve binary integrity
    const imageData = Buffer.from(await response.arrayBuffer())
    const upstreamType = response.headers.get('content-type')
    const contentType = (upstreamType && upstreamType.startsWith('image/')) ? upstreamType : mimeTypes[extension] || 'application/octet-stream'

    // Store in cache if cacheable and under size limit
    if (isCacheable && imageData.length < MAX_CACHEABLE_SIZE) {
      if (imageCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const oldestKey = imageCache.keys().next().value
        if (oldestKey) imageCache.delete(oldestKey)
      }
      imageCache.set(cacheKey, {
        data: imageData,
        contentType,
        timestamp: Date.now()
      })
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[Image Proxy] Cached: ${cacheKey} (${imageData.length} bytes)`)
      }
    }

    setResponseHeader(event, 'content-type', contentType)
    return send(event, imageData)
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      Number((error as { statusCode?: unknown }).statusCode) < 500
    ) {
      throw error
    }

    console.error('Image proxy error:', error)
    return sendFallbackImage(event, 'fetch-error')
  }
})
