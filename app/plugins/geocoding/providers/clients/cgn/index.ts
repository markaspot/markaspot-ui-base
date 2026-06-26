// Client-specific geocoding providers for Cologne (cgn)
import { createCologneProvider } from './cologne';
import type { GeocodingProvider } from '../../types';

/**
 * Provider factories for client-specific geocoding providers
 *
 * These factories are registered dynamically based on the client configuration,
 * allowing custom providers without modifying the core provider index.
 */
export const providerFactories: Record<string, () => Promise<GeocodingProvider>> = {
    cologne: async () => {
        // The Cologne provider uses the /api/geocoder Nuxt proxy endpoint
        // which proxies to the Drupal backend's custom geocoder library
        return createCologneProvider();
    }
};
