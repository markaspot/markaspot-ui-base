/**
 * Dashboard Form Settings Composable
 *
 * Wrapper around the form settings store for dashboard/management forms.
 * Fetches the 'management' form mode config which includes all fields
 * for administrative editing (field_organisation, etc.).
 */
import { useFormSettingsStore } from '~/stores/formSettings';
import { humanizeFieldName } from '~/utils/humanizeFieldName';

// Fields that must not fall through the generic dashboard fallback renderer.
// `field_priority` has a dedicated checkbox in the status/actions card.
// `field_escalation` is backend workflow state surfaced via badge/modal, not
// as a raw editable field input in the dashboard form.
export const DASHBOARD_EXPLICITLY_RENDERED_FIELDS = ['field_priority'] as const;
export const DASHBOARD_BACKEND_WORKFLOW_FIELDS = ['field_escalation'] as const;

const DASHBOARD_DYNAMIC_FALLBACK_EXCLUSIONS = new Set<string>([
    ...DASHBOARD_EXPLICITLY_RENDERED_FIELDS,
    ...DASHBOARD_BACKEND_WORKFLOW_FIELDS
]);

export type DashboardFormFieldMap = Record<string, {
    label?: string
    field_type?: string
    display_settings?: {
        weight?: number
        region?: string
    }
    settings?: {
        target_type?: string
        allowed_values?: Record<string, string> | Array<{ value: string | number, label: string }>
    }
} | undefined>;

export type DashboardFormFieldGroupMap = Record<string, {
    id?: string
    region?: string
    parent?: string | null
    children?: string[]
} | undefined>;

export const isDashboardDynamicFallbackField = (fieldName: string): boolean => {
    return !DASHBOARD_DYNAMIC_FALLBACK_EXCLUSIONS.has(fieldName);
};

export const isFieldGroupVisibleInFormMode = (
    groupId: string,
    fieldGroups: DashboardFormFieldGroupMap,
    visited = new Set<string>()
): boolean => {
    const group = fieldGroups[groupId];
    if (!group) return true;
    if (visited.has(groupId)) return true;
    if (group.region === 'hidden') return false;

    const parentId = group.parent || '';
    if (!parentId) return true;

    visited.add(groupId);
    return isFieldGroupVisibleInFormMode(parentId, fieldGroups, visited);
};

const getFieldContainerGroupIds = (
    fieldName: string,
    fieldGroups: DashboardFormFieldGroupMap
): string[] => {
    return Object.entries(fieldGroups)
        .filter(([, group]) => group?.children?.includes(fieldName))
        .map(([groupId]) => groupId);
};

export const isFieldVisibleInFormMode = (
    fieldName: string,
    fields: DashboardFormFieldMap | null | undefined,
    fieldGroups: DashboardFormFieldGroupMap | null | undefined = {}
): boolean => {
    const field = fields?.[fieldName];
    if (!field) return false;
    if (field.display_settings?.region === 'hidden') return false;

    const groups = fieldGroups || {};
    const containerGroupIds = getFieldContainerGroupIds(fieldName, groups);
    if (!containerGroupIds.length) return true;

    return containerGroupIds.some(groupId => isFieldGroupVisibleInFormMode(groupId, groups));
};

export const useDashboardFormSettings = () => {
    const store = useFormSettingsStore();
    const { t, te } = useI18n();

    // Computed refs for reactivity
    const settings = computed(() => store.managementFormMode);
    const loading = computed(() => store.isLoading('node.service_request.management'));
    const error = computed(() => store.errors['node.service_request.management'] || null);
    const fields = computed(() => store.managementFields);
    const fieldGroups = computed(() => store.managementFieldGroups);

    /**
     * Fetch settings (uses cached if available)
     */
    const fetchSettings = async (forceRefresh = false) => {
        if (forceRefresh) {
            store.clearCache('node.service_request.management');
        }
        return store.fetchManagementFormMode();
    };

    /**
     * Find the root accordion/tabs container
     */
    const rootTabsGroup = computed(() => {
        return Object.values(fieldGroups.value).find(g => g.type === 'tabs' && !g.parent) || null;
    });

    /**
     * Get accordion sections (children of root tabs group)
     */
    const accordionSections = computed(() => {
        const root = rootTabsGroup.value;
        if (!root) return [];

        return root.children
            .map(childId => fieldGroups.value[childId])
            .filter(Boolean)
            .sort((a, b) => a.weight - b.weight);
    });

    /**
     * Get fields for a specific group
     */
    const getGroupFields = (groupId: string) => {
        const group = fieldGroups.value[groupId];
        if (!group || !isFieldGroupVisibleInFormMode(groupId, fieldGroups.value)) return [];

        return group.children
            .filter(childId => isFieldVisible(childId))
            .map(fieldName => ({
                name: fieldName,
                config: fields.value[fieldName]
            }));
    };

    /**
     * Check if a field exists and is visible
     */
    const hasField = (fieldName: string) => computed(() => {
        return isFieldVisibleInFormMode(fieldName, settings.value?.fields, fieldGroups.value);
    });

    /**
     * Reactive visibility check for a field.
     *
     * Returns true only when the field exists in the form mode AND its
     * display region is not 'hidden'. Used by the hardcoded template
     * blocks in DashboardEditForm to honor the Drupal form mode without
     * adopting weight-based reordering.
     */
    const isFieldVisible = (fieldName: string): boolean => {
        return isFieldVisibleInFormMode(fieldName, settings.value?.fields, fieldGroups.value);
    };

    /**
     * Returns true when at least one of the given fields is visible.
     *
     * Used to gate section cards on the dashboard: if every field inside
     * a section is hidden via the management form mode, the section
     * container is skipped so the page does not render an empty card
     * with just a heading.
     */
    const hasAnyVisibleField = (fieldNames: string[]): boolean => {
        return fieldNames.some(name => isFieldVisible(name));
    };

    /**
     * Get field configuration
     */
    const getFieldConfig = (fieldName: string) => computed(() => {
        return settings.value?.fields?.[fieldName] || null;
    });

    /**
     * Check if field is required
     */
    const isFieldRequired = (fieldName: string) => computed(() => {
        return settings.value?.fields?.[fieldName]?.required ?? false;
    });

    /**
     * Get field label (for display).
     *
     * Resolution order:
     *   1. i18n key `dashboard.detail.fields.<fieldName>` (only if translated)
     *   2. Drupal label from form-mode settings
     *   3. Humanized machine name (never raw `field_*`)
     */
    const getFieldLabel = (fieldName: string) => computed(() => {
        const i18nKey = `dashboard.detail.fields.${fieldName}`;
        if (te(i18nKey)) {
            return t(i18nKey);
        }
        const drupalLabel = settings.value?.fields?.[fieldName]?.label;
        if (drupalLabel && drupalLabel.trim().length > 0) {
            return drupalLabel;
        }
        return humanizeFieldName(fieldName);
    });

    /**
     * Check if field is an entity reference (for dynamic select handling)
     */
    const isEntityReference = (fieldName: string) => computed(() => {
        const field = settings.value?.fields?.[fieldName];
        return field?.field_type === 'entity_reference';
    });

    /**
     * Get entity reference target type (group, taxonomy_term, user, etc.)
     */
    const getTargetType = (fieldName: string) => computed(() => {
        const field = settings.value?.fields?.[fieldName];
        return field?.settings?.target_type || null;
    });

    /**
     * Get entity reference target bundles
     */
    const getTargetBundles = (fieldName: string) => computed(() => {
        const field = settings.value?.fields?.[fieldName];
        return field?.settings?.handler_settings?.target_bundles || {};
    });

    /**
     * Whether a field renders as a boolean switch in DynamicFieldInput.
     * Used by wrapper components to surface Drupal `description` text on the
     * UFormField (since USwitch has no placeholder concept).
     *
     * Returns a `ComputedRef<boolean>` for parity with sibling helpers
     * (`isFieldRequired`, `isEntityReference`, `getFieldLabel`).
     */
    const isBooleanField = (fieldName: string) => computed(() => {
        const field = settings.value?.fields?.[fieldName];
        if (!field) return false;
        return field.field_type === 'boolean' || field.widget === 'boolean_checkbox';
    });

    /**
     * Drupal `description` for a field (help text shown under the input).
     * Returns a `ComputedRef<string>` for parity with sibling helpers.
     */
    const getFieldDescription = (fieldName: string) => computed(() => {
        return settings.value?.fields?.[fieldName]?.description ?? '';
    });

    /**
     * Get translated label for a field group
     * Uses i18n key if available, Drupal label as fallback
     */
    const getGroupLabel = (groupId: string): string => {
        const i18nKey = `dashboard.detail.sections.${groupId}`;

        // Try i18n first (allows frontend override)
        if (te(i18nKey)) {
            return t(i18nKey);
        }

        // Fall back to Drupal label
        return fieldGroups.value[groupId]?.label || groupId;
    };

    return {
        // State
        settings,
        loading,
        error,
        fields,
        fieldGroups,

        // Actions
        fetchSettings,

        // Computed
        rootTabsGroup,
        accordionSections,

        // Methods
        getGroupFields,
        hasField,
        isFieldVisible,
        hasAnyVisibleField,
        getFieldConfig,
        isFieldRequired,
        getFieldLabel,
        getFieldDescription,
        getGroupLabel,
        isEntityReference,
        isBooleanField,
        getTargetType,
        getTargetBundles
    };
};
