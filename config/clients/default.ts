
export const defaultConfig = {
  name: "Mark-a-Spot",
  shortName: "default",
  domain: "mark-a-spot.org",
  apiEndpoint: "https://api.mark-a-spot.org",
  theme: {
    logoLight: "./assets/clients/default/logo-light.svg",
    logoDark: "./assets/clients/default/logo-dark.svg",
    favicon: "./assets/clients/default/favicon.svg",
    logoHeight: "100px", 
    ui: {
      headerHeight: "120px", 
      animations: {
        duration: 200,      
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", 
        type: "bounce"      
      }
    },
    icons: {
      '192': '/images/mas-192x192.png',
      '512': '/images/mas-512x512.png'
    },
    colors: {
      primary: 'endeavour',
      secondary: 'magenta',
      
      gray: 'slate',
    }
  },
  languages: {
    locales: [
      { code: "en", iso: "en-US", file: "en.ts" }
    ],
    langDir: 'locales/default',
    defaultLocale: "en",
    fallbackLocale: "en"
  },
  features: {
    media: {
      maxFiles: 5,
      maxFileSize: 10 * 1024 * 1024, 
      allowedTypes: ['image/jpeg', 'image/png'],
      maxDimensions: {
        width: 4096,
        height: 4096
      },
      optimize: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg' as const
      }
    },
    voting: false,
    photoReporting: true,
    statistics: true,
    feedback: true,
    categories: ["infrastructure", "environment", "safety"],
    aiAnalysis: false,
    geocoding: {
      providers: ["photon", "mapbox", "nominatim"] as const,
      default: "photon" as const,
      config: {
        mapbox: {
          provider: "mapbox",
          apiKey: process.env.MAPBOX_API_KEY,
          options: {
            limit: 5,
            language: "de"
          }
        },
        nominatim: {
          provider: "nominatim",
          endpoint: process.env.NOMINATIM_ENDPOINT,
          options: {
            limit: 5,
            countryCode: "de"
          }
        }
      }
    },
  },
  requests: {
    itemsPerPage: 20,
    cacheTTL: 300000, 
    maxRequests: 100
  }
} as const;
