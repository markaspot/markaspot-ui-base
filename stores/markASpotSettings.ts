import { defineStore } from 'pinia'
import { ref, computed } from 'vue'


interface DrupalMarkASpotSettings {
    map_type: string;
    mapbox: string;
    osm_custom_tile_url: string;
    osm_custom_attribution: string;
    map_background: string;
    timeline_date_format: string;
    timeline_period: string;
    timeline_fps: string;
    nid_selector: string;
    zoom_initial: string;
    center_lat: string;
    center_lng: string;
    request_list_path: string;
    visualization_path: string;
    langcode: string;
    wms_service: string;
    wms_layer: string;
    mapbox_token: string;
    mapbox_style: string;
    marker: string;
    iconAnchor: string;
    maplibre: number;
}

export const useMarkASpotSettingsStore = defineStore('markASpotSettings', () => {
    const api = useApiClient()
    const settings = ref<DrupalMarkASpotSettings | null>(null)
    const loading = ref(false)
    const error = ref<Error | null>(null)

    
    const fetchSettings = async () => {
        if (settings.value) return 
        loading.value = true
        error.value = null

        try {
            
            const response = await api.get<DrupalMarkASpotSettings>('/api/mark-a-spot-settings')
            if (response && typeof response === 'object') {
                settings.value = response
                
            } else {
                throw new Error('Invalid API response structure')
            }
        } catch (err) {
            console.error('Error fetching settings:', err)
            error.value = err as Error
            settings.value = null
        } finally {
            loading.value = false
        }
    }

    
    const getSetting = <T>(key: keyof DrupalMarkASpotSettings, defaultValue: T): T => {
        return (settings.value?.[key] as unknown as T) ?? defaultValue
    }

    
    const mapSettings = computed(() => {
        if (!settings.value) {
            return {
                style: '',
                center: { lat: 0, lng: 0 },
                zoom: 13 // Default zoom
            }
        }

        return {
            style: settings.value.mapbox_style || '',
            center: {
                lat: parseFloat(settings.value.center_lat) || 0,
                lng: parseFloat(settings.value.center_lng) || 0
            },
            zoom: parseInt(settings.value.zoom_initial) || 13
        }
    })

    return {
        settings,
        loading,
        error,
        fetchSettings,
        getSetting,
        mapSettings
    }
})
