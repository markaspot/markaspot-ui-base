// composables/form/useDynamicFormFields.ts
import { useFormSettings } from './useFormSettings';

// Define the field configuration interface
interface FieldDisplaySettings {
    weight: number
    region: string
    type?: string
    settings?: Record<string, unknown>
}

/**
 * Static component map for standard (non-conditional) fields.
 * Conditional fields use GenericConditionalField by default,
 * or a specific component via the config `component` override.
 */
export const FIELD_COMPONENT_MAP: Record<string, string | null> = {
    // Basic fields
    body: 'BodyField',
    field_category: 'CategoryFieldWrapper',
    field_geolocation: 'LocationInput',
    field_e_mail: 'EmailField',
    field_first_name: 'FirstNameField',
    field_last_name: 'LastNameField',
    field_phone: 'PhoneField',
    field_gdpr: 'GdprField',
    field_request_media: 'MediaUploadField',

    // Backend-only fields to exclude.
    //
    // `field_address` is derived from `field_geolocation` via reverse
    // geocoding (see LocationInput.vue) and submitted straight to Drupal
    // on behalf of the reporter. It has no citizen-facing renderer — not
    // in classic mode, not in facility mode. The explicit `null` mapping
    // is the single source of truth; the `excludeFields` list in the
    // report forms is belt-and-suspenders so an accidental widget
    // registration never leaks an editable address input above the
    // facility selector. See issue #363.
    field_address: null,

    // Special AI/Vision UI components
    field_ai_status: 'AIProcessingStatus',

    // Legacy specialized components (available via conditionalFields.component override)
    ObjectIdField: 'ObjectIdField',
    PartySelect: 'PartySelect',
    OktoberfestSelect: 'OktoberfestSelect',
    AddDataField: 'AddDataField'
};

/**
 * Resolve the component name for a field.
 * Priority: static map -> conditional config component override -> GenericConditionalField fallback
 */
export function resolveFieldComponent(
    fieldName: string,
    conditionalFieldsConfig?: Record<string, any>
): string | null {
    // 1. Check static component map (standard fields)
    if (fieldName in FIELD_COMPONENT_MAP) {
        return FIELD_COMPONENT_MAP[fieldName];
    }

    // 2. Check conditional field config for component override
    const condConfig = conditionalFieldsConfig?.[fieldName];
    if (condConfig?.component) {
        return condConfig.component;
    }

    // 3. If it's a known conditional field, use the generic renderer
    if (condConfig) {
        return 'GenericConditionalField';
    }

    // 4. Unknown field - skip (no static mapping, no conditional config)
    return null;
}

export const useDynamicFormFields = () => {
    const { settings } = useFormSettings();
    const { clientConfig } = useMarkASpotConfig();

    /**
     * Get fields sorted by their display weight.
     * Now uses resolveFieldComponent to support conditional + generic fields.
     */
    const sortedFields = computed(() => {
        if (!settings.value?.fields) return [];

        const condConfig = clientConfig.value?.features?.conditionalFields || {};

        return Object.entries(settings.value.fields)
            .map(([fieldName, fieldConfig]: [string, any]) => ({
                name: fieldName,
                config: fieldConfig,
                weight: fieldConfig.display_settings?.weight ?? 999,
                component: resolveFieldComponent(fieldName, condConfig)
            }))
            .filter((field) => {
                return (field.config as any).display_settings?.region !== 'hidden' &&
                  field.component !== null &&
                  field.component !== undefined;
            })
            .sort((a, b) => a.weight - b.weight);
    });

    /**
     * Get fields by region (content, sidebar, etc.)
     */
    const getFieldsByRegion = (region: string = 'content') => computed(() => {
        return sortedFields.value.filter(field =>
            field.config.display_settings?.region === region
        );
    });

    /**
     * Check if a field should be rendered based on API settings
     */
    const shouldRenderField = (fieldName: string) => computed(() => {
        if (!settings.value?.fields) return false;
        const fieldConfig = settings.value.fields[fieldName];
        return fieldConfig && (fieldConfig as any).display_settings?.region !== 'hidden';
    });

    /**
     * Get field configuration
     */
    const getFieldConfig = (fieldName: string) => computed(() => {
        return settings.value?.fields?.[fieldName] || null;
    });

    /**
     * Get the component name for a field
     */
    const getFieldComponent = (fieldName: string) => {
        const condConfig = clientConfig.value?.features?.conditionalFields || {};
        return resolveFieldComponent(fieldName, condConfig);
    };

    return {
        sortedFields,
        getFieldsByRegion,
        shouldRenderField,
        getFieldConfig,
        getFieldComponent,
        FIELD_COMPONENT_MAP
    };
};
