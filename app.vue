<template>
  <NuxtPage/>
  <PWAInstallPrompt/>
  <ServiceUnavailableOverlay />
  <div v-if="false" class="fixed top-4 right-4 z-[10000]">
    <button @click="testServiceUnavailable" class="bg-red-500 text-white p-2 rounded">
      Test 503
    </button>
  </div>
</template>

<script setup>
import { useServiceStatus } from '~/composables/core/useServiceStatus';

const serviceStatus = useServiceStatus();

function testServiceUnavailable() {
  
  serviceStatus.registerServiceFailure({
    headers: new Map([['Retry-After', '10']])
  });
}
import {onMounted, provide, ref, watch} from 'vue';
import {useMarkASpotSettingsStore} from '@/stores/markASpotSettings';
import {useI18n} from 'vue-i18n';
import {useHead} from '#imports';
import {provideEmitter} from '@/composables/core/useEmitter';


const mapSettings = ref(null);


const markASpotSettingsStore = useMarkASpotSettingsStore();


const {locale, t} = useI18n();



useHead({
  htmlAttrs: {
    lang: locale
  },
  meta: [{
    name: 'description',
    content: () => t('meta.description')
  }, {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, interactive-widget=resizes-content'
  }]
});



const emitter = provideEmitter();


onMounted(async () => {
  
  if (!markASpotSettingsStore.settings) {
    await markASpotSettingsStore.fetchSettings();
  }
  mapSettings.value = markASpotSettingsStore.mapSettings;
  document.documentElement.lang = locale.value;
  
  
  document.documentElement.style.setProperty('--safe-area-inset-top', `env(safe-area-inset-top, 0px)`);
  document.documentElement.style.setProperty('--safe-area-inset-right', `env(safe-area-inset-right, 0px)`);
  document.documentElement.style.setProperty('--safe-area-inset-bottom', `env(safe-area-inset-bottom, 0px)`);
  document.documentElement.style.setProperty('--safe-area-inset-left', `env(safe-area-inset-left, 0px)`);
  
  
  emitter.on('show-page', (page) => {
    
  });
});


provide('mapSettings', mapSettings);


watch(locale, (newLocale) => {
  document.documentElement.lang = newLocale;
});
</script>

<style>
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}

@media (display-mode: standalone) {
  body {
    padding-top: var(--safe-area-inset-top);
  }
}

.safe-area-top {
  top: calc(env(safe-area-inset-top) + 16px);
}

.safe-area-bottom {
  bottom: env(safe-area-inset-bottom, 0px);
}

@media (display-mode: standalone) {
  .full-screen-safe {
    width: 100%;
    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  }
}
</style>