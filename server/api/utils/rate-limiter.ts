import { createError } from 'h3';
import type { H3Event } from 'h3';


export const rateLimits = {
  service_requests: { max: 5, windowMs: 60000 },
  files: { max: 15, windowMs: 60000 },
  media: { max: 15, windowMs: 60000 },
  vote: { max: 1, windowMs: 60000 },
  feedback: { max: 3, windowMs: 60000 }, 
  geocoding: { max: 10, windowMs: 60000 },
};


export const rateTracker: Record<string, Record<string, number[]>> = {};


setInterval(() => {
  const now = Date.now();
  for (const identifier in rateTracker) {
    for (const endpointType in rateTracker[identifier]) {
      
      rateTracker[identifier][endpointType] = rateTracker[identifier][endpointType].filter(
        timestamp => now - timestamp < rateLimits[endpointType]?.windowMs
      );
      
      if (rateTracker[identifier][endpointType].length === 0) {
        delete rateTracker[identifier][endpointType];
      }
    }
    
    if (Object.keys(rateTracker[identifier]).length === 0) {
      delete rateTracker[identifier];
    }
  }
}, 60000); 

export const getEndpointType = (path: string | string[]): string | null => {
  const cleanPath = Array.isArray(path) ? path.join('/') : path;
  
  
  if (cleanPath.startsWith('jsonapi/service_requests')) {
    return 'service_requests';
  } else if (cleanPath.startsWith('jsonapi/file')) {
    return 'files';
  } else if (cleanPath.startsWith('jsonapi/media')) {
    return 'media';
  } else if (cleanPath.startsWith('georeport/')) {
    return 'georeport';
  } else if (cleanPath.startsWith('jsonapi/vote') || cleanPath.startsWith('api/vote-sum')) {
    return 'vote';
  } else if (cleanPath.startsWith('feedback/')) {
    return 'feedback';
  } else if (cleanPath.match(/^jsonapi\/service-request/)) {
    
    return 'service_requests';
  } else if (cleanPath.match(/^jsonapi\/node\/service_request/)) {
    
    return 'service_requests';
  } else if (cleanPath.startsWith('geocoding/')) {
    
    return 'geocoding';
  }
  
  
  return null;
};

export const getRateLimitIdentifier = (event: H3Event, ip: string): string => {
  
  const csrfToken = event.node.req.headers['x-csrf-token'] as string || '';
  
  if (csrfToken) {
    // If we have a CSRF token, use it with the IP for a more precise identifier
    // This allows different users behind the same firewall/IP to have separate rate limits
    return `${ip}:${csrfToken.substring(0, 8)}`;
  }
  
  // Fall back to IP-only for unauthenticated requests
  return ip;
};

/**
 * Checks if a request exceeds the rate limit and throws an error if it does
 */
export const checkRateLimit = (event: H3Event, ip: string, endpointType: string | null, method: string): void => {
  if (endpointType === 'georeport' && method === 'POST') {
    throw createError({
      statusCode: 405,
      message: 'POST requests are not allowed for georeport endpoints'
    });
  }

  if (!endpointType || !rateLimits[endpointType] || method === 'GET') {
    return;
  }
  
  
  const identifier = getRateLimitIdentifier(event, ip);

  const now = Date.now();
  if (!rateTracker[identifier]) {
    rateTracker[identifier] = {};
  }
  if (!rateTracker[identifier][endpointType]) {
    rateTracker[identifier][endpointType] = [];
  }

  
  rateTracker[identifier][endpointType] = rateTracker[identifier][endpointType].filter(
    (timestamp) => now - timestamp < rateLimits[endpointType].windowMs
  );

  if (rateTracker[identifier][endpointType].length >= rateLimits[endpointType].max) {
    const oldestRequest = Math.min(...rateTracker[identifier][endpointType]);
    const resetTime = oldestRequest + rateLimits[endpointType].windowMs - now;
    
    
    const hasToken = identifier.includes(':');
    
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded for ${endpointType}. Please try again in ${Math.ceil(resetTime/1000)} seconds.`,
      data: {
        hasUserToken: hasToken,
        resetTimeMs: resetTime
      }
    });
  }

  rateTracker[identifier][endpointType].push(now);
};