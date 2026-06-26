// useMapIcons.ts
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import type { Request } from '~~/types';
import { useColorMode } from '#imports';
import { getContrastingTextColor } from '@/utils/colorUtils';
import { normalizeIconName, getDefaultIconName } from '@/utils/iconUtils';
import { getReportStatusInfo } from '@/utils/reportUtils';
import { computeMagnitude } from '@/utils/magnitudeUtils';
import { getCurrentLocale } from '@/utils/locale';
import { useColorPalette } from './useColorPalette';

/**
 * MapIcons Composable
 *
 * Renders composite pin-style marker icons for the map.
 * Each pin combines a circle with stem ("Füßchen") colored by category/status,
 * with a centered Iconify icon (white or black for contrast).
 *
 * Pin images are registered via map.addImage() and referenced by the symbol layer.
 */

// Pin dimensions (CSS pixels, scaled by devicePixelRatio for rendering)
// Circle marker with straight stem ("Füßchen") - lollipop/pin style
export const PIN_WIDTH = 40;
export const PIN_HEIGHT = 40;
export const PIN_CIRCLE_CX = 20;
export const PIN_CIRCLE_CY = 17;
export const PIN_CIRCLE_R = 14;
export const PIN_ICON_SIZE = 16;
export const PIN_STEM_TOP = 31; // Bottom of circle (CY + R)
export const PIN_STEM_TIP = 38; // Bottom of stem (short foot)

// Derived: offset from pin anchor (stem tip, icon-anchor:bottom) to circle center.
// Used by highlight circles and keyboard navigation to align
// visual overlays with the pin's circle portion.
export const PIN_ANCHOR_TO_CENTER_OFFSET = PIN_STEM_TIP - PIN_CIRCLE_CY; // 21

// Corrected offset for DOM-based markers (Marker class with anchor:'bottom').
// icon-anchor:'bottom' aligns to stem tip (y=38), but Marker anchor:'bottom'
// aligns to the full icon height (y=40), adding ~2px extra.
export const PIN_PULSE_CENTER_OFFSET = PIN_HEIGHT - PIN_CIRCLE_CY; // 23

// Badge dimensions (CSS pixels): flat rounded-square marker used for
// admin-curated POIs (facilities) to visually distinguish them from
// transient report pins. No stem, icon centered.
export const BADGE_WIDTH = 32;
export const BADGE_HEIGHT = 32;
export const BADGE_RADIUS = 8;
export const BADGE_ICON_SIZE = 18;
export const BADGE_ICON_CX = BADGE_WIDTH / 2; // 16
export const BADGE_ICON_CY = BADGE_HEIGHT / 2; // 16

/**
 * Generate a pin SVG: colored circle with border + straight stem
 * Border color adapts to dark/light mode for contrast against map tiles
 */
const createPinSvg = (fillColor: string, borderColor: string, width: number, height: number): string => {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${PIN_WIDTH} ${PIN_HEIGHT}">
        <line x1="${PIN_CIRCLE_CX}" y1="${PIN_STEM_TOP}" x2="${PIN_CIRCLE_CX}" y2="${PIN_STEM_TIP}" stroke="${borderColor}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="${PIN_CIRCLE_CX}" cy="${PIN_CIRCLE_CY}" r="${PIN_CIRCLE_R}" fill="${fillColor}" stroke="${borderColor}" stroke-width="1.5"/>
    </svg>`;
};

/**
 * Generate a badge SVG: flat rounded-rectangle with border, no stem.
 * Used for admin-curated POIs (facilities) so they read as "permanent
 * locations" rather than "individual events" like the report pins.
 */
const createBadgeSvg = (fillColor: string, borderColor: string, width: number, height: number): string => {
    const stroke = 1.5;
    const inset = stroke / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}">
        <rect x="${inset}" y="${inset}" width="${BADGE_WIDTH - stroke}" height="${BADGE_HEIGHT - stroke}" rx="${BADGE_RADIUS}" ry="${BADGE_RADIUS}" fill="${fillColor}" stroke="${borderColor}" stroke-width="${stroke}"/>
    </svg>`;
};

/**
 * Load an SVG string as an HTMLImageElement
 */
const svgStringToImage = (svgString: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
};

// Module-level SVG text cache - survives style changes and composable re-creation
const svgTextCache = new Map<string, string>();

export function useMapIcons(mapInstance: MapLibreMap) {
    const loadedIcons = new Set<string>();
    const pendingLoads = new Map<string, Promise<void>>();
    // Epoch counter incremented on clearIcons(). loadIcon() captures it at start
    // and skips addImage() if it changed, preventing stale in-flight promises
    // from registering untracked images after a style rebuild.
    let clearEpoch = 0;
    const colorMode = useColorMode();
    const { markerBorderColor, magnitudeScaling } = useMapSettings();
    const { getColorIndex } = useColorPalette();

    const getBorderColor = () => {
        const configured = markerBorderColor.value;
        if (configured && configured !== 'auto') return configured;
        return colorMode.value === 'dark' ? '#ffffff' : '#000000';
    };

    // Track the last processed reports to prevent redundant updates
    let lastReportsHash = '';
    let lastUpdatePromise: Promise<void> | null = null;
    let isAnimating = false;
    let isMapInteracting = false;
    // Coalesce force-updates: when a force is requested while an update is in flight,
    // store its args here so the running promise re-runs once on completion instead
    // of recursing. Prevents unbounded await-chains from rapid locale-refresh calls.
    let pendingForceArgs: [Request[] | undefined, string, boolean] | null = null;
    // Track initialization state to prevent unnecessary fade-outs on first load
    let hasEverDisplayedMarkers = false;
    let isInitializing = true;
    let initializationDebounceTimer: NodeJS.Timeout | null = null;

    // Device pixel ratio for crisp rendering on HiDPI displays
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;

    const hashValue = (seed: number, value: string | number | undefined | null): number => {
        const text = String(value || '');
        let hash = seed;

        for (let i = 0; i < text.length; i++) {
            hash = ((hash * 31) + text.charCodeAt(i)) >>> 0;
        }

        return hash;
    };

    const cleanIconName = (iconName: string | undefined): string => {
        const base = iconName && iconName.trim().length > 0 ? iconName : getDefaultIconName();
        // Normalize name for Iconify API
        return normalizeIconName(base);
    };

    /**
     * Convert normalized icon name to Iconify identifier (collection:icon)
     */
    const toIconifyId = (normalizedName: string): string => {
        const match = normalizedName.match(/^([a-z]+)-(.+)$/);
        return match ? `${match[1]}:${match[2]}` : `lucide:${normalizedName}`;
    };

    /**
     * Convert normalized icon name to dynamic icon endpoint URL
     * e.g., 'lucide-trees' → '/api/map-icons?icon=lucide:trees'
     */
    const getIconifyUrl = (normalizedName: string): string => {
        return `/api/map-icons?icon=${toIconifyId(normalizedName)}`;
    };

    /**
     * Batch-prefetch SVG texts for multiple icon names into svgTextCache.
     * Uses the batch endpoint (?icons=...) when more than 3 unique icons
     * need fetching. Individual loadIcon() calls then find them cached.
     */
    const batchPrefetchIcons = async (iconNames: string[]): Promise<void> => {
        // Filter to icons not already cached
        const uncached = iconNames.filter(name => !svgTextCache.has(name));
        if (uncached.length <= 3) return; // Not worth batching for few icons

        const ids = uncached.map(name => toIconifyId(name));
        try {
            const response = await fetch(`/api/map-icons?icons=${ids.join(',')}`);
            if (response.ok) {
                const results = await response.json() as Record<string, string>;
                // Map results back to normalized names and cache (key-based lookup)
                uncached.forEach((name) => {
                    const svg = results[toIconifyId(name)];
                    if (svg) svgTextCache.set(name, svg);
                });
            } else if (import.meta.dev) {
                console.warn(`[useMapIcons] Batch icon prefetch returned HTTP ${response.status} — individual fetches will retry`);
            }
        } catch (err) {
            // Batch failed, individual fetches in loadIcon will handle it
            if (import.meta.dev) {
                console.warn('[useMapIcons] Batch icon prefetch threw — individual fetches will retry:', err);
            }
        }
    };

    /**
     * Colorize an SVG text string: replace fill/stroke/currentColor with the target color.
     * Fills that reference gradients or patterns (fill="url(#...)") are left intact so
     * icons with non-trivial paint servers are not clobbered to a solid color.
     */
    const colorizeIconSvg = (svgText: string, color: string, size: number): string => {
        let result = svgText
            .replace(/(?<![a-z-])width="[^"]*"/gi, '')
            .replace(/(?<![a-z-])height="[^"]*"/gi, '')
            .replace(/<svg/, `<svg width="${size}" height="${size}"`);

        result = result
            // Skip fill="none" and fill="url(#...)" (gradient/pattern references)
            .replace(/fill="(?!none(?:"|$))(?!url\()[^"]*"/g, `fill="${color}"`)
            .replace(/stroke="(?!none")[^"]*"/g, `stroke="${color}"`)
            .replace(/currentColor/g, color);

        if (!result.includes('fill="')) {
            result = result.replace(/<svg([^>]*)>/, `<svg$1 fill="${color}">`);
        }

        return result;
    };

    /**
     * Build the MapLibre image id for a given icon + color + shape + mode.
     * Callers that need to reference the icon from layer expressions (e.g.,
     * icon-image: ['get', 'icon']) should use this instead of hand-building
     * the string to avoid drift if the format ever changes.
     */
    const getIconId = (iconName: string, fillColor: string, shape: 'pin' | 'badge' = 'pin'): string => {
        const cleanName = cleanIconName(iconName);
        const mode = colorMode.value === 'dark' ? 'd' : 'l';
        return `${shape}-${cleanName}-${fillColor.replace('#', '')}-${mode}`;
    };

    /**
     * Load and register a composite icon (shape + category icon).
     * `shape` defaults to 'pin' (report-style drop-pin with stem) but can
     * be 'badge' for admin-curated POIs (flat rounded-square, no stem).
     *
     * Client-only contract: this function uses document.createElement('canvas'),
     * Image, Blob, and URL.createObjectURL. It must only be called after a
     * MapLibre map exists (i.e., on the client). The import.meta.client guard
     * below enforces this explicitly so a future SSR caller gets a safe no-op.
     */
    const loadIcon = async (iconName: string, fillColor: string, shape: 'pin' | 'badge' = 'pin'): Promise<void> => {
        if (!import.meta.client) return;
        if (!iconName || !fillColor) return;

        const cleanName = cleanIconName(iconName);
        const borderColor = getBorderColor();
        const iconId = getIconId(iconName, fillColor, shape);

        // Shape-specific geometry. Kept inline (rather than extracted into
        // a config object) so both shapes stay readable in one function.
        const shapeWidth = shape === 'badge' ? BADGE_WIDTH : PIN_WIDTH;
        const shapeHeight = shape === 'badge' ? BADGE_HEIGHT : PIN_HEIGHT;
        const innerIconSize = shape === 'badge' ? BADGE_ICON_SIZE : PIN_ICON_SIZE;
        const innerIconCx = shape === 'badge' ? BADGE_ICON_CX : PIN_CIRCLE_CX;
        const innerIconCy = shape === 'badge' ? BADGE_ICON_CY : PIN_CIRCLE_CY;

        if (import.meta.dev) {
            const label = shape === 'badge' ? '🏢 Loading badge icon' : '📌 Loading pin icon';
            console.debug(`${label}: "${iconName}" → "${cleanName}" with fill ${fillColor}`);
        }

        // Check if already loaded
        if (loadedIcons.has(iconId)) {
            return;
        }

        // Check if already loading, return existing promise
        if (pendingLoads.has(iconId)) {
            return pendingLoads.get(iconId);
        }

        // Capture epoch so the async body can detect a clearIcons() that ran
        // while awaiting canvas/fetch work and bail before addImage().
        const epochAtStart = clearEpoch;

        // Create loading promise and store it
        const loadPromise = (async () => {
            try {
                // Canvas dimensions at device pixel ratio
                const canvasW = Math.round(shapeWidth * dpr);
                const canvasH = Math.round(shapeHeight * dpr);

                const canvas = document.createElement('canvas');
                canvas.width = canvasW;
                canvas.height = canvasH;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // 1. Render shape (pin drop or flat badge)
                const shapeSvg = shape === 'badge'
                    ? createBadgeSvg(fillColor, borderColor, canvasW, canvasH)
                    : createPinSvg(fillColor, borderColor, canvasW, canvasH);
                const shapeImg = await svgStringToImage(shapeSvg);
                ctx.drawImage(shapeImg, 0, 0, canvasW, canvasH);

                // 2. Fetch (or use cached) and render category icon centered in shape
                try {
                    let svgText = svgTextCache.get(cleanName);
                    if (!svgText) {
                        const iconUrl = getIconifyUrl(cleanName);
                        const response = await fetch(iconUrl);
                        if (response.ok) {
                            svgText = await response.text();
                            svgTextCache.set(cleanName, svgText);
                        } else {
                            console.warn(`⚠️ Icon not found: ${iconUrl} (HTTP ${response.status})`);
                        }
                    }
                    if (svgText) {
                        const iconColor = getContrastingTextColor(fillColor);
                        const iconRenderSize = Math.round(innerIconSize * dpr);
                        const coloredSvg = colorizeIconSvg(svgText, iconColor, iconRenderSize);
                        const iconImg = await svgStringToImage(coloredSvg);

                        // Center icon in the shape (pin circle or badge body)
                        const iconX = Math.round((innerIconCx - innerIconSize / 2) * dpr);
                        const iconY = Math.round((innerIconCy - innerIconSize / 2) * dpr);
                        ctx.drawImage(iconImg, iconX, iconY, iconRenderSize, iconRenderSize);
                    }
                } catch (iconError) {
                    console.warn(`⚠️ Failed to load icon "${iconName}", using plain ${shape}:`, iconError);
                }

                // 3. Register composite image with the map.
                // Bail if clearIcons() ran while we were awaiting canvas/fetch work.
                // Without this guard the promise would addImage() an icon that
                // clearIcons() already decided not to track, leaving a leaked,
                // untracked image that survives the next style rebuild.
                if (clearEpoch !== epochAtStart) return;
                if (!mapInstance.hasImage(iconId)) {
                    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
                    mapInstance.addImage(iconId, {
                        width: canvasW,
                        height: canvasH,
                        data: imageData.data
                    }, { pixelRatio: dpr });
                    loadedIcons.add(iconId);
                }
            } catch (error) {
                console.warn(`Error loading ${shape} icon "${iconName}":`, error);
            } finally {
                pendingLoads.delete(iconId);
            }
        })();

        // Store the promise and return it
        pendingLoads.set(iconId, loadPromise);
        return loadPromise;
    };

    const updateGeoJSONSource = async (reports: Request[] | undefined, caller = 'unknown', hasStatusFilter = false) => {
        const forceUpdate = caller === 'locale-refresh';

        // Skip if no map instance, animating, or interacting
        // BUT allow empty reports array to clear markers when filters result in no matches
        if (!mapInstance || (!forceUpdate && (isAnimating || isMapInteracting))) {
            return;
        }

        // Treat undefined as empty array
        const reportsArray = reports || [];

        if (!Array.isArray(reportsArray)) {
            return;
        }

        // Additional debouncing during initialization to prevent rapid successive calls
        if (isInitializing && initializationDebounceTimer) {
            clearTimeout(initializationDebounceTimer);
        }

        // Include locale-sensitive marker fields in the hash so translated refetches
        // still refresh the source even when IDs and statuses are unchanged.
        const locale = getCurrentLocale();
        let reportsHashValue = hashValue(17, locale);
        reportsHashValue = hashValue(reportsHashValue, reportsArray.length);

        for (const report of reportsArray) {
            const statusInfo = getReportStatusInfo(report);

            reportsHashValue = hashValue(reportsHashValue, report.service_request_id);
            reportsHashValue = hashValue(reportsHashValue, report.status);
            reportsHashValue = hashValue(reportsHashValue, report.updated_datetime);
            reportsHashValue = hashValue(reportsHashValue, report.category_icon);
            reportsHashValue = hashValue(reportsHashValue, report.category_hex);
            reportsHashValue = hashValue(reportsHashValue, statusInfo.statusIcon);
            reportsHashValue = hashValue(reportsHashValue, statusInfo.statusHex);
            reportsHashValue = hashValue(reportsHashValue, statusInfo.statusDescriptive);
        }

        const reportsHash = String(reportsHashValue);

        // If this is the same data as last time, skip processing
        if (!forceUpdate && reportsHash === lastReportsHash) {
            return lastUpdatePromise || Promise.resolve();
        }

        // If there's an ongoing update, coalesce rather than recurse.
        // For force-updates (locale-refresh) we store the args so the running
        // promise's finally block re-runs once — no unbounded await-chains.
        if (lastUpdatePromise) {
            if (forceUpdate) {
                pendingForceArgs = [reportsArray, caller, hasStatusFilter];
            }
            return lastUpdatePromise;
        }

        lastReportsHash = reportsHash;
        isAnimating = true;

        // Create and store the update promise
        lastUpdatePromise = (async () => {
            try {
                // Typed cast: callers always use the 'reports-geojson' GeoJSON source.
                const source = mapInstance.getSource('reports-geojson') as GeoJSONSource | undefined;

                // Filter out reports with invalid coordinates or missing required properties
                const validReports = reportsArray.filter((report) => {
                    if (!report) return false;
                    const lat = Number(report.lat);
                    const lng = Number(report.long);
                    const isValid = Number.isFinite(lat) &&
                      Number.isFinite(lng) &&
                      report.category_icon &&
                      report.category_hex;

                    // DEBUG: Log filtering decisions
                    if (import.meta.dev && !isValid) {
                        console.warn(`[useMapIcons] Filtering out report ${report.service_request_id}:`, {
                            lat: report.lat,
                            lng: report.long,
                            latValid: Number.isFinite(lat),
                            lngValid: Number.isFinite(lng),
                            hasIcon: !!report.category_icon,
                            iconValue: report.category_icon,
                            hasHex: !!report.category_hex,
                            hexValue: report.category_hex
                        });
                    }

                    return isValid;
                });

                if (!validReports.length) {
                    // Update with empty GeoJSON to clear all markers
                    if (source) {
                        source.setData({ type: 'FeatureCollection', features: [] });
                    }
                    return;
                }

                // Prepare all derived marker render data once per report so later
                // phases can reuse it without repeating status/icon/color work.
                const preparedMarkers = validReports.map((report) => {
                    const statusInfo = getReportStatusInfo(report);
                    const rawHex = hasStatusFilter
                        ? (statusInfo.statusHex || report.category_hex)
                        : report.category_hex;
                    // Normalize to lowercase so iconId, color property, and getColorIndex
                    // all agree regardless of whether the API returns '#FF8800' or '#ff8800'.
                    const hexToUse = (rawHex || '#000000').toLowerCase();
                    const iconToUse = hasStatusFilter
                        ? (statusInfo.statusIcon || report.category_icon)
                        : report.category_icon;
                    const iconName = cleanIconName(iconToUse);
                    const mode = colorMode.value === 'dark' ? 'd' : 'l';
                    const iconId = `pin-${iconName}-${hexToUse.replace('#', '')}-${mode}`;

                    const magnitude = computeMagnitude(report, magnitudeScaling.value);

                    return {
                        report,
                        iconName,
                        hexToUse,
                        iconId,
                        magnitude
                    };
                });

                // Collect unique icon names for batch prefetch
                const uniqueIconNames = new Set<string>();
                preparedMarkers.forEach(({ iconName }) => uniqueIconNames.add(iconName));

                // Batch-prefetch SVGs into cache BEFORE creating loadIcon promises
                // (loadIcon checks svgTextCache first, so prefetched SVGs skip individual fetches)
                await batchPrefetchIcons([...uniqueIconNames]);

                // Now create loadIcon promises (they'll find SVGs in cache)
                const uniqueIcons = new Set<string>();
                const iconLoadPromises: Promise<void>[] = [];

                preparedMarkers.forEach(({ iconName, hexToUse, iconId }) => {
                    if (!uniqueIcons.has(iconId)) {
                        uniqueIcons.add(iconId);
                        iconLoadPromises.push(loadIcon(iconName, hexToUse));
                    }
                });

                await Promise.all(iconLoadPromises);

                // Create GeoJSON features using pre-computed values
                // IMPORTANT: All property values MUST be valid (no undefined/null) or MapLibre throws "unknown feature value"
                const geojsonData = {
                    type: 'FeatureCollection' as const,
                    features: preparedMarkers.map(({ report, hexToUse, iconId, magnitude }) => {
                        return {
                            type: 'Feature' as const,
                            geometry: {
                                type: 'Point' as const,
                                coordinates: [parseFloat(String(report.long)), parseFloat(String(report.lat))] as [number, number]
                            },
                            properties: {
                                id: String(report.service_request_id || ''),
                                title: String(report.service_name || ''),
                                address: String(report.address_string || ''),
                                color: String(hexToUse || '#000000'),
                                colorIndex: getColorIndex(hexToUse || '#000000'),
                                icon: iconId,
                                magnitude
                            }
                        };
                    })
                };

                // Update the data source
                if (source) {
                    source.setData(geojsonData);

                    // Validate features in dev mode only
                    if (import.meta.dev && geojsonData.features.length > 0) {
                        const invalidFeatures = geojsonData.features.filter((f) => {
                            const [fLng, fLat] = f.geometry.coordinates;
                            return !Number.isFinite(fLng) || !Number.isFinite(fLat) ||
                              !f.properties.id || !f.properties.icon || !f.properties.color;
                        });
                        if (invalidFeatures.length > 0) {
                            console.warn(`⚠️ ${invalidFeatures.length} features have invalid data:`, invalidFeatures[0]);
                        }
                    }
                }

                // Mark that we have successfully displayed markers
                if (!hasEverDisplayedMarkers && validReports.length > 0) {
                    hasEverDisplayedMarkers = true;
                }

                // Mark initialization as complete after first successful display
                if (isInitializing) {
                    // Clear any existing debounce timer
                    if (initializationDebounceTimer) {
                        clearTimeout(initializationDebounceTimer);
                    }

                    // Use a short delay to allow any rapid successive calls during initialization to settle
                    initializationDebounceTimer = setTimeout(() => {
                        isInitializing = false;
                        initializationDebounceTimer = null;
                    }, 500);
                }
            } catch (error) {
                console.warn('Error updating GeoJSON source:', error);
            } finally {
                // Allow next update immediately (no animation delay)
                isAnimating = false;
                // Clear the promise when done
                lastUpdatePromise = null;

                // Consume a pending force-update coalesced while we were running.
                // Single trailing re-run — pendingForceArgs is cleared first so a
                // second force that arrives during this re-run also coalesces cleanly.
                if (pendingForceArgs) {
                    const forceArgs = pendingForceArgs;
                    pendingForceArgs = null;
                    updateGeoJSONSource(...forceArgs);
                }
            }
        })();

        return lastUpdatePromise;
    };

    const clearIcons = () => {
        // Increment epoch first so any in-flight loadIcon() promises that check
        // clearEpoch !== epochAtStart will bail before calling addImage().
        clearEpoch++;
        loadedIcons.forEach((iconId) => {
            if (mapInstance.hasImage(iconId)) {
                mapInstance.removeImage(iconId);
            }
        });
        loadedIcons.clear();
        pendingLoads.clear();
        lastReportsHash = '';
        lastUpdatePromise = null;
        pendingForceArgs = null;
        // Reset guards so the next updateGeoJSONSource isn't blocked
        // by a still-running previous update (e.g., after setStyle on dark/light switch)
        isAnimating = false;
        // Reset initialization state when clearing icons (e.g., on style changes)
        hasEverDisplayedMarkers = false;
        isInitializing = true;
        if (initializationDebounceTimer) {
            clearTimeout(initializationDebounceTimer);
            initializationDebounceTimer = null;
        }
    };

    // Interaction control methods
    const setMapInteracting = (interacting: boolean) => {
        isMapInteracting = interacting;
    };

    return {
        loadIcon,
        getIconId,
        clearIcons,
        updateGeoJSONSource,
        setMapInteracting,
        isIconLoaded: (name: string, fillColor: string, shape: 'pin' | 'badge' = 'pin') => {
            return loadedIcons.has(getIconId(name, fillColor, shape));
        }
    };
}
