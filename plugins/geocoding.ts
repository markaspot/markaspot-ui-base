
import { defineNuxtPlugin } from "#app";
import clientConfig from "../config/clients";
import { createPhotonProvider, createMapboxProvider, createProxyProvider } from './geocoding/providers';
import type { GeocodingProvider } from './geocoding/types';
import { useRuntimeConfig } from '#app/nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  const providers = new Map<string, GeocodingProvider>();
  const runtimeConfig = useRuntimeConfig();

  
  const geocoding = clientConfig.features?.geocoding;
  console.debug('Geocoding config:', {
    providers: geocoding?.providers,
    default: geocoding?.default
  });

  
  const baseUrl = runtimeConfig.public.apiBase || '';
  
  // Always initialize direct providers first (for better performance and proper security)
  if (geocoding?.providers?.includes('mapbox')) {
    const mapboxKey = runtimeConfig.public.mapboxKey;
    console.debug('Mapbox key from runtime config:', !!mapboxKey);

    if (mapboxKey) {
      console.debug('Initializing direct Mapbox provider');
      try {
        
        
        const mapboxProvider = createMapboxProvider(mapboxKey);
        providers.set('mapbox', mapboxProvider);
        console.debug('Mapbox provider initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Mapbox:', error);
      }
    } else {
      console.warn('No Mapbox key found in runtime config');
    }
  }
  
  
  providers.set('photon', createPhotonProvider());
  console.debug('Added Photon direct provider');

  
  const useProxy = runtimeConfig.public.useProxy !== false;
  if (useProxy && baseUrl) {
    console.debug('Initializing proxy provider for geocoding as fallback');
    
    try {
      
      
      const defaultProvider = geocoding?.default || 'photon';
      const proxyProvider = createProxyProvider(baseUrl, defaultProvider);
      providers.set('proxy', proxyProvider);
      console.debug('Proxy provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize proxy provider:', error);
    }
  }

  
  const preferredProvider = geocoding?.default || 'mapbox';
  const providerName = providers.has(preferredProvider) ? preferredProvider : 
                      (providers.has('mapbox') ? 'mapbox' : 
                      (providers.has('photon') ? 'photon' : 'proxy'));
  const currentProvider = providers.get(providerName) || providers.get('photon')!;
  
  console.debug('Provider details:', {
    available: Array.from(providers.keys()),
    default: geocoding?.default,
    selected: currentProvider.name,
    usingProxy: currentProvider.name === 'proxy'
  });

  return {
    provide: {
      geocoding: {
        getProvider: () => currentProvider,
        search: (query: string, options?: any) => currentProvider.geocode(query, options),
        reverse: (lat: number, lng: number) => currentProvider.reverseGeocode(lat, lng)
      }
    }
  };
});
