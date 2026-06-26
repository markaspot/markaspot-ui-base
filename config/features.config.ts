import type { ClientConfig } from '~~/types/clientConfig';

/**
 * Extract and process feature flags for compile-time optimization
 */
export function createFeatureDefines(clientConfig: ClientConfig): Record<string, string> {
    // Features that should not be compile-time flags (they're runtime configurable)
    const excludedFeatureKeys = new Set([
        'media',
        'categories',
        'navigation',
        'map',
        'geocoding',
        'boundaries',
        'categoryDescriptions'
    ]);

    const featureDefines = Object.entries(clientConfig.features ?? {})
        .filter(([key]) => !excludedFeatureKeys.has(key))
        .reduce((acc, [key, value]) => {
            // Flatten objects that have an `enabled` sub-flag
            const raw = typeof value === 'object' ? (value as any).enabled : value;
            const flag = `__FEATURE_${key.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}__`;
            acc[flag] = JSON.stringify(Boolean(raw));
            return acc;
        }, {} as Record<string, string>);

    return featureDefines;
}

/**
 * Get runtime feature configuration for client-side access
 *
 * aiAnalysis is intentionally absent here — it is read at runtime via
 * useFeatureFlags().aiAnalysisEnabled so the per-jurisdiction config
 * from field_nuxt_config is the single source of truth. See
 * markaspot-ui#322 and #323 Phase 1.
 */
export function getRuntimeFeatures(clientConfig: ClientConfig) {
    return {
        feedback: Boolean(clientConfig.features?.feedback),
        photoReporting: Boolean(clientConfig.features?.photoReporting),
        statistics: Boolean(clientConfig.features?.statistics),
        oktoberfest: Boolean(clientConfig.features?.oktoberfest),
        party: Boolean(clientConfig.features?.party),
        objectId: Boolean(clientConfig.features?.objectId)
    };
}

/**
 * Log feature configuration for debugging
 */
export function logFeatureConfig(featureDefines: Record<string, string>, isDev: boolean) {
    if (isDev) {
        // Log feature configuration in development mode
    }
}
