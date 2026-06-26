import type { Map as MapLibreMap, LngLat, GeoJSONSource } from 'maplibre-gl';

interface DeclusterAnimationConfig {
    enabled: boolean
    duration: number
}

/**
 * Composable for animated decluster transitions.
 *
 * When zooming into a cluster, child pins animate outward from the
 * cluster center using temporary HTML div markers with CSS transitions.
 * Disabled by default, respects prefers-reduced-motion.
 */
export function useDeclusterAnimation(map: MapLibreMap) {
    const { declusterAnimation } = useMapSettings();

    // Track active animation for cleanup on re-invocation or unmount
    let activeTimeout: ReturnType<typeof setTimeout> | null = null;
    let activeMarkers: HTMLDivElement[] = [];

    /**
     * Remove all temporary markers and cancel pending timeout.
     */
    function cleanup(): void {
        if (activeTimeout) {
            clearTimeout(activeTimeout);
            activeTimeout = null;
        }
        activeMarkers.forEach(el => el.remove());
        activeMarkers = [];
    }

    /**
     * Animate child features outward from cluster center.
     *
     * Flow:
     * 1. Get cluster leaves via getClusterLeaves (max 20)
     * 2. Create temp div elements at cluster screen position
     * 3. Apply CSS transition to move to real screen positions
     * 4. Remove temp elements after animation completes
     *
     * Respects prefers-reduced-motion (skips animation entirely).
     */
    async function animateDecluster(
        clusterId: number,
        clusterCenter: LngLat,
        onComplete?: () => void
    ): Promise<void> {
        const config = declusterAnimation.value;
        if (!config.enabled) {
            onComplete?.();
            return;
        }

        // Respect reduced motion preference
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            onComplete?.();
            return;
        }

        const rawSource = map.getSource('reports-geojson');
        if (!rawSource || rawSource.type !== 'geojson') {
            onComplete?.();
            return;
        }
        const source = rawSource as GeoJSONSource;

        try {
            // Clean up any in-flight animation before starting a new one
            cleanup();

            const leaves = await source.getClusterLeaves(clusterId, 20, 0);
            if (!leaves || leaves.length === 0) {
                onComplete?.();
                return;
            }

            const duration = config.duration;
            const centerPixel = map.project(clusterCenter);
            const container = map.getCanvasContainer();

            // Create temporary markers at cluster center
            const targetPositions: { x: number, y: number }[] = [];

            leaves.forEach((feature) => {
                const geom = feature.geometry;
                // Cluster leaves are always Points; guard for type-safety
                if (!geom || geom.type !== 'Point') return;
                const coords = geom.coordinates as [number, number];

                const targetPixel = map.project(coords);
                targetPositions.push({ x: targetPixel.x, y: targetPixel.y });

                const el = document.createElement('div');
                el.className = 'decluster-marker';

                // Validate color to prevent CSS injection (data comes from Drupal, but defense-in-depth)
                const rawColor = feature.properties?.color || '#6366f1';
                const color = /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : '#6366f1';
                el.style.cssText = `
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: ${color};
                    border: 2px solid white;
                    left: ${centerPixel.x - 6}px;
                    top: ${centerPixel.y - 6}px;
                    transition: transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
                    pointer-events: none;
                    z-index: 10;
                `;

                container.appendChild(el);
                activeMarkers.push(el);
            });

            // Trigger animation on next frame (CSS needs the initial position rendered first)
            requestAnimationFrame(() => {
                activeMarkers.forEach((el, i) => {
                    const target = targetPositions[i];
                    if (!target) return;
                    const dx = target.x - centerPixel.x;
                    const dy = target.y - centerPixel.y;
                    el.style.transform = `translate(${dx}px, ${dy}px)`;
                });
            });

            // Clean up after animation
            activeTimeout = setTimeout(() => {
                cleanup();
                onComplete?.();
            }, duration + 50);
        } catch (error) {
            console.warn('[useDeclusterAnimation] Error:', error);
            onComplete?.();
        }
    }

    // Teardown is owner-driven: useSpiderfy.cleanup() calls declusterAnim.cleanup(),
    // which is reached via useMap.cleanup() on the map component's onUnmounted.
    // (No onScopeDispose here: useDeclusterAnimation is instantiated from useSpiderfy
    // inside useMap, which runs in the map 'load' callback rather than a synchronous
    // component setup, so there is no active effect scope to attach to.)

    return { animateDecluster, cleanup };
}
