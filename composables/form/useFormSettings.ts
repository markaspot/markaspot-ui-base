

export const useFormSettings = () => {
    const settings = useState<FormConfig | null>('form-settings', () => null)

    const fetchSettings = async () => {
        const response = await useApiClient().get('/api/mark-a-spot-form-mode-settings/node/service_request/default')
        settings.value = response
    }

    return { settings, fetchSettings }
}