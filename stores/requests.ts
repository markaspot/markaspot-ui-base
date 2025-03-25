import { defineStore } from 'pinia'
import type { Request, Marker, BoundsType } from '~/types'
import clientConfig from '../config/clients'

export const useRequestsStore = defineStore('requests', {
  state: () => ({
    allRequests: {} as Record<string, Request>,
    requestsCache: new Map(),
    isLoading: false,
    errorMessage: '',
    currentBounds: null as BoundsType | null,
    currentService: null as string | null,
    itemsPerPage: clientConfig.requests?.itemsPerPage || 20,
    cacheTTL: clientConfig.requests?.cacheTTL || 5 * 60 * 1000,
    maxRequests: clientConfig.requests?.maxRequests || 100
  }),

  getters: {
    filteredRequests: (state) => {
      const requests = Object.values(state.allRequests)

      if (!state.currentBounds) {
        return requests
      }

      const { minLat, maxLat, minLng, maxLng } = state.currentBounds

      return requests.filter(request => {
        // Ensure lat/long values exist and are valid numbers
        if (!request?.lat || !request?.long) {
          return false
        }

        try {
          const lat = typeof request.lat === 'string' ? parseFloat(request.lat) : request.lat
          const lng = typeof request.long === 'string' ? parseFloat(request.long) : request.long

          
          if (isNaN(lat) || isNaN(lng)) {
            return false
          }

          return lat >= minLat &&
            lat <= maxLat &&
            lng >= minLng &&
            lng <= maxLng
        } catch (e) {
          console.warn('Invalid coordinates for request:', request.service_request_id)
          return false
        }
      })
    },

    visibleMarkers: (state): Marker[] => {
      
      return state.filteredRequests
        .filter(request => request?.lat && request?.long) 
        .map(request => ({
          lat: typeof request.lat === 'string' ? parseFloat(request.lat) : request.lat,
          lng: typeof request.long === 'string' ? parseFloat(request.long) : request.long
        }))
    }
  },

  actions: {
    async fetchRequests(bounds: BoundsType, serviceCode: string | null = null, page = 1) {
      const cacheKey = `${bounds.minLat},${bounds.maxLat},${bounds.minLng},${bounds.maxLng}-${serviceCode}-${page}`

      
      if (page === 1 && this.requestsCache.has(cacheKey)) {
        const cached = this.requestsCache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          
          cached.data.forEach(request => {
            this.allRequests[request.service_request_id] = request
          })
          return
        }
      }

      this.isLoading = true

      try {
        const params: Record<string, string> = {
          bbox: `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`,
          extensions: 'true',
          sort: 'desc',
          start_date: '2001-01-01',
          limit: this.itemsPerPage.toString(),
          offset: ((page - 1) * this.itemsPerPage).toString()
        }

        if (serviceCode) {
          params.service_code = serviceCode
          this.currentService = serviceCode
        }

        const data = await useApiClient().get<Request[]>('/georeport/v2/requests.json', params)

        
        if (page === 1) {
          this.requestsCache.set(cacheKey, {
            data,
            timestamp: Date.now()
          })
        }

        
        data.forEach(request => {
          if (!this.allRequests[request.service_request_id] &&
              request.lat &&
              request.long) {
            
            
            if (!request.extended_attributes || !request.extended_attributes.markaspot) {
              console.warn('Missing extended_attributes.markaspot in request:', request.service_request_id);
            }
            
            
            const statusHex = request.extended_attributes?.markaspot?.status_hex;
            
            
            if (!statusHex) {
              console.warn('Missing status_hex for request:', request.service_request_id, 
                'Extended attrs:', request.extended_attributes);
            }
            
            this.allRequests[request.service_request_id] = {
              ...request,
              category_hex: request.extended_attributes?.markaspot?.category_hex || '#808080',
              category_icon: request.extended_attributes?.markaspot?.category_icon || 'fa-map-marker',
              status_hex: statusHex || '#959595', 
              status_descriptive_name: request.extended_attributes?.markaspot?.status_descriptive_name
            }
          }
        })

        this.currentBounds = bounds

        
        return data.length

      } catch (error) {
        console.error('Error fetching requests:', error)
        this.errorMessage = 'Failed to load requests'
        return 0
      } finally {
        this.isLoading = false
      }
    },
    async fetchRequestById(id: string): Promise<Request | null> {
      this.isLoading = true

      try {
         

        const rawResponse = await useApiClient().get<any>(
          `/georeport/v2/requests/${id}.json`,
          { extensions: 'true' }
        )

         

        
        const response = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse

        if (response) {
          
          if (!response.extended_attributes || !response.extended_attributes.markaspot) {
            console.warn('In fetchRequestById: Missing extended_attributes.markaspot in request:', response.service_request_id);
          }
          
          
          const statusHex = response.extended_attributes?.markaspot?.status_hex;
          
          
          if (!statusHex) {
            console.warn('In fetchRequestById: Missing status_hex for request:', response.service_request_id, 
              'Extended attrs:', response.extended_attributes);
          }
          
          const processedRequest = {
            ...response,
            category_hex: response.extended_attributes?.markaspot?.category_hex || '#808080',
            category_icon: response.extended_attributes?.markaspot?.category_icon || 'fa-map-marker',
            status_hex: statusHex || '#959595', 
            status_descriptive_name: response.extended_attributes?.markaspot?.status_descriptive_name || null
          }

          
          const lat = parseFloat(response.lat)
          const long = parseFloat(response.long)

          if (!isNaN(lat) && !isNaN(long)) {
            this.allRequests[String(response.service_request_id)] = processedRequest
            :', processedRequest)
            return processedRequest
          } else {
            console.warn('Invalid coordinates for request:', response)
          }
        }

        return null
      } catch (error) {
        console.error('Error fetching single request:', error)
        this.errorMessage = 'Failed to load request'
        return null
      } finally {
        this.isLoading = false
      }
    },

    async handleBoundsUpdate(bounds: BoundsType, isDetailView = false) {
      if (isDetailView) return
      await this.fetchRequests(bounds, this.currentService)
    },

    getRequestById(id: string): Request | null {
      
      return this.allRequests[id] || null
    },

    clearStore() {
      this.allRequests = {}
      this.currentBounds = null
    }
  }
})
