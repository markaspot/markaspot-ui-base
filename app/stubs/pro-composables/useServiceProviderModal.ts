export function useServiceProviderModal() {
    const showServiceProviderModal = ref(false);
    const serviceProviderUuid = ref<string | null>(null);

    return {
        showServiceProviderModal,
        serviceProviderUuid: readonly(serviceProviderUuid),
        initializeServiceProviderModal: (_uuid: string) => {},
        openServiceProviderResponse: (_uuid: string) => {},
        handleServiceProviderClose: (_data?: {
            success?: boolean
            message?: string
            _closeAction?: boolean
        }) => {}
    };
}
