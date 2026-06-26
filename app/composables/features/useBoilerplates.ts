/**
 * Boilerplates Composable
 *
 * Fetches boilerplate text templates from Drupal for use in status notes.
 * Jurisdiction-aware: in multi-tenant setups, filters boilerplates by the
 * current jurisdiction. Falls back to unfiltered fetch in single-tenant mode.
 * Locale-aware: refetches when language changes.
 */
import { useApiClient } from '../api/useApiClient';
import { getPlainText } from '~/utils/drupalText';

export interface Boilerplate {
    uuid: string
    id: string
    title: string
    body?: string
    type?: string
    // Organisation UUIDs this boilerplate is scoped to. Empty = visible to all.
    organisationIds?: string[]
}

type OrganisationScopeInput = string | string[] | null | undefined;
export type BoilerplateTypeValue = string | string[] | null | undefined;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOILERPLATE_PAGE_LIMIT = 50;
const BOILERPLATE_MAX_PAGES = 20;

const normalizeBoilerplateOrganisationScope = (organisationIds: OrganisationScopeInput): string[] => {
    if (!organisationIds) return [];
    const ids = Array.isArray(organisationIds) ? organisationIds : [organisationIds];
    return ids
        .map(id => typeof id === 'string' ? id.trim() : '')
        .filter(id => uuidPattern.test(id));
};

export const normalizeBoilerplateType = (value: BoilerplateTypeValue): string => {
    const rawValue = Array.isArray(value) ? value[0] : value;
    if (typeof rawValue !== 'string') return 'status_notes';
    const normalized = rawValue.trim();
    return normalized || 'status_notes';
};

export const isBoilerplateAvailableForOrganisations = (
    boilerplate: Pick<Boilerplate, 'organisationIds'>,
    organisationIds: OrganisationScopeInput
): boolean => {
    const activeOrganisationIds = normalizeBoilerplateOrganisationScope(organisationIds);
    if (activeOrganisationIds.length === 0) return true;

    if (!boilerplate.organisationIds || boilerplate.organisationIds.length === 0) return true;

    return boilerplate.organisationIds.some(id => activeOrganisationIds.includes(id));
};

interface JsonApiBoilerplateItem {
    id: string
    type: string
    attributes: {
        drupal_internal__nid: number
        title: string
        body?: {
            value: string
            format: string
            processed?: string
        }
        field_boilerplate_type?: BoilerplateTypeValue
    }
    relationships?: {
        field_organisation?: {
            data?: Array<{ type: string, id: string, meta?: { drupal_internal__target_id?: number } }> | null
        }
    }
}

interface JsonApiBoilerplateResponse {
    data: JsonApiBoilerplateItem[]
    links?: {
        next?: {
            href?: string
        }
    }
}

// Generation counter to discard stale fetch results when locale/jurisdiction changes mid-flight.
let fetchGeneration = 0;

export const useBoilerplates = () => {
    const api = useApiClient();
    const { locale } = useI18n();
    const { currentJurisdictionId, taxonomyJurisdictionId, jurisdiction } = useMarkASpotConfig();
    const { public: { fastmap: isFastmap } } = useRuntimeConfig();

    // Root-resolved jurisdiction ID for filtering.
    // Child jurisdictions inherit the root's boilerplate catalog.
    const effectiveJurisdictionId = computed(() => {
        if (taxonomyJurisdictionId.value) {
            return String(taxonomyJurisdictionId.value);
        }
        if (isFastmap) {
            return currentJurisdictionId.value;
        }
        if (jurisdiction.value?.id) {
            return String(jurisdiction.value.id);
        }
        return currentJurisdictionId.value;
    });

    // Use useState for shared state across components
    const boilerplates = useState<Boilerplate[]>('boilerplates', () => []);
    const loadedJurisdictionId = useState<string>('boilerplates_loaded_jur', () => '');
    const loadedLocale = useState<string>('boilerplates_loaded_locale', () => '');
    const loading = useState<boolean>('boilerplates_loading', () => false);
    const error = useState<string | null>('boilerplates_error', () => null);

    /**
     * Fetch boilerplate nodes from Drupal, filtered by jurisdiction when available.
     */
    const fetchBoilerplates = async (forceRefresh = false) => {
        const currentJur = effectiveJurisdictionId.value || 'default';

        // Skip if already loaded for the same jurisdiction AND locale (unless force refresh)
        if (boilerplates.value.length > 0 && loadedJurisdictionId.value === currentJur && loadedLocale.value === locale.value && !forceRefresh) {
            return boilerplates.value;
        }

        // Capture generation so we can discard results if locale/jurisdiction changed mid-flight
        const myGeneration = ++fetchGeneration;

        loading.value = true;
        error.value = null;

        try {
            const params: Record<string, string> = {
                'sort': 'title',
                'fields[node--boilerplate]': 'title,body,drupal_internal__nid,field_boilerplate_type,field_organisation'
            };

            // Filter by jurisdiction when available (multi-tenant)
            if (effectiveJurisdictionId.value) {
                params['filter[field_jurisdiction.meta.drupal_internal__target_id]'] = effectiveJurisdictionId.value;
            }

            const fetchAllBoilerplatePages = async (baseParams: Record<string, string>): Promise<JsonApiBoilerplateItem[]> => {
                const items: JsonApiBoilerplateItem[] = [];

                for (let page = 0; page < BOILERPLATE_MAX_PAGES; page++) {
                    const pageParams: Record<string, string> = {
                        ...baseParams,
                        'page[limit]': String(BOILERPLATE_PAGE_LIMIT)
                    };
                    if (page > 0) {
                        pageParams['page[offset]'] = String(page * BOILERPLATE_PAGE_LIMIT);
                    }

                    const pageResponse = await api.get<JsonApiBoilerplateResponse>(
                        '/jsonapi/node/boilerplate',
                        pageParams
                    );

                    items.push(...pageResponse.data);
                    if (!pageResponse.links?.next?.href || pageResponse.data.length === 0) {
                        break;
                    }
                }

                return items;
            };

            let items = await fetchAllBoilerplatePages(params);

            // Fallback: if jurisdiction filter returned empty, fetch without filter.
            // This handles boilerplates that have no field_jurisdiction assigned.
            if (items.length === 0 && effectiveJurisdictionId.value) {
                const fallbackParams = { ...params };
                delete fallbackParams['filter[field_jurisdiction.meta.drupal_internal__target_id]'];
                items = await fetchAllBoilerplatePages(fallbackParams);
            }

            // Discard results if a newer fetch was started
            if (myGeneration !== fetchGeneration) {
                console.log(`[Boilerplates] Discarding stale fetch (generation ${myGeneration}, current ${fetchGeneration})`);
                return [];
            }

            boilerplates.value = items.map(item => ({
                uuid: item.id,
                id: String(item.attributes.drupal_internal__nid),
                title: item.attributes.title,
                body: getPlainText(item.attributes.body),
                type: normalizeBoilerplateType(item.attributes.field_boilerplate_type),
                organisationIds: item.relationships?.field_organisation?.data?.map(rel => rel.id) ?? []
            }));

            loadedJurisdictionId.value = currentJur;
            loadedLocale.value = locale.value;
            return boilerplates.value;
        } catch (e) {
            if (myGeneration === fetchGeneration) {
                error.value = e instanceof Error ? e.message : 'Failed to load boilerplates';
            }
            console.error('[Boilerplates] Failed to fetch:', e);
            return [];
        } finally {
            if (myGeneration === fetchGeneration) {
                loading.value = false;
            }
        }
    };

    /**
     * Get boilerplate by UUID
     */
    const getBoilerplate = (uuid: string): Boilerplate | undefined => {
        return boilerplates.value.find(b => b.uuid === uuid);
    };

    /**
     * Get boilerplate options for select component
     */
    const boilerplateOptions = computed(() => {
        return boilerplates.value.map(b => ({
            value: b.uuid,
            label: b.title,
            body: b.body,
            type: b.type,
            organisationIds: b.organisationIds ?? []
        }));
    });

    /**
     * Get boilerplate options filtered by type, and optionally by organisation.
     *
     * Org filter: empty `organisationIds` on a boilerplate means "visible to all".
     * A non-empty set means "restricted to these orgs". Passing `orgId` (or an
     * array) hides restricted boilerplates that don't include a match.
     */
    function getOptionsByType(type: string, orgId?: MaybeRefOrGetter<string | string[] | null | undefined>) {
        return computed(() => {
            const orgValue = orgId ? toValue(orgId) : undefined;
            const rawOrgs = Array.isArray(orgValue)
                ? orgValue.filter(Boolean)
                : (orgValue ? [orgValue] : []);

            return boilerplateOptions.value
                .filter(opt => opt.type === type)
                .filter(opt => isBoilerplateAvailableForOrganisations(opt, rawOrgs));
        });
    }

    /**
     * Clear cached boilerplate state so the next fetch hits the API.
     */
    const clearCache = (): void => {
        boilerplates.value = [];
        loadedJurisdictionId.value = '';
        loadedLocale.value = '';
        console.log('[Boilerplates] Cache cleared');
    };

    // Watch for locale changes and refetch
    watch(locale, async (newLocale, oldLocale) => {
        if (newLocale !== oldLocale) {
            console.log(`[Boilerplates] Locale changed from ${oldLocale} to ${newLocale}`);
            clearCache();
            await fetchBoilerplates(true);
        }
    });

    // Watch for jurisdiction changes and refetch
    watch(effectiveJurisdictionId, async (newJur, oldJur) => {
        if (newJur !== oldJur) {
            console.log(`[Boilerplates] Jurisdiction changed from ${oldJur} to ${newJur}`);
            clearCache();
            await fetchBoilerplates(true);
        }
    });

    return {
        boilerplates: readonly(boilerplates),
        loading: readonly(loading),
        error: readonly(error),
        fetchBoilerplates,
        getBoilerplate,
        boilerplateOptions,
        getOptionsByType,
        clearCache
    };
};
