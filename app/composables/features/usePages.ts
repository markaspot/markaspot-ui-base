/**
 * Pages Composable
 *
 * Provides pages functionality for the application.
 * Automatically refetches pages when locale changes.
 * Filters pages by jurisdiction when available (multi-tenant).
 *
 * @returns Reactive state and methods for pages functionality
 */

export const usePages = () => {
    // Global state shared across all instances.
    // Must be initialized inside the composable so Nuxt context is available.
    const pages = useState<DrupalPage[]>('pages-data', () => []);
    const loading = useState<boolean>('pages-loading', () => true);
    const error = useState<string | null>('pages-error', () => null);

    const api = useApiClient();
    const { locale } = useI18n();
    const { jurisdiction, currentJurisdictionId } = useMarkASpotConfig();
    const { getBySlug } = useJurisdictions();
    const { public: { fastmap: isFastmap } } = useRuntimeConfig();
    const loadedLocale = useState<string>('pages-loaded-locale', () => '');

    const fetchPages = async () => {
        loading.value = true;
        error.value = null;

        try {
            const baseEndpoint = '/jsonapi/node/page?filter[promote]=1';
            let jurisdictionFilter = '';

            // Build jurisdiction filter when available (multi-tenant)
            if (isFastmap) {
                const slug = currentJurisdictionId.value;
                if (slug) {
                    // Defense in depth: validate the slug against the known
                    // jurisdictions list before issuing the JSON:API call.
                    // If a non-jurisdiction segment slips through the routing
                    // layer (reserved namespace, unknown slug), the filtered
                    // request returns zero rows and the fallback below would
                    // leak globally-promoted pages whose field_jurisdiction
                    // is unset, exposing other tenants' content.
                    if (!getBySlug(slug)) {
                        console.warn(`[usePages] Unknown jurisdiction slug "${slug}" — skipping fetch`);
                        pages.value = [];
                        return;
                    }
                    jurisdictionFilter = `&filter[field_jurisdiction.field_slug]=${slug}`;
                }
            } else {
                const jurId = jurisdiction.value?.id;
                if (jurId) {
                    jurisdictionFilter = `&filter[field_jurisdiction.meta.drupal_internal__target_id]=${jurId}`;
                }
            }

            if (jurisdictionFilter) {
                // Try jurisdiction-specific pages first
                const response = await api.get<PagesResponse>(baseEndpoint + jurisdictionFilter);
                if (response.data?.length > 0) {
                    pages.value = response.data;
                    return;
                }
                // No jurisdiction-specific pages found: fall back to global pages
                // (pages without any jurisdiction assignment are shared across all jurisdictions)
                const fallbackResponse = await api.get<PagesResponse>(baseEndpoint);
                pages.value = (fallbackResponse.data || []).filter((page: DrupalPage) => {
                    const refs = (page as any).relationships?.field_jurisdiction?.data;
                    return !Array.isArray(refs) || refs.length === 0;
                });
            } else {
                const response = await api.get<PagesResponse>(baseEndpoint);
                pages.value = response.data || [];
            }
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error loading pages';
            console.error('Error fetching pages:', e);
        } finally {
            loading.value = false;
            loadedLocale.value = locale.value;
        }
    };

    // Refetch pages when locale changes (Accept-Language header is sent by useApiClient)
    watch(locale, async (newLocale, oldLocale) => {
        if (newLocale !== oldLocale) {
            pages.value = [];
            loadedLocale.value = '';
            await fetchPages();
        }
    });

    const getPage = async (id: string): Promise<DrupalPage | null> => {
        try {
            const response = await api.get<{ data: DrupalPage }>(`/jsonapi/node/page/${id}`);
            return response.data;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error loading page';
            console.error('Error fetching page:', e);
            return null;
        }
    };

    /**
     * Start page: the sticky page for this jurisdiction.
     * Displayed as intro content in the info panel instead of the legacy InfoBlock.
     */
    const startPage = computed(() =>
        pages.value.find(p => p.attributes?.sticky === true)
    );

    return {
        pages,
        loading,
        error,
        fetchPages,
        getPage,
        startPage
    };
};
