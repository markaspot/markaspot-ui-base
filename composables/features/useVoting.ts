import { ref } from 'vue'
import { useApiClient } from '~/composables/api/useApiClient'

export const useVoting = () => {
  const api = useApiClient()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const voteCount = ref(0)
  const voteUuid = ref('')

  // Define TypeScript interfaces for better type safety
  interface VoteSumResponse {
    uuid: string
    nid: string
    vote_sum?: number
  }

  // Options object for error handling at the right level
  api.options.error = (error) => {
    console.error('Error:', error)
    throw new Error(error.message || 'Unknown error occurred')
  }

  const getNodeByRequestId = async (requestId: string) => {
    if (!requestId) {
      throw new Error('Request ID is required')
    }

    try {
      const url = `/jsonapi/node/service_request?filter[request_id][value]=${requestId}`
      const response = await api.get(url)
      if (!response.data?.[0]?.id) {
        throw new Error('Node not found')
      }
      const node = response.data[0]
      node.uuid = node.uuid || node.id
      return node
    } catch (err: any) {
      console.error('Error getting node:', err)
      throw err
    }
  }

  const submitVote = async (requestId: string, value: number = 1) => {
    loading.value = true
    error.value = null

    try {
      const node = await getNodeByRequestId(requestId)

      
      api.options.error = (err) => {
        console.error('Error submitting vote:', err)
        error.value = err.message || 'Failed to submit vote'
        throw err
      }

      await api.post('/jsonapi/vote/updown', {
        data: {
          type: 'vote--updown',
          attributes: {
            entity_type: 'node',
            value: value
          }
        },
        relationships: {
          entity_id: {
            data: {
              type: 'node--service_request',
              id: node.id
            }
          }
        }
      })

      
      await getVotes(requestId)
    } catch (err: any) {
      console.error('Error submitting vote:', err)
      error.value = err.message || 'Failed to submit vote'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getVotes = async (requestId: string) => {
    loading.value = true
    error.value = null

    try {
      const node = await getNodeByRequestId(requestId)
      
      const response = await api.get(`/jsonapi/vote-sum/${node.uuid}`)

      const voteSumResponse: VoteSumResponse | undefined = response.data
      if (voteSumResponse) {
        voteCount.value = Number(voteSumResponse.vote_sum || 0)
        voteUuid.value = voteSumResponse.uuid || ''
      } else {
        voteCount.value = 0
        voteUuid.value = ''
      }
    } catch (err: any) {
      console.error('Error fetching votes:', err)
      error.value = err.message || 'Failed to fetch votes'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    submitVote,
    getVotes,
    loading,
    error,
    voteCount,
    voteUuid
  }
}
