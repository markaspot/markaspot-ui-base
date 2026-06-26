/**
 * Feedback State Wrapper
 *
 * Provides consistent feedback state interface for the base app.
 * When pro layer is available, delegates to useFeedbackModal.
 * When not available, provides stub implementation (no-ops).
 *
 * This pattern ensures the app works both with and without pro layer.
 */
export function useFeedbackState() {
    const { proAvailable, feedbackEnabled } = useFeatureFlags();

    // Stub state for when pro is not available
    const stubShowFeedbackModal = ref(false);
    const stubFeedbackUuid = ref<string | null>(null);

    // Resolve the pro composable at setup time, NOT lazily inside a computed.
    // useFeedbackModal calls useRouter()/useRoute() which use inject();
    // calling it from a computed re-eval triggers "inject() can only be used
    // inside setup()" warnings on every reactive trigger. The runtime
    // feedbackEnabled flag is still respected via the gates below.
    let proFeedback: ReturnType<typeof useFeedbackModal> | null = null;
    if (proAvailable.value) {
        try {
            if (typeof useFeedbackModal === 'function') {
                proFeedback = useFeedbackModal();
            }
        } catch {
            // Pro composable not available
        }
    }

    // Helper: gate access on the runtime feedbackEnabled flag without re-resolving the composable
    const activePro = () => (feedbackEnabled.value ? proFeedback : null);

    // Reactive state that delegates to pro or uses stubs
    const showFeedbackModal = computed(() =>
        activePro()?.showFeedbackModal.value ?? stubShowFeedbackModal.value
    );

    const feedbackUuid = computed(() =>
        activePro()?.feedbackUuid.value ?? stubFeedbackUuid.value
    );

    /**
     * Initialize feedback modal with UUID
     * No-op when pro not available
     */
    const initializeFeedbackModal = (uuid: string) => {
        const pro = activePro();
        if (pro?.initializeFeedbackModal) {
            pro.initializeFeedbackModal(uuid);
        } else if (import.meta.dev) {
            console.debug('[useFeedbackState] Feedback feature not available (pro layer required)');
        }
    };

    /**
     * Handle feedback close
     * No-op when pro not available
     */
    const handleFeedbackClose = (data?: {
        nid: string
        message: string
        request_id?: string
        _closeAction?: boolean
    }) => {
        const pro = activePro();
        if (pro?.handleFeedbackClose) {
            pro.handleFeedbackClose(data);
        }
    };

    return {
        // State
        showFeedbackModal,
        feedbackUuid,

        // Methods
        initializeFeedbackModal,
        handleFeedbackClose,

        // Meta
        isAvailable: computed(() => !!activePro())
    };
}
