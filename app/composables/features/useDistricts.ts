/**
 * Districts Composable
 *
 * Provides district taxonomy terms for use in service request forms and filters.
 * Sources data from the Settings API (useMarkASpotConfig) instead of making
 * separate JSON:API calls, eliminating duplicate requests.
 *
 * @returns Reactive state and methods for districts functionality
 */

export const useDistricts = () => {
    const { districts: settingsDistricts, isReady } = useMarkASpotConfig();

    const loading = computed(() => !isReady.value);

    /**
     * Computed district options for select components.
     *
     * The option value is the term UUID so it matches the relationship id
     * returned by JSON:API on the node resource. Using numeric TIDs here
     * would cause a silent mismatch when the dashboard edit form hydrates
     * formState.field_district from the JSON:API relationship (which is
     * UUID-based) — the USelectMenu would fail to find the preselected
     * value and render its placeholder.
     *
     * Returns flat list sorted by weight and name.
     */
    const districtOptions = computed(() => {
        if (!settingsDistricts.value?.length) return [];

        // Defensive filter: older Drupal profiles that predate the uuid
        // field in loadTaxonomyOptions would emit `value: undefined`,
        // which silently kills the dropdown match. Drop such entries
        // rather than render a broken option list.
        return [...settingsDistricts.value]
            .filter(d => d.uuid)
            .sort((a, b) => {
                const weightDiff = (a.weight || 0) - (b.weight || 0);
                return weightDiff !== 0 ? weightDiff : a.name.localeCompare(b.name);
            })
            .map(district => ({
                label: district.name,
                value: district.uuid
            }));
    });

    /**
     * Districts as TaxonomyTerm-like objects for backward compatibility
     */
    const districts = computed(() => {
        if (!settingsDistricts.value?.length) return [];

        return settingsDistricts.value.map(d => ({
            id: d.uuid,
            type: 'taxonomy_term--district',
            attributes: {
                name: d.name,
                weight: d.weight,
                drupal_internal__tid: d.tid
            }
        }));
    });

    // No-op for backward compatibility (data is loaded via Settings API)
    const fetchDistricts = async () => {};
    const clearCache = () => {};

    return {
        districts,
        districtOptions,
        loading,
        error: ref<string | null>(null),
        fetchDistricts,
        clearCache
    };
};
