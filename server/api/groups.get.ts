import { defineEventHandler } from 'h3';
import { Agent } from 'https';
import { hasValidDrupalSession } from '../utils/session';
import { getCanonicalHost, getSessionAwareApiBase } from '../utils/host';

/**
 * Groups API Endpoint
 *
 * Returns the authenticated user's group memberships for dashboard filtering.
 * Proxies the request to Drupal's /api/auth/status endpoint and extracts groups.
 *
 * Response format:
 * {
 *   groups: [
 *     { id: 1, uuid: '...', label: 'Organisation Name', type: 'organisation' },
 *     { id: 2, uuid: '...', label: 'Jurisdiction Name', type: 'jur' }
 *   ]
 * }
 */

interface GroupRole {
  id: string;
  label: string;
}

interface GroupMembership {
  id: number | string;
  uuid: string;
  slug?: string | null;
  label: string;
  type: string;
  roles?: GroupRole[];
}

interface GroupsResponse {
  groups: GroupMembership[];
  error?: string;
}

// Type guard for validating API response shape
interface DrupalAuthStatusResponse {
  authenticated?: boolean;
  user?: {
    groups?: Array<{
      id?: number | string;
      uuid?: string;
      slug?: string | null;
      label?: string;
      type?: string;
      roles?: Array<{ id?: string; label?: string }>;
    }>;
  };
}

function isValidAuthStatusResponse(data: unknown): data is DrupalAuthStatusResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  // authenticated can be true/false or missing
  if (obj.authenticated !== undefined && typeof obj.authenticated !== 'boolean') {
    return false;
  }
  // user must be an object if present
  if (obj.user !== undefined && (typeof obj.user !== 'object' || obj.user === null)) {
    return false;
  }
  return true;
}

function validateAndMapGroup(group: unknown): GroupMembership | null {
  if (typeof group !== 'object' || group === null) {
    return null;
  }
  const g = group as Record<string, unknown>;

  // id is required and must be number or string
  if (g.id === undefined || (typeof g.id !== 'number' && typeof g.id !== 'string')) {
    return null;
  }

  return {
    id: g.id as number | string,
    uuid: typeof g.uuid === 'string' ? g.uuid : '',
    // Mirror the canonical backend slug pattern (JurisdictionIdResolverTrait):
    // strip anything that isn't a well-formed slug so a forged or malformed
    // upstream cannot inject control chars into the path-scope Set lookup.
    slug: typeof g.slug === 'string' && /^[a-z0-9_-]{1,64}$/.test(g.slug) ? g.slug : null,
    label: typeof g.label === 'string' ? g.label : '',
    type: typeof g.type === 'string' ? g.type : 'organisation',
    roles: Array.isArray(g.roles)
      ? g.roles.filter((r): r is { id: string; label: string } =>
          typeof r === 'object' && r !== null && typeof (r as Record<string, unknown>).id === 'string'
        ).map(r => ({ id: r.id, label: typeof r.label === 'string' ? r.label : '' }))
      : []
  };
}

export default defineEventHandler(async (event): Promise<GroupsResponse> => {
  const config = useRuntimeConfig();

  // Check if user has a valid session
  if (!hasValidDrupalSession(event)) {
    // Return empty groups for unauthenticated users
    return { groups: [] };
  }

  try {
    // Get the user's groups from Drupal's auth/status endpoint
    // This endpoint returns all group memberships (organisation + jur)
    const apiBase = getSessionAwareApiBase(
      (config.public.geoReportApiBase || config.public.apiBase) as string,
      event.node.req.headers.host,
      true
    );
    const baseUrl = String(apiBase).replace(/\/+$/, '');

    const statusUrl = `${baseUrl}/api/auth/status`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-Host': getCanonicalHost(event.node.req.headers.host),
    };

    // Forward the session cookie - this is critical!
    if (event.node.req.headers.cookie) {
      headers.cookie = event.node.req.headers.cookie;
    }

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers,
      // @ts-ignore - Node.js specific options
      agent: new Agent({ rejectUnauthorized: config.proxy?.rejectUnauthorized ?? false }),
    });

    if (!response.ok) {
      // 404 is expected when markaspot_passwordless module is not enabled
      if (response.status !== 404) {
        console.error('[groups.get.ts] Auth status returned error:', response.status, response.statusText);
      }
      return { groups: [] };
    }

    const data: unknown = await response.json();

    // Validate response shape
    if (!isValidAuthStatusResponse(data)) {
      console.warn('[groups.get.ts] Invalid auth status response shape:', typeof data);
      return { groups: [], error: 'invalid_response_shape' };
    }

    // Extract groups from the auth status response
    if (data.authenticated && data.user && Array.isArray(data.user.groups)) {
      const validatedGroups = data.user.groups
        .map(validateAndMapGroup)
        .filter((g): g is GroupMembership => g !== null);

      return { groups: validatedGroups };
    }

    return { groups: [] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[groups.get.ts] Error fetching groups:', errorMessage);
    return { groups: [], error: 'fetch_error' };
  }
});
