<template>
  <div
    class="dark:bg-gray-800 flex-shrink-0 z-30"
    ref="headerRef"
    :style="{
      height: `${headerHeight}px`,
      transition: `height ${animationDuration}ms ${animationEasing}`
    }"
  >
    <!-- Main Header with dynamic height -->
    <div class="px-6 py-4 h-full overflow-hidden">
      <div class="flex items-center h-full">
        <!-- Logo Area -->
        <div class="flex items-center gap-6 h-full">
          <!-- Logo Image -->
          <Logo
            ref="logoRef"
            :alt="$t('header.logo_alt')"
            :height="configuredLogoHeight"
            class="w-auto object-contain"
            @load="onLogoLoad"
          />
          <!-- Text Area -->
          <div class="flex flex-col">
            <h2 class="text-xl font-medium">
              {{ $t('header.app_name') }}
            </h2>
            <span class="dark:text-gray-300 text-gray-600 text-base">
              {{ $t('header.app_claim') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { clientConfig } = useRuntimeConfig().public


const configuredHeaderHeight = computed(() => {
  return clientConfig?.theme?.ui?.headerHeight || 'auto'
})

const configuredLogoHeight = computed(() => {
  return clientConfig?.theme?.logoHeight || '40px'
})

const animationDuration = computed(() => {
  return clientConfig?.theme?.ui?.animations?.duration || 300
})


const animationEasing = computed(() => {
  const type = clientConfig?.theme?.ui?.animations?.type || 'bounce'
  const configEasing = clientConfig?.theme?.ui?.animations?.easing
  
  
  if (configEasing) return configEasing
  
  switch (type) {
    case 'bounce':
      return 'cubic-bezier(0.34, 1.56, 0.64, 1)' 
    case 'smooth':
      return 'cubic-bezier(0.4, 0, 0.2, 1)' 
    case 'linear':
      return 'linear'
    default:
      return 'cubic-bezier(0.34, 1.56, 0.64, 1)' 
  }
})


const logoRef = ref(null)
const headerRef = ref(null)
const headerHeight = ref(120) 


const onLogoLoad = async () => {
  await nextTick()
  
  
  if (configuredHeaderHeight.value !== 'auto') {
    
    if (configuredHeaderHeight.value.endsWith('px')) {
      const parsedHeight = parseInt(configuredHeaderHeight.value)
      if (!isNaN(parsedHeight)) {
        headerHeight.value = parsedHeight
        emit('header-height-change', headerHeight.value)
        return
      }
    }
    
    const parsedHeight = parseInt(configuredHeaderHeight.value)
    if (!isNaN(parsedHeight)) {
      headerHeight.value = parsedHeight
      emit('header-height-change', headerHeight.value)
      return
    }
  }
  
  
  if (logoRef.value) {
    const logo = logoRef.value.$el || logoRef.value 
    const logoHeight = logo.offsetHeight || logo.clientHeight
    const padding = 32 
    
    
    headerHeight.value = Math.max(80, logoHeight + padding) 
    
    
    emit('header-height-change', headerHeight.value)
  }
}

onMounted(async () => {
  
  if (configuredHeaderHeight.value !== 'auto') {
    if (configuredHeaderHeight.value.endsWith('px')) {
      const parsedHeight = parseInt(configuredHeaderHeight.value)
      if (!isNaN(parsedHeight)) {
        headerHeight.value = parsedHeight
        emit('header-height-change', headerHeight.value)
      }
    } else {
      const parsedHeight = parseInt(configuredHeaderHeight.value)
      if (!isNaN(parsedHeight)) {
        headerHeight.value = parsedHeight
        emit('header-height-change', headerHeight.value)
      }
    }
  }
  
  
  await nextTick()
  onLogoLoad()
  
  
  window.addEventListener('resize', onLogoLoad)
})

onBeforeUnmount(() => {
  
  window.removeEventListener('resize', onLogoLoad)
})

const emit = defineEmits(['header-height-change'])
</script>

<style scoped>
:deep(img) {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>
