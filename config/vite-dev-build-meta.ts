const DEV_BUILD_META_PATH = '/_nuxt/builds/meta/dev.json';
const DEV_BUILD_META_PLACEHOLDER = JSON.stringify({
    id: 'dev',
    timestamp: 0,
    prerendered: []
});

export const isNuxtDevBuildMetaRequest = (url = ''): boolean => {
    const [pathname] = url.split('?');
    return pathname === DEV_BUILD_META_PATH;
};

export const createNuxtDevBuildMetaPlugin = () => ({
    name: 'nuxt-dev-build-meta-placeholder',
    enforce: 'pre' as const,
    apply: 'serve' as const,
    configureServer(server: any) {
        server.middlewares.use((req: any, res: any, next: any) => {
            if (!isNuxtDevBuildMetaRequest(req.url)) {
                next();
                return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.end(DEV_BUILD_META_PLACEHOLDER);
        });
    }
});
