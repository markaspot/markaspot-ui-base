# Client-Specific Geocoding Providers

This directory contains geocoding providers that are specific to individual clients.

## Structure

```
clients/
├── cgn/                    # Cologne-specific providers
│   ├── index.ts           # Export provider factories
│   └── cologne.ts         # Cologne geoportal provider
└── [other-client]/        # Other client providers
    └── index.ts
```

## How It Works

1. **Dynamic Loading**: Providers are loaded dynamically based on the `CLIENT` environment variable
2. **No Core Modifications**: Client-specific providers don't require changes to the core provider index
3. **Configuration-Driven**: Providers are activated through client configuration files

## Adding a New Client Provider

### 1. Create Client Directory

```bash
mkdir -p app/plugins/geocoding/providers/clients/[client-code]
```

### 2. Create Provider Implementation

Create your provider file (e.g., `custom-geocoder.ts`):

```typescript
import type { GeocodingProvider, GeocodingResult } from '../../types';

export function createCustomProvider(baseUrl?: string): GeocodingProvider {
    return {
        name: 'custom',

        async geocode(query: string, options?: any): Promise<GeocodingResult[]> {
            // Implementation
        },

        async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
            // Implementation
        }
    };
}
```

### 3. Create Index File

Create `index.ts` in your client directory:

```typescript
import { createCustomProvider } from './custom-geocoder';
import type { GeocodingProvider } from '../../types';

export const providerFactories: Record<string, () => Promise<GeocodingProvider>> = {
    custom: async () => {
        return createCustomProvider();
    }
};
```

### 4. Configure Client

In your client configuration file (`config/clients/[client].ts`):

```typescript
export default {
    // ... other config
    features: {
        geocoding: {
            providers: ['custom', 'photon', 'mapbox'],
            default: 'custom'
        }
    }
};
```

### 5. Set Environment Variable

Ensure `CLIENT=[client-code]` is set in your environment (DDEV, Docker, etc.)

## Example: Cologne Provider

The Cologne provider demonstrates:
- Using a Nuxt server API proxy (`/api/geocoder`)
- Implementing automatic fallback to Photon for addresses outside the coverage area
- Integration with a custom PHP backend library

See `cgn/cologne.ts` and `cgn/index.ts` for the complete implementation.

## Benefits

✅ **No Core Changes**: Default providers remain untouched
✅ **Client Isolation**: Each client's providers are self-contained
✅ **Easy Maintenance**: Clear separation between default and client-specific code
✅ **Type Safety**: Full TypeScript support
✅ **Automatic Loading**: Providers are registered based on CLIENT env var
