
import type { GeocodingProvider, GeocodingResult, GeocodingOptions } from './types';


const createUrl = (path: string, origin?: string): URL => {
  
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    
    return new URL(path, window.location.origin);
  } else {
    
    return new URL(path, origin || 'http://localhost');
  }
};

export function createProxyProvider(baseUrl: string, defaultProvider = 'photon'): GeocodingProvider {
  return {
    name: 'proxy',

    async geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> {
      if (!query) return [];
      
      
      const url = createUrl(`/api/geocoding/${defaultProvider}/search`, baseUrl);
      url.searchParams.append('query', query);
      
      
      if (options?.limit) {
        url.searchParams.append('limit', options.limit.toString());
      }
      
      if (options?.language) {
        url.searchParams.append('language', options.language);
      }
      
      if (options?.bbox) {
        url.searchParams.append('bbox', options.bbox);
      }
      
      if (options?.centerPoint) {
        url.searchParams.append('lat', options.centerPoint.lat.toString());
        url.searchParams.append('lon', options.centerPoint.lng.toString());
      }
      
      if (options?.radius) {
        url.searchParams.append('radius', options.radius.toString());
      }
      
      try {
        console.debug(`Geocoding proxy search request to: ${url.toString()}`);
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Geocoding proxy request failed: ${response.status} ${response.statusText}`);
        }
        
        const results = await response.json();
        console.debug(`Geocoding proxy search returned ${results.length} results`);
        
        
        return results;
      } catch (error) {
        console.error('Proxy geocoding error:', error);
        throw error;
      }
    },

    async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
      if (isNaN(lat) || isNaN(lng)) {
        return {
          lat,
          lng,
          displayName: `${lat},${lng}`,
          address: {}
        };
      }
      
      
      const url = createUrl(`/api/geocoding/${defaultProvider}/reverse`, baseUrl);
      url.searchParams.append('lat', lat.toString());
      url.searchParams.append('lng', lng.toString());
      
      try {
        console.debug(`Geocoding proxy reverse request to: ${url.toString()}`);
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Reverse geocoding proxy request failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.debug('Geocoding proxy reverse returned result');
        
        
        return result;
      } catch (error) {
        console.error('Proxy reverse geocoding error:', error);
        
        
        return {
          lat,
          lng,
          displayName: `${lat},${lng}`,
          address: {}
        };
      }
    }
  };
}