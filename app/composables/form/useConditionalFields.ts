/**
 * Composable for generic category-conditional form fields.
 *
 * Replaces hardcoded party/oktoberfest/objectId logic with a config-driven
 * approach. Fields are shown/hidden based on the selected category matching
 * taxonomy term IDs defined in the jurisdiction's conditionalFields config.
 *
 * New conditional fields can be added by:
 * 1. Creating the Drupal field on node.service_request
 * 2. Adding the category mapping in field_nuxt_config JSON
 * No frontend code changes needed.
 */

import type { Ref, ComputedRef } from 'vue';

interface ConditionalFieldEntry {
    categories: number[]
    required?: boolean
    component?: string
    label?: string
}

type ConditionalFieldsConfig = Record<string, ConditionalFieldEntry>;

interface Category {
    id: string
    attributes?: {
        drupal_internal__tid?: number
        name?: string
        [key: string]: any
    }
    [key: string]: any
}

interface UseConditionalFieldsOptions {
    category: Ref<string>
    categories: Ref<Category[]>
}

/**
 * Normalize legacy config format (partyCategories, objectIdCategories, etc.)
 * into the new conditionalFields shape for backward compatibility.
 */
function normalizeLegacyConfig(features: Record<string, any> | undefined): ConditionalFieldsConfig {
    if (!features) return {};
    const result: ConditionalFieldsConfig = {};

    if (features.objectIdCategories?.length) {
        result.field_object_id = {
            categories: features.objectIdCategories.map(Number)
        };
    }

    if (features.partyCategories?.length) {
        result.field_party = {
            categories: features.partyCategories.map(Number)
        };
    }

    if (features.oktoberfestCategories?.length) {
        result.field_oktoberfest = {
            categories: features.oktoberfestCategories.map(Number)
        };
    }

    // field_add_data is shared between objectId and competition categories
    const addDataCategories = [
        ...(features.objectIdCategories || []).map(Number),
        ...(features.competitionCategories || []).map(Number)
    ];
    if (addDataCategories.length) {
        result.field_add_data = {
            categories: [...new Set(addDataCategories)]
        };
    }

    return result;
}

/**
 * Get the default value for a conditional field based on its Drupal field type.
 */
function getDefaultForFieldType(fieldType: string | undefined): any {
    switch (fieldType) {
        case 'string':
        case 'string_long':
            return '';
        case 'boolean':
            return false;
        case 'list_integer':
        case 'list_string':
        case 'integer':
        case 'float':
        case 'decimal':
            return null;
        default:
            return null;
    }
}

export function useConditionalFields(options: UseConditionalFieldsOptions) {
    const { category, categories } = options;
    const { clientConfig } = useMarkASpotConfig();
    const { settings } = useFormSettings();

    // Merge explicit conditionalFields config with legacy fallback
    const conditionalFieldsConfig = computed<ConditionalFieldsConfig>(() => {
        const features = clientConfig.value?.features;
        const explicit = features?.conditionalFields || {};
        const legacy = normalizeLegacyConfig(features as any);

        // Normalize explicit entries: support shorthand [1, 2] as { categories: [1, 2] }
        const normalized: ConditionalFieldsConfig = {};
        for (const [fieldName, entry] of Object.entries(explicit)) {
            if (Array.isArray(entry)) {
                normalized[fieldName] = { categories: entry.map(Number) };
            } else {
                const typedEntry = entry as ConditionalFieldEntry;
                normalized[fieldName] = {
                    ...typedEntry,
                    categories: typedEntry.categories.map(Number)
                };
            }
        }

        // Explicit config overrides legacy
        return { ...legacy, ...normalized };
    });

    // List of all conditional field names
    const conditionalFieldNames = computed(() =>
        Object.keys(conditionalFieldsConfig.value)
    );

    // Reactive state for all conditional field values
    const fieldValues = reactive<Record<string, any>>({});

    // Track which fields have been initialized
    const initializedFields = new Set<string>();

    // Initialize field values when config or settings change
    watch(
        [conditionalFieldsConfig, () => settings.value],
        () => {
            for (const fieldName of conditionalFieldNames.value) {
                if (!initializedFields.has(fieldName)) {
                    const fieldConfig = settings.value?.fields?.[fieldName];
                    const fieldType = (fieldConfig as any)?.field_type;
                    fieldValues[fieldName] = getDefaultForFieldType(fieldType);
                    initializedFields.add(fieldName);
                }
            }
        },
        { immediate: true }
    );

    // Current category's Drupal taxonomy term ID
    const currentTid = computed<number | null>(() => {
        if (!category.value) return null;
        const cat = categories.value.find(c => c.id === category.value);
        return (cat?.attributes as any)?.drupal_internal__tid ?? null;
    });

    // Memoized computed refs for field visibility and required status
    const visibilityCache = new Map<string, ComputedRef<boolean>>();
    const requiredCache = new Map<string, ComputedRef<boolean>>();

    /**
     * Check if a field should be visible for the currently selected category.
     * Returns a memoized computed ref so it can be used reactively in templates.
     */
    const isFieldVisible = (fieldName: string): ComputedRef<boolean> => {
        if (!visibilityCache.has(fieldName)) {
            visibilityCache.set(fieldName, computed(() => {
                const config = conditionalFieldsConfig.value[fieldName];
                if (!config?.categories?.length) return false;
                if (currentTid.value == null) return false;

                // Check API presence
                if (!settings.value?.fields) return false;
                const fieldExists = Object.hasOwn(settings.value.fields, fieldName);
                if (!fieldExists) return false;

                // Check category match
                return config.categories.includes(currentTid.value);
            }));
        }
        return visibilityCache.get(fieldName)!;
    };

    /**
     * Check if a field is required when visible.
     * Uses the config override if set, otherwise falls back to Drupal API.
     */
    const isFieldRequired = (fieldName: string): ComputedRef<boolean> => {
        if (!requiredCache.has(fieldName)) {
            requiredCache.set(fieldName, computed(() => {
                const configEntry = conditionalFieldsConfig.value[fieldName];
                if (configEntry?.required !== undefined) return configEntry.required;

                const fieldConfig = settings.value?.fields?.[fieldName];
                return (fieldConfig as any)?.required ?? false;
            }));
        }
        return requiredCache.get(fieldName)!;
    };

    /**
     * Get the component name for a conditional field.
     * Priority: config component override -> null (let DynamicFieldRenderer resolve)
     */
    const getFieldComponent = (fieldName: string): string | undefined => {
        return conditionalFieldsConfig.value[fieldName]?.component;
    };

    /**
     * Build submission data for visible conditional fields.
     * Only includes fields that are currently visible and have values.
     * Handles boolean -> 0/1 conversion for Drupal.
     */
    const getConditionalFieldsForSubmission = (): Record<string, any> => {
        const data: Record<string, any> = {};
        const tid = currentTid.value;

        for (const [fieldName, config] of Object.entries(conditionalFieldsConfig.value)) {
            // Only include if category matches and field exists in API
            if (tid == null || !config.categories.includes(tid)) continue;
            if (!settings.value?.fields || !Object.hasOwn(settings.value.fields, fieldName)) continue;

            const value = fieldValues[fieldName];
            if (value === undefined || value === null || value === '') continue;

            // Drupal expects 0/1 for boolean fields
            if (typeof value === 'boolean') {
                data[fieldName] = value ? 1 : 0;
            } else {
                data[fieldName] = value;
            }
        }

        return data;
    };

    /**
     * Reset all conditional field values to their defaults.
     */
    const resetConditionalFields = () => {
        for (const fieldName of Object.keys(fieldValues)) {
            const fieldConfig = settings.value?.fields?.[fieldName];
            const fieldType = (fieldConfig as any)?.field_type;
            fieldValues[fieldName] = getDefaultForFieldType(fieldType);
        }
        initializedFields.clear();
    };

    /**
     * Get a snapshot of all conditional field values (for persistence).
     */
    const getConditionalFieldsSnapshot = (): Record<string, any> => {
        return { ...fieldValues };
    };

    /**
     * Restore conditional field values from a snapshot (for persistence).
     */
    const restoreConditionalFields = (snapshot: Record<string, any>) => {
        for (const [key, value] of Object.entries(snapshot)) {
            if (conditionalFieldNames.value.includes(key) || key in fieldValues) {
                fieldValues[key] = value;
            }
        }
    };

    return {
        conditionalFieldsConfig,
        conditionalFieldNames,
        fieldValues,
        currentTid,
        isFieldVisible,
        isFieldRequired,
        getFieldComponent,
        getConditionalFieldsForSubmission,
        resetConditionalFields,
        getConditionalFieldsSnapshot,
        restoreConditionalFields
    };
}
