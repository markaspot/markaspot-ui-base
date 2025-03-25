export const usePages = () => {
    const api = useApiClient()
    const pages = ref<DrupalPage[]>([])
    const loading = ref(true)
    const error = ref<string | null>(null)

    const fetchPages = async () => {
        loading.value = true
        error.value = null

        try {
            const response = await api.get<PagesResponse>('/jsonapi/node/page')
            pages.value = response.data
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error loading pages'
            console.error('Error fetching pages:', e)
        } finally {
            loading.value = false
        }
    }

    const getPage = async (id: string): Promise<DrupalPage | null> => {
        try {
            const response = await api.get<{ data: DrupalPage }>(`/jsonapi/node/page/${id}`)
            
            return response.data
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error loading page'
            console.error('Error fetching page:', e)
            return null
        }
    }

    return {
        pages,
        loading,
        error,
        fetchPages,
        getPage
    }
}
