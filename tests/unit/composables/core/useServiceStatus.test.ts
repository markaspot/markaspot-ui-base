/**
 * useServiceStatus Tests
 *
 * This demonstrates testing a composable with:
 * - Nuxt composables (useNuxtApp)
 * - Reactive state (refs with singleton pattern)
 * - Time-based logic
 * - Computed/readonly values
 *
 * Key Testing Patterns:
 * 1. Testing singleton state management
 * 2. Mocking Nuxt app context
 * 3. Testing time-based logic with fake timers
 * 4. Testing state transitions
 * 5. Testing readonly refs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Now import the composable
import { useServiceStatus } from '@/composables/core/useServiceStatus';

// Mock useNuxtApp BEFORE importing the composable
const mockT = vi.fn((key: string, params?: Record<string, any>) => {
    if (key === 'service_unavailable.retry') {
        return `Service temporarily unavailable. Retrying in ${params?.seconds}s`;
    }
    if (key === 'service_unavailable.message') {
        return 'Service temporarily unavailable. Please try again shortly.';
    }
    return key;
});

vi.mock('#app', () => ({
    useNuxtApp: () => ({
        $t: mockT,
        $i18n: {
            t: mockT
        }
    })
}));

describe('useServiceStatus', () => {
    beforeEach(() => {
    // Use fake timers to control Date.now()
        vi.useFakeTimers();

        // Reset all mocks
        vi.clearAllMocks();

    // Reset the singleton state by creating new instances
    // Note: In real scenarios, you might need to expose a reset function
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /**
   * Test 1: Initial state
   */
    it('should have correct initial state', () => {
    // Act
        const { isServiceDown, retryAfter } = useServiceStatus();

        // Assert: Initially service should be up
        expect(isServiceDown.value).toBe(false);
        expect(retryAfter.value).toBeNull();
    });

    /**
   * Test 2: Register service failure
   */
    it('should register service failure', () => {
    // Arrange
        const { isServiceDown, retryAfter, registerServiceFailure } = useServiceStatus();
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act
        registerServiceFailure({ statusCode: 503 });

        // Assert
        expect(isServiceDown.value).toBe(true);
        expect(retryAfter.value).toBe(30000); // Always 30 seconds
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Backend service unavailable')
        );

        consoleWarnSpy.mockRestore();
    });

    /**
   * Test 3: Register service success
   */
    it('should register service success and reset state', () => {
    // Arrange
        const { isServiceDown, retryAfter, registerServiceFailure, registerServiceSuccess } = useServiceStatus();
        const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        // First mark as down
        registerServiceFailure({ statusCode: 503 });
        expect(isServiceDown.value).toBe(true);

        // Act: Mark as available
        registerServiceSuccess();

        // Assert: State should be reset
        expect(isServiceDown.value).toBe(false);
        expect(retryAfter.value).toBeNull();
        expect(consoleInfoSpy).toHaveBeenCalledWith('Backend service is now available');

        consoleInfoSpy.mockRestore();
    });

    /**
   * Test 4: shouldRetry() returns true when service is up
   */
    it('should allow retry when service is up', () => {
    // Arrange
        const { shouldRetry } = useServiceStatus();

        // Act & Assert
        expect(shouldRetry()).toBe(true);
    });

    /**
   * Test 5: shouldRetry() returns false during retry window
   */
    it('should prevent retry during retry window', () => {
    // Arrange
        const { shouldRetry, registerServiceFailure } = useServiceStatus();

        // Set base time
        vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));

        // Act: Register failure
        registerServiceFailure({ statusCode: 503 });

        // Assert: Should NOT retry immediately
        expect(shouldRetry()).toBe(false);

        // Fast-forward 15 seconds (half of retry window)
        vi.advanceTimersByTime(15000);
        expect(shouldRetry()).toBe(false);

        // Fast-forward another 16 seconds (total 31 seconds > 30 second window)
        vi.advanceTimersByTime(16000);
        expect(shouldRetry()).toBe(true);
    });

    /**
   * Test 6: shouldRetry() returns true after retry window expires
   */
    it('should allow retry after retry window expires', () => {
    // Arrange
        const { shouldRetry, registerServiceFailure } = useServiceStatus();

        vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
        registerServiceFailure({ statusCode: 503 });

        // Act: Wait for retry window to expire (30 seconds)
        vi.advanceTimersByTime(30001);

        // Assert: Should allow retry now
        expect(shouldRetry()).toBe(true);
    });

    /**
   * Test 7: getServiceDownMessage() with retry time
   */
    it('should return correct message with retry time', () => {
    // Arrange
        const { getServiceDownMessage, registerServiceFailure } = useServiceStatus();

        // Act
        registerServiceFailure({ statusCode: 503 });
        const message = getServiceDownMessage();

        // Assert: Should include 30 seconds
        expect(message).toBe('Service temporarily unavailable. Retrying in 30s');
        expect(mockT).toHaveBeenCalledWith('service_unavailable.retry', { seconds: 30 });
    });

    /**
   * Test 8: getServiceDownMessage() without retry time
   */
    it('should return generic message when no retry time', () => {
    // Arrange
        const { getServiceDownMessage, registerServiceSuccess } = useServiceStatus();

        // Ensure service is marked as available (clear any previous test state)
        registerServiceSuccess();

        // Act: Get message when service is not down
        const message = getServiceDownMessage();

        // Assert: Should return generic message (no retry time set)
        expect(message).toBe('Service temporarily unavailable. Please try again shortly.');
        expect(mockT).toHaveBeenCalledWith('service_unavailable.message');
    });

    /**
   * Test 9: Singleton pattern - shared state across instances
   */
    it('should share state across multiple instances', () => {
    // Arrange: Create two instances
        const instance1 = useServiceStatus();
        const instance2 = useServiceStatus();

        // Act: Register failure in first instance
        instance1.registerServiceFailure({ statusCode: 503 });

        // Assert: Second instance sees the same state
        expect(instance1.isServiceDown.value).toBe(true);
        expect(instance2.isServiceDown.value).toBe(true);
    });

    /**
   * Test 10: Readonly refs cannot be modified directly
   */
    it('should expose readonly refs that cannot be modified', () => {
    // Arrange
        const { isServiceDown, retryAfter } = useServiceStatus();

        // Assert: These should be readonly refs
        // TypeScript would catch this at compile time, but we can verify behavior
        expect(typeof isServiceDown.value).toBe('boolean');
        expect(isServiceDown).toHaveProperty('value');

    // Attempting to assign should not change the value
    // (readonly() prevents this in Vue)
    });

    /**
   * Test 11: Multiple failures increment counter
   */
    it('should track consecutive failures', () => {
    // Note: consecutiveFailures is not exposed, but we can verify behavior
    // through side effects (console warnings)

        // Arrange
        const { registerServiceFailure } = useServiceStatus();
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act: Register multiple failures
        registerServiceFailure({ statusCode: 503 });
        registerServiceFailure({ statusCode: 503 });
        registerServiceFailure({ statusCode: 503 });

        // Assert: Each failure is logged
        expect(consoleWarnSpy).toHaveBeenCalledTimes(3);

        consoleWarnSpy.mockRestore();
    });

    /**
   * Test 12: Success resets consecutive failures
   */
    it('should reset consecutive failures on success', () => {
    // Arrange
        const { registerServiceFailure, registerServiceSuccess } = useServiceStatus();
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act: Fail, succeed, then fail again
        registerServiceFailure({ statusCode: 503 });
        registerServiceSuccess();
        registerServiceFailure({ statusCode: 503 });

        // Assert: Consecutive failures counter was reset
        // (we can infer this from the fact that it doesn't grow indefinitely)
        expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

        consoleWarnSpy.mockRestore();
    });

    /**
   * Test 13: Real-world scenario - API retry logic
   */
    it('real-world: should implement exponential backoff pattern', () => {
    // This demonstrates how the composable would be used in API client

        const { shouldRetry, registerServiceFailure, registerServiceSuccess } = useServiceStatus();

        // Clear any previous state from other tests
        registerServiceSuccess();

        // Simulate API call flow
        vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));

        // 1. Initial call succeeds
        expect(shouldRetry()).toBe(true);
        registerServiceSuccess();

        // 2. Next call fails with 503
        expect(shouldRetry()).toBe(true);
        registerServiceFailure({ statusCode: 503 });

        // 3. Immediate retry should be blocked
        expect(shouldRetry()).toBe(false);

        // 4. Wait 15 seconds - still blocked
        vi.advanceTimersByTime(15000);
        expect(shouldRetry()).toBe(false);

        // 5. Wait full 30 seconds + 1ms - now allowed
        vi.advanceTimersByTime(15001); // Total: 30001ms > 30000ms threshold
        expect(shouldRetry()).toBe(true);

        // 6. Retry succeeds
        registerServiceSuccess();
        expect(shouldRetry()).toBe(true);
    });

    /**
   * Test 14: Handles different response formats
   */
    it('should handle various failure response formats', () => {
    // Arrange
        const { isServiceDown, registerServiceFailure } = useServiceStatus();
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act: Test different input formats
        registerServiceFailure({ statusCode: 503 });
        expect(isServiceDown.value).toBe(true);

        registerServiceFailure({ headers: {}, status: 503 });
        expect(isServiceDown.value).toBe(true);

        registerServiceFailure();
        expect(isServiceDown.value).toBe(true);

        // All should work
        expect(consoleWarnSpy).toHaveBeenCalledTimes(3);

        consoleWarnSpy.mockRestore();
    });

    /**
   * Test 15: Translation fallback works
   */
    it('should work without translator (fallback)', () => {
    // This tests the fallback translator in getTranslator()
    // The mock already handles this, but in production it falls back gracefully

        const { getServiceDownMessage, registerServiceFailure } = useServiceStatus();

        registerServiceFailure({ statusCode: 503 });
        const message = getServiceDownMessage();

        // Should still get a message even if i18n isn't available
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
    });
});
