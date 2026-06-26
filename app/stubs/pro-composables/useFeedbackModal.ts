export function useFeedbackModal() {
    const showFeedbackModal = ref(false);
    const feedbackUuid = ref<string | null>(null);

    return {
        showFeedbackModal,
        feedbackUuid,
        initializeFeedbackModal: (_uuid: string) => {},
        handleFeedbackClose: (_data?: {
            nid: string
            message: string
            request_id?: string
            _closeAction?: boolean
        }) => {}
    };
}
