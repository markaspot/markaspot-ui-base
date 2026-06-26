import type { GeocodingResult } from '~/plugins/geocoding/providers/types';

const HOUSE_NUMBER_PATTERN = /(^|[\s,])\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?($|[\s,])/u;
const ADMINISTRATIVE_TYPES = new Set([
    'country',
    'region',
    'postcode',
    'district',
    'place',
    'locality',
    'neighborhood'
]);
const STREET_TYPES = new Set([
    'address',
    'street',
    'road',
    'residential',
    'living_street',
    'service',
    'unclassified',
    'primary',
    'secondary',
    'tertiary'
]);

const rawFeatureTypes = (raw: unknown): string[] => {
    if (!raw || typeof raw !== 'object') return [];

    const maybeRaw = raw as {
        place_type?: unknown
        type?: unknown
        class?: unknown
        properties?: { type?: unknown, osm_value?: unknown }
    };
    const rawTypes = [
        ...(Array.isArray(maybeRaw.place_type) ? maybeRaw.place_type : []),
        maybeRaw.type,
        maybeRaw.class,
        maybeRaw.properties?.type,
        maybeRaw.properties?.osm_value
    ];

    return rawTypes
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.toLowerCase());
};

export const isStreetOnlyQuery = (query: string): boolean => {
    const normalized = query.trim();
    if (!normalized) return false;
    if (normalized.includes(',') || normalized.includes(';')) return false;
    return !HOUSE_NUMBER_PATTERN.test(normalized);
};

export const isStreetLikeGeocodingResult = (result: GeocodingResult): boolean => {
    const types = rawFeatureTypes(result.raw);

    if (types.some(type => STREET_TYPES.has(type))) {
        return true;
    }

    if (types.some(type => ADMINISTRATIVE_TYPES.has(type))) {
        return false;
    }

    if (types.length > 0) {
        return false;
    }

    return !result.raw && Boolean(result.address?.street);
};

export const shouldKeepGeocodingSuggestion = (
    query: string,
    result: GeocodingResult
): boolean => {
    if (result.address?.postcode) return true;
    return isStreetOnlyQuery(query) && isStreetLikeGeocodingResult(result);
};
