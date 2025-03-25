<template>
  <img
    :src="computedLogoSrc"
    :alt="altText"
    class="object-contain"
    :style="{ 
      width: width === 'auto' ? 'auto' : width, 
      height: height === 'auto' ? 'auto' : height,
      maxHeight: height === 'auto' ? 'none' : height,
      maxWidth: '100%',
      transition: `all ${animationDuration}ms ${animationEasing}`
    }"
    @error="handleImageError"
    :aria-hidden="ariaHidden ? 'true' : 'false'"
    :role="ariaHidden ? null : 'img'"
  />
</template>

<script setup lang="ts">
import {computed} from 'vue'

const { clientConfig } = useRuntimeConfig().public


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

interface LogoProps {
  altText?: string
  width?: string
  height?: string
  src?: string
  ariaHidden?: boolean
}

const props = withDefaults(defineProps<LogoProps>(), {
  altText: 'Logo',
  width: '160px',
  height: 'auto',
  src: '',
  ariaHidden: false
})

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const computedLogoSrc = computed(() => {
  if (props.src) return props.src
  return isDark.value ? '/images/logo-dark.svg' : '/images/logo-light.svg'
})

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  console.warn(`Failed to load logo from ${target.src}`)
  target.src = '/images/logo-fallback.svg'
}
</script>
