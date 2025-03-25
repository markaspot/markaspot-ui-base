
import { ref } from 'vue'
import { useApiClient } from '~/composables/api/useApiClient'

interface StatusAttributes {
    name: string
    description?: {
        value: string
        processed: string
    }
    field_status_hex?: string
    field_status_icon?: string
    weight?: number
    changed?: string
}

interface DrupalStatus {
    id: string
    type: string
    attributes: StatusAttributes
    links: {
        self: string
    }
}

interface StatusResponse {
    data: DrupalStatus[]
    links: {
        self: string
    }
}

export const useStatus = () => {
    const api = useApiClient()
    const statusItems = ref<DrupalStatus[]>([])
    const loading = ref(true)
    const error = ref<string | null>(null)

    const fetchStatus = async () => {
        loading.value = true
        error.value = null

        try {
            const response = await api.get<StatusResponse>(
                '/jsonapi/taxonomy_term/status',
                {
                    'fields[taxonomy_term--status]': 'name,description,field_status_hex,field_status_icon,weight,changed',
                    'sort': 'weight'
                }
            )
            statusItems.value = response.data
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error loading status'
            console.error('Error fetching status:', e)
        } finally {
            loading.value = false
        }
    }

    
    const getStatusById = (id: string): DrupalStatus | undefined => {
        return statusItems.value.find(status => status.id === id)
    }

    
    const getStatusByName = (name: string): DrupalStatus | undefined => {
        return statusItems.value.find(
            status => status.attributes.name.toLowerCase() === name.toLowerCase()
        )
    }

    
    const getStatusDisplay = (id: string) => {
        const status = getStatusById(id)
        if (!status) return null

        return {
            name: status.attributes.name,
            color: status.attributes.field_status_hex || '#666666',
            icon: status.attributes.field_status_icon || 'default-icon'
        }
    }

    
    const sortedStatus = computed(() => {
        return [...statusItems.value].sort((a, b) => {
            const weightA = a.attributes.weight || 0
            const weightB = b.attributes.weight || 0
            return weightA - weightB
        })
    })

    return {
        statusItems,
        sortedStatus,
        loading,
        error,
        fetchStatus,
        getStatusById,
        getStatusByName,
        getStatusDisplay
    }
}