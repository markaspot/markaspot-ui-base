/**
 * Categories Composable
 *
 * Manages service categories with filtering, selection, and hierarchical organization.
 * Includes localStorage caching for offline support.
 * Cache is locale-aware to support multilingual taxonomy terms.
 *
 * @param allowParentSelection - Whether to allow selection of parent categories (categories with children)
 * @returns Reactive state and methods for categories functionality
 */

import type { TaxonomyTerm } from '~~/types/category';

// Cache configuration
const STORAGE_KEY_PREFIX = 'categories';
const CACHE_VERSION = import.meta.env.APP_VERSION || '1.0.0';
const CACHE_MAX_AGE = 60 * 60 * 1000; // 1 hour

// Cache structure for localStorage
interface CachedCategories {
    data: TaxonomyTerm[]
    timestamp: number
    version: string
    locale: string
}

// Module-level pending promises per locale+jurisdiction to deduplicate concurrent requests
const pendingFetches = new Map<string, Promise<TaxonomyTerm[] | null>>();

// Generation counter to discard stale fetch results.
// When the locale or jurisdiction changes, the counter increments. Any in-flight
// fetch from a previous generation will see the mismatch and skip writing state.
let fetchGeneration = 0;

export const useCategories = (allowParentSelection: Ref<boolean> | boolean = false, localeOverride?: Ref<string> | string) => {
    const allowParentSelectionRef = isRef(allowParentSelection) ? allowParentSelection : ref(allowParentSelection);
    const api = useApiClient();
    const { locale: i18nLocale } = useI18n();
    const { currentJurisdictionId, taxonomyJurisdictionId, jurisdiction, services } = useMarkASpotConfig();

    // Allow dashboard/admin contexts to override the locale (e.g. jurisdiction's default content language)
    const localeOverrideRef = isRef(localeOverride) ? localeOverride : ref(localeOverride || '');
    const locale = computed(() => localeOverrideRef.value || i18nLocale.value);

    // Root-resolved jurisdiction ID for taxonomy filtering.
    // Child jurisdictions inherit the root's service catalog.
    //
    // Priority:
    // 1. taxonomyJurisdictionId: explicit root-override from config (child jurisdiction inheriting parent catalog)
    // 2. jurisdiction.id from loaded config: the authoritative ID returned by the settings API.
    //    This is crucial for newly provisioned workspaces whose slug is not yet in the
    //    jurisdictions list cache (allowed through by the Settings API probe in jurisdiction
    //    middleware). currentJurisdictionId resolves slugs via getBySlug() which would fall
    //    back to defaultJurisdiction for unknown slugs, causing wrong categories to load.
    // 3. currentJurisdictionId: URL slug / ENV / default resolution (fallback when config
    //    is not yet loaded, e.g., during SSR or initial category fetch before config arrives).
    const { public: { fastmap: isFastmap } } = useRuntimeConfig();

    const effectiveJurisdictionId = computed(() => {
        if (taxonomyJurisdictionId.value) {
            return String(taxonomyJurisdictionId.value);
        }
        // In FastMap mode, skip numeric jurisdiction.id and use the slug
        // from currentJurisdictionId (backend accepts slugs on all endpoints)
        if (isFastmap) {
            return currentJurisdictionId.value;
        }
        if (jurisdiction.value?.id) {
            return String(jurisdiction.value.id);
        }
        return currentJurisdictionId.value;
    });

    // Jurisdiction+locale-aware storage key for localStorage cache
    const storageKey = computed(() => `${STORAGE_KEY_PREFIX}_${locale.value}_jur${effectiveJurisdictionId.value || 'default'}`);

    // Track which jurisdiction and locale the current categories belong to
    const loadedJurisdictionId = useState<string>('categories_loaded_jur', () => '');
    const loadedLocale = useState<string>('categories_loaded_locale', () => '');

    // Use useState for shared state across components
    const categories = useState<TaxonomyTerm[]>('categories_items', () => []);
    const loading = useState<boolean>('categories_loading', () => true);
    const error = useState<string | null>('categories_error', () => null);
    const { isOnline } = useOnlineStatus();

    const isClient = typeof window !== 'undefined';

    const categoryOptions = computed(() => {
        if (!categories.value?.length) return [];

        // Create a map for quick lookups
        const categoryMap = new Map(
            categories.value.map(cat => [cat.id, cat])
        );

        // Create children map
        const childrenMap = new Map<string, TaxonomyTerm[]>();
        categories.value.forEach((cat) => {
            const parentId = cat.relationships?.parent?.data?.[0]?.id;
            if (parentId && parentId !== 'virtual') {
                if (!childrenMap.has(parentId)) {
                    childrenMap.set(parentId, []);
                }
                childrenMap.get(parentId)?.push(cat);
            }
        });

        // Function to recursively build options
        const buildOptions = (cats: TaxonomyTerm[], level = 0): { label: string, value: string, disabled?: boolean }[] => {
            return cats
                .sort((a, b) => {
                    const weightDiff = (a.attributes.weight || 0) - (b.attributes.weight || 0);
                    return weightDiff !== 0 ? weightDiff : a.attributes.name.localeCompare(b.attributes.name);
                })
                .reduce((acc, cat) => {
                    const children = childrenMap.get(cat.id) || [];
                    const hasChildren = children.length > 0;
                    const isParentDisabled = hasChildren && !allowParentSelectionRef.value;

                    acc.push({
                        label: `${'\u2003'.repeat(level)}${cat.attributes.name}`,
                        value: cat.id,
                        disabled: isParentDisabled
                    });

                    acc.push(...buildOptions(children, level + 1));

                    return acc;
                }, [] as { label: string, value: string, disabled?: boolean }[]);
        };

        // Start with root categories
        const rootCategories = categories.value.filter((cat) => {
            const parentId = cat.relationships?.parent?.data?.[0]?.id;
            return !parentId || parentId === 'virtual' || !categoryMap.has(parentId);
        });

        return buildOptions(rootCategories);
    });

    /**
     * Load cached categories from localStorage with version, age, and locale validation
     */
    const loadFromCache = (): boolean => {
        if (!isClient) return false;

        const cached = localStorage.getItem(storageKey.value);
        if (!cached) return false;

        try {
            const parsed: CachedCategories = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;

            // Validate version, age, and locale
            if (parsed.version === CACHE_VERSION && parsed.locale === locale.value && age < CACHE_MAX_AGE) {
                categories.value = parsed.data;
                console.log(`[Categories] Loaded from cache (v${CACHE_VERSION}, locale: ${locale.value}, ${Math.round(age / 60000)}m old, ${parsed.data.length} items)`);
                return true;
            }

            // Cache is stale but still usable when offline (if same locale)
            if (!isOnline.value && parsed.data?.length > 0 && parsed.locale === locale.value) {
                categories.value = parsed.data;
                console.log(`[Categories] Using stale cache while offline (${parsed.data.length} items)`);
                return true;
            }

            const reason = parsed.version !== CACHE_VERSION
                ? `version mismatch (cached: ${parsed.version}, current: ${CACHE_VERSION})`
                : parsed.locale !== locale.value
                    ? `locale mismatch (cached: ${parsed.locale}, current: ${locale.value})`
                    : `expired (${Math.round(age / 60000)}m old)`;
            console.log(`[Categories] Cache invalidated: ${reason}`);
            return false;
        } catch (e) {
            console.warn('[Categories] Failed to parse cache:', e);
            return false;
        }
    };

    /**
     * Save categories to localStorage with version, timestamp, and locale
     */
    const saveToCache = (data: TaxonomyTerm[]): void => {
        if (!isClient) return;

        const cached: CachedCategories = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION,
            locale: locale.value
        };

        try {
            localStorage.setItem(storageKey.value, JSON.stringify(cached));
            console.log(`[Categories] Saved to cache (v${CACHE_VERSION}, locale: ${locale.value}, ${data.length} items)`);
        } catch (e: unknown) {
            if ((e as any)?.name === 'QuotaExceededError' || (e as any)?.code === 22) {
                console.warn('[Categories] Storage quota exceeded');
            } else {
                console.warn('[Categories] Failed to save cache:', e);
            }
        }
    };

    /**
     * Clear the cache for current locale
     */
    const clearCache = (): void => {
        if (!isClient) return;
        localStorage.removeItem(storageKey.value);
        categories.value = [];
        console.log(`[Categories] Cache cleared for locale: ${locale.value}`);
    };

    const fetchCategories = async () => {
        const currentJur = effectiveJurisdictionId.value || 'default';

        // Skip if already loaded in memory for the same jurisdiction AND locale
        if (categories.value.length > 0 && loadedJurisdictionId.value === currentJur && loadedLocale.value === locale.value) {
            loading.value = false;
            return;
        }

        // Jurisdiction changed: clear stale data
        if (loadedJurisdictionId.value && loadedJurisdictionId.value !== currentJur) {
            categories.value = [];
        }

        // Try loading from localStorage cache first
        if (isClient && loadFromCache()) {
            loadedJurisdictionId.value = currentJur;
            loadedLocale.value = locale.value;
            loading.value = false;
            return;
        }

        // If offline and no cache, show error but don't block
        if (!isOnline.value) {
            loading.value = false;
            error.value = 'Categories unavailable offline';
            console.warn('[Categories] Offline with no cache');
            return;
        }

        // Dedup key includes both locale and jurisdiction
        const dedupKey = `${locale.value}_jur${currentJur}`;
        if (pendingFetches.has(dedupKey)) {
            await pendingFetches.get(dedupKey);
            if (categories.value.length > 0) {
                loading.value = false;
                return;
            }
        }

        // Capture generation so we can discard results if locale/jurisdiction changed mid-flight
        const myGeneration = ++fetchGeneration;

        loading.value = true;
        error.value = null;
        const allCategories: TaxonomyTerm[] = [];

        // Create the fetch promise and store it
        const fetchPromise = (async () => {
            try {
                let offset = 0;
                const limit = 50;

                // Build query params with optional jurisdiction filter
                const baseParams: Record<string, string> = {
                    'fields[taxonomy_term--service_category]': 'name,weight,parent,drupal_internal__tid,field_category_icon,field_service_code,field_service_definition',
                    'include': 'parent',
                    'filter[status][value]': '1',
                    'sort': 'name'
                };
                if (effectiveJurisdictionId.value) {
                    baseParams['filter[field_jurisdiction.meta.drupal_internal__target_id]'] = effectiveJurisdictionId.value;
                }

                // Override Accept-Language when a locale override is active
                const requestOptions = localeOverrideRef.value
                    ? { headers: { 'X-Translation-Language': locale.value, 'Accept-Language': locale.value } }
                    : undefined;

                // First page
                let response = await api.get<DrupalJsonApiResponse<TaxonomyTerm[]>>(
                    '/jsonapi/taxonomy_term/service_category',
                    {
                        ...baseParams,
                        'page[offset]': offset.toString(),
                        'page[limit]': limit.toString()
                    },
                    requestOptions
                );

                if (response?.data) {
                    allCategories.push(...(response.data as TaxonomyTerm[]));
                    offset += limit;

                    // Get second page if needed
                    if (response.links?.next) {
                        response = await api.get<DrupalJsonApiResponse<TaxonomyTerm[]>>(
                            '/jsonapi/taxonomy_term/service_category',
                            {
                                ...baseParams,
                                'page[offset]': offset.toString(),
                                'page[limit]': limit.toString()
                            },
                            requestOptions
                        );
                        if (response?.data) {
                            allCategories.push(...(response.data as TaxonomyTerm[]));
                        }
                    }
                }

                // Discard results if a newer fetch was started (locale or jurisdiction changed)
                if (myGeneration !== fetchGeneration) {
                    console.log(`[Categories] Discarding stale fetch (generation ${myGeneration}, current ${fetchGeneration})`);
                    return null;
                }

                // Apply child jurisdiction category restrictions from Settings API.
                // The services array from loadServices() is already filtered by
                // getAllowedCategoryIds() for child jurisdictions.
                const settingsServices = services.value;
                if (settingsServices?.length && allCategories.length > settingsServices.length) {
                    const allowedTids = new Set(settingsServices.map((s: { tid: number }) => s.tid));
                    const filtered = allCategories.filter(cat =>
                        allowedTids.has(cat.attributes.drupal_internal__tid)
                    );
                    console.log(`[Categories] Filtered by jurisdiction allow-list: ${allCategories.length} -> ${filtered.length}`);
                    categories.value = filtered;
                } else {
                    categories.value = allCategories;
                }
                loadedJurisdictionId.value = currentJur;
                loadedLocale.value = locale.value;
                if (categories.value.length > 0) {
                    saveToCache(categories.value);
                }
                return categories.value;
            } catch (e) {
                console.error('[Categories] Failed to fetch:', e);
                // Only set error if this fetch is still current
                if (myGeneration === fetchGeneration) {
                    error.value = e instanceof Error ? e.message : 'Failed to fetch categories';
                }
                return null;
            } finally {
                // Only clear loading if this is still the active fetch
                if (myGeneration === fetchGeneration) {
                    loading.value = false;
                }
                pendingFetches.delete(dedupKey);
            }
        })();

        pendingFetches.set(dedupKey, fetchPromise);
        await fetchPromise;
    };

    // Watch for locale changes and refetch if needed
    watch(locale, async (newLocale, oldLocale) => {
        if (newLocale !== oldLocale) {
            console.log(`[Categories] Locale changed from ${oldLocale} to ${newLocale}`);
            categories.value = [];
            loadedJurisdictionId.value = '';
            loadedLocale.value = '';
            await fetchCategories();
        }
    });

    // Watch for effective jurisdiction changes (root-resolved) and refetch
    watch(effectiveJurisdictionId, async (newJur, oldJur) => {
        if (newJur !== oldJur) {
            console.log(`[Categories] Jurisdiction changed from ${oldJur} to ${newJur}`);
            categories.value = [];
            loadedJurisdictionId.value = '';
            loadedLocale.value = '';
            await fetchCategories();
        }
    });

    return {
        categories,
        categoryOptions,
        loading,
        error,
        fetchCategories,
        clearCache
    };
};
