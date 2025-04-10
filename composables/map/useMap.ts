import { watch } from 'vue';
import type { Map as MapLibreMap } from 'maplibre-gl';

interface MapProps {
  markers: any[];
}

export function useMap(
  mapInstance: MapLibreMap,
  props: MapProps,
  emit: (event: string, ...args: any[]) => void
) {
  const { updateGeoJSONSource } = useMapIcons(mapInstance);

  const ZOOM_LEVELS = {
    HEATMAP_MAX: 14,
    CLUSTER_MIN: 10,
    CLUSTER_MAX: 15,
    MARKER_MIN: 13
  };

  const updateVisibility = (zoom: number) => {
    const showHeatmap = zoom < ZOOM_LEVELS.HEATMAP_MAX;
    const showClusters = zoom >= ZOOM_LEVELS.CLUSTER_MIN && zoom < ZOOM_LEVELS.CLUSTER_MAX;
    const showMarkers = zoom >= ZOOM_LEVELS.MARKER_MIN;

    const layers = {
      'reports-heat': showHeatmap,
      'clusters': showClusters,
      'cluster-count': showClusters,
      'reports-circles': showMarkers,
      'reports-symbols': showMarkers
    };

    Object.entries(layers).forEach(([layerId, visible]) => {
      if (mapInstance.getLayer(layerId)) {
        mapInstance.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none'
        );
      }
    });
  };

  const addHeatmapLayer = () => {
    if (!mapInstance.getLayer('reports-heat')) {
      mapInstance.addLayer({
        id: 'reports-heat',
        type: 'heatmap',
        source: 'reports-geojson',
        layout: {
          visibility: 'none'
        },
        paint: {
          
          'heatmap-weight': [
            'case',
            ['has', 'point_count'], ['/', ['get', 'point_count'], 40], 
            1 
          ],
          
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            0, 0.5,
            ZOOM_LEVELS.HEATMAP_MAX, 1.5
          ],
          
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,255,0)',      
            0.1, 'rgba(65,105,225,0.5)', 
            0.3, 'rgba(0,255,255,0.6)',  
            0.5, 'rgba(0,255,0,0.7)',    
            0.7, 'rgba(255,255,0,0.8)',  
            0.9, 'rgba(255,0,0,0.9)',    
            1, 'rgba(255,0,0,1)'         
          ],
          
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            0, 10,
            ZOOM_LEVELS.HEATMAP_MAX, 100
          ],
          'heatmap-opacity': 0.8
        }
      });
    }
  };

  const addClusterLayers = () => {
    if (!mapInstance.getLayer('clusters')) {
      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'reports-geojson',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100, '#f1f075',
            750, '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100, 30,
            750, 40
          ]
        }
      });

      mapInstance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'reports-geojson',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Noto Sans Regular'],
          'text-size': 12
        },
        paint: {
          'text-color': '#000000'
        }
      });
    }
  };

  const addMarkerLayers = () => {
    if (!mapInstance.getLayer('reports-circles')) {
      mapInstance.addLayer({
        id: 'reports-circles',
        type: 'circle',
        source: 'reports-geojson',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 15,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': ['get', 'border_color']
        }
      });
    }

    if (!mapInstance.getLayer('reports-symbols')) {
      mapInstance.addLayer({
        id: 'reports-symbols',
        type: 'symbol',
        source: 'reports-geojson',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': 0.6,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-padding': 0,
          'icon-offset': [0, 0]
        },
        paint: {
          'icon-color': ['get', 'contrast_color'],
          'icon-opacity': 1
        }
      });
    }
  };

  const toggleHeatmap = () => {
    const heatmapLayerId = 'reports-heat';
    if (!mapInstance.getLayer(heatmapLayerId)) return false;

    const currentVisibility = mapInstance.getLayoutProperty(heatmapLayerId, 'visibility');
    const newVisibility = currentVisibility === 'visible' ? 'none' : 'visible';

    mapInstance.setLayoutProperty(heatmapLayerId, 'visibility', newVisibility);
    return newVisibility === 'visible';
  };

  const initializeMarkerLayers = async () => {
    if (!mapInstance?.loaded() || !mapInstance.isStyleLoaded()) {
      await new Promise<void>((resolve) => {
        mapInstance.once('styledata', () => resolve());
      });
    }

    if (!mapInstance.getSource('reports-geojson')) {
      try {
        mapInstance.addSource('reports-geojson', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          },
          cluster: true,
          clusterRadius: 50
        });
      } catch (error) {
        console.error('Error adding reports-geojson source:', error);
      }
    }

    addHeatmapLayer();
    addClusterLayers();
    addMarkerLayers();

    if (props.markers.length > 0) {
      
      await updateGeoJSONSource(props.markers);
    }

    
    updateVisibility(mapInstance.getZoom());

    
    mapInstance.on('zoom', () => {
      updateVisibility(mapInstance.getZoom());
    });

    
    mapInstance.on('click', 'reports-symbols', (e: any) => {
      const feature = e.features[0];
      if (feature) {
        const report = props.markers.find((m) => m.service_request_id === feature.properties.id);
        if (report) {
          emit('select-report', { report, mapInstance });
        }
      }
    });

    mapInstance.on('mouseenter', 'reports-symbols', () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });

    mapInstance.on('mouseleave', 'reports-symbols', () => {
      mapInstance.getCanvas().style.cursor = '';
    });

    mapInstance.on('mouseenter', 'clusters', () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });

    mapInstance.on('mouseleave', 'clusters', () => {
      mapInstance.getCanvas().style.cursor = '';
    });

    mapInstance.on('click', 'clusters', (e) => {
      const features = mapInstance.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (!features.length) return;

      const coordinates = features[0].geometry.coordinates;
      const currentZoom = mapInstance.getZoom();

      mapInstance.flyTo({
        center: coordinates,
        zoom: currentZoom + 2,
        duration: 500,
      });
    });
  };



  
  const setMapPitch = (pitch: number) => {
    if (mapInstance && mapInstance.loaded()) {
      mapInstance.setPitch(pitch);
    }
  };

  return {
    updateGeoJSONSource,
    initializeMarkerLayers,
    toggleHeatmap,
    setMapPitch
  };
}
