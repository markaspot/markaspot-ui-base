import type { ClientConfig } from '~~/types/clientConfig';

/**
 * Performance optimization configuration
 */

export interface ChunkConfig {
    vendor: string[]
    map: string[]
    forms: string[]
    ui: string[]
}

/**
 * Create chunk splitting configuration for better caching
 */
export function createChunkConfig(): ChunkConfig {
    return {
    // Vendor chunks - stable, rarely changing
        vendor: [
            'vue',
            'vue-router',
            'pinia',
            '@nuxt/ui',
            '@vueuse/core'
        ],

        // Map-related chunks - large but conditionally loaded
        map: [
            'geolocation'
        ],

        // Form-related chunks - loaded on demand
        forms: [
            'form-validation',
            'image-upload',
            'media-processing'
        ],

        // UI component chunks
        ui: [
            'modals',
            'navigation',
            'feedback-system'
        ]
    };
}

/**
 * Create Vite performance configuration
 */
export function createPerformanceConfig(clientConfig: ClientConfig, isDev: boolean) {
    const chunks = createChunkConfig();

    return {
        build: {
            // Enable CSS code splitting
            cssCodeSplit: true,

            // Chunk size warning limit
            chunkSizeWarningLimit: 1000,

            rollupOptions: {
                output: {
                    // Manual chunk splitting for better caching
                    manualChunks: {
                        // Vendor chunk
                        'vendor': chunks.vendor,

                        // Map functionality chunk (conditionally loaded)
                        'map-libs': chunks.map,

                        // UI components chunk
                        'ui-components': chunks.ui,

                        // Form processing chunk
                        'form-processing': chunks.forms
                    }
                }
            }
        },

        // Optimization options
        optimizeDeps: {
            include: [
                'vue',
                'vue-router',
                'pinia',
                '@vueuse/core'
            ],
            exclude: [
                // Exclude heavy map libraries from pre-bundling
                'maplibre-gl'
            ]
        }
    };
}

/**
 * Feature-based lazy loading configuration
 */
export function createLazyLoadingConfig(clientConfig: ClientConfig) {
    const features: ClientConfig['features'] = clientConfig.features;

    return {
    // Components that should be lazy loaded based on features
        conditionalComponents: {
            feedback: features.feedback ? 'components/form/FeedbackForm.vue' : null,
            statistics: features.statistics ? 'components/stats/EnhancedStats.vue' : null,
            mediaUpload: 'components/form/MediaUploadField.vue'
        },

        // Composables that should be lazy loaded
        conditionalComposables: {
            feedback: features.feedback ? 'composables/features/useFeedback.ts' : null,
            statistics: features.statistics ? 'composables/features/useStatus.ts' : null
        },

        // Routes that should be code-split
        routeSplitting: [
            'pages/feedback/**',
            'pages/requests/**',
            'pages/admin/**'
        ]
    };
}

/**
 * Asset optimization configuration
 */
export function createAssetOptimizationConfig() {
    return {
    // Image optimization
        images: {
            formats: ['webp', 'avif', 'jpeg'],
            quality: 85,
            progressive: true
        },

        // Font optimization
        fonts: {
            preload: ['inter-var', 'inter-regular'],
            display: 'swap'
        },

        // CSS optimization
        css: {
            devSourcemap: true,
            preprocessorOptions: {
                scss: {
                    additionalData: '@import "~/assets/css/variables.scss";'
                }
            }
        }
    };
}

/**
 * Critical asset preloading configuration for improved LCP
 */
export function createPreloadConfig() {
    return {
        // Logo preloads are handled dynamically per jurisdiction by
        // 01.jurisdiction-ssr.ts plugin (custom logos or default fallbacks).
        images: [],

        // Third-party domain connections
        // NOTE: Map tile preconnects are NOT hardcoded here because map style URLs
        // come dynamically from Drupal settings (mapbox_style, fallback_style, etc.)
        // Each jurisdiction may use different tile providers (Mapbox, MapTiler, BKG, etc.)
        // Hardcoding preconnects for specific providers causes "unused preconnect" warnings
        // in Lighthouse for clients that don't use those providers.
        connections: []
    };
}

/**
 * MapLibre GL performance optimization configuration
 */
export function createMapLibreConfig() {
    return {
        // Map initialization optimizations
        mapOptions: {
            // Performance settings
            maxZoom: 18,
            minZoom: 5,
            maxTileCacheSize: 50, // Reduce memory usage
            transformRequest: (url: string, resourceType: any) => {
                // Add fetch priority for map tiles
                if (resourceType === 'Tile') {
                    return {
                        url,
                        credentials: 'same-origin',
                        priority: 'high'
                    };
                }
                return { url };
            }
        },

        // Source optimizations
        sourceOptions: {
            // Vector tile optimizations
            vector: {
                maxzoom: 14, // Don't over-fetch high-zoom tiles
                buffer: 64, // Reduce buffer size for better performance
                tolerance: 0.375 // Simplify geometries
            },

            // Clustering for point data
            clustering: {
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
                clusterProperties: {
                    // Aggregate properties for better performance
                    sum: ['+', ['get', 'value']],
                    max: ['max', ['get', 'value']]
                }
            }
        },

        // Layer optimizations
        layerOptions: {
            // Symbol layer optimizations
            symbol: {
                'symbol-avoid-edges': true,
                'text-allow-overlap': false,
                'icon-allow-overlap': false,
                'text-ignore-placement': false,
                'icon-ignore-placement': false
            },

            // Circle layer optimizations
            circle: {
                'circle-pitch-alignment': 'map',
                'circle-pitch-scale': 'map'
            }
        }
    };
}
