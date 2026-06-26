import { describe, expect, it, vi } from 'vitest';
import { createNuxtDevBuildMetaPlugin, isNuxtDevBuildMetaRequest } from '../../../config/vite-dev-build-meta';

describe('vite dev build meta middleware', () => {
    it('matches Nuxt dev build meta requests with optional query strings', () => {
        expect(isNuxtDevBuildMetaRequest('/_nuxt/builds/meta/dev.json')).toBe(true);
        expect(isNuxtDevBuildMetaRequest('/_nuxt/builds/meta/dev.json?ts=123')).toBe(true);
        expect(isNuxtDevBuildMetaRequest('/_nuxt/builds/meta/other.json')).toBe(false);
        expect(isNuxtDevBuildMetaRequest('/_nuxt/app.js')).toBe(false);
    });

    it('serves a 200 JSON placeholder for the Nuxt dev build meta endpoint', () => {
        const use = vi.fn();
        const plugin = createNuxtDevBuildMetaPlugin();

        plugin.configureServer({ middlewares: { use } });

        const middleware = use.mock.calls[0]?.[0];
        const req = { url: '/_nuxt/builds/meta/dev.json' };
        const res = {
            statusCode: 0,
            setHeader: vi.fn(),
            end: vi.fn()
        };
        const next = vi.fn();

        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
        expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate');
        expect(res.end).toHaveBeenCalledWith(JSON.stringify({
            id: 'dev',
            timestamp: 0,
            prerendered: []
        }));
    });

    it('passes unrelated requests to the next middleware', () => {
        const use = vi.fn();
        const plugin = createNuxtDevBuildMetaPlugin();

        plugin.configureServer({ middlewares: { use } });

        const middleware = use.mock.calls[0]?.[0];
        const req = { url: '/_nuxt/app.js' };
        const res = {
            setHeader: vi.fn(),
            end: vi.fn()
        };
        const next = vi.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.end).not.toHaveBeenCalled();
    });
});
