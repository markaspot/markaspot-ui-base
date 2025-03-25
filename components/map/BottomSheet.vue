
<template>
  <DraggableBottomSheet
      v-model="sheetHeight"
      :min-height="headerHeight"
      :max-height="maxHeight"
      :default-height="480"
      :header-height="headerHeight"
      :animation-duration="animationDuration"
      :animation-easing="animationEasing"
  >
    <MainNavigation
        :requests="requests"
        @select-report="$emit('select-report', $event)"
        @select-page="$emit('select-page', $event)"
        @header-height-change="onHeaderHeightChange"
    />
  </DraggableBottomSheet>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'

const { clientConfig } = useRuntimeConfig().public

const showInfo = ref(false)
const showOnFirstVisit = ref(false)
const sheetHeight = ref(280)
const headerHeight = ref(120) 


const animationDuration = computed(() => 
  clientConfig?.theme?.ui?.animations?.duration || 300
)


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
const maxHeight = computed(() => typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800)

const props = defineProps<{
  requests: Array<any>
}>()


const onHeaderHeightChange = (height: number) => {
  headerHeight.value = height
  
  
  const minVisibleHeight = Math.max(height, 100) 
  
  
  
  if (sheetHeight.value < minVisibleHeight + 50) {
    sheetHeight.value = minVisibleHeight + 100 
  }
}


</script>

<style scoped>
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

.overflow-y-auto::-webkit-scrollbar {
  display: none;
}

.overflow-y-auto {
  -ms-overflow-style: none;    scrollbar-width: none;  }

.transition-transform {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.h-screen {
  height: 100vh;
  height: 100dvh;
}
</style>
