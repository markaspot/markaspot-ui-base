import { URL } from 'url';
import { logGeocoding } from '../utils/logger';
import type { MapboxFeature, MapboxResponse, MapboxContextItem, GeocodingResult } from '../../types/proxy';

interface MapboxOptions {
  query?: string;
  lat?: number;
  lng?: number;
  limit?: string;
  language?: string;
  bbox?: string;
  types?: string;
  autocomplete?: string;
  country?: string;
  proximity?: string;
}

const DEFAULT_MAPBOX_FORWARD_TYPES = 'address,place,poi,neighborhood';
const DEFAULT_MAPBOX_REVERSE_TYPES = 'address,place,poi,neighborhood';
const ALLOWED_MAPBOX_FORWARD_TYPES = new Set([
  'address',
  'country',
  'district',
  'locality',
  'neighborhood',
  'place',
  'poi',
  'postcode',
  'region'
]);

const normalizeBooleanParam = (value?: string): 'true' | 'false' | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'true' || normalized === 'false') return normalized;
  return undefined;
};

const normalizeLimitParam = (value?: string): string | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return String(Math.min(parsed, 10));
};

const normalizeBboxParam = (value?: string): string | undefined => {
  if (!value) return undefined;
  const parts = value.split(',').map(part => Number.parseFloat(part.trim()));
  if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) return undefined;

  const [minLng, minLat, maxLng, maxLat] = parts;
  if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) return undefined;
  if (minLng >= maxLng || minLat >= maxLat) return undefined;

  return parts.join(',');
};

const normalizeTypesParam = (value?: string): string | undefined => {
  if (!value) return undefined;
  const types = value
    .split(',')
    .map(type => type.trim().toLowerCase())
    .filter(type => ALLOWED_MAPBOX_FORWARD_TYPES.has(type));

  return types.length ? Array.from(new Set(types)).join(',') : undefined;
};

/**
 * Create a Mapbox search URL
 */
export const createMapboxSearchUrl = (
  query: string,
  apiKey: string,
  options: MapboxOptions = {}
): URL => {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.append('access_token', apiKey);

  logGeocoding('Building Mapbox URL - starting with:', { url: url.toString() });

  const limit = normalizeLimitParam(options.limit);
  if (limit) url.searchParams.append('limit', limit);
  if (options.language) url.searchParams.append('language', options.language);
  const bbox = normalizeBboxParam(options.bbox);
  if (bbox) url.searchParams.append('bbox', bbox);
  const types = normalizeTypesParam(options.types);
  if (types) url.searchParams.append('types', types);
  const autocomplete = normalizeBooleanParam(options.autocomplete);
  if (autocomplete) url.searchParams.append('autocomplete', autocomplete);
  if (options.country) url.searchParams.append('country', options.country);
  if (options.proximity) url.searchParams.append('proximity', options.proximity);

  if (!url.searchParams.has('limit')) url.searchParams.append('limit', '5');
  if (!url.searchParams.has('autocomplete')) url.searchParams.append('autocomplete', 'true');
  if (!url.searchParams.has('types')) url.searchParams.append('types', DEFAULT_MAPBOX_FORWARD_TYPES);

  return url;
};

/**
 * Create a Mapbox reverse geocoding URL
 */
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

  if (!url.searchParams.has('types')) url.searchParams.append('types', DEFAULT_MAPBOX_REVERSE_TYPES);
  url.searchParams.append('reverseMode', 'distance');

  logGeocoding('Final Mapbox reverse geocoding URL', {
    base: url.href.replace(/access_token=([^&]+)/, 'access_token=REDACTED'),
    params: Object.fromEntries([...url.searchParams.entries()].filter(([key]) => key !== 'access_token'))
  });

  return url;
};

/**
 * Extract meaningful address components from Mapbox response context
 */
const extractAddressComponents = (feature: MapboxFeature): Record<string, string> => {
  if (!feature.context || !Array.isArray(feature.context)) {
    return {};
  }

  return feature.context.reduce<Record<string, string>>((acc, item: MapboxContextItem) => {
    if (!item.id || !item.text) return acc;

    const id = item.id.split('.')[0];

    if (id === 'place') acc.city = item.text;
    else if (id === 'region') acc.state = item.text;
    else if (id === 'country') {
      acc.country = item.text;
      if (item.short_code) acc.countryCode = item.short_code.toUpperCase();
    }
    else if (id === 'postcode') acc.postcode = item.text;
    else if (id === 'neighborhood') acc.neighborhood = item.text;
    else if (id === 'district') acc.district = item.text;
    else if (id === 'locality') {
      if (!acc.city) acc.city = item.text;
    }

    return acc;
  }, {});
};

/**
 * Format a display name from feature components
 */
const formatDisplayName = (feature: MapboxFeature, components: Record<string, string>): string => {
  if (feature.place_name) return feature.place_name;

  const parts: string[] = [];

  if (feature.text) {
    if (feature.address) {
      parts.push(`${feature.text} ${feature.address}`);
    } else {
      parts.push(feature.text);
    }
  }

  if (components.city) parts.push(components.city);
  else if (components.neighborhood) parts.push(components.neighborhood);
  else if (components.district) parts.push(components.district);

  if (parts.length === 0) {
    if (components.state) parts.push(components.state);
    if (components.country) parts.push(components.country);
  }

  return parts.join(', ') || 'Unknown location';
};

/**
 * Transform Mapbox search response to standardized format
 */
export const transformMapboxSearchResults = (response: MapboxResponse): GeocodingResult[] => {
  if (!response || !response.features || !Array.isArray(response.features)) {
    logGeocoding('Invalid Mapbox search response:', { response });
    return [];
  }

  logGeocoding(`Found ${response.features.length} Mapbox features`, {});

  return response.features.map(feature => {
    const components = extractAddressComponents(feature);

    return {
      lat: feature.center[1],
      lng: feature.center[0],
      displayName: formatDisplayName(feature, components),
      address: {
        street: feature.text || null,
        houseNumber: feature.address || null,
        housenumber: feature.address || null,
        city: components.city || null,
        state: components.state || null,
        country: components.country || null,
        countryCode: components.countryCode || null,
        postcode: components.postcode || null,
        neighborhood: components.neighborhood || null,
        district: components.district || null
      },
      raw: feature
    };
  });
};

/**
 * Transform Mapbox reverse geocoding response to standardized format
 */
export const transformMapboxReverseResult = (response: MapboxResponse, originalLat: number, originalLng: number): GeocodingResult => {
  if (!response.features || !Array.isArray(response.features) || response.features.length === 0) {
    logGeocoding('No features found in Mapbox reverse geocoding response', { response });

    return {
      lat: originalLat,
      lng: originalLng,
      displayName: `${originalLat.toFixed(6)}, ${originalLng.toFixed(6)}`,
      address: {
        street: null, houseNumber: null, housenumber: null,
        city: null, state: null, country: null, countryCode: null, postcode: null
      },
      raw: null
    };
  }

  const feature = response.features[0];
  logGeocoding('Found Mapbox feature for reverse geocoding', {
    place_name: feature?.place_name,
    type: feature?.place_type?.[0]
  });

  if (!feature) {
    return {
      lat: originalLat,
      lng: originalLng,
      displayName: `${originalLat.toFixed(6)}, ${originalLng.toFixed(6)}`,
      address: {
        street: null, houseNumber: null, housenumber: null,
        city: null, state: null, country: null, countryCode: null, postcode: null
      },
      raw: null
    };
  }

  const components = extractAddressComponents(feature);

  return {
    lat: feature.center[1],
    lng: feature.center[0],
    displayName: formatDisplayName(feature, components),
    address: {
      street: feature.text || null,
      houseNumber: feature.address || null,
      housenumber: feature.address || null,
      city: components.city || null,
      state: components.state || null,
      country: components.country || null,
      countryCode: components.countryCode || null,
      postcode: components.postcode || null,
      neighborhood: components.neighborhood || null,
      district: components.district || null
    },
    raw: feature
  };
};
