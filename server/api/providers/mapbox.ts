import { createError } from 'h3';
import { URL } from 'url';
import { logGeocoding } from '../utils/logger';

interface MapboxOptions {
  query?: string;
  lat?: number;
  lng?: number;
  limit?: string;
  language?: string;
  bbox?: string;
  types?: string;
  country?: string;
}

export const createMapboxSearchUrl = (
  query: string,
  apiKey: string,
  options: MapboxOptions = {}
): URL => {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.append('access_token', apiKey);
  
  logGeocoding('Building Mapbox URL - starting with:', url.toString());
  
  
  if (options.limit) url.searchParams.append('limit', options.limit);
  if (options.language) url.searchParams.append('language', options.language);
  if (options.bbox) url.searchParams.append('bbox', options.bbox);
  if (options.types) url.searchParams.append('types', options.types);
  if (options.country) url.searchParams.append('country', options.country);
  
  
  if (!url.searchParams.has('limit')) url.searchParams.append('limit', '5');
  if (!url.searchParams.has('language')) url.searchParams.append('language', 'de');
  if (!url.searchParams.has('types')) url.searchParams.append('types', 'address,place,poi');
  if (!url.searchParams.has('country')) url.searchParams.append('country', 'de');
  
  return url;
};

export const createMapboxReverseUrl = (
  lat: number,
  lng: number,
  apiKey: string,
  options: MapboxOptions = {}
): URL => {
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid lat/lng values');
  }
  
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`);
  url.searchParams.append('access_token', apiKey);
  
  
  if (options.language) url.searchParams.append('language', options.language);
  if (options.types) url.searchParams.append('types', options.types);
  
  
  if (!url.searchParams.has('language')) url.searchParams.append('language', 'de');
  if (!url.searchParams.has('types')) url.searchParams.append('types', 'address,place,poi');
  
  return url;
};

export const transformMapboxSearchResults = (response: any): any[] => {
  
  if (!response || !response.features || !Array.isArray(response.features)) {
    logGeocoding('Invalid Mapbox search response:', response);
    return [];
  }
  
  logGeocoding(`Found ${response.features.length} Mapbox features`, {});
  
  
  return response.features.map(feature => {
    const context = feature.context?.reduce((acc, item) => {
      const id = item.id.split('.')[0];
      acc[id] = item.text;
      return acc;
    }, {});
    
    return {
      lat: feature.center[1],
      lng: feature.center[0],
      displayName: feature.place_name || feature.text,
      address: {
        street: feature.text,
        houseNumber: feature.address || null,
        housenumber: feature.address || null,
        city: context?.place,
        state: context?.region,
        country: context?.country,
        postcode: context?.postcode
      },
      raw: feature
    };
  });
};

export const transformMapboxReverseResult = (response: any, originalLat: number, originalLng: number): any => {
  
  if (!response.features || !Array.isArray(response.features) || response.features.length === 0) {
    logGeocoding('No features found in Mapbox reverse geocoding response', { response });
    
    return {
      lat: originalLat,
      lng: originalLng,
      displayName: `${originalLat},${originalLng}`,
      address: {}
    };
  }
  
  
  const feature = response.features[0];
  logGeocoding('Found Mapbox feature for reverse geocoding', {});
  
  if (!feature) {
    return {
      lat: originalLat,
      lng: originalLng,
      displayName: `${originalLat},${originalLng}`,
      address: {}
    };
  }
  
  const context = feature.context?.reduce((acc, item) => {
    const id = item.id.split('.')[0];
    acc[id] = item.text;
    return acc;
  }, {});
  
  return {
    lat: feature.center[1],
    lng: feature.center[0],
    displayName: feature.place_name || feature.text,
    address: {
      street: feature.text,
      houseNumber: feature.address || null,
      housenumber: feature.address || null,
      city: context?.place,
      state: context?.region,
      country: context?.country,
      postcode: context?.postcode
    },
    raw: feature
  };
};