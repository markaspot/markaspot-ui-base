import type { ExpressionSpecification } from 'maplibre-gl';

/**
 * Shared color palette for mapping category hex colors to numeric indices.
 * Used by useMapIcons (assign indices to features) and useClusters (build paint expressions).
 *
 * Client-only: All consumers require a MapLibre map instance (WebGL/canvas),
 * so this code never runs during SSR. Module-level state is safe here.
 *
 * Module-level state survives composable re-creation and is shared across consumers.
 * Call reset() on jurisdiction switch to prevent unbounded growth of the palette
 * across long-lived SPA sessions that visit many jurisdictions.
 */

const colorToIndex = new Map<string, number>();
const indexToColor = new Map<number, string>();
let nextIndex = 1; // Start at 1, 0 means "no color"

export function useColorPalette() {
    /**
     * Get or assign a numeric index for a hex color.
     * Indices are stable: the same color always gets the same index.
     */
    function getColorIndex(hex: string): number {
        const normalized = hex.toLowerCase();
        if (colorToIndex.has(normalized)) return colorToIndex.get(normalized)!;
        const index = nextIndex++;
        colorToIndex.set(normalized, index);
        indexToColor.set(index, normalized);
        return index;
    }

    /**
     * Get the hex color for a given index.
     */
    function getColorByIndex(index: number): string | undefined {
        return indexToColor.get(index);
    }

    /**
     * Build a MapLibre match expression that maps indices back to hex colors.
     * Returns: ['match', ['get', 'dominantColorIndex'], idx1, '#hex1', idx2, '#hex2', ..., fallback]
     */
    function buildColorMatchExpression(fallback: string = '#ffffff'): ExpressionSpecification | string {
        // MapLibre match requires at least one label/output pair.
        // If palette is empty (no data loaded yet), return fallback directly.
        // size() uses indexToColor.size — same map used to build the expression.
        if (indexToColor.size === 0) return fallback;

        // Note: 'max' aggregation picks the highest numeric index, not the most
        // frequent color. This means "one of the category colors in the cluster",
        // not necessarily the majority color. True frequency analysis would require
        // per-color counters in clusterProperties, which is significantly more complex.
        const expr: ExpressionSpecification = ['match', ['get', 'dominantColorIndex']] as unknown as ExpressionSpecification;
        indexToColor.forEach((hex, idx) => {
            (expr as unknown as unknown[]).push(idx, hex);
        });
        (expr as unknown as unknown[]).push(fallback); // default/fallback
        return expr;
    }

    /**
     * Get current palette size (number of unique colors registered).
     * Uses indexToColor as the canonical size source — the same map guarded
     * in buildColorMatchExpression — so both stay in sync if one ever gains
     * an eviction path in the future.
     */
    function size(): number {
        return indexToColor.size;
    }

    /**
     * Reset the palette. Call on jurisdiction switch to prevent unbounded growth
     * across long-lived SPA sessions that visit many different jurisdictions.
     * Both maps are reset together so they always have equal size.
     */
    function reset(): void {
        colorToIndex.clear();
        indexToColor.clear();
        nextIndex = 1;
    }

    return { getColorIndex, getColorByIndex, buildColorMatchExpression, size, reset };
}
