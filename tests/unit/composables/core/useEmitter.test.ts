import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEmitter } from '@/composables/core/useEmitter';

/**
 * useEmitter Tests - Event Bus Logic
 *
 * Tests the pub/sub pattern used across components.
 * Critical because bugs here cause "component not updating" issues.
 */

describe('useEmitter', () => {
    beforeEach(() => {
    // Clear all event listeners between tests
        const emitter = useEmitter();
        emitter.all.clear();
    });

    /**
   * Test 1: Basic emit and receive
   * Most important - verifies events work at all
   */
    it('should emit and receive events', () => {
        const emitter = useEmitter();
        const handler = vi.fn();

        // Subscribe to event
        emitter.on('show-page', handler);

        // Emit event
        emitter.emit('show-page', { id: 123 });

        // Verify handler was called with correct data
        expect(handler).toHaveBeenCalledOnce();
        expect(handler).toHaveBeenCalledWith({ id: 123 });
    });

    /**
   * Test 2: Multiple listeners on same event
   * Real-world: Multiple components listen to same event
   */
    it('should support multiple listeners on same event', () => {
        const emitter = useEmitter();
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        const handler3 = vi.fn();

        // Three components subscribe
        emitter.on('show-page', handler1);
        emitter.on('show-page', handler2);
        emitter.on('show-page', handler3);

        // One event emission
        emitter.emit('show-page', { id: 456 });

        // All three should receive it
        expect(handler1).toHaveBeenCalledWith({ id: 456 });
        expect(handler2).toHaveBeenCalledWith({ id: 456 });
        expect(handler3).toHaveBeenCalledWith({ id: 456 });
    });

    /**
   * Test 3: Unsubscribe works (prevents memory leaks)
   * Critical: Components must clean up on unmount
   */
    it('should unsubscribe listeners', () => {
        const emitter = useEmitter();
        const handler = vi.fn();

        // Subscribe
        emitter.on('show-page', handler);

        // Unsubscribe
        emitter.off('show-page', handler);

        // Emit after unsubscribe
        emitter.emit('show-page', { id: 789 });

        // Handler should NOT be called
        expect(handler).not.toHaveBeenCalled();
    });

    /**
   * Test 4: Singleton pattern - same instance everywhere
   * Critical: All components must share the same emitter
   */
    it('should return same instance (singleton)', () => {
        const emitter1 = useEmitter();
        const emitter2 = useEmitter();

        // Both should be the exact same object
        expect(emitter1).toBe(emitter2);

        // Verify by testing shared state
        const handler = vi.fn();
        emitter1.on('show-page', handler);

        emitter2.emit('show-page', { id: 999 });

        expect(handler).toHaveBeenCalledWith({ id: 999 });
    });

    /**
   * Test 5: Only specific listener unsubscribes
   * Bug scenario: Unsubscribing one listener shouldn't affect others
   */
    it('should only unsubscribe the specific handler', () => {
        const emitter = useEmitter();
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        emitter.on('show-page', handler1);
        emitter.on('show-page', handler2);

        // Unsubscribe only handler1
        emitter.off('show-page', handler1);

        emitter.emit('show-page', { id: 111 });

        // handler1 should NOT be called
        expect(handler1).not.toHaveBeenCalled();

        // handler2 SHOULD still be called
        expect(handler2).toHaveBeenCalledWith({ id: 111 });
    });

    /**
   * Test 6: Emitting with no listeners doesn't crash
   * Edge case: Event emitted before anyone subscribes
   */
    it('should handle emit with no listeners', () => {
        const emitter = useEmitter();

        // Should not throw error
        expect(() => {
            emitter.emit('show-page', { id: 222 });
        }).not.toThrow();
    });

    /**
   * Test 7: Can emit without data
   * Some events are just signals, no payload needed
   */
    it('should emit events without data', () => {
        const emitter = useEmitter();
        const handler = vi.fn();

        emitter.on('show-page', handler);
        emitter.emit('show-page');

        expect(handler).toHaveBeenCalledOnce();
        expect(handler).toHaveBeenCalledWith(undefined);
    });

    /**
   * Test 8: Real-world scenario - Component lifecycle
   * Shows how components actually use this
   */
    it('real-world: component mount and unmount flow', () => {
        const emitter = useEmitter();
        const handler = vi.fn();

        // Component A mounts, subscribes
        emitter.on('show-page', handler);

        // Component B emits
        emitter.emit('show-page', { id: 333 });
        expect(handler).toHaveBeenCalledOnce();

        // Component A unmounts, unsubscribes
        emitter.off('show-page', handler);

        // Component B emits again
        emitter.emit('show-page', { id: 444 });

        // Handler should still only have been called once (before unmount)
        expect(handler).toHaveBeenCalledOnce();
    });
});
