// ~/composables/useFollows.ts

import { useRequestsStore } from '~/stores/requests';
import { useJurisdictions } from '~/composables/core/useJurisdictions';
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import { NEUTRAL_FALLBACKS } from '~/utils/colorUtils';
import type { Request } from '~~/types';

/**
 * Follows Composable
 *
 * Provides  follows functionality for the application.
 *
 * @returns Reactive state and methods for follows functionality
 */

export interface FollowedReport {
    service_request_id: string
    service_name: string
    status: string
    status_hex?: string
    status_descriptive_name?: string
    address_string?: string
    lat?: string | number
    lng?: string | number
    followed_at: string
    last_checked: string
    last_known_status?: string
    has_update?: boolean
    updated_datetime?: string
    requested_datetime?: string
    extended_attributes?: Request['extended_attributes']
    escalated_to?: { id: string, label: string, slug?: string }
    unavailable?: boolean
}

const followedReports = ref<FollowedReport[]>([]);
const POLLING_INTERVAL = 60000;
let pollingTimer: NodeJS.Timeout | null = null;

// Load followed reports (called on initialization)
const loadFollowedReports = () => {
    if (import.meta.client) {
        const stored = localStorage.getItem('followedReports');
        followedReports.value = stored ? JSON.parse(stored) : [];
    }
};

// Persist followed reports to localStorage
const persistFollowedReports = () => {
    if (import.meta.client) {
        localStorage.setItem('followedReports', JSON.stringify(followedReports.value));
    }
};

// Function to update last known status AND trigger deep reactivity
const updateFollowedReport = (updatedReport: Request) => {
    const reportIndex = followedReports.value.findIndex(
        r => r.service_request_id === updatedReport.service_request_id
    );

    if (reportIndex !== -1) {
        // Check if status has changed
        const hasStatusChanged = updatedReport.status !== followedReports.value[reportIndex].last_known_status;

        // Create a new object to trigger deep reactivity
        followedReports.value[reportIndex] = {
            ...followedReports.value[reportIndex],
            status: updatedReport.status,
            status_hex: updatedReport.status_hex,
            status_descriptive_name: updatedReport.status_descriptive_name,
            // Update lat/lng if provided in the updated report
            lat: updatedReport.lat || followedReports.value[reportIndex].lat || '',
            lng: updatedReport.lng || followedReports.value[reportIndex].lng || '',
            // Only set has_update to true if the status actually changed
            has_update: hasStatusChanged,
            // Don't update last_known_status if we want to keep track of updates
            last_known_status: hasStatusChanged
                ? followedReports.value[reportIndex].last_known_status
                : updatedReport.status,
            // Preserve extended_attributes for cross-jurisdiction access
            extended_attributes: updatedReport.extended_attributes
        };

        persistFollowedReports();
    }
};

// Computed property for updated reports
const updatedReports = computed(() =>
    followedReports.value.filter(report => report.has_update)
);

// Computed property for update count
const updateCount = computed(() => updatedReports.value.length);

// Check if a report is being followed
const isFollowing = (reportId: string): boolean => {
    return followedReports.value.some(r => r.service_request_id === reportId);
};

// Toggle follow status of a report
const toggleFollow = (report: Request | FollowedReport): boolean => {
    const isCurrentlyFollowing = isFollowing(report.service_request_id);

    if (isCurrentlyFollowing) {
        followedReports.value = followedReports.value.filter(
            r => r.service_request_id !== report.service_request_id
        );
    } else {
        followedReports.value.push({
            service_request_id: report.service_request_id,
            service_name: report.service_name,
            status: report.status,
            last_known_status: report.status,
            status_hex: report.status_hex,
            address_string: report.address_string,
            lat: report.lat || '',
            lng: report.lng || '',
            last_checked: new Date().toISOString(),
            followed_at: new Date().toISOString(),
            has_update: false
        });
    }

    persistFollowedReports();
    return !isCurrentlyFollowing;
};

// Mark a specific report as read
// Mark a specific report as read
const markAsRead = (reportId: string) => {
    const reportIndex = followedReports.value.findIndex(r => r.service_request_id === reportId);
    if (reportIndex !== -1) {
        followedReports.value[reportIndex] = {
            ...followedReports.value[reportIndex],
            has_update: false,
            last_known_status: followedReports.value[reportIndex].status
        };

        persistFollowedReports();
    }
};

// Mark all as read
const markAllAsRead = () => {
    followedReports.value = followedReports.value.map(report => ({
        ...report,
        has_update: false,
        last_known_status: report.status
    }));

    persistFollowedReports();
};

// Handle a report that was escalated to a different jurisdiction
const handleEscalatedReport = (
    report: FollowedReport,
    fetchedReport: Request,
    getJurisdictionById: (id: number) => { slug: string | null } | undefined
) => {
    const reportIndex = followedReports.value.findIndex(
        r => r.service_request_id === report.service_request_id
    );
    if (reportIndex === -1) return;

    // Resolve jurisdiction slug for navigation
    const jurisdictionId = fetchedReport.jurisdiction?.id;
    const jurisdiction = jurisdictionId ? getJurisdictionById(Number(jurisdictionId)) : undefined;

    followedReports.value[reportIndex] = {
        ...followedReports.value[reportIndex],
        status: fetchedReport.status,
        status_hex: fetchedReport.status_hex,
        status_descriptive_name: fetchedReport.status_descriptive_name,
        extended_attributes: fetchedReport.extended_attributes,
        escalated_to: {
            id: fetchedReport.jurisdiction?.id || '',
            label: fetchedReport.jurisdiction?.label || '',
            slug: jurisdiction?.slug || undefined
        },
        unavailable: false,
        has_update: true
    };
    persistFollowedReports();
};

// Handle a report that is no longer available (unpublished, deleted)
const handleUnavailableReport = (report: FollowedReport) => {
    if (report.unavailable) return; // Already marked

    const reportIndex = followedReports.value.findIndex(
        r => r.service_request_id === report.service_request_id
    );
    if (reportIndex === -1) return;

    followedReports.value[reportIndex] = {
        ...followedReports.value[reportIndex],
        unavailable: true,
        escalated_to: undefined
    };
    persistFollowedReports();
};

// Clear escalation/unavailable state (e.g. report re-published or returned to jurisdiction)
const clearEscalationState = (report: FollowedReport) => {
    const reportIndex = followedReports.value.findIndex(
        r => r.service_request_id === report.service_request_id
    );
    if (reportIndex === -1) return;

    followedReports.value[reportIndex] = {
        ...followedReports.value[reportIndex],
        escalated_to: undefined,
        unavailable: false
    };
    persistFollowedReports();
};

// Start polling for updates
// SSR GUARD: Never start polling on server to prevent memory leaks
const startPolling = () => {
    if (import.meta.server) return; // Prevent SSR memory leak
    const requestsStore = useRequestsStore();
    if (pollingTimer) {
        clearInterval(pollingTimer);
    }

    // Do an immediate check on startup
    const checkUpdates = async () => {
        const { currentJurisdictionId } = useMarkASpotConfig();
        const { getById } = useJurisdictions();

        for (const report of followedReports.value) {
            try {
                // Step 1: Try normal fetch (with auto-injected jurisdiction_id)
                const fetchedReport = await requestsStore.fetchRequestById(
                    report.service_request_id,
                    { silent: true }
                );

                if (fetchedReport) {
                    // Report found in current jurisdiction: normal update, clear any escalation
                    if (report.escalated_to || report.unavailable) {
                        clearEscalationState(report);
                    }
                    updateFollowedReport(fetchedReport);
                    continue;
                }

                // Step 2: Normal fetch returned null (404). Try cross-jurisdiction fetch.
                const crossFetched = await requestsStore.fetchRequestById(
                    report.service_request_id,
                    { crossJurisdiction: true, silent: true }
                );

                if (crossFetched) {
                    // Step 3: Cross-jurisdiction succeeded. Check if it moved.
                    const currentJurId = String(currentJurisdictionId.value || '');
                    const reportJurId = crossFetched.jurisdiction?.id || '';

                    if (reportJurId && reportJurId !== currentJurId) {
                        // Report was escalated to a different jurisdiction
                        handleEscalatedReport(report, crossFetched, getById);
                    } else {
                        // Same jurisdiction but 404'd on normal fetch (unpublished?)
                        handleUnavailableReport(report);
                    }
                    continue;
                }

                // Step 4: Both fetches failed. Mark as unavailable.
                handleUnavailableReport(report);
            } catch (error) {
                console.error(`Error fetching report ${report.service_request_id}:`, error);
            }
        }
    };

    // Run immediately
    checkUpdates();

    // Then set up interval
    pollingTimer = setInterval(checkUpdates, POLLING_INTERVAL);
};
// Stop polling
const stopPolling = () => {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
};

// Auto-follow a report from the API response
const autoFollowNewReport = (responseData: unknown) => {
    // Track auto-follow status
    const hasBeenFollowed = ref(false);

    if (!responseData) return hasBeenFollowed;

    try {
        // Safely extract the resource data from various response formats
        const resource = (responseData as any).data || responseData;
        const attrs = (resource as any).attributes || {};

        // Extract key information
        const title = attrs.title || resource.title || attrs.service_name || 'Untitled Report';
        const requestId = (attrs.request_id || resource.id || '').toString();

        // Stop if we don't have an ID to track
        if (!requestId) {
            return hasBeenFollowed;
        }

        // Check if already following
        if (isFollowing(requestId)) {
            hasBeenFollowed.value = true;
            return hasBeenFollowed;
        }

        // Create a normalized report object for following
        const reportToFollow = {
            service_request_id: requestId, // We need this as a unique identifier in the system
            service_name: title,
            status: '', // Empty until server responds (shows "Pending" in UI)
            status_hex: NEUTRAL_FALLBACKS.DEFAULT, // Neutral gray fallback color
            address_string: attrs.address_string || '',
            // Store geolocation data to display on map before first server update
            lat: attrs.lat || resource.lat || (attrs.geolocation && attrs.geolocation.lat) || '',
            lng: attrs.lng || resource.lng || (attrs.geolocation && attrs.geolocation.lng) || '',
            followed_at: new Date().toISOString(),
            last_checked: new Date().toISOString(),
            last_known_status: '', // Empty until server responds
            has_update: false
        };

        // Add to followed reports
        const wasFollowed = toggleFollow(reportToFollow);
        hasBeenFollowed.value = wasFollowed;

        return hasBeenFollowed;
    } catch (error) {
        console.error('Error auto-following report:', error);
        return hasBeenFollowed;
    }
};

// Export the composable with singleton behavior
export const useFollows = () => {
    loadFollowedReports(); // Call this immediately to initialize

    return {
        followedReports,
        updatedReports,
        updateCount,
        isFollowing,
        toggleFollow,
        autoFollowNewReport,
        loadFollowedReports,
        markAsRead,
        markAllAsRead,
        startPolling,
        stopPolling,
        clearEscalationState
    };
};
