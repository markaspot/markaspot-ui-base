<template>
  <div
      ref="sheet"
      class="fixed left-0 right-0 bottom-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-lg"
      :style="{
      height: `${currentHeight}px`,
      transform: `translateY(0px)`,
      transition: `height ${animationDuration}ms ${animationEasing}`
    }"
  >
    <!-- Drag Handle - Now handles both mouse and touch events -->
    <div
        ref="handle"
        class="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none"
        @mousedown="onDragStart"
        @touchstart="onTouchStart"
        @click.stop="cycleHeight"
    >
      <div class="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"></div>
    </div>

    <!-- Content Container -->
    <div class="h-[calc(100%-24px)] overflow-hidden">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  minHeight: number
  maxHeight: number
  defaultHeight: number
  headerHeight?: number
  animationDuration?: number
  animationEasing?: string
}>(), {
  minHeight: 100,        
  defaultHeight: 265,    
  headerHeight: 120,     
  animationDuration: 300, 
  animationEasing: 'cubic-bezier(0.4, 0, 0.2, 1)' 
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const sheet = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(0)
const currentHeight = ref(props.defaultHeight)


watch(() => props.modelValue, (newValue) => {
  currentHeight.value = newValue
})

const cycleHeight = () => {
  if (currentHeight.value <= props.minHeight + 10) {
    
    currentHeight.value = props.defaultHeight
  } else if (currentHeight.value < props.maxHeight - 10) {
    
    currentHeight.value = props.maxHeight
  } else {
    
    currentHeight.value = props.minHeight
  }
  emit('update:modelValue', currentHeight.value)
}

const onDragStart = (e: MouseEvent) => {
  isDragging.value = true
  startY.value = e.clientY
  startHeight.value = currentHeight.value

  
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}


const onDragMove = (e: TouchEvent | MouseEvent) => {
  if (!isDragging.value) return

  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const delta = startY.value - clientY
  
  const newHeight = Math.max(
    props.minHeight, 
    Math.min(props.maxHeight, startHeight.value + delta)
  )

  
  if (newHeight < props.minHeight + 20) {
    currentHeight.value = props.minHeight +
        (newHeight - props.minHeight) * 0.5
  } else {
    currentHeight.value = newHeight
  }

  emit('update:modelValue', currentHeight.value)
}

const onDragEnd = () => {
  isDragging.value = false

  
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}


const onTouchStart = (e: TouchEvent) => {
  startY.value = e.touches[0].clientY
  startHeight.value = currentHeight.value

  
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

const onTouchMove = (e: TouchEvent) => {
  e.preventDefault() 
  const delta = startY.value - e.touches[0].clientY
  const newHeight = startHeight.value + delta

  if (newHeight >= props.minHeight && newHeight <= props.maxHeight) {
    currentHeight.value = newHeight
    emit('update:modelValue', newHeight)
  }
}

const onTouchEnd = () => {
  
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

onMounted(() => {
  
  watch(() => props.headerHeight, (newHeaderHeight) => {
    
    if (currentHeight.value <= props.minHeight + 10) {
      currentHeight.value = newHeaderHeight
      emit('update:modelValue', currentHeight.value)
    }
  })
  
  
  currentHeight.value = props.defaultHeight
  emit('update:modelValue', props.defaultHeight)
})

onUnmounted(() => {
  
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped>
.select-none {
  user-select: none;
}
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}


</style>
