import { createError } from 'h3';
import type { H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';

// Rate limits configuration.
//
// Intentional asymmetry between the two anonymous service-request paths:
//   - service_requests (5/min) is the JSON:API create path used by the
//     frontend report form, which fans out to several sub-requests (file,
//     media) per submit, so it needs a little more headroom.
//   - georeport_submit (3/min) is the Open311 collection POST, the primary
//     anonymous abuse vector (email-bombing via repeated submits), so it is
//     held to the tighter budget.
export const rateLimits = {
  service_requests: { max: 5, windowMs: 60000 },
  files: { max: 15, windowMs: 60000 },
  media: { max: 15, windowMs: 60000 },
  feedback: { max: 3, windowMs: 60000 },
  geocoding: { max: 10, windowMs: 60000 },
  georeport: { max: 60, windowMs: 60000 },
  // Anonymous Open311 service-request creation. Far tighter than the generic
  // georeport GET bucket to mitigate email-bombing via repeated submits.
  // Refs markaspot/markaspot-ui#468.
  georeport_submit: { max: 3, windowMs: 60000 },
  competition: { max: 3, windowMs: 60000 },
  vision: { max: 5, windowMs: 60000 },
  flags: { max: 3, windowMs: 300000 },
  invitation_claim: { max: 5, windowMs: 60000 },
  settings: { max: 20, windowMs: 60000 },
};

// In-memory rate tracking store with TTL tracking.
//
// This store is per-process. In a multi-replica deployment each replica keeps
// its own counters, so the effective limit is multiplied by the replica count
// (e.g. 3 replicas -> ~9 georeport submits/min per IP). The current topology
// assumption is a single Nuxt replica per tenant. Horizontal scaling would
// require moving this to a shared store (Redis / unstorage) for the limits to
// hold globally.
export const rateTracker: Record<string, Record<string, number[]>> = {};
const identifierLastSeen: Record<string, number> = {};

// Configuration for rate tracker cleanup
const CLEANUP_INTERVAL_MS = parseInt(process.env.RATE_LIMITER_CLEANUP_INTERVAL || '60000'); // 1 minute
const IDENTIFIER_TTL_MS = parseInt(process.env.RATE_LIMITER_IDENTIFIER_TTL || '3600000'); // 1 hour

/**
 * Clean up old rate tracking data
 * Called on-demand during rate limit checks instead of on an interval
 */
function cleanupRateTracker(): void {
  const now = Date.now();
  for (const identifier in rateTracker) {
    // Check if identifier is stale (not accessed within TTL)
    const lastSeen = identifierLastSeen[identifier] || 0;
    if (now - lastSeen > IDENTIFIER_TTL_MS) {
      Reflect.deleteProperty(rateTracker, identifier);
      Reflect.deleteProperty(identifierLastSeen, identifier);
      continue;
    }

    for (const endpointType in rateTracker[identifier]) {
      // Clean old timestamps
      rateTracker[identifier][endpointType] = rateTracker[identifier][endpointType].filter(
        timestamp => now - timestamp < rateLimits[endpointType]?.windowMs
      );
      // Remove empty endpoint arrays
      if (rateTracker[identifier][endpointType].length === 0) {
        Reflect.deleteProperty(rateTracker[identifier], endpointType);
      }
    }
    // Remove empty identifier objects
    if (Object.keys(rateTracker[identifier]).length === 0) {
      Reflect.deleteProperty(rateTracker, identifier);
      Reflect.deleteProperty(identifierLastSeen, identifier);
    }
  }
}

// Track last cleanup time to avoid excessive cleanup calls
let lastCleanupTime = 0;

/**
 * Determines the endpoint type from the request path
 */
export const getEndpointType = (path: string | string[], method?: string): string | null => {
  const cleanPath = Array.isArray(path) ? path.join('/') : path;
  const normalizedPath = normalizeApiPath(cleanPath);

  if (normalizedPath === 'vision/analyze' || normalizedPath.startsWith('vision/analyze/')) {
    return 'vision';
  } else if (cleanPath.startsWith('jsonapi/service_requests')) {
    return 'service_requests';
  } else if (cleanPath.startsWith('jsonapi/file')) {
    return 'files';
  } else if (cleanPath.startsWith('jsonapi/media')) {
    return 'media';
  } else if (cleanPath.startsWith('georeport/')) {
    // Anonymous service-request submits get the tighter `georeport_submit`
    // bucket; reads stay on the generic `georeport` bucket.
    // Refs markaspot/markaspot-ui#468.
    return method && isGeoReportSubmitPath(cleanPath, method) ? 'georeport_submit' : 'georeport';
  } else if (cleanPath.startsWith('feedback/') || cleanPath === 'feedback' || cleanPath.startsWith('api/feedback') || cleanPath === 'api/feedback') {
    return 'feedback';
  } else if (cleanPath.match(/^jsonapi\/service-request/)) {
    // Handle the new service request endpoints
    return 'service_requests';
  } else if (cleanPath.match(/^jsonapi\/node\/service_request/)) {
    // Handle JSON:API endpoints for service requests
    return 'service_requests';
  } else if (cleanPath.startsWith('geocoding/')) {
    // Handle geocoding requests
    return 'geocoding';
  } else if (cleanPath === 'api/competition') {
    // Handle competition submissions
    return 'competition';
  } else if (cleanPath.startsWith('group-members/claim/') || cleanPath.startsWith('api/group-members/claim/')) {
    return 'invitation_claim';
  } else if (cleanPath.startsWith('mark-a-spot-settings') || cleanPath.startsWith('api/mark-a-spot-settings')) {
    return 'settings';
  }
  // If no specific type is detected, log it for debugging
  return null;
};

function normalizePathParam(path: string | string[] | undefined): string {
  return Array.isArray(path) ? path.join('/') : String(path || '');
}

function normalizeApiPath(path: string): string {
  return path.replace(/^(?:api\/)+/i, '');
}

function isWriteMethod(method: string): boolean {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase());
}

function isJsonApiPublicWritePath(path: string, method: string): boolean {
  return method.toUpperCase() === 'POST' && (
    path.startsWith('jsonapi/node/service_request') ||
    path.startsWith('jsonapi/service_requests') ||
    path.match(/^jsonapi\/service-request/) !== null ||
    path.startsWith('jsonapi/media/') ||
    path.startsWith('jsonapi/file/')
  );
}

function isPublicEndpointWritePath(path: string, method: string): boolean {
  if (!isWriteMethod(method)) return false;
  return path === 'feedback' ||
    path.startsWith('feedback/') ||
    path === 'api/feedback' ||
    path.startsWith('api/feedback/') ||
    path === 'competition' ||
    path.startsWith('competition/') ||
    path === 'api/competition' ||
    path.startsWith('api/competition/') ||
    path.startsWith('group-members/claim/') ||
    path.startsWith('api/group-members/claim/') ||
    path === 'mark-a-spot-settings' ||
    path.startsWith('mark-a-spot-settings/') ||
    path === 'api/mark-a-spot-settings' ||
    path.startsWith('api/mark-a-spot-settings/');
}

function isGeoReportWritePath(path: string, method: string): boolean {
  return method.toUpperCase() === 'POST' && path.startsWith('georeport/');
}

/**
 * True for the anonymous Open311 service-request submit (POST to the
 * georeport requests endpoint). These get the dedicated, tighter
 * `georeport_submit` bucket instead of the generic `georeport` read bucket.
 */
function isGeoReportSubmitPath(path: string, method: string): boolean {
  // End-anchored to the exact Open311 collection endpoint
  // (georeport/v2/requests[.json|.xml]). POSTs to a sub-resource like
  // `requests/{id}` or a near-miss like `requestsXYZ` are already 405'd later
  // by matchesGeoReportWriteEndpointPath; anchoring keeps them on the generic
  // `georeport` bucket so they cannot drain the tight submit budget of a
  // shared IP (cheap self-DoS).
  return method.toUpperCase() === 'POST' && /^georeport\/v\d+\/requests(?:\.json|\.xml)?$/i.test(path);
}

function isVisionAnalyzeWritePath(path: string, method: string): boolean {
  if (method.toUpperCase() !== 'POST') return false;
  const normalizedPath = normalizeApiPath(path);
  return normalizedPath === 'vision/analyze' || normalizedPath.startsWith('vision/analyze/');
}

export function isAlwaysRateLimitedPath(path: string | string[] | undefined, method: string): boolean {
  const cleanPath = normalizePathParam(path);
  return isGeoReportWritePath(cleanPath, method) ||
    isVisionAnalyzeWritePath(cleanPath, method) ||
    isJsonApiPublicWritePath(cleanPath, method) ||
    isPublicEndpointWritePath(cleanPath, method);
}

/**
 * Trusted reverse-proxy IP or CIDR allowed to set X-Forwarded-For.
 *
 * Empty by default: socket-IP-only, which is safe because the client cannot
 * forge it. Set NUXT_TRUSTED_PROXY_IP to the ingress peer (single IP or CIDR)
 * on deployments where Nuxt sits behind a controlled reverse proxy such as
 * Traefik. Without it, all tenants behind one Traefik instance collapse into a
 * single fleet-wide rate-limit bucket because the socket IP is the proxy.
 *
 * Read lazily so deployment-time env changes (and tests) are picked up without
 * a module reload.
 */
function getTrustedProxyIp(): string {
  return (process.env.NUXT_TRUSTED_PROXY_IP || '').trim();
}

/**
 * Strips an IPv4-mapped IPv6 prefix and an optional zone id so that
 * "::ffff:127.0.0.1" and "127.0.0.1" compare equal.
 */
function normalizeIp(ip: string): string {
  const trimmed = ip.trim().replace(/%.*$/, '');
  return trimmed.startsWith('::ffff:') ? trimmed.slice('::ffff:'.length) : trimmed;
}

/**
 * Returns true when `ip` falls inside the trusted-proxy `spec`, which may be a
 * plain IP or an IPv4 CIDR (e.g. "10.0.0.0/24"). IPv6 CIDR is not supported;
 * IPv6 trusted proxies must be configured as exact addresses.
 */
function isTrustedPeer(ip: string, spec: string): boolean {
  const peer = normalizeIp(ip);
  const target = normalizeIp(spec);
  if (!peer || !target) return false;

  const slash = target.indexOf('/');
  if (slash === -1) {
    return peer === target;
  }

  const network = target.slice(0, slash);
  const prefix = Number.parseInt(target.slice(slash + 1), 10);
  // CIDR matching is IPv4-only here; both sides must be dotted-quad.
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  if (peer.includes(':') || network.includes(':')) return false;

  const toInt = (addr: string): number | null => {
    const parts = addr.split('.');
    if (parts.length !== 4) return null;
    let acc = 0;
    for (const part of parts) {
      const octet = Number.parseInt(part, 10);
      if (!Number.isInteger(octet) || octet < 0 || octet > 255 || String(octet) !== part) return null;
      acc = (acc << 8) | octet;
    }
    return acc >>> 0;
  };

  const peerInt = toInt(peer);
  const netInt = toInt(network);
  if (peerInt === null || netInt === null) return false;

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (peerInt & mask) === (netInt & mask);
}

/**
 * Gets a unique identifier for rate limiting.
 *
 * Defaults to IP-only because CSRF headers can be rotated on anonymous
 * requests and cookie shape alone is not proof that Drupal accepted a session.
 *
 * `ip` is the socket peer address resolved by the proxy handler. When
 * NUXT_TRUSTED_PROXY_IP is configured AND the immediate socket peer matches it,
 * the real client IP is taken from the leftmost X-Forwarded-For entry so that
 * tenants behind a shared reverse proxy are bucketed per real client rather
 * than per proxy. X-Forwarded-For is never trusted unless that gate passes,
 * because it is client-controlled and otherwise spoofable.
 */
export const getRateLimitIdentifier = (event: H3Event, ip: string): string => {
  const trustedProxyIp = getTrustedProxyIp();
  if (!trustedProxyIp) {
    return ip;
  }

  const peer = event.node?.req?.socket?.remoteAddress || '';
  if (!peer || !isTrustedPeer(peer, trustedProxyIp)) {
    return ip;
  }

  const forwardedHeader = event.node?.req?.headers?.['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedHeader) ? forwardedHeader[0] : forwardedHeader;
  const clientIp = forwardedValue?.split(',')[0]?.trim();
  return clientIp || ip;
};

/**
 * Checks if a request exceeds the rate limit and throws an error if it does
 */
export const checkRateLimit = (event: H3Event, ip: string, endpointType: string | null, method: string): void => {
  const isGeoReportWrite = method.toUpperCase() === 'POST';
  const isGeoReportEndpoint = endpointType === 'georeport' || endpointType === 'georeport_submit';

  if (isGeoReportEndpoint && isGeoReportWrite) {
    const config = useRuntimeConfig();
    const clientConfig = (config.public?.clientConfig ?? {}) as Record<string, unknown>;
    const featureFlags = (clientConfig.features ?? {}) as Record<string, unknown>;
    const allowGeoreportPost = featureFlags.allowGeoreportPost === true;

    if (!allowGeoreportPost) {
      throw createError({
        statusCode: 405,
        message: 'Write requests are not allowed for georeport endpoints'
      });
    }
  }

  const limitGet = endpointType === 'geocoding' || endpointType === 'georeport';
  if (!endpointType || !rateLimits[endpointType]) {
    return;
  }

  if (method === 'GET' && !limitGet) {
    return;
  }
  
  // Get a unique identifier for this client
  const identifier = getRateLimitIdentifier(event, ip);

  const now = Date.now();
  
  // Update last seen timestamp for TTL tracking
  identifierLastSeen[identifier] = now;

  // Run cleanup periodically (not on every request, only once per interval)
  if (now - lastCleanupTime > CLEANUP_INTERVAL_MS) {
    cleanupRateTracker();
    lastCleanupTime = now;
  }

  if (!rateTracker[identifier]) {
    rateTracker[identifier] = {};
  }
  if (!rateTracker[identifier][endpointType]) {
    rateTracker[identifier][endpointType] = [];
  }

  // Clean old timestamps during check
  rateTracker[identifier][endpointType] = rateTracker[identifier][endpointType].filter(
    (timestamp) => now - timestamp < rateLimits[endpointType].windowMs
  );

  if (rateTracker[identifier][endpointType].length >= rateLimits[endpointType].max) {
    const oldestRequest = Math.min(...rateTracker[identifier][endpointType]);
    const resetTime = oldestRequest + rateLimits[endpointType].windowMs - now;
    
    // Add debug info about identifier
    const hasToken = identifier.includes(':');
    
    throw createError({
      statusCode: 429,
      // Generic message: do not leak the internal bucket name / endpoint type.
      // resetTimeMs is retained in `data` for client backoff.
      message: `Too many requests. Please try again in ${Math.ceil(resetTime/1000)} seconds.`,
      data: {
        hasUserToken: hasToken,
        resetTimeMs: resetTime
      }
    });
  }

  rateTracker[identifier][endpointType].push(now);
};
