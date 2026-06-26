/**
 * Offline Queue Stub Composable (MIT Build)
 *
 * This is a NO-OP stub for MIT builds without the pro layer.
 * The real implementation is in pro-layer/app/composables/offline/useOfflineQueue.ts
 *
 * When the pro layer is loaded, its imports:extend hook removes this stub
 * from auto-imports, so the pro-layer's real implementation is used instead.
 *
 * This stub provides the same interface but does nothing, preventing crashes
 * when components call useOfflineQueue() but pro layer is not available.
 */

export interface QueueStatus {
    pendingCount: number
    failedCount: number
    isSyncing: boolean
    syncProgress: number
    lastSyncAt: number | null
    lastError: string | null
}

export interface SyncResult {
    success: number
    failed: number
    errors: string[]
}

/**
 * Stub implementation - no-op for MIT builds
 */
export function useOfflineQueue() {
    // All values are static/empty - no reactivity needed for stub
    const pendingCount = ref(0);
    const failedCount = ref(0);
    const isSyncing = ref(false);
    const syncProgress = ref(0);

    const status = computed<QueueStatus>(() => ({
        pendingCount: 0,
        failedCount: 0,
        isSyncing: false,
        syncProgress: 0,
        lastSyncAt: null,
        lastError: null
    }));

    // No-op functions (silent in production, warn in dev)
    const enqueue = async (..._args: any[]): Promise<string | null> => {
        if (import.meta.dev) {
            console.warn('[useOfflineQueue] Stub called - pro layer not loaded');
        }
        return null;
    };

    const removeItem = async (_id?: string): Promise<void> => {};
    const getPendingItems = async () => [];
    const getFailedItems = async () => [];
    const getValidationFailedItems = async () => [];
    const getItemForEdit = async () => null;
    const updateAndRetry = async (): Promise<boolean> => false;
    const refreshCounts = async (): Promise<void> => {};
    const syncAll = async (): Promise<SyncResult> => ({ success: 0, failed: 0, errors: [] });
    const retryItem = async (_id?: string): Promise<boolean> => false;
    const initialize = async (): Promise<void> => {};

    return {
        // Status
        status,
        pendingCount: readonly(pendingCount),
        failedCount: readonly(failedCount),
        isSyncing: readonly(isSyncing),
        syncProgress: readonly(syncProgress),

        // Queue management (no-op)
        enqueue,
        removeItem,
        getPendingItems,
        getFailedItems,
        getValidationFailedItems,
        getItemForEdit,
        updateAndRetry,
        refreshCounts,

        // Sync operations (no-op)
        syncAll,
        retryItem,

        // Lifecycle
        initialize
    };
}
