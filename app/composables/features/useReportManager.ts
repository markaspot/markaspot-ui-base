import { useRouter } from 'vue-router';
import { useReportFocus } from '@/composables/core/useReportFocus';
import { useJurisdictions } from '@/composables/core/useJurisdictions';
import type { Request } from '~~/types';

/**
 * Composable for managing report selection and report-related operations
 */
export function useReportManager(mapManager?: {
    flyToRequest: (request: Request, options?: { highlight?: boolean }) => Promise<void>
    clearHighlight?: (currentReport?: Record<string, unknown> | null, shouldRecenter?: boolean) => void
    clearLocationMarker?: () => void
    clearMapCenter?: () => void
}) {
    const router = useRouter();
    const { setSelectedReport, restoreFocus } = useReportFocus();
    const { buildPath } = useJurisdictions();
    const { photoReportAvailable } = useFeatureFlags();

    // Report state
    const selectedReport = ref<Record<string, unknown> | null>(null);
    const reportType = ref<'photo' | 'classic'>('classic');
    const showDialog = ref(false);
    const reportLocation = ref<{ lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> } | null>(null);

    /**
   * Handle report selection from map or list
   */
    const handleReportSelect = async ({ report, source = 'url' }: { report: Record<string, unknown>, source?: 'url' | 'list' }) => {
        // Store the selected report ID for focus restoration (only for list selections)
        if (source === 'list' && report.service_request_id) {
            setSelectedReport(report.service_request_id as string);
        }

        // Force re-trigger if clicking the same report (clear first, then set)
        if (selectedReport.value?.service_request_id === report.service_request_id) {
            selectedReport.value = null;
            await nextTick();
        }

        // Always use modal mode for better UX - both list and marker clicks show as centered modal
        selectedReport.value = { ...report, _source: 'url' };
    };

    /**
   * Handle new report creation
   */
    const handleReport = (type: 'photo' | 'classic', location?: { lat: number, lng: number, address?: string, addressObj?: Record<string, unknown> }) => {
        const effectiveType = type === 'photo' && !photoReportAvailable.value ? 'classic' : type;
        reportType.value = effectiveType;

        // Set location if provided and valid
        const mapCenter = location && location.lat !== undefined && location.lng !== undefined ? location : null;
        reportLocation.value = mapCenter;

        // First set properties, then show the dialog in the next tick to ensure transitions work
        nextTick(() => {
            showDialog.value = true;
        });

        return mapCenter;
    };

    /**
   * Handle report dialog close
   */
    const handleDialogClose = () => {
        // Immediately hide dialog to prevent race conditions with navigation
        showDialog.value = false;
        // Don't clear location on close - let it persist for reopening
    };

    /**
   * Handle successful report submission
   */
    const handleSuccess = () => {
    // Allow transitions to complete before hiding the dialog
        setTimeout(() => {
            showDialog.value = false;
            reportLocation.value = null; // Clear location after success

            // Also clear the location marker from the map
            if (mapManager?.clearLocationMarker) {
                mapManager.clearLocationMarker();
            }

            // Clear the map center to prevent stale location data when starting a new report
            if (mapManager?.clearMapCenter) {
                mapManager.clearMapCenter();
            }
        }, 50);
    };

    /**
   * Handle report detail close
   */
    const handleClose = (initialRequestId?: string) => {
        const currentReport = selectedReport.value;
        selectedReport.value = null;

        // Clear highlight without recentering the map when closing report
        if (mapManager?.clearHighlight) {
            mapManager.clearHighlight(currentReport, false);
        }

        // Restore focus to the list item after a short delay
        nextTick(() => {
            setTimeout(() => {
                restoreFocus();
            }, 100);
        });

        if (!initialRequestId && window?.location.pathname.includes('/requests/')) {
            router.push(buildPath('/'));
        }
    };

    /**
   * Handle follow/unfollow changes
   */
    const handleFollowChange = (reportId: string, _isFollowing: boolean) => {
    // Additional follow logic can be added here
    };

    return {
    // State
        selectedReport,
        reportType,
        showDialog,
        reportLocation,

        // Methods
        handleReportSelect,
        handleReport,
        handleDialogClose,
        handleSuccess,
        handleClose,
        handleFollowChange
    };
}
