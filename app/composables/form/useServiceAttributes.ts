/**
 * Composable for Open311 service definition attributes.
 *
 * Parses the field_service_definition JSON from the selected category's
 * taxonomy term and provides reactive attribute values, validation, and
 * submission data. Attributes are the Open311 standard way for categories
 * to define additional metadata fields (e.g. "lamp post number", "surface type").
 *
 * Only attributes with `variable: true` are shown to the user.
 * Supports conditional visibility via `conditions.show_when` (AND logic).
 */

import type { Ref } from 'vue';
import type { TaxonomyTerm, ServiceDefinitionAttribute } from '~~/types/category';

interface UseServiceAttributesOptions {
    category: Ref<string>
    categories: Ref<TaxonomyTerm[]>
}

export function useServiceAttributes(options: UseServiceAttributesOptions) {
    const { category, categories } = options;
    const { t } = useI18n();

    // Reactive store for attribute values, keyed by attribute code
    const attributeValues = reactive<Record<string, any>>({});

    // Parse service definition from selected category
    const serviceDefinition = computed<ServiceDefinitionAttribute[]>(() => {
        if (!category.value) return [];

        const term = categories.value.find(c => c.id === category.value);
        const raw = term?.attributes?.field_service_definition;
        if (!raw) return [];

        // JSON:API returns text_long as { value, format, processed } object
        const json = typeof raw === 'string' ? raw : raw?.value;
        if (!json) return [];

        try {
            const parsed = JSON.parse(json);
            // Accept both { attributes: [...] } wrapper and plain array
            const attrs = Array.isArray(parsed) ? parsed : parsed?.attributes;
            if (!Array.isArray(attrs)) return [];
            return attrs as ServiceDefinitionAttribute[];
        } catch (e) {
            console.warn('[ServiceAttributes] Failed to parse service definition JSON:', e);
            return [];
        }
    });

    /**
     * Evaluate visibility conditions for an attribute.
     * Returns true if the attribute should be shown.
     * Attributes without conditions are always visible.
     */
    const evaluateConditions = (attr: ServiceDefinitionAttribute): boolean => {
        const conditions = attr.conditions?.show_when;
        if (!conditions || conditions.length === 0) return true;

        // All conditions must be true (AND logic)
        return conditions.every((condition) => {
            const depAttr = serviceDefinition.value.find(a => a.code === condition.attribute_code);
            // If referenced attribute doesn't exist, treat as visible (graceful)
            if (!depAttr) return true;

            const currentValue = attributeValues[condition.attribute_code];

            switch (condition.operator) {
                case 'equals':
                    return String(currentValue ?? '') === (condition.value ?? '');
                case 'not_equals':
                    return String(currentValue ?? '') !== (condition.value ?? '');
                case 'contains':
                    return Array.isArray(currentValue) && currentValue.includes(condition.value);
                case 'not_empty':
                    if (currentValue === undefined || currentValue === null || currentValue === '') return false;
                    if (Array.isArray(currentValue) && currentValue.length === 0) return false;
                    return true;
                default:
                    return true;
            }
        });
    };

    // Visible attributes: variable === true, conditions met, sorted by order
    const visibleAttributes = computed<ServiceDefinitionAttribute[]>(() => {
        return serviceDefinition.value
            .filter(attr => attr.variable)
            .filter(attr => evaluateConditions(attr))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    // Whether the selected category has any visible attributes
    const hasAttributes = computed(() => visibleAttributes.value.length > 0);

    // Reset attribute values when category changes
    watch(category, () => {
        // Clear all existing keys by replacing the reactive object's contents
        const existingKeys = Object.keys(attributeValues);
        existingKeys.forEach((key) => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete attributeValues[key];
        });
        // Initialize defaults for new attributes (Phase 2: default_value support)
        for (const attr of serviceDefinition.value.filter(a => a.variable)) {
            if (attr.datatype === 'multivaluelist') {
                const defaultKeys = attr.default_value
                    ? String(attr.default_value).split(',').map(k => k.trim())
                    : [];
                attributeValues[attr.code] = defaultKeys;
            } else {
                attributeValues[attr.code] = attr.default_value ?? '';
            }
        }
    });

    /**
     * Validate attributes. Returns an array of error messages for:
     * - Required attributes with empty values
     * - Attributes failing pattern validation
     * - Attributes failing min/max validation
     * Only validates visible (non-hidden by conditions) attributes.
     */
    const getAttributeErrors = (): Array<{ code: string, message: string }> => {
        const errors: Array<{ code: string, message: string }> = [];

        for (const attr of visibleAttributes.value) {
            const value = attributeValues[attr.code];
            const isEmpty = value === undefined ||
              value === null ||
              value === '' ||
              (Array.isArray(value) && value.length === 0);

            // Required check
            if (attr.required && isEmpty) {
                errors.push({
                    code: attr.code,
                    message: t('errors.validation.required_field', { field: attr.description || attr.code })
                });
                continue;
            }

            // Skip further validation if empty and not required
            if (isEmpty) continue;

            // Validation rules (Phase 3)
            const v = attr.validation;
            if (!v) continue;

            const strValue = String(value);

            // Pattern validation (string/text types)
            if (v.pattern && (attr.datatype === 'string' || attr.datatype === 'text')) {
                try {
                    const regex = new RegExp(v.pattern);
                    if (!regex.test(strValue)) {
                        errors.push({
                            code: attr.code,
                            message: v.pattern_message || t('errors.validation.required_field', { field: attr.description || attr.code })
                        });
                        continue;
                    }
                } catch {
                    // Invalid regex: skip validation silently
                }
            }

            // Min/Max for number
            if (attr.datatype === 'number') {
                const numValue = Number(value);
                if (!Number.isNaN(numValue)) {
                    if (v.min !== undefined && numValue < v.min) {
                        errors.push({
                            code: attr.code,
                            message: v.pattern_message || t('errors.validation.required_field', { field: attr.description || attr.code })
                        });
                        continue;
                    }
                    if (v.max !== undefined && numValue > v.max) {
                        errors.push({
                            code: attr.code,
                            message: v.pattern_message || t('errors.validation.required_field', { field: attr.description || attr.code })
                        });
                        continue;
                    }
                }
            }

            // Min/Max for string length
            if (attr.datatype === 'string' || attr.datatype === 'text') {
                if (v.min !== undefined && strValue.length < v.min) {
                    errors.push({
                        code: attr.code,
                        message: v.pattern_message || t('errors.validation.required_field', { field: attr.description || attr.code })
                    });
                    continue;
                }
                if (v.max !== undefined && strValue.length > v.max) {
                    errors.push({
                        code: attr.code,
                        message: v.pattern_message || t('errors.validation.required_field', { field: attr.description || attr.code })
                    });
                    continue;
                }
            }
        }

        return errors;
    };

    /**
     * Build submission data: only populated attribute values for visible attributes.
     * Hidden (conditional) attributes are excluded.
     */
    const getAttributesForSubmission = (): Record<string, any> => {
        const data: Record<string, any> = {};

        for (const attr of visibleAttributes.value) {
            const value = attributeValues[attr.code];
            if (value === undefined || value === null || value === '') continue;
            if (Array.isArray(value) && value.length === 0) continue;
            data[attr.code] = value;
        }

        return data;
    };

    return {
        attributeValues,
        visibleAttributes,
        hasAttributes,
        getAttributeErrors,
        getAttributesForSubmission
    };
}
