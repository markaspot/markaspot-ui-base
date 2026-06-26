import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const mockFetchJurisdictions = vi.fn();
const mockGetBySlug = vi.fn();
const mockGetById = vi.fn();
const mockNavigateTo = vi.fn();
const mockAbortNavigation = vi.fn((error: unknown) => error);
const mockCreateError = vi.fn((options: { statusCode: number, statusMessage: string }) => {
    const error = new Error(options.statusMessage) as Error & {
        statusCode?: number
        statusMessage?: string
    };
    error.statusCode = options.statusCode;
    error.statusMessage = options.statusMessage;
    return error;
});

vi.stubGlobal('defineNuxtRouteMiddleware', (handler: unknown) => handler);
vi.stubGlobal('navigateTo', mockNavigateTo);
vi.stubGlobal('abortNavigation', mockAbortNavigation);
vi.stubGlobal('createError', mockCreateError);
vi.stubGlobal('$fetch', vi.fn());
vi.stubGlobal('useState', () => ref(null));
vi.stubGlobal('useJurisdictions', () => ({
    fetchJurisdictions: mockFetchJurisdictions,
    hasMultiple: ref(true),
    getBySlug: mockGetBySlug,
    getById: mockGetById,
    defaultJurisdiction: ref({ slug: 'amsterdam' }),
    isSingleTenant: ref(false),
    needsSlugRouting: ref(true)
}));

const { default: middleware } = await import('@/middleware/jurisdiction.global');
const runMiddleware = middleware as (to: {
    path: string
    fullPath: string
    params: Record<string, string>
    query: Record<string, string>
}) => Promise<unknown>;

function route(path: string, jurisdiction: string) {
    return {
        path,
        fullPath: path,
        params: { jurisdiction },
        query: {}
    };
}

describe('jurisdiction.global middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetchJurisdictions.mockResolvedValue(undefined);
        mockGetBySlug.mockReturnValue(undefined);
    });

    it('does not accept a Settings API-only jurisdiction slug', async () => {
        vi.mocked(globalThis.$fetch).mockResolvedValue({ jurisdiction: { id: 999 } });

        const result = await runMiddleware(route('/foreign/dashboard', 'foreign'));

        expect(mockFetchJurisdictions).toHaveBeenCalledWith();
        expect(mockFetchJurisdictions).toHaveBeenCalledWith(true);
        expect(globalThis.$fetch).not.toHaveBeenCalled();
        expect(mockNavigateTo).not.toHaveBeenCalled();
        expect(mockCreateError).toHaveBeenCalledWith({
            statusCode: 404,
            statusMessage: 'Jurisdiction not found'
        });
        expect(mockAbortNavigation).toHaveBeenCalled();
        expect(result).toMatchObject({ statusCode: 404 });
    });

    it('allows a jurisdiction slug that appears after force refresh', async () => {
        mockGetBySlug
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce({ slug: 'new-workspace' });

        const result = await runMiddleware(route('/new-workspace/dashboard', 'new-workspace'));

        expect(result).toBeUndefined();
        expect(mockFetchJurisdictions).toHaveBeenCalledWith(true);
        expect(globalThis.$fetch).not.toHaveBeenCalled();
        expect(mockAbortNavigation).not.toHaveBeenCalled();
    });

    it('validates unknown login slugs instead of skipping all auth routes', async () => {
        const result = await runMiddleware(route('/foreign/auth/login', 'foreign'));

        expect(mockFetchJurisdictions).toHaveBeenCalledWith(true);
        expect(mockAbortNavigation).toHaveBeenCalled();
        expect(result).toMatchObject({ statusCode: 404 });
    });

    it('keeps auth claim routes open for freshly provisioned workspaces', async () => {
        const result = await runMiddleware(route('/foreign/auth/claim', 'foreign'));

        expect(result).toBeUndefined();
        expect(mockFetchJurisdictions).not.toHaveBeenCalled();
        expect(mockAbortNavigation).not.toHaveBeenCalled();
    });

    describe('reserved marketing paths without a top-level page', () => {
        it.each([
            ['/partner', 'partner'],
            ['/start', 'start'],
            ['/preview', 'preview'],
            ['/embed', 'embed']
        ])('returns 404 for %s instead of falling through to the workspace picker', async (path, slug) => {
            const result = await runMiddleware(route(path, slug));

            expect(mockFetchJurisdictions).not.toHaveBeenCalled();
            expect(mockCreateError).toHaveBeenCalledWith({
                statusCode: 404,
                statusMessage: 'Not found'
            });
            expect(mockAbortNavigation).toHaveBeenCalled();
            expect(result).toMatchObject({ statusCode: 404 });
        });

        it('lets /partner/<slug> pass through to the partner page', async () => {
            const result = await runMiddleware(route('/partner/acme', 'partner'));

            expect(result).toBeUndefined();
            expect(mockFetchJurisdictions).not.toHaveBeenCalled();
            expect(mockAbortNavigation).not.toHaveBeenCalled();
        });

        it('lets /start/templates pass through to the funnel page', async () => {
            const result = await runMiddleware(route('/start/templates', 'start'));

            expect(result).toBeUndefined();
            expect(mockFetchJurisdictions).not.toHaveBeenCalled();
            expect(mockAbortNavigation).not.toHaveBeenCalled();
        });

        // /preview/* has no pages at all (unlike /start, /partner, /embed which
        // expose real subpages), so subpaths must 404 like the exact path.
        it.each([
            '/preview/anything',
            '/preview/foo/bar'
        ])('returns 404 for %s instead of falling through to the workspace picker', async (path) => {
            const result = await runMiddleware(route(path, 'preview'));

            expect(mockFetchJurisdictions).not.toHaveBeenCalled();
            expect(mockCreateError).toHaveBeenCalledWith({
                statusCode: 404,
                statusMessage: 'Not found'
            });
            expect(mockAbortNavigation).toHaveBeenCalled();
            expect(result).toMatchObject({ statusCode: 404 });
        });

        it('also 404s a locale-prefixed /preview subpath (e.g. /de/preview/x)', async () => {
            const result = await runMiddleware(route('/de/preview/x', 'de'));

            expect(mockFetchJurisdictions).not.toHaveBeenCalled();
            expect(mockCreateError).toHaveBeenCalledWith({
                statusCode: 404,
                statusMessage: 'Not found'
            });
            expect(mockAbortNavigation).toHaveBeenCalled();
            expect(result).toMatchObject({ statusCode: 404 });
        });

        // Regression: the three live subpath families must still pass through
        // and NOT be caught by the /preview namespace rule.
        it.each([
            ['/start/create', 'start'],
            ['/partner/acme', 'partner'],
            ['/embed/map', 'embed']
        ])('lets live subpath %s pass through', async (path, slug) => {
            const result = await runMiddleware(route(path, slug));

            expect(result).toBeUndefined();
            expect(mockFetchJurisdictions).not.toHaveBeenCalled();
            expect(mockAbortNavigation).not.toHaveBeenCalled();
        });

        it('also 404s when the path is locale-prefixed (e.g. /de/partner)', async () => {
            const result = await runMiddleware(route('/de/partner', 'de'));

            expect(mockFetchJurisdictions).not.toHaveBeenCalled();
            expect(mockCreateError).toHaveBeenCalledWith({
                statusCode: 404,
                statusMessage: 'Not found'
            });
            expect(mockAbortNavigation).toHaveBeenCalled();
            expect(result).toMatchObject({ statusCode: 404 });
        });
    });
});
