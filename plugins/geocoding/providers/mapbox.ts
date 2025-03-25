
export function createMapboxProvider(accessToken: string): GeocodingProvider {
  const formatDisplayName = (feature: any): string => {
    const parts = [];

    
    if (feature.address) {
      parts.push(`${feature.text} ${feature.address}`);
    } else if (feature.text) {
      parts.push(feature.text);
    }

    
    if (feature.context) {
      const cityOrPlace = feature.context.find((ctx: any) =>
        ctx.id.startsWith('place.') || ctx.id.startsWith('locality.'));
      if (cityOrPlace) {
        parts.push(cityOrPlace.text);
      }
    }

    return parts.join(', ') || feature.place_name;
  };

  return {
    name: 'mapbox',

    async geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]> {
      const params = new URLSearchParams({
        access_token: accessToken,
        limit: (options?.limit || 5).toString(),
        language: options?.language || 'de',
        types: 'address,place,poi',
        country: 'de'
      });

      if (options?.bbox) {
        params.append('bbox', options.bbox);
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.features.map((feature: any) => {
        const context = feature.context?.reduce((acc: any, item: any) => {
          const id = item.id.split('.')[0];
          acc[id] = item.text;
          return acc;
        }, {});

        return {
          lat: feature.center[1],
          lng: feature.center[0],
          displayName: formatDisplayName(feature),
          address: {
            street: feature.text,
            houseNumber: feature.address || null,
            housenumber: feature.address || null, 
            city: context?.place,
            state: context?.region,
            country: context?.country,
            postcode: context?.postcode
          },
          raw: feature
        };
      });
    },

    async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
      const params = new URLSearchParams({
        access_token: accessToken,
        language: 'de',
        types: 'address,place,poi'
      });

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.features?.length) {
        throw new Error('No results found');
      }

      const feature = data.features[0];
      const context = feature.context?.reduce((acc: any, item: any) => {
        const id = item.id.split('.')[0];
        acc[id] = item.text;
        return acc;
      }, {});

      return {
        lat: feature.center[1],
        lng: feature.center[0],
        displayName: formatDisplayName(feature),
        address: {
          street: feature.text,
          houseNumber: feature.address || null,
          housenumber: feature.address || null, 
          city: context?.place,
          state: context?.region,
          country: context?.country,
          postcode: context?.postcode
        },
        raw: feature
      };
    }
  };
}
