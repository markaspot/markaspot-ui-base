/**
 * Service Provider State Wrapper
 *
 * Provides consistent service provider state interface for the base app.
 * When pro layer is available, delegates to useServiceProviderModal.
 * When not available, provides stub implementation (no-ops).
 *
 * This pattern ensures the app works both with and without pro layer.
 */
export function useServiceProviderState() {
    const { proAvailable } = useFeatureFlags();

    // Stub state for when pro is not available
    const stubShowServiceProviderModal = ref(false);
    const stubServiceProviderUuid = ref<string | null>(null);

    // Resolve the pro composable at setup time, NOT lazily inside a computed.
    // useServiceProviderModal calls useRouter()/useRoute() which use inject();
    // calling it from a computed re-eval triggers "inject() can only be used
    // inside setup()" warnings on every reactive trigger.
    let proServiceProvider: ReturnType<typeof useServiceProviderModal> | null = null;
    if (proAvailable.value) {
        try {
            if (typeof useServiceProviderModal === 'function') {
                proServiceProvider = useServiceProviderModal();
            }
        } catch {
            // Pro composable not available
        }
    }

    // Reactive state that delegates to pro or uses stubs
    const showServiceProviderModal = computed(() =>
        proServiceProvider?.showServiceProviderModal.value ?? stubShowServiceProviderModal.value
    );

    const serviceProviderUuid = computed(() =>
        proServiceProvider?.serviceProviderUuid.value ?? stubServiceProviderUuid.value
    );

    /**
     * Initialize service provider modal with UUID
     * No-op when pro not available
     */
    const initializeServiceProviderModal = (uuid: string) => {
        if (proServiceProvider?.initializeServiceProviderModal) {
            proServiceProvider.initializeServiceProviderModal(uuid);
        } else if (proServiceProvider?.openServiceProviderResponse) {
            proServiceProvider.openServiceProviderResponse(uuid);
        } else if (import.meta.dev) {
            console.debug('[useServiceProviderState] Service provider feature not available (pro layer required)');
        }
    };

    /**
     * Open service provider response modal (alias)
     * No-op when pro not available
     */
    const openServiceProviderResponse = (uuid: string) => {
        initializeServiceProviderModal(uuid);
    };

    /**
     * Handle service provider close
     * No-op when pro not available
     */
    const handleServiceProviderClose = (data?: {
        success?: boolean
        message?: string
        _closeAction?: boolean
    }) => {
        if (proServiceProvider?.handleServiceProviderClose) {
            proServiceProvider.handleServiceProviderClose(data);
        }
    };

    return {
        // State
        showServiceProviderModal,
        serviceProviderUuid,

        // Methods
        initializeServiceProviderModal,
        openServiceProviderResponse,
        handleServiceProviderClose,

        // Meta
        isAvailable: computed(() => !!proServiceProvider)
    };
}
