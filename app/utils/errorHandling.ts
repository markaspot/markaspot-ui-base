/**
 * Centralized error handling utilities
 */

export interface AppError {
    message: string
    code?: string
    context?: Record<string, unknown>
    timestamp: number
}

/**
 * Create standardized error objects
 */
export function createAppError(message: string, code?: string, context?: Record<string, unknown>): AppError {
    return {
        message,
        code,
        context,
        timestamp: Date.now()
    };
}

/**
 * Log errors in a consistent format
 */
export function logError(error: AppError | Error | string, prefix = 'App Error'): void {
    if (typeof error === 'string') {
        console.error(`${prefix}:`, error);
        return;
    }

    if (error instanceof Error) {
        console.error(`${prefix}:`, error.message, error.stack);
        return;
    }

    // AppError object
    console.error(`${prefix}:`, {
        message: error.message,
        code: error.code,
        context: error.context,
        timestamp: new Date(error.timestamp).toISOString()
    });
}

/**
 * Handle API errors with appropriate user messages
 */
export function handleApiError(error: any, operation = 'API operation'): AppError {
    let message = `Failed to ${operation}`;
    let code = 'API_ERROR';

    if (error?.response?.status) {
        code = `HTTP_${error.response.status}`;

        switch (error.response.status) {
            case 400:
                message = 'Invalid request data';
                break;
            case 401:
                message = 'Authentication required';
                break;
            case 403:
                message = 'Access denied';
                break;
            case 404:
                message = 'Resource not found';
                break;
            case 429:
                message = 'Too many requests - please try again later';
                break;
            case 500:
                message = 'Server error - please try again';
                break;
            default:
                message = `Request failed with status ${error.response.status}`;
        }
    } else if (error?.message) {
        message = error.message;
    }

    return createAppError(message, code, {
        originalError: error,
        operation
    });
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2
): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                throw error;
            }

            // Wait before retry with exponential backoff
            const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, waitTime));

            console.warn(`Operation failed, retrying (${attempt}/${maxRetries})...`, error);
        }
    }

    throw lastError;
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    errorHandler?: (error: any) => void
): Promise<T | undefined> {
    try {
        return await operation();
    } catch (error) {
        if (errorHandler) {
            errorHandler(error);
        } else {
            logError(error instanceof Error ? error : String(error), 'Safe Async');
        }

        return fallback;
    }
}

/**
 * Debounced error reporter to prevent spam
 */
class DebouncedErrorReporter {
    private errorCounts = new Map<string, number>();
    private lastReportTime = new Map<string, number>();
    private readonly debounceTime = 5000; // 5 seconds

    report(error: AppError): void {
        const key = `${error.code || 'UNKNOWN'}_${error.message}`;
        const now = Date.now();
        const lastReport = this.lastReportTime.get(key) || 0;
        const count = this.errorCounts.get(key) || 0;

        this.errorCounts.set(key, count + 1);

        // Only report if enough time has passed or it's the first occurrence
        if (now - lastReport > this.debounceTime || count === 0) {
            this.lastReportTime.set(key, now);

            const reportedError = {
                ...error,
                occurrences: this.errorCounts.get(key) || 1
            };

            logError(reportedError, 'Debounced Error');
        }
    }

    getStats(): Record<string, number> {
        return Object.fromEntries(this.errorCounts.entries());
    }

    clear(): void {
        this.errorCounts.clear();
        this.lastReportTime.clear();
    }
}

export const errorReporter = new DebouncedErrorReporter();
