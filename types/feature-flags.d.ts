declare const __FEATURE_GEO_LOCATION__: boolean;
declare const __FEATURE_UPLOAD_LIMIT__: boolean;
declare const __FEATURE_FEEDBACK__: boolean;
declare const __FEATURE_OKTOBERFEST__: boolean;
declare const __FEATURE_PARTY__: boolean;
declare const __FEATURE_OBJECT_ID__: boolean;

// Global type aliases for convenience
declare type CSSProperties = import('vue').CSSProperties;
declare type BoundsType = import('./index').BoundsType;
// Note: Report is NOT declared globally because it conflicts with browser's Reporting API.
// Components must import Report explicitly: import type { Report } from '~~/types';
declare type StatusNote = import('./index').StatusNote;
declare type Marker = import('./index').Marker;
declare type DrupalJsonApiResponse<T = Record<string, unknown>> = import('./api').DrupalJsonApiResponse<T>;
declare type DrupalPage = import('./index').DrupalPage;
declare type PagesResponse = import('./index').PagesResponse;
declare type GeocodingResult = import('./index').GeocodingResult;
declare type GeocodingProvider = import('./index').GeocodingProvider;
declare type GeocodingOptions = import('./index').GeocodingOptions;
