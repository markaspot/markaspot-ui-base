<template>
  <div
    ref="controlRoot"
    :class="['map-control px-0 py-0', props.config?.classes]"
    class="w-11"
  >
    <div class="flex flex-col items-center">
      <button
        class="w-11 h-11 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset hover:bg-neutral-50 dark:hover:bg-neutral-800"
        style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
        :aria-label="t('map.controls.adjust_tilt')"
        :aria-expanded="isExpanded"
        @click="toggleExpanded"
      >
        <UIcon
          name="i-lucide-rotate-3d"
          :class="['w-6 h-6', buttonTextClass()]"
          aria-hidden="true"
        />
      </button>
      <!-- Hidden accessible label -->
      <span class="sr-only">{{ t('map.controls.adjust_tilt') }}: {{ t('map.controls.degrees', { count: mapTilt }) }}</span>

      <!-- Current tilt indicator for non-expandable mode -->
      <div
        v-if="!isExpandable"
        class="text-xs font-medium text-neutral-700 dark:text-white py-1"
      >
        {{ mapTilt }}°
      </div>

      <!-- Tilt buttons - only shown when expanded in expandable mode -->
      <Transition name="slide-fade">
        <div
          v-if="isExpandable && isExpanded"
          class="w-full"
        >
          <button
            v-for="angle in angles"
            :key="angle"
            class="w-full h-11 flex items-center justify-center text-xs transition-colors border-t border-[var(--ui-border)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
            style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
            :class="mapTilt === angle ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white' : 'bg-white dark:bg-black text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'"
            :aria-label="`${t('map.controls.degrees', { count: angle })} ${t('map.controls.adjust_tilt')}`"
            @click="setTilt(angle); isExpanded = false"
          >
            {{ angle }}°
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TiltControl Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import { onClickOutside } from '@vueuse/core';
import type { Map } from 'maplibre-gl';

const { t } = useI18n();
const { buttonTextClass } = useContrastText();

// Props
const props = defineProps<{
    mapInstance: Map | null
    config?: {
        classes?: string
        options?: {
            angles?: number[]
            defaultAngle?: number
            expandable?: boolean
        }
    }
}>();

const emit = defineEmits<{
    'update:tilt': [tiltValue: number]
}>();

// Default angles if not provided in config
const defaultAngles = [0, 30, 60];

// Use config angles or fallback to defaults
const angles = computed(() => {
    return props.config?.options?.angles || defaultAngles;
});

// Check if the control should be expandable
const isExpandable = computed(() => {
    return props.config?.options?.expandable !== false;
});

// Map tilt state
const mapTilt = ref(props.config?.options?.defaultAngle || 0);

// Expanded state - controls whether angle options are shown
const isExpanded = ref(false);

// Template ref for the control root element (used for outside-click detection)
const controlRoot = ref<HTMLElement | null>(null);

// Toggle the expanded state
const toggleExpanded = () => {
    // Only toggle if expandable
    if (isExpandable.value) {
        isExpanded.value = !isExpanded.value;
    } else {
        // If not expandable, cycle through angles instead
        const currentIndex = angles.value.indexOf(mapTilt.value);
        const nextIndex = (currentIndex + 1) % angles.value.length;
        setTilt(angles.value[nextIndex]);
    }
};

// Set map tilt
const setTilt = (degrees: number) => {
    mapTilt.value = degrees;

    if (props.mapInstance) {
        props.mapInstance.setPitch(degrees);
        emit('update:tilt', degrees);
    }
};

// Named pitch handler so it can be removed on teardown
const onPitch = (map: Map) => () => {
    mapTilt.value = map.getPitch();
};
// Keep a ref to the currently registered handler so we can off() it
let currentPitchHandler: (() => void) | null = null;
let currentMapInstance: Map | null = null;

// Watch for map instance changes to sync tilt
watch(
    () => props.mapInstance,
    (newMapInstance, oldMapInstance) => {
        // Remove handler from the previous instance
        if (oldMapInstance && currentPitchHandler) {
            oldMapInstance.off('pitch', currentPitchHandler);
            currentPitchHandler = null;
        }
        if (newMapInstance) {
            // Initialize tilt value from map
            mapTilt.value = newMapInstance.getPitch();

            // Set up named event listener to keep in sync with map
            currentPitchHandler = onPitch(newMapInstance);
            newMapInstance.on('pitch', currentPitchHandler);
            currentMapInstance = newMapInstance;
        }
    },
    { immediate: true }
);

// Close on outside click using VueUse (handles cleanup automatically)
onClickOutside(controlRoot, () => {
    isExpanded.value = false;
});

// Close on Escape key for keyboard users
const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isExpanded.value) {
        isExpanded.value = false;
    }
};

onMounted(() => {
    if (import.meta.client) {
        document.addEventListener('keydown', onKeydown);
    }
});

onUnmounted(() => {
    // Remove the pitch listener from the current map instance
    if (currentMapInstance && currentPitchHandler) {
        currentMapInstance.off('pitch', currentPitchHandler);
        currentPitchHandler = null;
    }
    if (import.meta.client) {
        document.removeEventListener('keydown', onKeydown);
    }
});
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
