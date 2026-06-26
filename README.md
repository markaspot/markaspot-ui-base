# Mark-a-Spot UI - Base Edition

A Nuxt 4 frontend application for civic issue reporting, built on the [Mark-a-Spot](https://mark-a-spot.com) platform.

This is the open-source (MIT) base edition with core reporting, map visualization, and citizen-facing features.

## Release: v2.0.0

## Features

- Nuxt 4 with Vue 3 Composition API
- Nuxt UI 4 component library
- MapLibre GL for map visualization
- Mobile-first responsive design
- Issue reporting and tracking
- Multi-language support (i18n)
- PWA support (offline-capable shell)
- Dark mode
- Tailwind CSS 4
- Open311 / GeoReport v2 API integration

## Setup

The easiest way to run this application is with the [markaspot/mark-a-spot](https://github.com/markaspot/mark-a-spot) template repository, which includes Docker Compose for the full stack (Drupal + Nuxt).

### Docker standalone

```bash
docker pull markaspot/markaspot-ui-base:v2.0.0
docker run -p 3000:3000 markaspot/markaspot-ui-base:v2.0.0
```

### Manual Setup

#### Prerequisites

- Node.js 22+
- pnpm

#### Installation

```bash
pnpm install
pnpm run dev        # Development server
pnpm run build      # Production build
pnpm run preview    # Preview production build
```

#### Environment Variables

```bash
NUXT_API_BASE=https://your-drupal-site.example.com
NUXT_GEOREPORT_API_BASE=https://your-drupal-site.example.com
GEOREPORT_API_KEY=your-api-key
MAPBOX_API_KEY=your-mapbox-key  # Optional, for Mapbox geocoding
```

## License

MIT License. See [LICENSE](LICENSE) for details.
