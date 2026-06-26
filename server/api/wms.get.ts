/**
 * WMS Proxy Server Route
 *
 * Proxies WMS requests to a hardcoded set of public GeoServer endpoints
 * (DEFAULT_LAYER_MAP) plus tenant-supplied layers from field_nuxt_config.
 *
 * Tenant-supplied layers may be enabled per jurisdiction via
 * features.customWmsLayers; otherwise the default map is used.
 *
 * SECURITY NOTE: This proxy is intentionally unauthenticated so the citizen
 * map can render WMS tiles for anonymous visitors. The per-layer `visibility`
 * field is a UI display control only — it hides layers in the frontend but
 * does NOT prevent direct tile requests to this endpoint, so any confidential
 * geodata must be protected by the upstream GeoServer itself (auth/ACL).
 *
 * Usage: /api/wms?layers=layer_id&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&...
 */

import { createError, getQuery, getRequestURL, send, setResponseHeader } from 'h3';
import type { H3Event } from 'h3';
import { Agent } from 'https';
import {
  extractConfiguredWmsLayerMap,
  hasExplicitAllowedWmsHosts,
  isAllowedWmsUrl,
  normalizeAllowedImageContentType,
  normalizeWmsRequest
} from '../utils/wms';
import type { WmsLayerMap, WmsLayerTarget } from '../utils/wms';

// Default layer mapping (fallback if not configured via client config)
// Updated 2025-01-18 - verified against current Bonn GDI GeoServer
const DEFAULT_LAYER_MAP: Record<string, { url: string; title: string }> = {
  // Bäume workspace - verified working
  'v_baumstandorte_online_s_26786': {
    url: 'https://gdi.bonn.de/geoserver/baeume/wms',
    title: 'Baumstandorte'
  },
  'v_baeume_faellung_kurzfristig_s_29353': {
    url: 'https://gdi.bonn.de/geoserver/baeume/wms',
    title: 'Bäume zur Fällung (kurzfristig)'
  },
  // Radwege workspace - verified working
  'v_fahrradhaendler_s_31785': {
    url: 'https://gdi.bonn.de/geoserver/radwege/wms',
    title: 'Fahrradhändler'
  },
  'v_mobilstationen_61emission_s_30704': {
    url: 'https://gdi.bonn.de/geoserver/radwege/wms',
    title: 'Mobilstationen'
  },
  'radverkehrsnetz': {
    url: 'https://gdi.bonn.de/geoserver/radwege/wms',
    title: 'Radverkehrsnetz'
  },
  // Grünpflege workspace - verified working
  'hundewiese_p_23960': {
    url: 'https://gdi.bonn.de/geoserver/gruenpflege/wms',
    title: 'Hundewiesen'
  },
  'gruenes_c_landschaftsraeume_p_29504': {
    url: 'https://gdi.bonn.de/geoserver/gruenpflege/wms',
    title: 'Grünes C - Landschaftsräume'
  }
};

const SETTINGS_CACHE_TTL = 5 * 60 * 1000;
const SETTINGS_NEGATIVE_CACHE_TTL = 60 * 1000;
const SETTINGS_CACHE_MAX_ENTRIES = 100;
const MAX_WMS_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_WMS_TILE_SIZE = 1024;
const MAX_WEB_MERCATOR_ABS = 25000000;

type CachedTenantSettings = {
  layers: WmsLayerMap;
  customWmsLayersEnabled: boolean;
};

type RuntimeConfig = ReturnType<typeof useRuntimeConfig>;
type QueryValue = string | string[] | undefined;
type QueryLookup = Record<string, unknown>;
type QueryParamResult = {
  ok: boolean;
  value: string | null;
  message: string;
};

const tenantSettingsCache = new Map<string, { expires: number, settings: CachedTenantSettings }>();

function setCacheEntry(key: string, settings: CachedTenantSettings, ttl = SETTINGS_CACHE_TTL) {
  if (tenantSettingsCache.size >= SETTINGS_CACHE_MAX_ENTRIES && !tenantSettingsCache.has(key)) {
    // Evict oldest entry (Map preserves insertion order).
    const firstKey = tenantSettingsCache.keys().next().value;
    if (firstKey !== undefined) tenantSettingsCache.delete(firstKey);
  }
  tenantSettingsCache.set(key, { expires: Date.now() + ttl, settings });
}

function getQueryStringValue(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] || '');
  }
  return typeof value === 'string' ? value : '';
}

function getScalarQueryParam(query: QueryLookup, names: string[]): QueryParamResult {
  const normalizedNames = new Set(names.map(name => name.toLowerCase()));
  const matches = Object.entries(query).filter(([key]) => normalizedNames.has(key.toLowerCase()));
  if (matches.length === 0) {
    return { ok: true, value: null, message: '' };
  }
  if (matches.length > 1) {
    return { ok: false, value: null, message: `Duplicate WMS parameter: ${names[0]}` };
  }

  const value = matches[0][1] as QueryValue;
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      return { ok: false, value: null, message: `Duplicate WMS parameter: ${names[0]}` };
    }
    return { ok: true, value: String(value[0] ?? ''), message: '' };
  }
  if (typeof value !== 'string') {
    return { ok: false, value: null, message: `Invalid WMS parameter: ${names[0]}` };
  }

  return { ok: true, value, message: '' };
}

function requireScalarQueryParam(query: QueryLookup, names: string[], message: string): QueryParamResult {
  const result = getScalarQueryParam(query, names);
  if (!result.ok || result.value !== null) {
    return result;
  }
  return { ok: false, value: null, message };
}

function validateLayerName(value: string): string | null {
  const layer = value.trim();
  return /^[a-z0-9_.:-]{1,160}$/i.test(layer) ? layer : null;
}

function validateStyle(value: string | null): string {
  const style = (value || '').trim();
  return /^[a-z0-9_.:-]{0,120}$/i.test(style) ? style : '';
}

function validateTileSize(value: string): string | null {
  const size = Number(value);
  if (!Number.isInteger(size) || size < 1 || size > MAX_WMS_TILE_SIZE) {
    return null;
  }
  return String(size);
}

function validateBbox(value: string): string | null {
  const parts = value.split(',').map(part => Number(part.trim()));
  if (
    parts.length !== 4 ||
    parts.some(part => !Number.isFinite(part) || Math.abs(part) > MAX_WEB_MERCATOR_ABS) ||
    parts[0] >= parts[2] ||
    parts[1] >= parts[3]
  ) {
    return null;
  }
  return parts.map(part => String(part)).join(',');
}

function validateProjection(value: string | null): boolean {
  return !value || value.trim().toUpperCase() === 'EPSG:3857';
}

function buildUpstreamWmsParams(query: QueryLookup, request: 'GetMap' | 'GetLegendGraphic', requestedLayer: string): URLSearchParams | string {
  const layer = validateLayerName(requestedLayer);
  if (!layer) {
    return 'Invalid WMS layer.';
  }

  const styleResult = request === 'GetLegendGraphic'
    ? getScalarQueryParam(query, ['style', 'styles'])
    : getScalarQueryParam(query, ['styles']);
  if (!styleResult.ok) {
    return styleResult.message;
  }

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: request,
    FORMAT: 'image/png',
    TRANSPARENT: 'true'
  });

  if (request === 'GetLegendGraphic') {
    params.set('LAYER', layer);
    const style = validateStyle(styleResult.value);
    if (style !== '') {
      params.set('STYLE', style);
    }
    return params;
  }

  const widthResult = requireScalarQueryParam(query, ['width'], 'Missing required parameter: width');
  const heightResult = requireScalarQueryParam(query, ['height'], 'Missing required parameter: height');
  const bboxResult = requireScalarQueryParam(query, ['bbox'], 'Missing required parameter: bbox');
  const projectionResult = getScalarQueryParam(query, ['srs', 'crs']);
  for (const result of [widthResult, heightResult, bboxResult, projectionResult]) {
    if (!result.ok) {
      return result.message;
    }
  }

  const width = validateTileSize(widthResult.value || '');
  const height = validateTileSize(heightResult.value || '');
  const bbox = validateBbox(bboxResult.value || '');
  if (!width || !height || !bbox || !validateProjection(projectionResult.value)) {
    return 'Invalid WMS tile parameters.';
  }

  params.set('LAYERS', layer);
  params.set('STYLES', validateStyle(styleResult.value));
  params.set('SRS', 'EPSG:3857');
  params.set('BBOX', bbox);
  params.set('WIDTH', width);
  params.set('HEIGHT', height);

  return params;
}

async function readLimitedImageBuffer(response: Response): Promise<Buffer> {
  const contentLength = Number(response.headers.get('content-length') || '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_WMS_IMAGE_BYTES) {
    throw new Error(`GeoServer image exceeded ${MAX_WMS_IMAGE_BYTES} bytes`);
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_WMS_IMAGE_BYTES) {
      throw new Error(`GeoServer image exceeded ${MAX_WMS_IMAGE_BYTES} bytes`);
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_WMS_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error(`GeoServer image exceeded ${MAX_WMS_IMAGE_BYTES} bytes`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, total);
}

// Jurisdiction slugs are numeric IDs or kebab-case slugs. Anything else is
// either a typo or an attempt to churn the LRU cache by submitting many
// distinct keys, so we reject and treat as default.
const JURISDICTION_KEY_PATTERN = /^[a-z0-9-]{1,64}$/i;
function sanitizeJurisdictionKey(value: string): string {
  return JURISDICTION_KEY_PATTERN.test(value) ? value : '';
}

function buildSettingsUrl(event: H3Event, jurisdiction: string, config: RuntimeConfig): string | null {
  const apiBase = String(config.public.geoReportApiBase || config.public.apiBase || '').replace(/\/+$/, '');
  if (!apiBase) return null;

  const origin = getRequestURL(event).origin;
  const settingsUrl = /^https?:\/\//.test(apiBase)
    ? new URL(`${apiBase}/api/mark-a-spot-settings`)
    : new URL(`${apiBase}/mark-a-spot-settings`, origin);

  if (jurisdiction) {
    settingsUrl.searchParams.set('jurisdiction', jurisdiction);
  }

  return settingsUrl.toString();
}

async function fetchTenantSettings(
  event: H3Event,
  jurisdiction: string,
  config: RuntimeConfig
): Promise<CachedTenantSettings> {
  // Bound key length to limit memory blowup from attacker-supplied jurisdiction values.
  const cacheKey = (jurisdiction || 'default').slice(0, 64);
  const cached = tenantSettingsCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.settings;
  }

  const empty: CachedTenantSettings = { layers: {}, customWmsLayersEnabled: false };
  const cacheEmpty = () => {
    setCacheEntry(cacheKey, empty, SETTINGS_NEGATIVE_CACHE_TTL);
    return empty;
  };
  const settingsUrl = buildSettingsUrl(event, jurisdiction, config);
  if (!settingsUrl) {
    return cacheEmpty();
  }

  try {
    const response = await fetch(settingsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Forwarded-Proto': 'https'
      },
      // Refuse to follow redirects: a malicious upstream could 301 to an
      // internal URL (cloud metadata, internal services), bypassing the
      // hostname allowlist that only validated the original URL.
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
      // @ts-ignore - Node.js fetch accepts agent in this runtime.
      agent: new Agent({ rejectUnauthorized: config.proxy?.rejectUnauthorized ?? true })
    });

    if (!response.ok) {
      console.warn(`[WMS Proxy] Settings fetch HTTP ${response.status} for jurisdiction=${cacheKey}`);
      return cacheEmpty();
    }

    const settings = await response.json();
    const customWmsLayersEnabled = settings?.features?.customWmsLayers === true;
    const layers = customWmsLayersEnabled ? extractConfiguredWmsLayerMap(settings) : {};
    const result: CachedTenantSettings = { layers, customWmsLayersEnabled };
    setCacheEntry(cacheKey, result);
    return result;
  } catch (error) {
    const reason = error instanceof Error && /timeout|abort/i.test(error.name) ? 'timeout' : 'network error';
    console.warn(`[WMS Proxy] Settings fetch failed (${reason}) for jurisdiction=${cacheKey}`);
    return cacheEmpty();
  }
}

async function resolveLayerConfig(
  event: H3Event,
  requestedLayer: string,
  config: RuntimeConfig
): Promise<WmsLayerTarget | undefined> {
  const query = getQuery(event);
  const jurisdiction = sanitizeJurisdictionKey(getQueryStringValue(query.jurisdiction));
  const allowedHosts = getWmsAllowedHosts(config);

  const defaultLayer = DEFAULT_LAYER_MAP[requestedLayer];
  if (defaultLayer) {
    if (!isAllowedWmsUrl(defaultLayer.url, allowedHosts)) {
      // Defence-in-depth: catch a future contributor adding a non-public default URL.
      console.warn(`[WMS Proxy] DEFAULT_LAYER_MAP entry for ${requestedLayer} failed allowlist check`);
      return undefined;
    }
    return defaultLayer;
  }

  const tenantSettings = await fetchTenantSettings(event, jurisdiction, config);
  const tenantLayer = tenantSettings.layers[requestedLayer];
  if (tenantLayer) {
    if (!hasExplicitAllowedWmsHosts(allowedHosts)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'WMS layer host allowlist is required.'
      });
    }
    if (!isAllowedWmsUrl(tenantLayer.url, allowedHosts)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'WMS layer URL is not allowed.'
      });
    }
    return tenantLayer;
  }
  return undefined;
}

function getWmsAllowedHosts(config: RuntimeConfig): string {
  const proxyConfig = config.proxy as { wmsAllowedHosts?: string } | undefined;
  const publicConfig = config.public as { proxy?: { wmsAllowedHosts?: string } } | undefined;

  return String(
    process.env.NUXT_WMS_ALLOWED_HOSTS
    || proxyConfig?.wmsAllowedHosts
    || publicConfig?.proxy?.wmsAllowedHosts
    || ''
  );
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const requestParam = requireScalarQueryParam(query, ['request'], 'Unsupported WMS request.');
  if (!requestParam.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: requestParam.message
    });
  }

  const request = normalizeWmsRequest(requestParam.value);
  if (!request) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported WMS request.'
    });
  }

  const layerParam = request === 'GetLegendGraphic'
    ? requireScalarQueryParam(query, ['layer', 'layers'], 'Missing required parameter: LAYER')
    : requireScalarQueryParam(query, ['layers'], 'Missing required parameter: layers');
  if (!layerParam.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: layerParam.message
    });
  }
  const requestedLayer = layerParam.value || '';

  // Build a canonical upstream WMS request before resolving tenant layers.
  // This rejects invalid render-cost parameters without touching Drupal or GDI.
  const params = buildUpstreamWmsParams(query, request, requestedLayer);
  if (typeof params === 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: params
    });
  }

  const layerConfig = await resolveLayerConfig(event, requestedLayer, config);

  if (!layerConfig) {
    // Generic message — do not enumerate available layers.
    throw createError({
      statusCode: 400,
      statusMessage: 'Unknown WMS layer.'
    });
  }

  const targetUrl = `${layerConfig.url}?${params.toString()}`;

  try {
    const response = await fetch(targetUrl, {
      // See settings fetch above: 301 to an internal target would bypass
      // the hostname allowlist applied to the original URL.
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
      // @ts-ignore - Node.js fetch accepts agent in this runtime.
      agent: new Agent({ rejectUnauthorized: config.proxy?.rejectUnauthorized ?? true })
    });

    if (!response.ok) {
      throw new Error(`GeoServer returned ${response.status}`);
    }

    // Reflect upstream Content-Type only when it is an explicitly allowed
    // raster image type. SVG and arbitrary HTML/JS/XML payloads are rejected so
    // a compromised upstream can't smuggle scripts through the proxy origin.
    const contentType = normalizeAllowedImageContentType(response.headers.get('content-type'));
    if (!contentType) {
      throw new Error(`GeoServer returned unsupported content type: ${response.headers.get('content-type') || 'missing'}`);
    }

    const buffer = await readLimitedImageBuffer(response);

    setResponseHeader(event, 'Content-Type', contentType);
    setResponseHeader(event, 'X-Content-Type-Options', 'nosniff');
    setResponseHeader(event, 'Content-Length', buffer.length);
    setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*');

    return send(event, buffer);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WMS Proxy] Upstream fetch failed:', errorMessage);
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch WMS layer.'
    });
  }
});
