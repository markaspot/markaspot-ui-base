// composables/useMapStyles.ts
import type { Map, ErrorEvent as MapLibreErrorEvent } from 'maplibre-gl';
import { useRuntimeConfig } from '#app';
import { useColorMode } from '#imports';
import type { MapStyleCandidate, MapStyleServiceType } from '@/utils/mapStyleFallbacks';
import { getThemedMapStyleCandidates } from '@/utils/mapStyleFallbacks';

/**
 * MapStyles Composable
 *
 * Provides configurable 2-tier fallback map styles functionality for the application.
 *
 * @returns Reactive state and methods for mapstyles functionality
 */

/**
 * Full Drupal map settings shape consumed by useFallback and attribution helpers.
 * The four style-URL fields are also typed in MapStyleSettings from mapStyleFallbacks.ts
 * (used by getThemedMapStyleCandidates); this interface covers the extra attribution
 * and API-key fields that only live in the composable layer.
 */
interface FullMapSettings {
    mapbox_style: string
    mapbox_style_dark: string
    fallback_style: string
    fallback_style_dark: string
    fallback_api_key: string
    fallback_attribution: string
    osm_custom_attribution: string
}

export const useMapStyles = () => {
    const config = useRuntimeConfig();
    const colorMode = useColorMode();

    // Use colorMode directly instead of useTheme
    const isDark = computed(() => colorMode.value === 'dark');

    // Define service types
    type ServiceType = MapStyleServiceType | 'failed';

    // Attribution configuration for each service
    const getAttributionForService = (serviceType: ServiceType, mapSettings?: Partial<FullMapSettings>): string => {
        switch (serviceType) {
            case 'primary':
                // Use custom OSM attribution if available, otherwise default attribution
                if (mapSettings?.osm_custom_attribution) {
                    return mapSettings.osm_custom_attribution;
                }
                return '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
            case 'fallback':
                // Use configured fallback attribution, otherwise default MapTiler attribution
                if (mapSettings?.fallback_attribution) {
                    return mapSettings.fallback_attribution;
                }
                return '© <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap contributors</a>';
            case 'failed':
            default:
                return '© <a href="http://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>';
        }
    };

    // Inject API key into a style URL only when a `key` param is not already present.
    // Uses the URL API (like stripCacheBust) so existing params are parsed correctly
    // and a pre-keyed URL (e.g., admin-pasted MapTiler URL) is left unchanged.
    const injectApiKey = (styleUrl: string, apiKey: string): string => {
        if (!apiKey || !styleUrl) return styleUrl;
        try {
            const parsed = new URL(styleUrl);
            if (parsed.searchParams.has('key')) return styleUrl; // already keyed
            parsed.searchParams.set('key', apiKey);
            return parsed.toString();
        } catch {
            // Unparseable URL — fall back to simple append (original behaviour)
            const separator = styleUrl.includes('?') ? '&' : '?';
            return `${styleUrl}${separator}key=${apiKey}`;
        }
    };

    const stripCacheBust = (styleUrl: string): string => {
        try {
            const parsedUrl = new URL(styleUrl);
            parsedUrl.searchParams.delete('_');
            return parsedUrl.toString();
        } catch {
            return styleUrl;
        }
    };

    const resolveServiceType = (
        styleUrl: string,
        candidates: MapStyleCandidate[]
    ): MapStyleServiceType => {
        const normalizedStyle = stripCacheBust(styleUrl);
        return candidates.find(candidate => stripCacheBust(candidate.styleUrl) === normalizedStyle)?.serviceType || 'primary';
    };

    // Function to load a map style with proper error handling and timeout
    const loadMapStyle = async (mapInstance: Map, styleUrl: string, timeoutMs: number = 10000): Promise<boolean> => {
        return new Promise((resolve) => {
            let settled = false;
            const settle = (value: boolean) => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(value);
            };

            const onTimeout = () => {
                if (import.meta.dev) {
                    console.warn(`Style load timeout after ${timeoutMs}ms:`, styleUrl);
                }
                settle(false);
            };

            // Set timeout for style loading
            const timeoutId = setTimeout(onTimeout, timeoutMs);

            const cleanup = () => {
                mapInstance.off('style.load', onStyleLoad);
                mapInstance.off('error', onStyleError);
                clearTimeout(timeoutId);
            };

            const onStyleLoad = () => {
                settle(true);
            };

            const onStyleError = (error: MapLibreErrorEvent) => {
                // MapLibre emits the generic 'error' event for tile-parse failures
                // (e.g. 'unknown feature value', 'Unimplemented type') that are
                // unrelated to style loading. These would otherwise cause useFallback
                // to advance to the next (lower-quality) candidate even though the
                // style actually loaded. Mirror the same filter used in Map.vue's
                // maplibreErrorHandler: treat only style/sprite/glyph/source
                // load failures as real style errors.
                if (settled) return; // promise already resolved (e.g., by timeout)
                // Some error events carry a top-level `message` not typed in MapLibreErrorEvent.
                const message: string = error?.error?.message || (error as MapLibreErrorEvent & { message?: string }).message || '';
                const isBenignTileError =
                    message.includes('unknown feature value') ||
                    message.includes('Unimplemented type') ||
                    message.includes('Could not parse tile');
                if (isBenignTileError) {
                    // Do NOT resolve — keep waiting for style.load or timeout.
                    // Re-register once() so we still catch a genuine error later.
                    mapInstance.once('error', onStyleError);
                    return;
                }
                if (import.meta.dev) {
                    console.warn('Style error event:', error);
                }
                settle(false);
            };

            mapInstance.once('style.load', onStyleLoad);
            mapInstance.once('error', onStyleError);

            try {
                mapInstance.setStyle(styleUrl);
            } catch (error) {
                console.error('Error setting style:', error);
                settle(false);
            }
        });
    };

    // Main configurable fallback function.
    // Accepts Partial<FullMapSettings> because callers pass MarkASpotConfig whose
    // style fields are optional strings; the function guards all field accesses internally.
    const useFallback = async (
        mapInstance: Map,
        mapSettings: Partial<FullMapSettings>,
        options: {
            preferredStyleUrl?: string
        } = {}
    ): Promise<{ success: boolean, serviceType: ServiceType, attribution: string }> => {
        // Get theme state directly from colorMode
        const isCurrentlyDark = colorMode.value === 'dark';

        const candidates = getThemedMapStyleCandidates(mapSettings, isCurrentlyDark);
        const orderedCandidates = [...candidates];
        if (options.preferredStyleUrl) {
            orderedCandidates.unshift({
                styleUrl: options.preferredStyleUrl,
                serviceType: resolveServiceType(options.preferredStyleUrl, candidates)
            });
        }

        for (const candidate of orderedCandidates) {
            const styleUrl = candidate.serviceType === 'fallback' && mapSettings.fallback_api_key
                ? injectApiKey(candidate.styleUrl, mapSettings.fallback_api_key)
                : candidate.styleUrl;

            try {
                const styleLoaded = await loadMapStyle(mapInstance, styleUrl);
                if (styleLoaded) {
                    return {
                        success: true,
                        serviceType: candidate.serviceType,
                        attribution: getAttributionForService(candidate.serviceType, mapSettings)
                    };
                }
                console.warn(`${candidate.serviceType} style failed, attempting next style...`);
            } catch (error) {
                console.warn(`Error loading ${candidate.serviceType} style:`, error);
            }
        }

        // All configured services failed
        return {
            success: false,
            serviceType: 'failed',
            attribution: getAttributionForService('failed', mapSettings)
        };
    };

    return {
        useFallback,
        getAttributionForService,
        isDark
    };
};
