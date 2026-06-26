import type { Request, StatusNote } from '~~/types';

/**
 * Report Status Information
 * Contains extracted and computed status information from a report
 */
export interface StatusInfo {
    /** Current status from latest status note or request.status */
    currentStatus: string
    /** Descriptive status name (may differ from currentStatus) */
    statusDescriptive: string
    /** Hex color for the status */
    statusHex?: string
    /** Icon name for the status */
    statusIcon?: string
    /** Filter key - uses statusDescriptive if different from currentStatus */
    filterKey: string
    /** The latest status note object (last in array) */
    latestStatusNote: StatusNote | null
}

/**
 * Extracts the latest status information from a report
 * Always uses the LAST status note in the array (most recent)
 *
 * This centralizes the status extraction logic that was duplicated across:
 * - useReportsFilter.ts (lines 78-96, 145-151, 364-370)
 * - useMapIcons.ts (lines 289-293, 325-329)
 * - And potentially other files
 *
 * @param report - The report/request object to extract status from
 * @returns StatusInfo object with all relevant status information
 */
export function getReportStatusInfo(report: Request): StatusInfo {
    // Get status notes array from extended attributes
    const statusNotes = report.extended_attributes?.markaspot?.status_notes;

    // Get the LAST status note (most recent) - this is the actual current status
    const latestStatusNote = Array.isArray(statusNotes) && statusNotes.length > 0
        ? statusNotes[statusNotes.length - 1]
        : null;

    // Determine current status - prefer latest status note, fallback to request.status
    const currentStatus = latestStatusNote?.status || report.status || 'unknown';

    // Get descriptive status name - check multiple locations in priority order
    const statusDescriptive =
        latestStatusNote?.status_descriptive_name ||
        report.extended_attributes?.markaspot?.status_descriptive_name ||
        currentStatus;

    // Use status_descriptive_name as the filter key if it's different from status
    // This ensures filters match the displayed name
    const filterKey = statusDescriptive !== currentStatus ? statusDescriptive : currentStatus;

    // Get status hex color - check multiple locations in priority order
    const statusHex =
        latestStatusNote?.status_hex ||
        report.extended_attributes?.markaspot?.status_hex;

    // Get status icon - prefer from latest status note, fallback to category icon
    const statusIcon = latestStatusNote?.status_icon;

    return {
        currentStatus,
        statusDescriptive,
        statusHex,
        statusIcon,
        filterKey,
        latestStatusNote
    };
}
