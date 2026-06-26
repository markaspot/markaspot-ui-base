import { describe, it, expect, vi } from 'vitest';
import { useTileFallback } from '@/composables/map/useTileFallback';

const tileError = (sourceId = 'openmaptiles') => ({ tile: { tileID: {} }, sourceId });

describe('useTileFallback', () => {
    it('counts tile errors but does not trip the fallback before the threshold', () => {
        const applyFallback = vi.fn();
        const fb = useTileFallback({ threshold: 3, getFallbackStyle: () => 'fallback.json', applyFallback });

        expect(fb.handleError(tileError())).toBe(true);
        expect(fb.handleError(tileError())).toBe(true);
        expect(fb.getFailureCount()).toBe(2);
        expect(applyFallback).not.toHaveBeenCalled();
        expect(fb.hasAppliedFallback()).toBe(false);
    });

    it('applies the fallback once the threshold is reached, with the configured style', () => {
        const applyFallback = vi.fn();
        const fb = useTileFallback({ threshold: 3, getFallbackStyle: () => 'fallback.json', applyFallback });

        fb.handleError(tileError());
        fb.handleError(tileError());
        fb.handleError(tileError());

        expect(applyFallback).toHaveBeenCalledTimes(1);
        expect(applyFallback).toHaveBeenCalledWith('fallback.json');
        expect(fb.hasAppliedFallback()).toBe(true);
    });

    it('applies the fallback at most once even under sustained failures', () => {
        const applyFallback = vi.fn();
        const fb = useTileFallback({ threshold: 2, getFallbackStyle: () => 'fallback.json', applyFallback });

        for (let i = 0; i < 10; i++) fb.handleError(tileError());

        expect(applyFallback).toHaveBeenCalledTimes(1);
    });

    it('never switches when no fallback style is configured (e.g. Amsterdam)', () => {
        const applyFallback = vi.fn();
        const fb = useTileFallback({ threshold: 2, getFallbackStyle: () => undefined, applyFallback });

        for (let i = 0; i < 5; i++) fb.handleError(tileError());

        expect(applyFallback).not.toHaveBeenCalled();
        expect(fb.hasAppliedFallback()).toBe(false);
    });

    it('ignores non-tile map errors (no tile / no sourceId)', () => {
        const applyFallback = vi.fn();
        const fb = useTileFallback({ threshold: 1, getFallbackStyle: () => 'fallback.json', applyFallback });

        expect(fb.handleError({})).toBe(false);
        expect(fb.handleError({ sourceId: 'x' })).toBe(false);
        expect(fb.handleError({ tile: {} })).toBe(false);
        expect(fb.getFailureCount()).toBe(0);
        expect(applyFallback).not.toHaveBeenCalled();
    });

    it('defaults to a threshold of 6', () => {
        const applyFallback = vi.fn();
        const fb = useTileFallback({ getFallbackStyle: () => 'fallback.json', applyFallback });

        for (let i = 0; i < 5; i++) fb.handleError(tileError());
        expect(applyFallback).not.toHaveBeenCalled();
        fb.handleError(tileError());
        expect(applyFallback).toHaveBeenCalledTimes(1);
    });

    it('reset() clears the counter and applied flag', () => {
        const applyFallback = vi.fn();
        const fb = useTileFallback({ threshold: 2, getFallbackStyle: () => 'fallback.json', applyFallback });

        fb.handleError(tileError());
        fb.handleError(tileError());
        expect(fb.hasAppliedFallback()).toBe(true);

        fb.reset();
        expect(fb.getFailureCount()).toBe(0);
        expect(fb.hasAppliedFallback()).toBe(false);

        // After reset it can trip again
        fb.handleError(tileError());
        fb.handleError(tileError());
        expect(applyFallback).toHaveBeenCalledTimes(2);
    });
});
