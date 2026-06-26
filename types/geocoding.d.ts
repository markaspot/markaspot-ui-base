// types/geocoding.d.ts
import type { GeocodingProvider, GeocodingResult, GeocodingOptions } from '~/plugins/geocoding/providers/types';

/**
 * Geocoding plugin API
 */
export interface GeocodingPlugin {
    getProvider: () => GeocodingProvider
    search: (query: string, options?: GeocodingOptions) => Promise<GeocodingResult[]>
    reverse: (lat: number, lng: number) => Promise<GeocodingResult>
}

declare module '#app' {
    interface NuxtApp {
        $geocoding: GeocodingPlugin
    }
}

export {};
