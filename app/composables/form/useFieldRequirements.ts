// composables/form/useFieldRequirements.ts

/**
 * Composable to provide a unified approach to handling field requirements
 * from API settings with support for client-side overrides.
 */
export const useFieldRequirements = () => {
    const { settings } = useFormSettings();

    /**
   * Get configuration for a specific field from API settings
   * @param fieldName The Drupal field name
   * @returns Computed value containing field configuration or empty object
   */
    const getFieldConfig = (fieldName: string) =>
        computed(() => settings.value?.fields?.[fieldName] || {});

    /**
   * Determine if a field is required based on API settings with optional override
   * @param fieldName The Drupal field name
   * @param override Optional override value that takes precedence over API setting
   * @returns Computed boolean indicating if the field is required
   */
    const isFieldRequired = (fieldName: string, override?: boolean | (() => boolean)) =>
        computed(() => {
            // If explicit override is provided, use it
            if (override !== undefined) {
                return typeof override === 'function' ? override() : override;
            }

            // For description/body, set default to true if not specified
            if (fieldName === 'body') {
                const fieldConfig = settings.value?.fields?.[fieldName];
                return fieldConfig?.required ?? true;
            }

            // Otherwise use API setting with fallback to false
            const fieldConfig = settings.value?.fields?.[fieldName];
            return fieldConfig?.required ?? false;
        });

    /**
   * Helper for category-based photo requirements with API fallback
   * @param categoryId Current category ID
   * @param requiredCategories Array of category IDs that require photos
   * @returns Computed boolean indicating if photos are required
   */
    const isPhotoRequiredForCategory = (
        categoryId: number | null | undefined,
        requiredCategories: number[] = []
    ) => computed(() => {
        // Check API field config first (base requirement)
        const mediaFieldConfig = settings.value?.fields?.field_request_media;
        const isRequiredByApi = mediaFieldConfig?.required ?? false;

        // If already required by API, return true
        if (isRequiredByApi) return true;

        // Otherwise check category-specific requirements
        if (categoryId != null && requiredCategories.includes(categoryId)) return true;

        return false;
    });

    /**
   * Helper for category-based email requirements with API fallback
   * @param categoryId Current category ID
   * @param requiredCategories Array of category IDs that require email
   * @returns Computed boolean indicating if email is required
   */
    const isEmailRequiredForCategory = (
        categoryId: number | null | undefined,
        requiredCategories: number[] = []
    ) => computed(() => {
        // Check API field config first (base requirement)
        const emailFieldConfig = settings.value?.fields?.field_e_mail;
        const isRequiredByApi = emailFieldConfig?.required ?? false;

        // If already required by API, return true
        if (isRequiredByApi) return true;

        // Otherwise check category-specific requirements
        if (categoryId != null && requiredCategories.includes(categoryId)) return true;

        return false;
    });

    return {
        getFieldConfig,
        isFieldRequired,
        isPhotoRequiredForCategory,
        isEmailRequiredForCategory
    };
};
