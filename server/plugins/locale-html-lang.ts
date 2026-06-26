import { isLocaleCode } from '../../config/locales';

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('render:html', (html, { event }) => {
        const locale = event.context.nuxtI18n?.detectLocale;
        // Defense-in-depth: only a known locale code may reach the lang
        // attribute. Both writers (server/middleware/01.jurisdiction-locale
        // and fastmap-layer/server/middleware/03.locale-prefix) already
        // validate, but re-checking here keeps a future bad code out of the
        // raw HTML attribute interpolation below.
        if (!locale || !isLocaleCode(locale)) {
            return;
        }

        const htmlAttrs = (html.htmlAttrs || []).filter(attr => !attr.startsWith('lang='));
        htmlAttrs.push(`lang="${locale}"`);
        html.htmlAttrs = htmlAttrs;
    });
});
