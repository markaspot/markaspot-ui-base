
import { useRuntimeConfig } from '#app'
import { computed } from 'vue'
import type { Map } from 'maplibre-gl'
import { useColorMode } from '#imports'

export const useMapStyles = () => {
  const config = useRuntimeConfig()
  const colorMode = useColorMode()

  
  const isDark = computed(() => colorMode.value === 'dark')

  
  const getMapTilerStyleUrl = (): string | null => {
    const apiKey = config.public.maptilerKey
    if (!apiKey) {
      console.warn('MapTiler API key not configured')
      return null
    }

    
    const style = colorMode.value === 'dark' ? 'dataviz-dark' : 'dataviz-light'
    const styleUrl = `https://api.maptiler.com/maps/${style}/style.json?key=${apiKey}`
    return styleUrl
  }

  
  const loadMapStyle = async (mapInstance: Map, styleUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const cleanup = () => {
        mapInstance.off('style.load', onStyleLoad)
        mapInstance.off('error', onStyleError)
      }

      const onStyleLoad = () => {
        cleanup()
        resolve(true)
      }

      const onStyleError = (error: any) => {
        cleanup()
        resolve(false)
      }

      mapInstance.once('style.load', onStyleLoad)
      mapInstance.once('error', onStyleError)

      try {
        mapInstance.setStyle(styleUrl)
      } catch (error) {
        cleanup()
        console.error('Error setting style:', error)
        resolve(false)
      }
    })
  }

  const useFallback = async (
      mapInstance: Map,
      mapSettings: { mapbox_style: string; mapbox_style_dark: string }
  ): Promise<boolean> => {
    
    const isCurrentlyDark = colorMode.value === 'dark'
    
    const primaryStyle = isCurrentlyDark
        ? mapSettings.mapbox_style_dark
        : mapSettings.mapbox_style

    if (primaryStyle) {
      try {
        const primarySuccess = await loadMapStyle(mapInstance, primaryStyle)
        if (primarySuccess) {
          return true
        }
        console.warn('Primary style failed, attempting fallback...')
      } catch (error) {
        console.warn('Error loading primary style:', error)
      }
    }

    
    const maptilerStyle = getMapTilerStyleUrl()
    if (maptilerStyle) {
      try {
        
        const fallbackSuccess = await loadMapStyle(mapInstance, maptilerStyle)
        if (fallbackSuccess) {
          
          return true
        }
        console.warn('MapTiler fallback style failed')
      } catch (error) {
        console.warn('Error loading MapTiler fallback style:', error)
      }
    }

    return false
  }

  return {
    useFallback,
    getMapTilerStyleUrl,
    isDark,
  }
}
