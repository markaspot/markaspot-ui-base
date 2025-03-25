
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import type { GeocodingResult } from '~/plugins/geocoding/types'

export function useGeocoding() {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()
  
  
  const provider = nuxtApp.$geocoding.getProvider()
  
  
  const isLoading = ref(false)
  const error = ref(null)
  
    const search = async (query: string, options?: any): Promise<GeocodingResult[]> => {
    if (!query?.trim()) return []
    
    isLoading.value = true
    error.value = null
    
    try {
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Geocoding request timed out')), 5000)
      })
      
      
      const results = await Promise.race([
        provider.geocode(query, options),
        timeoutPromise
      ])
      
      return results
    } catch (err: any) {
      console.error('Geocoding search error:', err.message)
      error.value = err.message
      
      
      return []
    } finally {
      isLoading.value = false
    }
  }
  
    const reverse = async (lat: number, lng: number): Promise<GeocodingResult> => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates')
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Reverse geocoding request timed out')), 5000)
      })
      
      
      const result = await Promise.race([
        provider.reverseGeocode(lat, lng),
        timeoutPromise
      ])
      
      return result
    } catch (err: any) {
      console.error('Reverse geocoding error:', err.message)
      error.value = err.message
      
      
      return {
        lat,
        lng, 
        displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        address: {}
      }
    } finally {
      isLoading.value = false
    }
  }
  
    const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
  
    const formatAddress = (address: GeocodingResult['address'] = {}): string => {
    const parts = []
    
    if (address.street) {
      const street = [address.street]
      if (address.houseNumber) {
        street.push(address.houseNumber)
      }
      parts.push(street.join(' '))
    }
    
    if (address.city) {
      const cityParts = []
      if (address.postcode) {
        cityParts.push(address.postcode)
      }
      cityParts.push(address.city)
      parts.push(cityParts.join(' '))
    } else if (address.state) {
      parts.push(address.state)
    }
    
    return parts.join(', ') || 'Unknown location'
  }
  
  return {
    search,
    reverse,
    formatCoordinates,
    formatAddress,
    isLoading,
    error,
    provider
  }
}