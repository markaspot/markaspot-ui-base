/**
 * Offline Database Stub Composable (MIT Build)
 *
 * This is a NO-OP stub for MIT builds without the pro layer.
 * The real implementation is in pro-layer/app/composables/offline/useOfflineDb.ts
 *
 * When the pro layer is loaded, it uses an imports:extend hook to remove this
 * stub from auto-imports, so the pro-layer's real implementation is used instead.
 * (Root app composables normally take precedence over layer composables.)
 *
 * This stub provides the same interface but does nothing, preventing crashes
 * when components call useOfflineDb() but pro layer is not available.
 */

// Re-export types for compatibility (must match pro layer interfaces)
export interface ServiceRequestPayload {
    title: string
    body: { value: string, format: string }
    field_e_mail?: string
    field_gdpr?: boolean
    field_geolocation: { lat: number | string, lng: number | string }
    field_category: string
    field_facility?: string
    field_address?: Record<string, unknown> | string
    field_first_name?: string
    field_last_name?: string
    field_phone?: string
}

export interface FormDraftPayload {
    description?: string
    category_id?: string
    facility_id?: string
    email?: string
    first_name?: string
    last_name?: string
    phone?: string
    gdpr_accepted?: boolean
    location?: {
        lat: string
        lng: string
        address?: Record<string, unknown>
        address_string?: string
    }
    media_ids?: string[]
}

export interface QueuedRequest {
    id: string
    created_at: number
    status: 'pending' | 'syncing' | 'failed' | 'validation_failed'
    retries: number
    payload: ServiceRequestPayload
    form_data?: FormDraftPayload
    media_ids?: string[]
    jurisdiction_id?: number | null
    last_error?: string
    error_status?: number
}

export interface OfflineStorageInfo {
    size: number
    quota: { available: boolean, usage: number, quota: number, percentUsed: number }
}

export interface FormDraft {
    id: string
    updated_at: number
    payload: FormDraftPayload
}

export interface CachedMedia {
    id: string
    draft_id?: string
    queue_id?: string
    blob: Blob
    filename: string
    mime_type: string
    size: number
    created_at: number
}

/**
 * Stub implementation - no-op for MIT builds
 */
export function useOfflineDb() {
    // No-op draft operations
    const saveDraft = async (_payload?: FormDraftPayload, _id?: string): Promise<string | null> => null;
    const loadDraft = async (_id?: string): Promise<FormDraft | null> => null;
    const loadLatestDraft = async (): Promise<FormDraft | null> => null;
    const deleteDraft = async (_id?: string): Promise<boolean> => false;
    const getAllDrafts = async (): Promise<FormDraft[]> => [];

    // No-op queue operations
    const enqueue = async (
        _payload?: ServiceRequestPayload,
        _mediaIds?: string[],
        _jurisdictionId?: number | null,
        _formData?: FormDraftPayload
    ): Promise<string | null> => null;
    const getQueueItem = async (_id?: string): Promise<QueuedRequest | null> => null;
    const updateQueueStatus = async (
        _id?: string,
        _status?: QueuedRequest['status'],
        _error?: string,
        _errorStatus?: number
    ): Promise<boolean> => false;
    const getPendingQueue = async (_jurisdictionId?: number): Promise<QueuedRequest[]> => [];
    const getFailedQueue = async (): Promise<QueuedRequest[]> => [];
    const getValidationFailedQueue = async (): Promise<QueuedRequest[]> => [];
    const deleteQueueItem = async (_id?: string): Promise<boolean> => false;
    const getPendingCount = async (): Promise<number> => 0;

    // No-op media operations
    const cacheMedia = async (_file?: File | Blob, _filename?: string, _draftId?: string): Promise<string | null> => null;
    const getMedia = async (_id?: string): Promise<CachedMedia | null> => null;
    const deleteMedia = async (_id?: string): Promise<boolean> => false;
    const getMediaForDraft = async (_draftId?: string): Promise<CachedMedia[]> => [];
    const getMediaForQueue = async (_queueId?: string): Promise<CachedMedia[]> => [];

    // No-op cleanup
    const cleanup = async (_draftDays?: number, _mediaHours?: number): Promise<{ drafts: number, media: number }> => ({ drafts: 0, media: 0 });
    const getStorageInfo = async (): Promise<OfflineStorageInfo> => ({
        size: 0,
        quota: { available: false, usage: 0, quota: 0, percentUsed: 0 }
    });

    return {
        isAvailable: false as const,
        // Draft operations
        saveDraft,
        loadDraft,
        loadLatestDraft,
        deleteDraft,
        getAllDrafts,
        // Queue operations
        enqueue,
        getQueueItem,
        updateQueueStatus,
        getPendingQueue,
        getFailedQueue,
        getValidationFailedQueue,
        deleteQueueItem,
        getPendingCount,
        // Media operations
        cacheMedia,
        getMedia,
        deleteMedia,
        getMediaForDraft,
        getMediaForQueue,
        // Cleanup
        cleanup,
        getStorageInfo
    };
}
