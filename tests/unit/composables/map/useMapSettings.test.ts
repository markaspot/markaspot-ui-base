import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';

// Import after mocks are set up
import { useMapSettings } from '@/composables/map/useMapSettings';

/**
 * Unit Tests for useMapSettings Composable
 *
 * Tests the map configuration layer that:
 * - Provides default zoom thresholds for heatmap/cluster/marker visibility
 * - Reads clusterMaxZoom from jurisdiction config (source-level clustering)
 * - Merges layerVisibility overrides onto static defaults
 *
 * @see /app/composables/map/useMapSettings.ts
 */

// ============================================================================
// Mock Dependencies
// ============================================================================

// Reactive mock for clientConfig - tests can modify this to simulate
// different jurisdiction configurations from Drupal.
const mockClientConfig = ref<any>(null);

vi.stubGlobal('useMarkASpotConfig', () => ({
    clientConfig: computed(() => mockClientConfig.value)
}));

// ============================================================================
// Tests
// ============================================================================

describe('useMapSettings', () => {
    beforeEach(() => {
        mockClientConfig.value = null;
    });

    // ========================================================================
    // Default Values (no jurisdiction config)
    // ========================================================================

    describe('defaults without jurisdiction config', () => {
        it('should return clusterMaxZoom = 22', () => {
            const { clusterMaxZoom } = useMapSettings();
            expect(clusterMaxZoom.value).toBe(22);
        });

        it('should return default heatmap zoom levels', () => {
            const { zoomLevels } = useMapSettings();
            expect(zoomLevels.value.heatmap).toEqual({
                minZoom: 0,
                maxZoom: 11,
                fadeOut: true
            });
        });

        it('should return default cluster minZoom = 10', () => {
            const { zoomLevels } = useMapSettings();
            expect(zoomLevels.value.clusters.minZoom).toBe(10);
        });

        it('should return default marker minZoom = 14', () => {
            const { zoomLevels } = useMapSettings();
            expect(zoomLevels.value.markers.minZoom).toBe(14);
        });
    });

    // ========================================================================
    // clusterMaxZoom Override
    // ========================================================================

    describe('clusterMaxZoom from jurisdiction config', () => {
        it('should use config value when provided', () => {
            mockClientConfig.value = {
                features: { map: { clusterMaxZoom: 16 } }
            };

            const { clusterMaxZoom } = useMapSettings();
            expect(clusterMaxZoom.value).toBe(16);
        });

        it('should fall back to 22 when config has no clusterMaxZoom', () => {
            mockClientConfig.value = {
                features: { map: {} }
            };

            const { clusterMaxZoom } = useMapSettings();
            expect(clusterMaxZoom.value).toBe(22);
        });

        it('should react to config changes', () => {
            mockClientConfig.value = null;
            const { clusterMaxZoom } = useMapSettings();

            expect(clusterMaxZoom.value).toBe(22);

            // Simulate jurisdiction config arriving from API
            mockClientConfig.value = {
                features: { map: { clusterMaxZoom: 18 } }
            };

            expect(clusterMaxZoom.value).toBe(18);
        });
    });

    // ========================================================================
    // Layer Visibility Overrides
    // ========================================================================

    describe('zoomLevels with layerVisibility overrides', () => {
        it('should merge partial heatmap override', () => {
            mockClientConfig.value = {
                features: {
                    map: {
                        layerVisibility: {
                            heatmap: { maxZoom: 14 }
                        }
                    }
                }
            };

            const { zoomLevels } = useMapSettings();

            // Overridden value
            expect(zoomLevels.value.heatmap.maxZoom).toBe(14);
            // Preserved defaults
            expect(zoomLevels.value.heatmap.minZoom).toBe(0);
            expect(zoomLevels.value.heatmap.fadeOut).toBe(true);
        });

        it('should merge cluster minZoom override', () => {
            mockClientConfig.value = {
                features: {
                    map: {
                        layerVisibility: {
                            clusters: { minZoom: 8 }
                        }
                    }
                }
            };

            const { zoomLevels } = useMapSettings();
            expect(zoomLevels.value.clusters.minZoom).toBe(8);
            // Other layers keep defaults
            expect(zoomLevels.value.markers.minZoom).toBe(14);
        });

        it('should merge marker minZoom override', () => {
            mockClientConfig.value = {
                features: {
                    map: {
                        layerVisibility: {
                            markers: { minZoom: 12 }
                        }
                    }
                }
            };

            const { zoomLevels } = useMapSettings();
            expect(zoomLevels.value.markers.minZoom).toBe(12);
        });

        it('should handle all layers overridden at once', () => {
            mockClientConfig.value = {
                features: {
                    map: {
                        layerVisibility: {
                            heatmap: { minZoom: 2, maxZoom: 9, fadeOut: false },
                            clusters: { minZoom: 6 },
                            markers: { minZoom: 10 }
                        }
                    }
                }
            };

            const { zoomLevels } = useMapSettings();

            expect(zoomLevels.value.heatmap).toEqual({
                minZoom: 2,
                maxZoom: 9,
                fadeOut: false
            });
            expect(zoomLevels.value.clusters.minZoom).toBe(6);
            expect(zoomLevels.value.markers.minZoom).toBe(10);
        });

        it('should return static defaults when layerVisibility is absent', () => {
            mockClientConfig.value = {
                features: { map: {} }
            };

            const { zoomLevels } = useMapSettings();

            // Should return the exact same reference as the static default
            expect(zoomLevels.value.heatmap.maxZoom).toBe(11);
            expect(zoomLevels.value.clusters.minZoom).toBe(10);
            expect(zoomLevels.value.markers.minZoom).toBe(14);
        });

        it('should handle empty layerVisibility object', () => {
            mockClientConfig.value = {
                features: {
                    map: {
                        layerVisibility: {}
                    }
                }
            };

            const { zoomLevels } = useMapSettings();

            // Spread of undefined is a no-op, so defaults remain
            expect(zoomLevels.value.heatmap.maxZoom).toBe(11);
            expect(zoomLevels.value.clusters.minZoom).toBe(10);
            expect(zoomLevels.value.markers.minZoom).toBe(14);
        });
    });

    // ========================================================================
    // Reactivity
    // ========================================================================

    describe('reactivity', () => {
        it('should update zoomLevels when config changes', () => {
            mockClientConfig.value = null;
            const { zoomLevels } = useMapSettings();

            expect(zoomLevels.value.markers.minZoom).toBe(14);

            // Config arrives from API
            mockClientConfig.value = {
                features: {
                    map: {
                        layerVisibility: {
                            markers: { minZoom: 10 }
                        }
                    }
                }
            };

            expect(zoomLevels.value.markers.minZoom).toBe(10);
        });

        it('should revert to defaults when config is cleared', () => {
            mockClientConfig.value = {
                features: {
                    map: {
                        clusterMaxZoom: 16,
                        layerVisibility: {
                            markers: { minZoom: 10 }
                        }
                    }
                }
            };

            const { clusterMaxZoom, zoomLevels } = useMapSettings();

            expect(clusterMaxZoom.value).toBe(16);
            expect(zoomLevels.value.markers.minZoom).toBe(10);

            // Config cleared (e.g., jurisdiction switch)
            mockClientConfig.value = null;

            expect(clusterMaxZoom.value).toBe(22);
            expect(zoomLevels.value.markers.minZoom).toBe(14);
        });
    });
});
