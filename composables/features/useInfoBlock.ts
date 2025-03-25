
import { ref } from 'vue'
import { useApiClient } from '~/composables/api/useApiClient'

export function useInfoBlock(apiEndpoint) {
    const infoBlock = ref(null)
    const loading = ref(true)
    const error = ref(null)

    const fetchInfoBlock = async () => {
        loading.value = true
        const api = useApiClient()

        try {
            const response = await api.get(apiEndpoint, undefined, {
                headers: {
                    'Priority': 'high',
                },
            })
            infoBlock.value = response.data[0]
        } catch (e) {
            console.error('Error:', e)
            error.value = 'Failed to load'
        } finally {
            loading.value = false
        }
    }

    return { infoBlock, loading, error, fetchInfoBlock }
}
