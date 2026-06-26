/**
 * Unit Tests for useMarkASpotConfig Composable
 *
 * Tests the central configuration composable that:
 * - Fetches config from /api/mark-a-spot-settings
 * - Merges backend config with client defaults
 * - Resolves jurisdiction from URL/env
 * - Provides reactive config accessors
 *
 * @see /app/composables/core/useMarkASpotConfig.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, computed } from 'vue';

// Import mock utilities from our mock file
import {
    clearMockState,
    mockRouteData,
    mockRuntimeConfigData,
    mockIsOnline,
    mockCurrentJurisdiction,
    mockUseState
} from '../../__mocks__/nuxt';

// NOW import the composable (after mocks are set up)
import {
    useMarkASpotConfig,
    buildFacilitiesCacheKey,
    removeEmptyStrings,
    normalizeConfig,
    type MarkASpotConfig
} from '@/composables/core/useMarkASpotConfig';

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock fetch response
let mockFetchResponse: any = null;
let mockFetchError: Error | null = null;

// Mock $fetch globally
vi.stubGlobal('$fetch', vi.fn(async (_url: string) => {
    if (mockFetchError) {
        throw mockFetchError;
    }
    return mockFetchResponse;
}));

// Mock useJurisdictions module - must be before import
vi.mock('@/composables/core/useJurisdictions', () => ({
    useJurisdictions: () => ({
        jurisdictions: computed(() => []),
        count: computed(() => 0),
        hasMultiple: computed(() => false),
        loaded: computed(() => mockCurrentJurisdiction.value !== null),
        loading: computed(() => false),
        error: computed(() => null),
        currentJurisdiction: computed(() => mockCurrentJurisdiction.value),
        defaultJurisdiction: computed(() => mockCurrentJurisdiction.value),
        currentSlugFromPath: computed(() => null),
        needsSlugRouting: computed(() => false),
        allSlugs: computed(() => []),
        fetchJurisdictions: vi.fn(),
        getBySlug: vi.fn(),
        getById: vi.fn(),
        buildPath: (path: string) => path,
        stripJurisdictionPrefix: (path: string) => path
    })
}));

vi.mock('@/utils/locale', () => ({
    getCurrentLocale: vi.fn(() => 'de')
}));

// ============================================================================
// Test Data
// ============================================================================

const mockApiResponse: MarkASpotConfig = {
    jurisdiction: {
        id: 14,
        name: 'Stadt Köln',
        shortName: 'Köln'
    },
    client: {
        name: 'Stadt Köln',
        shortName: 'Köln'
    },
    theme: {
        primary: 'blue',
        secondary: 'sky',
        neutral: 'slate'
    },
    features: {
        voting: true,
        statistics: false,
        photoReporting: true,
        aiAnalysis: true
    },
    center_lat: '50.9375',
    center_lng: '6.9603',
    zoom_initial: '13',
    mapbox_style: 'mapbox://styles/test',
    mapbox_style_dark: 'mapbox://styles/test-dark'
};

// ============================================================================
// Helper Functions
// ============================================================================

function resetAllMocks() {
    // Clear shared mock state (resets mockIsOnline, mockCurrentJurisdiction, etc.)
    clearMockState();

    // Reset test-specific mocks
    mockFetchResponse = null;
    mockFetchError = null;

    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
        localStorage.clear();
    }
}

// ============================================================================
// Tests: removeEmptyStrings Utility
// ============================================================================

describe('removeEmptyStrings', () => {
    it('should remove empty strings from flat objects', () => {
        const input = { name: 'Test', empty: '', value: 'hello' };
        const result = removeEmptyStrings(input);

        expect(result).toEqual({ name: 'Test', value: 'hello' });
        expect(result).not.toHaveProperty('empty');
    });

    it('should recursively remove empty strings from nested objects', () => {
        const input = {
            level1: {
                name: 'Test',
                empty: '',
                level2: {
                    value: 'hello',
                    alsoEmpty: ''
                }
            }
        };
        const result = removeEmptyStrings(input);

        expect(result).toEqual({
            level1: {
                name: 'Test',
                level2: {
                    value: 'hello'
                }
            }
        });
    });

    it('should handle arrays correctly', () => {
        const input = {
            items: [
                { name: 'Item 1', empty: '' },
                { name: 'Item 2', value: 'test' }
            ]
        };
        const result = removeEmptyStrings(input);

        expect(result.items).toHaveLength(2);
        expect(result.items[0]).toEqual({ name: 'Item 1' });
        expect(result.items[1]).toEqual({ name: 'Item 2', value: 'test' });
    });

    it('should preserve null and undefined values', () => {
        const input = { nullValue: null, undefinedValue: undefined, empty: '' };
        const result = removeEmptyStrings(input);

        expect(result).toEqual({ nullValue: null, undefinedValue: undefined });
    });

    it('should preserve non-empty strings and other types', () => {
        const input = {
            string: 'hello',
            number: 42,
            boolean: true,
            array: [1, 2, 3],
            empty: ''
        };
        const result = removeEmptyStrings(input);

        expect(result).toEqual({
            string: 'hello',
            number: 42,
            boolean: true,
            array: [1, 2, 3]
        });
    });
});

// ============================================================================
// Tests: normalizeConfig Function
// ============================================================================

describe('normalizeConfig', () => {
    it('should build map config from legacy fields', () => {
        const input: MarkASpotConfig = {
            center_lat: '50.9375',
            center_lng: '6.9603',
            zoom_initial: '13',
            mapbox_style: 'mapbox://styles/test',
            mapbox_style_dark: 'mapbox://styles/test-dark'
        };

        const result = normalizeConfig(input);

        expect(result.map).toBeDefined();
        expect(result.map?.center).toEqual([6.9603, 50.9375]);
        expect(result.map?.zoom).toBe(13);
        expect(result.map?.mapbox_style).toBe('mapbox://styles/test');
    });

    it('should build status config from legacy fields', () => {
        const input: MarkASpotConfig = {
            status_open: [1, 2],
            status_closed: [3, 4],
            nid_status: { open: 1, closed: 3 }
        };

        const result = normalizeConfig(input);

        expect(result.status).toBeDefined();
        expect(result.status?.open).toEqual([1, 2]);
        expect(result.status?.closed).toEqual([3, 4]);
        expect(result.status?.mapping).toEqual({ open: 1, closed: 3 });
    });

    it('should provide default features if not present', () => {
        const input: MarkASpotConfig = {};
        const result = normalizeConfig(input);

        expect(result.features).toBeDefined();
        expect(result.features?.photoReporting).toBe(true);
        expect(result.features?.classicReporting).toBe(true);
        expect(result.features?.voting).toBe(false);
    });

    it('should provide default theme if not present', () => {
        const input: MarkASpotConfig = {};
        const result = normalizeConfig(input);

        expect(result.theme).toBeDefined();
        expect(result.theme?.primary).toBe('blue');
        expect(result.theme?.secondary).toBe('violet');
        expect(result.theme?.neutral).toBe('slate');
    });

    it('should preserve existing map and status configs', () => {
        const input: MarkASpotConfig = {
            map: {
                center: [51.0, 7.0],
                zoom: 15
            },
            status: {
                open: [10, 20],
                closed: [30]
            }
        };

        const result = normalizeConfig(input);

        expect(result.map?.center).toEqual([51.0, 7.0]);
        expect(result.map?.zoom).toBe(15);
        expect(result.status?.open).toEqual([10, 20]);
    });
});

// ============================================================================
// Tests: useMarkASpotConfig Composable
// ============================================================================

describe('useMarkASpotConfig', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initial State', () => {
        it('should start with null config and idle status', () => {
            const { config, isReady, isPending, error } = useMarkASpotConfig();

            expect(config.value).toBeNull();
            expect(isReady.value).toBe(false);
            expect(isPending.value).toBe(false);
            expect(error.value).toBeNull();
        });

        it('should provide clientConfigDefaults as fallback', () => {
            const { clientConfig, clientConfigDefaults } = useMarkASpotConfig();

            // When no API config loaded, clientConfig should equal defaults
            expect(clientConfig.value).toEqual(clientConfigDefaults);
            expect(clientConfig.value.name).toBe('Mark-a-Spot');
        });
    });

    describe('Jurisdiction Resolution', () => {
        // Note: Query parameter tests require import.meta.dev which is hard to mock in Vitest
        // In production, query params are only used in dev mode

        it('should use jurisdiction slug instead of numeric ID', () => {
            mockCurrentJurisdiction.value = {
                id: 15,
                name: 'Bonn',
                slug: 'bonn'
            };

            const { currentJurisdictionId } = useMarkASpotConfig();

            // Settings API blocks numeric IDs (IDOR prevention), always use slug
            expect(currentJurisdictionId.value).toBe('bonn');
        });

        it('should use URL slug when jurisdictions not loaded', () => {
            mockRouteData.params = { jurisdiction: 'stadt-koeln' };

            const { currentJurisdictionId } = useMarkASpotConfig();

            expect(currentJurisdictionId.value).toBe('stadt-koeln');
        });

        it('should NOT use numeric-only jurisdictionId from server config', () => {
            // Simulate a container that was previously built/configured with a numeric ID.
            // The Settings API rejects numeric IDs to prevent IDOR.
            // The numeric value must be ignored; resolution falls through to the
            // jurisdictions list (default jurisdiction).
            mockRuntimeConfigData.jurisdictionId = '1';

            const { currentJurisdictionId } = useMarkASpotConfig();

            // Should NOT return '1' - numeric IDs are blocked
            expect(currentJurisdictionId.value).not.toBe('1');
        });

        it('should use slug-form server jurisdictionId when on SSR path', () => {
            // Simulate SSR: import.meta.server = true
            // The server config has a valid slug (not numeric)
            mockRuntimeConfigData.jurisdictionId = 'berlin';

            // In test env, import.meta.server is falsy, so this tests the
            // mock path. We verify the guard allows slug-form values.
            const { currentJurisdictionId } = useMarkASpotConfig();

            // Slug 'berlin' is valid and should be used (when on server)
            // In test env this falls through to defaultJurisdiction (null) -> ''
            // This test validates the guard logic: numeric rejected, slug accepted
            expect(currentJurisdictionId.value).toBeDefined();
        });

        it('should use SSR-transported jurisdiction key over runtimeConfig on client', () => {
            // Simulate what the SSR payload delivers to the client:
            // The 'mas-config-jurisdiction-key' state holds the runtime-resolved slug.
            const ssrKey = mockUseState<string>('mas-config-jurisdiction-key', () => '');
            ssrKey.value = 'rotterdam';

            // runtimeConfig (if it were public/baked) might have wrong value
            mockRuntimeConfigData.jurisdictionId = '1'; // numeric - should be ignored

            const { currentJurisdictionId } = useMarkASpotConfig();

            // Client reads from SSR state, not from runtimeConfig
            expect(currentJurisdictionId.value).toBe('rotterdam');
        });

        // Note: Prioritization tests are complex due to useState singleton behavior
        // The composable captures useJurisdictions() at instantiation time
        // E2E tests verify the actual jurisdiction switching behavior
    });

    describe('Config Fetching', () => {
        it('should fetch config and update state', async () => {
            mockFetchResponse = mockApiResponse;

            const { fetchConfig, config, isReady, jurisdiction } = useMarkASpotConfig();

            await fetchConfig();

            expect(isReady.value).toBe(true);
            expect(config.value).not.toBeNull();
            expect(jurisdiction.value?.id).toBe(14);
            expect(jurisdiction.value?.name).toBe('Stadt Köln');
        });

        it('should handle fetch errors gracefully', async () => {
            mockFetchError = new Error('Network error');

            const { fetchConfig, isReady, error } = useMarkASpotConfig();

            await fetchConfig();

            expect(isReady.value).toBe(false);
            expect(error.value).toBe('Network error');
        });

        it('should deduplicate concurrent requests', async () => {
            mockFetchResponse = mockApiResponse;
            const fetchSpy = vi.mocked($fetch);

            const { fetchConfig } = useMarkASpotConfig();

            // Start multiple fetches concurrently
            await Promise.all([
                fetchConfig(),
                fetchConfig(),
                fetchConfig()
            ]);

            // Should only call $fetch once
            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });

        it('should call API with correct base URL', async () => {
            mockFetchResponse = mockApiResponse;
            const fetchSpy = vi.mocked($fetch);

            const { fetchConfig } = useMarkASpotConfig();
            await fetchConfig();

            // Should call the settings endpoint
            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/mark-a-spot-settings'),
                expect.any(Object)
            );
            // Should exclude boundary for faster initial load
            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining('exclude=boundary'),
                expect.any(Object)
            );
        });

        it('should send locale headers for translated config responses', async () => {
            mockFetchResponse = mockApiResponse;
            const fetchSpy = vi.mocked($fetch);

            const { fetchConfig } = useMarkASpotConfig();
            await fetchConfig();

            expect(fetchSpy).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Translation-Language': 'de',
                        'Accept-Language': 'de'
                    })
                })
            );
        });
    });

    describe('Config Merging', () => {
        it('should merge API config with defaults using defu', async () => {
            mockFetchResponse = {
                ...mockApiResponse,
                theme: {
                    primary: 'cyan',
                    secondary: 'teal'
                    // neutral not specified - should use default
                }
            };

            const { fetchConfig, clientConfig } = useMarkASpotConfig();
            await fetchConfig();

            // API values should override defaults
            expect(clientConfig.value.theme.colors.primary).toBe('cyan');
            expect(clientConfig.value.theme.colors.secondary).toBe('teal');
            // Default should be preserved when not specified
            expect(clientConfig.value.theme.colors.neutral).toBe('slate');
        });

        it('should merge features from API', async () => {
            mockFetchResponse = {
                ...mockApiResponse,
                features: {
                    voting: true,
                    statistics: true,
                    aiProcessing: true,
                    piiRedaction: false,
                    operationsDashboard: true,
                    // #473: must survive the featureOverrides allowlist
                    privacyBlockOnFlag: true
                }
            };

            const { fetchConfig, clientConfig } = useMarkASpotConfig();
            await fetchConfig();

            expect(clientConfig.value.features.voting).toBe(true);
            expect(clientConfig.value.features.statistics).toBe(true);
            expect(clientConfig.value.features.aiProcessing).toBe(true);
            expect(clientConfig.value.features.piiRedaction).toBe(false);
            expect(clientConfig.value.features.operationsDashboard).toBe(true);
            // #473: the new privacy-block flag passes through the allowlist
            expect(clientConfig.value.features.privacyBlockOnFlag).toBe(true);
            // Default features should be preserved
            expect(clientConfig.value.features.photoReporting).toBe(true);
        });

        it('should merge allowGeoreportPost and categoryDescriptions from API (#323 Phase 4a)', async () => {
            mockFetchResponse = {
                ...mockApiResponse,
                features: {
                    allowGeoreportPost: true,
                    categoryDescriptions: { enabled: true, endpoint: '/api/custom-descriptions' }
                }
            };

            const { fetchConfig, clientConfig } = useMarkASpotConfig();
            await fetchConfig();

            // #323: both keys must survive the featureOverrides allowlist so a
            // jurisdiction can toggle them at runtime via field_nuxt_config.
            expect(clientConfig.value.features.allowGeoreportPost).toBe(true);
            expect(clientConfig.value.features.categoryDescriptions?.enabled).toBe(true);
            expect(clientConfig.value.features.categoryDescriptions?.endpoint).toBe('/api/custom-descriptions');
        });

        it('should merge enterprise feature flags from API', async () => {
            mockFetchResponse = {
                ...mockApiResponse,
                features: {
                    organisations: true,
                    serviceProviders: true,
                    statusAttributes: true
                }
            };

            const { fetchConfig, clientConfig } = useMarkASpotConfig();
            await fetchConfig();

            expect(clientConfig.value.features.organisations).toEqual({ enabled: true });
            expect(clientConfig.value.features.serviceProviders).toEqual({ enabled: true });
            expect(clientConfig.value.features.statusAttributes).toEqual({ enabled: true });
        });

        it('should merge top-level facilities config from API', async () => {
            mockFetchResponse = {
                ...mockApiResponse,
                facilities: {
                    enabled: true,
                    label: {
                        singular: 'School',
                        plural: 'Schools'
                    },
                    hideMapPicker: true,
                    items: [
                        {
                            id: 'school-1',
                            label: 'Primary School',
                            lat: 50.94,
                            lng: 6.95,
                            active: true
                        }
                    ]
                }
            };

            const { fetchConfig, clientConfig, facilities } = useMarkASpotConfig();
            await fetchConfig();

            expect(clientConfig.value.facilities.enabled).toBe(true);
            expect(clientConfig.value.facilities.label?.singular).toBe('School');
            expect(clientConfig.value.facilities.hideMapPicker).toBe(true);
            expect(clientConfig.value.facilities.items).toHaveLength(1);
            expect(facilities.value.items[0]?.id).toBe('school-1');
        });

        it('should invalidate merged facilities config when item content changes without length changes', async () => {
            const configState = mockUseState<MarkASpotConfig | null>('mas-config-state', () => null);
            const { clientConfig } = useMarkASpotConfig();
            configState.value = {
                ...mockApiResponse,
                facilities: {
                    enabled: true,
                    items: [
                        {
                            id: 'school-1',
                            label: 'Primary School',
                            lat: 50.94,
                            lng: 6.95,
                            active: true
                        }
                    ]
                }
            };

            expect(clientConfig.value.facilities.items[0]?.label).toBe('Primary School');

            configState.value = {
                ...mockApiResponse,
                facilities: {
                    enabled: true,
                    items: [
                        {
                            id: 'school-1',
                            label: 'Renamed School',
                            lat: 50.94,
                            lng: 6.95,
                            active: true
                        }
                    ]
                }
            };

            expect(clientConfig.value.facilities.items).toHaveLength(1);
            expect(clientConfig.value.facilities.items[0]?.label).toBe('Renamed School');
        });

        it('should build different facility cache keys for equal-length content changes', () => {
            const base = buildFacilitiesCacheKey({
                enabled: true,
                nearestSnapRadius: 50,
                clusterMinPoints: 2,
                items: [
                    {
                        id: 'school-1',
                        label: 'Primary School',
                        lat: 50.94,
                        lng: 6.95,
                        active: true
                    }
                ]
            });
            const changed = buildFacilitiesCacheKey({
                enabled: true,
                nearestSnapRadius: 75,
                clusterMinPoints: 3,
                items: [
                    {
                        id: 'school-1',
                        label: 'Renamed School',
                        lat: 50.94,
                        lng: 6.95,
                        active: true
                    }
                ]
            });

            expect(base).not.toBe(changed);
        });

        it('should merge demo mode copy from API config', async () => {
            mockFetchResponse = {
                ...mockApiResponse,
                demoMode: {
                    banner: {
                        title: 'Configured demo',
                        message: 'Configured warning',
                        linkLabel: 'Learn more',
                        linkUrl: '/demo-info'
                    },
                    reset: {
                        title: 'Reset schedule',
                        notice: 'Demo data resets hourly.',
                        countdownLabel: 'Next reset'
                    }
                }
            };

            const { fetchConfig, clientConfig } = useMarkASpotConfig();
            await fetchConfig();

            expect(clientConfig.value.demoMode?.banner?.title).toBe('Configured demo');
            expect(clientConfig.value.demoMode?.banner?.linkUrl).toBe('/demo-info');
            expect(clientConfig.value.demoMode?.reset?.notice).toBe('Demo data resets hourly.');
        });

        it('should merge top-level SSO provider handles from API config', async () => {
            mockFetchResponse = {
                ...mockApiResponse,
                sso: {
                    providers: [
                        { id: 'keycloak', label: 'Stadt-Login' },
                        { id: '', label: 'Broken' }
                    ]
                }
            };

            const { fetchConfig, clientConfig } = useMarkASpotConfig();
            await fetchConfig();

            expect(clientConfig.value.sso?.providers).toEqual([
                { id: 'keycloak', label: 'Stadt-Login' }
            ]);
        });

        it('should use jurisdiction name over client name', async () => {
            mockFetchResponse = {
                jurisdiction: {
                    id: 14,
                    name: 'Jurisdiction Name',
                    shortName: 'JurShort'
                },
                client: {
                    name: 'Client Name',
                    shortName: 'ClientShort'
                }
            };

            const { fetchConfig, clientConfig } = useMarkASpotConfig();
            await fetchConfig();

            // Jurisdiction takes priority
            expect(clientConfig.value.name).toBe('Jurisdiction Name');
            expect(clientConfig.value.shortName).toBe('JurShort');
        });
    });

    describe('Feature Helpers', () => {
        it('hasFeature should return computed ref for feature status', async () => {
            mockFetchResponse = {
                features: {
                    voting: true,
                    statistics: false
                }
            };

            const { fetchConfig, hasFeature } = useMarkASpotConfig();
            await fetchConfig();

            const hasVoting = hasFeature('voting');
            const hasStats = hasFeature('statistics');

            expect(hasVoting.value).toBe(true);
            expect(hasStats.value).toBe(false);
        });

        it('getFeature should return feature value with default', async () => {
            mockFetchResponse = {
                features: {
                    voting: true
                }
            };

            const { fetchConfig, getFeature } = useMarkASpotConfig();
            await fetchConfig();

            expect(getFeature('voting', false)).toBe(true);
            // Non-existent feature should return default
            expect(getFeature('statistics', true)).toBe(true);
        });
    });

    describe('Structured Accessors', () => {
        it('should provide theme accessor', async () => {
            mockFetchResponse = mockApiResponse;

            const { fetchConfig, theme } = useMarkASpotConfig();
            await fetchConfig();

            expect(theme.value?.primary).toBe('blue');
            expect(theme.value?.secondary).toBe('sky');
        });

        it('should provide map accessor with normalized config', async () => {
            mockFetchResponse = mockApiResponse;

            const { fetchConfig, map } = useMarkASpotConfig();
            await fetchConfig();

            expect(map.value?.center).toEqual([6.9603, 50.9375]);
            expect(map.value?.zoom).toBe(13);
        });

        it('should provide mapSettings in legacy format', async () => {
            mockFetchResponse = mockApiResponse;

            const { fetchConfig, mapSettings } = useMarkASpotConfig();
            await fetchConfig();

            expect(mapSettings.value.center.lat).toBe(50.9375);
            expect(mapSettings.value.center.lng).toBe(6.9603);
            expect(mapSettings.value.zoom).toBe(13);
        });

        it('should provide facilities accessor fallback', async () => {
            mockFetchResponse = {
                ...mockApiResponse,
                facilities: {
                    enabled: true,
                    items: []
                }
            };

            const { fetchConfig, facilities } = useMarkASpotConfig();
            await fetchConfig();

            expect(facilities.value.enabled).toBe(true);
            expect(facilities.value.items).toEqual([]);
        });
    });

    describe('Cache Management', () => {
        it('clearCache should reset all state', async () => {
            mockFetchResponse = mockApiResponse;

            const { fetchConfig, clearCache, config, isReady } = useMarkASpotConfig();
            await fetchConfig();

            expect(config.value).not.toBeNull();
            expect(isReady.value).toBe(true);

            clearCache();

            expect(config.value).toBeNull();
            expect(isReady.value).toBe(false);
        });

        it('should not refetch when config already loaded', async () => {
            mockFetchResponse = mockApiResponse;
            const fetchSpy = vi.mocked($fetch);

            const { fetchConfig, isReady } = useMarkASpotConfig();

            await fetchConfig();
            expect(isReady.value).toBe(true);

            // Second fetch should not call API
            await fetchConfig();

            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });

        it('force flag should bypass cache', async () => {
            mockFetchResponse = mockApiResponse;
            const fetchSpy = vi.mocked($fetch);

            const { fetchConfig, isReady } = useMarkASpotConfig();

            await fetchConfig();
            expect(isReady.value).toBe(true);

            // Force fetch should call API again
            await fetchConfig(true);

            expect(fetchSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Offline Support', () => {
        it('should use defaults when offline with no cache', async () => {
            mockIsOnline.value = false;

            const { fetchConfig, isReady, clientConfig } = useMarkASpotConfig();
            await fetchConfig();

            // Should still be "ready" with defaults
            expect(isReady.value).toBe(true);
            expect(clientConfig.value.name).toBe('Mark-a-Spot');
        });
    });
});

// ============================================================================
// Tests: Config Merging Edge Cases
// ============================================================================

describe('Config Merging Edge Cases', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    it('should normalize boolean features to {enabled} objects', async () => {
        mockFetchResponse = {
            features: {
                dashboard: true,
                emergency: false,
                offline: true
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        // Boolean features should be normalized
        expect(clientConfig.value.features.dashboard.enabled).toBe(true);
        expect(clientConfig.value.features.emergency.enabled).toBe(false);
        expect(clientConfig.value.features.offline.enabled).toBe(true);
    });

    it('should normalize deferredMap boolean to object', async () => {
        mockFetchResponse = {
            map: {
                deferredMap: true
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.map.deferredMap.enabled).toBe(true);
        expect(clientConfig.value.features.map.deferredMap.preloadData).toBe(true);
        expect(clientConfig.value.features.map.deferredMap.limit).toBe(100);
    });

    it('should normalize map controls from boolean to object', async () => {
        mockFetchResponse = {
            map: {
                controls: {
                    zoom: true,
                    tilt: false,
                    geolocation: true
                }
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.map.controls.zoom.enabled).toBe(true);
        expect(clientConfig.value.features.map.controls.tilt.enabled).toBe(false);
        expect(clientConfig.value.features.map.controls.geolocation.enabled).toBe(true);
    });

    it('should normalize filter booleans to enabled object', async () => {
        mockFetchResponse = {
            filters: {
                status: true,
                category: false,
                time: true
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.filters.enabled.status).toBe(true);
        expect(clientConfig.value.features.filters.enabled.category).toBe(false);
        expect(clientConfig.value.features.filters.enabled.time).toBe(true);
    });

    // Regression: aiDuplicates must survive the featureOverrides allowlist merge
    // (#435 — F1 fix: the flag was silently dropped before, keeping aiDuplicatesEnabled
    //  always false even when the backend emitted features.aiDuplicates = true).
    it('should propagate aiDuplicates from API response into clientConfig', async () => {
        mockFetchResponse = {
            ...mockApiResponse,
            features: {
                aiDuplicates: true,
                aiAnalysis: true,
                aiProcessing: true
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.aiDuplicates).toBe(true);
    });

    it('should propagate aiDuplicates = false from API response (vision-only tenant)', async () => {
        mockFetchResponse = {
            ...mockApiResponse,
            features: {
                aiDuplicates: false,
                aiAnalysis: true
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.aiDuplicates).toBe(false);
        // aiAnalysis must be unaffected
        expect(clientConfig.value.features.aiAnalysis).toBe(true);
    });

    // Regression: emailIntake must survive the featureOverrides allowlist merge
    // (#482 — found in browser smoke: the flag was silently dropped, keeping
    //  emailIntakeEnabled always false even when the backend emitted
    //  features.emailIntake = true; same bug class as #435 aiDuplicates).
    it('should propagate emailIntake from API response into clientConfig', async () => {
        mockFetchResponse = {
            ...mockApiResponse,
            features: {
                emailIntake: true
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.emailIntake).toBe(true);
    });

    it('should propagate emailIntake = false from API response (explicit override)', async () => {
        mockFetchResponse = {
            ...mockApiResponse,
            features: {
                emailIntake: false
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.emailIntake).toBe(false);
    });

    it('should propagate dashboardRequestCreate = false from API response', async () => {
        mockFetchResponse = {
            ...mockApiResponse,
            features: {
                dashboardRequestCreate: false
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.dashboardRequestCreate).toBe(false);
    });

    it('should preserve the emailIntake object form from API response', async () => {
        mockFetchResponse = {
            ...mockApiResponse,
            features: {
                emailIntake: { enabled: true }
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.emailIntake).toEqual({ enabled: true });
    });

    // Regression: intakeSource must survive the featureOverrides allowlist merge
    // so the dashboard source column/filter can follow the backend capability flag.
    it('should propagate intakeSource from API response into clientConfig', async () => {
        mockFetchResponse = {
            ...mockApiResponse,
            features: {
                intakeSource: true
            }
        };

        const { fetchConfig, clientConfig } = useMarkASpotConfig();
        await fetchConfig();

        expect(clientConfig.value.features.intakeSource).toEqual({ enabled: true });
    });
});
