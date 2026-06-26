/**
 * useMarkASpotConfig - Central configuration composable
 *
 * Fetches all frontend configuration from the backend via /api/mark-a-spot-settings.
 * This enables single-image deployments where all branding, features, and settings
 * come from the Drupal backend (jurisdiction groups).
 *
 * Architecture:
 * 1. Client defaults (config/clients/default.ts) provide base configuration
 * 2. Backend API (/api/mark-a-spot-settings) provides overrides
 * 3. This composable merges both, with backend values taking precedence
 *
 * Migration path:
 * - Replace: import clientConfig from '../../config/clients'
 * - With:    const { clientConfig } = useMarkASpotConfig()
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/63
 */
import type { FeatureCollection } from 'geojson';
import type { ButtonStyleConfig, FacilitiesConfig, SsoConfig } from '../../../types/clientConfig';
import { defu } from 'defu';
import clientConfigDefaults from '../../../config/clients';
import { getCurrentLocale } from '@/utils/locale';
import { getRequestScopedValue } from '@/utils/requestScope';
import { useJurisdictions } from './useJurisdictions';
import { isFastmapMarketingPath } from '../../../fastmap-layer/lib/locale-routing';

// Note: useMarkASpotSettings is NOT imported here to avoid circular dependency
// useMarkASpotSettings now delegates to this composable for data fetching

// ============================================================================
// Type Definitions
// ============================================================================

export interface MasConfigJurisdiction {
    id: number
    name: string
    shortName?: string
    slug?: string | null
    /** Root jurisdiction ID for taxonomy filtering (categories, statuses). Child jurisdictions inherit the root's service catalog. */
    taxonomyJurisdictionId?: number
    /** ISO date string when this demo workspace will be auto-deleted. Present only for demo workspaces. */
    demo_expiry?: string
    /** Unix timestamp when the workspace expires. Present only for demo/trial workspaces. */
    expiry_date?: number
    /** AI analysis budget for the current billing period (SaaS tiers). */
    ai_budget?: {
        /** Monthly AI analysis limit (0 = unlimited on partner/enterprise) */
        limit: number
        /** Number of analyses used this month */
        used: number
        /** Remaining analyses (-1 = unlimited) */
        remaining: number
    }
}

export interface MasConfigClient {
    name: string
    shortName?: string
    tagline?: string
    claim?: string | Record<string, string>
    domain?: string
}

export interface MasConfigTheme {
    primary?: string
    secondary?: string
    neutral?: string
    colors?: {
        primary?: string
        secondary?: string
        neutral?: string
    }
    logoLight?: string
    logoDark?: string
    logos?: {
        light?: string
        dark?: string
    }
    icons?: Record<number | string, string>
    logoHeight?: string
    fonts?: {
        heading?: string
        headingUrl?: string
        body?: string
        bodyUrl?: string
    }
    customCss?: string
    favicon?: string
    pwaIcon?: string
    ogImage?: string
    buttonStyles?: {
        primary?: ButtonStyleConfig
        secondary?: ButtonStyleConfig
    }
}

export interface MasConfigFeatureMedia {
    maxFiles?: number
    maxRawFileSize?: number
    maxOptimizedFileSize?: number
    maxFileSize?: number
    allowedTypes?: string[]
    maxDimensions?: {
        width?: number
        height?: number
    }
    optimize?: {
        maxWidth?: number
        maxHeight?: number
        quality?: number
        format?: string
    }
    proxy?: {
        enabled?: boolean
        pathPrefix?: string
        cacheDuration?: number
    }
}

export interface MasConfigConditionalField {
    categories?: Array<number | string>
    required?: boolean
    component?: string
    label?: string
}

export interface MasConfigFeatureMap {
    loadMarkersOnInit?: boolean
    enableBoundsFiltering?: boolean
    clusterMaxZoom?: number
    deferredMap?: boolean | {
        enabled?: boolean
        preloadData?: boolean
        limit?: number
    }
    layerVisibility?: {
        heatmap?: { minZoom?: number, maxZoom?: number, fadeOut?: boolean }
        clusters?: { minZoom?: number, maxZoom?: number }
        markers?: { minZoom?: number }
    }
    markers?: {
        borderColor?: string
        selectedAnimation?: boolean | {
            enabled?: boolean
            type?: 'bounce' | 'pulse' | 'glow'
        }
        magnitudeScaling?: boolean | {
            enabled?: boolean
            factors?: {
                hazardLevel?: boolean
                age?: boolean
                status?: boolean
            }
            minScale?: number
            maxScale?: number
        }
    }
    clusters?: {
        dominantColor?: boolean
        animateExpand?: boolean | {
            enabled?: boolean
            duration?: number
        }
    }
    controls?: {
        heatmap?: {
            initialState?: boolean
        }
        [key: string]: unknown
    }
    wmsLayers?: Array<{
        id: string
        title: string
        layerName: string
        enabled: boolean
        opacity?: number
        minZoom?: number
        maxZoom?: number
        legendAlt?: string
        legendUnavailableText?: string
        /** @deprecated Use `visibility` instead. Kept for back-compat: maps to 'authenticated' when true. */
        requireAuth?: boolean
        /**
         * Where this layer may be shown:
         * - 'public'        → citizen map (everyone incl. anonymous) + dashboard
         * - 'authenticated' → citizen map only when logged in + dashboard
         * - 'staff'         → dashboard only, never on the citizen map
         */
    }>
    [key: string]: unknown
}

export interface MasConfigFilterSettings {
    enabled?: {
        status?: boolean
        category?: boolean
        time?: boolean
        custom?: boolean
    }
    groups?: {
        primary?: string[]
        secondary?: string[]
    }
    behavior?: {
        multiSelect?: boolean
        collapsible?: boolean
        persistent?: boolean
        showClearAll?: boolean
    }
    order?: string[]
    status?: boolean
    category?: boolean
    time?: boolean
    custom?: boolean
}

export interface MasConfigFeatures {
    allowGeoreportPost?: boolean
    media?: MasConfigFeatureMedia
    photoReporting?: boolean
    classicReporting?: boolean
    voting?: boolean
    statistics?: boolean
    following?: boolean
    passwordless?: boolean | { enabled?: boolean }
    aiAnalysis?: boolean
    aiProcessing?: boolean
    piiRedaction?: boolean
    /**
     * AI Duplicate Detection capability flag.
     * Set to true by the backend when markaspot_ai is installed.
     * Gates the Duplicate Review nav, /dashboard/duplicates page,
     * and the SimilarRequestsCard sidebar widget.
     * Distinct from aiAnalysis (markaspot_vision).
     */
    aiDuplicates?: boolean
    /**
     * When true, an active AI privacy warning (no-blur fallback) hard-blocks
     * the report: the "continue with photo" button is hidden and submission is
     * disabled until the citizen replaces the photo. Default false (#473).
     */
    privacyBlockOnFlag?: boolean
    statusAttributes?: boolean | { enabled?: boolean }
    // Intake source / inbound-email channel (#467). Operator-controlled flag set
    // only when the backend ships the `field_source` field (markaspot_mail_inbound).
    intakeSource?: boolean | { enabled?: boolean }
    feedback?: boolean
    pwaInstallPrompt?: boolean | { enabled?: boolean }
    objectId?: boolean
    party?: boolean
    formFirst?: boolean | {
        enabled?: boolean
        mobileLayout?: 'bottomSheet' | 'tabs'
        defaultTab?: 'photo' | 'classic'
        map?: {
            deferLoad?: boolean
            refinementHeight?: string
        }
        collapseOnFocus?: boolean
    }
    dashboard?: boolean | { enabled?: boolean }
    dashboardRequestCreate?: boolean
    operationsDashboard?: boolean
    contactForm?: boolean
    moderation?: boolean | { enabled?: boolean }
    /**
     * Email intake triage inbox (#482). Surfaces the staged inbound-mail inbox
     * in the dashboard. Default off; opt-in per jurisdiction, requires the
     * inbound-mail backend.
     */
    emailIntake?: boolean | { enabled?: boolean }
    organisations?: boolean | { enabled?: boolean }
    serviceProviders?: boolean | { enabled?: boolean }
    oktoberfest?: boolean
    categories?: string[]
    categoryDescriptions?: {
        enabled?: boolean
        endpoint?: string
    }
    emailRequiredCategories?: number[]
    conditionalFields?: Record<string, MasConfigConditionalField | Array<number | string>>
    objectIdCategories?: Array<number | string>
    partyCategories?: Array<number | string>
    oktoberfestCategories?: Array<number | string>
    competitionCategories?: Array<number | string>
    actionButtons?: {
        primaryButton?: 'photo' | 'classic'
        photo?: {
            enabled?: boolean
            label?: string
            priority?: 'primary' | 'secondary'
        }
        classic?: {
            enabled?: boolean
            label?: string
            priority?: 'primary' | 'secondary'
        }
    }
    forms?: {
        allowParentCategorySelection?: boolean
        pickOnMapButton?: boolean
        autoTriggerGeolocation?: boolean
    }
    photoRequiredCategories?: number[]
    // Nested feature configs (can be boolean or object with enabled flag)
    emergency?: boolean | { enabled?: boolean }
    funFacts?: boolean | { enabled?: boolean }
    search?: {
        enabled?: boolean
        mode?: 'fuzzy' | 'exact'
        minLength?: number
        threshold?: number
        fields?: string[]
    }
    boundaries?: {
        enabled?: boolean
        file?: string
        strictValidation?: boolean
        showBoundaryOnMap?: boolean
    }
    privacyNotice?: {
        enabled?: boolean
        modal?: boolean
        nodeId?: number
    }
    analytics?: {
        matomo?: {
            enabled?: boolean
            mode?: 'tracking' | 'tag-manager'
            siteId?: string
            trackerUrl?: string
            containerId?: string
            containerUrl?: string
        }
    }
    // Offline mode - queue reports when offline, sync when back online
    offline?: boolean | {
        enabled?: boolean
        draftRetentionDays?: number
        mediaRetentionHours?: number
        maxRetries?: number
    }
    // Geocoding provider and location bias settings (per jurisdiction)
    geocoding?: {
        providers?: string[]
        default?: 'photon' | 'mapbox' | 'nominatim'
        country?: string
        region?: string
        config?: Record<string, unknown>
    }
    // Map and filters can also be nested under features in the API response
    navigation?: {
        activeTab?: string
        tabs?: Record<string, { enabled?: boolean, weight?: number }>
    }
    map?: MasConfigFeatureMap
    filters?: MasConfigFilterSettings
}

export interface MasConfigMapControl {
    enabled?: boolean
    position?: string
    positionMobile?: string
    weight?: number
}

export interface MasConfigMap {
    center: [number, number]
    zoom: number
    maxBounds?: [[number, number], [number, number]]
    loadMarkersOnInit?: boolean
    enableBoundsFiltering?: boolean
    deferredMap?: boolean | {
        enabled?: boolean
        preloadData?: boolean
        limit?: number
    }
    layers?: {
        heatmap?: { minZoom?: number, maxZoom?: number }
        clusters?: { minZoom?: number, maxZoom?: number }
        markers?: { minZoom?: number }
    }
    layerVisibility?: {
        heatmap?: { minZoom?: number, maxZoom?: number, fadeOut?: boolean }
        clusters?: { minZoom?: number, maxZoom?: number }
        markers?: { minZoom?: number }
    }
    controls?: {
        zoom?: boolean | MasConfigMapControl
        tilt?: boolean | (MasConfigMapControl & {
            options?: { angles?: number[], defaultAngle?: number, expandable?: boolean }
        })
        theme?: boolean | MasConfigMapControl
        geolocation?: boolean | MasConfigMapControl
        heatmap?: boolean | (MasConfigMapControl & { initialState?: boolean })
        reports?: boolean | MasConfigMapControl
        attribution?: boolean | MasConfigMapControl
    }
    // Legacy fields from current API
    mapbox_style?: string
    mapbox_style_dark?: string
    mapbox_token?: string
    fallback_style?: string
    fallback_style_dark?: string
    fallback_api_key?: string
    fallback_attribution?: string
}

export interface MasConfigMedia {
    maxFiles?: number
    maxSize?: number
    allowedTypes?: string[]
}

export interface MasConfigLanguages {
    /** Available locale codes (e.g., ['es', 'en']) */
    available: string[]
    /** Default locale code */
    default: string
    /** Optional: Full locale definitions with custom names */
    locales?: Array<{
        code: string
        name?: string
        iso?: string
    }>
}

export interface MasConfigUi {
    headerHeight?: string
    sidebar?: {
        width?: string
        enabled?: boolean
    }
    bottomSheet?: {
        position?: 'low' | 'medium' | 'high'
        minimumHeight?: number | string
        height?: number | string
        snapPoints?: Array<number | string>
        showHandle?: boolean
        dismissible?: boolean
        overlay?: boolean
        modal?: boolean
        scaleBackground?: boolean
        setBackgroundColorOnScale?: boolean
        autoCollapseOnMapTap?: boolean
        autoCollapseOnMapMove?: boolean
        collapseDebounce?: number
    }
}

export interface MasConfigI18n {
    overrides?: Record<string, Record<string, string>>
}

export interface MasConfigStatus {
    open?: number[]
    closed?: number[]
    mapping?: Record<string, number>
}

export type MasConfigFacilities = FacilitiesConfig;

/**
 * Full configuration response from /api/mark-a-spot-settings
 * Combines existing settings with new jurisdiction-based config
 */
export interface MarkASpotConfig {
    name?: string
    shortName?: string
    domain?: string
    customCss?: string

    // New structured config (from jurisdiction groups)
    jurisdiction?: MasConfigJurisdiction
    client?: MasConfigClient
    theme?: MasConfigTheme & {
        ui?: {
            leftSidebar?: {
                width?: string
            }
        }
    }
    features?: MasConfigFeatures
    ui?: MasConfigUi
    media?: MasConfigMedia
    languages?: MasConfigLanguages
    i18n?: MasConfigI18n
    sso?: SsoConfig
    systemNotice?: {
        message?: string
        color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
    }
    demoMode?: {
        banner?: {
            title?: string
            message?: string
            linkLabel?: string
            linkUrl?: string
        }
        reset?: {
            title?: string
            notice?: string
            countdownLabel?: string
        }
    }
    facilities?: MasConfigFacilities

    // Map and filter settings (existing + enhanced)
    map?: MasConfigMap
    status?: MasConfigStatus
    filters?: MasConfigFilterSettings

    // Embed widget configuration (from field_nuxt_config)
    embed?: {
        variants?: Record<string, Record<string, unknown>>
    }

    // Response visibility (per-jurisdiction, from field_nuxt_config)
    responseVisibility?: {
        showInList?: boolean
        jurisdictionDisplay?: 'leaf' | 'chain'
    }

    dashboard?: {
        columns?: Record<string, boolean>
        createDefaultPublished?: boolean
    }

    // Boundary data (from jurisdiction groups)
    boundary?: FeatureCollection

    // Group type bundle names (auto-detected, supports legacy 'organisation' naming)
    groupTypes?: {
        organisation?: string // 'org' (new) or 'organisation' (legacy)
        jurisdiction?: string // typically 'jur'
    }

    // Operator data for legal pages (TMG §5, from jurisdiction group entity)
    operator?: {
        name?: string
        email?: string
        address?: {
            organization?: string
            address_line1?: string
            locality?: string
            postal_code?: string
            country_code?: string
        }
    }

    // Taxonomy data from Settings API (jurisdiction-filtered)
    services?: Array<{ name: string, tid: number, [key: string]: unknown }>
    statuses?: Array<{ name: string, tid: number, [key: string]: unknown }>
    districts?: Array<{ name: string, tid: number, uuid: string, weight: number }>
    sublocalities?: Array<{ name: string, tid: number, uuid: string, weight: number }>

    // Legacy fields (backward compatibility)
    center_lat?: string | number
    center_lng?: string | number
    zoom_initial?: string | number
    mapbox_style?: string
    mapbox_style_dark?: string
    mapbox_token?: string
    fallback_style?: string
    fallback_style_dark?: string
    fallback_api_key?: string
    fallback_attribution?: string
    osm_custom_attribution?: string
    // Geocoding configuration from Drupal
    geocoding_country?: string
    geocoding_region?: string
    nid_status?: Record<string, number>
    status_open?: number[]
    status_closed?: number[]
}

// ============================================================================
// Composable Implementation
// ============================================================================

interface RequestCache {
    fetchPromise: Promise<void> | null
    mergedConfigCache: { key: string, value: Record<string, any> } | null
}

type ClientConfigShape = MarkASpotConfig;

const clientRequestCache: RequestCache = {
    fetchPromise: null,
    mergedConfigCache: null
};

// ============================================================================
// LocalStorage Cache for Offline Support
// ============================================================================

const CONFIG_STORAGE_KEY = 'masConfig';
const CONFIG_CACHE_VERSION = import.meta.env.APP_VERSION || '1.0.0';
const CONFIG_CACHE_MAX_AGE = 60 * 60 * 1000; // 1 hour

const stableConfigValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(stableConfigValue);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .filter(([, entry]) => entry !== undefined)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, entry]) => [key, stableConfigValue(entry)])
        );
    }
    return value;
};

const hashConfigString = (input: string): string => {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
};

export function buildFacilitiesCacheKey(facilities?: FacilitiesConfig | null): string {
    if (!facilities) return '';
    const items = Array.isArray(facilities.items) ? facilities.items : [];
    const normalized = {
        enabled: facilities.enabled ?? '',
        clusterMinPoints: facilities.clusterMinPoints ?? '',
        hideMapPicker: facilities.hideMapPicker ?? '',
        label: stableConfigValue(facilities.label ?? {}),
        mode: facilities.mode ?? '',
        nearestSnapRadius: facilities.nearestSnapRadius ?? '',
        items: items.map(item => ({
            active: item.active ?? '',
            address: stableConfigValue(item.address ?? ''),
            description: item.description ?? '',
            icon: item.icon ?? '',
            id: item.id ?? '',
            label: item.label ?? '',
            lat: item.lat ?? '',
            lng: item.lng ?? '',
            organisationId: item.organisationId ?? '',
            url: item.url ?? ''
        }))
    };

    return `${items.length}:${hashConfigString(JSON.stringify(normalized))}`;
}

interface CachedConfig {
    data: MarkASpotConfig
    timestamp: number
    version: string
    jurisdictionId: string
}

/**
 * Load cached config from localStorage
 */
function loadConfigFromCache(jurisdictionId: string, isOffline: boolean): MarkASpotConfig | null {
    if (typeof window === 'undefined') return null;

    const storageKey = `${CONFIG_STORAGE_KEY}-${jurisdictionId || 'default'}`;
    const cached = localStorage.getItem(storageKey);
    if (!cached) return null;

    try {
        const parsed: CachedConfig = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;

        // Validate version and age
        if (parsed.version === CONFIG_CACHE_VERSION && age < CONFIG_CACHE_MAX_AGE) {
            console.log(`[MasConfig] Loaded from cache (v${CONFIG_CACHE_VERSION}, ${Math.round(age / 60000)}m old)`);
            return parsed.data;
        }

        // Cache is stale but still usable when offline
        if (isOffline && parsed.data) {
            console.log(`[MasConfig] Using stale cache while offline`);
            return parsed.data;
        }

        const reason = parsed.version !== CONFIG_CACHE_VERSION
            ? `version mismatch (cached: ${parsed.version}, current: ${CONFIG_CACHE_VERSION})`
            : `expired (${Math.round(age / 60000)}m old)`;
        console.log(`[MasConfig] Cache invalidated: ${reason}`);
        return null;
    } catch (e) {
        console.warn('[MasConfig] Failed to parse cache:', e);
        return null;
    }
}

/**
 * Save config to localStorage
 */
function saveConfigToCache(data: MarkASpotConfig, jurisdictionId: string): void {
    if (typeof window === 'undefined') return;

    // Strip API keys before persisting to localStorage (security: no secrets in storage)
    const safeMap = data.map
        ? { ...data.map, mapbox_token: undefined, fallback_api_key: undefined }
        : data.map;
    const safeData: MarkASpotConfig = { ...data, map: safeMap };

    const storageKey = `${CONFIG_STORAGE_KEY}-${jurisdictionId || 'default'}`;
    const cached: CachedConfig = {
        data: safeData,
        timestamp: Date.now(),
        version: CONFIG_CACHE_VERSION,
        jurisdictionId: jurisdictionId || 'default'
    };

    try {
        localStorage.setItem(storageKey, JSON.stringify(cached));
        console.log(`[MasConfig] Saved to cache (v${CONFIG_CACHE_VERSION})`);
    } catch (e: unknown) {
        if ((e as any)?.name === 'QuotaExceededError' || (e as any)?.code === 22) {
            console.warn('[MasConfig] Storage quota exceeded');
        } else {
            console.warn('[MasConfig] Failed to save cache:', e);
        }
    }
}

/**
 * Recursively remove empty strings from an object
 * Used to clean API responses before merging with defaults
 *
 * Empty strings from JSON form widgets would otherwise override
 * meaningful defaults via defu merge. This ensures only explicitly
 * set values override defaults.
 *
 * @param obj - Object to clean
 * @returns New object with empty strings removed (deep)
 */
export function removeEmptyStrings<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => removeEmptyStrings(item)) as T;
    }

    if (typeof obj === 'object') {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            // Skip empty strings
            if (value === '') {
                continue;
            }
            // Recursively clean nested objects
            cleaned[key] = removeEmptyStrings(value);
        }
        return cleaned as T;
    }

    return obj;
}

/**
 * Normalize config to handle legacy fields
 * Exported for use by SSR plugin (01.jurisdiction-ssr.ts)
 */
export function normalizeConfig(raw: MarkASpotConfig): MarkASpotConfig {
    const config = { ...raw };

    // Build map config from legacy fields if not present
    if (!config.map) {
        config.map = {
            center: [
                Number.isFinite(parseFloat(String(raw.center_lng))) ? parseFloat(String(raw.center_lng)) : 0,
                Number.isFinite(parseFloat(String(raw.center_lat))) ? parseFloat(String(raw.center_lat)) : 0
            ],
            zoom: Number.isFinite(parseInt(String(raw.zoom_initial))) ? parseInt(String(raw.zoom_initial)) : 13,
            mapbox_style: raw.mapbox_style,
            mapbox_style_dark: raw.mapbox_style_dark,
            mapbox_token: raw.mapbox_token,
            fallback_style: raw.fallback_style,
            fallback_style_dark: raw.fallback_style_dark,
            fallback_api_key: raw.fallback_api_key,
            fallback_attribution: raw.fallback_attribution
        };
    }

    // Build status config from legacy fields if not present
    if (!config.status) {
        config.status = {
            open: raw.status_open,
            closed: raw.status_closed,
            mapping: raw.nid_status
        };
    }

    // Note: We intentionally do NOT set a default jurisdiction here
    // If no jurisdiction is configured, config.jurisdiction will be undefined
    // This prevents auto-injection of jurisdiction=1 in API calls

    if (!config.features) {
        config.features = {
            photoReporting: true,
            classicReporting: true,
            voting: false,
            statistics: false,
            following: true,
            feedback: true
        };
    }

    if (!config.theme) {
        config.theme = {
            primary: 'blue',
            secondary: 'violet',
            neutral: 'slate'
        };
    }

    return config;
}

/**
 * Central configuration composable for Mark-a-Spot
 *
 * Usage:
 * ```ts
 * const { config, theme, features, hasFeature, isReady } = useMarkASpotConfig()
 *
 * // Check feature
 * if (hasFeature('voting').value) { ... }
 *
 * // Access theme
 * const primaryColor = theme.value?.primary
 * ```
 */
export function useMarkASpotConfig() {
    // Use useState for SSR payload serialization (fixes hydration mismatch)
    const configState = useState<MarkASpotConfig | null>('mas-config-state', () => null);
    const configStatus = useState<'idle' | 'pending' | 'success' | 'error'>('mas-config-status', () => 'idle');
    // Store error message as string (Error objects can't be serialized for SSR payload)
    const configError = useState<string | null>('mas-config-error', () => null);
    // Track which jurisdiction the config was fetched for (detects stale config on navigation)
    const configJurisdictionKey = useState<string>('mas-config-jurisdiction-key', () => '');

    const runtimeConfig = useRuntimeConfig();
    const router = useRouter();
    const {
        currentJurisdiction,
        defaultJurisdiction,
        getBySlug: getJurisdictionBySlug,
        getById: getJurisdictionById
    } = useJurisdictions();
    const { isOnline } = useOnlineStatus();

    const isClient = typeof window !== 'undefined';
    const requestEvent = import.meta.server ? useRequestEvent() : null;
    const getRequestCache = (): RequestCache => getRequestScopedValue({
        event: requestEvent,
        key: '__masConfigRequestCache',
        create: () => ({ fetchPromise: null, mergedConfigCache: null }),
        clientValue: clientRequestCache
    });

    /**
   * Get jurisdiction ID or slug with priority:
   * 1. URL query parameter ?jurisdiction=X (explicit switch, highest priority)
   * 2. Route slug from [[jurisdiction]] path segment
   * 3. Environment variable NUXT_PUBLIC_JURISDICTION_ID
   * 4. Default jurisdiction (first or isDefault from backend)
   * 5. Empty string (no jurisdiction-specific config)
   *
   * Note: Backend API accepts both ID and slug for jurisdiction parameter
   */
    const getJurisdictionIdOrSlug = (routeOverride?: { query?: Partial<Record<string, string | string[]>>, params?: Partial<Record<string, string | string[]>> }): string => {
    // Use provided route (e.g. middleware's `to`) or fall back to the
    // setup-bound router. This avoids calling Nuxt composables from later
    // computed/watch flushes.
        const route = routeOverride ?? router.currentRoute.value;
        // 1. Explicit query param override: ?jurisdiction=5
        //    Highest priority because it's an intentional switch
        if (route.query.jurisdiction) {
            const queryJurisdiction = String(route.query.jurisdiction);
            if (import.meta.dev) {
                console.log(`[MasConfig] Using query param jurisdiction: ${queryJurisdiction}`);
            }
            return queryJurisdiction;
        }

        // 2. Route slug from [[jurisdiction]] path segment (e.g., /Rotterdam/)
        // Always pass slug directly (Settings API accepts both slugs and numeric IDs)
        // Skip slugs that are actually fastmap marketing routes (e.g. "start", "embed")
        // matched by [[jurisdiction]] catch-all but not real jurisdictions.
        const urlSlug = route.params.jurisdiction as string | undefined;
        if (urlSlug && !isFastmapMarketingPath(`/${urlSlug}`)) {
            if (import.meta.dev) {
                console.log(`[MasConfig] Using URL slug: ${urlSlug}`);
            }
            return urlSlug;
        }

        // 3. Server-only ENV or SSR-transported state key (client)
        // IMPORTANT: jurisdictionId lives in server-only runtimeConfig (NOT public).
        // This prevents the build-time value from being baked into the client bundle,
        // which would cause "1" (numeric default) to override the runtime slug "berlin".
        // On SSR, we read the server config directly. The resolved slug is stored in the
        // 'mas-config-jurisdiction-key' useState key and transported to the client via
        // Nuxt's __NUXT_DATA__ payload, so the client always has the correct runtime value.
        if (import.meta.server) {
            const envJurisdiction = (runtimeConfig as Record<string, unknown>).jurisdictionId
                ? String((runtimeConfig as Record<string, unknown>).jurisdictionId)
                : '';
            if (envJurisdiction) {
                // Resolve numeric ENV IDs to slugs when possible (Settings API accepts both)
                if (/^\d+$/.test(envJurisdiction)) {
                    const jur = getJurisdictionById(Number(envJurisdiction));
                    if (jur?.slug) {
                        if (import.meta.dev) {
                            console.log(`[MasConfig] Resolved numeric ENV ${envJurisdiction} to slug: ${jur.slug}`);
                        }
                        return jur.slug;
                    }
                }
                if (import.meta.dev) {
                    console.log(`[MasConfig] Using env jurisdiction (SSR): ${envJurisdiction}`);
                }
                return envJurisdiction;
            }
        } else {
            if (configJurisdictionKey.value) {
                if (import.meta.dev) {
                    console.log(`[MasConfig] Using SSR-resolved jurisdiction: ${configJurisdictionKey.value}`);
                }
                return configJurisdictionKey.value;
            }
        }

        // 4. Default jurisdiction (first or isDefault from backend)
        // Use slug (Settings API accepts both slugs and numeric IDs)
        const fallback = routeOverride ? defaultJurisdiction.value : currentJurisdiction.value;
        if (fallback?.slug) {
            if (import.meta.dev) {
                console.log(`[MasConfig] Using default jurisdiction slug: ${fallback.slug}`);
            }
            return fallback.slug;
        }

        return '';
    };

    /**
   * Fetch configuration from backend
   * Uses deduplication to prevent multiple concurrent requests
   * Includes localStorage caching for offline support
   */
    const fetchConfig = async (force = false, routeOverride?: { query?: Partial<Record<string, string | string[]>>, params?: Partial<Record<string, string | string[]>> }): Promise<void> => {
        const jurisdictionId = getJurisdictionIdOrSlug(routeOverride);
        const requestCache = getRequestCache();

        // Detect jurisdiction change: re-fetch even if config exists
        const jurisdictionChanged = configJurisdictionKey.value !== '' &&
          jurisdictionId !== '' &&
          configJurisdictionKey.value !== jurisdictionId;

        if (jurisdictionChanged) {
            console.log(`[MasConfig] Jurisdiction changed: ${configJurisdictionKey.value} -> ${jurisdictionId}`);
            requestCache.mergedConfigCache = null;
        }

        // Return cached config unless forced or jurisdiction changed
        if (!force && !jurisdictionChanged && configState.value && configStatus.value === 'success') {
            return;
        }

        // Try loading from localStorage cache first (client-side only)
        if (isClient && !force && !jurisdictionChanged) {
            const cachedConfig = loadConfigFromCache(jurisdictionId, !isOnline.value);
            if (cachedConfig) {
                configState.value = normalizeConfig(cachedConfig);
                configStatus.value = 'success';
                configJurisdictionKey.value = jurisdictionId;
                requestCache.mergedConfigCache = null;
                return;
            }
        }

        // If offline and no cache, use defaults but don't block
        if (isClient && !isOnline.value) {
            console.warn('[MasConfig] Offline with no cache, using defaults');
            configStatus.value = 'success'; // Allow form to work with defaults
            return;
        }

        // Deduplicate concurrent requests (module-level variable)
        if (requestCache.fetchPromise && !force) {
            return requestCache.fetchPromise;
        }

        configStatus.value = 'pending';
        configError.value = null;

        requestCache.fetchPromise = (async () => {
            try {
                // Use backend URL only on server-side, relative URL on client to avoid mixed content
                const baseUrl = import.meta.server ? (runtimeConfig.public.apiBase || '') : '';
                const locale = getCurrentLocale();

                // Build URL with jurisdiction parameter (only if explicitly set)
                // Exclude boundary for faster initial load - it's lazy-loaded by useBoundaryValidator
                const url = `${baseUrl}/api/mark-a-spot-settings`;
                const params = new URLSearchParams();
                params.set('exclude', 'boundary');
                if (jurisdictionId) {
                    params.set('jurisdiction', String(jurisdictionId));
                }
                const fullUrl = `${url}?${params}`;

                const response = await $fetch<MarkASpotConfig>(fullUrl, {
                    credentials: 'include',
                    headers: locale
                        ? {
                            'X-Translation-Language': locale,
                            'Accept-Language': locale
                        }
                        : undefined,
                    cache: import.meta.client ? 'no-store' : undefined
                });

                if (response && typeof response === 'object') {
                    // Normalize the response (handle legacy fields)
                    const normalized = normalizeConfig(response);
                    configState.value = normalized;
                    configStatus.value = 'success';
                    configJurisdictionKey.value = jurisdictionId;
                    // Invalidate merged config cache when new data arrives
                    requestCache.mergedConfigCache = null;
                    // Save to localStorage for offline support
                    saveConfigToCache(normalized, jurisdictionId);
                } else {
                    throw new Error('Invalid API response structure');
                }
            } catch (err) {
                console.error('[MasConfig] Error fetching configuration:', err);
                configError.value = err instanceof Error ? err.message : String(err);
                configStatus.value = 'error';
            } finally {
                requestCache.fetchPromise = null;
            }
        })();

        return requestCache.fetchPromise;
    };

    // ============================================================================
    // Computed Accessors
    // ============================================================================

    const config = computed(() => configState.value);
    const isReady = computed(() => configStatus.value === 'success');
    const isPending = computed(() => configStatus.value === 'pending');
    const error = computed(() => configError.value);

    // Structured accessors
    const jurisdiction = computed(() => config.value?.jurisdiction);
    const taxonomyJurisdictionId = computed(() => config.value?.jurisdiction?.taxonomyJurisdictionId);
    const client = computed(() => config.value?.client);
    const theme = computed(() => config.value?.theme);
    const features = computed(() => config.value?.features);
    const ui = computed(() => config.value?.ui);
    const media = computed(() => config.value?.media);
    const languages = computed(() => config.value?.languages);
    const i18nOverrides = computed(() => config.value?.i18n?.overrides);
    const facilities = computed<MasConfigFacilities>(() => config.value?.facilities || {
        enabled: false,
        hideMapPicker: false,
        items: []
    });
    const map = computed(() => config.value?.map);
    const status = computed(() => config.value?.status);
    const boundary = computed(() => config.value?.boundary);
    const services = computed(() => config.value?.services);
    const districts = computed(() => config.value?.districts ?? []);
    const sublocalities = computed(() => config.value?.sublocalities ?? []);
    const groupTypes = computed(() => config.value?.groupTypes);
    const systemNotice = computed(() => config.value?.systemNotice);
    const operator = computed(() => config.value?.operator);

    /**
   * Check if a feature is enabled
   * Returns a computed ref for reactivity
   */
    const hasFeature = (featureName: keyof MasConfigFeatures) => {
        return computed(() => {
            if (!config.value?.features) return false;
            return config.value.features[featureName] ?? false;
        });
    };

    /**
   * Get a feature value with default
   */
    const getFeature = <K extends keyof MasConfigFeatures>(
        featureName: K,
        defaultValue: MasConfigFeatures[K]
    ): MasConfigFeatures[K] => {
        return config.value?.features?.[featureName] ?? defaultValue;
    };

    // ============================================================================
    // Legacy Compatibility
    // ============================================================================

    /**
   * Map settings in legacy format (for backward compatibility)
   */
    const mapSettings = computed(() => {
        const m = map.value;
        if (!m) {
            return {
                style: '',
                style_dark: '',
                center: { lat: 0, lng: 0 },
                zoom: 13
            };
        }

        return {
            style: m.mapbox_style || m.fallback_style || '',
            style_dark: m.mapbox_style_dark || m.fallback_style_dark || '',
            center: {
                lat: m.center[1],
                lng: m.center[0]
            },
            zoom: m.zoom
        };
    });

    /**
   * Get raw setting value (legacy compatibility)
   */
    const getSetting = <T>(key: string, defaultValue: T): T => {
        const value = (config.value as any)?.[key];
        return value !== undefined && value !== null ? value : defaultValue;
    };

    // ============================================================================
    // Merged Client Config (for migration from import clientConfig)
    // ============================================================================

    /**
   * Merged configuration object that combines:
   * - Client defaults (config/clients/default.ts)
   * - Backend overrides (from /api/mark-a-spot-settings)
   *
   * This provides a drop-in replacement for `import clientConfig from '../../config/clients'`
   *
   * REFACTORED: No longer calls useMarkASpotSettings to avoid circular dependency.
   * The API response (apiConfig) already contains all jurisdiction-specific overrides.
   *
   * Usage migration:
   * ```ts
   * // Before:
   * import clientConfig from '../../config/clients'
   * const maxFiles = clientConfig.features.media.maxFiles
   *
   * // After:
   * const { clientConfig } = useMarkASpotConfig()
   * const maxFiles = clientConfig.value.features.media.maxFiles
   * ```
   */
    const clientConfig = computed<ClientConfigShape>(() => {
        const rawApiConfig = config.value;

        // Return defaults if no API config yet
        if (!rawApiConfig) {
            return clientConfigDefaults as unknown as ClientConfigShape;
        }

        // Clean empty strings from API config before merging
        // Empty strings from JSON form widget would otherwise override defaults
        const apiConfig = removeEmptyStrings(rawApiConfig);

        // Check cache - use lightweight key instead of full JSON.stringify
        // MEMORY LEAK FIX: JSON.stringify on large objects (boundary GeoJSON) creates huge strings
        // that cause String::SlowFlatten issues during RegExp operations
        // UNIQUENESS FIX (#6): Include multiple fields to prevent cache collisions
        const cacheKey = [
            apiConfig?.jurisdiction?.id || 'default',
            apiConfig?.jurisdiction?.name || '',
            apiConfig?.theme?.primary || '',
            apiConfig?.theme?.secondary || '',
            apiConfig?.theme?.logos?.light || '',
            apiConfig?.theme?.logos?.dark || '',
            apiConfig?.client?.name || '',
            apiConfig?.theme?.pwaIcon || '',
            apiConfig?.theme?.ogImage || '',
            String(apiConfig?.facilities?.enabled ?? ''),
            buildFacilitiesCacheKey(apiConfig?.facilities),
            String(apiConfig?.facilities?.hideMapPicker ?? ''),
            String(apiConfig?.features?.organisations ?? ''),
            String(apiConfig?.features?.serviceProviders ?? ''),
            String(apiConfig?.features?.intakeSource ?? ''),
            String(apiConfig?.features?.dashboardRequestCreate ?? ''),
            // Include formFirst in cache key so changes invalidate cache
            String(apiConfig?.features?.formFirst ?? ''),
            String(apiConfig?.demoMode?.banner?.title ?? ''),
            String(apiConfig?.demoMode?.banner?.message ?? ''),
            String(apiConfig?.demoMode?.banner?.linkLabel ?? ''),
            String(apiConfig?.demoMode?.banner?.linkUrl ?? ''),
            String(apiConfig?.demoMode?.reset?.title ?? ''),
            String(apiConfig?.demoMode?.reset?.notice ?? ''),
            String(apiConfig?.demoMode?.reset?.countdownLabel ?? ''),
            Array.isArray(apiConfig?.sso?.providers)
                ? apiConfig.sso.providers.map((provider: any) => `${provider?.id ?? ''}:${provider?.label ?? ''}`).join('|')
                : ''
        ].join('-');
        const requestCache = getRequestCache();
        if (requestCache.mergedConfigCache?.key === cacheKey) {
            return requestCache.mergedConfigCache.value as ClientConfigShape;
        }

        // Use defu for deep merging (handles undefined/null correctly, battle-tested)
        // defu(source, defaults) - source values take priority over defaults

        // Start with client defaults
        // Deep-clone to create a mutable copy (defaultConfig uses `as const`)
        const merged: Record<string, any> = JSON.parse(JSON.stringify(clientConfigDefaults));

        // Merge theme colors from backend if present
        if (apiConfig?.theme) {
            const themeOverrides = {
                colors: {
                    primary: apiConfig.theme.primary,
                    secondary: apiConfig.theme.secondary,
                    neutral: apiConfig.theme.neutral
                },
                logoLight: apiConfig.theme.logos?.light,
                logoDark: apiConfig.theme.logos?.dark,
                favicon: apiConfig.theme.favicon,
                pwaIcon: apiConfig.theme.pwaIcon,
                ogImage: apiConfig.theme.ogImage,
                // Allow Drupal to override button text/background styles per tenant
                ...(apiConfig.theme.buttonStyles && { buttonStyles: apiConfig.theme.buttonStyles })
            };
            merged.theme = defu(themeOverrides, merged.theme);
        }

        // Merge features from backend if present
        if (apiConfig?.features) {
            // Helper to normalize boolean to {enabled: boolean} for nested configs
            const normalizeFeature = (val: unknown) =>
                typeof val === 'boolean' ? { enabled: val } : val;

            const featureOverrides: Record<string, unknown> = {
                // Simple boolean features
                voting: apiConfig.features.voting,
                statistics: apiConfig.features.statistics,
                photoReporting: apiConfig.features.photoReporting,
                classicReporting: apiConfig.features.classicReporting,
                aiAnalysis: apiConfig.features.aiAnalysis,
                aiProcessing: apiConfig.features.aiProcessing,
                piiRedaction: apiConfig.features.piiRedaction,
                aiDuplicates: apiConfig.features.aiDuplicates,
                emailIntake: apiConfig.features.emailIntake,
                intakeSource: normalizeFeature(apiConfig.features.intakeSource),
                operationsDashboard: apiConfig.features.operationsDashboard,
                privacyBlockOnFlag: apiConfig.features.privacyBlockOnFlag,
                statusAttributes: normalizeFeature(apiConfig.features.statusAttributes),
                feedback: apiConfig.features.feedback,
                following: apiConfig.features.following,
                dashboardRequestCreate: apiConfig.features.dashboardRequestCreate,
                organisations: normalizeFeature(apiConfig.features.organisations),
                serviceProviders: normalizeFeature(apiConfig.features.serviceProviders),
                objectId: apiConfig.features.objectId,
                party: apiConfig.features.party,
                contactForm: apiConfig.features.contactForm,
                // #323: external GeoReport write toggle. The server write-gate reads
                // the build-time baked clientConfig; this passthrough only exposes the
                // per-jurisdiction value to the client-side merged config.
                allowGeoreportPost: apiConfig.features.allowGeoreportPost,
                // Features with nested config (normalize boolean to {enabled} object)
                dashboard: normalizeFeature(apiConfig.features.dashboard),
                passwordless: normalizeFeature(apiConfig.features.passwordless),
                pwaInstallPrompt: normalizeFeature(apiConfig.features.pwaInstallPrompt),
                formFirst: normalizeFeature(apiConfig.features.formFirst),
                emergency: normalizeFeature(apiConfig.features.emergency),
                funFacts: normalizeFeature(apiConfig.features.funFacts),
                offline: normalizeFeature(apiConfig.features.offline),
                // Pass through complex nested configs as-is
                search: apiConfig.features.search,
                categoryDescriptions: apiConfig.features.categoryDescriptions,
                boundaries: apiConfig.features.boundaries,
                privacyNotice: apiConfig.features.privacyNotice,
                analytics: apiConfig.features.analytics,
                geocoding: apiConfig.features.geocoding,
                // Map/filters config can also come from features
                map: apiConfig.features.map,
                filters: apiConfig.features.filters,
                // Action button config (labels, visibility)
                actionButtons: apiConfig.features.actionButtons,
                forms: apiConfig.features.forms,
                photoRequiredCategories: apiConfig.features.photoRequiredCategories
            };

            // Remove undefined values to prevent overwriting defaults
            const cleanedFeatureOverrides = Object.fromEntries(
                Object.entries(featureOverrides).filter(([_, v]) => v !== undefined)
            );

            merged.features = defu(cleanedFeatureOverrides, merged.features);
        }

        // Merge UI settings from backend if present
        if (apiConfig?.ui) {
            const uiOverrides = {
                headerHeight: apiConfig.ui.headerHeight,
                leftSidebar: apiConfig.ui.sidebar,
                bottomSheet: apiConfig.ui.bottomSheet
            };
            merged.theme.ui = defu(uiOverrides, merged.theme.ui);
        }

        // Also check for theme.ui settings (alternative location)
        if (apiConfig?.theme?.ui?.leftSidebar) {
            merged.theme.ui = defu(
                { leftSidebar: apiConfig.theme.ui.leftSidebar },
                merged.theme.ui
            );
        }

        // Merge media settings from backend if present
        if (apiConfig?.media) {
            const mediaOverrides = {
                maxFiles: apiConfig.media.maxFiles,
                maxFileSize: apiConfig.media.maxSize,
                allowedTypes: apiConfig.media.allowedTypes
            };
            merged.features.media = defu(mediaOverrides, merged.features.media);
        }

        // Merge top-level map config from backend if present
        // Normalize deferredMap: boolean -> {enabled, preloadData, limit}
        if (apiConfig?.map) {
            const mapOverrides = { ...apiConfig.map } as Record<string, any>;

            // Normalize deferredMap if it's a boolean
            if (typeof mapOverrides.deferredMap === 'boolean') {
                mapOverrides.deferredMap = {
                    enabled: mapOverrides.deferredMap,
                    preloadData: true,
                    limit: 100
                };
            }

            // Normalize map controls: boolean -> {enabled: boolean}
            if (mapOverrides.controls) {
                const controls = mapOverrides.controls as Record<string, unknown>;
                for (const key of Object.keys(controls)) {
                    if (typeof controls[key] === 'boolean') {
                        controls[key] = { enabled: controls[key] };
                    }
                }
            }

            merged.features.map = defu(mapOverrides, merged.features.map);
        }

        // Merge top-level filters config from backend if present
        if (apiConfig?.filters) {
            // Normalize simple boolean filters to nested enabled structure
            const filtersOverrides = { ...apiConfig.filters } as Record<string, any>;

            // If filters has simple booleans at top level, move to enabled object
            if (typeof filtersOverrides.status === 'boolean' ||
              typeof filtersOverrides.category === 'boolean' ||
              typeof filtersOverrides.time === 'boolean') {
                filtersOverrides.enabled = {
                    status: filtersOverrides.status ?? true,
                    category: filtersOverrides.category ?? true,
                    time: filtersOverrides.time ?? true,
                    custom: filtersOverrides.custom ?? false
                };
                delete filtersOverrides.status;
                delete filtersOverrides.category;
                delete filtersOverrides.time;
                delete filtersOverrides.custom;
            }

            merged.features.filters = defu(filtersOverrides, merged.features.filters);
        }

        if (apiConfig?.facilities) {
            merged.facilities = defu(apiConfig.facilities, merged.facilities);
        }

        if (apiConfig?.demoMode) {
            merged.demoMode = defu(apiConfig.demoMode, merged.demoMode || {});
        }

        if (apiConfig?.sso) {
            const providers = Array.isArray(apiConfig.sso.providers)
                ? apiConfig.sso.providers
                    .filter((provider: any) => typeof provider?.id === 'string' && typeof provider?.label === 'string')
                    .map((provider: any) => ({
                        id: provider.id,
                        label: provider.label
                    }))
                : [];
            merged.sso = { providers };
        }

        // Merge jurisdiction info from backend first (highest priority)
        // REFACTORED: No longer uses separate settingsData - apiConfig contains all jurisdiction data
        if (apiConfig?.jurisdiction) {
            (merged as any).jurisdiction = apiConfig.jurisdiction;
            // Use jurisdiction name if available (overrides client.name)
            if (apiConfig.jurisdiction.name) {
                merged.name = apiConfig.jurisdiction.name;
            }
            if (apiConfig.jurisdiction.shortName) {
                merged.shortName = apiConfig.jurisdiction.shortName;
            }
        }

        // Merge client info from backend if present (lower priority than jurisdiction)
        if (apiConfig?.client) {
            // Only use client.name if no jurisdiction name was set
            if (!apiConfig?.jurisdiction?.name) {
                merged.name = apiConfig.client.name || merged.name;
            }
            if (!apiConfig?.jurisdiction?.shortName) {
                merged.shortName = apiConfig.client.shortName || merged.shortName;
            }
            merged.domain = apiConfig.client.domain || merged.domain;
            // Carry the full client object so HeaderLogo can read client.claim,
            // client.tagline, and any other per-tenant client fields.
            merged.client = { ...(merged.client || {}), ...apiConfig.client };
        }

        // Pass through dashboard settings (column defaults for tenant admins)
        if (apiConfig?.dashboard) {
            (merged as any).dashboard = apiConfig.dashboard;
        }

        // Cache the result
        requestCache.mergedConfigCache = { key: cacheKey, value: merged };

        return merged as ClientConfigShape;
    });

    // ============================================================================
    // Development: Watch for jurisdiction query param changes
    // ============================================================================

    // Note: Jurisdiction watching is handled by the jurisdiction-watcher.client.ts plugin
    // This ensures the watcher is always set up on the client side, even after SSR hydration

    // ============================================================================
    // Cache Management
    // ============================================================================

    /**
     * Clear cached config state (useful when jurisdiction changes)
     */
    const clearCache = () => {
        configState.value = null;
        configStatus.value = 'idle';
        configError.value = null;
        configJurisdictionKey.value = '';
        // Clear in-memory merged config cache
        const requestCache = getRequestCache();
        requestCache.fetchPromise = null;
        requestCache.mergedConfigCache = null;
        console.log('[MasConfig] Cache cleared');
    };

    // ============================================================================
    // Return
    // ============================================================================

    // Computed for current jurisdiction ID (reactive).
    //
    // Capture useRouter() at setup scope (not useRoute()) for two reasons:
    //   1. Nuxt 4 warns when useRoute() is called inside route middleware,
    //      because middleware runs before the route transition completes and
    //      useRoute() returns the OLD route — useRouter() has no such caveat.
    //      This composable is invoked transitively by global middlewares
    //      (workspace-visibility.global.ts) so the warning would fire
    //      otherwise.
    //   2. router is stable across the app lifetime, so reading
    //      router.currentRoute.value inside the computed is a plain reactive
    //      property access — it doesn't re-enter Nuxt composable APIs at flush
    //      time, which keeps the 2026-04-25 fix for the "called outside of a
    //      plugin, Nuxt hook, …" SSR scheduler-flush error in place.
    const currentJurisdictionId = computed(() => getJurisdictionIdOrSlug(router.currentRoute.value));

    return {
    // State
        config,
        isReady,
        isPending,
        error,
        currentJurisdictionId, // Useful for dev tools / debugging

        // Actions
        fetchConfig,
        clearCache,

        // Structured accessors
        jurisdiction,
        taxonomyJurisdictionId,
        client,
        theme,
        features,
        ui,
        media,
        languages,
        i18nOverrides,
        facilities,
        map,
        status,
        boundary,
        services,
        districts,
        sublocalities,
        groupTypes,
        systemNotice,
        operator,

        // Feature helpers
        hasFeature,
        getFeature,

        // Legacy compatibility
        mapSettings,
        getSetting,
        settings: config, // Alias for legacy code
        loading: isPending, // Alias for legacy code

        // Drop-in replacement for `import clientConfig from '../../config/clients'`
        // Access via clientConfig.value.features.media.maxFiles etc.
        clientConfig,

        // Also export the raw defaults for cases where backend-independent config is needed
        clientConfigDefaults
    };
}

// ============================================================================
// SSR Helper
// ============================================================================

/**
 * Prefetch config during SSR
 * Call this in a plugin or page setup to ensure config is available
 */
export async function prefetchMarkASpotConfig(): Promise<MarkASpotConfig | null> {
    const { fetchConfig, config } = useMarkASpotConfig();
    await fetchConfig();
    return config.value;
}
