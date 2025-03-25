
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { useTokenCache } from '~/composables/api/useTokenCache'
import { useServiceStatus } from '~/composables/core/useServiceStatus'

interface ApiClientOptions {
  baseURL?: string
  defaultHeaders?: Record<string, string>
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
  headers?: Record<string, string>
  onUploadProgress?: (progress: ProgressEvent) => void
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any
  ) {
    const errorData = data?.data || data;
    const errorDetail = errorData?.errors?.[0]?.detail ||
      errorData?.errors?.[0]?.title ||
      `API Error: ${status}`;
    super(errorDetail);
    this.name = 'ApiError';

    this.data = data;
  }
}

export const useApiClient = (options: ApiClientOptions = {}) => {
  const tokenCache = useTokenCache()
  const config = useRuntimeConfig()
  const csrfToken = ref<string | null>(null)

  const buildUrl = (endpoint: string, params?: Record<string, string>) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    const shouldUseProxy = process.client && config.public.useProxy === true
    let baseUrl = shouldUseProxy 
      ? (config.public.proxyPath || '/api/proxy') 
      : config.public.apiBase
    
    baseUrl = baseUrl.replace(/\/$/, '')

    let finalUrl = `${baseUrl}${cleanEndpoint}`

    // Add query parameters if provided
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value)
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        finalUrl += `?${queryString}`
      }
    }

    return finalUrl
  }

  const getHeaders = async (customHeaders: Record<string, string> = {}) => {
    if (!csrfToken.value) {
      await refreshCsrfToken()
    }

    const headers = {
      'Accept': 'application/vnd.api+json',
      'X-CSRF-Token': csrfToken.value || '',
      ...options.defaultHeaders,
      ...customHeaders,
    }

    if (!customHeaders['Content-Type']) {
      headers['Content-Type'] = 'application/vnd.api+json'
    }

    Object.keys(headers).forEach(key => {
      if (headers[key] === undefined || headers[key] === null) {
        delete headers[key]
      }
    })

    return headers
  }

  const refreshCsrfToken = async () => {
    const serviceStatus = useServiceStatus()
    let tokenUrl = '';

    try {
      tokenUrl = buildUrl('/session/token')
      
      
      const response = await fetch(tokenUrl, {
        credentials: 'include',
        
        cache: 'no-store'
      })

      
      if (response.status === 503) {
        console.error('503 Service Unavailable detected in token refresh');
        const responseText = await response.text();
        console.error('503 Response body:', responseText);
        
        
        serviceStatus.registerServiceFailure(response);
        
        
        throw new Error(`Service unavailable (503): ${responseText}`);
      }
      
      if (!response.ok) {
        console.error(`CSRF token fetch failed: Status ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.error('Response body:', responseText);
        
        
        if (responseText.includes('maintenance mode') || 
            responseText.includes('Wartungsmodus') || 
            responseText.includes('503 Service') || 
            responseText.toLowerCase().includes('maintenance')) {
          
          console.error('Maintenance mode detected in response text');
          serviceStatus.registerServiceFailure(response);
          throw new Error(`Maintenance mode detected: ${responseText}`);
        }
        
        
        throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
      }

      const token = await response.text();
      csrfToken.value = token;
      tokenCache.setCachedToken(token);
      
      
      serviceStatus.registerServiceSuccess();
    } catch (error) {
      console.error('Error refreshing CSRF token:', error);
      
      
      if (error.name === 'TypeError' && !csrfToken.value) {
        console.warn('Network error during initial token fetch - not registering as service failure');
      } else {
        
        serviceStatus.registerServiceFailure({
          statusCode: error.status || 500,
          message: error.message || 'Failed to refresh token',
          url: tokenUrl
        });
      }
      
      throw error;
    }
  }

  
  const serviceStatus = useServiceStatus();

  const request = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { params, headers: customHeaders, onUploadProgress, ...fetchOptions } = options;
    const url = buildUrl(endpoint, params);
    
    
    if (!serviceStatus.shouldRetry()) {
      throw new ApiError(
        503, 
        'Service Unavailable', 
        { message: serviceStatus.getServiceDownMessage() }
      );
    }

    


    try {
      const headers = await getHeaders(customHeaders);
      
      
      let fetchPromise: Promise<Response>;
      
      if (onUploadProgress && fetchOptions.body instanceof FormData) {
        const xhr = new XMLHttpRequest();
        fetchPromise = new Promise((resolve, reject) => {
          xhr.open(fetchOptions.method || 'GET', url);
          
          
          Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key]);
          });
          
          xhr.withCredentials = true;
          
          xhr.upload.addEventListener('progress', onUploadProgress);
          
          xhr.onload = () => {
            const response = new Response(xhr.response, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers(
                xhr.getAllResponseHeaders().split('\r\n')
                  .filter(Boolean)
                  .reduce((acc, line) => {
                    const [key, value] = line.split(': ');
                    acc[key.toLowerCase()] = value;
                    return acc;
                  }, {})
              )
            });
            resolve(response);
          };
          
          xhr.onerror = () => {
            console.error('XHR request failed');
            reject(new Error('Network request failed'));
          };
          xhr.send(fetchOptions.body);
        });
      } else {
        fetchPromise = fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        });
      }

      const response = await fetchPromise;
      
      
      
      serviceStatus.registerServiceSuccess();

      if (!response.ok) {
        
        if (response.status === 503) {
          
          serviceStatus.registerServiceFailure(response);
          
          throw new ApiError(503, 'Service Unavailable', { 
            message: serviceStatus.getServiceDownMessage() 
          });
        }


        console.error(`API Error: ${response.status} ${response.statusText} for ${url}`);
        
        let responseText, errorData;
        try {
          responseText = await response.text();
          console.error('Error response body:', responseText);
          
          
          
          
          try {
            errorData = JSON.parse(responseText);
            
            
            
            
            if (response.status === 429) {
              
              );
            }
            else if (response.status === 422) {
              
              
              
              if (errorData?.errors?.length > 0) {
                
                
                
                errorData.errors.forEach((error: any, index: number) => {
                  const field = error.source?.pointer?.replace('/data/attributes/', '') || 'unknown';
                  console.error(`Validation error ${index + 1}: Field "${field}" - ${error.detail || error.title}`);
                });
              }
            }
            
            if (response.status === 429 && errorData.message) {
              errorData.originalMessage = errorData.message;
            }
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);

            
            if (response.status === 429) {
              errorData = {
                status: 429,
                message: responseText,
                originalMessage: responseText
              };
            } else {
              errorData = {
                errors: [{
                  status: response.status.toString(),
                  title: response.statusText,
                  detail: responseText || 'Failed to parse error response'
                }]
              };
            }
          }
        } catch (textError) {
          console.error('Failed to read error response body:', textError);
          errorData = {
            errors: [{
              status: response.status.toString(),
              title: response.statusText,
              detail: 'Failed to read error response'
            }]
          };
        }

        
        const apiError = new ApiError(
          response.status,
          response.statusText,
          errorData
        );
        
        
        if (response.status === 429 && errorData.message) {
          apiError.originalMessage = errorData.message;
        }
        
        throw apiError;
      }

      
      
      const text = await response.text();
      
      if (!text) {
        
        return null as T;
      }

      try {
        const result = JSON.parse(text) as T;
        
        return result;
      } catch (parseError) {
        console.error(`JSON parse error for ${endpoint}:`, parseError);
        console.error('Response text:', text.substring(0, 200) + '...');
        throw new Error(`Invalid JSON response from ${endpoint}: ${parseError.message}`);
      }
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error);

      if (error instanceof ApiError) {
        console.error('ApiError details:', {
          status: error.status,
          statusText: error.statusText,
          data: error.data
        });
        throw error;
      }
      
      if (error instanceof TypeError) {
        console.error('Network error details:', error);
        throw new Error(`Network error for ${endpoint}: ${error.message}`);
      }

      
      if (error && (
        error.status === 503 || 
        (error.response && error.response.status === 503)
      )) {
        
        serviceStatus.registerServiceFailure();
        
      }
      
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
  
  return {
    get: <T>(endpoint: string, params?: Record<string, string>) =>
      request<T>(endpoint, { method: 'GET', params }),

    post: <T>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
      request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data instanceof File || data instanceof FormData
          ? data
          : (data ? JSON.stringify(data) : undefined),
      }),

    put: <T>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
      request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),

    patch: <T>(endpoint: string, data?: unknown, options: RequestOptions = {}) =>
      request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      }),

    delete: <T>(endpoint: string, options: RequestOptions = {}) =>
      request<T>(endpoint, {
        ...options,
        method: 'DELETE'
      }),

    getBaseUrl: () => {
      const shouldUseProxy = process.client && config.public.useProxy === true
      return shouldUseProxy ? config.public.proxyPath : config.public.apiBase?.replace(/\/$/, '')
    },

    getCsrfToken: async () => {
      if (!csrfToken.value) {
        await refreshCsrfToken()
      }
      return csrfToken.value
    },
    refreshCsrfToken,
  }
}