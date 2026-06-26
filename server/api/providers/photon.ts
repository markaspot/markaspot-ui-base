import { URL } from 'url';
import { logGeocoding } from '../utils/logger';
import type { PhotonFeature, PhotonResponse, GeocodingResult } from '../../types/proxy';

interface PhotonOptions {
  query?: string;
  lat?: number;
  lng?: number;
  limit?: string;
  lang?: string;
  bbox?: string;
  radius?: string;
}

/**
 * Create a Photon search URL
 */
export const createPhotonSearchUrl = (
  query: string,
  options: PhotonOptions = {}
): URL => {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.append('q', query);

  if (options.limit) url.searchParams.append('limit', options.limit);
  if (options.lang) url.searchParams.append('lang', options.lang);
  if (options.bbox) url.searchParams.append('bbox', options.bbox);
  if (options.lat && options.lng) {
    url.searchParams.append('lat', options.lat.toString());
    url.searchParams.append('lon', options.lng.toString());
  }
  if (options.radius) url.searchParams.append('radius', options.radius);

  if (!url.searchParams.has('limit')) url.searchParams.append('limit', '5');
  if (!url.searchParams.has('lang')) url.searchParams.append('lang', 'de');

  return url;
};

/**
 * Create a Photon reverse geocoding URL
 */
export const createPhotonReverseUrl = (
  lat: number,
  lng: number,
  options: PhotonOptions = {}
): URL => {
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid lat/lng values');
  }

  const url = new URL('https://photon.komoot.io/reverse/');
  url.searchParams.append('lat', lat.toString());
  url.searchParams.append('lon', lng.toString());

  if (options.lang) url.searchParams.append('lang', options.lang);

  if (!url.searchParams.has('lang')) url.searchParams.append('lang', 'de');

  return url;
};

/**
 * Transform Photon search response to standardized format
 */
export const transformPhotonSearchResults = (response: PhotonResponse): GeocodingResult[] => {
  if (!response || !response.features || !Array.isArray(response.features)) {
    logGeocoding('Invalid Photon search response:', { response });
    return [];
  }

  logGeocoding(`Found ${response.features.length} Photon features`, {});

  return response.features.map((feature: PhotonFeature) => {
    const props = feature.properties;
    return {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      displayName: props.name ||
        [
          props.street ? `${props.street} ${props.housenumber || ''}` : '',
          props.city || props.state || ''
        ].filter(Boolean).join(', '),
      address: {
        street: props.street || null,
        houseNumber: props.housenumber || null,
        housenumber: props.housenumber || null,
        city: props.city || null,
        state: props.state || null,
        country: props.country || null,
        countryCode: props.countrycode?.toUpperCase() || null,
        postcode: props.postcode || null
      },
      raw: feature
    };
  });
};

/**
 * Transform Photon reverse geocoding response to standardized format
 */
export const transformPhotonReverseResult = (response: PhotonResponse, originalLat: number, originalLng: number): GeocodingResult => {
  if (!response.features || !Array.isArray(response.features) || response.features.length === 0) {
    logGeocoding('No features found in Photon reverse geocoding response', { response });

    return {
      lat: originalLat,
      lng: originalLng,
      displayName: `${originalLat},${originalLng}`,
      address: {
        street: null, houseNumber: null, housenumber: null,
        city: null, state: null, country: null, countryCode: null, postcode: null
      },
      raw: null
    };
  }

  const feature = response.features[0];
  logGeocoding('Found Photon feature for reverse geocoding', {});

  if (!feature) {
    return {
      lat: originalLat,
      lng: originalLng,
      displayName: `${originalLat},${originalLng}`,
      address: {
        street: null, houseNumber: null, housenumber: null,
        city: null, state: null, country: null, countryCode: null, postcode: null
      },
      raw: null
    };
  }

  const props = feature.properties;
  return {
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
    displayName: props.name ||
      [
        props.street ? `${props.street} ${props.housenumber || ''}` : '',
        props.city || props.state || ''
      ].filter(Boolean).join(', '),
    address: {
      street: props.street || null,
      houseNumber: props.housenumber || null,
      housenumber: props.housenumber || null,
      city: props.city || null,
      state: props.state || null,
      country: props.country || null,
      countryCode: props.countrycode?.toUpperCase() || null,
      postcode: props.postcode || null
    },
    raw: feature
  };
};
