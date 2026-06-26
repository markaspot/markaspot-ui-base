import { defineEventHandler, getRequestHeaders, getHeader, createError, readBody } from 'h3';
import type { H3Event } from 'h3';
import { Agent } from 'https';
import { Agent as UndiciAgent } from 'undici';
import { URL } from 'url';

import { getEndpointType, checkRateLimit, isAlwaysRateLimitedPath } from './utils/rate-limiter';
import { logRequest, logGeocoding } from './utils/logger';
import { handleGeocodingRequest, transformGeocodingResponse } from './handlers/geocoding';
import { hasValidDrupalSession, isMinimalExtendedAttributes } from '../utils/session';
import { getCanonicalHost, getSessionAwareApiBase } from '../utils/host';
import {
  isValidAuthStatusResponse,
  extractRoles,
  canAccessInternalStatusDefinitions,
  hasGlobalDashboardRole,
  getAccessibleJurisdictionIds as getAccessibleJurisdictionIdsForRoles,
  type AuthStatusResponse,
} from '../utils/auth-status';
import { isSuspiciousPath } from '../utils/path';
import { createSafeError, stripSensitive, redactApiKeys, redactApiKeyFromUrl, sanitizeErrorData } from '../utils/error-handling';
import { transformGeoReportMediaUrls } from '../utils/media-url';
import type { ProxyFetchError } from '../types/proxy';

// Custom API endpoints that need /api prefix restored when forwarding to Drupal
const CUSTOM_API_ENDPOINTS = [
  'mark-a-spot-form-mode-settings',
  'mark-a-spot-settings',
  'organisations',
  'feedback',
  'competition',
  'markaspotshstweak',
  'auth',
  'accept-tos',
  'tos-status',
  'contact',
  'emergency-mode/status',
  'ai',
  'vision',
  'admin',
  'dashboard',
  'group-members',
  'escalation',
  'delegation',
  'moderation',
  'tenant-settings',
  'content-translation',
  'inbound-mail'
];

// GeoReport paths that support api_key auth (stats does NOT)
const API_KEY_SUPPORTED_PATHS = [
  'georeport/v2/requests',
  'georeport/v2/services',
  'georeport/v2/discovery',
];

const GEOREPORT_WRITE_SUPPORTED_PATHS = [
  'georeport/v2/requests',
];

const GEOREPORT_ALLOWED_CONTENT_TYPES = new Set([
  'application/json',
  'application/xml',
  'text/xml',
]);

const PROXY_CONTROLLED_REQUEST_HEADERS = [
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-prefix',
  'x-forwarded-proto',
  'x-forwarded-scheme',
  'x-forwarded-server',
  'x-forwarded-ssl',
  'x-real-ip',
];
const BODY_TRANSPORT_REQUEST_HEADERS = [
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
];
const INTERNAL_JURISDICTION_HEADER = 'x-mas-jurisdiction';
const VISION_ANALYZE_PATH = ['vision', 'analyze'].join('/');
const GEOREPORT_MAX_WRITE_BODY_BYTES = parseInt(process.env.GEOREPORT_MAX_WRITE_BODY_BYTES || '65536');
const LOGO_UPLOAD_MAX_BODY_BYTES = parseInt(process.env.LOGO_UPLOAD_MAX_BODY_BYTES || '1572864');

function deleteRequestHeaders(headers: Record<string, string | undefined>, headerNames: string[]): void {
  const normalizedHeaderNames = new Set(headerNames.map(headerName => headerName.toLowerCase()));
  for (const headerName of Object.keys(headers)) {
    if (normalizedHeaderNames.has(headerName.toLowerCase())) {
      delete headers[headerName];
    }
  }
}

function isTenantSettingsLogoUploadPath(path: string): boolean {
  const normalizedPath = path.replace(/^api\//i, '');
  return /^tenant-settings\/[a-z0-9_-]+\/logo$/i.test(normalizedPath);
}

function isPublicSettingsPath(path: string): boolean {
  const normalizedPath = path.replace(/^api\//i, '');
  return normalizedPath === 'mark-a-spot-settings';
}

function stripApiPrefixes(path: string): string {
  let normalizedPath = path.replace(/^\/+/, '');
  while (/^api\//i.test(normalizedPath)) {
    normalizedPath = normalizedPath.replace(/^api\//i, '');
  }
  return normalizedPath;
}

function isSsoAuthPath(path: string): boolean {
  const normalizedPath = path.replace(/^api\//i, '');
  return normalizedPath === 'auth/sso' ||
    normalizedPath.startsWith('auth/sso/');
}

/**
 * Triage-inbox endpoints (markaspot-ui#482) are authenticated-only. The `api/`
 * prefix is restored before this runs, so match the prefixed form.
 */
function isInboundMailPath(path: string): boolean {
  const normalizedPath = path.replace(/^api\//i, '');
  return normalizedPath === 'inbound-mail' || normalizedPath.startsWith('inbound-mail/');
}

/**
 * Inbound-mail attachment downloads return binary (image/*) that must be
 * streamed through with its upstream Content-Type intact, NOT buffered through
 * the JSON $fetch pipeline (which loses the type and can corrupt bytes).
 * Matches: api/inbound-mail/{id}/attachment/{fid}
 */
function isInboundMailAttachmentPath(path: string): boolean {
  const normalizedPath = path.replace(/^api\//i, '');
  return /^inbound-mail\/\d+\/attachment\/\d+$/.test(normalizedPath);
}

function isVisionAnalyzePath(path: string): boolean {
  const normalizedPath = stripApiPrefixes(path);
  return normalizedPath === VISION_ANALYZE_PATH ||
    normalizedPath.startsWith(`${VISION_ANALYZE_PATH}/`);
}

function readFeatureEnabled(feature: unknown): boolean | undefined {
  if (typeof feature === 'boolean') return feature;
  if (feature && typeof feature === 'object' && 'enabled' in feature) {
    const enabled = (feature as { enabled?: unknown }).enabled;
    return typeof enabled === 'boolean' ? enabled : undefined;
  }
  return undefined;
}

function cleanJurisdictionHint(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  if (typeof value === 'number' && !Number.isFinite(value)) return undefined;
  const cleaned = String(value).trim();
  return /^[A-Za-z0-9_-]{1,80}$/.test(cleaned) ? cleaned : undefined;
}

function getRuntimeJurisdictionHint(event: H3Event): string | undefined {
  const config = useRuntimeConfig();
  return cleanJurisdictionHint(String((config as Record<string, unknown>).jurisdictionId || ''));
}

function getConfiguredJsonApiPath(config: Record<string, unknown>): string {
  const privateConfig = ((config.private ?? {}) as Record<string, unknown>);
  const configuredPath = process.env.JSONAPI_RANDOM_PATH ||
    (privateConfig.jsonapiRandomPath as string) ||
    'jsonapi';
  return String(configuredPath).replace(/^["'](.*)["']$/, '$1').replace(/^\/+|\/+$/g, '') || 'jsonapi';
}

function normalizeJsonApiAccessPath(path: string, config: Record<string, unknown>): string {
  const randomizedPath = getConfiguredJsonApiPath(config);
  const candidates = [
    path.replace(/^\/+|\/+$/g, ''),
    stripApiPrefixes(path).replace(/^\/+|\/+$/g, '')
  ];

  for (const candidate of candidates) {
    if (candidate === 'jsonapi' || candidate.startsWith('jsonapi/')) {
      return candidate;
    }
    if (randomizedPath !== 'jsonapi' &&
      (candidate === randomizedPath || candidate.startsWith(`${randomizedPath}/`))) {
      return `jsonapi${candidate.slice(randomizedPath.length)}`;
    }
  }

  return path;
}

async function isVisionAnalyzeDisabled(
  event: H3Event,
  targetBase: string,
  proxyConfig: Record<string, unknown>
): Promise<boolean> {
  const normalizedBase = String(targetBase || '').replace(/\/+$/, '');
  const origin = `http://${event.node.req.headers.host || 'localhost'}`;
  const settingsUrl = /^https?:\/\//.test(normalizedBase)
    ? new URL(`${normalizedBase}/api/mark-a-spot-settings`)
    : new URL(`${normalizedBase}/api/mark-a-spot-settings`, origin);
  settingsUrl.searchParams.set('exclude', 'boundary');

  // Never trust the Vision request body for feature-gate scope. The body also
  // controls Drupal's analysis jurisdiction, so using it here would let a
  // disabled tenant borrow an enabled tenant's flag. Do not read the body in
  // this preflight: upload/content-type guards must run before buffering.
  // Base/single-tenant images can set NUXT_PUBLIC_JURISDICTION_ID/
  // NUXT_JURISDICTION_ID; dynamic multi-tenant Vision must be backed by a
  // stronger Drupal-side media/jur binding before the proxy can safely
  // preflight it.
  const jurisdictionId = getRuntimeJurisdictionHint(event);
  if (!jurisdictionId) return true;
  if (jurisdictionId) {
    settingsUrl.searchParams.set('jurisdiction', String(jurisdictionId));
  }

  const rejectUnauthorized = (proxyConfig.rejectUnauthorized as boolean) ?? true;
  const canonicalHost = getCanonicalHost(event.node.req.headers.host);
  try {
    const settings = await $fetch<Record<string, unknown>>(settingsUrl.href, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-Host': canonicalHost || undefined,
      },
      agent: new Agent({ rejectUnauthorized }),
      dispatcher: new UndiciAgent({ connect: { rejectUnauthorized } }),
      timeout: 5000,
    });
    const features = ((settings.features ?? {}) as Record<string, unknown>);
    return readFeatureEnabled(features.photoReporting) !== true ||
      readFeatureEnabled(features.aiAnalysis) === false;
  } catch {
    return true;
  }
}

function hasAnyDrupalSessionCookie(event: H3Event): boolean {
  if (hasValidDrupalSession(event)) return true;
  const cookie = event.node.req.headers.cookie || '';
  return /(?:^|;\s*)S?SESS[^=]*=/.test(cookie);
}

const SERVICE_REQUEST_PRIVATE_FIELDS = new Set([
  'uid',
  'revision_uid',
  'revision_log',
  'revision_timestamp',
  'field_e_mail',
  'field_first_name',
  'field_last_name',
  'field_phone',
  'field_gdpr',
  'field_notes',
  'field_service_provider_notes',
  'field_service_provider',
  'field_service_provider_status',
  'field_service_provider_feedback',
  'field_service_provider_files',
  'field_internal_remark',
  'field_attachment',
  'field_sp_attachment',
  'field_boilerplates_sp',
  'field_status_notes',
  'field_status_internal',
  'field_status_internal_term',
  'field_request_attributes',
  'field_notification',
  'field_priority',
  'field_reclamation_number',
  'field_hazard_level',
  'field_sentiment',
  'field_object_id',
  'field_feedback',
  'field_approved',
  'field_escalation',
  // Inbound email threading id (#467). Internal only: field_permissions
  // permission_type custom on the backend; listed here so the proxy gates it
  // explicitly (it is the Message-ID spoofing oracle), not just via catch-all.
  'field_email_message_id',
]);
const SERVICE_REQUEST_DISABLED_WRITE_ATTRIBUTES = new Set([
  'field_notification',
]);
const SERVICE_REQUEST_PUBLIC_FIELDS = new Set([
  'field_geolocation',
  'field_address',
  'field_jurisdiction',
  'field_category',
  'field_status',
  'field_district',
  'field_sublocality',
  'field_request_media',
  'field_ai_hazard_category',
  // Intake channel (#467). permission_type public on the backend; non-PII
  // channel metadata (web/email/phone/...). Public to match backend intent and
  // avoid a 403 on any future citizen-facing read.
  'field_source',
]);

const SERVICE_REQUEST_JURISDICTION_PATH = 'field_jurisdiction.meta.drupal_internal__target_id';
const SERVICE_REQUEST_SCOPE_FILTER_PREFIX = 'filter[_mas_jurisdiction_scope]';
const INTERNAL_STATUS_SCOPE_FILTER_PREFIX = 'filter[_mas_internal_status_scope]';
const SERVICE_STATUS_SCOPE_FILTER_PREFIX = 'filter[_mas_service_status_scope]';
function isServiceRequestJsonApiPath(cleanPath: string): boolean {
  const normalizedPath = cleanPath.replace(/\/+$/, '');
  return normalizedPath === 'jsonapi/node/service_request' ||
    normalizedPath.startsWith('jsonapi/node/service_request/');
}

function isServiceRequestJsonApiCollectionPath(cleanPath: string): boolean {
  return cleanPath.replace(/\/+$/, '') === 'jsonapi/node/service_request';
}

function isInternalStatusJsonApiPath(cleanPath: string): boolean {
  const normalizedPath = cleanPath.replace(/\/+$/, '');
  return normalizedPath === 'jsonapi/taxonomy_term/internal_status' ||
    normalizedPath.startsWith('jsonapi/taxonomy_term/internal_status/');
}

function isInternalStatusJsonApiCollectionPath(cleanPath: string): boolean {
  return cleanPath.replace(/\/+$/, '') === 'jsonapi/taxonomy_term/internal_status';
}

function isServiceStatusJsonApiPath(cleanPath: string): boolean {
  const normalizedPath = cleanPath.replace(/\/+$/, '');
  return normalizedPath === 'jsonapi/taxonomy_term/service_status' ||
    normalizedPath.startsWith('jsonapi/taxonomy_term/service_status/');
}

function isServiceStatusJsonApiCollectionPath(cleanPath: string): boolean {
  return cleanPath.replace(/\/+$/, '') === 'jsonapi/taxonomy_term/service_status';
}

function isUserJsonApiPath(cleanPath: string): boolean {
  const normalizedPath = cleanPath.replace(/\/+$/, '');
  return normalizedPath === 'jsonapi/user/user' ||
    normalizedPath.startsWith('jsonapi/user/user/');
}

const USER_REFERENCE_FIELD_NAMES = new Set(['uid', 'revision_uid', 'field_author']);

function isUserReferenceFieldPath(path: string): boolean {
  return path
    .split('.')
    .some(segment => USER_REFERENCE_FIELD_NAMES.has(segment));
}

function isUserReferenceJsonApiRelationshipPath(cleanPath: string): boolean {
  const segments = cleanPath.replace(/\/+$/, '').split('/');
  if (segments[0] !== 'jsonapi') return false;

  const lastSegment = segments[segments.length - 1] || '';
  const previousSegment = segments[segments.length - 2] || '';
  return (
    previousSegment === 'relationships' &&
    USER_REFERENCE_FIELD_NAMES.has(lastSegment)
  ) || USER_REFERENCE_FIELD_NAMES.has(lastSegment);
}

function jsonApiRequestTouchesUserReference(
  cleanPath: string,
  searchParams: URLSearchParams
): boolean {
  if (isUserJsonApiPath(cleanPath)) return true;
  if (isUserReferenceJsonApiRelationshipPath(cleanPath)) return true;

  const includes = splitFieldParams(searchParams.getAll('include'));
  if (includes.some(isUserReferenceFieldPath)) return true;

  if (hasUserReferenceFilter(searchParams) || hasUserReferenceSort(searchParams)) {
    return true;
  }

  let hasUserReferenceFieldset = false;
  searchParams.forEach((value, key) => {
    if (hasUserReferenceFieldset) return;
    if (/^fields\[[^\]]+\]$/.test(key)) {
      hasUserReferenceFieldset = splitFieldParams([value]).some(isUserReferenceFieldPath);
    }
  });

  return hasUserReferenceFieldset;
}

function splitFieldParams(values: string[]): string[] {
  return values
    .join(',')
    .split(',')
    .map(field => field.trim())
    .filter(Boolean);
}

function matchesJsonApiFieldPath(path: string, fieldName: string): boolean {
  return path === fieldName || path.startsWith(`${fieldName}.`);
}

function isPrivateServiceRequestFieldPath(path: string): boolean {
  const rootField = path.split('.')[0];
  if (rootField.startsWith('field_') && !SERVICE_REQUEST_PUBLIC_FIELDS.has(rootField)) {
    return true;
  }

  return Array.from(SERVICE_REQUEST_PRIVATE_FIELDS).some(fieldName =>
    matchesJsonApiFieldPath(path, fieldName)
  );
}

function isPublicServiceRequestSparseField(fieldName: string): boolean {
  if (isPrivateServiceRequestFieldPath(fieldName)) return false;
  if (!fieldName.startsWith('field_')) return true;
  return SERVICE_REQUEST_PUBLIC_FIELDS.has(fieldName);
}

function isManagementFormModeSettingsPath(cleanPath: string): boolean {
  const normalizedPath = cleanPath.replace(/^api\//i, '').replace(/\/+$/, '');
  return normalizedPath === 'mark-a-spot-form-mode-settings/node/service_request/management';
}

function getSearchParamBracketSegments(key: string, prefix: string): string[] {
  if (!key.startsWith(`${prefix}[`)) return [];
  return Array.from(key.matchAll(/\[([^\]]+)\]/g)).map(match => match[1] || '');
}

function hasPrivateServiceRequestFilter(searchParams: URLSearchParams): boolean {
  for (const [key, value] of searchParams) {
    if (!key.startsWith('filter[')) continue;

    const segments = getSearchParamBracketSegments(key, 'filter');
    const filterPath = segments[0];
    if (filterPath && isPrivateServiceRequestFieldPath(filterPath)) {
      return true;
    }

    if (segments[segments.length - 1] === 'path' && isPrivateServiceRequestFieldPath(value)) {
      return true;
    }
  }
  return false;
}

function hasUserReferenceFilter(searchParams: URLSearchParams): boolean {
  for (const [key, value] of searchParams) {
    if (!key.startsWith('filter[')) continue;

    const segments = getSearchParamBracketSegments(key, 'filter');
    const filterPath = segments[0];
    if (filterPath && isUserReferenceFieldPath(filterPath)) {
      return true;
    }

    if (segments[segments.length - 1] === 'path' && isUserReferenceFieldPath(value)) {
      return true;
    }
  }
  return false;
}

function hasPrivateServiceRequestInclude(searchParams: URLSearchParams): boolean {
  const includes = splitFieldParams(searchParams.getAll('include'));
  return includes.some(includePath => isPrivateServiceRequestFieldPath(includePath));
}

function hasPrivateServiceRequestSort(searchParams: URLSearchParams): boolean {
  const sortPaths = splitFieldParams(searchParams.getAll('sort'));
  if (sortPaths.some(sortPath => isPrivateServiceRequestFieldPath(sortPath.replace(/^-/, '')))) {
    return true;
  }

  for (const [key, value] of searchParams) {
    if (!key.startsWith('sort[')) continue;
    const segments = getSearchParamBracketSegments(key, 'sort');
    if (segments[segments.length - 1] === 'path' && isPrivateServiceRequestFieldPath(value)) {
      return true;
    }
  }

  return false;
}

function hasUserReferenceSort(searchParams: URLSearchParams): boolean {
  const sortPaths = splitFieldParams(searchParams.getAll('sort'));
  if (sortPaths.some(sortPath => isUserReferenceFieldPath(sortPath.replace(/^-/, '')))) {
    return true;
  }

  for (const [key, value] of searchParams) {
    if (!key.startsWith('sort[')) continue;
    const segments = getSearchParamBracketSegments(key, 'sort');
    if (segments[segments.length - 1] === 'path' && isUserReferenceFieldPath(value)) {
      return true;
    }
  }

  return false;
}

function getRequestedServiceRequestJurisdictionIds(searchParams: URLSearchParams): string[] {
  const ids = new Set<string>();

  for (const [key, value] of searchParams) {
    const segments = getSearchParamBracketSegments(key, 'filter');
    if (segments[0] === SERVICE_REQUEST_JURISDICTION_PATH) {
      const lastSegment = segments[segments.length - 1];
      if (segments.length === 1 || lastSegment === 'value' || /^\d+$/.test(lastSegment)) {
        if (value.trim()) ids.add(value.trim());
      }
      continue;
    }

    if (segments[segments.length - 1] !== 'path' || value !== SERVICE_REQUEST_JURISDICTION_PATH) continue;
    const pathSuffix = key.endsWith('[condition][path]') ? '[condition][path]' : '[path]';
    const prefix = key.slice(0, -pathSuffix.length);
    for (const [valueKey, scopedValue] of searchParams) {
      if (
        valueKey === `${prefix}[condition][value]` ||
        valueKey.startsWith(`${prefix}[condition][value][`) ||
        valueKey === `${prefix}[value]` ||
        valueKey.startsWith(`${prefix}[value][`)
      ) {
        if (scopedValue.trim()) ids.add(scopedValue.trim());
      }
    }
  }

  return Array.from(ids);
}

function getRequestIdOnlyServiceRequestFilter(searchParams: URLSearchParams): string | null {
  const filterKeys = Array.from(searchParams.keys()).filter(key => key.startsWith('filter['));
  if (filterKeys.length !== 1 || filterKeys[0] !== 'filter[request_id]') {
    return null;
  }

  const requestId = searchParams.get('filter[request_id]')?.trim();
  return requestId || null;
}

function deleteSearchParamsByPrefix(searchParams: URLSearchParams, prefix: string): void {
  for (const key of Array.from(searchParams.keys())) {
    if (key.startsWith(prefix)) {
      searchParams.delete(key);
    }
  }
}

function applyServerJurisdictionScope(searchParams: URLSearchParams, jurisdictionIds: readonly string[], filterPrefix: string): void {
  deleteSearchParamsByPrefix(searchParams, filterPrefix);

  const cleanIds = Array.from(new Set(jurisdictionIds.map(String).filter(Boolean)));
  if (cleanIds.length === 0) return;

  searchParams.set(`${filterPrefix}[condition][path]`, SERVICE_REQUEST_JURISDICTION_PATH);
  searchParams.set(`${filterPrefix}[condition][operator]`, 'IN');
  cleanIds.forEach((id, index) => {
    searchParams.set(`${filterPrefix}[condition][value][${index}]`, id);
  });
}

function applyServerServiceRequestJurisdictionScope(searchParams: URLSearchParams, jurisdictionIds: readonly string[]): void {
  applyServerJurisdictionScope(searchParams, jurisdictionIds, SERVICE_REQUEST_SCOPE_FILTER_PREFIX);
}

function applyServerInternalStatusJurisdictionScope(searchParams: URLSearchParams, jurisdictionIds: readonly string[]): void {
  applyServerJurisdictionScope(searchParams, jurisdictionIds, INTERNAL_STATUS_SCOPE_FILTER_PREFIX);
}

function applyServerServiceStatusJurisdictionScope(searchParams: URLSearchParams, jurisdictionIds: readonly string[]): void {
  applyServerJurisdictionScope(searchParams, jurisdictionIds, SERVICE_STATUS_SCOPE_FILTER_PREFIX);
}

export function jsonApiRequestNeedsServiceRequestPrivateFieldAccess(cleanPath: string, searchParams: URLSearchParams): boolean {
  if (!isServiceRequestJsonApiPath(cleanPath)) return false;

  const fieldParams = searchParams.getAll('fields[node--service_request]');
  if (fieldParams.length === 0) return true;

  const requestedFields = splitFieldParams(fieldParams);
  return requestedFields.some(field => !isPublicServiceRequestSparseField(field)) ||
    hasPrivateServiceRequestInclude(searchParams) ||
    hasPrivateServiceRequestFilter(searchParams) ||
    hasPrivateServiceRequestSort(searchParams);
}

export function jsonApiRequestNeedsServiceRequestJurisdictionScope(cleanPath: string, searchParams: URLSearchParams): boolean {
  if (!isServiceRequestJsonApiCollectionPath(cleanPath)) return false;
  return true;
}

export function jsonApiRequestNeedsStatusDefinitionAccess(cleanPath: string, searchParams: URLSearchParams): boolean {
  if (isInternalStatusJsonApiPath(cleanPath)) {
    return true;
  }

  if (!cleanPath.startsWith('jsonapi/taxonomy_term/service_status')) return false;

  const fieldParams = searchParams.getAll('fields[taxonomy_term--service_status]');
  if (fieldParams.length === 0) return true;
  return fieldParams
    .join(',')
    .split(',')
    .map(field => field.trim())
    .includes('field_status_definition');
}

function authStatusAllowsInternalStatusDefinitions(response: unknown): boolean {
  if (!isValidAuthStatusResponse(response) || response.authenticated !== true) return false;
  const roles = extractRoles(response);
  if (String(response.user?.uid ?? '') === '1' && !roles.includes('administrator')) {
    roles.push('administrator');
  }
  const groups = Array.isArray(response.user?.groups) ? response.user.groups : [];
  return canAccessInternalStatusDefinitions(roles, groups);
}

function authStatusHasGlobalDashboardAccess(response: unknown): boolean {
  if (!isValidAuthStatusResponse(response) || response.authenticated !== true) return false;
  const roles = extractRoles(response);
  if (String(response.user?.uid ?? '') === '1' && !roles.includes('administrator')) {
    roles.push('administrator');
  }
  return hasGlobalDashboardRole(roles);
}

function getAccessibleJurisdictionIds(response: AuthStatusResponse): Set<string> {
  const roles = extractRoles(response);
  if (String(response.user?.uid ?? '') === '1' && !roles.includes('administrator')) {
    roles.push('administrator');
  }
  const groups = Array.isArray(response.user?.groups) ? response.user.groups : [];
  return getAccessibleJurisdictionIdsForRoles(roles, groups);
}

async function getInternalDashboardAuthStatus(
  event: H3Event,
  targetBase: string,
  proxyConfig: Record<string, unknown>
): Promise<AuthStatusResponse | null> {
  if (!hasAnyDrupalSessionCookie(event)) return null;

  const eventFetch = (event as H3Event & {
    $fetch?: <T>(request: string, options?: Record<string, unknown>) => Promise<T>
  }).$fetch;
  if (eventFetch) {
    try {
      const response = await eventFetch<unknown>('/api/auth/status', {
        headers: { cookie: event.node.req.headers.cookie || '' },
        timeout: 5000,
      });
      return isValidAuthStatusResponse(response) ? response : null;
    } catch {
      return null;
    }
  }

  const normalizedBase = String(targetBase || '').replace(/\/+$/, '');
  const origin = `http://${event.node.req.headers.host}`;
  const authUrl = /^https?:\/\//.test(normalizedBase)
    ? new URL(`${normalizedBase}/api/auth/status`)
    : new URL(`${normalizedBase}/api/auth/status`, origin);
  const rejectUnauthorized = (proxyConfig.rejectUnauthorized as boolean) ?? true;

  try {
    const response = await $fetch<unknown>(authUrl.href, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        cookie: event.node.req.headers.cookie || '',
      },
      agent: new Agent({ rejectUnauthorized }),
      dispatcher: new UndiciAgent({ connect: { rejectUnauthorized } }),
      timeout: 5000,
    });
    return isValidAuthStatusResponse(response) ? response : null;
  } catch {
    return null;
  }
}

function getGeoReportItem(response: unknown): Record<string, unknown> | null {
  if (Array.isArray(response)) {
    return (response[0] && typeof response[0] === 'object')
      ? response[0] as Record<string, unknown>
      : null;
  }
  if (!response || typeof response !== 'object') return null;

  const candidate = response as Record<string, unknown>;
  if (Array.isArray(candidate.requests)) {
    const first = candidate.requests[0];
    return (first && typeof first === 'object') ? first as Record<string, unknown> : null;
  }
  return candidate;
}

function getNestedRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const nested = (value as Record<string, unknown>)[key];
  return (nested && typeof nested === 'object') ? nested as Record<string, unknown> : null;
}

function georeportItemAllowsJsonApiDetailFallback(item: Record<string, unknown>, requestId: string): boolean {
  const itemRequestId = String(item.service_request_id || item.request_id || '');
  if (itemRequestId !== requestId) return false;

  if (item.editable === true) return true;

  const extendedAttributes = getNestedRecord(item, 'extended_attributes');
  const markaspot = getNestedRecord(extendedAttributes, 'markaspot');
  const permissions = getNestedRecord(markaspot, 'permissions');

  return markaspot?.editable === true || permissions?.update === true;
}

async function canUseGeoReportValidatedDetailFallback(
  event: H3Event,
  requestId: string,
  targetBase: string,
  proxyConfig: Record<string, unknown>
): Promise<boolean> {
  const normalizedBase = String(targetBase || '').replace(/\/+$/, '');
  const origin = `http://${event.node.req.headers.host}`;
  const requestUrl = /^https?:\/\//.test(normalizedBase)
    ? new URL(`${normalizedBase}/georeport/v2/requests/${encodeURIComponent(requestId)}.json`)
    : new URL(`${normalizedBase}/georeport/v2/requests/${encodeURIComponent(requestId)}.json`, origin);
  requestUrl.searchParams.set('extensions', 'true');
  const rejectUnauthorized = (proxyConfig.rejectUnauthorized as boolean) ?? true;

  try {
    const response = await $fetch<unknown>(requestUrl.href, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        cookie: event.node.req.headers.cookie || '',
      },
      agent: new Agent({ rejectUnauthorized }),
      dispatcher: new UndiciAgent({ connect: { rejectUnauthorized } }),
      timeout: 5000,
    });
    const item = getGeoReportItem(response);
    return !!item && georeportItemAllowsJsonApiDetailFallback(item, requestId);
  } catch {
    return false;
  }
}

async function hasInternalStatusDefinitionAccess(
  event: H3Event,
  targetBase: string,
  proxyConfig: Record<string, unknown>
): Promise<boolean> {
  const authStatus = await getInternalDashboardAuthStatus(event, targetBase, proxyConfig);
  return authStatusAllowsInternalStatusDefinitions(authStatus);
}

async function assertStatusDefinitionJsonApiAccess(
  event: H3Event,
  cleanPath: string,
  searchParams: URLSearchParams,
  targetBase: string,
  proxyConfig: Record<string, unknown>
): Promise<void> {
  if (!['GET', 'HEAD'].includes(event.method.toUpperCase())) return;
  if (!jsonApiRequestNeedsStatusDefinitionAccess(cleanPath, searchParams)) return;

  const authStatus = await getInternalDashboardAuthStatus(event, targetBase, proxyConfig);
  if (!authStatus || !authStatusAllowsInternalStatusDefinitions(authStatus)) {
    throw createSafeError({
      statusCode: 403,
      message: 'Authentication required for status definitions',
    });
  }

  if (isServiceStatusJsonApiPath(cleanPath)) {
    const isGlobalDashboardAccess = authStatusHasGlobalDashboardAccess(authStatus);
    if (!isServiceStatusJsonApiCollectionPath(cleanPath)) {
      if (!isGlobalDashboardAccess) {
        throw createSafeError({
          statusCode: 403,
          message: 'Direct service status definition reads require global dashboard access',
        });
      }
      return;
    }

    const requestedJurisdictionIds = getRequestedServiceRequestJurisdictionIds(searchParams);
    if (isGlobalDashboardAccess) {
      applyServerServiceStatusJurisdictionScope(searchParams, requestedJurisdictionIds);
      return;
    }

    const accessibleJurisdictionIds = getAccessibleJurisdictionIds(authStatus);
    const scopeIds = requestedJurisdictionIds.length > 0
      ? requestedJurisdictionIds
      : Array.from(accessibleJurisdictionIds);
    const isScopedToAccessibleJurisdiction = scopeIds.length > 0 &&
      scopeIds.every(id => accessibleJurisdictionIds.has(id));

    if (!isScopedToAccessibleJurisdiction) {
      throw createSafeError({
        statusCode: 403,
        message: 'Jurisdiction scope required for service status definitions',
      });
    }

    applyServerServiceStatusJurisdictionScope(searchParams, scopeIds);
    return;
  }

  if (!isInternalStatusJsonApiPath(cleanPath)) return;

  const isGlobalDashboardAccess = authStatusHasGlobalDashboardAccess(authStatus);
  if (!isInternalStatusJsonApiCollectionPath(cleanPath)) {
    if (!isGlobalDashboardAccess) {
      throw createSafeError({
        statusCode: 403,
        message: 'Direct internal status reads require global dashboard access',
      });
    }
    return;
  }

  const requestedJurisdictionIds = getRequestedServiceRequestJurisdictionIds(searchParams);
  if (isGlobalDashboardAccess) {
    applyServerInternalStatusJurisdictionScope(searchParams, requestedJurisdictionIds);
    return;
  }

  const accessibleJurisdictionIds = getAccessibleJurisdictionIds(authStatus);
  const scopeIds = requestedJurisdictionIds.length > 0
    ? requestedJurisdictionIds
    : Array.from(accessibleJurisdictionIds);
  const isScopedToAccessibleJurisdiction = scopeIds.length > 0 &&
    scopeIds.every(id => accessibleJurisdictionIds.has(id));

  if (!isScopedToAccessibleJurisdiction) {
    throw createSafeError({
      statusCode: 403,
      message: 'Jurisdiction scope required for internal status definitions',
    });
  }

  applyServerInternalStatusJurisdictionScope(searchParams, scopeIds);
}

async function assertServiceRequestPrivateJsonApiAccess(
  event: H3Event,
  cleanPath: string,
  searchParams: URLSearchParams,
  targetBase: string,
  proxyConfig: Record<string, unknown>
): Promise<void> {
  if (!['GET', 'HEAD'].includes(event.method.toUpperCase())) return;
  const needsPrivateFieldAccess = jsonApiRequestNeedsServiceRequestPrivateFieldAccess(cleanPath, searchParams);
  const isCollectionRequest = isServiceRequestJsonApiCollectionPath(cleanPath);
  if (!needsPrivateFieldAccess && !isCollectionRequest) return;
  const authStatus = await getInternalDashboardAuthStatus(event, targetBase, proxyConfig);
  const hasDashboardAccess = authStatusAllowsInternalStatusDefinitions(authStatus);
  if (needsPrivateFieldAccess && (!authStatus || !hasDashboardAccess)) {
    throw createSafeError({
      statusCode: 403,
      message: 'Authentication required for service request private fields',
    });
  }
  if (!authStatus || !hasDashboardAccess) {
    if (isCollectionRequest) {
      throw createSafeError({
        statusCode: 403,
        message: 'Authentication required for service request collection',
      });
    }
    return;
  }

  const isGlobalDashboardAccess = authStatusHasGlobalDashboardAccess(authStatus);
  const requestedJurisdictionIds = getRequestedServiceRequestJurisdictionIds(searchParams);

  if (isCollectionRequest) {
    if (isGlobalDashboardAccess) {
      applyServerServiceRequestJurisdictionScope(searchParams, requestedJurisdictionIds);
      return;
    }

    const accessibleJurisdictionIds = getAccessibleJurisdictionIds(authStatus);
    const detailFallbackRequestId = needsPrivateFieldAccess && requestedJurisdictionIds.length === 0
      ? getRequestIdOnlyServiceRequestFilter(searchParams)
      : null;
    if (
      detailFallbackRequestId &&
      await canUseGeoReportValidatedDetailFallback(event, detailFallbackRequestId, targetBase, proxyConfig)
    ) {
      const fallbackScopeIds = Array.from(accessibleJurisdictionIds);
      if (fallbackScopeIds.length > 0) {
        applyServerServiceRequestJurisdictionScope(searchParams, fallbackScopeIds);
        return;
      }
    }

    const scopeIds = requestedJurisdictionIds.length > 0
      ? requestedJurisdictionIds
      : Array.from(accessibleJurisdictionIds);
    const isScopedToAccessibleJurisdiction = scopeIds.length > 0 &&
      scopeIds.every(id => accessibleJurisdictionIds.has(id));

    if (!isScopedToAccessibleJurisdiction) {
      throw createSafeError({
        statusCode: 403,
        message: 'Jurisdiction scope required for service request private fields',
      });
    }

    applyServerServiceRequestJurisdictionScope(searchParams, scopeIds);
    return;
  }

  if (needsPrivateFieldAccess && !isGlobalDashboardAccess) {
    throw createSafeError({
      statusCode: 403,
      message: 'Direct service request private field reads require global dashboard access',
    });
  }
}

async function assertUserJsonApiAccess(
  event: H3Event,
  cleanPath: string,
  searchParams: URLSearchParams,
  targetBase: string,
  proxyConfig: Record<string, unknown>
): Promise<void> {
  if (!['GET', 'HEAD'].includes(event.method.toUpperCase())) return;
  if (!jsonApiRequestTouchesUserReference(cleanPath, searchParams)) return;

  const authStatus = await getInternalDashboardAuthStatus(event, targetBase, proxyConfig);
  if (authStatus?.authenticated === true) return;

  throw createSafeError({
    statusCode: 403,
    message: 'Authentication required for user resources',
  });
}

function isGeoReportXmlPath(path: string): boolean {
  return path.startsWith('georeport/') && path.toLowerCase().endsWith('.xml');
}

function matchesGeoReportEndpointPath(path: string, basePath: string): boolean {
  const normalizedPath = path.toLowerCase();
  const normalizedBasePath = basePath.toLowerCase();
  return normalizedPath === normalizedBasePath
    || normalizedPath === `${normalizedBasePath}.json`
    || normalizedPath === `${normalizedBasePath}.xml`
    || normalizedPath.startsWith(`${normalizedBasePath}/`);
}

function matchesGeoReportWriteEndpointPath(path: string, basePath: string): boolean {
  const normalizedPath = path.toLowerCase();
  const normalizedBasePath = basePath.toLowerCase();
  return normalizedPath === normalizedBasePath
    || normalizedPath === `${normalizedBasePath}.json`
    || normalizedPath === `${normalizedBasePath}.xml`;
}

function looksLikeXmlPayload(response: unknown): boolean {
  if (typeof response !== 'string') {
    return false;
  }

  const trimmed = response.trimStart().toLowerCase();
  return /^<\?xml[\s>]/i.test(trimmed)
    || /^<(open311|services|service|discovery|requests|request|service_request|service_requests|service_definition|service_definitions|errors|error)([\s>/:])/i.test(trimmed);
}

function isHtmlContentType(contentType?: string | null): boolean {
  return typeof contentType === 'string' && contentType.toLowerCase().includes('text/html');
}

function looksLikeHtmlPayload(response: unknown): boolean {
  if (typeof response !== 'string') {
    return false;
  }

  const trimmed = response.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype html')
    || trimmed.startsWith('<html')
    || trimmed.includes('<body');
}

function normalizeErrorBody(
  body: unknown,
  statusCode: number,
  fallbackMessage: string,
  upstreamContentType?: string | null
): unknown {
  if (typeof body !== 'string') {
    return stripSensitive(body);
  }

  try {
    return stripSensitive(JSON.parse(body));
  } catch {
    // Continue below for non-JSON upstream bodies.
  }

  if (isHtmlContentType(upstreamContentType) || looksLikeHtmlPayload(body)) {
    return {
      statusCode,
      message: fallbackMessage,
    };
  }

  return stripSensitive(body);
}

function getSafeGeoReportContentType(path: string, upstreamContentType: string | null, response: unknown): string | null {
  const requestedXml = path.toLowerCase().endsWith('.xml');
  if (!upstreamContentType) {
    return requestedXml && looksLikeXmlPayload(response) ? 'application/xml' : null;
  }

  const [rawMimeType, ...rawParams] = upstreamContentType.split(';');
  const mimeType = rawMimeType?.trim().toLowerCase();

  if (!mimeType || !GEOREPORT_ALLOWED_CONTENT_TYPES.has(mimeType)) {
    return null;
  }

  const charset = rawParams
    .map(param => param.trim())
    .find(param => /^charset=/i.test(param));

  return charset ? `${mimeType}; ${charset}` : mimeType;
}

function isOctetStreamContentType(contentType: string | undefined): boolean {
  const mimeType = contentType?.split(';')[0]?.trim().toLowerCase();
  return mimeType === 'application/octet-stream';
}

function isMultipartFormDataContentType(contentType: string | undefined): boolean {
  const mimeType = contentType?.split(';')[0]?.trim().toLowerCase();
  return mimeType === 'multipart/form-data';
}

function isRawUploadContentType(contentType: string | undefined): boolean {
  return isOctetStreamContentType(contentType) || isMultipartFormDataContentType(contentType);
}

function isJsonContentType(contentType: string | undefined): boolean {
  const mimeType = contentType?.split(';')[0]?.trim().toLowerCase();
  return mimeType === 'application/json';
}

function isGeoReportWriteMethod(method: string): boolean {
  return method.toUpperCase() === 'POST';
}

function hasRequestBody(method: string): boolean {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase());
}

function stripDisabledServiceRequestWriteAttributes(body: Buffer | Record<string, unknown> | string | undefined): boolean {
  if (!body || body instanceof Buffer || typeof body !== 'object') {
    return false;
  }

  const bodyRecord = body as Record<string, unknown>;
  const resources = Array.isArray(bodyRecord.data) ? bodyRecord.data : [bodyRecord.data];
  let stripped = false;
  for (const resource of resources) {
    if (!resource || typeof resource !== 'object' || Array.isArray(resource)) continue;
    const attributes = (resource as { attributes?: unknown }).attributes;
    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) continue;
    const attributeRecord = attributes as Record<string, unknown>;
    for (const fieldName of SERVICE_REQUEST_DISABLED_WRITE_ATTRIBUTES) {
      if (Object.prototype.hasOwnProperty.call(attributeRecord, fieldName)) {
        delete attributeRecord[fieldName];
        stripped = true;
      }
    }
  }

  return stripped;
}

function getGeoReportApiKeyFromBody(body: Buffer | Record<string, unknown> | string | undefined): string | null {
  if (!body || body instanceof Buffer) {
    return null;
  }

  if (typeof body === 'string') {
    const apiKey = new URLSearchParams(body).get('api_key');
    return apiKey?.trim() ? apiKey : null;
  }

  if (typeof body === 'object') {
    const apiKey = (body as Record<string, unknown>).api_key;
    return typeof apiKey === 'string' && apiKey.trim() ? apiKey : null;
  }

  return null;
}

function stripGeoReportApiKeyFromBody(body: Buffer | Record<string, unknown> | string | undefined): Buffer | Record<string, unknown> | string | undefined {
  if (!body || body instanceof Buffer) {
    return body;
  }

  if (typeof body === 'string') {
    const params = new URLSearchParams(body);
    params.delete('api_key');
    const nextBody = params.toString();
    return nextBody || undefined;
  }

  if (typeof body === 'object' && body !== null) {
    const { api_key: _apiKey, ...rest } = body as Record<string, unknown>;
    return rest;
  }

  return body;
}

function assertGeoReportWriteBodySize(event: H3Event): void {
  const headerValue = event.node.req.headers['content-length'];
  const rawContentLength = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!rawContentLength) {
    return;
  }

  const contentLength = Number.parseInt(rawContentLength, 10);
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return;
  }

  if (contentLength > GEOREPORT_MAX_WRITE_BODY_BYTES) {
    throw createSafeError({
      statusCode: 413,
      message: `GeoReport request body exceeds limit (${Math.round(GEOREPORT_MAX_WRITE_BODY_BYTES / 1024)}KB)`,
    });
  }
}

function parseGeoReportRequestBody(rawBody: string | undefined, contentType: string): Buffer | Record<string, unknown> | string | undefined {
  if (rawBody === undefined) {
    return undefined;
  }

  if (isJsonContentType(contentType)) {
    try {
      return JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      throw createSafeError({ statusCode: 400, message: 'Invalid JSON body' });
    }
  }

  if (contentType.startsWith('application/x-www-form-urlencoded')) {
    return rawBody;
  }

  if (contentType.startsWith('text/')) {
    return rawBody;
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return rawBody;
  }
}

async function readLimitedGeoReportRequestBody(event: H3Event, maxBytes: number): Promise<Buffer | Record<string, unknown> | string | undefined> {
  const req = event.node.req as typeof event.node.req & {
    rawBody?: Buffer | string | Record<string, unknown>
    body?: Buffer | string | Record<string, unknown>
  };
  const contentType = String(req.headers['content-type'] || '');

  const rawContentLength = Array.isArray(req.headers['content-length'])
    ? req.headers['content-length'][0]
    : req.headers['content-length'];
  if (rawContentLength) {
    const contentLength = Number.parseInt(rawContentLength, 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw createSafeError({
        statusCode: 413,
        message: `GeoReport request body exceeds limit (${Math.round(maxBytes / 1024)}KB)`,
      });
    }
  }

  const existingBody = req.rawBody ?? req.body;
  if (existingBody !== undefined && existingBody !== null) {
    const normalized = typeof existingBody === 'string'
      ? existingBody
      : Buffer.isBuffer(existingBody)
        ? existingBody.toString('utf8')
        : JSON.stringify(existingBody);

    if (Buffer.byteLength(normalized, 'utf8') > maxBytes) {
      throw createSafeError({
        statusCode: 413,
        message: `GeoReport request body exceeds limit (${Math.round(maxBytes / 1024)}KB)`,
      });
    }

    return parseGeoReportRequestBody(normalized, contentType);
  }

  const transferEncoding = String(req.headers['transfer-encoding'] ?? '');
  const expectsStreamBody = /\bchunked\b/i.test(transferEncoding);
  const hasStreamReader = typeof req.on === 'function' && !('mock' in req.on);

  if (hasStreamReader && (rawContentLength || expectsStreamBody)) {
    const rawBody = await new Promise<string | undefined>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;

      req.on('error', reject).on('data', (chunk: Uint8Array | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalSize += buffer.length;

        if (totalSize > maxBytes) {
          reject(createSafeError({
            statusCode: 413,
            message: `GeoReport request body exceeds limit (${Math.round(maxBytes / 1024)}KB)`,
          }));
          req.destroy?.();
          return;
        }

        chunks.push(buffer);
      }).on('end', () => {
        resolve(chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : undefined);
      });
    });

    return parseGeoReportRequestBody(rawBody, contentType);
  }

  if (hasStreamReader) {
    return undefined;
  }

  if (!expectsStreamBody || !hasStreamReader) {
    return await readBody(event);
  }
  return undefined;
}

async function readRawUploadBody(event: H3Event, maxBytes: number, abortSignal?: AbortSignal): Promise<Buffer> {
  const req = event.node.req as typeof event.node.req & {
    rawBody?: Buffer | string | Record<string, unknown>
    body?: Buffer | string | Record<string, unknown>
  };

  const rawContentLength = Array.isArray(req.headers['content-length'])
    ? req.headers['content-length'][0]
    : req.headers['content-length'];
  if (rawContentLength) {
    const contentLength = Number.parseInt(rawContentLength, 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw createSafeError({
        statusCode: 413,
        message: `File size exceeds limit (${Math.round(maxBytes / 1048576)}MB)`,
      });
    }
  }

  const existingBody = req.rawBody ?? req.body;
  if (existingBody !== undefined && existingBody !== null) {
    const buffer = Buffer.isBuffer(existingBody)
      ? existingBody
      : typeof existingBody === 'string'
        ? Buffer.from(existingBody)
        : Buffer.from(JSON.stringify(existingBody));

    if (buffer.length > maxBytes) {
      throw createSafeError({
        statusCode: 413,
        message: `File size exceeds limit (${Math.round(maxBytes / 1048576)}MB)`,
      });
    }

    return buffer;
  }

  let totalSize = 0;
  const chunks: Buffer[] = [];

  for await (const chunk of event.node.req) {
    if (abortSignal?.aborted) {
      throw createSafeError({ statusCode: 499, message: 'Upload cancelled' });
    }
    const buffer = Buffer.from(chunk as Uint8Array);
    totalSize += buffer.length;
    if (totalSize > maxBytes) {
      throw createSafeError({
        statusCode: 413,
        message: `File size exceeds limit (${Math.round(maxBytes / 1048576)}MB)`,
      });
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function passThroughGeoReportXmlBody(
  event: H3Event,
  path: string,
  body: unknown,
  upstreamContentType: string | null
): string | undefined {
  if (typeof body !== 'string') {
    return undefined;
  }

  const safeContentType = getSafeGeoReportContentType(path, upstreamContentType, body);
  if (!safeContentType || !safeContentType.includes('xml')) {
    return undefined;
  }

  event.node.res.setHeader('content-type', safeContentType);
  return body;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractGeoReportErrorMessage(body: unknown, fallbackMessage: string): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const directMessage = record.message;
    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage;
    }

    const errors = record.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (first && typeof first === 'object') {
        const detail = (first as Record<string, unknown>).detail;
        if (typeof detail === 'string' && detail.trim()) {
          return detail;
        }
        const title = (first as Record<string, unknown>).title;
        if (typeof title === 'string' && title.trim()) {
          return title;
        }
      }
    }
  }

  return fallbackMessage;
}

function createGeoReportXmlErrorBody(statusCode: number, message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><errors><error><status>${statusCode}</status><message>${escapeXml(message)}</message></error></errors>`;
}

function formatGeoReportXmlErrorResponse(
  event: H3Event,
  path: string,
  statusCode: number,
  body: unknown,
  fallbackMessage: string,
  upstreamContentType: string | null = null
): string | undefined {
  if (!isGeoReportXmlPath(path)) {
    return undefined;
  }

  const xmlBody = passThroughGeoReportXmlBody(event, path, body, upstreamContentType);
  if (xmlBody !== undefined) {
    event.node.res.statusCode = statusCode;
    return xmlBody;
  }

  event.node.res.statusCode = statusCode;
  event.node.res.setHeader('content-type', 'application/xml');
  return createGeoReportXmlErrorBody(statusCode, extractGeoReportErrorMessage(body, fallbackMessage));
}

export default defineEventHandler(async (event) => {
  logRequest('Incoming request:', {
    method: event.method,
    url: event.node.req.url,
    path: event.context.params?.path,
  });

  // Parse the request path and get client IP. Do not trust client-controlled
  // forwarding headers here; the proxy strips them before forwarding upstream.
  const socketIp = event.node.req.socket?.remoteAddress || '';
  const ip = socketIp || 'unknown';
  const pathParam = event.context.params?.path;
  const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
  let cleanPath = String(path || '').replace(/^\/+/, '');

  if (isSuspiciousPath(cleanPath)) {
    throw createSafeError({ statusCode: 400, message: 'Invalid path' });
  }

  // Block JSON:API index endpoint (security: don't expose resource list)
  if (cleanPath === 'jsonapi' || cleanPath === 'jsonapi/') {
    throw createSafeError({ statusCode: 404, message: 'Not Found' });
  }

  // Add /api prefix back for custom API endpoints
  const needsApiPrefix = !isSsoAuthPath(cleanPath) &&
    CUSTOM_API_ENDPOINTS.some(ep =>
      cleanPath === ep || cleanPath.startsWith(ep + '/')
    );
  if (needsApiPrefix && !cleanPath.startsWith('api/')) {
    cleanPath = `api/${cleanPath}`;
  }

  // Detect embed context from referer (used for cookie rewriting and auth decisions)
  const referer = getHeader(event, 'referer') || '';
  const isEmbedRequest = /\/embed\//.test(referer);

  let targetBase = useRuntimeConfig().public.apiBase as string;
  const endpointType = getEndpointType(cleanPath, event.method);
  const hasDrupalSessionCookie = hasValidDrupalSession(event);
  const forwardsSessionCookie = !isPublicSettingsPath(cleanPath) || hasDrupalSessionCookie;
  const hasSessionCookie = forwardsSessionCookie && hasDrupalSessionCookie;

  // Triage inbox is authenticated-only: reject unauthenticated requests at the
  // proxy before they reach Drupal (SEC). Mirrors the management form settings
  // gate above; Drupal still enforces the real permission, this is a fast pre-gate.
  if (isInboundMailPath(cleanPath) && !hasSessionCookie) {
    throw createSafeError({
      statusCode: 401,
      message: 'Authentication required',
    });
  }

  // Binary passthrough for inbound-mail attachment downloads (image/*). These
  // must stream through with their upstream Content-Type intact rather than go
  // through the JSON $fetch pipeline below (which loses the type and can corrupt
  // the bytes, breaking <img> previews). Still requires the session cookie
  // (gated above) and routes failures through createSafeError.
  if (isInboundMailAttachmentPath(cleanPath)) {
    const proxyConfig = ((useRuntimeConfig() as Record<string, unknown>).proxy ?? {}) as Record<string, unknown>;
    const attachmentBase = getSessionAwareApiBase(targetBase, event.node.req.headers.host, hasSessionCookie);
    const normalizedAttachmentBase = String(attachmentBase || '').replace(/\/+$/, '');
    const attachmentUrl = /^https?:\/\//.test(normalizedAttachmentBase)
      ? new URL(`${normalizedAttachmentBase}/${cleanPath}`)
      : new URL(`${normalizedAttachmentBase}/${cleanPath}`, `http://${event.node.req.headers.host}`);

    const rejectUnauthorized = (proxyConfig.rejectUnauthorized as boolean) ?? true;
    const canonicalHost = getCanonicalHost(event.node.req.headers.host);

    try {
      const upstream = await $fetch.raw(attachmentUrl.href, {
        method: 'GET',
        responseType: 'arrayBuffer',
        headers: {
          cookie: event.node.req.headers.cookie,
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-Host': canonicalHost || undefined,
        },
        agent: new Agent({ rejectUnauthorized }),
        dispatcher: new UndiciAgent({ connect: { rejectUnauthorized } }),
        timeout: ((proxyConfig.timeoutSeconds as number) ?? 30) * 1000,
      });

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = upstream.headers.get('content-disposition');
      const cacheControl = upstream.headers.get('cache-control');

      event.node.res.setHeader('content-type', contentType);
      // Harden: never let a sniffed type override the upstream declaration.
      event.node.res.setHeader('x-content-type-options', 'nosniff');
      if (contentDisposition) {
        event.node.res.setHeader('content-disposition', contentDisposition);
      }
      // Attachments are private; default to no-store unless upstream is explicit.
      event.node.res.setHeader('cache-control', cacheControl || 'private, no-store');

      return Buffer.from(upstream._data as ArrayBuffer);
    } catch (caught: unknown) {
      const fetchError = caught as ProxyFetchError;
      const statusCode = (fetchError.status || fetchError.statusCode || fetchError.response?.status || 502) as number;
      logRequest('Inbound-mail attachment fetch failed', {
        status: statusCode,
        path: cleanPath,
      });
      throw createSafeError({
        statusCode,
        message: statusCode === 404 ? 'Not Found' : 'Attachment request failed',
      });
    }
  }

  // Public submit endpoints are rate-limited even when the client sends a
  // Drupal-looking cookie. Cookie shape alone is not proof of authentication.
  if (!hasSessionCookie || isAlwaysRateLimitedPath(pathParam, event.method)) {
    try {
      checkRateLimit(event, ip, endpointType, event.method);
    } catch (caught: unknown) {
      const error = caught as ProxyFetchError;
      const statusCode = (error.statusCode || error.status || 500) as number;
      const xmlError = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        statusCode,
        error.data,
        error.message || 'Request failed'
      );
      if (xmlError !== undefined) {
        return xmlError;
      }
      throw error;
    }
  }

  const config = useRuntimeConfig();
  const proxyConfig = ((config as Record<string, unknown>).proxy ?? {}) as Record<string, unknown>;
  const publicConfig = ((config as Record<string, unknown>).public ?? {}) as Record<string, unknown>;
  const clientConfig = ((publicConfig.clientConfig ?? {}) as Record<string, unknown>);
  const featureFlags = ((clientConfig.features ?? {}) as Record<string, unknown>);
  const allowGeoreportPost = featureFlags.allowGeoreportPost === true;
  const accessPath = normalizeJsonApiAccessPath(cleanPath, config as Record<string, unknown>);

  if (accessPath === 'jsonapi' || accessPath === 'jsonapi/') {
    throw createSafeError({ statusCode: 404, message: 'Not Found' });
  }

  const isVisionRequest = isVisionAnalyzePath(accessPath);
  if (isVisionRequest) {
    if (await isVisionAnalyzeDisabled(event, targetBase, proxyConfig)) {
      throw createSafeError({
        statusCode: 403,
        message: 'Vision analysis is disabled',
      });
    }
  }

  targetBase = getSessionAwareApiBase(targetBase, event.node.req.headers.host, hasSessionCookie);

  // Build absolute target URL
  const normalizedBase = String(targetBase || '').replace(/\/+$/, '');
  let baseUrl: URL;
  if (/^https?:\/\//.test(normalizedBase)) {
    baseUrl = new URL(`${normalizedBase}/${cleanPath}`);
  } else {
    const origin = `http://${event.node.req.headers.host}`;
    baseUrl = new URL(`${normalizedBase}/${cleanPath}`, origin);
  }

  // Prepare request headers
  const incomingHeaders = getRequestHeaders(event);
  const isJsonApiWrite = accessPath.startsWith('jsonapi/') &&
    ['PATCH', 'PUT', 'POST'].includes(event.method);
  const isDemoServiceRequestCreate = publicConfig.demoMode === true &&
    event.method === 'POST' &&
    accessPath === 'jsonapi/node/service_request';
  if (isDemoServiceRequestCreate && incomingHeaders['x-demo-submission-confirmed'] !== 'true') {
    throw createSafeError({
      statusCode: 403,
      message: 'Demo submission confirmation required',
    });
  }
  // X-Translation-Language is an explicit override header that is not affected
  // by browser default Accept-Language merging. Used by useTranslatable to
  // fetch specific translations (e.g. fetching the 'en' version while the
  // browser locale is 'de').
  const translationLanguage = incomingHeaders['x-translation-language'];
  const acceptLanguage = translationLanguage || incomingHeaders['accept-language'] || 'de';

  // Derive X-Forwarded-Host from server config, not client Host header,
  // to prevent host header injection in multi-tenant environments.
  const canonicalHost = getCanonicalHost(event.node.req.headers.host);

  const headers: Record<string, string | undefined> = {
    ...incomingHeaders,
    cookie: forwardsSessionCookie ? event.node.req.headers.cookie : undefined,
  };
  deleteRequestHeaders(headers, PROXY_CONTROLLED_REQUEST_HEADERS);
  headers['X-Forwarded-Proto'] = 'https';
  headers['X-Forwarded-Host'] = canonicalHost || undefined;

  delete headers['accept-language'];
  delete headers['x-translation-language'];
  delete headers['x-demo-submission-confirmed'];
  deleteRequestHeaders(headers, [INTERNAL_JURISDICTION_HEADER]);

  if (isJsonApiWrite) {
    const contentLanguage = incomingHeaders['content-language'];
    if (contentLanguage) {
      headers['Accept-Language'] = contentLanguage;
      logRequest('JSON:API write using entity langcode:', { langcode: contentLanguage, method: event.method });
    } else {
      headers['Accept-Language'] = acceptLanguage;
    }
  } else {
    headers['Accept-Language'] = acceptLanguage;
    logRequest('Forwarding Accept-Language:', { lang: acceptLanguage, path: cleanPath });
  }

  // Handle media files from Drupal
  if (cleanPath.startsWith('sites/default/files/')) {
    logRequest('Media file request detected:', { path: cleanPath });
    if (config.public.geoReportApiBase) {
      targetBase = config.public.geoReportApiBase as string;
      baseUrl = new URL(cleanPath, targetBase);
      logRequest('Using geoReportApiBase for media URL:', { url: baseUrl.href });
    }
  }

  // GeoReport API: api_key_auth has priority 100, cookie has priority 0 in Drupal.
  // When both are present, api_key_auth ALWAYS wins and the session is ignored.
  // Only add api_key when no session cookie exists, so logged-in users (moderators,
  // editors) keep their elevated permissions. Requires reverse_proxy trust in
  // Drupal settings.php for session cookies to work through the proxy.
  //
  // Exception: embed context always uses api_key (embeds are anonymous by design,
  // but the browser may leak session cookies when embed runs on the same domain).
  //
  // If the incoming request already carries an api_key (e.g. from the MCP bridge),
  // honour it instead of injecting the proxy's own key.
  //
  // Per Open311 GeoReport v2 spec:
  //   GET  -> api_key as query parameter
  //   POST -> api_key as form field in the body (application/x-www-form-urlencoded)
  // Query api_key for POST remains a backward-compatible fallback only and is
  // moved into the body before forwarding to Drupal.
  let injectApiKeyInBody = false;
  let resolvedApiKey: string | null = null;
  let requireGeoReportWriteApiKey = false;
  let shouldStripApiKeyFromBody = false;
  let shouldStripApiKeyFromQuery = false;
  // Track whether we skipped api_key injection because a session cookie was present.
  // Used below to trigger a fallback retry when the response looks anonymous.
  let usedSessionAuth = false;
  if (cleanPath.startsWith('georeport/')) {
    const isGeoReportMutation = hasRequestBody(event.method);
    const isGeoReportWrite = isGeoReportWriteMethod(event.method);
    const hasSession = hasValidDrupalSession(event);
    const geoReportApiKey = process.env.GEOREPORT_API_KEY;
    const supportsApiKey = API_KEY_SUPPORTED_PATHS.some(p => matchesGeoReportEndpointPath(cleanPath, p));
    const supportsGeoReportWrite = GEOREPORT_WRITE_SUPPORTED_PATHS.some(p => matchesGeoReportWriteEndpointPath(cleanPath, p));
    const incomingQuery = event.node.req.url?.includes('?') ? event.node.req.url.split('?')[1] : '';
    const incomingApiKey = new URLSearchParams(incomingQuery).get('api_key');

    // Embed pages are always anonymous: ignore leaked session cookies
    const isEmbedContext = isEmbedRequest;

    if (isGeoReportWrite && !allowGeoreportPost) {
      const error = createSafeError({
        statusCode: 405,
        message: 'Write requests are not allowed for georeport endpoints'
      });
      const xmlError = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        error.statusCode || 405,
        error.data,
        error.message || 'Write requests are not allowed for georeport endpoints'
      );
      if (xmlError !== undefined) {
        return xmlError;
      }
      throw error;
    }

    if (isGeoReportMutation && !isGeoReportWrite) {
      const error = createSafeError({
        statusCode: 405,
        message: 'Only POST is allowed for GeoReport write requests'
      });
      const xmlError = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        error.statusCode || 405,
        error.data,
        error.message || 'Only POST is allowed for GeoReport write requests'
      );
      if (xmlError !== undefined) {
        return xmlError;
      }
      throw error;
    }

    if (isGeoReportWrite && !supportsGeoReportWrite) {
      const error = createSafeError({
        statusCode: 405,
        message: 'Write requests are not allowed for this georeport endpoint'
      });
      const xmlError = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        error.statusCode || 405,
        error.data,
        error.message || 'Write requests are not allowed for this georeport endpoint'
      );
      if (xmlError !== undefined) {
        return xmlError;
      }
      throw error;
    }

    if (hasSession && !isEmbedContext) {
      usedSessionAuth = true;
      shouldStripApiKeyFromBody = isGeoReportWrite;
      shouldStripApiKeyFromQuery = true;
      logRequest('GeoReport: using session auth (api_key omitted to preserve user permissions)', { path: cleanPath });
    } else if (supportsApiKey) {
      requireGeoReportWriteApiKey = isGeoReportWrite;
      if (isEmbedContext && hasSession) {
        logRequest('GeoReport: embed context detected, using api_key instead of session', { path: cleanPath });
      }
      if (!isGeoReportWrite) {
        // Safe/read methods send the api_key ADDITIVELY: as a query parameter
        // AND as a request header (injected below). The fleet is heterogeneous:
        // some instances read api_key_get_parameter_name (query), some read
        // api_key_request_header_name (header), and the header name even differs
        // ("api_key" vs "apikey"). Sending both covers every instance without
        // per-tenant config changes and without breaking the legacy query-param
        // instances (München/Bonn/wbd).
        resolvedApiKey = incomingApiKey || geoReportApiKey || null;
        if (incomingApiKey) {
          // Incoming key stays in the forwarded query (not stripped for reads)
          // and is also injected as a header below.
          logRequest('GeoReport GET: using incoming api_key (query + header)', { path: cleanPath });
        } else if (geoReportApiKey) {
          baseUrl.searchParams.append('api_key', geoReportApiKey);
          logRequest('GeoReport GET: proxy api_key added (query param + header)', { path: cleanPath });
        }
      } else {
        // Write methods: api_key belongs in the body for upstream GeoReport.
        // Query-based api_key input is accepted only as a compatibility fallback
        // and moved into the body later after readBody().
        if (incomingApiKey) {
          logRequest('GeoReport write: incoming query api_key will be injected into body', { path: cleanPath });
          injectApiKeyInBody = true;
          resolvedApiKey = incomingApiKey;
        }
      }
    }
  }

  // Handle geocoding requests
  if (cleanPath.startsWith('geocoding/')) {
    baseUrl = await handleGeocodingRequest(event, cleanPath);
  }

  // Handle stats requests
  if (cleanPath.startsWith('stats/')) {
    baseUrl.searchParams.append('_format', 'json');
  }

  // Forward original query parameters (except for geocoding which builds its own)
  // For GeoReport writes, strip api_key from the query - the upstream contract
  // expects it in the request body instead.
  if (!cleanPath.startsWith('geocoding/') && event.node.req.url?.includes('?')) {
    const searchString = event.node.req.url.split('?')[1];
    // Strip api_key from the upstream query only when it must NOT be there:
    // - writes: key goes in the request body (stripped from query)
    // - session auth: key is omitted entirely (shouldStripApiKeyFromQuery)
    // Reads/HEAD KEEP the api_key in the query (additive: query param + header,
    // see below), so legacy instances reading api_key_get_parameter_name keep
    // working alongside instances reading api_key_request_header_name.
    const skipApiKeyInQuery = shouldStripApiKeyFromQuery || (cleanPath.startsWith('georeport/') && isGeoReportWriteMethod(event.method));
    new URLSearchParams(searchString).forEach((value, key) => {
      if (skipApiKeyInQuery && key === 'api_key') return;
      baseUrl.searchParams.append(key, value);
    });
  }

  await assertStatusDefinitionJsonApiAccess(
    event,
    accessPath,
    baseUrl.searchParams,
    targetBase,
    proxyConfig
  );

  await assertUserJsonApiAccess(event, accessPath, baseUrl.searchParams, targetBase, proxyConfig);

  if (
    isManagementFormModeSettingsPath(cleanPath) &&
    !(await hasInternalStatusDefinitionAccess(event, targetBase, proxyConfig))
  ) {
    throw createSafeError({
      statusCode: 403,
      message: 'Authentication required for management form settings',
    });
  }

  await assertServiceRequestPrivateJsonApiAccess(
    event,
    accessPath,
    baseUrl.searchParams,
    targetBase,
    proxyConfig
  );

  deleteRequestHeaders(headers, BODY_TRANSPORT_REQUEST_HEADERS);

  // Inject GeoReport api_key ALSO as a request header (additive to the query
  // parameter set above). services_api_key_auth reads either the header named by
  // api_key_request_header_name OR the query param named by api_key_get_parameter_name,
  // and which one is configured differs per instance — so we send both.
  // resolvedApiKey may be an incoming client key or the proxy env key — both
  // are sent as a header for GET/HEAD so Drupal can authenticate the request
  // and return extension properties (status_descriptive_name, status_hex, etc.).
  if (cleanPath.startsWith('georeport/') && !usedSessionAuth && !isGeoReportWriteMethod(event.method)) {
    const apiKeyForHeader = resolvedApiKey || process.env.GEOREPORT_API_KEY || null;
    if (apiKeyForHeader && !headers['api_key']) {
      headers['api_key'] = apiKeyForHeader;
    }
  }

  // Abort upstream request on client disconnect
  const abortController = new AbortController();
  event.node.req.on('close', () => {
    if (event.node.req.destroyed || !event.node.res.writableEnded) {
      logRequest('Client disconnected, aborting upstream request', {});
      abortController.abort();
    }
  });

  try {
    // Handle request body for non-GET requests
    let body: Buffer | Record<string, unknown> | string | undefined;

    if (hasRequestBody(event.method)) {
      if (requireGeoReportWriteApiKey) {
        assertGeoReportWriteBodySize(event);
      }

      if (requireGeoReportWriteApiKey && isRawUploadContentType(headers['content-type'])) {
        throw createSafeError({
          statusCode: 415,
          message: 'Binary uploads are not allowed for anonymous GeoReport writes',
        });
      }

      if (isVisionRequest && isRawUploadContentType(headers['content-type'])) {
        throw createSafeError({
          statusCode: 415,
          message: 'Binary uploads are not allowed for Vision analysis',
        });
      }

      if (isMultipartFormDataContentType(headers['content-type']) && !isTenantSettingsLogoUploadPath(cleanPath)) {
        throw createSafeError({
          statusCode: 415,
          message: 'Multipart uploads are only allowed for tenant logo uploads',
        });
      }

      if (isRawUploadContentType(headers['content-type'])) {
        const maxSize = isMultipartFormDataContentType(headers['content-type'])
          ? LOGO_UPLOAD_MAX_BODY_BYTES
          : parseInt(process.env.MAX_UPLOAD_SIZE || '104857600'); // 100MB
        body = await readRawUploadBody(event, maxSize, abortController.signal);
        logRequest('File upload buffered:', { size: body.length });
      } else if (requireGeoReportWriteApiKey) {
        body = await readLimitedGeoReportRequestBody(event, GEOREPORT_MAX_WRITE_BODY_BYTES);
        logRequest('GeoReport request body read with size guard:', { size: typeof body === 'string' ? body.length : undefined });
      } else {
        body = await readBody(event);
        logRequest('Request body:', { size: typeof body === 'string' ? body.length : undefined });
      }

      if (shouldStripApiKeyFromBody) {
        const hadBodyApiKey = !!getGeoReportApiKeyFromBody(body);
        body = stripGeoReportApiKeyFromBody(body);
        if (hadBodyApiKey) {
          logRequest('GeoReport write: stripped body api_key to preserve session auth', { path: cleanPath });
        }
      }

      if (isServiceRequestJsonApiPath(accessPath) && stripDisabledServiceRequestWriteAttributes(body)) {
        logRequest('JSON:API service request write: stripped disabled attributes', { path: cleanPath });
      }

      const bodyApiKey = getGeoReportApiKeyFromBody(body);

      if (requireGeoReportWriteApiKey && !bodyApiKey && !resolvedApiKey) {
        throw createSafeError({
          statusCode: 401,
          message: 'API key required for GeoReport write requests'
        });
      }

      // GeoReport writes: move legacy query api_key into the body so Drupal
      // receives the spec-aligned body parameter instead of query auth.
      if (injectApiKeyInBody && resolvedApiKey && !(body instanceof Buffer)) {
        const apiKeyValue = resolvedApiKey;
        if (typeof body === 'string') {
          // Form-encoded string: append api_key if not already present
          if (!bodyApiKey) {
            body = body ? `${body}&api_key=${encodeURIComponent(apiKeyValue)}` : `api_key=${encodeURIComponent(apiKeyValue)}`;
          }
        } else if (typeof body === 'object' && body !== null) {
          // JSON/object body: add api_key field if not present
          if (!('api_key' in body)) {
            (body as Record<string, unknown>).api_key = apiKeyValue;
          }
        } else if (body === undefined) {
          body = `api_key=${encodeURIComponent(apiKeyValue)}`;
        }
        logRequest('GeoReport write: api_key injected into body', { path: cleanPath });
      }
    }

    // Log request details
    if (cleanPath.startsWith('geocoding/')) {
      logGeocoding('Request details', {
        path: cleanPath,
        query: Object.fromEntries(baseUrl.searchParams),
        targetUrl: baseUrl.href
      });
    } else {
      logRequest('Request details:', { method: event.method, targetUrl: redactApiKeyFromUrl(baseUrl.href) });
    }

    // JSON:API path rewriting (randomized prefix)
    if (cleanPath.startsWith('jsonapi/')) {
      const privateConfig = ((config as Record<string, unknown>).private ?? {}) as Record<string, unknown>;
      let randomizedPath = process.env.JSONAPI_RANDOM_PATH
        || (privateConfig.jsonapiRandomPath as string)
        || 'jsonapi';

      if (typeof randomizedPath === 'string') {
        randomizedPath = randomizedPath.replace(/^["'](.*)["']$/, '$1');
      }

      if (randomizedPath !== 'jsonapi') {
        const originalPath = baseUrl.pathname;
        const newPath = originalPath.replace(/\/jsonapi\//, `/${randomizedPath}/`);
        baseUrl.pathname = newPath;
        logRequest('Rewriting JSON API path:', { original: originalPath, rewritten: newPath });
      }
    }

    // Make the upstream request
    let response: unknown;
    const responseHeaders: Record<string, string[]> = {};
    let upstreamContentType: string | null = null;

    try {
      if (cleanPath.startsWith('geocoding/')) {
        logGeocoding('Final request URL', { url: baseUrl.href, params: Object.fromEntries(baseUrl.searchParams) });
      } else {
        logRequest('About to fetch URL:', { url: redactApiKeyFromUrl(baseUrl.href) });
      }

      const rejectUnauthorized = (proxyConfig.rejectUnauthorized as boolean) ?? true;
      response = await $fetch(baseUrl.href, {
        method: event.method,
        headers,
        body,
        agent: new Agent({ rejectUnauthorized }),
        dispatcher: new UndiciAgent({ connect: { rejectUnauthorized } }),
        timeout: ((proxyConfig.timeoutSeconds as number) ?? 30) * 1000,
        onResponse({ response: fetchResponse }) {
          const setCookies = fetchResponse.headers.getSetCookie?.() ||
            (fetchResponse.headers as unknown as { raw?: () => Record<string, string[]> }).raw?.()?.['set-cookie'] || [];
          if (setCookies.length > 0) {
            responseHeaders['set-cookie'] = setCookies;
          }
          upstreamContentType = fetchResponse.headers?.get?.('content-type') ?? null;
        }
      });
      logRequest('Fetch operation completed successfully', {});
    } catch (caught: unknown) {
      const fetchError = caught as ProxyFetchError;

      // Auth endpoint 404: return safe default instead of propagating
      if (cleanPath.startsWith('api/auth/') && (fetchError.status === 404 || fetchError.response?.status === 404)) {
        if (cleanPath === 'api/auth/status') {
          return { authenticated: false };
        }
        event.node.res.statusCode = 404;
        return { authenticated: false, error: 'auth_endpoint_not_available' };
      }

      // 404: pass through quietly without ERROR logging.
      // Many resources are optional (e.g. taxonomy vocabularies that may not exist
      // or may be disabled in jsonapi_extras). Callers handle 404 gracefully.
      const is404 = fetchError.status === 404 || fetchError.response?.status === 404;
      if (is404) {
        event.node.res.statusCode = 404;
        const body = fetchError.response?._data || fetchError.data || { statusCode: 404, message: 'Not Found' };
        const xmlBody = formatGeoReportXmlErrorResponse(
          event,
          cleanPath,
          404,
          body,
          'Not Found',
          fetchError.response?.headers?.get?.('content-type') ?? null
        );
        if (xmlBody !== undefined) {
          return xmlBody;
        }
        return typeof body === 'string' ? { statusCode: 404, message: body } : body;
      }

      // Safe URL for logging (redact api_key)
      const safeUrl = new URL(baseUrl.href);
      if (safeUrl.searchParams.has('api_key')) {
        safeUrl.searchParams.set('api_key', '[REDACTED]');
      }

      logRequest('Error during fetch operation:', {
        message: redactApiKeys(fetchError.message || ''),
        status: fetchError.status ?? 'N/A',
        code: fetchError.code,
        type: fetchError.type,
        errno: fetchError.errno,
        url: safeUrl.toString(),
        method: event.method,
        body: fetchError.body ? 'present' : 'empty',
        stack: fetchError.stack ? redactApiKeys(fetchError.stack) : undefined
      });

      if (fetchError.code === 'ECONNREFUSED') {
        console.error(`Connection refused to ${baseUrl.hostname}:${baseUrl.port || '80/443'}`);
      } else if (fetchError.code === 'ETIMEDOUT') {
        console.error(`Connection timed out to ${redactApiKeyFromUrl(baseUrl.href)}`);
      } else if (fetchError.name === 'FetchError') {
        console.error('FetchError type:', fetchError.type);
      }

      const statusCode = (fetchError.status || fetchError.statusCode || fetchError.response?.status || 500) as number;

      // Pass-through for specific status codes
      const passThrough = handlePassThroughErrors(event, fetchError, statusCode, cleanPath);
      if (passThrough !== undefined) return passThrough;

      // Map error codes to status + message
      let finalStatus = statusCode;
      let errorMessage = 'External API request failed';

      if (fetchError.code === 'ECONNREFUSED') {
        finalStatus = 502;
        errorMessage = 'Backend connection refused: The service is currently unavailable';
      } else if (fetchError.code === 'ETIMEDOUT' || fetchError.type === 'request-timeout') {
        finalStatus = 504;
        errorMessage = 'Backend timeout: The request took too long to process';
      } else if (fetchError.message?.includes('CSRF token')) {
        finalStatus = 403;
        errorMessage = 'Authentication error: CSRF token validation failed';
      } else if (fetchError.status === 503) {
        finalStatus = 503;
        errorMessage = 'Backend service unavailable: The requested service is temporarily unavailable';
      } else {
        errorMessage = `Request failed with status ${fetchError.status || 'unknown'}`;
      }

      const sanitizedData = sanitizeErrorData(
        fetchError.data ?? errorMessage
      );

      event.node.res.statusCode = finalStatus;

      const xmlError = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        finalStatus,
        sanitizedData,
        errorMessage
      );
      if (xmlError !== undefined) {
        return xmlError;
      }

      if (finalStatus === 400 || finalStatus === 422) {
        return sanitizedData;
      }

      throw createSafeError({ statusCode: finalStatus, message: errorMessage, data: sanitizedData });
    }

    logRequest('Response received:', { status: (response as Record<string, unknown>)?.status, type: typeof response });

    // Transform geocoding responses
    if (cleanPath.startsWith('geocoding/')) {
      const originalUrl = new URL(event.node.req.url!, `http://${event.node.req.headers.host}`);
      return transformGeocodingResponse(response, cleanPath, originalUrl);
    }

    // Transform GeoReport media URLs
    if (cleanPath.startsWith('georeport/')) {
      const safeGeoReportContentType = getSafeGeoReportContentType(cleanPath, upstreamContentType, response);
      const isJsonResponse = safeGeoReportContentType?.startsWith('application/json')
        ?? !cleanPath.toLowerCase().endsWith('.xml');

      logRequest('GeoReport response received', {
        hasRequests: !!(response && typeof response === 'object' && (response as Record<string, unknown>).requests),
        isArray: Array.isArray(response),
        isObject: response && typeof response === 'object',
        upstreamContentType,
        safeGeoReportContentType,
      });

      // Stale session detection: if session cookie was forwarded but response
      // has minimal extended_attributes, the session is expired. Return 401
      // instead of retrying with the platform API key, which would bypass
      // jurisdiction access control (the API key user has cross-tenant access).
      // Only applies to request endpoints (not stats, services, etc.) since
      // those responses never contain extended_attributes.
      const isRequestEndpoint = cleanPath.includes('georeport/v2/requests');
      if (
        isRequestEndpoint &&
        usedSessionAuth &&
        event.method === 'GET' &&
        isJsonResponse &&
        isMinimalExtendedAttributes(response)
      ) {
        logRequest('GeoReport: stale session detected, returning 401', { path: cleanPath });
        event.node.res.statusCode = 401;
        return { error: 'Session expired', message: 'Please log in again.' };
      }

      if (isJsonResponse) {
        response = transformGeoReportMediaUrls(response);
      } else if (safeGeoReportContentType) {
        // XML responses must bypass the JSON-specific media URL transformer and
        // use a safe passthrough content type for Open311 clients.
        event.node.res.setHeader('content-type', safeGeoReportContentType);
      }
    }

    // Forward Set-Cookie headers
    if (responseHeaders['set-cookie']) {
      if (isEmbedRequest) {
        // Only rewrite SameSite=None in embed context where cross-origin cookies are needed.
        // In non-embed contexts, preserve Drupal's default SameSite settings for CSRF protection.
        const rewrittenCookies = responseHeaders['set-cookie'].map(cookie => {
          let rewritten = cookie;

          if (!rewritten.toLowerCase().includes('samesite=none')) {
            rewritten = rewritten.replace(/;\s*SameSite=[^;]+/gi, '; SameSite=None');
            if (!rewritten.toLowerCase().includes('samesite')) {
              rewritten += '; SameSite=None';
            }
          }

          if (!rewritten.toLowerCase().includes('secure')) {
            rewritten += '; Secure';
          }

          return rewritten;
        });

        event.node.res.setHeader('set-cookie', rewrittenCookies);
      } else {
        event.node.res.setHeader('set-cookie', responseHeaders['set-cookie']);
      }
    }

    return response;
  } catch (caught: unknown) {
    const error = caught as ProxyFetchError;

    // 404 in outer catch: pass through quietly (same rationale as inner catch)
    const outerStatus = error.response?.status || error.status || (error as any).statusCode;
    if (outerStatus === 404) {
      event.node.res.statusCode = 404;
      const body = error.response?._data || error.data || { statusCode: 404, message: 'Not Found' };
      const xmlBody = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        404,
        body,
        'Not Found',
        error.response?.headers?.get?.('content-type') ?? null
      );
      if (xmlBody !== undefined) {
        return xmlBody;
      }
      return typeof body === 'string' ? { statusCode: 404, message: body } : body;
    }

    const isGeocodingRequest = cleanPath.startsWith('geocoding/');
    const logFunction = isGeocodingRequest ? logGeocoding : logRequest;

    const safeUrl = new URL(baseUrl.href);
    if (safeUrl.searchParams.has('api_key')) {
      safeUrl.searchParams.set('api_key', '[REDACTED]');
    }

    const errorDetails = {
      message: error.message ? redactApiKeys(error.message) : undefined,
      status: error.response?.status || error.status || 500,
      code: error.code,
      type: error.type,
      data: error.response?._data || error.data,
      url: safeUrl.toString(),
      originalUrl: event.node.req.url,
      path: cleanPath,
      method: event.method,
      headers: Object.keys(headers || {}).reduce<Record<string, unknown>>((acc, key) => {
        if (!['cookie', 'authorization'].includes(key.toLowerCase())) {
          acc[key] = headers[key];
        }
        return acc;
      }, {}),
      stack: error.stack ? redactApiKeys(error.stack) : undefined
    };

    logFunction('API error', errorDetails);

    if (error.code === 'ECONNREFUSED') {
      console.error(`Connection refused to ${baseUrl.hostname}:${baseUrl.port || '80/443'}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`Connection timed out to ${redactApiKeyFromUrl(baseUrl.href)}`);
    } else if (error.name === 'FetchError') {
      console.error('FetchError details:', { type: error.type, errno: error.errno, code: error.code });
    }

    let statusCode = (error.response?.status || error.status || error.statusCode || 500) as number;
    let errorMessage = error.message || 'Unknown error';
    const errorData = error.response?._data || error.data || { message: error.message };

    // Pass-through for specific status codes
    const passThrough = handleOuterPassThrough(event, error, statusCode, errorData, errorMessage, cleanPath);
    if (passThrough !== undefined) return passThrough;

    // Map common error types
    if (error.message?.includes('CSRF token')) {
      statusCode = 403;
      errorMessage = 'Authentication error: CSRF token validation failed';
    } else if (error.message?.includes('timed out') || error.code === 'ETIMEDOUT') {
      statusCode = 504;
      errorMessage = 'Server timeout: The request took too long to process';
    } else if (error.code === 'ECONNREFUSED') {
      statusCode = 502;
      errorMessage = 'Backend connection failed: The service is currently unavailable';
    }

    // 503 pass-through
    if (error.response?.status === 503 || statusCode === 503) {
      event.node.res.statusCode = 503;
      const body = error.response?._data || error.data || { statusCode: 503, message: 'Service Unavailable' };
      const xmlBody = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        503,
        body,
        'Service Unavailable',
        error.response?.headers?.get?.('content-type') ?? null
      );
      if (xmlBody !== undefined) {
        return xmlBody;
      }
      return body;
    }

    const sanitizedData = sanitizeErrorData(errorData);

    const xmlError = formatGeoReportXmlErrorResponse(
      event,
      cleanPath,
      statusCode,
      sanitizedData,
      errorMessage
    );
    if (xmlError !== undefined) {
      return xmlError;
    }

    throw createError({
      statusCode,
      message: errorMessage,
      data: sanitizedData,
    });
  }
});

// ---------------------------------------------------------------------------
// Helpers for pass-through error handling
// ---------------------------------------------------------------------------

/**
 * Handle pass-through for 422, 429, 403, 409 in the inner catch block.
 * Returns the response body if handled, or undefined to continue.
 */
function handlePassThroughErrors(
  event: H3Event,
  fetchError: ProxyFetchError,
  statusCode: number,
  cleanPath: string
): unknown {
  // 422 - Validation errors
  if (fetchError.status === 422) {
    try {
      const validationData = fetchError.response?._data ?? fetchError.response?.data ?? fetchError.data;
      if (validationData) {
        logRequest('Passing through validation error (422):', {
          validationData: String(typeof validationData === 'string' ? validationData : JSON.stringify(validationData)).substring(0, 200)
        });
        const xmlBody = formatGeoReportXmlErrorResponse(
          event,
          cleanPath,
          422,
          validationData,
          'Unprocessable Entity',
          fetchError.response?.headers?.get?.('content-type') ?? null
        );
        if (xmlBody !== undefined) {
          return xmlBody;
        }
        event.node.res.statusCode = 422;
        return validationData;
      }
    } catch (e) {
      console.error('Failed to extract validation data:', e);
    }
  }

  // 429 - Rate limit
  if (fetchError.status === 429) {
    try {
      const rateLimitData = fetchError.response?._data
        ?? fetchError.response?.data
        ?? fetchError.data
        ?? { statusCode: 429, message: fetchError.message || 'Rate limit exceeded' };

      logRequest('Passing through rate limit error (429):', {
        rateLimitData: String(typeof rateLimitData === 'string' ? rateLimitData : JSON.stringify(rateLimitData)).substring(0, 200)
      });
      const xmlBody = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        429,
        rateLimitData,
        fetchError.message || 'Rate limit exceeded',
        fetchError.response?.headers?.get?.('content-type') ?? null
      );
      if (xmlBody !== undefined) {
        return xmlBody;
      }
      event.node.res.statusCode = 429;
      return rateLimitData;
    } catch (e) {
      console.error('Failed to extract rate limit data:', e);
    }
  }

  // 403 - Forbidden
  if (statusCode === 403 || (fetchError.status || fetchError.response?.status) === 403) {
    try {
      const body: unknown = fetchError.response?._data || fetchError.data || { statusCode: 403, message: fetchError.message };
      const upstreamContentType = fetchError.response?.headers?.get?.('content-type') ?? null;
      const xmlBody = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        403,
        body,
        fetchError.message || 'Forbidden',
        upstreamContentType
      );
      if (xmlBody !== undefined) {
        return xmlBody;
      }
      event.node.res.statusCode = 403;
      return normalizeErrorBody(body, 403, 'Access denied', upstreamContentType);
    } catch (e) {
      console.error('Failed to process 403 response:', e);
    }
  }

  // 409 - Conflict
  if ((fetchError.status || fetchError.response?.status) === 409) {
    try {
      let conflictData: unknown = fetchError.response?._data || fetchError.data || { statusCode: 409, message: fetchError.message };
      const xmlBody = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        409,
        conflictData,
        fetchError.message || 'Conflict',
        fetchError.response?.headers?.get?.('content-type') ?? null
      );
      if (xmlBody !== undefined) {
        return xmlBody;
      }
      if (typeof conflictData === 'string') {
        try { conflictData = JSON.parse(conflictData); } catch { /* keep as string */ }
      }
      event.node.res.statusCode = 409;
      return stripSensitive(conflictData);
    } catch (e) {
      console.error('Failed to process conflict (409) response:', e);
    }
  }

  return undefined;
}

/**
 * Handle pass-through for specific status codes in the outer catch block.
 */
function handleOuterPassThrough(
  event: H3Event,
  error: ProxyFetchError,
  statusCode: number,
  errorData: unknown,
  errorMessage: string,
  cleanPath: string
): unknown {
  // 422 - Validation errors
  if (statusCode === 422) {
    logRequest('Validation error (422):', {
      data: typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
    });
    const xmlBody = formatGeoReportXmlErrorResponse(
      event,
      cleanPath,
      422,
      errorData,
      errorMessage,
      error.response?.headers?.get?.('content-type') ?? null
    );
    if (xmlBody !== undefined) {
      return xmlBody;
    }
    event.node.res.statusCode = 422;

    let validationData: unknown = errorData;
    if (typeof errorData === 'string') {
      try { validationData = JSON.parse(errorData); } catch { /* keep string */ }
    }

    if (!validationData || typeof validationData !== 'object') {
      validationData = {
        jsonapi: { version: '1.0' },
        errors: [{
          title: 'Unprocessable Content',
          status: '422',
          detail: errorData || 'Validation failed'
        }]
      };
    }

    return validationData;
  }

  // 429 - Rate limit
  if (statusCode === 429) {
    logRequest('Rate limit error (429):', {
      data: typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
    });
    const xmlBody = formatGeoReportXmlErrorResponse(
      event,
      cleanPath,
      429,
      errorData,
      error.message || 'Rate limit exceeded',
      error.response?.headers?.get?.('content-type') ?? null
    );
    if (xmlBody !== undefined) {
      return xmlBody;
    }
    event.node.res.statusCode = 429;

    let parsed: unknown = errorData;
    if (typeof errorData === 'string') {
      try { parsed = JSON.parse(errorData); } catch { /* keep string */ }
    }
    return parsed || { statusCode: 429, message: error.message || 'Rate limit exceeded' };
  }

  // 403 - Forbidden
  if (statusCode === 403) {
    try {
      const body: unknown = error.response?._data || error.data || { statusCode: 403, message: errorMessage };
      const upstreamContentType = error.response?.headers?.get?.('content-type') ?? null;
      const xmlBody = formatGeoReportXmlErrorResponse(
        event,
        cleanPath,
        403,
        body,
        errorMessage,
        upstreamContentType
      );
      if (xmlBody !== undefined) {
        return xmlBody;
      }
      event.node.res.statusCode = 403;
      return normalizeErrorBody(body, 403, 'Access denied', upstreamContentType);
    } catch (e) {
      console.error('Failed to pass through 403 data:', e);
    }
  }

  return undefined;
}
