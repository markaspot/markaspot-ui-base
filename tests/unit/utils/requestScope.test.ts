import { describe, expect, it } from 'vitest';

import { getRequestScopedValue } from '@/utils/requestScope';

describe('getRequestScopedValue', () => {
    it('returns the shared client value when no request context exists', () => {
        const clientValue = { count: 0 };
        const first = getRequestScopedValue({
            event: null,
            key: '__cache',
            create: () => ({ count: 1 }),
            clientValue
        });
        const second = getRequestScopedValue({
            event: undefined,
            key: '__cache',
            create: () => ({ count: 2 }),
            clientValue
        });

        expect(first).toBe(clientValue);
        expect(second).toBe(clientValue);
    });

    it('reuses the same value within one request context', () => {
        const event = { context: {} };
        const first = getRequestScopedValue({
            event,
            key: '__cache',
            create: () => ({ count: 1 }),
            clientValue: { count: 0 }
        });
        const second = getRequestScopedValue({
            event,
            key: '__cache',
            create: () => ({ count: 2 }),
            clientValue: { count: 0 }
        });

        expect(first).toBe(second);
        expect(first.count).toBe(1);
    });

    it('isolates values across separate request contexts', () => {
        const firstEvent = { context: {} };
        const secondEvent = { context: {} };

        const first = getRequestScopedValue({
            event: firstEvent,
            key: '__cache',
            create: () => ({ id: 'first' }),
            clientValue: { id: 'client' }
        });
        const second = getRequestScopedValue({
            event: secondEvent,
            key: '__cache',
            create: () => ({ id: 'second' }),
            clientValue: { id: 'client' }
        });

        expect(first).not.toBe(second);
        expect(first.id).toBe('first');
        expect(second.id).toBe('second');
    });
});
