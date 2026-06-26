/**
 * Paragraph API Composable
 *
 * Handles CRUD operations for Drupal paragraph entities.
 * Uses custom endpoints for status notes and internal remarks
 * (entity_reference_revisions doesn't work properly with JSON:API).
 *
 * NOTE: The exported `StatusNoteParagraph` / `InternalRemarkParagraph`
 * types below are retained for compatibility with any external
 * importer. They are intentionally minimal — the canonical runtime
 * UI shape used across the dashboard layer is
 * `DashboardStatusNoteEntry` / `InternalRemarkEntry` in
 * `pro-layer/types/dashboard/paragraphEntries.ts`. Pro-layer code
 * should import from there, not from this file, because the base
 * `app/` layer is not allowed to take a build-time dependency on
 * pro-layer types (one-way layer extension).
 */
import { useApiClient } from './useApiClient';

/**
 * @deprecated Use `DashboardStatusNoteEntry` from
 * `pro-layer/types/dashboard/paragraphEntries.ts` in dashboard code.
 * Kept here as a minimal raw-paragraph shape only.
 */
export interface StatusNoteParagraph {
    uuid: string
    field_status_term?: {
        id: string
        name?: string
        color?: string
    }
    field_status_note?: string
    field_status_attributes?: Record<string, any> | null
    field_boilerplate?: {
        id: string
        title?: string
    }
    created?: string
}

/**
 * @deprecated Use `InternalRemarkEntry` from
 * `pro-layer/types/dashboard/paragraphEntries.ts` in dashboard code.
 * Kept here as a minimal raw-paragraph shape only.
 */
export interface InternalRemarkParagraph {
    uuid: string
    field_internal_remark_text?: string
    created?: string
}

interface CreateStatusNotePayload {
    field_status_term?: string // Status taxonomy term UUID
    field_status_note?: string // Note text
    field_status_attributes?: Record<string, any> | null // Internal status transition attributes
    field_boilerplate?: string // Boilerplate node UUID
}

interface UpdateStatusNotePayload {
    field_status_term?: string
    field_status_note?: string
    field_status_attributes?: Record<string, any> | null
    field_boilerplate?: string
}

export const useParagraphApi = () => {
    const api = useApiClient();

    /**
     * Add a status note to a service request
     * Uses custom endpoint that handles paragraph creation + linking atomically
     */
    const addStatusNoteToRequest = async (
        requestUuid: string,
        _existingNoteUuids: string[], // Not needed with new endpoint
        notePayload: CreateStatusNotePayload
    ): Promise<string> => {
        const response = await api.post('/dashboard/status-notes', {
            request_uuid: requestUuid,
            status_term_uuid: notePayload.field_status_term,
            note: notePayload.field_status_note,
            status_attributes: notePayload.field_status_attributes,
            boilerplate_uuid: notePayload.field_boilerplate
        });

        return (response as any).uuid;
    };

    /**
     * Update an existing status note via the dashboard endpoint so feature-gated
     * status attributes cannot bypass backend access checks through JSON:API.
     */
    const updateStatusNote = async (uuid: string, payload: UpdateStatusNotePayload): Promise<void> => {
        await api.patch(`/dashboard/status-notes/${uuid}`, {
            ...(payload.field_status_note !== undefined && { note: payload.field_status_note }),
            ...(payload.field_status_term !== undefined && { status_term_uuid: payload.field_status_term }),
            ...(payload.field_status_attributes !== undefined && { status_attributes: payload.field_status_attributes }),
            ...(payload.field_boilerplate !== undefined && { boilerplate_uuid: payload.field_boilerplate })
        });
    };

    /**
     * Remove a status note from a service request
     * Uses custom endpoint that handles unlinking + deletion atomically
     */
    const removeStatusNoteFromRequest = async (
        _requestUuid: string, // Not needed with new endpoint
        _existingNoteUuids: string[], // Not needed with new endpoint
        noteUuidToRemove: string
    ): Promise<void> => {
        await api.delete(`/dashboard/status-notes/${noteUuidToRemove}`);
    };

    /**
     * Add an internal remark to a service request
     * Uses custom endpoint that handles paragraph creation + linking atomically
     */
    const addInternalRemarkToRequest = async (
        requestUuid: string,
        text: string
    ): Promise<string> => {
        const response = await api.post('/dashboard/internal-remarks', {
            request_uuid: requestUuid,
            text
        });

        return (response as any).uuid;
    };

    /**
     * Update an existing internal remark via the custom dashboard endpoint.
     *
     * The route enforces an author-or-admin authorship check server-side;
     * the previous direct JSON:API PATCH path bypassed that check and allowed
     * any staff member with the bare field permission to rewrite peers'
     * remarks (silent audit-trail tampering).
     */
    const updateInternalRemark = async (uuid: string, text: string): Promise<void> => {
        await api.patch(`/dashboard/internal-remarks/${uuid}`, { text });
    };

    /**
     * Remove an internal remark from a service request
     * Uses custom endpoint that handles unlinking + deletion atomically
     */
    const removeInternalRemarkFromRequest = async (
        remarkUuid: string
    ): Promise<void> => {
        await api.delete(`/dashboard/internal-remarks/${remarkUuid}`);
    };

    return {
        addStatusNoteToRequest,
        updateStatusNote,
        removeStatusNoteFromRequest,
        addInternalRemarkToRequest,
        updateInternalRemark,
        removeInternalRemarkFromRequest
    };
};
