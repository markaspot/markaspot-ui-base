
import { ref } from 'vue';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useColorMode } from '#imports';

interface IconCache {
  [key: string]: boolean;
}

export function useMapIcons(mapInstance: MapLibreMap) {
  const loadedIcons = ref<IconCache>({});
  const pendingLoads = new Map<string, Promise<void>>();
  const colorMode = useColorMode();

  const getBorderColor = (categoryHex: string) => {
    
    if (colorMode.value === 'dark') {
      return '#ffffff'; 
    } else {
      return '#000000'; 
    }
  };
  const cleanIconName = (iconName: string | undefined): string => {
    if (!iconName) return 'question-circle';
    return iconName
      .replace(/^(far|fas)\s/, '')
      .replace('fa-', '')
      .replace(/-o$/, '')
      .replace(/\s/g, '-')
      .toLowerCase();
  };

  const createSVGElement = (svgText: string, color: string): SVGElement => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;

    
    if (!svg.getAttribute('viewBox')) {
      svg.setAttribute('viewBox', '0 0 24 24');
    }

    
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');

    
    Array.from(svg.getElementsByTagName('*')).forEach(el => {
      el.removeAttribute('fill');
    });
    svg.setAttribute('fill', color);

    return svg;
  };

  const svgToImage = async (svg: SVGElement): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };

      img.width = 24;
      img.height = 24;
      img.src = url;
    });
  };

  const loadIcon = async (iconName: string, color: string): Promise<void> => {
    if (!iconName || !color) return;

    const cleanName = cleanIconName(iconName);
    const iconId = `${cleanName}-${color}`;

    if (loadedIcons.value[iconId]) return;

    try {
      const response = await fetch(`/icons/${cleanName}.svg`);
      if (!response.ok) return;

      let svgText = await response.text();

      
      svgText = svgText
        .replace(/width="[^"]*"/, '')
        .replace(/height="[^"]*"/, '')
        .replace(/fill="[^"]*"/g, '')
        .replace(/<svg/, `<svg width="20" height="20" fill="${color}"`);

      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 20; 
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Failed to get context'));

          ctx.drawImage(img, 0, 0, size, size);

          if (!mapInstance.hasImage(iconId)) {
            const imageData = ctx.getImageData(0, 0, size, size);
            mapInstance.addImage(iconId, {
              width: size,
              height: size,
              data: imageData.data
            });
            loadedIcons.value[iconId] = true;
          }

          URL.revokeObjectURL(url);
          resolve();
        };

        img.onerror = reject;
        img.src = url;
      });
    } catch (error) {
      console.warn(`Error loading icon "${iconName}":`, error);
    }
  };

  const updateGeoJSONSource = useDebounceFn(async (reports: any[] | undefined) => {
    if (!mapInstance || !reports?.length) {
      console.debug('Skipping GeoJSON update - no valid map instance or reports');
      return;
    }

    try {
      
      const validReports = reports.filter(report => {
        if (!report) return false;
        const lat = Number(report.lat);
        const lng = Number(report.long);
        return Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          report.category_icon &&
          report.category_hex;
      });

      if (!validReports.length) {
        console.debug('No valid reports to display');
        return;
      }

      
      const iconLoadPromises = validReports.map((report) => {
        const iconName = cleanIconName(report.category_icon);
        const iconColor = invertColor(report.category_hex, true);
        return loadIcon(iconName, iconColor);
      });

      await Promise.all(iconLoadPromises);

      
      const geojsonData = {
        type: 'FeatureCollection',
        features: validReports.map((report) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(report.long), parseFloat(report.lat)]
          },
          properties: {
            id: report.service_request_id,
            title: report.service_name,
            address: report.address_string,
            color: report.category_hex,
            contrast_color: invertColor(report.category_hex, true),
            border_color: getBorderColor(report.category_hex),
            icon: `${cleanIconName(report.category_icon)}-${invertColor(report.category_hex, true)}`,
            magnitude: 1
          }
        }))
      };

      const source = mapInstance.getSource('reports-geojson');
      if (source) {
        (source as any).setData(geojsonData);
      }
    } catch (error) {
      console.warn('Error updating GeoJSON source:', error);
    }
  }, 300);

  const clearIcons = () => {
    Object.keys(loadedIcons.value).forEach((iconId) => {
      if (mapInstance.hasImage(iconId)) {
        mapInstance.removeImage(iconId);
      }
    });
    loadedIcons.value = {};
  };

  return {
    loadIcon,
    clearIcons,
    updateGeoJSONSource,
    isIconLoaded: (name: string, color: string) =>
      !!loadedIcons.value[`${cleanIconName(name)}-${color}`]
  };
}
