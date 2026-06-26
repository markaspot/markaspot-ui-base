// types/error.ts

export interface ErrorState {
    isVisible: boolean
    message: string
    // Meta data for the overall error state
    meta?: Record<string, unknown>
    errors: Array<{
        field: string
        message: string
        code?: string
        // Meta data for individual errors (like waitTime for rate limits)
        meta?: Record<string, unknown>
    }>
}

/**
 * State for duplicate hint warnings (not hard blocks)
 * When detected, user can acknowledge and resubmit
 */
export interface DuplicateHintState {
    isVisible: boolean
    message: string
    existingReport?: {
        id: string
        nid: string
        url: string
    }
}

export class ApiError extends Error {
    // Add property for the original server message
    public originalMessage?: string;

    constructor(
        public status: number,
        public statusText: string,
        public data: unknown
    ) {
        super(`API Error: ${status} ${statusText}`);
        this.name = 'ApiError';

        // Try to extract the original message from data
        if (data && typeof data === 'object') {
            const d = data as Record<string, unknown>;
            if (typeof d.message === 'string') {
                this.originalMessage = d.message;
            } else if (d.data && typeof d.data === 'object') {
                const nested = d.data as Record<string, unknown>;
                if (typeof nested.message === 'string') {
                    this.originalMessage = nested.message;
                }
            }
        }
    }
}
