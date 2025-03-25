
interface ClientConfig {
  name: string
  shortName?: string
  domain: string
  apiEndpoint: string
  theme: {
    logoLight: string
    logoDark: string
    favicon: string
    colors?: {
      primary?: string
      secondary?: string
      gray?: string
    }
    icons?: {
      '192'?: string
      '512'?: string
    }
  }
  languages?: {
    locales?: Array<{
      code: string
      iso: string
      file: string
    }>
    defaultLocale?: string
    fallbackLocale?: string
  }
  features: {
    photoReporting: boolean
    statistics: boolean
    categories: string[]
    aiAnalysis?: boolean
    geoLocation?: boolean
    uploadLimit?: number
  }
  requests?: {
    itemsPerPage?: number
    cacheTTL?: number
    maxRequests?: number
  }
}
