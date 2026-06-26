/**
 * Sublocalities Composable
 *
 * Provides sublocality taxonomy terms for use in service request forms and filters.
 * Sources data from the Settings API (useMarkASpotConfig) instead of making
 * separate JSON:API calls, eliminating duplicate requests.
 *
 * @returns Reactive state and methods for sublocalities functionality
 */

export const useSublocalities = () => {
    const { sublocalities: settingsSublocalities, isReady } = useMarkASpotConfig();

    const loading = computed(() => !isReady.value);

    /**
     * Computed sublocality options for select components.
     *
     * The option value is the term UUID so it matches the relationship id
     * returned by JSON:API on the node resource. See useDistricts for the
     * full reasoning — the same UUID-vs-TID mismatch applies here.
     *
     * Returns flat list sorted by weight and name.
     */
    const sublocalityOptions = computed(() => {
        if (!settingsSublocalities.value?.length) return [];

        // Defensive filter: see useDistricts for the same rationale —
        // older Drupal profiles without the Settings API uuid field
        // would produce `value: undefined` and break the dropdown.
        return [...settingsSublocalities.value]
            .filter(s => s.uuid)
            .sort((a, b) => {
                const weightDiff = (a.weight || 0) - (b.weight || 0);
                return weightDiff !== 0 ? weightDiff : a.name.localeCompare(b.name);
            })
            .map(sublocality => ({
                label: sublocality.name,
                value: sublocality.uuid
            }));
    });

    /**
     * Sublocalities as TaxonomyTerm-like objects for backward compatibility
     */
    const sublocalities = computed(() => {
        if (!settingsSublocalities.value?.length) return [];

        return settingsSublocalities.value.map(s => ({
            id: s.uuid,
            type: 'taxonomy_term--sublocality',
            attributes: {
                name: s.name,
                weight: s.weight,
                drupal_internal__tid: s.tid
            }
        }));
    });

    // No-op for backward compatibility (data is loaded via Settings API)
    const fetchSublocalities = async () => {};
    const clearCache = () => {};

    return {
        sublocalities,
        sublocalityOptions,
        loading,
        error: ref<string | null>(null),
        fetchSublocalities,
        clearCache
    };
};
