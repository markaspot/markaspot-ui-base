import { createError, H3Event } from 'h3';
import { URL } from 'url';
import { logGeocoding } from '../utils/logger';
import * as MapboxProvider from '../providers/mapbox';
import * as PhotonProvider from '../providers/photon';

export const handleGeocodingRequest = async (event: H3Event, cleanPath: string): Promise<URL> => {
  
  const parts = cleanPath.split('/');
  if (parts.length < 3) {
    throw createError({
      statusCode: 400,
      message: 'Invalid geocoding path format. Expected format: geocoding/[provider]/[operation]'
    });
  }
  
  const provider = parts[1]; 
  const operation = parts[2]; 
  const config = useRuntimeConfig();
  const mapboxKey = config.public.mapboxKey;
  let baseUrl: URL;
  
  
  const originalUrl = new URL(event.node.req.url, `http://${event.node.req.headers.host}`);
  
  
  if (provider === 'mapbox') {
    if (!mapboxKey) {
      throw createError({
        statusCode: 403,
        message: 'Mapbox API key is missing in the configuration',
      });
    }
    
    
    if (operation === 'search') {
      logGeocoding('Mapbox search request', { 
        url: originalUrl.toString(),
        params: Object.fromEntries(originalUrl.searchParams)
      });
      
      
      const query = originalUrl.searchParams.get('query');
      if (!query) {
        throw createError({
          statusCode: 400,
          message: 'Query parameter is required for geocoding search',
        });
      }
      
      
      const options = {
        limit: originalUrl.searchParams.get('limit') || undefined,
        language: originalUrl.searchParams.get('language') || undefined,
        bbox: originalUrl.searchParams.get('bbox') || undefined,
        types: originalUrl.searchParams.get('types') || undefined,
        country: originalUrl.searchParams.get('country') || undefined
      };
      
      baseUrl = MapboxProvider.createMapboxSearchUrl(query, mapboxKey, options);
    } 
    else if (operation === 'reverse') {
      
      const lat = originalUrl.searchParams.get('lat');
      const lng = originalUrl.searchParams.get('lng');
      
      logGeocoding('Mapbox reverse geocoding request', { 
        lat, 
        lng, 
        fullUrl: originalUrl.toString() 
      });
      
      if (!lat || !lng) {
        throw createError({
          statusCode: 400,
          message: 'Lat and lng parameters are required for reverse geocoding',
        });
      }
      
      try {
        
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        if (isNaN(latNum) || isNaN(lngNum)) {
          throw new Error('Invalid lat/lng values');
        }
        
        
        const options = {
          language: originalUrl.searchParams.get('language') || undefined,
          types: originalUrl.searchParams.get('types') || undefined
        };
        
        baseUrl = MapboxProvider.createMapboxReverseUrl(latNum, lngNum, mapboxKey, options);
      } catch (err) {
        console.error('Error in Mapbox reverse geocoding:', err);
        throw createError({
          statusCode: 400,
          message: `Invalid coordinates: ${err.message}`,
        });
      }
    } else {
      throw createError({
        statusCode: 400,
        message: `Unsupported geocoding operation: ${operation}`,
      });
    }
  } 
  else if (provider === 'photon') {
    
    if (operation === 'search') {
      logGeocoding('Photon search request', { 
        url: originalUrl.toString(),
        params: Object.fromEntries(originalUrl.searchParams) 
      });
      
      
      const query = originalUrl.searchParams.get('query');
      if (!query) {
        throw createError({
          statusCode: 400,
          message: 'Query parameter is required for geocoding search',
        });
      }
      
      
      const options = {
        limit: originalUrl.searchParams.get('limit') || undefined,
        lang: originalUrl.searchParams.get('lang') || undefined,
        bbox: originalUrl.searchParams.get('bbox') || undefined,
        radius: originalUrl.searchParams.get('radius') || undefined
      };
      
      
      if (originalUrl.searchParams.has('lat') && originalUrl.searchParams.has('lon')) {
        options.lat = parseFloat(originalUrl.searchParams.get('lat'));
        options.lng = parseFloat(originalUrl.searchParams.get('lon'));
      }
      
      baseUrl = PhotonProvider.createPhotonSearchUrl(query, options);
    } 
    else if (operation === 'reverse') {
      
      const lat = originalUrl.searchParams.get('lat');
      const lng = originalUrl.searchParams.get('lng');
      
      logGeocoding('Photon reverse geocoding request', { 
        lat, 
        lng, 
        fullUrl: originalUrl.toString() 
      });
      
      if (!lat || !lng) {
        throw createError({
          statusCode: 400,
          message: 'Lat and lng parameters are required for reverse geocoding',
        });
      }
      
      try {
        
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        if (isNaN(latNum) || isNaN(lngNum)) {
          throw new Error('Invalid lat/lng values');
        }
        
        
        const options = {
          lang: originalUrl.searchParams.get('lang') || undefined
        };
        
        baseUrl = PhotonProvider.createPhotonReverseUrl(latNum, lngNum, options);
      } catch (err) {
        console.error('Error in Photon reverse geocoding:', err);
        throw createError({
          statusCode: 400,
          message: `Invalid coordinates: ${err.message}`,
        });
      }
    } else {
      throw createError({
        statusCode: 400,
        message: `Unsupported geocoding operation: ${operation}`,
      });
    }
  } else {
    throw createError({
      statusCode: 400,
      message: `Unsupported geocoding provider: ${provider}`,
    });
  }
  
  return baseUrl;
};

export const transformGeocodingResponse = (
  response: any, 
  cleanPath: string, 
  originalUrl: URL
): any => {
  const parts = cleanPath.split('/');
  const provider = parts[1];
  const operation = parts[2];
  
  logGeocoding('Transforming geocoding response from provider:', provider);
  
  if (provider === 'mapbox') {
    if (operation === 'search') {
      return MapboxProvider.transformMapboxSearchResults(response);
    } 
    else if (operation === 'reverse') {
      const lat = parseFloat(originalUrl.searchParams.get('lat'));
      const lng = parseFloat(originalUrl.searchParams.get('lng'));
      return MapboxProvider.transformMapboxReverseResult(response, lat, lng);
    }
  } 
  else if (provider === 'photon') {
    if (operation === 'search') {
      return PhotonProvider.transformPhotonSearchResults(response);
    } 
    else if (operation === 'reverse') {
      const lat = parseFloat(originalUrl.searchParams.get('lat'));
      const lng = parseFloat(originalUrl.searchParams.get('lng'));
      return PhotonProvider.transformPhotonReverseResult(response, lat, lng);
    }
  }
  
  
  return response;
};