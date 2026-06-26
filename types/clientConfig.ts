// types/clientConfig.ts
import type { MapConfig } from './mapConfig';

/**
 * Structured address persisted on a facility config item.
 *
 * Mirrors the four sub-fields required by Drupal's Address module
 * (field_address). Stored on the facility at admin-save time via
 * reverse geocoding so the submission path can always send a complete
 * structured payload without an additional network round-trip.
 */
export interface FacilityAddress {
    address_line1: string
    country_code?: string
    locality?: string
    postal_code?: string
}

export interface FacilityConfigItem {
    id: string
    label: string
    lat: number
    lng: number
    /**
     * The display address for the facility.
     *
     * - Structured `FacilityAddress`: written by the admin UI after reverse
     *   geocoding at save time. The submission path uses this directly.
     * - Plain `string`: legacy value from tenants that saved before this
     *   change. Treated as `{ address_line1: str }` on submission (graceful
     *   degradation — country_code etc. will be empty but the request won't
     *   crash).
     * - `undefined`: no address configured; field_address is omitted from the
     *   submission payload.
     */
    address?: FacilityAddress | string
    organisationId?: string
    active?: boolean
    /**
     * Optional Lucide icon (e.g. `lucide:school`, `i-lucide-school`, or just
     * `school`) shown next to the facility label in the citizen FacilitySelect
     * and in the map hover popup. Normalised through `iconUtils.normalizeIcon`
     * at consume time, so any of the three legacy shapes is accepted.
     */
    icon?: string
    /**
     * Optional short description (opening hours, contact, what to expect).
     * Plain text, soft-capped at 280 chars in the admin form for layout sanity.
     * Rendered as caption text under the address in popup + select.
     */
    description?: string
    /**
     * Optional homepage / detail URL. Must be `https:` (or `http:` only on
     * non-public origins). Rendered as an external-link `<a target="_blank"
     * rel="noopener noreferrer">` in popup; admin form rejects malformed URLs
     * client-side.
     */
    url?: string
}

/**
 * Facility reporting mode.
 *
 * - `exclusive`: every report is about a facility. Citizens pick from a
 *   FacilitySelect list; the facility's coordinates drive the report's
 *   location. Use-case: facility-management tenants (kindergarten networks,
 *   property managers, school districts).
 * - `optional`: citizens use free-form location (map pick, locate-me, search).
 *   If the picked position lies within `nearestSnapRadius` of an active
 *   facility, the facility id is auto-attached as metadata; if the position
 *   drifts out of radius, the tag auto-detaches. No dropdown for citizens.
 *   Use-case: municipalities whose primary reports are free-form but who want
 *   facility tagging for triage.
 * - `disabled`: no facility UI anywhere. Default when `enabled: false`.
 *
 * Backward compat: legacy `enabled: true` without `mode` is treated as
 * `exclusive`. `enabled: false` always wins and resolves to `disabled`.
 */
export type FacilityMode = 'exclusive' | 'optional' | 'disabled';

export interface FacilitiesConfig {
    enabled: boolean
    label?: {
        singular?: string
        plural?: string
    }
    mode?: FacilityMode
    hideMapPicker?: boolean
    /**
     * Radius in meters within which a citizen-placed position auto-attaches
     * the nearest active facility (optional mode) or within which the
     * locate-me button auto-selects a facility (exclusive mode). Defaults to
     * 50 when unset. Values <= 0 disable the auto-snap.
     */
    nearestSnapRadius?: number
    /**
     * Minimum number of overlapping facilities (within clusterRadius pixels)
     * required before MapLibre groups them into a cluster. Defaults to 2.
     * Values below 2 are clamped up; MapLibre itself rejects 0/1.
     */
    clusterMinPoints?: number
    items: FacilityConfigItem[]
}

export interface ButtonStyleConfig {
    background?: {
        light?: string
        dark?: string
    }
    text?: {
        light?: string
        dark?: string
    }
    hover?: string
    active?: string
    focus?: string
    tooltip?: {
        background?: {
            light?: string
            dark?: string
        }
        hover?: string
        active?: string
    }
}

export interface MatomoConfig {
    enabled: boolean
    mode: 'tracking' | 'tag-manager'
    // Traditional Matomo tracking
    siteId?: string
    trackerUrl?: string
    trackPageView?: boolean
    enableLinkTracking?: boolean
    enableHeartBeatTimer?: boolean
    cookieDomain?: string
    doNotTrack?: boolean
    disableCookies?: boolean
    // Matomo Tag Manager (MTM)
    containerId?: string
    containerUrl?: string
    // Loading behavior
    preconnect?: boolean
    deferLoad?: boolean
    deferTimeout?: number
}

export interface SsoProvider {
    id: string
    label: string
}

export interface SsoConfig {
    providers?: SsoProvider[]
}

export interface ClientConfig {
    name: string
    shortName?: string
    domain: string
    apiEndpoint: string
    facilities: FacilitiesConfig
    theme: {
        logoLight: string
        logoDark: string
        favicon: string
        primary?: string
        colors?: {
            primary?: string
            secondary?: string
            success?: string
            info?: string
            warning?: string
            error?: string
            neutral?: string
            gray?: string
        }
        icons?: {
            192?: string
            512?: string
        }
        buttonStyles?: {
            primary?: ButtonStyleConfig
            secondary?: ButtonStyleConfig
        }
        navigationStyles?: {
            background?: {
                light?: string
                dark?: string
            }
            tabPill?: {
                background?: {
                    light?: string
                    dark?: string
                }
                text?: {
                    light?: string
                    dark?: string
                }
                hover?: string
                active?: string
                focus?: string
            }
        }
        logoHeight?: string
        ui?: {
            showLogo?: boolean
            showSlogan?: boolean
            headerHeight?: string
            leftSidebar?: {
                width?: string
                enabled?: boolean
            }
            bottomSheet?: {
                showHandle?: boolean
                dismissible?: boolean
                overlay?: boolean
                modal?: boolean
                scaleBackground?: boolean
                setBackgroundColorOnScale?: boolean
                minimumHeight?: number
                height?: number | string
                position?: 'low' | 'medium' | 'high'
                snapPoints?: Array<number | string>
                autoCollapseOnMapTap?: boolean
                autoCollapseOnMapMove?: boolean
                collapseDebounce?: number
            }
            animations?: {
                duration?: number
                easing?: string
                type?: string
            }
        }
        pwa?: {
            screenshots?: Array<{
                publicPath: string
                sizes: string
                type: string
            }>
            iarcRatingId?: string
            relatedApplications?: Array<{
                platform: string
                url: string
                id: string
            }>
            scopeExtensions?: Array<{
                origin: string
            }>
        }
    }
    languages?: {
        locales?: Array<{
            code: string
            iso: string
            file: string
        }>
        defaultLocale?: string
        fallbackLocale?: string
    }
    dashboard?: {
        columns?: Record<string, boolean>
        createDefaultPublished?: boolean
    }
    sso?: SsoConfig
    features: {
        // Allow external POST requests to GeoReport API via proxy (requires API key)
        allowGeoreportPost?: boolean
        photoReporting: boolean
        statistics: boolean
        categories: string[]
        aiAnalysis?: boolean
        geoLocation?: boolean
        uploadLimit?: number
        analytics?: {
            matomo?: MatomoConfig
        }
        competition?: {
            enabled: boolean
        }
        competitionCategories?: string[]
        partyCategories?: string[]
        oktoberfestCategories?: string[]
        infoCategories?: Array<[string, string, { disableForm?: boolean }?]>
        categoryDescriptions?: {
            enabled?: boolean
            endpoint?: string
        }
        media?: {
            maxFiles?: number
            maxFileSize?: number
            allowedTypes?: string[]
            maxDimensions?: {
                width: number
                height: number
            }
            optimize?: {
                maxWidth: number
                maxHeight: number
                quality: number
                format: string
            }
            proxy?: {
                enabled: boolean
                pathPrefix: string
                cacheDuration: number
            }
        }
        voting?: boolean
        feedback?: boolean
        // Passwordless authentication (requires markaspot_passwordless Drupal module)
        passwordless?: {
            enabled?: boolean
        }
        serviceProvider?: boolean
        photoRequiredCategories?: string[]
        emailRequiredCategories?: string[]
        objectIdCategories?: string[]
        oktoberfest?: boolean
        party?: boolean
        objectId?: boolean
        actionButtons?: {
            // Configure which report button should be primary/secondary
            primaryButton?: 'photo' | 'classic'
            // Configure visibility of each button
            photo?: {
                enabled?: boolean
                priority?: 'primary' | 'secondary'
                label?: string
            }
            classic?: {
                enabled?: boolean
                priority?: 'primary' | 'secondary'
                label?: string
            }
        }
        navigation?: {
            activeTab?: string
            tabs?: {
                [key: string]: {
                    enabled: boolean
                    weight: number
                }
            }
        }
        boundaries?: {
            enabled: boolean
            file: string
            strictValidation: boolean
            showBoundaryOnMap: boolean
        }
        pwaInstallPrompt?: {
            enabled: boolean
            showOnMobile?: boolean
            dismissalDuration?: number
            showDelay?: number
        }
        forms?: {
            autoTriggerGeolocation?: boolean
            allowParentCategorySelection?: boolean
            pickOnMapButton?: boolean
        }
        funFacts?: {
            enabled?: boolean
        }
        emergency?: {
            enabled?: boolean // When true, app checks backend status and may redirect to /lite
        }
        lite?: {
            enabled: boolean
            path?: string // Optional discoverable path alias (e.g., '/hilfe/lite')
            exposeLink?: boolean // If true, UI may surface a link to /lite
            robotsIndex?: boolean // If true, allow indexing (defaults to noindex)
        }
        offline?: {
            enabled?: boolean
            /** Max days to keep drafts before auto-cleanup */
            draftRetentionDays?: number
            /** Max hours to keep orphaned media before cleanup */
            mediaRetentionHours?: number
            /** Max retry attempts for failed sync */
            maxRetries?: number
        }
        // Form-first mobile UX
        formFirst?: {
            enabled?: boolean
            mobileLayout?: 'bottomSheet' | 'tabs'
            defaultTab?: 'photo' | 'classic'
            map?: {
                deferLoad?: boolean
                refinementHeight?: string
            }
            collapseOnFocus?: boolean
        }
        privacyNotice?: {
            enabled?: boolean
            modal?: boolean
            nodeId?: number
        }
        map?: MapConfig
        geocoding?: {
            providers?: readonly string[]
            default?: string
            config?: Record<string, {
                provider?: string
                baseUrl?: string
                endpoint?: string
                apiKey?: string
                options?: Record<string, unknown>
            }>
        }
        filters?: {
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
                autoExpand?: boolean
                showClearAll?: boolean
            }
            defaultActive?: string[]
            labels?: Record<string, string>
            order?: string[]
        }
    }
    requests?: {
        itemsPerPage?: number
        cacheTTL?: number
        maxRequests?: number
    }
}
