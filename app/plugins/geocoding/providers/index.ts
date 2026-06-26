// plugins/geocoding/providers/index.ts

/**
 * Default Geocoding Providers
 *
 * Core providers available to all clients.
 * Client-specific providers are loaded dynamically from providers/clients/{client}/
 */

export { createMapboxProvider } from './mapbox';
export { createNominatimProvider } from './nominatim';
export { createPhotonProvider } from './photon';
export { createProxyProvider } from './proxy';
