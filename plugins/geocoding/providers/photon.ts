
import type { GeocodingProvider, GeocodingResult, GeocodingOptions } from '../types';

export function createPhotonProvider(): GeocodingProvider {
  const formatDisplayName = (properties: any): string => {
    
    if (properties.city) {
      const parts = [properties.postcode, properties.city]
        .filter(Boolean)
        .join(' ');
      return parts || properties.name || '';
    }
    return properties.name || '';
  };

  return {
    name: 'photon',

    async geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> {
      const params = new URLSearchParams({
        q: query,
        limit: (options?.limit || 5).toString(),
        lang: options?.language || 'de'
      });

      if (options?.bbox) {
        params.append('bbox', options.bbox);
      }

      if (options?.centerPoint) {
        params.append('lat', options.centerPoint.lat.toString());
        params.append('lon', options.centerPoint.lng.toString());
      }

      const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CityServicePortal'
        }
      });

      if (!response.ok) {
        throw new Error(`Photon geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.features.map((feature: any) => ({
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        displayName: formatDisplayName(feature.properties),
        address: {
          street: feature.properties.street,
          houseNumber: feature.properties.housenumber || null,
          postcode: feature.properties.postcode,
          city: feature.properties.city,
          state: feature.properties.state,
          country: feature.properties.country
        },
        raw: feature
      }));
    },

    async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
      if (typeof lat !== 'number' || typeof lng !== 'number' ||
        isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates provided');
      }

      const response = await fetch(
        `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CityServicePortal'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Photon reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.features?.length) {
        throw new Error('No results found');
      }

      const feature = data.features[0];
      return {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        displayName: formatDisplayName(feature.properties),
        address: {
          street: feature.properties.street,
          houseNumber: feature.properties.housenumber || null,
          postcode: feature.properties.postcode,
          city: feature.properties.city,
          state: feature.properties.state,
          country: feature.properties.country
        },
        raw: feature
      };
    }
  };
}
