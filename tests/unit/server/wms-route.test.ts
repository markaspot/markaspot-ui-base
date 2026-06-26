import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn((_event, data) => data));
const mockSetResponseHeader = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());
const mockUseRuntimeConfig = vi.hoisted(() => vi.fn());

vi.mock('h3', () => ({
    createError: (opts: { statusCode: number, statusMessage?: string, message?: string }) => {
        const error = new Error(opts.statusMessage ?? opts.message ?? 'Error') as Error & {
            statusCode?: number
            statusMessage?: string
        };
        error.statusCode = opts.statusCode;
        error.statusMessage = opts.statusMessage;
        return error;
    },
    getQuery: (event: { _query: Record<string, unknown> }) => event._query,
    getRequestURL: () => new URL('https://frontend.example.test/api/wms'),
    send: mockSend,
    setResponseHeader: mockSetResponseHeader
}));

vi.mock('https', () => {
    const AgentMock = function () {
        return {};
    };
    const mod = { Agent: AgentMock };
    return { ...mod, default: mod };
});

(globalThis as any).defineEventHandler = (handler: unknown) => handler;
(globalThis as any).useRuntimeConfig = mockUseRuntimeConfig;
(globalThis as any).fetch = mockFetch;

const { default: handler } = await import('~/server/api/wms.get');

function createEvent(query: Record<string, unknown>) {
    return { _query: query };
}

function tenantSettings(layerName = 'v_denkmalsatzung_p_33036') {
    return {
        features: {
            customWmsLayers: true,
            map: {
                wmsLayers: [
                    {
                        title: 'Denkmalbereiche',
                        layerName,
                        url: 'https://gdi.bonn.de/geoserver/denkmal/wms'
                    }
                ]
            }
        }
    };
}

function setRuntimeConfig(wmsAllowedHosts = 'gdi.bonn.de') {
    mockUseRuntimeConfig.mockReturnValue({
        public: {
            geoReportApiBase: 'https://management.example.test',
            apiBase: ''
        },
        proxy: {
            rejectUnauthorized: true,
            wmsAllowedHosts
        }
    });
}

describe('WMS proxy route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.NUXT_WMS_ALLOWED_HOSTS;
        setRuntimeConfig();
    });

    it('normalizes GetLegendGraphic and rejects upstream XML errors', async () => {
        mockFetch
            .mockResolvedValueOnce(new Response(JSON.stringify(tenantSettings()), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }))
            .mockResolvedValueOnce(new Response('<ServiceExceptionReport />', {
                status: 200,
                headers: { 'content-type': 'application/vnd.ogc.se_xml;charset=UTF-8' }
            }));

        await expect(handler(createEvent({
            SERVICE: 'WMS',
            VERSION: '1.1.1',
            REQUEST: 'GetLegendGraphic',
            LAYER: 'v_denkmalsatzung_p_33036',
            STYLE: '',
            FORMAT: 'image/png',
            jurisdiction: 'bonn-mobility'
        }) as never)).rejects.toMatchObject({
            statusCode: 502,
            statusMessage: 'Failed to fetch WMS layer.'
        });

        const upstreamUrl = new URL(mockFetch.mock.calls[1][0]);
        expect(upstreamUrl.searchParams.get('REQUEST')).toBe('GetLegendGraphic');
        expect(upstreamUrl.searchParams.get('LAYER')).toBe('v_denkmalsatzung_p_33036');
        expect(upstreamUrl.searchParams.get('FORMAT')).toBe('image/png');
        expect(upstreamUrl.searchParams.has('layers')).toBe(false);
        expect(upstreamUrl.searchParams.has('jurisdiction')).toBe(false);
    });

    it('serves default layers without fetching tenant settings', async () => {
        setRuntimeConfig('');
        mockFetch.mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: {
                'content-type': 'image/png',
                'content-length': '3'
            }
        }));

        await expect(handler(createEvent({
            REQUEST: 'GetMap',
            layers: 'v_baumstandorte_online_s_26786',
            bbox: '700000,6500000,701000,6501000',
            width: '256',
            height: '256',
            srs: 'EPSG:3857'
        }) as never)).resolves.toBeInstanceOf(Buffer);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const upstreamUrl = new URL(mockFetch.mock.calls[0][0]);
        expect(upstreamUrl.hostname).toBe('gdi.bonn.de');
        expect(upstreamUrl.searchParams.get('LAYERS')).toBe('v_baumstandorte_online_s_26786');
    });

    it('rejects mixed-case duplicate layer params before fetching upstreams', async () => {
        await expect(handler(createEvent({
            REQUEST: 'GetLegendGraphic',
            LAYER: 'v_denkmalsatzung_p_33036',
            LaYeR: 'v_unconfigured'
        }) as never)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Duplicate WMS parameter: layer'
        });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects oversized tile dimensions before fetching upstreams', async () => {
        await expect(handler(createEvent({
            REQUEST: 'GetMap',
            layers: 'v_denkmalsatzung_p_33036',
            bbox: '700000,6500000,701000,6501000',
            width: '4096',
            height: '256',
            srs: 'EPSG:3857'
        }) as never)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Invalid WMS tile parameters.'
        });

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects tenant WMS layers when no explicit host allowlist is configured', async () => {
        setRuntimeConfig('');
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(tenantSettings('v_custom_public_layer')), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        await expect(handler(createEvent({
            REQUEST: 'GetLegendGraphic',
            LAYER: 'v_custom_public_layer',
            jurisdiction: 'tenant-without-wms-allowlist'
        }) as never)).rejects.toMatchObject({
            statusCode: 403,
            statusMessage: 'WMS layer host allowlist is required.'
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('uses the runtime WMS host allowlist env as server fallback', async () => {
        setRuntimeConfig('');
        process.env.NUXT_WMS_ALLOWED_HOSTS = 'gdi.bonn.de';
        mockFetch
            .mockResolvedValueOnce(new Response(JSON.stringify(tenantSettings('v_custom_runtime_layer')), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            }))
            .mockResolvedValueOnce(new Response('<ServiceExceptionReport />', {
                status: 200,
                headers: { 'content-type': 'application/xml' }
            }));

        await expect(handler(createEvent({
            REQUEST: 'GetLegendGraphic',
            LAYER: 'v_custom_runtime_layer',
            jurisdiction: 'runtime-env-allowlist-tenant'
        }) as never)).rejects.toMatchObject({
            statusCode: 502,
            statusMessage: 'Failed to fetch WMS layer.'
        });

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(new URL(mockFetch.mock.calls[1][0]).hostname).toBe('gdi.bonn.de');
    });

    it('negative-caches failed tenant settings lookups', async () => {
        mockFetch.mockResolvedValueOnce(new Response('not found', {
            status: 404,
            headers: { 'content-type': 'text/plain' }
        }));

        const query = {
            REQUEST: 'GetLegendGraphic',
            LAYER: 'v_unknown_negative_cache_layer',
            jurisdiction: 'missing-negative-cache-tenant'
        };

        await expect(handler(createEvent(query) as never)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Unknown WMS layer.'
        });
        await expect(handler(createEvent(query) as never)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Unknown WMS layer.'
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});
