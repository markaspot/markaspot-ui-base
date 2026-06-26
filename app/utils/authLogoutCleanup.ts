const LOGOUT_SCOPED_STATE_KEYS = [
    'auth-state',
    'jurisdictions-state',
    'jurisdiction-single-tenant',
    'mas-config-state',
    'mas-config-status',
    'mas-config-error',
    'mas-config-jurisdiction-key',
    'organisations-all',
    'organisations-jurisdiction',
    // Platform-admin workspace switcher state: contains the full jurisdiction
    // list including blocked spam workspaces. Must NOT survive logout, since
    // a subsequent non-admin login on the same browser would otherwise have
    // the data hanging in the JS heap, and a subsequent admin login would
    // skip the refetch and serve stale entries.
    'admin-jurisdictions',
    'admin-jurisdictions-loaded'
];

const LOGOUT_SCOPED_STATE_PREFIXES = [
    'dashboard_',
    'dashboard-',
    'dashboard-members-'
];

export const isLogoutScopedStateKey = (key: string): boolean =>
    LOGOUT_SCOPED_STATE_KEYS.includes(key) ||
    LOGOUT_SCOPED_STATE_PREFIXES.some(prefix => key.startsWith(prefix));

export const clearLogoutScopedNuxtState = () => {
    clearNuxtState((key: string) => isLogoutScopedStateKey(key));
};

export const isLogoutScopedStorageKey = (key: string): boolean =>
    key.startsWith('markASpot') ||
    key.startsWith('masConfig-') ||
    key === 'followedReports' ||
    key.startsWith('mas_flagged_') ||
    key.startsWith('emergency-banner-dismissed-');

export const clearLogoutScopedLocalStorage = () => {
    if (typeof localStorage === 'undefined') return;

    Object.keys(localStorage)
        .filter(isLogoutScopedStorageKey)
        .forEach(k => localStorage.removeItem(k));
};
