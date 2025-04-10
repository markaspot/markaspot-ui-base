import { defineEventHandler, getRequestHeaders, createError, readBody } from 'h3';
import { Agent } from 'https';
import { URL } from 'url';


import { getEndpointType, checkRateLimit } from './utils/rate-limiter';
import { logRequest, logGeocoding } from './utils/logger';
import { handleGeocodingRequest, transformGeocodingResponse } from './handlers/geocoding';

export default defineEventHandler(async (event) => {
  logRequest('Incoming request:', {
    method: event.method,
    url: event.node.req.url,
    path: event.context.params.path,
  });

  
  const ip = event.headers['x-forwarded-for']?.split(',')[0].trim() ||
    event.node.req.connection.remoteAddress;
  const pathParam = event.context.params.path;
  const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
  
  const cleanPath = path;
  const endpointType = getEndpointType(cleanPath);

  
  checkRateLimit(event, ip, endpointType, event.method);

  
  const config = useRuntimeConfig();
  let targetBase = config.public.apiBase;
  let baseUrl = new URL(`${targetBase}/${cleanPath}`);

  
  const headers = {
    ...getRequestHeaders(event),
    cookie: event.node.req.headers.cookie,
  };
  
  
  if (cleanPath.startsWith('sites/default/files/')) {
    logRequest('Media file request detected:', { path: cleanPath });
    
    if (config.public.geoReportApiBase) {
      targetBase = config.public.geoReportApiBase;
      
      baseUrl = new URL(cleanPath, targetBase);
      logRequest('Using geoReportApiBase for media URL:', { url: baseUrl.href });
    } else {
      
      logRequest('No geoReportApiBase configured, using apiBase:', { url: baseUrl.href });
    }
  }

  
  if (cleanPath.startsWith('georeport/')) {
    const geoReportApiKey = process.env.GEOREPORT_API_KEY;
    if (!geoReportApiKey) {
      throw createError({
        statusCode: 403,
        message: 'GeoReport API key is missing in the configuration',
      });
    }
    baseUrl.searchParams.append('api_key', geoReportApiKey);
  }
  
  
  if (cleanPath.startsWith('geocoding/')) {
    baseUrl = await handleGeocodingRequest(event, cleanPath);
  }

  
  if (cleanPath.startsWith('stats/')) {
    baseUrl.searchParams.append('_format', 'json');
  }

  
  if (!cleanPath.startsWith('geocoding/') && event.node.req.url.includes('?')) {
    const searchString = event.node.req.url.split('?')[1];
    new URLSearchParams(searchString).forEach((value, key) => {
      baseUrl.searchParams.append(key, value);
    });
  }

  
  delete headers['host'];

  try {
    
    let body = undefined;
    if (event.method !== 'GET') {
      if (headers['content-type'] === 'application/octet-stream') {
        const chunks = [];
        let totalSize = 0;
        const maxSize = 100 * 1024 * 1024; 

        for await (const chunk of event.node.req) {
          totalSize += chunk.length;
          if (totalSize > maxSize) {
            throw createError({
              statusCode: 413,
              message: 'File size exceeds limit',
            });
          }
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
        logRequest('File upload body created:', { size: body.length });
      } else {
        body = await readBody(event);
      }
      logRequest('Request body:', { size: body?.length });
    }

    
    if (cleanPath.startsWith('geocoding/')) {
      logGeocoding('Request details', {
        path: cleanPath,
        query: Object.fromEntries(baseUrl.searchParams),
        targetUrl: baseUrl.href
      });
    } else {
      logRequest('Request details:', {
        method: event.method,
        targetUrl: baseUrl.href,
      });
    }

    
    let response;
    try {
      
      if (cleanPath.startsWith('geocoding/')) {
        logGeocoding('Final request URL', {
          url: baseUrl.href,
          params: Object.fromEntries(baseUrl.searchParams)
        });
      } else {
        logRequest('About to fetch URL:', { url: baseUrl.href });
      }
      
      
      if (cleanPath.startsWith('jsonapi/')) {
        
        
        
        
        let randomizedJsonApiPath = process.env.JSONAPI_RANDOM_PATH || config.private?.jsonapiRandomPath || 'jsonapi';
        
        
        if (typeof randomizedJsonApiPath === 'string') {
          randomizedJsonApiPath = randomizedJsonApiPath.replace(/^["'](.*)["']$/, '$1');
        }
        
        
        if (randomizedJsonApiPath !== 'jsonapi') {
          
          const originalPath = baseUrl.pathname;
          
          const newPath = originalPath.replace(/\/jsonapi\//, `/${randomizedJsonApiPath}/`);
          
          baseUrl.pathname = newPath;
          
          logRequest('Rewriting JSON API path:', { 
            original: originalPath,
            rewritten: newPath
          });
        }
      }
      
      response = await $fetch(baseUrl.href, {
        method: event.method,
        headers,
        body,
        agent: new Agent({ rejectUnauthorized: false }),
        timeout: config.proxy.timeoutSeconds * 1000,
      });
      logRequest('Fetch operation completed successfully', {});
    } catch (fetchError) {
      
      
      const safeUrl = new URL(baseUrl.href);
      
      if (safeUrl.searchParams.has('api_key')) {
        safeUrl.searchParams.set('api_key', '[REDACTED]');
      }
      
      logRequest('Error during fetch operation:', {
        message: fetchError.message.replace(/(api_key=)([^&]+)/g, '$1[REDACTED]'),
        status: fetchError.status || 'N/A',
        code: fetchError.code,
        type: fetchError.type,
        errno: fetchError.errno,
        url: safeUrl.toString(),
        method: event.method,
        body: fetchError.body ? 'present' : 'empty',
        stack: fetchError.stack ? fetchError.stack.replace(/(api_key=)([^&\s]+)/g, '$1[REDACTED]') : undefined
      });
      
      
      if (fetchError.code === 'ECONNREFUSED') {
        console.error(`Connection refused to ${baseUrl.hostname}:${baseUrl.port || '80/443'}`);
      } else if (fetchError.code === 'ETIMEDOUT') {
        console.error(`Connection timed out to ${baseUrl.href}`);
      } else if (fetchError.name === 'FetchError') {
        console.error('FetchError type:', fetchError.type);
      }
      
      
      let statusCode = fetchError.status || 500;
      
      let errorMessage = 'External API request failed';
      
      
      if (fetchError.status === 422) {
        
        
        
        try {
          
          if (fetchError.response) {
            const validationResponse = fetchError.response;
            let validationData;
            
            
            if (validationResponse._data) {
              validationData = validationResponse._data;
            } else if (validationResponse.data) {
              validationData = validationResponse.data;
            } else if (fetchError.data) {
              validationData = fetchError.data;
            }
            
            if (validationData) {
              logRequest('Passing through validation error (422):', {
                validationData: typeof validationData === 'string' 
                  ? validationData.substring(0, 200) 
                  : JSON.stringify(validationData).substring(0, 200)
              });
              
              
              event.node.res.statusCode = 422;
              
              
              return validationData;
            }
          }
        } catch (extractError) {
          console.error('Failed to extract validation data:', extractError);
        }
      }
      
      
      if (fetchError.status === 429) {
        
        
        
        try {
          
          if (fetchError.response) {
            const rateLimitResponse = fetchError.response;
            let rateLimitData;
            
            
            if (rateLimitResponse._data) {
              rateLimitData = rateLimitResponse._data;
            } else if (rateLimitResponse.data) {
              rateLimitData = rateLimitResponse.data;
            } else if (fetchError.data) {
              rateLimitData = fetchError.data;
            } else {
              
              rateLimitData = {
                statusCode: 429,
                message: fetchError.message || 'Rate limit exceeded'
              };
            }
            
            logRequest('Passing through rate limit error (429):', {
              rateLimitData: typeof rateLimitData === 'string' 
                ? rateLimitData.substring(0, 200) 
                : JSON.stringify(rateLimitData).substring(0, 200)
            });
            
            
            event.node.res.statusCode = 429;
            
            
            return rateLimitData;
          }
        } catch (extractError) {
          console.error('Failed to extract rate limit data:', extractError);
        }
      }
      
      if (fetchError.code === 'ECONNREFUSED') {
        statusCode = 502;
        errorMessage = 'Backend connection refused: The service is currently unavailable';
      } else if (fetchError.code === 'ETIMEDOUT' || fetchError.type === 'request-timeout') {
        statusCode = 504;
        errorMessage = 'Backend timeout: The request took too long to process';
      } else if (fetchError.message.includes('CSRF token')) {
        statusCode = 403;
        errorMessage = 'Authentication error: CSRF token validation failed';
      } else if (fetchError.status === 503) {
        errorMessage = 'Backend service unavailable: The requested service is temporarily unavailable';
      } else {
        
        errorMessage = `Request failed with status ${fetchError.status || "unknown"}`;
      }
      
      
      const sanitizedData = fetchError.data ? 
        JSON.stringify(fetchError.data).replace(/(api_key=)([^&\s"]+)/g, '$1[REDACTED]') : 
        errorMessage;
      
      throw createError({
        statusCode: statusCode,
        message: errorMessage,
        data: sanitizedData,
      });
    }

    
    logRequest('Response received:', {
      status: response?.status,
      type: typeof response
    });
    
    
    if (cleanPath.startsWith('geocoding/')) {
      
      const originalUrl = new URL(event.node.req.url, `http://${event.node.req.headers.host}`);
      
      
      return transformGeocodingResponse(response, cleanPath, originalUrl);
    }

    
    if (cleanPath.startsWith('georeport/')) {
      try {
        
        if (response && typeof response === 'object') {
          
          if (Array.isArray(response)) {
            logRequest('Processing array of GeoReport items', { count: response.length });
            response = response.map(item => {
              if (item && item.media_url && typeof item.media_url === 'string') {
                
                const apiPath = '/api';
                
                const originalUrl = item.media_url;
                
                
                
                if (originalUrl.match(/^https?:\/\/[^\/]+\//)) {
                  
                  const pathPart = originalUrl.replace(/^https?:\/\/[^\/]+\//, '');
                  item.media_url = `${apiPath}/${pathPart}`;
                }
                
                logRequest('Transformed media_url', { 
                  original: originalUrl.substring(0, 50), 
                  transformed: item.media_url.substring(0, 50)
                });
              }
              return item;
            });
          }
          
          else if (response.media_url && typeof response.media_url === 'string') {
            logRequest('Processing single GeoReport item', { id: response.service_request_id });
            const apiPath = '/api';
            
            const originalUrl = response.media_url;
            
            
            
            if (originalUrl.match(/^https?:\/\/[^\/]+\//)) {
              
              const pathPart = originalUrl.replace(/^https?:\/\/[^\/]+\//, '');
              response.media_url = `${apiPath}/${pathPart}`;
            }
            
            logRequest('Transformed media_url', { 
              original: originalUrl.substring(0, 50), 
              transformed: response.media_url.substring(0, 50)
            });
          }
        }
      } catch (error) {
        logRequest('Error transforming media_url', { error: error.message });
        
      }
    }

    
    return response;
  } catch (error) {
    
    const isGeocodingRequest = cleanPath.startsWith('geocoding/');
    const logFunction = isGeocodingRequest ? logGeocoding : logRequest;
    
    
    const safeUrl = new URL(baseUrl.href);
    
    if (safeUrl.searchParams.has('api_key')) {
      safeUrl.searchParams.set('api_key', '[REDACTED]');
    }
    
    
    const errorDetails = {
      message: error.message?.replace ? error.message.replace(/(api_key=)([^&\s]+)/g, '$1[REDACTED]') : error.message,
      status: error.response?.status || error.status || 500,
      code: error.code,
      type: error.type,
      data: error.response?._data || error.data,
      url: safeUrl.toString(),
      originalUrl: event.node.req.url,
      path: cleanPath,
      method: event.method,
      headers: Object.keys(headers || {}).reduce((acc, key) => {
        
        if (!['cookie', 'authorization'].includes(key.toLowerCase())) {
          acc[key] = headers[key];
        }
        return acc;
      }, {}),
      stack: error.stack?.replace ? error.stack.replace(/(api_key=)([^&\s]+)/g, '$1[REDACTED]') : error.stack
    };
    
    
    logFunction('API error', errorDetails);
    
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`Connection refused to ${baseUrl.hostname}:${baseUrl.port || '80/443'}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`Connection timed out to ${baseUrl.href}`);
    } else if (error.name === 'FetchError') {
      console.error('FetchError details:', {
        type: error.type,
        errno: error.errno,
        code: error.code
      });
    }
    
    
    let statusCode = error.response?.status || error.status || 500;
    let errorMessage = error.message;
    let errorData = error.response?._data || error.data || { message: error.message };
    
    
    if (statusCode === 422) {
      
      
      logRequest('Validation error (422):', {
        data: typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
      });
      
      
      
      
      
      event.node.res.statusCode = 422;
      
      
      return error.response?.data || (typeof errorData === 'string' ? JSON.parse(errorData) : errorData);
    }
    
    else if (statusCode === 429) {
      
      logRequest('Rate limit error (429):', {
        data: typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
      });
      
      
      event.node.res.statusCode = 429;
      
      
      const rateLimitData = error.response?.data || 
        (typeof errorData === 'string' ? 
          
          (function() { try { return JSON.parse(errorData); } catch(e) { return errorData; }})() : 
          
          errorData || { 
            statusCode: 429, 
            message: error.message || 'Rate limit exceeded'
          }
        );
      
      
      return rateLimitData;
    }
    
    else if (error.message.includes('CSRF token')) {
      statusCode = 403;
      errorMessage = 'Authentication error: CSRF token validation failed';
    } else if (error.message.includes('timed out') || error.code === 'ETIMEDOUT') {
      statusCode = 504;
      errorMessage = 'Server timeout: The request took too long to process';
    } else if (error.code === 'ECONNREFUSED') {
      statusCode = 502;
      errorMessage = 'Backend connection failed: The service is currently unavailable';
    }
    
    
    let sanitizedData = errorData;
    
    if (typeof sanitizedData === 'string') {
      sanitizedData = sanitizedData.replace(/(api_key=)([^&\s"]+)/g, '$1[REDACTED]');
    } else if (sanitizedData && typeof sanitizedData === 'object') {
      sanitizedData = JSON.parse(
        JSON.stringify(sanitizedData).replace(/(api_key=)([^&\s"]+)/g, '$1[REDACTED]')
      );
    }
    
    
    throw createError({
      statusCode,
      message: errorMessage,
      data: sanitizedData,
    });
  }
});