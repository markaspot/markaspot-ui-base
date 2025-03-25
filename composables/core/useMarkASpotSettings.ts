import { ref, computed } from 'vue'
import { useRuntimeConfig } from '#app'


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
    mapbox_style_dark: string;
    marker: string;
    iconAnchor: string;
    maplibre: number;
    
}

export const useMarkASpotSettings = () => {
    const api = useApiClient();
    const settings = ref<DrupalMarkASpotSettings | null>(null);
    const loading = ref(false);
    const error = ref<Error | null>(null);

    
    const localStorageKey = 'markASpotSettings';

    
    const isClient = typeof window !== 'undefined';

    
    const loadCachedSettings = () => {
        if (!isClient) return; 
        const cachedSettings = localStorage.getItem(localStorageKey);
        if (cachedSettings) {
            try {
                settings.value = JSON.parse(cachedSettings);
            } catch (err) {
                console.error('Failed to parse cached settings:', err);
            }
        }
    };

    
    const saveSettingsToCache = (data: DrupalMarkASpotSettings) => {
        if (!isClient) return; 
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        
    };

    
    const fetchSettings = async () => {
        if (settings.value) return; 

        loading.value = true;
        error.value = null;

        try {
            const response = await api.get<DrupalMarkASpotSettings>('/jsonapi/mark-a-spot-settings'); 
            if (response && typeof response === 'object') {
                settings.value = response;
                saveSettingsToCache(response); 
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            error.value = err as Error;
            settings.value = null;
        } finally {
            loading.value = false;
        }
    };

    
    const mapSettings = computed(() => {
        if (!settings.value) {
            return {
                style: '',
                center: { lat: 0, lng: 0 },
                zoom: 13, // Default zoom
            };
        }

        return {
            style: settings.value.mapbox_style || '',
            style_dark: settings.value.mapbox_style_dark || '',
            center: {
                lat: parseFloat(settings.value.center_lat) || 0,
                lng: parseFloat(settings.value.center_lng) || 0,
            },
            zoom: parseInt(settings.value.zoom_initial) || 13,
        };
    });

    
    if (isClient) {
        loadCachedSettings();
    }

    return {
        settings,
        loading,
        error,
        fetchSettings,
        mapSettings,
    };
};
