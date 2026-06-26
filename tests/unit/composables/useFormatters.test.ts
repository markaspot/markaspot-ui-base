import { describe, expect, it, beforeEach } from 'vitest';
import { computed, ref } from 'vue';

const mockLocale = ref('de');

// @ts-expect-error test-only auto-import shim
globalThis.computed = computed;
// @ts-expect-error test-only auto-import shim
globalThis.useI18n = () => ({
    locale: mockLocale
});

// eslint-disable-next-line import/first
import { useFormatters } from '~/app/composables/useFormatters';

describe('useFormatters', () => {
    beforeEach(() => {
        mockLocale.value = 'de';
    });

    it('formats dates with the active locale', () => {
        const { formatDateOnly } = useFormatters();
        const date = new Date('2026-05-01T12:00:00Z');

        mockLocale.value = 'en-US';

        expect(formatDateOnly(date)).toBe(new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date));
    });

    it('maps Leichte Sprache to German date formats', () => {
        const { formatDateOnly } = useFormatters();
        const date = new Date('2026-05-01T12:00:00Z');

        mockLocale.value = 'de-ls';

        expect(formatDateOnly(date)).toBe(new Intl.DateTimeFormat('de-DE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date));
    });

    it('returns an empty string for invalid input', () => {
        const { formatDateOnly, formatRelativeDate } = useFormatters();

        expect(formatDateOnly('not-a-date')).toBe('');
        expect(formatRelativeDate(undefined)).toBe('');
    });
});
