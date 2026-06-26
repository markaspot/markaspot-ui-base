/**
 * Privacy hard-block decision helpers (#473).
 *
 * These guard the two non-button enforcement points:
 *   - privacyBlockValidationError: the keyboard/Enter native-submit path
 *     (S1). Enter in a text field -> @submit.prevent -> handleSubmit ->
 *     getValidationErrors; a non-empty result makes handleSubmit bail and
 *     show validation feedback instead of submitting.
 *   - canDismissPrivacyWarning: the programmatic dismiss path (S2). A
 *     synthetic `dismiss-privacy` event must not clear the block.
 */
import { describe, it, expect } from 'vitest';
import {
    privacyBlockValidationError,
    canDismissPrivacyWarning
} from '@/utils/privacyBlock';

describe('privacyBlockValidationError (S1 keyboard-path guard)', () => {
    it('returns null when not blocked (no error injected, submit proceeds)', () => {
        expect(privacyBlockValidationError(false, 'must replace')).toBeNull();
    });

    it('returns a 400 validation error when blocked, so handleSubmit bails', () => {
        const err = privacyBlockValidationError(true, 'must replace');
        expect(err).not.toBeNull();
        expect(err).toEqual({
            status: '400',
            title: 'Validation Error',
            detail: 'must replace'
        });
    });

    it('surfaces the provided (translated) detail text verbatim', () => {
        const err = privacyBlockValidationError(true, 'report.ai.privacy.required');
        expect(err?.detail).toBe('report.ai.privacy.required');
    });
});

describe('canDismissPrivacyWarning (S2 programmatic-dismiss guard)', () => {
    it('allows dismissal when the tenant does NOT hard-block (legacy advisory)', () => {
        expect(canDismissPrivacyWarning(false)).toBe(true);
    });

    it('forbids dismissal when the tenant hard-blocks', () => {
        expect(canDismissPrivacyWarning(true)).toBe(false);
    });
});
