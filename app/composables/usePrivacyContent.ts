// composables/usePrivacyContent.ts

interface PrivacyContent {
    title: string
    content: string
    lastModified?: string
}

interface PageNode {
    attributes?: {
        drupal_internal__nid: number
        title: string
        body?: {
            processed?: string
        }
        changed?: string
    }
}

interface PagesResponse {
    data: PageNode[]
}

export const usePrivacyContent = () => {
    const content = ref<PrivacyContent | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const { clientConfig } = useMarkASpotConfig();
    const { privacyNoticeEnabled } = useFeatureFlags();

    // Fetch privacy content using node ID from client config
    const fetchPrivacyContent = async (): Promise<void> => {
        if (loading.value) return; // Prevent concurrent requests

        loading.value = true;
        error.value = null;

        try {
            const privacyConfig = clientConfig.value?.features?.privacyNotice;

            if (!privacyNoticeEnabled.value || !privacyConfig?.modal || !privacyConfig.nodeId) {
                throw new Error('Privacy modal not properly configured');
            }

            // Fetch only the requested page node via sparse fieldset + filter.
            // Avoids paging through every node/page just to find one NID.
            const query = new URLSearchParams({
                'filter[drupal_internal__nid]': String(privacyConfig.nodeId),
                'fields[node--page]': 'drupal_internal__nid,title,body,changed'
            });
            const pagesResponse = await $fetch<PagesResponse>(`/api/jsonapi/node/page?${query.toString()}`);

            const targetNode = pagesResponse.data.find(node =>
                node.attributes?.drupal_internal__nid === privacyConfig.nodeId
            );

            if (!targetNode?.attributes) {
                throw new Error(`Privacy page with node ID ${privacyConfig.nodeId} not found`);
            }

            // Only render the filter-processed body. Raw body.value would bypass
            // Drupal's text format filters and risk XSS for tenants using full_html.
            content.value = {
                title: targetNode.attributes.title,
                content: targetNode.attributes.body?.processed || '',
                lastModified: targetNode.attributes.changed
            };
        } catch (fetchError: unknown) {
            console.error('Failed to fetch privacy content:', fetchError);
            error.value = fetchError instanceof Error ? fetchError.message : 'Failed to load privacy content';
        } finally {
            loading.value = false;
        }
    };

    // Computed properties
    const hasContent = computed(() => !!content.value?.content);
    const isEmpty = computed(() => !content.value?.content);

    return {
        content: readonly(content),
        loading: readonly(loading),
        error: readonly(error),
        hasContent,
        isEmpty,
        fetchPrivacyContent
    };
};
