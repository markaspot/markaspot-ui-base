
export interface Request {
  service_request_id: string
  title: string
  description: string
  lat: number | string
  long: number | string
  address_string: string
  service_name: string
  requested_datetime: string
  updated_datetime?: string
  status: string
  media_url: string | null
  service_code: string
  extended_attributes?: {
    markaspot?: {
      category_hex?: string
      category_icon?: string
      status_hex?: string
      status_descriptive_name?: string
      status_notes?: StatusNote[]
    }
  }
}

export interface Marker {
  lat: number
  lng: number
}

export interface BoundsType {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface StatusNote {
  status_note: string
  status: string
  updated_datetime: string
  status_descriptive_name?: string
  status_hex?: string
  status_icon?: string
}
