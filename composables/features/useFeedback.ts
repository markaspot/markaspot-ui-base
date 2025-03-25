import { ref } from 'vue'




interface FeedbackData {
  feedback: string
  set_status: boolean
  uuid: string
}

export const useFeedback = () => {
  const loading = ref(false)
  const feedback = ref<string | null>(null) 
  const hasSubmitted = ref(false)
  const submissionError = ref<string | null>(null)
  const apiClient = useApiClient()
  

  
  const getServiceRequest = async (uuid: string) => {
    try {
      loading.value = true
      submissionError.value = null
      
      
      let requestUrl = `/jsonapi/service-request/${encodeURIComponent(uuid)}`
      
      const response = await apiClient.get(requestUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      
      
      if (!response) {
        throw new Error('Service request not found - empty response')
      }
      
      
      
      
      const formattedResponse = {
        data: [{
          id: response.nid || uuid,
          type: 'node--service_request',
          title: response.title || 'Service Request',
          field_feedback: response.field_feedback || null,
          uuid: uuid,
          
          _raw: response
        }]
      }
      
      
      if (response.existing_feedback) {
        
        feedback.value = response.existing_feedback;
      } else if (response.field_feedback) {
        feedback.value = response.field_feedback;
      } else if (response.data && response.data.field_feedback) {
        feedback.value = response.data.field_feedback;
      } else {
        
        feedback.value = null;
      }
      
      return formattedResponse
    } catch (error) {
      
      submissionError.value = error.message || 'Failed to load service request'
      return null
    } finally {
      loading.value = false
    }
  }

  
  const submitFeedback = async (feedbackData: FeedbackData) => {
    try {
      loading.value = true
      submissionError.value = null
      
      
      
      const data = {
        feedback: feedbackData.feedback,
        set_status: feedbackData.set_status ? 1 : 0
      }
      
      
      
      const submitUrl = `/jsonapi/service-request/${encodeURIComponent(feedbackData.uuid)}/feedback`
      
      const response = await apiClient.post(
        submitUrl, 
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )
      hasSubmitted.value = true
      return true
    } catch (error) {
      
      submissionError.value = error.message || 'Failed to submit feedback'
      return false
    } finally {
      loading.value = false
    }
  }
  
  
  const resetFeedbackState = () => {
    loading.value = false
    hasSubmitted.value = false
    submissionError.value = null
  }

  return {
    loading,
    feedback,
    hasSubmitted,
    submissionError,
    getServiceRequest,
    submitFeedback,
    resetFeedbackState
  }
}