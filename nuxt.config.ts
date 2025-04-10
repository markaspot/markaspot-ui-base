import {VitePWA} from "vite-plugin-pwa";
import {copyFileSync, mkdirSync, existsSync} from "fs";
import {resolve, dirname} from "path";
import {fileURLToPath} from "url";
import clientConfig from "./config/clients"; 

if (!clientConfig) {
  throw new Error("No client configuration found");
}
const isDev = process.env.NODE_ENV === "development";


const __dirname = dirname(fileURLToPath(import.meta.url));
const clientCssPath = `../assets/clients/${clientConfig.shortName}/css`;

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: {enabled: isDev},
  modules: ["@pinia/nuxt", "@nuxt/ui", "@nuxtjs/i18n", "@vite-pwa/nuxt"],
  components: [
    {
      path: "./components",
      pathPrefix: false,
      deep: true, 
    },
  ],
  
  imports: {
    dirs: [
      
      'composables',
      'composables/**'
    ]
  },
  debug: isDev,
  hooks: {
    "build:before": () => {
      const targetDir = resolve(__dirname, "public/images");

      try {
        mkdirSync(targetDir, {recursive: true});

        
        const logoLightSrc = resolve(__dirname, clientConfig.theme.logoLight);
        const logoLightTarget = resolve(targetDir, "logo-light.svg");
        copyFileSync(logoLightSrc, logoLightTarget);

        
        const logoDarkSrc = resolve(__dirname, clientConfig.theme.logoDark);
        const logoDarkTarget = resolve(targetDir, "logo-dark.svg");
        copyFileSync(logoDarkSrc, logoDarkTarget);

        
        const faviconSrc = resolve(__dirname, clientConfig.theme.favicon);
        const faviconTarget = resolve("public", "favicon.svg");
        copyFileSync(faviconSrc, faviconTarget);
        
        
        if (clientConfig.theme.icons) {
          
          if (clientConfig.theme.icons['192']) {
            const icon192Src = resolve(__dirname, clientConfig.theme.icons['192']);
            const icon192Target = resolve(targetDir, "pwa-icon-192.png");
            copyFileSync(icon192Src, icon192Target);
          }
          
          
          if (clientConfig.theme.icons['512']) {
            const icon512Src = resolve(__dirname, clientConfig.theme.icons['512']);
            const icon512Target = resolve(targetDir, "pwa-icon-512.png");
            copyFileSync(icon512Src, icon512Target);
          }
        }

        
      } catch (error) {
        console.error("Failed to copy client assets:", error);
      }
    },

    "build:done": async () => {
      if (process.env.NODE_ENV !== 'production') {
        
        return;
      }
      
      
      
    },
  },
  app: {
    baseURL: "/",
    head: {
      title: clientConfig.name || "Mark-a-Spot",
      htmlAttrs: {
        lang: clientConfig.languages?.defaultLocale || "de",
      },
      link: [
        {rel: "icon", type: "image/svg+xml", href: "/favicon.svg"},
        {
          rel: "manifest",
          href: "/manifest.webmanifest",
          crossorigin: "use-credentials",
        },
      ],
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, interactive-widget=resizes-content",
        },
        {
          name: "description",
          content: `Mängelmelder für ${clientConfig.name}`,
        },
        {name: "theme-color", content: clientConfig.theme?.primary || "#000"},
        {name: "apple-mobile-web-app-capable", content: "yes"},
        {name: "mobile-web-app-capable", content: "yes"},
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
        {
          name: "apple-mobile-web-app-title",
          content: clientConfig.name || "Mark-a-Spot",
        },
      ],
    },
  },
  pwa: {
    injectRegister: 'auto', 
    strategies: "generateSW", 
    registerType: "autoUpdate", 
    workbox: {
      navigateFallback: null, 
      runtimeCaching: [
        {
          
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst', 
        },
        {
          
          urlPattern: ({ url }) => url.pathname.match(/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?)$/),
          handler: 'CacheFirst', 
          options: {
            cacheName: 'static-assets-v2', 
            expiration: {
              maxEntries: 100, 
              maxAgeSeconds: 7 * 24 * 60 * 60, 
            },
          },
        },
      ],
      additionalManifestEntries: [
        { url: "/", revision: Date.now().toString() }, 
      ],
      cleanupOutdatedCaches: true, 
      skipWaiting: true, 
      clientsClaim: true, 
    },
    
    manifest: {
      id: "/home", 
      name: clientConfig.name || "Mark-a-Spot Demo or Dev",
      short_name: clientConfig.shortName || "Mark-a-Spot",
      description: `Mängelmelder für ${clientConfig.name}`,
      theme_color: clientConfig.theme?.primary || "#000",
      background_color: clientConfig.theme?.primary || "#000",
      start_url: "/home",
      display: "standalone",
      orientation: "portrait-primary", 
      display_override: ["window-controls-overlay"], 
      scope: "/home", 
      launch_handler: {
        client_mode: "focus-existing", 
      },
      screenshots: [
        {
          src: "/screenshots/screenshot1.png",
          sizes: "1280x720",
          type: "image/png",
        },
        {
          src: "/screenshots/screenshot2.png",
          sizes: "1920x1080",
          type: "image/png",
        },
      ],
      icons: [
        
        {
          src: "/images/pwa-icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/images/pwa-icon-512.png", 
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        
        {
          src: "/images/pwa-icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable"
        },
        {
          src: "/images/pwa-icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ],
      categories: ["productivity", "utilities", "tools"], 
      dir: "ltr", 
      prefer_related_applications: false, 
      share_target: {
        action: "/share",
        method: "POST",
        enctype: "multipart/form-data",
        params: {
          title: "title",
          text: "text",
          url: "url",
        },
      },
      file_handlers: [
        {
          action: "/open-file",
          accept: {
            "application/json": [".json"],
            "text/plain": [".txt"],
          },
        },
      ],
      protocol_handlers: [
        {
          protocol: "web+markaspot",
          url: "/handler?url=%s",
        },
      ],
      iarc_rating_id: "",
      related_applications: [
        {
          platform: "web",
          url: "https://markaspot.example.com",
          id: "com.example.markaspot",
        },
      ],
      scope_extensions: [
        {
          origin: "https://api.markaspot.com",
        },
      ],
    },
  },
  ui: {
    icons: "heroicons",
  },
  i18n: {
    langDir: 'locales/default',
    lazy: true,
    locales: [
      { code: "en", iso: "en-US", file: "en.ts" }
    ],
    defaultLocale: "en",
    detectBrowserLanguage: {
      useCookie: false,
      fallbackLocale: 'en'
    }
  },
  experimental: {
    payloadExtraction: false,
  },
  ssr: true,
  nitro: {
    preset: "node-server",
    compressPublicAssets: true,
    routeRules: {
      '/requests/**': { ssr: true }, 
    },
  },
  dir: {
    public: "public",
  },

  runtimeConfig: {
    proxy: {
      timeoutSeconds: 30,
      maxRedirects: 5,
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    public: {
      clientName: clientConfig.name,
      clientConfig,
      nominatimEndpoint: process.env.NOMINATIM_ENDPOINT,
      geoReportApiBase: process.env.NUXT_GEOREPORT_API_BASE,
      apiBase: process.env.NUXT_API_BASE || clientConfig.apiEndpoint || "/api", 
      useProxy: true,
      proxyPath: "/api",
      mapboxKey: process.env.MAPBOX_API_KEY,
      maptilerKey: process.env.MAPTILER_API_KEY
    },
    private: {
      geoReportApiKey: process.env.GEOREPORT_API_KEY,
      jsonapiRandomPath: process.env.JSONAPI_RANDOM_PATH || 'jsonapi'
    }
  },
  routeRules: {
    "/requests/**": {ssr: true},
  },
  css: [
    `${clientCssPath}/fonts.css`,
    `${clientCssPath}/tailwind.css`,
    `${clientCssPath}/main.css`,
  ],
  tailwindcss: {
    configPath: "./config/tailwind/tailwind.config.ts",
  },
  vite: {
    server: {
      watch: {
        usePolling: true
      },
      hmr: {
        
        path: '/__vite_hmr',
        host: process.env.DDEV_HOSTNAME,
        protocol: 'wss',
        clientPort: 3001
      }
    },
    define: {
      "process.env.CLIENT_CONFIG": JSON.stringify(clientConfig),
    },
    esbuild: {
      drop: isDev ? [] : ['console']
    },
  },
  eslint: {
    fix: true, 
    emitWarning: true,
  },
  future: {
    compatibilityVersion: 4,
  }
});
