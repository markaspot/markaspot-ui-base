<template>
  <div class="relative h-full">
    <!-- When returning from the report form the map remounts without any
         visible flash, so we hide the spinner to avoid the blink.
         isMapLoaded is still false until map-init fires, ensuring an error
         in the async Map component (errorComponent path) is detectable. -->
    <AppLoadingState
      v-if="!isMapLoaded"
      :text="isReturningFromForm ? undefined : t('map.loading')"
      size="xl"
      :spinner-class="isReturningFromForm ? 'opacity-0' : 'text-[var(--ui-primary)]'"
      class="absolute inset-0 bg-[var(--ui-bg-elevated)]"
    />

    <ClientOnly>
      <Map
        v-show="isMapLoaded"
        ref="mapComponentRef"
        v-bind="$attrs"
        @map-init="onMapInit"
        @update:bounds="(bounds, isDetailView) => emit('update:bounds', bounds, isDetailView)"
        @select-report="(report) => emit('select-report', report)"
        @add-report="(...args: any[]) => emit('add-report', ...args as [any])"
        @toggle-language="() => emit('toggle-language')"
        @map-tap="() => emit('map-tap')"
        @map-interaction="() => emit('map-interaction')"
        @geolocate="(coords) => emit('geolocate', coords)"
        @geolocate-to-pick="(coords: { lat: number, lng: number }) => emit('geolocate-to-pick', coords)"
      />
      <template #fallback>
        <div class="h-full w-full bg-[var(--ui-bg-elevated)] animate-pulse" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

// Lazy load the Map component

const Map: any = defineAsyncComponent({
    loader: () => import('./Map.vue'),
    delay: 50,
    timeout: 10000,
    errorComponent: () => h('div', { class: 'text-red-500 p-4' }, 'Failed to load map'),
    onError(error, retry, fail) {
        console.error('Map loading error:', error);
        // Retry once on failure
        if (error.message.includes('network')) {
            retry();
        } else {
            fail();
        }
    }
});

const { t } = useI18n();

// Check if we're returning from form via route history.
// Used only to suppress the loading skeleton spinner, NOT to skip
// the loading gate itself — isMapLoaded is always driven by onMapInit.
const route = useRoute();
const isReturningFromForm = ref(false);

// Check if we're coming from /report page
if (import.meta.client) {
    const referrer = document.referrer;
    const isFromReport = referrer.includes('/report') || route.query.fromReport === 'true';
    isReturningFromForm.value = isFromReport;
}

// isMapLoaded is driven solely by the map-init event so that a failed async
// load (errorComponent path) does not leave a blank container. The loading
// spinner inside AppLoadingState is hidden separately when isReturningFromForm
// is true to avoid a visual flash when navigating back from the report form.
const isMapLoaded = ref(false);

// Reference to the Map component
const mapComponentRef = ref<any>(null);

// Forward all attributes and events
defineOptions({
    inheritAttrs: false
});

// Expose Map component methods
defineExpose({
    handleLocationSelect: (locationData: { lat: number, lng: number, address: string, validationResult?: { valid: boolean, message: string, hardInvalid?: boolean } }) => {
        mapComponentRef.value?.handleLocationSelect(locationData);
    },
    updateUserLocationMarker: (coords: { lat: number, lng: number }) => {
        mapComponentRef.value?.updateUserLocationMarker(coords);
    },
    map: computed(() => mapComponentRef.value?.map),
    mapFunctions: computed(() => mapComponentRef.value?.mapFunctions)
});

function onMapInit(map: any) {
    isMapLoaded.value = true;

    // Forward the map-init event
    emit('map-init', map);
}

// Forward all parent events
const emit = defineEmits<{
    'map-init': [map: any]
    'update:bounds': [bounds: any, isDetailView?: boolean]
    'select-report': [report: any]
    'add-report': [type: 'photo' | 'classic', location?: { lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> }]
    'geolocate': [coords: { lat: number, lng: number }]
    'geolocate-to-pick': [coords: { lat: number, lng: number }]
    'toggle-language': []
    'map-tap': []
    'map-interaction': []
}>();
</script>
