import { ref } from 'vue'
import type { DrupalJsonApiResponse, DrupalEntityBase } from '~/types/api'



interface ServiceRequestAttributes {
  title: string
  body: {
    value: string
    format: string
  }
  field_e_mail?: string
  field_gdpr: boolean
  field_geolocation: {
    lat: number | string
    lng: number | string
  }
}

interface UploadProgressCallback {
  (progress: number): void;
}

interface ServiceRequest extends DrupalEntityBase {
  attributes: ServiceRequestAttributes
  relationships: {
    field_category: {
      data: { type: string; id: string }
    }
    field_request_media?: {
      data: Array<{ type: string; id: string }>
    }
  }
}

interface AIAnalysisResponse {
  ai_result: string
  geo_data?: {
    lat: number
    lng: number
  }
}

export const useServiceRequest = () => {
  const api = useApiClient()
  const loading = ref(false)
  const { errorState, processApiErrors, clearErrors } = useErrorHandler()

  const uploadMedia = async (file: File, onProgress?: UploadProgressCallback) => {
    try {
      
      const fileResponse = await api.post(
        '/jsonapi/media/request_image/field_media_image',
        file,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `file; filename="${encodeURIComponent(file.name)}"`,
            'Accept': 'application/vnd.api+json'
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          }
        }
      );

      
      const mediaResponse = await api.post('/jsonapi/media/request_image', {
        data: {
          type: 'media--request_image',
          attributes: {
            name: file.name,
            status: true
          },
          relationships: {
            field_media_image: {
              data: {
                type: 'file--file',
                id: fileResponse.data.id
              }
            }
          }
        }
      });

      return mediaResponse;
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.errors?.[0]?.detail ||
        error.message ||
        'Failed to upload file';
      throw new Error(errorMessage);
    }
  }

  const createServiceRequest = async (data: ServiceRequestAttributes & {
    field_category: string
    field_request_media?: string[]
  }) => {
    loading.value = true
    clearErrors()

    try {
      const payload = {
        data: {
          type: 'node--service_request',
          attributes: {
            title: data.title,
            body: data.body,
            field_e_mail: data.field_e_mail,
            field_gdpr: data.field_gdpr,
            field_geolocation: data.field_geolocation
          },
          relationships: {
            field_category: {
              data: {
                type: 'taxonomy_term--service_category',
                id: data.field_category
              }
            },
            ...(data.field_request_media && {
              field_request_media: {
                data: data.field_request_media.map((id) => ({
                  type: 'media--request_image',
                  id
                }))
              }
            })
          }
        }
      }

      const response = await api.post<DrupalJsonApiResponse<ServiceRequest>>(
        '/jsonapi/node/service_request',
        payload
      )

      return response.data
    } catch (error: any) {
      
      
      
      if (error.status === 422 || error.response?.status === 422) {
        
        
        
        let errorData = error.data || error.response?.data;
        
        
        if (typeof errorData === 'string') {
          try {
            errorData = JSON.parse(errorData);
          } catch (e) {
            console.error('Failed to parse error data:', e);
          }
        }
        
        
        processApiErrors({
          status: 422,
          response: {
            status: 422,
            data: errorData
          }
        });
      }
      
      else if (error.status === 429 || error.response?.status === 429) {
        
        let errorMessage = '';
        
        // Check if the original error message has been stored
        if (error.originalMessage) {
          errorMessage = error.originalMessage;
        } else {
          // Get the raw response data to check for the message
          const responseData = typeof error.response?.data === 'string' 
            ? JSON.parse(error.response.data) 
            : error.response?.data;
          
          
          errorMessage = error.data?.message || 
                        responseData?.message || 
                        error.message || 
                        'Rate limit exceeded. Please try again later.';
        }
        
        
        processApiErrors({
          status: 429,
          message: errorMessage,
          originalMessage: errorMessage,
          response: {
            status: 429,
            data: {
              message: errorMessage
            }
          }
        });
      }
      else if (error.response?.data?.errors) {
        processApiErrors(error);
      } else {
        
        const errorDetail = error.message || 'Service request submission failed';
        const errorStatus = error.status || error.response?.status || '500';
        
        : ${errorDetail}`);
        
        processApiErrors({
          response: {
            data: {
              errors: [{
                title: 'Error',
                status: errorStatus,
                detail: errorDetail
              }]
            }
          }
        });
      }
      
      
      throw error;
    } finally {
      loading.value = false
    }
  }

  const unescapeCategory = (category: string): string => {
    return category
      .replace(/\\\//g, '/')
      .replace(/\\([\\"])/g, '$1');
  }

  const fetchAIResults = async (mediaIds: string[]) => {
    loading.value = true
    clearErrors()

    try {
      const response = await api.post<AIAnalysisResponse>(
        '/markaspot_vision/getAIresults',
        { media_ids: mediaIds }
      )

      
      if (response?.data?.category) {
        response.data.category = unescapeCategory(response.data.category);
      }

      return response
    } catch (error: any) {
      processApiErrors(error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    createServiceRequest,
    uploadMedia,
    fetchAIResults,
    errorState,
    loading
  }
}
