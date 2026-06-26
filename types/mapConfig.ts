// Types for map configuration

export interface MapControlConfig {
    enabled: boolean
    position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
    weight: number
    classes?: string
}

export interface TiltControlConfig extends MapControlConfig {
    options?: {
        angles?: number[]
        defaultAngle?: number
    }
}

export interface GeolocationControlConfig extends MapControlConfig {
    trackUserLocation?: boolean
}

export interface MapPositions {
    topLeft: string
    topRight: string
    bottomLeft: string
    bottomRight: string
    [key: string]: string
}

export interface MapControlsConfig {
    positions: MapPositions
    zoom: MapControlConfig
    tilt: TiltControlConfig
    theme: MapControlConfig
    geolocation: GeolocationControlConfig
    language: MapControlConfig
    reports: MapControlConfig
    [key: string]: any
}

export interface MapConfig {
    controls: MapControlsConfig
}
