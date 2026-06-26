/**
 * Dynamic Icon Server Handler
 *
 * Serves SVG icons from installed @iconify-json packages at runtime.
 * This enables DSGVO-compliant icon loading without external API calls.
 *
 * URL Format: /api/map-icons?icon={collection}:{iconName}
 * Example: /api/map-icons?icon=lucide:trees
 *
 * Why this exists:
 * - Nuxt Icon only bundles icons found via static analysis of <Icon> components
 * - Map markers load icons dynamically based on Drupal configuration
 * - We cannot know at build time which icons admins will configure
 * - External APIs (api.iconify.design) violate DSGVO requirements
 *
 * Solution:
 * - This handler reads from locally installed @iconify-json/* packages
 * - Icons are served at runtime without any external network calls
 * - Full Lucide collection (~1500 icons) available at ~550KB total
 */

import { defineEventHandler, createError, setHeader, setResponseStatus, getQuery } from 'h3';

// Type for icon data from @iconify-json packages
interface IconData {
  body: string;
  width?: number;
  height?: number;
}

interface IconifyCollection {
  prefix: string;
  icons: Record<string, IconData>;
  width?: number;
  height?: number;
}

// Cache for loaded icon collections (loaded once per collection)
const collectionCache = new Map<string, Record<string, IconData>>();

// Cache for generated SVGs (LRU-style, max 500 entries)
const svgCache = new Map<string, string>();
const SVG_CACHE_MAX = 500;

const legacyIconAliases: Record<string, string> = {
  bicycle: 'bike',
  envira: 'leaf',
  exclamation: 'triangle-alert',
  glass: 'glass-water',
  location: 'map-pin',
  marker: 'map-pin',
  'map-marker': 'map-pin',
  pin: 'map-pin',
  tint: 'droplet',
  water: 'waves'
};

/**
 * Load an icon collection from @iconify-json package
 * Uses dynamic import which works in both dev and production Nitro builds
 */
async function loadCollection(collection: string): Promise<Record<string, IconData> | null> {
  if (collectionCache.has(collection)) {
    return collectionCache.get(collection)!;
  }

  try {
    // Dynamic import works in Nitro for both dev and production
    // The package must be in dependencies (not devDependencies) for production
    let iconsData: IconifyCollection;

    if (collection === 'lucide') {
      const module = await import('@iconify-json/lucide/icons.json');
      iconsData = module.default || module;
    } else if (collection === 'heroicons') {
      const module = await import('@iconify-json/heroicons/icons.json');
      iconsData = module.default || module;
    } else {
      console.warn(`[map-icons] Collection "${collection}" not configured for import`);
      return null;
    }

    if (iconsData && iconsData.icons) {
      collectionCache.set(collection, iconsData.icons);
      console.log(`[map-icons] Loaded ${Object.keys(iconsData.icons).length} icons from ${collection}`);
      return iconsData.icons;
    }
  } catch (error) {
    console.warn(`[map-icons] Failed to load collection "${collection}":`, error);
  }

  return null;
}

/**
 * Generate SVG from icon data
 */
function generateSvg(iconData: IconData, width = 24, height = 24): string {
  const viewBoxWidth = iconData.width || 24;
  const viewBoxHeight = iconData.height || 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">${iconData.body}</svg>`;
}

/**
 * Resolve a single icon identifier to its SVG string.
 * Handles collection fallback (lucide) and icon name mappings.
 */
async function resolveIcon(collection: string, iconName: string): Promise<string | null> {
  // Validate names (security: prevent path traversal)
  if (!/^[a-z0-9-]+$/.test(collection) || !/^[a-z0-9-]+$/.test(iconName)) {
    return null;
  }

  // Check SVG cache
  const cacheKey = `${collection}:${iconName}`;
  if (svgCache.has(cacheKey)) {
    return svgCache.get(cacheKey)!;
  }

  // Load collection
  let icons = await loadCollection(collection);
  let resolvedCollection = collection;

  // Fallback to lucide
  if (!icons) {
    icons = await loadCollection('lucide');
    if (!icons) return null;
    resolvedCollection = 'lucide';
  }

  const actualIconName = resolvedCollection === 'lucide'
    ? legacyIconAliases[iconName] || iconName
    : iconName;

  const iconData = icons[actualIconName];
  if (!iconData) return null;

  const svg = generateSvg(iconData);

  // Cache with LRU eviction
  if (svgCache.size >= SVG_CACHE_MAX) {
    const firstKey = svgCache.keys().next().value;
    if (firstKey) svgCache.delete(firstKey);
  }
  svgCache.set(cacheKey, svg);

  return svg;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const iconParam = query.icon as string;
  const iconsParam = query.icons as string;

  // Batch mode: ?icons=lucide:tree,lucide:car,heroicons:flag
  if (iconsParam) {
    const iconIds = iconsParam.split(',').slice(0, 50); // Limit to 50 per request
    const results: Record<string, string> = {};

    await Promise.all(iconIds.map(async (id) => {
      const [col, name] = id.trim().split(':');
      if (col && name) {
        const svg = await resolveIcon(col, name);
        if (svg) results[`${col}:${name}`] = svg;
      }
    }));

    setHeader(event, 'Content-Type', 'application/json');
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
    return results;
  }

  // Single mode: ?icon=lucide:trees
  if (!iconParam) {
    throw createError({
      statusCode: 400,
      message: 'Icon parameter required. Format: ?icon=collection:iconName or ?icons=col:name,col:name'
    });
  }

  // Parse format: "lucide:trees"
  const [collection, iconName] = iconParam.split(':');

  if (!collection || !iconName) {
    throw createError({
      statusCode: 400,
      message: 'Invalid icon format. Expected: collection:iconName (e.g., lucide:trees)'
    });
  }

  const svg = await resolveIcon(collection, iconName);

  if (!svg) {
    throw createError({
      statusCode: 404,
      message: `Icon "${collection}:${iconName}" not found`
    });
  }

  setHeader(event, 'Content-Type', 'image/svg+xml');
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
  return svg;
});
