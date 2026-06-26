import { beforeEach, describe, expect, it, vi } from 'vitest';
import { send, setResponseHeader } from 'h3';

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3');
    return {
        ...actual,
        send: vi.fn((_event, data) => data),
        setResponseHeader: vi.fn()
    };
});

vi.mock('https', () => {
    const AgentMock = function () {
        return {};
    };
    const mod = { Agent: AgentMock };
    return { ...mod, default: mod };
});

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockUseRuntimeConfig = vi.fn();
(globalThis as any).useRuntimeConfig = mockUseRuntimeConfig;

const handlerModule = await import('~/server/api/images/[...path]');
const handler = typeof handlerModule.default === 'function'
    ? handlerModule.default
    : (handlerModule.default as any).__handler || handlerModule.default;

const createEvent = (
    path = 'system/files/2025-08/missing.jpg',
    url = `/api/images/${path}`
) => ({
    context: { params: { path } },
    node: {
        req: {
            url,
            headers: { host: 'frontend.example.com' }
        },
        res: {
            statusCode: 200,
            setHeader: vi.fn()
        }
    }
});

describe('image proxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseRuntimeConfig.mockReturnValue({
            public: {
                clientConfig: {
                    features: {
                        media: {
                            proxy: {
                                enabled: true,
                                cacheDuration: 86400
                            }
                        }
                    }
                },
                imageProxyBackend: 'https://backend.example.com/',
                geoReportApiBase: '',
                apiBase: 'https://backend.example.com/'
            },
            proxy: {
                rejectUnauthorized: false
            }
        });
    });

    it('returns a fallback SVG when the upstream Drupal file is missing', async () => {
        mockFetch.mockResolvedValueOnce(new Response('', { status: 404, statusText: 'Not Found' }));
        const event = createEvent();

        const result = await handler(event as any);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://backend.example.com/system/files/2025-08/missing.jpg',
            expect.objectContaining({
                headers: {
                    Accept: 'image/jpeg'
                }
            })
        );
        expect(event.node.res.setHeader).toHaveBeenCalledWith('X-Image-Proxy-Fallback', 'unavailable');
        expect(event.node.res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
        expect(event.node.res.statusCode).toBe(200);
        expect(setResponseHeader).toHaveBeenCalledWith(event, 'content-type', 'image/svg+xml');
        expect(send).toHaveBeenCalledWith(event, expect.any(Buffer));
        expect(result.toString('utf8')).toContain('role="presentation"');
    });

    it('normalizes upstream 500 image errors to a fallback image response', async () => {
        mockFetch.mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }));
        const event = createEvent('system/files/2025-10/IMG_4144.jpeg');

        const result = await handler(event as any);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://backend.example.com/system/files/2025-10/IMG_4144.jpeg',
            expect.objectContaining({
                headers: {
                    Accept: 'image/jpeg'
                }
            })
        );
        expect(event.node.res.setHeader).toHaveBeenCalledWith('X-Image-Proxy-Fallback', 'unavailable');
        expect(event.node.res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
        expect(event.node.res.statusCode).toBe(200);
        expect(setResponseHeader).toHaveBeenCalledWith(event, 'content-type', 'image/svg+xml');
        expect(send).toHaveBeenCalledWith(event, expect.any(Buffer));
        expect(result.toString('utf8')).toContain('role="presentation"');
    });

    it('keeps server-side cache entries version-aware', async () => {
        const path = 'system/files/2026-05/photo-versioned.jpg';
        mockFetch
            .mockResolvedValueOnce(new Response('first', {
                status: 200,
                headers: { 'content-type': 'image/jpeg' }
            }))
            .mockResolvedValueOnce(new Response('second', {
                status: 200,
                headers: { 'content-type': 'image/jpeg' }
            }));

        await handler(createEvent(path, `/api/images/${path}?v=one`) as any);
        await handler(createEvent(path, `/api/images/${path}?v=two`) as any);

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});
