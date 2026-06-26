<template>
  <div class="map-controls">
    <!-- Create positioned control containers for each position -->
    <template
      v-for="(positionClass, positionName) in (positionClasses as Record<string, string>)"
      :key="positionName"
    >
      <!-- Only render this position container if it has controls -->
      <div
        v-if="getControlsForPosition(positionName).length > 0"
        class="fixed z-20 flex flex-col"
        :class="[
          getAdjustedPositionClass(positionName, positionClass),
          // Apply different gap based on position
          positionName === 'centerRight' || positionName === 'topLeft' ? 'gap-3' : 'gap-2',
        ]"
      >
        <!-- Place controls in this position, sorted by weight -->
        <component
          :is="getControlComponent(control.name)"
          v-for="control in getControlsForPosition(positionName)"
          :key="control.name"
          :map-instance="mapInstance"
          :config="{ ...control.config, position: getEffectivePosition(control.config) }"
          :tooltip-visible="tooltipVisible"
          @report="(type) => $emit('report', type)"
          @update:location="(loc) => $emit('update:location', loc)"
          @toggle-heatmap="$emit('toggle-heatmap')"
          @update:tilt="(tilt) => $emit('update:tilt', tilt)"
          @geolocate="(coords) => $emit('geolocate', coords)"
          @geolocate-to-pick="(coords) => $emit('geolocate-to-pick', coords)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * MapControls Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import type { Map } from 'maplibre-gl';

import ZoomControl from './controls/ZoomControl.vue';
import TiltControl from './controls/TiltControl.vue';
import ThemeControl from './controls/ThemeControl.vue';
import GeolocationControl from './controls/GeolocationControl.vue';
import AttributionControl from './controls/AttributionControl.vue';
import WmsLayerControl from './controls/WmsLayerControl.vue';

// Import map config type
import type { MapControlsConfig } from '~~/types/mapConfig';

/** iOS non-standard PWA standalone flag — not in the standard Navigator type. */
declare global {
    interface Navigator {
        standalone?: boolean
    }
}
// Dynamically load ReportButtons control
const ReportButtons = defineAsyncComponent(() => import('./controls/ReportButtons.vue'));

// Props
const props = defineProps<{
    mapInstance: Map | null
    tooltipVisible?: boolean
}>();

// Emit all events
const emit = defineEmits<{
    'report': [type: 'photo' | 'classic']
    'update:location': [locationData: { lat: number, lng: number, address?: string }]
    'toggle-heatmap': []
    'update:tilt': [tiltValue: number]
    'geolocate': [coords: { lat: number, lng: number }]
    'geolocate-to-pick': [coords: { lat: number, lng: number }]
}>();

// Get client configuration - use dynamic config from API for per-jurisdiction settings
const runtimeConfig = useRuntimeConfig();
const { clientConfig } = useMarkASpotConfig();
const mapControls = computed(() => {
    // Dynamic config from API takes priority, fallback to build-time config
    // Note: map config is under features.map in clientConfig structure
    return clientConfig.value?.features?.map?.controls ||
      runtimeConfig.public.clientConfig.features.map?.controls ||
      {};
});
const configuredWmsLayers = computed(() => clientConfig.value?.features?.map?.wmsLayers || []);
const defaultWmsLayersControl = {
    enabled: true,
    position: 'centerRight',
    positionMobile: 'topLeft',
    weight: 35,
    classes: ''
};

// Use the layout composable for a single, SSR-consistent breakpoint signal.
// isDesktop is the canonical source for both position logic and visibility
// filtering to avoid disagreements during the hydration window.
const { isDesktop } = useLayout();
const { isBannerVisible } = useDemoMode();

// iOS fullscreen with notch/island detection
const fullscreenWithIsland = ref(false);
const mobileTopClass = computed(() => fullscreenWithIsland.value ? 'top-[80px]' : 'safe-area-top');
const demoAwareTopClass = computed(() => isBannerVisible.value ? 'top-[calc(var(--demo-mode-banner-height,0px)+1rem)]' : 'top-4');
const effectiveMobileTopClass = computed(() => isBannerVisible.value ? demoAwareTopClass.value : mobileTopClass.value);

const checkFullscreenIsland = () => {
    // Check if the device is iOS
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Check if in standalone mode (PWA)
    const isStandalone = window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Look for environment safe area inset presence
    const hasSafeAreaInset = CSS.supports('padding-top: env(safe-area-inset-top)') &&
      getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') !== '0px';

    // Only apply if: iOS device + standalone mode + has safe area insets
    fullscreenWithIsland.value = isIOS && isStandalone && hasSafeAreaInset;
};

const handleResize = () => {
    checkFullscreenIsland();
};

onMounted(() => {
    // Initial check for notch/island
    checkFullscreenIsland();

    // Add event listeners for resize and orientation changes
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
});

// Available positions and their classes
const positionClasses = computed(() => {
    return mapControls.value.positions || {
        topLeft: 'top-4 left-4',
        topRight: 'top-4 right-4',
        bottomLeft: 'bottom-4 left-4',
        bottomRight: 'bottom-4 right-4'
    };
});

// Control name type for better type safety
type ControlName = 'zoom' | 'tilt' | 'theme' | 'geolocation' | 'reports' | 'attribution' | 'wmsLayers';

// Get all controls with their config
const controls = computed(() => {
    const controlsList: Array<{ name: ControlName, config: any }> = [];

    // Loop through all available controls in config
    // Always include core controls and the 'reports' control
    const controlTypes: ControlName[] = ['zoom', 'tilt', 'theme', 'geolocation', 'reports', 'attribution', 'wmsLayers'];

    for (const controlName of controlTypes) {
        if (controlName === 'wmsLayers') {
            const configuredControl = mapControls.value.wmsLayers;
            const explicitConfig = typeof configuredControl === 'object' && configuredControl !== null
                ? configuredControl
                : {};
            const explicitlyDisabled = configuredControl === false || explicitConfig.enabled === false;

            if (configuredWmsLayers.value.length > 0 && !explicitlyDisabled) {
                controlsList.push({
                    name: controlName,
                    config: {
                        ...defaultWmsLayersControl,
                        ...explicitConfig
                    }
                });
            }
            continue;
        }

        if (mapControls.value[controlName] && mapControls.value[controlName].enabled !== false) {
            controlsList.push({
                name: controlName,
                config: mapControls.value[controlName] || {}
            });
        }
    }

    // Make sure reports control is always included if not explicitly disabled
    if (!controlsList.some(control => control.name === 'reports')) {
        if (!mapControls.value.reports || mapControls.value.reports.enabled !== false) {
            controlsList.push({
                name: 'reports',
                config: mapControls.value.reports || {
                    position: 'topRight',
                    weight: 1,
                    enabled: true
                }
            });
        }
    }

    return controlsList;
});

// Get controls for a specific position, sorted by weight
const getControlsForPosition = (position: string) => {
    // Filter controls that are enabled and match the target position
    return controls.value
        .filter((control) => {
            // Check if control should be shown on mobile devices
            if (!isDesktop.value && control.config.showOnMobile === false) {
                return false; // Hide this control on mobile
            }

            // Use mobile position when not on desktop
            const controlPosition = !isDesktop.value && control.config.positionMobile
                ? control.config.positionMobile
                : control.config.position;

            // Don't show if mobile position is explicitly set to null
            if (!isDesktop.value && control.config.positionMobile === null) {
                return false;
            }

            return control.config && controlPosition === position;
        })
        .sort((a, b) => (a.config.weight || 0) - (b.config.weight || 0));
};

// Calculate class adjustments based on enabled controls
const getAdjustedPositionClass = (positionName: string, baseClass: string) => {
    // Get controls for this position
    const controlsInPosition = getControlsForPosition(positionName);

    // If no controls enabled, return empty string to prevent rendering
    if (controlsInPosition.length === 0) {
        return '';
    }

    // Special handling for topRight position
    if (positionName === 'topRight') {
        const rightMatch = baseClass.match(/(?:^|\s)(right-(?:\[[^\]]+\]|\S+))/);
        const rightPosition = rightMatch ? rightMatch[1] : 'right-4';

        // On mobile, align with topLeft at 80px
        if (!isDesktop.value) {
            return `${effectiveMobileTopClass.value} ${rightPosition}`;
        }
        // Desktop positioning
        return `${demoAwareTopClass.value} ${rightPosition}`;
    }

    // Handle each position type appropriately
    if (positionName === 'centerRight') {
        // Extract the right position (we'll keep this the same)
        const rightMatch = baseClass.match(/right-\w+/);
        const rightPosition = rightMatch ? rightMatch[0] : 'right-4';

        // Move center controls up to avoid overlap with report buttons
        // This ensures they're in the middle of the top half of the screen
        return `top-[35%] ${rightPosition}`;
    }

    // Special handling for topLeft position on mobile
    if (positionName === 'topLeft' && !isDesktop.value) {
        return `${effectiveMobileTopClass.value} left-4 items-start`;
    }

    if (positionName === 'topLeft' && isBannerVisible.value) {
        const leftMatch = baseClass.match(/(?:^|\s)(left-(?:\[[^\]]+\]|\S+))/);
        const leftPosition = leftMatch ? leftMatch[1] : 'left-4';
        return `${demoAwareTopClass.value} ${leftPosition}`;
    }

    return baseClass;
};

// Determine the effective position for a control (accounts for mobile overrides)
const getEffectivePosition = (controlConfig: any) => {
    if (!controlConfig) return undefined;
    if (!isDesktop.value && controlConfig.positionMobile != null) {
        return controlConfig.positionMobile;
    }
    return controlConfig.position;
};

// Map control names to component imports
const getControlComponent = (controlName: ControlName) => {
    if (!controlName) return null;

    const componentMap = {
        zoom: ZoomControl,
        tilt: TiltControl,
        theme: ThemeControl,
        geolocation: GeolocationControl,
        reports: ReportButtons,
        attribution: AttributionControl,
        wmsLayers: WmsLayerControl
    } as const;

    return componentMap[controlName];
};
</script>
