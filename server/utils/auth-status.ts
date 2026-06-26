/**
 * Shared types and helpers for Drupal's /api/auth/status endpoint.
 *
 * Used by server routes that need to know the current user's Drupal roles
 * and group memberships (export tier gating, group-scoped dashboards, etc.).
 */

export interface AuthStatusGroupRole {
    id?: string
    label?: string
}

export interface AuthStatusGroup {
    id?: string
    uuid?: string
    slug?: string | null
    label?: string
    type?: string
    roles?: AuthStatusGroupRole[]
}

export interface AuthStatusUser {
    uid?: string
    uuid?: string
    name?: string
    email?: string
    roles?: string[]
    groups?: AuthStatusGroup[]
}

export interface AuthStatusResponse {
    authenticated?: boolean
    user?: AuthStatusUser
}

export const INTERNAL_DASHBOARD_ROLES = new Set(['administrator', 'moderator', 'editor', 'editorial_board', 'tenant_admin']);
export const GLOBAL_DASHBOARD_ROLES = new Set(['administrator', 'editorial_board']);
export const ELEVATED_JURISDICTION_ROLES = new Set([
    'jur-admin',
    'jur-editorial',
    'jur-moderator',
    'jur-tenant_admin'
]);

/**
 * Runtime type guard. A forged or malformed response should not crash the
 * caller — instead, treat it as an anonymous user.
 */
export function isValidAuthStatusResponse(data: unknown): data is AuthStatusResponse {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if (typeof obj.authenticated !== 'boolean') return false;
    if (obj.user !== undefined && (typeof obj.user !== 'object' || obj.user === null)) return false;
    if (obj.user) {
        const user = obj.user as Record<string, unknown>;
        if (user.roles !== undefined && !Array.isArray(user.roles)) return false;
        if (user.groups !== undefined && !Array.isArray(user.groups)) return false;
    }
    return true;
}

/**
 * Extract the Drupal roles array from a validated auth/status response.
 * Returns an empty array for unauthenticated responses or missing roles,
 * so callers can always use `.includes()` safely.
 */
export function extractRoles(response: AuthStatusResponse | null | undefined): string[] {
    if (!response?.authenticated || !Array.isArray(response.user?.roles)) return [];
    return response.user.roles.filter((r): r is string => typeof r === 'string');
}

export function hasInternalDashboardRole(roles: readonly string[]): boolean {
    return roles.some(role => INTERNAL_DASHBOARD_ROLES.has(role));
}

export function hasGlobalDashboardRole(roles: readonly string[]): boolean {
    return roles.some(role => GLOBAL_DASHBOARD_ROLES.has(role));
}

export function getAccessibleJurisdictionIds(
    roles: readonly string[],
    groups: readonly AuthStatusGroup[] = []
): Set<string> {
    const hasInternalRole = hasInternalDashboardRole(roles);
    return new Set(
        groups
            .filter(group => group.type === 'jur' && group.id != null)
            .filter(group =>
                (hasInternalRole && (!Array.isArray(group.roles) || group.roles.length === 0)) ||
                (
                    Array.isArray(group.roles) &&
                    group.roles.some(role => role.id && ELEVATED_JURISDICTION_ROLES.has(role.id))
                )
            )
            .map(group => String(group.id))
    );
}

export function canAccessInternalStatusDefinitions(
    roles: readonly string[],
    groups: readonly AuthStatusGroup[] = []
): boolean {
    if (hasInternalDashboardRole(roles)) return true;

    return groups.some(group =>
        group.type === 'jur' &&
        Array.isArray(group.roles) &&
        group.roles.some(role => role.id && ELEVATED_JURISDICTION_ROLES.has(role.id))
    );
}
