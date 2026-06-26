import { useI18n } from 'vue-i18n';
import { useRequestsStore } from '~/stores/requests';
import type { Request } from '~~/types';
import type maplibregl from 'maplibre-gl';

/**
 * Composable for handling request-related watchers and initialization
 */
export function useRequestWatchers(
    props: {
        initialRequestId?: string
        initialConfirmationUuid?: string
    },
    mapManager: {
        mainMapInstance: Ref<maplibregl.Map | null>
        flyToRequest: (request: Request) => Promise<void>
    },
    reportManager: {
        selectedReport: Ref<Record<string, unknown> | null>
    },
    modalManager: {
        initializeConfirmationModal: (uuid: string) => void
    },
    feedbackState: {
        initializeFeedbackModal: (uuid: string) => void
    },
    serviceProviderState: {
        initializeServiceProviderModal: (uuid: string) => void
    }
) {
    const requestsStore = useRequestsStore();
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const { t } = useI18n();
    const { initialRequestId, initialConfirmationUuid } = toRefs(props);

    /**
     * Watch for initial request ID and load/display the request
     */
    const setupInitialRequestWatcher = () => {
        watch(
            [() => mapManager.mainMapInstance.value, () => initialRequestId.value],
            async ([map, id]) => {
                if (!id) return;

                let request = requestsStore.getRequestById(id);

                if (!request) {
                    request = await requestsStore.fetchRequestById(id);
                }

                if (request) {
                    // Mark as URL source since this came from direct link
                    reportManager.selectedReport.value = { ...request, _source: 'url' };

                    if (map) {
                        await mapManager.flyToRequest(request);
                    }
                } else if (map) {
                    // Deep link could not be resolved. The most common cause is a
                    // report that exists but is not yet publicly visible (moderation
                    // / privacy publish delay), so Open311 returns an empty result for
                    // anonymous visitors. Without feedback the citizen just lands on
                    // the map next to unrelated reports — surface a clear message.
                    // Gated on `map` so it fires once, after the map has initialised.
                    toast.add({
                        title: t('detail.unavailable.title'),
                        description: t('detail.unavailable.message'),
                        color: 'warning',
                        icon: 'i-heroicons-clock'
                    });
                }
            },
            { immediate: true }
        );
    };

    /**
     * Watch for feedback query parameter and show feedback modal
     * The feedback query param is set by the pro feedback page redirect
     */
    const setupFeedbackWatcher = () => {
        watch(
            () => route.query.feedback as string | undefined,
            (uuid) => {
                if (!uuid) return;
                feedbackState.initializeFeedbackModal(uuid);
                // Clear the query param after initializing
                const { feedback, ...cleanQuery } = route.query;
                router.replace({ query: cleanQuery });
            },
            { immediate: true }
        );
    };

    /**
     * Watch for initial confirmation UUID and show confirmation modal
     */
    const setupConfirmationWatcher = () => {
        watch(
            () => initialConfirmationUuid.value,
            (uuid) => {
                if (!uuid) return;
                modalManager.initializeConfirmationModal(uuid);
            },
            { immediate: true }
        );
    };

    /**
     * Watch for service-provider query parameter and show service provider modal
     * The service-provider query param is set by the pro service-response page redirect
     */
    const setupServiceProviderWatcher = () => {
        watch(
            () => route.query['service-provider'] as string | undefined,
            (uuid) => {
                if (!uuid) return;
                serviceProviderState.initializeServiceProviderModal(uuid);
                // Clear the query param after initializing
                const { 'service-provider': _, ...cleanQuery } = route.query;
                router.replace({ query: cleanQuery });
            },
            { immediate: true }
        );
    };

    /**
     * Initialize all watchers
     */
    const initializeWatchers = () => {
        setupInitialRequestWatcher();
        setupFeedbackWatcher();
        setupConfirmationWatcher();
        setupServiceProviderWatcher();
    };

    return {
        initializeWatchers,
        setupInitialRequestWatcher,
        setupFeedbackWatcher,
        setupConfirmationWatcher,
        setupServiceProviderWatcher
    };
}
