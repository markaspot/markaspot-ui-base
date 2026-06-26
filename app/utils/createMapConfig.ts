import type { RequestParameters } from 'maplibre-gl';

/**
 * Create MapLibre GL map configuration with performance optimizations
 */
export function createMapConfig(options: {
    container: HTMLElement
    center: [number, number]
    zoom: number
    attributionControl: boolean
    logoPosition: string
    preserveDrawingBuffer?: boolean
    transformRequest?: (url: string, resourceType: string) => RequestParameters
}) {
    const { container, center, zoom, attributionControl, logoPosition, preserveDrawingBuffer, transformRequest: customTransformRequest } = options;

    return {
        container,
        center,
        zoom,
        pitch: 30, // Start with maximum tilt
        maxPitch: 60, // Maximum recommended pitch angle
        attributionControl,
        logoPosition: logoPosition as any,
        trackResize: true,
        interactive: true,
        // Reduce unnecessary rendering and memory
        renderWorldCopies: false,
        // v5 Performance optimizations for smoother zooming
        antialias: false, // Better performance without antialiasing
        preserveDrawingBuffer: preserveDrawingBuffer ?? false, // Enable for print canvas capture
        refreshExpiredTiles: false, // Don't refresh expired tiles automatically
        fadeDuration: 100, // Much faster fade transitions for responsive zoom
        crossSourceCollisions: false, // Better symbol performance
        collectResourceTiming: false, // Disable resource timing collection
        maxParallelImageRequests: 16, // v5 supports more parallel requests
        // Increased tile cache for smoother zoom performance
        maxTileCacheSize: 200,
        // Additional performance optimizations for smooth movement
        localIdeographFontFamily: false, // Disable expensive font rendering
        optimizeForTerrain: false, // Disable terrain optimizations for better performance
        // Rendering optimizations
        doubleClickZoom: false, // Disabled - custom throttled handler prevents stale map from rapid clicks
        keyboard: true, // Keep keyboard navigation
        dragRotate: true, // Keep rotation but optimized
        touchZoomRotate: true, // Keep touch interactions
        // Disable some expensive features for better performance
        boxZoom: false, // Disable box zoom for better performance
        dragPan: true, // Keep drag pan but with optimizations
        // CRITICAL: Disable smooth scrolling to prevent render loops
        scrollZoom: {
            around: 'center' as const,
            smooth: false // Disable smooth zoom - causes excessive renders
        },
        // Additional aggressive performance settings
        bearingSnap: 7, // Reduce bearing snap sensitivity
        pitchWithRotate: false, // Disable pitch with rotate for better performance
        clickTolerance: 3, // Reduce click tolerance for faster response
        transformRequest: customTransformRequest || ((url: string, resourceType: string) => {
            // Default handling for tile requests
            if (resourceType === 'Tile') {
                return {
                    url,
                    credentials: 'same-origin' as RequestCredentials
                };
            }
            return { url };
        })
    };
}
