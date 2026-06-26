/**
 * Composable for managing focus on report items
 * Handles focus restoration when closing report details
 */

const lastSelectedReportId = ref<string | null>(null);

export const useReportFocus = () => {
    /**
   * Store the currently selected report ID for focus restoration
   */
    const setSelectedReport = (reportId: string) => {
        lastSelectedReportId.value = reportId;
    };

    /**
   * Restore focus to the previously selected report item
   */
    const restoreFocus = () => {
        if (!lastSelectedReportId.value) return;

        // Find the report item by its data attribute or ID
        const reportElement = document.querySelector(`[data-report-id="${lastSelectedReportId.value}"]`);

        if (reportElement && reportElement instanceof HTMLElement) {
            // Focus the element
            reportElement.focus();

            // Clear the stored ID after successful focus
            lastSelectedReportId.value = null;
        }
    };

    /**
   * Clear the stored report ID (e.g., when navigating away)
   */
    const clearSelectedReport = () => {
        lastSelectedReportId.value = null;
    };

    return {
        lastSelectedReportId: readonly(lastSelectedReportId),
        setSelectedReport,
        restoreFocus,
        clearSelectedReport
    };
};
