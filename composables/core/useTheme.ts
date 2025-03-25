// composables/core/useTheme.ts
import { computed } from 'vue'

export const useTheme = () => {
  const isDark = computed(() => false)
  const preference = computed({
    get: () => 'light',
    set: () => { console.warn('Dark mode is disabled in base edition') }
  })

  const toggle = () => {
    console.warn('Dark mode toggling is disabled in base edition')
  }

  return {
    isDark,
    preference,
    toggle,
    colorMode: { value: 'light', preference: 'light' }
  }
}
