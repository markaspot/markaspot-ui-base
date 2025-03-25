
export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    street?: string;
    houseNumber?: string;
    housenumber?: string; 
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  raw?: any; 
}

export interface GeocodingOptions {
  bbox?: string;
  limit?: number;
  language?: string;
  centerPoint?: { lat: number; lng: number };
  radius?: number;
}

export interface GeocodingProvider {
  name: string;
  geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>;
  reverseGeocode(lat: number, lng: number): Promise<GeocodingResult>;
}
