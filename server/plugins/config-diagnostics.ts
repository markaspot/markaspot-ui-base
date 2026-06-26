/**
 * API Configuration Diagnostics Plugin
 *
 * Runs at server startup to validate the API configuration and log the
 * deployment mode. Catches common misconfigurations:
 *
 * 1. Missing NUXT_PUBLIC_API_BASE (falls back to built-in default)
 * 2. Relative apiBase that would cause self-referencing proxy loops
 * 3. SaaS vs Multisite mode detection
 *
 * Deployment modes:
 * - SaaS: One Drupal, one Nuxt, jurisdictions via URL paths (/rotterdam/, /amsterdam/)
 * - Multisite: Multiple Drupal sites, one Nuxt, X-Forwarded-Host routing
 *
 * In both modes, NUXT_PUBLIC_API_BASE must be an absolute URL pointing to
 * the Drupal backend. Nuxt overrides runtimeConfig.public.apiBase at runtime
 * when NUXT_PUBLIC_API_BASE is set as an environment variable.
 *
 * Uses consola instead of console.log because Nitro's esbuild config
 * strips console.* calls in production builds (see nuxt.config.ts nitro.esbuild).
 */
import { consola } from 'consola';

const KNOWN_DEFAULTS = [
    'https://api.mark-a-spot.org'
];

export default defineNitroPlugin(() => {
    const config = useRuntimeConfig();
    const apiBase = String(config.public.apiBase || '');
    const geoReportApiBase = config.public.geoReportApiBase
        ? String(config.public.geoReportApiBase)
        : '';
    // jurisdictionId moved to server-only runtimeConfig (not public).
    // Access it directly from the top-level config object.
    const jurisdictionId = (config as Record<string, unknown>).jurisdictionId
        ? String((config as Record<string, unknown>).jurisdictionId)
        : '';
    const isProduction = process.env.NODE_ENV === 'production';
    const isRelative = !apiBase.startsWith('http');
    const isDefault = KNOWN_DEFAULTS.includes(apiBase);

    // Detect deployment mode
    const mode = jurisdictionId
        ? 'fixed jurisdiction (single-tenant)'
        : 'dynamic jurisdiction (SaaS or multisite)';

    const lines = [
        `Environment:     ${isProduction ? 'production' : 'development'}`,
        `API Base:        ${apiBase}`,
        ...(geoReportApiBase ? [`GeoReport Base:  ${geoReportApiBase}`] : []),
        `Jurisdiction:    ${jurisdictionId || '(auto-detect from API)'}`,
        `Mode:            ${mode}`
    ];

    consola.box({
        title: 'Mark-a-Spot API Configuration',
        message: lines.join('\n'),
        style: { borderColor: 'cyan' }
    });

    if (isRelative) {
        consola.warn(
            `apiBase is relative ("${apiBase}"). ` +
            'The proxy will target the incoming request host, causing self-referencing loops.\n' +
            'Fix: Set NUXT_API_BASE or NUXT_PUBLIC_API_BASE to your Drupal backend URL.\n' +
            'Example: NUXT_API_BASE=https://cms.example.com'
        );
    } else if (isDefault && isProduction) {
        consola.warn(
            `apiBase is the built-in default (${apiBase}). ` +
            'Override with NUXT_API_BASE or NUXT_PUBLIC_API_BASE for your environment.'
        );
    }

    if (geoReportApiBase && geoReportApiBase !== apiBase) {
        consola.info(
            `GeoReport Base differs from API Base. ` +
            `GeoReport requests route to: ${geoReportApiBase}`
        );
    }
});
