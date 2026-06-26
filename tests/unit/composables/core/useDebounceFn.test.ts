import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounceFn } from '@/composables/core/useDebounceFn';

/**
 * useDebounceFn Tests
 *
 * This composable delays function execution until after a pause in calls.
 * Common use case: search input where you don't want to search on every keystroke
 */

describe('useDebounceFn', () => {
    beforeEach(() => {
    // Use fake timers so we control when time passes
        vi.useFakeTimers();
    });

    afterEach(() => {
    // Clean up after each test
        vi.restoreAllMocks();
    });

    it('should delay function execution', () => {
    // Arrange: Create a mock function to track calls
        const mockFn = vi.fn();
        const debouncedFn = useDebounceFn(mockFn, 500);

        // Act: Call the debounced function
        debouncedFn('hello');

        // Assert: Function should NOT be called immediately
        expect(mockFn).not.toHaveBeenCalled();

        // Fast-forward time by 500ms
        vi.advanceTimersByTime(500);

        // Assert: NOW the function should be called
        expect(mockFn).toHaveBeenCalledOnce();
        expect(mockFn).toHaveBeenCalledWith('hello');
    });

    it('should cancel previous call if called again within delay', () => {
    // Arrange
        const mockFn = vi.fn();
        const debouncedFn = useDebounceFn(mockFn, 500);

        // Act: Rapid calls (like typing "cat" quickly)
        debouncedFn('c');
        vi.advanceTimersByTime(100); // Only 100ms passed

        debouncedFn('ca');
        vi.advanceTimersByTime(100); // Another 100ms

        debouncedFn('cat');
        vi.advanceTimersByTime(100); // Another 100ms (total 300ms)

        // Assert: Still not called because we keep resetting the timer
        expect(mockFn).not.toHaveBeenCalled();

        // Now wait the full delay from the last call
        vi.advanceTimersByTime(400); // 100 + 400 = 500ms from last call

        // Assert: Only the LAST call should execute
        expect(mockFn).toHaveBeenCalledOnce();
        expect(mockFn).toHaveBeenCalledWith('cat');
    });

    it('should handle multiple arguments', () => {
    // Arrange
        const mockFn = vi.fn();
        const debouncedFn = useDebounceFn(mockFn, 300);

        // Act
        debouncedFn('user', 123, { active: true });
        vi.advanceTimersByTime(300);

        // Assert: All arguments passed correctly
        expect(mockFn).toHaveBeenCalledWith('user', 123, { active: true });
    });

    it('should work with different delay times', () => {
    // Arrange
        const mockFn = vi.fn();
        const shortDebounce = useDebounceFn(mockFn, 100);
        const longDebounce = useDebounceFn(mockFn, 1000);

        // Act: Call short debounce
        shortDebounce('quick');
        vi.advanceTimersByTime(100);
        expect(mockFn).toHaveBeenCalledOnce();

        // Act: Call long debounce
        mockFn.mockClear(); // Reset call count
        longDebounce('slow');
        vi.advanceTimersByTime(500);
        expect(mockFn).not.toHaveBeenCalled(); // Not enough time

        vi.advanceTimersByTime(500); // Total 1000ms
        expect(mockFn).toHaveBeenCalledOnce();
    });

    it('should preserve function return type (TypeScript)', () => {
    // This test verifies TypeScript types work correctly
        const addNumbers = (a: number, b: number): number => a + b;
        const debouncedAdd = useDebounceFn(addNumbers, 100);

        // TypeScript should allow this (correct types)
        debouncedAdd(5, 10);

        // @ts-expect-error - TypeScript should error on wrong types
        debouncedAdd('wrong', 'types');
    });

    it('real-world example: search input debouncing', () => {
    // Simulate a search API call
        const searchAPI = vi.fn();
        const debouncedSearch = useDebounceFn(searchAPI, 300);

        // User types "mark-a-spot" quickly
        'mark-a-spot'.split('').forEach((char, index) => {
            debouncedSearch(char);
            vi.advanceTimersByTime(50); // 50ms between keystrokes
        });

        // Even though user typed 12 characters, API not called yet
        expect(searchAPI).not.toHaveBeenCalled();

        // User stops typing, wait 300ms
        vi.advanceTimersByTime(250); // 50ms from last keystroke + 250ms = 300ms

        // NOW the search executes (only once!)
        expect(searchAPI).toHaveBeenCalledOnce();
    });
});
