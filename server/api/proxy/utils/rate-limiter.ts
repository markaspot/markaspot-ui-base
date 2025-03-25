import { createError } from 'h3';


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
  for (const ip in rateTracker) {
    for (const endpointType in rateTracker[ip]) {
      
      rateTracker[ip][endpointType] = rateTracker[ip][endpointType].filter(
        timestamp => now - timestamp < rateLimits[endpointType]?.windowMs
      );
      
      if (rateTracker[ip][endpointType].length === 0) {
        delete rateTracker[ip][endpointType];
      }
    }
    
    if (Object.keys(rateTracker[ip]).length === 0) {
      delete rateTracker[ip];
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
  } else if (cleanPath.startsWith('jsonapi/vote')) {
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

export const checkRateLimit = (ip: string, endpointType: string | null, method: string): void => {
  if (endpointType === 'georeport' && method === 'POST') {
    throw createError({
      statusCode: 405,
      message: 'POST requests are not allowed for georeport endpoints'
    });
  }

  if (!endpointType || !rateLimits[endpointType] || method === 'GET') {
    return;
  }

  const now = Date.now();
  if (!rateTracker[ip]) {
    rateTracker[ip] = {};
  }
  if (!rateTracker[ip][endpointType]) {
    rateTracker[ip][endpointType] = [];
  }

  
  rateTracker[ip][endpointType] = rateTracker[ip][endpointType].filter(
    (timestamp) => now - timestamp < rateLimits[endpointType].windowMs
  );

  if (rateTracker[ip][endpointType].length >= rateLimits[endpointType].max) {
    const oldestRequest = Math.min(...rateTracker[ip][endpointType]);
    const resetTime = oldestRequest + rateLimits[endpointType].windowMs - now;
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded for ${endpointType}. Please try again in ${Math.ceil(resetTime/1000)} seconds.`,
    });
  }

  rateTracker[ip][endpointType].push(now);
};