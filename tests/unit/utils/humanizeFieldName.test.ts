/**
 * humanizeFieldName unit tests.
 *
 * The utility is the last-resort label fallback shared between
 * DynamicFieldInput's USwitch aria-label and the dashboard form-mode
 * composable's getFieldLabel. Both call sites must agree, so this test
 * pins the behaviour explicitly.
 */
import { describe, expect, it } from 'vitest';

import { humanizeFieldName } from '../../../app/utils/humanizeFieldName';

describe('humanizeFieldName', () => {
    it('strips the leading field_ prefix', () => {
        expect(humanizeFieldName('field_reassign_sp')).toBe('Reassign Sp');
    });

    it('title-cases each underscore segment', () => {
        expect(humanizeFieldName('field_service_provider_status')).toBe('Service Provider Status');
    });

    it('returns an empty string for empty input', () => {
        expect(humanizeFieldName('')).toBe('');
    });

    it('collapses repeated underscores instead of leaking double-spaces', () => {
        // Empty segments are filtered out so visible labels never carry
        // accidental whitespace from malformed machine names.
        expect(humanizeFieldName('field___foo')).toBe('Foo');
    });

    it('passes through machine names without the field_ prefix', () => {
        expect(humanizeFieldName('priority_flag')).toBe('Priority Flag');
    });

    it('preserves single-segment names', () => {
        expect(humanizeFieldName('flag')).toBe('Flag');
    });
});
