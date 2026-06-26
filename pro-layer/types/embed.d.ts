// Base edition stub (Pro layer not included)
export interface EmbedConfig {
    variant?: string
    geolocate: boolean
    reporting: boolean
    menu: boolean
    menuPosition: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
    tabs: string[]
    theme: 'auto' | 'system' | 'light' | 'dark'
    controls: 'none' | 'minimal' | 'standard'
    branding: boolean
    photoButton: boolean
    classicButton: boolean
    photoLabel?: string
    classicLabel?: string
    logo: boolean
    slogan: boolean
    reportButton: boolean
}
export type EmbedConfigOverrides = Partial<EmbedConfig>;
