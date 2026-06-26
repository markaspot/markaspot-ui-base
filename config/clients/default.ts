// config/clients/default.ts
export const defaultConfig = {
    name: 'Mark-a-Spot',
    shortName: 'default',
    domain: 'mark-a-spot.org',
    apiEndpoint: 'https://api.mark-a-spot.org',
    facilities: {
        enabled: false,
        hideMapPicker: false,
        items: []
    },
    theme: {
        logoLight: '/images/logo-light.svg',
        logoDark: '/images/logo-dark.svg',
        favicon: '/favicon.svg',
        icons: {
            192: '/images/pwa-icon-192.png',
            512: '/images/pwa-icon-512.png'
        },
        colors: {
            primary: 'blue',
            secondary: 'violet',
            neutral: 'slate'
        },
        buttonStyles: {
        // Configure button background and text colors per theme mode
            primary: {
                background: {
                    light: 'bg-primary-500', // Background in light mode
                    dark: 'bg-primary-600' // Background in dark mode
                },
                text: {
                    light: 'text-inverted', // Uses --ui-text-inverted (WCAG auto-contrast)
                    dark: 'text-inverted' // Uses --ui-text-inverted (WCAG auto-contrast)
                },
                hover: 'hover:bg-primary-600', // Hover state
                active: 'active:bg-primary-700', // Active state
                focus: 'focus:ring-primary-300', // Focus ring
                // Tooltip-specific styles (smaller buttons in tooltips)
                tooltip: {
                    background: {
                        light: 'bg-primary-500',
                        dark: 'bg-primary-600'
                    },
                    hover: 'hover:bg-primary-700',
                    active: 'active:bg-primary-800'
                }
            },
            secondary: {
                background: {
                    light: 'bg-secondary-700', // Background in light mode
                    dark: 'bg-secondary-700' // Background in dark mode
                },
                text: {
                    light: 'text-white', // Text color in light mode
                    dark: 'text-white' // Text color in dark mode
                },
                hover: 'hover:bg-secondary-600', // Hover state
                active: 'active:bg-secondary-700', // Active state
                focus: 'focus:ring-secondary-300', // Focus ring
                // Tooltip-specific styles
                tooltip: {
                    background: {
                        light: 'bg-secondary-700',
                        dark: 'bg-secondary-700'
                    },
                    hover: 'hover:bg-secondary-600',
                    active: 'active:bg-secondary-800'
                }
            }
        },
        navigationStyles: {
            // Navigation styling
            background: { light: 'primary-500', dark: 'primary-800' },
            tabPill: {
                background: { light: 'primary-400', dark: 'primary-950' },
                text: { light: 'text-white', dark: 'text-gray-100' },
                hover: 'hover:primary-500 dark:hover:primary-700',
                active: 'active:primary-600 dark:active:primary-800',
                focus: 'focus:ring-primary-300 dark:focus:ring-primary-600'
            }
        },
        logoHeight: '100px',
        ui: {
            headerHeight: '120px',
            leftSidebar: {
                width: '420px', // Width in pixels (was previously using Tailwind units)
                enabled: true // Whether to show the sidebar on desktop
            },
            bottomSheet: {
                // Visual/behavior
                showHandle: true,
                dismissible: false, // keep always visible by default
                overlay: false,
                modal: false,
                scaleBackground: false,
                setBackgroundColorOnScale: false,

                // Sizing
                minimumHeight: 140, // px
                // When specified, used as the mid snap; can be number (px) or string (e.g. '40vh')
                // height: 320,
                // Initial position: 'low' | 'medium' | 'high'
                position: 'medium',
                // Optional explicit snap points; accepts numbers (px) or strings like '40vh'
                // snapPoints: [140, '40vh', '80vh']

                // Interaction behavior
                autoCollapseOnMapTap: true,
                autoCollapseOnMapMove: true,
                collapseDebounce: 200
            },
            animations: {
                duration: 200,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                type: 'bounce'
            }
        }
    },
    languages: {
        locales: [
            { code: 'en', iso: 'en-US', file: 'en.ts' },
            { code: 'de', iso: 'de-DE', file: 'de.ts' },
            { code: 'de-ls', iso: 'de-LS', file: 'de-ls.ts' }
        ],
        defaultLocale: 'en',
        fallbackLocale: 'en'
    },

    features: {
        // Allow external POST requests to GeoReport API via proxy (requires API key)
        allowGeoreportPost: false,
        media: {
            maxFiles: 3,
            maxFileSize: 20 * 1024 * 1024, // 20MB
            allowedTypes: ['image/jpeg', 'image/png'],
            maxDimensions: {
                width: 16384,
                height: 16384
            },
            optimize: {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.85,
                format: 'jpeg' as const
            },
            // Image proxy configuration
            proxy: {
                enabled: true, // Enable the image proxy
                pathPrefix: '/api/images', // URL path prefix for the image proxy
                cacheDuration: 86400 // Cache duration in seconds (1 day)
            }
        },
        photoReporting: false,
        statistics: true,
        oktoberfest: false,
        objectId: false,
        feedback: true,
        // Passwordless authentication (requires markaspot_passwordless Drupal module)
        passwordless: {
            enabled: false
        },
        // Dashboard feature (admin interface for managing service requests)
        // MIT-excluded: Not part of the open source version
        dashboard: {
            enabled: false
        },
        categories: ['infrastructure', 'environment', 'safety'],
        aiAnalysis: false,
        photoRequiredCategories: [], // Add term IDs for categories that require photos
        categoryDescriptions: {
            enabled: false, // Set to false if the Drupal module is not available
            endpoint: '/api/markaspotshstweak' // Default endpoint
        },
        // Form field feature flags
        party: false, // Enable party selection field
        navigation: {
        // Default active tab - can be 'info', 'list', 'following', or 'stats'
        // If not specified or if the specified tab is disabled, falls back to the first enabled tab
            activeTab: 'info',
            tabs: {
                info: {
                    enabled: true,
                    weight: 10 // Lower weights appear first
                },
                list: {
                    enabled: true,
                    weight: 20
                },
                following: {
                    enabled: true,
                    weight: 30
                },
                stats: {
                    enabled: true, // Set to false to hide the stats tab
                    weight: 40
                }
            }
        },
        map: {
            // Load markers on initial map load using the viewport bounds
            // (calculated from Drupal's center_lat, center_lng, and zoom_initial settings)
            loadMarkersOnInit: true, // Set to true to enable initial marker loading
            // Enable automatic marker updates when map bounds change (panning/zooming)
            enableBoundsFiltering: true, // Set to false to prevent marker updates during map interaction
            // Marker appearance settings
            markers: {
                iconSize: 24, // Size of icons inside markers (px)
                strokeWidth: 2, // Border width for individual markers (px)
                radius: 15, // Radius of individual marker circles (px)
                borderColor: 'auto', // 'auto' = dark/light mode adaptive, or hex like '#ff0000'
                selectedAnimation: true, // true = enabled with default 'bounce'. false to disable, or { enabled: true, type: 'bounce' | 'pulse' | 'glow' }
                magnitudeScaling: {
                    enabled: false,
                    factors: { hazardLevel: true, age: false, status: false },
                    minScale: 0.7,
                    maxScale: 1.5
                }
            },
            // Cluster appearance settings
            clusters: {
                strokeWidth: 4, // Border width for cluster circles (px)
                strokeOpacity: 0.6, // Border opacity (0-1)
                dominantColor: false, // Color cluster stroke by dominant category
                animateExpand: false // Animate pins outward from cluster on zoom-in (experimental)
            },
            // Deferred map loading for mobile - preloads list data before map
            // This improves perceived performance by showing the list immediately
            deferredMap: {
                enabled: true, // Defer map loading on mobile until user interaction
                preloadData: true, // Preload list data using city-wide bbox from boundary
                // Limit of 100 chosen to balance:
                // - Coverage: Most cities have <100 active reports visible initially
                // - Performance: 100 items is fast to fetch (~200-500ms) and render
                // - Network: Single request vs paginated fetching
                // - UX: Provides enough data for meaningful filtering
                limit: 100
            },
            // Configure layer visibility based on zoom levels
            // Seamless transitions: heatmap fades → clusters appear → markers appear
            // clusterMaxZoom=11 in useMap.ts means clustering stops at zoom 11, markers at 12
            layerVisibility: {
                heatmap: {
                    minZoom: 0, // Minimum zoom level to show heatmap
                    maxZoom: 11, // Fade out heatmap by zoom 11
                    fadeOut: true // Smooth fade effect
                },
                clusters: {
                    minZoom: 10, // Clusters appear at zoom 10
                    maxZoom: 12 // Clustering stops at zoom 12
                },
                markers: {
                    minZoom: 12 // Individual markers appear at zoom 12
                }
            },
            controls: {
                // Define default position zones - use tailwind classes
                positions: {
                    topRight: 'top-16 right-4', // For report buttons
                    bottomRight: 'bottom-4 right-4', // For bottom controls
                    bottomLeft: 'bottom-4 left-4', // For attribution on mobile
                    centerRight: 'right-4', // Position will be calculated dynamically
                    topLeft: 'top-16 left-4' // New position for mobile controls
                },
                // Configure individual controls - all aligned right
                zoom: {
                    enabled: true,
                    position: 'centerRight',
                    positionMobile: 'topLeft',
                    weight: 40, // Higher weights appear lower (further down)
                    classes: ''
                },
                tilt: {
                    enabled: false,
                    position: 'centerRight',
                    positionMobile: 'topLeft',
                    weight: 20, // Below zoom controls
                    options: {
                        angles: [0, 30, 60], // Available tilt angles
                        defaultAngle: 0,
                        expandable: true // Make the tilt control expandable
                    },
                    classes: ''
                },
                theme: {
                    enabled: true,
                    position: 'centerRight',
                    positionMobile: 'topLeft',
                    weight: 30,
                    classes: ''
                },
                geolocation: {
                    enabled: false,
                    position: 'centerRight',
                    positionMobile: 'topLeft',
                    weight: 10,
                    classes: ''
                },
                language: {
                    enabled: false,
                    position: 'centerRight',
                    weight: 50,
                    classes: ''
                },
                // Heatmap toggle control
                heatmap: {
                    enabled: false, // Whether to show the control button
                    initialState: true, // Whether heatmap is initially on (false) or off (true)
                    position: 'centerRight',
                    positionMobile: 'topLeft',
                    weight: 60,
                    classes: ''
                },
                // Report buttons (photo and classic)
                reports: {
                    enabled: true,
                    position: 'topRight',

                    weight: 1, // Show at the very top
                    classes: 'w-[280px]'
                },
                // Attribution control
                attribution: {
                    enabled: true,
                    position: 'bottomRight', // Position in bottom-right
                    positionMobile: 'topLeft',
                    weight: 10,
                    classes: ''
                }
            }
        },
        geocoding: {
            providers: ['photon', 'mapbox', 'nominatim'] as const,
            default: 'mapbox' as const,
            config: {
                photon: {
                    provider: 'photon',
                    options: {
                        limit: 5,
                        locationBiasScale: 0.1
                    }
                },
                mapbox: {
                    provider: 'mapbox',
                    apiKey: process.env.MAPBOX_API_KEY,
                    options: {
                        limit: 10,
                        language: 'de',
                        // NOTE: country and region are loaded from Drupal's markaspot_nuxt.settings
                        // (geocoding_country, geocoding_region). These client config values are
                        // fallbacks only. Configure in Drupal: Admin > Config > Mark-a-Spot > Nuxt Settings
                        // Leave empty for worldwide search, or set ISO 3166-1 alpha-2 code (de, us, fr)
                        // country: '', // Fallback - empty means no country restriction
                        // region: '', // Optional fallback region for proximity bias
                        // Control whether to use Drupal's bbox and center for geocoding
                        useBbox: true, // Use Drupal's limit_viewbox for strict geographic filtering
                        useProximity: true // Use Drupal's center_lat/lng for proximity bias
                    }
                },
                nominatim: {
                    provider: 'nominatim',
                    endpoint: process.env.NOMINATIM_ENDPOINT,
                    options: {
                        limit: 5
                        // Country is loaded from Drupal's geocoding_country setting
                    }
                }
            }
        },
        boundaries: {
            enabled: true,
            file: 'default',
            strictValidation: true, // if true, reports outside boundary are rejected
            showBoundaryOnMap: true // display boundary on map
        },
        filters: {
            enabled: {
                status: true, // Enable/disable status filters
                category: true, // Enable/disable category filters
                time: true, // Enable/disable time-based filters
                custom: false // Enable/disable custom filters
            },
            groups: {
                // Primary filters (always visible)
                primary: ['status:*'], // * means all status filters
                // Secondary filters (collapsible)
                secondary: ['category:*', 'time:*']
            },
            behavior: {
                multiSelect: true, // Allow multiple active filters
                collapsible: true, // Allow collapsing secondary filters
                persistent: true, // Remember filter state in localStorage
                autoExpand: false, // Auto-expand secondary filters on load
                showClearAll: true // Show "clear all" button
            },
            defaultActive: [], // Default active filters on load
            labels: {
                // Custom labels for filters (optional)
                // 'status:open': 'Neue Meldungen',
                // 'status:in_progress': 'In Bearbeitung'
            },
            order: ['status', 'category', 'time'] // Order of filter types
        },
        actionButtons: {
            primaryButton: 'classic', // Make classic report button primary
            photo: {
                enabled: true,
                priority: 'primary'
            },
            classic: {
                enabled: true,
                priority: 'primary'
            }
        },
        pwaInstallPrompt: {
            enabled: false, // Enable/disable PWA install prompt
            showOnMobile: true, // Show prompt only on mobile devices
            dismissalDuration: 7, // Days before showing prompt again after dismissal
            showDelay: 2000 // Milliseconds to wait before showing prompt
        },
        forms: {
            autoTriggerGeolocation: true, // Auto-trigger geolocation for forms when opened
            allowParentCategorySelection: true, // Enable/disable parent category selection (default: false for backward compatibility)
            pickOnMapButton: true // Enable "Pick on map" button in location field
        },
        privacyNotice: {
            enabled: true, // Enable/disable privacy notice above submit buttons
            // link: 'https://www.kamp-lintfort.de/datenschutz' // Privacy policy link
            modal: true, // Enable modal mode instead of external links
            nodeId: 62 // Drupal node ID for privacy content
        },
        analytics: {
            matomo: {
                enabled: false,
                mode: 'tag-manager' as const,
                // Traditional Matomo tracking
                siteId: undefined as string | undefined,
                trackerUrl: undefined as string | undefined,
                trackPageView: true,
                enableLinkTracking: true,
                enableHeartBeatTimer: false,
                cookieDomain: undefined as string | undefined,
                doNotTrack: true,
                disableCookies: false,
                // Matomo Tag Manager (MTM)
                containerId: undefined as string | undefined,
                containerUrl: undefined as string | undefined,
                // Loading behavior
                preconnect: true,
                deferLoad: true,
                deferTimeout: 4000
            }
        },
        funFacts: {
            enabled: false // Enable fun facts display
        },
        // Form-first mobile UX (issue #61)
        // When enabled, mobile users see report forms first with map loading on demand
        formFirst: {
            enabled: false, // Master toggle - form in background, sheet starts minimized
            // Layout mode on mobile: 'bottomSheet' (default) | 'tabs'
            // - bottomSheet: Traditional bottom sheet with form inside
            // - tabs: Top tabs for Photo/Classic with form-first experience
            mobileLayout: 'bottomSheet' as const,
            // Default tab when using tabs layout: 'photo' | 'classic'
            defaultTab: 'classic' as const,
            // Map behavior
            map: {
                // Defer map initialization until user taps "Refine Location"
                deferLoad: true,
                // Height of map refinement sheet (percentage or pixels)
                refinementHeight: '50vh'
            },
            // Bottom sheet behavior when form is focused
            collapseOnFocus: true
        },
        // Emergency mode (UI integration)
        // Disabled by default. When enabled, the app will query the backend
        // emergency status on navigation and redirect to /lite if configured.
        emergency: {
            enabled: false
        },
        // Offline mode - allows creating reports while offline
        // Reports are queued in IndexedDB and synced when back online
        offline: {
            enabled: false, // Enable for testing
            draftRetentionDays: 7, // Auto-cleanup drafts older than 7 days
            mediaRetentionHours: 48, // Cleanup orphaned media after 48 hours
            maxRetries: 3 // Max retry attempts for failed sync
        }
    },
    requests: {
        itemsPerPage: 20,
        cacheTTL: 300000, // 5 minutes
        maxRequests: 100
    }
} as const;
