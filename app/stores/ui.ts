import { defineStore } from 'pinia';

/**
 * Store for global UI state management
 */
export const useUIStore = defineStore('ui', {
    state: () => ({
    // Loading states for different operations
        loadingStates: {
            requests: false,
            singleRequest: false,
            categories: false,
            submission: false
        } as Record<string, boolean>,

        // Error states
        errors: {
            global: null as string | null,
            requests: null as string | null,
            submission: null as string | null
        },

        // Toast/notification queue
        notifications: [] as Array<{
            id: string
            type: 'success' | 'error' | 'warning' | 'info'
            title: string
            description?: string
            timeout?: number
            timestamp: number
        }>,

        // Modal states
        modals: {
            reportDetail: false,
            reportForm: false,
            feedback: false,
            pageContent: false
        },

        // Layout states
        layout: {
            sidebarCollapsed: false,
            mapFullscreen: false,
            bottomSheetExpanded: false
        },

        // Map pick mode state
        mapPickMode: {
            active: false,
            initialCoords: null as { lat: number, lng: number } | null,
            returnRoute: null as string | { path: string, query?: Record<string, string> } | null
        },

        // Last map location for restoration
        lastMapLocation: null as { lat: number, lng: number, address?: string } | null
    }),

    getters: {
    /**
     * Check if any loading operation is active
     */
        isAnyLoading: (state): boolean => {
            return Object.values(state.loadingStates).some(loading => loading);
        },

        /**
     * Get active notifications
     */
        activeNotifications: (state) => {
            const now = Date.now();
            return state.notifications.filter((notification) => {
                const timeout = notification.timeout || 5000;
                return now - notification.timestamp < timeout;
            });
        },

        /**
     * Check if any modal is open
     */
        hasOpenModal: (state): boolean => {
            return Object.values(state.modals).some(open => open);
        },

        /**
     * Get error summary
     */
        errorSummary: (state) => {
            const activeErrors = Object.entries(state.errors)
                .filter(([, error]) => error !== null)
                .map(([key, error]) => ({ key, error }));

            return {
                hasErrors: activeErrors.length > 0,
                count: activeErrors.length,
                errors: activeErrors
            };
        }
    },

    actions: {
    /**
     * Set loading state for specific operation
     */
        setLoading(operation: string, loading: boolean): void {
            this.loadingStates[operation] = loading;
        },

        /**
     * Set error for specific context
     */
        setError(context: string, error: string | null): void {
            if (context in this.errors) {
                (this.errors as any)[context] = error;
            }
        },

        /**
     * Clear all errors
     */
        clearErrors(): void {
            Object.keys(this.errors).forEach((key) => {
                (this.errors as any)[key] = null;
            });
        },

        /**
     * Add notification
     */
        addNotification(
            type: 'success' | 'error' | 'warning' | 'info',
            title: string,
            description?: string,
            timeout?: number
        ): void {
            const notification = {
                id: `notification-${Date.now()}-${Math.random()}`,
                type,
                title,
                description,
                timeout,
                timestamp: Date.now()
            };

            this.notifications.push(notification);

            // Auto-cleanup after timeout
            if (timeout) {
                setTimeout(() => {
                    this.removeNotification(notification.id);
                }, timeout);
            }
        },

        /**
     * Remove notification by ID
     */
        removeNotification(id: string): void {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
                this.notifications.splice(index, 1);
            }
        },

        /**
     * Clear all notifications
     */
        clearNotifications(): void {
            this.notifications = [];
        },

        /**
     * Set modal state
     */
        setModal(modalName: string, open: boolean): void {
            if (modalName in this.modals) {
                (this.modals as any)[modalName] = open;
            }
        },

        /**
     * Close all modals
     */
        closeAllModals(): void {
            Object.keys(this.modals).forEach((key) => {
                (this.modals as any)[key] = false;
            });
        },

        /**
     * Set layout state
     */
        setLayout(layoutKey: string, value: boolean): void {
            if (layoutKey in this.layout) {
                (this.layout as any)[layoutKey] = value;
            }
        },

        /**
     * Start map pick mode
     */
        startMapPickMode(coords?: { lat: number, lng: number }, returnRoute?: string | { path: string, query?: Record<string, string> }): void {
            this.mapPickMode.active = true;
            this.mapPickMode.initialCoords = coords || null;
            this.mapPickMode.returnRoute = returnRoute || null;
        },

        /**
     * End map pick mode
     */
        endMapPickMode(): void {
            this.mapPickMode.active = false;
            this.mapPickMode.initialCoords = null;
            this.mapPickMode.returnRoute = null;
        },

        /**
     * Set last map location for restoration
     */
        setLastMapLocation(location: { lat: number, lng: number, address?: string }): void {
            this.lastMapLocation = location;
        },

        /**
     * Clear last map location
     */
        clearLastMapLocation(): void {
            this.lastMapLocation = null;
        },

        /**
     * Reset all UI state
     */
        reset(): void {
            // Reset loading states
            Object.keys(this.loadingStates).forEach((key) => {
                this.loadingStates[key] = false;
            });

            // Clear errors
            this.clearErrors();

            // Clear notifications
            this.clearNotifications();

            // Close modals
            this.closeAllModals();

            // Reset layout
            Object.keys(this.layout).forEach((key) => {
                (this.layout as any)[key] = false;
            });

            // Reset map pick mode
            this.endMapPickMode();

            // Clear last map location
            this.clearLastMapLocation();
        }
    }
});

// Enable Pinia HMR in development to prevent "getActivePinia()" errors
// when Vite hot-reloads this store module
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useUIStore, import.meta.hot));
}
