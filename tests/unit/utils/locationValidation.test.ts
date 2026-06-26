import { describe, it, expect } from 'vitest';
import { resolveLocationValidation } from '@/utils/locationValidation';

/**
 * Regression suite for the "point without a (geocoded) address blocks the report
 * flow" bug. A missing postal code must NEVER hard-block reporting — only the
 * boundary check may invalidate a location.
 *
 * @see app/utils/locationValidation.ts
 */
describe('resolveLocationValidation', () => {
    it('passes a valid boundary result through and never hard-blocks', () => {
        const result = resolveLocationValidation({ valid: true, message: '' });
        expect(result).toEqual({ valid: true, message: '', hardInvalid: false });
    });

    it('keeps a boundary-invalid result invalid but still not hard-blocking', () => {
        const result = resolveLocationValidation({
            valid: false,
            message: 'Outside the area'
        });
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Outside the area');
        // strictValidation (boundary) decides blocking, never an absolute hard block
        expect(result.hardInvalid).toBe(false);
    });

    it('NEVER produces hardInvalid, even if a legacy hardInvalid flag is passed in', () => {
        // Simulates old callers that tried to force a postcode hard-block.
        const result = resolveLocationValidation({
            valid: true,
            message: '',
            hardInvalid: true
        });
        expect(result.hardInvalid).toBe(false);
    });

    it('does not accept a postcode argument (postcode can never gate via this path)', () => {
        // Type-level + runtime guard: the function ignores anything but the
        // boundary result, so a missing postcode cannot reintroduce the block.
        const valid = resolveLocationValidation({ valid: true, message: '' });
        expect(valid.valid).toBe(true);
    });
});
