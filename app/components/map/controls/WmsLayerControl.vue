<template>
  <UPopover
    v-if="isWmsEnabled"
    :ui="{ content: 'p-0' }"
  >
    <button
      type="button"
      :class="[
        'map-control w-10 h-10 overflow-hidden flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
        props.config?.classes,
        { 'bg-primary-50 dark:bg-primary-900/30': hasActiveLayers },
      ]"
      :aria-label="t('map.controls.layers')"
    >
      <UIcon
        :name="hasActiveLayers ? 'i-heroicons-square-3-stack-3d-20-solid' : 'i-heroicons-square-3-stack-3d'"
        class="h-5 w-5"
        :class="hasActiveLayers ? 'text-primary-500' : buttonTextClass()"
      />
    </button>

    <template #content>
      <div class="max-h-[calc(100vh-5rem)] w-[calc(100vw-2rem)] max-w-80 overflow-hidden p-3 sm:w-80">
        <div class="flex items-center gap-2 mb-3 pb-2 border-b border-(--ui-border)">
          <UIcon
            name="i-heroicons-square-3-stack-3d"
            class="size-4 text-(--ui-text-muted)"
          />
          <span class="text-sm font-semibold">{{ t('map.controls.layers') }}</span>
        </div>

        <div class="max-h-[calc(100vh-11rem)] space-y-3 overflow-y-auto pr-1 sm:max-h-96">
          <div
            v-for="layer in wmsLayers"
            :key="layer.id"
            class="space-y-1"
          >
            <div class="flex items-center gap-3 py-1">
              <UCheckbox
                :model-value="isLayerVisible(layer.id)"
                :label="layer.title"
                @update:model-value="toggleLayer(layer.id)"
              />
            </div>
            <div
              v-if="isLayerVisible(layer.id)"
              class="ml-7 min-h-8 rounded-md border border-(--ui-border) bg-(--ui-bg-muted) px-2 py-1.5"
            >
              <img
                v-if="!hasLegendError(layer.id)"
                :src="getLegendUrl(layer.layerName)"
                :alt="getWmsLegendAlt(layer)"
                class="block max-h-28 w-auto max-w-full object-contain"
                loading="lazy"
                @error="markLegendError(layer.id)"
              >
              <p
                v-else
                class="text-xs text-(--ui-text-muted)"
                role="status"
                aria-live="polite"
              >
                {{ getWmsLegendUnavailableText(layer) }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="wmsLayers.length === 0"
          class="text-sm text-(--ui-text-muted) py-2"
        >
          {{ t('map.controls.no_layers') }}
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Map } from 'maplibre-gl';
import {
    addWmsLayerToMap,
    buildWmsLegendUrl,
    filterWmsLayersForCitizen,
    getWmsLayerId,
    getWmsLegendAlt,
    getWmsLegendUnavailableText
} from '@/composables/map/useWmsLayers';

const { t } = useI18n();

const props = defineProps<{
    mapInstance: Map | null
    config?: {
        position?: string
        weight?: number
        enabled?: boolean
        classes?: string
    }
}>();

// Get config and auth state directly
const { clientConfig } = useMarkASpotConfig();
const { isAuthenticated } = usePasswordlessAuth();
const { buttonTextClass } = useContrastText();

// Get all WMS layers from config
const allWmsLayers = computed(() => {
    return clientConfig.value?.features?.map?.wmsLayers || [];
});

// Filter by effective visibility for the citizen map context.
// 'public' always, 'authenticated' only when logged in, 'staff' never.
const wmsLayers = computed(() => {
    return filterWmsLayersForCitizen(allWmsLayers.value, isAuthenticated.value);
});

const isWmsEnabled = computed(() => wmsLayers.value.length > 0);

// Track active layers locally
const activeLayers = ref<Set<string>>(new Set());
const legendErrors = ref<Set<string>>(new Set());

const jurisdictionId = computed(() => clientConfig.value?.jurisdiction?.id);

const getLegendUrl = (layerName: string) => buildWmsLegendUrl(layerName, jurisdictionId.value);

const hasLegendError = (layerId: string) => legendErrors.value.has(layerId);

const markLegendError = (layerId: string) => {
    legendErrors.value.add(layerId);
    legendErrors.value = new Set(legendErrors.value);
};

const clearLegendError = (layerId: string) => {
    if (!legendErrors.value.delete(layerId)) return;
    legendErrors.value = new Set(legendErrors.value);
};

// Track if we've initialized layers on this map instance
const layersInitialized = ref(false);

// Keep a reference to the pending once('load') handler so it can be
// removed if the component unmounts before the map finishes loading.
let pendingLoadHandler: (() => void) | null = null;
let pendingLoadMap: Map | null = null;

/**
 * Initialize WMS layers on the map if they don't exist yet.
 * This makes the control self-contained and usable in any map context.
 */
const initializeWmsLayers = () => {
    const map = props.mapInstance;
    if (!map || layersInitialized.value) return;

    // Clear pending handler ref once it fires
    pendingLoadHandler = null;
    pendingLoadMap = null;

    const jurisdictionId = clientConfig.value?.jurisdiction?.id;

    for (const layerConfig of wmsLayers.value) {
        // addWmsLayerToMap skips layers whose source already exists
        // (e.g. added by the main map's useMap composable).
        addWmsLayerToMap(map, layerConfig, { jurisdictionId });

        if (layerConfig.enabled) {
            activeLayers.value.add(layerConfig.id);
        }
    }

    // Force reactivity update
    activeLayers.value = new Set(activeLayers.value);
    layersInitialized.value = true;
};

// Initialize layers when map becomes available and is loaded
watch(() => props.mapInstance, (map) => {
    // Remove any pending load handler from the previous instance
    if (pendingLoadMap && pendingLoadHandler) {
        pendingLoadMap.off('load', pendingLoadHandler);
        pendingLoadHandler = null;
        pendingLoadMap = null;
    }

    if (!map) {
        layersInitialized.value = false;
        return;
    }

    // Wait for map to be fully loaded before adding layers
    if (map.loaded() && map.isStyleLoaded()) {
        initializeWmsLayers();
    } else {
        // Store the handler reference so we can off() it on unmount
        pendingLoadHandler = initializeWmsLayers;
        pendingLoadMap = map;
        map.once('load', initializeWmsLayers);
    }
}, { immediate: true });

onUnmounted(() => {
    // If the map 'load' event hasn't fired yet, remove the pending handler
    if (pendingLoadMap && pendingLoadHandler) {
        pendingLoadMap.off('load', pendingLoadHandler);
        pendingLoadHandler = null;
        pendingLoadMap = null;
    }
});

// Initialize active layers based on enabled status when config changes
watch(wmsLayers, (layers) => {
    layers.forEach((layer) => {
        if (layer.enabled) {
            activeLayers.value.add(layer.id);
        }
    });
}, { immediate: true });

watch(jurisdictionId, () => {
    legendErrors.value = new Set();
});

const hasActiveLayers = computed(() => activeLayers.value.size > 0);

const isLayerVisible = (layerId: string) => {
    return activeLayers.value.has(layerId);
};

const toggleLayer = (layerId: string) => {
    if (!props.mapInstance) return;

    const mapLayerId = getWmsLayerId(layerId);
    const map = props.mapInstance;

    if (!map.getLayer(mapLayerId)) {
        return;
    }

    const isVisible = activeLayers.value.has(layerId);
    const newVisibility = isVisible ? 'none' : 'visible';

    map.setLayoutProperty(mapLayerId, 'visibility', newVisibility);

    if (isVisible) {
        activeLayers.value.delete(layerId);
    } else {
        activeLayers.value.add(layerId);
        clearLegendError(layerId);
    }

    // Force reactivity update
    activeLayers.value = new Set(activeLayers.value);
};
</script>
