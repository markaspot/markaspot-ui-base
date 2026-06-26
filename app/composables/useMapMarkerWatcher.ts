import { useDebounceFn } from '@vueuse/core';
import type { Request } from '~~/types';

interface MarkerWatcherOptions {
    markers: () => Request[]
    mapFunctions: any
    startTiming: (name: string) => () => void
    hasStatusFilter?: () => boolean
}

export function useMapMarkerWatcher(options: MarkerWatcherOptions) {
    const { mapFunctions, startTiming } = options;

    let lastMarkersLength = 0;
    let lastMarkersFirstId = '';

    const setupMarkerWatcher = () => {
    // Setup marker watcher with optimized debounce for zoom responsiveness
        const debouncedUpdateMarkers = useDebounceFn((newMarkers: Request[]) => {
            // Always update, even with empty array (to clear markers)
            if (Array.isArray(newMarkers)) {
                // Track marker update performance
                const endTiming = startTiming('map_marker_update');

                // Defer work until after next paint to avoid long rAF handlers
                setTimeout(() => {
                    const hasStatus = options.hasStatusFilter?.() || false;
                    mapFunctions!.updateGeoJSONSource(newMarkers, 'map-watcher', hasStatus);
                    endTiming();
                }, 0);
            }
        }, 100); // Reduced debounce for better zoom responsiveness

        // Watch for marker changes and update the map
        // Use getter function to properly track reactive changes in props.markers
        watch(
            () => options.markers(),
            (newMarkers, oldMarkers) => {
                if (!newMarkers) return;

                // Optimized change detection - fast path for common cases
                const currentLength = newMarkers.length;
                const hasLengthChanged = currentLength !== lastMarkersLength;
                const hasReferenceChanged = newMarkers !== oldMarkers;

                // Fast path: if length changed, definitely update
                if (hasLengthChanged) {
                    const currentFirstId = newMarkers[0]?.service_request_id || '';

                    lastMarkersLength = currentLength;
                    lastMarkersFirstId = currentFirstId;
                    debouncedUpdateMarkers(newMarkers);
                    return;
                }

                // Content change detection only if length is same
                const currentFirstId = newMarkers[0]?.service_request_id || '';
                const hasFirstChanged = currentFirstId !== lastMarkersFirstId;

                // Any reference change with data means the array was replaced
                // (e.g. locale switch returns same IDs but translated content)
                const hasContentChanged = hasReferenceChanged && currentLength > 0;

                // Only update if there's a meaningful change (excluding length changes already handled)
                if (hasFirstChanged || hasContentChanged) {
                    // Update tracking values
                    lastMarkersLength = currentLength;
                    lastMarkersFirstId = currentFirstId;

                    debouncedUpdateMarkers(newMarkers);
                }
            },
            { immediate: false } // Don't trigger on mount, wait for real data
        );

        // Watch for hasStatusFilter changes to update marker colors
        if (options.hasStatusFilter) {
            watch(
                options.hasStatusFilter,
                (newValue, oldValue) => {
                    if (newValue !== oldValue) {
                        const currentMarkers = options.markers();
                        // Update even if 0 markers to clear the map
                        debouncedUpdateMarkers(currentMarkers || []);
                    }
                }
            );
        }

        // Initial marker load if data is already available
        const initialMarkers = options.markers();
        if (initialMarkers && initialMarkers.length > 0) {
            lastMarkersLength = initialMarkers.length;
            lastMarkersFirstId = initialMarkers[0]?.service_request_id || '';
            debouncedUpdateMarkers(initialMarkers);
        }
    };

    return {
        setupMarkerWatcher
    };
}
