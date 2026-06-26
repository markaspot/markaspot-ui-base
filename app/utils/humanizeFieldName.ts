/**
 * Last-resort label fallback for Drupal field machine names.
 *
 * `field_reassign_sp` -> `Reassign Sp`
 *
 * Shared across `DynamicFieldInput` (switch aria-label) and
 * `useDashboardFormSettings.getFieldLabel` (UFormField label) so the two
 * fallback paths cannot diverge for the same field.
 */
export const humanizeFieldName = (name: string): string =>
    name
        .replace(/^field_/, '')
        .split('_')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
