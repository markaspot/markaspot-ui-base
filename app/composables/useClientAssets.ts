import { DEFAULT_BRANDING_ASSETS, resolveClientAssetPath } from '@/utils/clientAssetResolver';

/**
 * Composable for resolving client asset paths.
 *
 * Uses the merged clientConfig from useMarkASpotConfig which:
 * 1. Starts with defaults from config/clients/default.ts
 * 2. Merges in jurisdiction-specific overrides from backend
 *
 * This ensures jurisdictions without custom assets fall back to default.ts values.
 */
export const useClientAssets = () => {
    const { clientConfig } = useMarkASpotConfig();

    return {
        logoLight: computed(() => resolveClientAssetPath(clientConfig.value?.theme?.logoLight, DEFAULT_BRANDING_ASSETS.logoLight)),
        logoDark: computed(() => resolveClientAssetPath(clientConfig.value?.theme?.logoDark, DEFAULT_BRANDING_ASSETS.logoDark)),
        favicon: computed(() => resolveClientAssetPath(clientConfig.value?.theme?.favicon, DEFAULT_BRANDING_ASSETS.favicon)),
        pwaIcon: computed(() => {
            const pwaPath = clientConfig.value?.theme?.pwaIcon;
            const logoFallback = clientConfig.value?.theme?.logoDark || clientConfig.value?.theme?.logoLight;
            return resolveClientAssetPath(pwaPath || logoFallback, DEFAULT_BRANDING_ASSETS.icon512);
        }),
        ogImage: computed(() => resolveClientAssetPath(clientConfig.value?.theme?.ogImage, '/images/og-image.webp')),
        appleTouchIcon: computed(() => {
            const pwaPath = clientConfig.value?.theme?.pwaIcon;
            const logoFallback = clientConfig.value?.theme?.logoDark;
            return resolveClientAssetPath(pwaPath || logoFallback, DEFAULT_BRANDING_ASSETS.icon512);
        }),
        icons: computed(() => ({
            192: resolveClientAssetPath(clientConfig.value?.theme?.icons?.[192], DEFAULT_BRANDING_ASSETS.icon192),
            512: resolveClientAssetPath(clientConfig.value?.theme?.icons?.[512], DEFAULT_BRANDING_ASSETS.icon512)
        }))
    };
};
