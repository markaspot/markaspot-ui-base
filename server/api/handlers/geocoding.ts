import { createError } from 'h3';
import type { H3Event } from 'h3';
import { URL } from 'url';
import { logGeocoding } from '../utils/logger';
import * as MapboxProvider from '../providers/mapbox';
import * as PhotonProvider from '../providers/photon';
import type { GeocodingResult } from '../../types/proxy';

/**
 * Handle geocoding requests
 */
export const handleGeocodingRequest = async (event: H3Event, cleanPath: string): Promise<URL> => {
  const parts = cleanPath.split('/');
  if (parts.length < 3) {
    throw createError({
      statusCode: 400,
      message: 'Invalid geocoding path format. Expected format: geocoding/[provider]/[operation]'
    });
  }

  const provider = parts[1]; // 'mapbox' or 'photon'
  const operation = parts[2]; // 'search' or 'reverse'
  const config = useRuntimeConfig();
  const mapboxKey = config.public.mapboxKey as string | undefined;
  let baseUrl: URL;

  const originalUrl = new URL(event.node.req.url!, `http://${event.node.req.headers.host}`);

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
        throw createError({ statusCode: 400, message: 'Query parameter is required for geocoding search' });
      }

      const options = {
        limit: originalUrl.searchParams.get('limit') || undefined,
        language: originalUrl.searchParams.get('language') || undefined,
        bbox: originalUrl.searchParams.get('bbox') || undefined,
        types: originalUrl.searchParams.get('types') || undefined,
        autocomplete: originalUrl.searchParams.get('autocomplete') || undefined,
        country: originalUrl.searchParams.get('country') || undefined
      };

      baseUrl = MapboxProvider.createMapboxSearchUrl(query, mapboxKey, options);
    }
    else if (operation === 'reverse') {
      const lat = originalUrl.searchParams.get('lat');
      const lng = originalUrl.searchParams.get('lng');

      logGeocoding('Mapbox reverse geocoding request', { lat, lng, fullUrl: originalUrl.toString() });

      if (!lat || !lng) {
        throw createError({ statusCode: 400, message: 'Lat and lng parameters are required for reverse geocoding' });
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
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error in Mapbox reverse geocoding:', err);
        throw createError({ statusCode: 400, message: `Invalid coordinates: ${errorMessage}` });
      }
    } else {
      throw createError({ statusCode: 400, message: `Unsupported geocoding operation: ${operation}` });
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
        throw createError({ statusCode: 400, message: 'Query parameter is required for geocoding search' });
      }

      const options: { limit?: string; lang?: string; bbox?: string; radius?: string; lat?: number; lng?: number } = {
        limit: originalUrl.searchParams.get('limit') || undefined,
        lang: originalUrl.searchParams.get('lang') || undefined,
        bbox: originalUrl.searchParams.get('bbox') || undefined,
        radius: originalUrl.searchParams.get('radius') || undefined
      };

      if (originalUrl.searchParams.has('lat') && originalUrl.searchParams.has('lon')) {
        options.lat = parseFloat(originalUrl.searchParams.get('lat')!);
        options.lng = parseFloat(originalUrl.searchParams.get('lon')!);
      }

      baseUrl = PhotonProvider.createPhotonSearchUrl(query, options);
    }
    else if (operation === 'reverse') {
      const lat = originalUrl.searchParams.get('lat');
      const lng = originalUrl.searchParams.get('lng');

      logGeocoding('Photon reverse geocoding request', { lat, lng, fullUrl: originalUrl.toString() });

      if (!lat || !lng) {
        throw createError({ statusCode: 400, message: 'Lat and lng parameters are required for reverse geocoding' });
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
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error in Photon reverse geocoding:', err);
        throw createError({ statusCode: 400, message: `Invalid coordinates: ${errorMessage}` });
      }
    } else {
      throw createError({ statusCode: 400, message: `Unsupported geocoding operation: ${operation}` });
    }
  } else {
    throw createError({ statusCode: 400, message: `Unsupported geocoding provider: ${provider}` });
  }

  return baseUrl;
};

/**
 * Transform geocoding response to standardized format
 */
export const transformGeocodingResponse = (
  response: unknown,
  cleanPath: string,
  originalUrl: URL
): GeocodingResult | GeocodingResult[] | unknown => {
  const parts = cleanPath.split('/');
  const provider = parts[1];
  const operation = parts[2];

  logGeocoding('Transforming geocoding response from provider:', { provider });

  if (provider === 'mapbox') {
    if (operation === 'search') {
      return MapboxProvider.transformMapboxSearchResults(response as Parameters<typeof MapboxProvider.transformMapboxSearchResults>[0]);
    }
    else if (operation === 'reverse') {
      const lat = parseFloat(originalUrl.searchParams.get('lat')!);
      const lng = parseFloat(originalUrl.searchParams.get('lng')!);
      return MapboxProvider.transformMapboxReverseResult(response as Parameters<typeof MapboxProvider.transformMapboxReverseResult>[0], lat, lng);
    }
  }
  else if (provider === 'photon') {
    if (operation === 'search') {
      return PhotonProvider.transformPhotonSearchResults(response as Parameters<typeof PhotonProvider.transformPhotonSearchResults>[0]);
    }
    else if (operation === 'reverse') {
      const lat = parseFloat(originalUrl.searchParams.get('lat')!);
      const lng = parseFloat(originalUrl.searchParams.get('lng')!);
      return PhotonProvider.transformPhotonReverseResult(response as Parameters<typeof PhotonProvider.transformPhotonReverseResult>[0], lat, lng);
    }
  }

  return response;
};
