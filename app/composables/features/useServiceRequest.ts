import type { DrupalJsonApiResponse, DrupalEntityBase } from '~~/types/api';
import { mapAddressToDrupal, facilityAddressToDrupal, type GeocodingAddress } from '@/utils/mapAddressToDrupal';
import type { FacilityAddress } from '~~/types/clientConfig';

/**
 * Service Request Management Composable
 *
 * Provides functionality for creating, submitting, and managing service requests
 * in the Mark-a-Spot system. Handles media uploads, OSS Vision analysis, and form validation.
 *
 * Features:
 * - Service request creation and submission
 * - Media upload with progress tracking
 * - Vision-powered image analysis for automated categorization
 * - Comprehensive error handling and validation
 * - Integration with Drupal JSON:API backend
 */

/** Service request attribute structure for Drupal JSON:API */
interface ServiceRequestAttributes {
    title: string
    body: {
        value: string
        format: string
    }
    field_e_mail?: string
    field_gdpr?: boolean
    field_geolocation: {
        lat: number | string
        lng: number | string
    }
    field_address?: {
        langcode?: string
        address_line1?: string
        address_line2?: string
        locality?: string
        // administrative_area?: string // Removed - causes server validation errors
        postal_code?: string
        country_code?: string
    }
    field_facility?: string
}

/** Callback function type for upload progress tracking */
interface UploadProgressCallback {
    (progress: number): void
}

/** Complete service request entity structure */
interface ServiceRequest {
    id: string
    type: string
    attributes: ServiceRequestAttributes
    relationships: {
        field_category: {
            data: { type: string, id: string }
        }
        field_request_media?: {
            data: Array<{ type: string, id: string }>
        }
    }
    links?: { self?: string }
}

/** AI analysis response from Mark-a-Spot Vision API (flat structure, no data wrapper) */
interface AIAnalysisResponse {
    ai_result?: string
    category?: number | string
    description?: string
    alt_text?: string[]
    hazard_flag?: boolean
    hazard_level?: number
    hazard_category?: string
    hazard_issues?: string[]
    privacy_flag?: boolean
    privacy_issues?: string[]
    privacy_handled_by_blur?: boolean
    is_reportable_issue?: boolean
    blurred_previews?: Record<string, string>
    attributes?: Array<{ code: string, value: string | null }>
}

/** Options for service request creation */
interface CreateServiceRequestOptions {
    /** Send X-Acknowledge-Duplicate header to bypass duplicate hint */
    acknowledgeDuplicate?: boolean
    /**
     * Bypass the demo-mode confirmation gate. Off by default; only flip this
     * for documented internal flows where the gate has already run upstream
     * (none today). The gate is the project-wide safeguard against citizens
     * submitting real-looking reports on demo.mark-a-spot.com — see #432.
     */
    skipDemoGate?: boolean
}

export const useServiceRequest = () => {
    const api = useApiClient();
    const loading = ref(false);
    const { errorState, duplicateHintState, processApiErrors, clearErrors, clearDuplicateHint } = useErrorHandler();
    const runtimeConfig = useRuntimeConfig();
    const { jurisdiction, clientConfig, currentJurisdictionId } = useMarkASpotConfig();
    const { public: { fastmap: isFastmap } } = useRuntimeConfig();
    // Demo-mode gate. Hoisted to setup time so the inject() lookup runs
    // exactly once, never inside a computed (project memory:
    // feedback_vue3_hooks_in_computed).
    const { confirmDemoSubmission, isDemoMode } = useDemoMode();

    // mapAddressToDrupal is imported from @/utils/mapAddressToDrupal

    /** Check if AI analysis feature is enabled in client configuration */
    const isAIAnalysisEnabled = computed(() => {
        const flag = clientConfig.value.features?.aiAnalysis;
        if (flag === undefined || flag === null) return true;
        if (typeof flag === 'boolean') return flag;
        if (typeof flag === 'object' && flag !== null && 'enabled' in flag) {
            return Boolean((flag as { enabled?: unknown }).enabled);
        }
        return false;
    });

    /**
     * Upload media file for service request
     *
     * @param file - The file to upload
     * @param onProgress - Optional callback for upload progress tracking
     * @returns Promise resolving to the created media entity
     */
    const uploadMedia = async (file: File, onProgress?: UploadProgressCallback) => {
        try {
            // Add a timestamp to make the filename unique
            const fileExtension = file.name.split('.').pop() || '';
            const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
            const uniqueFileName = `${fileName}_${Date.now()}.${fileExtension}`;

            // First upload the file
            const fileResponse = await api.post<{ data: { id: string, type: string } }>(
                '/jsonapi/media/request_image/field_media_image',
                file,
                {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Content-Disposition': `file; filename="${encodeURIComponent(uniqueFileName)}"`,
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

            // Then create the media entity
            const mediaResponse = await api.post<{ data: { id: string, type: string } }>('/jsonapi/media/request_image', {
                data: {
                    type: 'media--request_image',
                    attributes: {
                        name: uniqueFileName,
                        status: false
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

            console.log('Media creation response:', mediaResponse);
            console.log('Media response data:', mediaResponse.data);

            return mediaResponse;
        } catch (error: unknown) {
            const err = error as Record<string, any>;
            // Check if this is a rate limit error (429)
            if (err.response?.status === 429 || err.status === 429) {
                // Extract the rate limit message from various sources
                const rateLimitMessage = err.response?.data?.message ||
                  err.data?.message ||
                  err.message ||
                  'Rate limit exceeded for media. Please try again later.';

                // Create a properly structured rate limit error
                const rateLimitError: Record<string, any> = new Error(rateLimitMessage);
                rateLimitError.response = {
                    status: 429,
                    data: {
                        message: rateLimitMessage
                    }
                };
                rateLimitError.status = 429;
                throw rateLimitError;
            }

            // Handle other errors normally
            const errorMessage = err.response?.data?.errors?.[0]?.detail ||
              err.message ||
              'Failed to upload file';
            throw new Error(errorMessage);
        }
    };

    // Extend to accept optional competition fields, personal fields, and address data
    const createServiceRequest = async (data: ServiceRequestAttributes & {
        field_category: string
        field_request_media?: string[]
        field_object_id?: string
        field_add_data?: number
        field_first_name?: string
        field_last_name?: string
        field_phone?: string
        field_facility?: string
        locationAddress?: GeocodingAddress | FacilityAddress | string // Raw geocoding address data, structured facility address, or legacy plain string
        attributes?: Record<string, any> // Open311 service definition attributes
    }, options?: CreateServiceRequestOptions) => {
        // Demo-mode gate (#432). Runs BEFORE any state mutation or HTTP
        // request so that cancelling on the demo instance leaves the form
        // and error state pristine. No-op pass-through on real tenants.
        // Centralised here (instead of in useFormSubmission) so every code
        // path that creates a service request — including the duplicate-
        // acknowledgment resubmit — is gated by construction.
        let demoSubmissionConfirmed = false;

        if (!options?.skipDemoGate) {
            const proceed = await confirmDemoSubmission();
            if (!proceed) {
                const cancelled = new Error('demo_mode_cancelled');
                (cancelled as Error & { code?: string }).code = 'DEMO_MODE_CANCELLED';
                throw cancelled;
            }
            demoSubmissionConfirmed = isDemoMode.value;
        }

        loading.value = true;
        clearErrors();
        clearDuplicateHint();

        try {
            // Map address data to Drupal format if available.
            // - GeocodingAddress: from map-picker / locate-me (goes through mapAddressToDrupal)
            // - FacilityAddress: structured address stored on the facility at admin-save time
            // - string: legacy plain-string fallback (graceful degradation via facilityAddressToDrupal)
            let drupalAddress;
            if (!data.locationAddress) {
                drupalAddress = undefined;
            } else if (typeof data.locationAddress === 'string') {
                drupalAddress = facilityAddressToDrupal(data.locationAddress);
            } else if ('address_line1' in data.locationAddress) {
                // Structured FacilityAddress (has address_line1 key, not street/city etc.)
                drupalAddress = facilityAddressToDrupal(data.locationAddress as FacilityAddress);
            } else {
                drupalAddress = mapAddressToDrupal(data.locationAddress as GeocodingAddress);
            }

            // Build JSON:API payload, including optional competition fields and address
            const payload = {
                data: {
                    type: 'node--service_request',
                    attributes: {
                        title: data.title,
                        body: data.body,
                        field_e_mail: data.field_e_mail,
                        ...(data.field_gdpr != null && { field_gdpr: data.field_gdpr }),
                        field_geolocation: data.field_geolocation,
                        // Include address data if available
                        // Use array format with delta as expected by Drupal (field_address.0.postal_code indicates array structure)
                        field_address: drupalAddress ? [drupalAddress] : undefined,
                        // Include personal fields if provided
                        ...(data.field_first_name != null && { field_first_name: data.field_first_name }),
                        ...(data.field_last_name != null && { field_last_name: data.field_last_name }),
                        ...(data.field_phone != null && { field_phone: data.field_phone }),
                        ...(data.field_facility != null && { field_facility: data.field_facility }),
                        // Include competition fields if provided
                        ...(data.field_object_id != null && { field_object_id: data.field_object_id }),
                        ...(data.field_add_data != null && { field_add_data: data.field_add_data }),
                        // Include Open311 service definition attributes if provided
                        ...(data.attributes && Object.keys(data.attributes).length > 0 && {
                            field_request_attributes: JSON.stringify(data.attributes)
                        })
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
                                data: data.field_request_media.map(id => ({
                                    type: 'media--request_image',
                                    id
                                }))
                            }
                        })
                    }
                }
            };

            // Enhanced debugging in development mode
            if (import.meta.dev || runtimeConfig.public.debug) {
                console.log('=== Service Request Submission Debug ===');
                console.log('Timestamp:', new Date().toISOString());
                console.log('Endpoint:', '/jsonapi/node/service_request');
                console.log('\nPayload Structure:');
                console.log('- Type:', payload.data.type);
                console.log('\nAttributes:');
                Object.entries(payload.data.attributes).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        console.log(`  - ${key}:`, JSON.stringify(value, null, 2));
                    }
                });
                console.log('\nRelationships:');
                Object.entries(payload.data.relationships).forEach(([key, value]) => {
                    console.log(`  - ${key}:`, JSON.stringify(value, null, 2));
                });
                console.log('\nFull payload:', JSON.stringify(payload, null, 2));
                console.log('=== End Debug ===\n');
            }

            // Build request config with optional acknowledgment header
            const requestHeaders = {
                ...(options?.acknowledgeDuplicate ? { 'X-Acknowledge-Duplicate': 'true' } : {}),
                ...(demoSubmissionConfirmed ? { 'X-Demo-Submission-Confirmed': 'true' } : {})
            };
            const requestConfig = Object.keys(requestHeaders).length > 0
                ? { headers: requestHeaders }
                : undefined;

            const response = await api.post<DrupalJsonApiResponse<ServiceRequest>>(
                '/jsonapi/node/service_request',
                payload,
                requestConfig
            );

            return response.data;
        } catch (error: unknown) {
            // Handle 422 validation errors, which should now pass through correctly
            if ((error as any).status === 422 || (error as any).response?.status === 422) {
                // Validation error - pass through for form handling

                // Extract the validation error data from the error object
                let errorData = (error as any).data || (error as any).response?.data;

                // If we have a string JSON, parse it
                if (typeof errorData === 'string') {
                    try {
                        errorData = JSON.parse(errorData);
                    } catch {
                        // Failed to parse error data, use original
                    }
                }

                // Process the error with the extracted data
                processApiErrors({
                    status: 422,
                    response: {
                        status: 422,
                        data: errorData
                    }
                });
            } else if ((error as any).status === 429 || (error as any).response?.status === 429) { // Handle rate limit errors (429)
                // Get the original message
                let errorMessage = '';

                // Check if the original error message has been stored
                if ((error as any).originalMessage) {
                    errorMessage = (error as any).originalMessage;
                } else {
                    // Get the raw response data to check for the message
                    const responseData = typeof (error as any).response?.data === 'string'
                        ? JSON.parse((error as any).response.data)
                        : (error as any).response?.data;

                    // Extract the error message from various sources
                    errorMessage = (error as any).data?.message ||
                      responseData?.message ||
                      (error as any).message ||
                      'Rate limit exceeded. Please try again later.';
                }

                // Process the rate limit error with the message
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
            } else if ((error as any).response?.data?.errors) {
                processApiErrors(error);
            } else {
                // Try to extract detailed error information from the error object
                const errorDetail = (error as any).message || 'Service request submission failed';
                const errorStatus = (error as any).status || (error as any).response?.status || '500';

                // Processing generic error for user feedback

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

            // Re-throw the error to allow for handling up the chain
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const unescapeCategory = (category: string): string => {
        return category
            .replace(/\\\//g, '/')
            .replace(/\\([\\"])/g, '$1');
    };

    /**
     * Fetch AI analysis results for uploaded media
     *
     * @param mediaIds - Array of media UUIDs to analyze
     * @param language - Optional language code for AI response (e.g., 'de', 'fr', 'en')
     */
    const fetchAIResults = async (mediaIds: string[], language?: string) => {
        if (!isAIAnalysisEnabled.value) {
            throw new Error('AI analysis is disabled in the configuration.');
        }

        loading.value = true;
        clearErrors();

        try {
            const jurisdictionId = currentJurisdictionId.value || jurisdiction.value?.id;
            const response = await api.post<AIAnalysisResponse>(
                '/vision/analyze',
                {
                    media_ids: mediaIds,
                    ...(language && { language }),
                    ...(jurisdictionId && { jurisdiction_id: jurisdictionId })
                }
            );

            // Clean up category name if present
            if (response?.category && typeof response.category === 'string') {
                response.category = unescapeCategory(response.category);
            }

            return response;
        } catch (error: unknown) {
            processApiErrors(error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    return {
        createServiceRequest,
        uploadMedia,
        fetchAIResults,
        errorState,
        duplicateHintState,
        clearDuplicateHint,
        loading
    };
};
