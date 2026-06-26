import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetHeader = vi.hoisted(() => vi.fn());

vi.mock('h3', () => ({
    defineEventHandler: (handler: unknown) => handler,
    createError: (opts: { statusCode: number, message?: string }) => {
        const error = new Error(opts.message ?? 'Error') as Error & {
            statusCode?: number
        };
        error.statusCode = opts.statusCode;
        return error;
    },
    getQuery: (event: { _query: Record<string, unknown> }) => event._query,
    setHeader: mockSetHeader,
    setResponseStatus: vi.fn()
}));

const { default: handler } = await import('~/server/api/map-icons.get');

function createEvent(query: Record<string, unknown>) {
    return { _query: query };
}

describe('map icons route', () => {
    beforeEach(() => {
        mockSetHeader.mockClear();
    });

    it('resolves legacy Bonn Lucide icon names', async () => {
        const svg = await handler(createEvent({ icon: 'lucide:tint' }) as never);

        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox="0 0 24 24"');
        expect(mockSetHeader).toHaveBeenCalledWith(expect.anything(), 'Content-Type', 'image/svg+xml');
    });

    it('keeps batch response keys on the requested legacy names', async () => {
        const result = await handler(createEvent({
            icons: 'lucide:tint,lucide:glass,lucide:exclamation'
        }) as never);

        expect(Object.keys(result as Record<string, string>)).toEqual([
            'lucide:tint',
            'lucide:glass',
            'lucide:exclamation'
        ]);
        expect((result as Record<string, string>)['lucide:glass']).toContain('<svg');
        expect(mockSetHeader).toHaveBeenCalledWith(expect.anything(), 'Content-Type', 'application/json');
    });

    it('does not apply Lucide aliases to supported non-Lucide collections', async () => {
        await expect(handler(createEvent({ icon: 'heroicons:exclamation' }) as never))
            .rejects
            .toMatchObject({ statusCode: 404 });
    });
});
