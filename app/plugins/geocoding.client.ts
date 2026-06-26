// plugins/geocoding.ts
import { createPhotonProvider, createMapboxProvider, createProxyProvider } from './geocoding/providers';
import type { GeocodingProvider } from './geocoding/providers/types';
import { isCoverageError } from './geocoding/providers/errors';
import { defineNuxtPlugin } from '#app';
import { useRuntimeConfig } from '#app/nuxt';
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';

/**
 * Geocoding Plugin
 *
 * Plugin for geocoding functionality.
 *
 * Nuxt plugin for application-wide functionality.
 */

// Provider factory registry - maps provider names to their factory functions
const providerFactories = new Map<string, () => Promise<GeocodingProvider>>();

// Vite-compatible: Pre-discover all client provider modules at build time
// This ensures dynamic imports work in production builds
const clientProviderModules = import.meta.glob<{ providerFactories?: Record<string, () => Promise<GeocodingProvider>> }>(
    './geocoding/providers/clients/*/index.ts'
);

// Register client-specific provider factories
async function registerClientProviders(client: string) {
    const modulePath = `./geocoding/providers/clients/${client}/index.ts`;

    // Check if module exists for this client
    if (!clientProviderModules[modulePath]) {
        console.debug(`No client-specific providers found for ${client}`);
        return;
    }

    try {
        // Load the client-specific provider module
        const clientProviders = await clientProviderModules[modulePath]();

        // Register each provider factory from the client module
        if (clientProviders.providerFactories) {
            for (const [name, factory] of Object.entries(clientProviders.providerFactories)) {
                providerFactories.set(name, factory as () => Promise<GeocodingProvider>);
                console.debug(`Registered client-specific provider: ${name}`);
            }
        }
    } catch (error) {
        console.debug(`Failed to load providers for ${client}:`, error);
    }
}

export default defineNuxtPlugin(async (nuxtApp) => {
    const providers = new Map<string, GeocodingProvider>();
    const runtimeConfig = useRuntimeConfig();
    const { clientConfig } = useMarkASpotConfig();

    // Get geocoding configuration from runtime config composable
    const geocoding = clientConfig.value.features?.geocoding;
    const client = runtimeConfig.public.client || 'default';

    console.debug('Geocoding config:', {
        client,
        providers: geocoding?.providers,
        default: geocoding?.default
    });

    // Get base URL
    const baseUrl = runtimeConfig.public.apiBase || '';

    // Register client-specific providers first
    await registerClientProviders(client);

    // Always initialize direct providers first (for better performance and proper security)

    // Initialize any client-specific providers
    if (geocoding?.providers) {
        for (const providerName of geocoding.providers) {
            // Check if this is a client-specific provider
            if (providerFactories.has(providerName)) {
                console.debug(`Initializing client-specific provider: ${providerName}`);
                try {
                    const factory = providerFactories.get(providerName)!;
                    const provider = await factory();
                    providers.set(providerName, provider);
                    console.debug(`${providerName} provider initialized successfully`);
                } catch (error) {
                    console.error(`Failed to initialize ${providerName} provider:`, error);
                }
            }
        }
    }

    if (geocoding?.providers?.includes('mapbox')) {
        const mapboxKey = runtimeConfig.public.mapboxKey;
        console.debug('Mapbox key from runtime config:', !!mapboxKey);

        if (mapboxKey) {
            console.debug('Initializing direct Mapbox provider');
            try {
                // Create a direct Mapbox provider that uses client-side requests
                // This relies on Mapbox domain restrictions for security
                const mapboxProvider = createMapboxProvider(mapboxKey as string);
                providers.set('mapbox', mapboxProvider);
                console.debug('Mapbox provider initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Mapbox:', error);
            }
        } else {
            console.warn('No Mapbox key found in runtime config');
        }
    }

    // Initialize Photon as a fallback direct provider
    providers.set('photon', createPhotonProvider());
    console.debug('Added Photon direct provider');

    // Initialize proxy provider as last resort fallback
    const useProxy = runtimeConfig.public.useProxy !== false;
    if (useProxy && baseUrl) {
        console.debug('Initializing proxy provider for geocoding as fallback');

        try {
            // Create a proxy provider that will handle geocoding requests via server
            // This is used as a fallback if direct providers fail
            const defaultProvider = geocoding?.default || 'photon';
            const proxyProvider = createProxyProvider(baseUrl, defaultProvider);
            providers.set('proxy', proxyProvider);
            console.debug('Proxy provider initialized successfully');
        } catch (error) {
            console.error('Failed to initialize proxy provider:', error);
        }
    }

    // Get the default provider - use config order, fall back to first available
    const preferredProvider = geocoding?.default;
    const providerName = (preferredProvider && providers.has(preferredProvider))
        ? preferredProvider
        : (geocoding?.providers?.find(name => providers.has(name)) ?? Array.from(providers.keys())[0]);
    const currentProvider = providers.get(providerName!)!;

    console.debug('Provider details:', {
        available: Array.from(providers.keys()),
        default: geocoding?.default,
        selected: currentProvider.name,
        usingProxy: currentProvider.name === 'proxy'
    });

    // Create fallback chain for search
    const searchWithFallback = async (query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> => {
        // Try primary provider (cologne)
        try {
            const results = await currentProvider.geocode(query, options);

            // GUARANTEE: Always return array
            if (!results || !Array.isArray(results)) {
                return [];
            }

            // If results are empty and we have Cologne as primary, try Photon fallback
            if (results.length === 0 && currentProvider.name === 'cologne') {
                console.debug('[Geocoding] Cologne returned empty results, trying Photon fallback');
                const photonProvider = providers.get('photon');
                if (photonProvider) {
                    const fallbackResults = await photonProvider.geocode(query, options);
                    console.debug('[Geocoding] Photon fallback returned:', fallbackResults?.length || 0, 'results');
                    return Array.isArray(fallbackResults) ? fallbackResults : [];
                }
            }

            return results;
        } catch (error) {
            console.error('[Geocoding] Primary provider failed:', error);

            // Try Photon as fallback on error
            const photonProvider = providers.get('photon');
            if (photonProvider && currentProvider.name !== 'photon') {
                console.debug('[Geocoding] Trying Photon fallback after error');
                try {
                    const fallbackResults = await photonProvider.geocode(query, options);
                    return Array.isArray(fallbackResults) ? fallbackResults : [];
                } catch (fallbackError) {
                    // GUARANTEE: Even on error, return empty array instead of throwing
                    return [];
                }
            }

            // GUARANTEE: Even on error, return empty array instead of throwing
            return [];
        }
    };

    // Create fallback chain for reverse geocoding
    const reverseWithFallback = async (lat: number, lng: number): Promise<GeocodingResult> => {
        // Try primary provider (cologne)
        try {
            const result = await currentProvider.reverseGeocode(lat, lng);

            // If no result and we have Cologne as primary, try Photon fallback
            if (!result && currentProvider.name === 'cologne') {
                console.debug('[Geocoding] Cologne reverse returned null, trying Photon fallback');
                const photonProvider = providers.get('photon');
                if (photonProvider) {
                    return await photonProvider.reverseGeocode(lat, lng);
                }
            }

            return result;
        } catch (error) {
            // Try Photon as fallback on error
            const photonProvider = providers.get('photon');

            if (photonProvider && currentProvider.name !== 'photon') {
                // Silent fallback for expected coverage errors
                if (!isCoverageError(error)) {
                    console.debug(`[Geocoding] ${currentProvider.name} reverse failed, trying Photon fallback`);
                }

                try {
                    return await photonProvider.reverseGeocode(lat, lng);
                } catch (fallbackError) {
                    // Only log if original error was unexpected
                    if (!isCoverageError(error)) {
                        console.error('[Geocoding] Photon reverse fallback also failed:', fallbackError);
                    }
                    throw fallbackError;
                }
            }

            // No fallback available or already using fallback provider
            throw error;
        }
    };

    // Provide geocoding API to the Nuxt app
    // Provide geocoding service to components via nuxtApp.$geocoding
    return {
        provide: {
            geocoding: {
                getProvider: () => currentProvider,
                search: searchWithFallback,
                reverse: reverseWithFallback
            }
        }
    };
});
