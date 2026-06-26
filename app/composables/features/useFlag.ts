// ~/composables/features/useFlag.ts

import type { MaybeRef } from 'vue';

const STORAGE_KEY_PREFIX = 'mas_flagged_';

/**
 * Flag Composable
 *
 * Manages flag/report state per service request using localStorage.
 * SSR-safe: all localStorage access is guarded and wrapped in try/catch
 * for private browsing compatibility.
 *
 * @param reportId - The service_request_id to track flag state for
 * @returns Reactive state and submit method for flagging
 */
export function useFlag(reportId: MaybeRef<string>) {
    const isFlagged = ref(false);
    const isSubmitting = ref(false);

    const storageKey = computed(() => `${STORAGE_KEY_PREFIX}${toValue(reportId)}`);

    // Check localStorage on client
    const checkFlagStatus = () => {
        if (!import.meta.client) return;
        try {
            isFlagged.value = localStorage.getItem(storageKey.value) === 'true';
        } catch {
            // localStorage unavailable (private browsing, quota exceeded)
            isFlagged.value = false;
        }
    };

    // Initialize on client
    if (import.meta.client) {
        checkFlagStatus();
    }

    // Re-check when reportId changes
    watch(() => toValue(reportId), () => {
        checkFlagStatus();
    });

    /**
     * Submit a flag for this report.
     *
     * @param reason - The flag reason (spam, offensive, personal, location, other)
     * @param details - Optional additional details
     * @returns true on success, false on error
     */
    const submitFlag = async (reason: string, details?: string): Promise<boolean> => {
        isSubmitting.value = true;

        try {
            await $fetch('/api/flags', {
                method: 'POST',
                body: {
                    service_request_id: toValue(reportId),
                    reason,
                    details
                }
            });

            // Persist flag state
            try {
                localStorage.setItem(storageKey.value, 'true');
            } catch {
                // localStorage unavailable, flag state won't persist across reloads
            }

            isFlagged.value = true;
            return true;
        } catch (error) {
            console.error('Failed to submit flag:', error);
            return false;
        } finally {
            isSubmitting.value = false;
        }
    };

    return {
        isFlagged: readonly(isFlagged),
        isSubmitting: readonly(isSubmitting),
        submitFlag
    };
}
