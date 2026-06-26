<template>
  <div
    ref="mapContainer"
    class="w-full h-full"
  />
</template>

<script setup lang="ts">
/**
 * MiniMap Component
 *
 * A simple, lightweight MapLibre map for displaying a single location.
 * Used in report detail modals to show the report's location.
 *
 * MapLibre is loaded dynamically to avoid blocking initial page load (~218KB).
 */
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';

// MapLibre module loaded dynamically in onMounted for Lighthouse performance

let MapLibreGL: any = null;

interface Props {
    lat: number
    lng: number
    zoom?: number
    markerColor?: string
    interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    zoom: 15,
    markerColor: '#3b82f6',
    interactive: false
});

const { settings, fetchSettings } = useMarkASpotSettings();
const colorMode = useColorMode();

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<MapLibreMap | null>(null);
const marker = shallowRef<MapLibreMarker | null>(null);

// Get map style URL based on theme (matching dashboard map components pattern)
const getStyleUrl = () => {
    const isDark = colorMode.value === 'dark';
    if (isDark && settings.value?.mapbox_style_dark) {
        return settings.value.mapbox_style_dark;
    }
    if (!isDark && settings.value?.mapbox_style) {
        return settings.value.mapbox_style;
    }
    if (isDark && settings.value?.fallback_style_dark) {
        return settings.value.fallback_style_dark;
    }
    if (settings.value?.fallback_style) {
        return settings.value.fallback_style;
    }
    return 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
};

onMounted(async () => {
    if (!mapContainer.value) return;

    // Dynamically import MapLibre to avoid blocking initial page load
    if (!MapLibreGL) {
        MapLibreGL = await import('maplibre-gl');
        // Load CSS after module
        await import('maplibre-gl/dist/maplibre-gl.css');
    }

    // Fetch settings but fall back to the hardcoded style on network failure
    // so the location is still visible even when the API is temporarily unavailable.
    try {
        await fetchSettings();
    } catch {
        // settings.value stays null; getStyleUrl() returns the carto fallback
    }

    // Initialize map using dynamically loaded module
    map.value = new MapLibreGL.Map({
        container: mapContainer.value,
        style: getStyleUrl(),
        center: [props.lng, props.lat],
        zoom: props.zoom,
        interactive: props.interactive,
        attributionControl: false
    });

    // Add marker
    const el = document.createElement('div');
    el.className = 'mini-map-marker';
    el.style.cssText = `
    width: 24px;
    height: 24px;
    background-color: ${props.markerColor};
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  `;

    marker.value = new MapLibreGL.Marker({ element: el })
        .setLngLat([props.lng, props.lat])
        .addTo(map.value);
});

// Update marker position when props change
watch([() => props.lat, () => props.lng], ([newLat, newLng]) => {
    if (marker.value && map.value) {
        marker.value.setLngLat([newLng, newLat]);
        map.value.setCenter([newLng, newLat]);
    }
});

// Update style when theme changes
watch(() => colorMode.value, () => {
    if (map.value) {
        map.value.setStyle(getStyleUrl());
    }
});

onUnmounted(() => {
    if (marker.value) {
        marker.value.remove();
    }
    if (map.value) {
        map.value.remove();
    }
});
</script>

<style>
.maplibregl-canvas {
  outline: none;
}
</style>
