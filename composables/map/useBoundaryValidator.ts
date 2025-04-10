
import { ref, onMounted, computed } from 'vue'


const boundaries = ref<any>(null)
const isLoading = ref(true)
const error = ref<Error | null>(null)

export function useBoundaryValidator() {
  const appConfig = useAppConfig()
  const { t } = useI18n()
  
  
  const boundaryConfig = computed(() => {
    return appConfig.features?.boundaries || {
      enabled: true,
      file: 'default',
      strictValidation: true,
      showBoundaryOnMap: true
    }
  })
  
  
  const boundaryProperties = computed(() => {
    if (!boundaries.value || !boundaries.value.features || !boundaries.value.features.length) {
      return null;
    }
    return boundaries.value.features[0]?.properties || null;
  })
  
  
  onMounted(async () => {
    if (boundaries.value === null) {
      try {
        
        if (!boundaryConfig.value.enabled) {
          boundaries.value = { 
            type: "FeatureCollection", 
            features: [{ 
              type: "Feature", 
              properties: {}, 
              geometry: { 
                type: "MultiPolygon", 
                coordinates: [] 
              }
            }]
          }
          isLoading.value = false
          return
        }
        
        
        const boundaryFile = boundaryConfig.value.file || 'default'
        
        
        const response = await fetch(`/data/boundaries/${boundaryFile}.json`)
        
        if (!response.ok) {
          
          if (boundaryFile !== 'default') {
            const defaultResponse = await fetch('/data/boundaries/default.json')
            if (defaultResponse.ok) {
              boundaries.value = await defaultResponse.json()
            } else {
              throw new Error(`Failed to load boundaries: ${defaultResponse.statusText}`)
            }
          } else {
            throw new Error(`Failed to load boundaries: ${response.statusText}`)
          }
        } else {
          boundaries.value = await response.json()
        }
        
        isLoading.value = false
      } catch (e) {
        error.value = e as Error
        isLoading.value = false
        console.error('Failed to load boundaries data:', e)
      }
    }
  })

    const isPointInBoundary = (lat: number, lng: number): boolean | null => {
    
    if (!boundaryConfig.value.enabled) {
      return true
    }
    
    if (isLoading.value || error.value || !boundaries.value || !boundaries.value.features || !boundaries.value.features.length) {
      return null 
    }

    
    const geometry = boundaries.value.features[0]?.geometry;
    if (!geometry) {
      return false;
    }
    
    
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.some((polygon: number[][][]) => 
        isPointInPolygon([lng, lat], polygon[0])
      )
    }
    
    
    if (geometry.type === 'Polygon') {
      return isPointInPolygon([lng, lat], geometry.coordinates[0])
    }
    
    return false 
  }

    const isPointInPolygon = (point: number[], polygon: number[][]): boolean => {
    
    const x = point[0], y = point[1]
    
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1]
      const xj = polygon[j][0], yj = polygon[j][1]
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    
    return inside
  }

    const getBoundaryGeoJSON = () => {
    if (isLoading.value || error.value || !boundaries.value || !boundaryConfig.value.showBoundaryOnMap) {
      return null
    }
    
    return boundaries.value
  }

    const getBoundaryMessage = (lat: number, lng: number): string => {
    
    if (!boundaryConfig.value.enabled) {
      return ''
    }
    
    if (isLoading.value) {
      return t('boundaries.loading')
    }
    
    if (error.value) {
      return t('boundaries.error')
    }
    
    const isInBoundary = isPointInBoundary(lat, lng)
    
    if (isInBoundary === null) {
      return t('boundaries.notLoaded')
    }
    
    
    const locationName = boundaryProperties.value?.NAME_LOCAL || boundaryProperties.value?.NAME_ENGLI || 'city';
    
    
    if (!boundaryConfig.value.strictValidation && !isInBoundary) {
      return t('boundaries.outsideNonStrict', { locationName })
    }
    
    return isInBoundary 
      ? '' // No message needed when inside boundary
      : t('boundaries.outsideStrict', { locationName })
  }

    const validateLocation = (lat: number, lng: number): { valid: boolean; message: string } => {
    
    if (!boundaryConfig.value.enabled) {
      return { valid: true, message: '' }
    }
    
    const isInBoundary = isPointInBoundary(lat, lng)
    
    // If boundaries aren't loaded yet, assume valid but return a message
    if (isInBoundary === null) {
      return { 
        valid: true, 
        message: t('boundaries.validationUnavailable')
      }
    }
    
    
    const locationName = boundaryProperties.value?.NAME_LOCAL || boundaryProperties.value?.NAME_ENGLI || 'city';
    
    
    if (isInBoundary) {
      return { valid: true, message: '' }
    }
    
    // If outside boundary but strict validation is disabled, it's still valid but with a warning
    if (!boundaryConfig.value.strictValidation) {
      return { 
        valid: true, 
        message: t('boundaries.outsideNonStrict', { locationName })
      }
    }
    
    
    return { 
      valid: false, 
      message: t('boundaries.outsideStrict', { locationName })
    }
  }

  return {
    isLoading,
    error,
    boundaryConfig,
    boundaryProperties,
    isPointInBoundary,
    getBoundaryMessage,
    getBoundaryGeoJSON,
    validateLocation
  }
}