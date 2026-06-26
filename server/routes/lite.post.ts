import { defineEventHandler, readBody, getHeader } from 'h3';
import { useRuntimeConfig } from '#imports';
import { handleDemoLiteShortCircuit } from '../utils/demo-mode';
import { escapeHtml } from '../utils/html-escape';
import { getTranslator, getTextDirection, type LocaleKey } from '../utils/lite/l10n';
import type { LiteFormBody } from '../types/proxy';

// Detect the best supported locale from Accept-Language header.
// Mirrors the logic in lite.get.ts so GET and POST responses are consistent.
const SUPPORTED_LOCALES = new Set<LocaleKey>(['en', 'de', 'fr', 'nl', 'tr']);

function detectLocale(acceptLanguage?: string): LocaleKey {
    if (!acceptLanguage) return 'en';
    const langs = acceptLanguage
        .toLowerCase()
        .split(',')
        .map((lang) => {
            const [code, qStr = 'q=1'] = lang.trim().split(';');
            const quality = parseFloat(qStr.split('=')[1] || '1');
            return { code: code.split('-')[0], quality };
        })
        .sort((a, b) => b.quality - a.quality);

    for (const lang of langs) {
        if (SUPPORTED_LOCALES.has(lang.code as LocaleKey)) {
            return lang.code as LocaleKey;
        }
    }
    return 'en';
}

const renderHtml = (title: string, body: string, locale: LocaleKey = 'en') => {
    const dir = getTextDirection(locale);
    return `<!doctype html>
<html lang="${locale}"${dir === 'rtl' ? ' dir="rtl"' : ''}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      .wrap { max-width: 640px; margin: 0 auto; padding: 16px; }
      a { color: #0f766e; text-decoration: none; }
      .muted { color:#64748b; }
      .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-top: 12px; }
      @media (prefers-color-scheme: dark) {
        body { background:#0b1220; color:#e5e7eb; }
        .muted { color:#9ca3af; }
        .box { background:#0f172a; border-color:#1f2937; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      ${body}
      <p class="muted"><a href="/lite">Back to lite form</a></p>
    </div>
  </body>
</html>`;
};

export default defineEventHandler(async (event) => {
    // Demo-mode short-circuit (#432). Defense in depth in case someone has
    // the lite form HTML cached client-side and the GET-side block missed.
    const demoBlock = handleDemoLiteShortCircuit(event);
    if (demoBlock) return demoBlock;

    const acceptLanguage = getHeader(event, 'accept-language');
    const locale = detectLocale(acceptLanguage);
    const t = getTranslator(locale);

    const config = useRuntimeConfig();
    const form = (await readBody(event)) as LiteFormBody;

    // Basic validation for required fields.
    const errors: string[] = [];
    if (!form.category) errors.push('Category is required');
    if (!form.description) errors.push('Description is required');
    if (!form.lat || !form.lng) errors.push('Latitude and Longitude are required');

    if (errors.length) {
        event.node.res.statusCode = 400;
        return renderHtml(t('submit_error_title'), `
      <h1>${escapeHtml(t('submit_error_title'))}</h1>
      <div class="box">
        <ul>${errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
      </div>
      <p>Please go back and correct the fields.</p>
    `, locale);
    }

    // Category-specific validations using client feature flags.
    try {
        if (form.category) {
            interface CategoryResponse { data?: { attributes?: { drupal_internal__tid?: number, name?: string } } }
            const cat = await $fetch<CategoryResponse>(`/api/jsonapi/taxonomy_term/service_category/${form.category}?fields[taxonomy_term--service_category]=drupal_internal__tid,name`);
            const tid = String(cat?.data?.attributes?.drupal_internal__tid || '');
            const features = (config.public?.clientConfig?.features ?? {}) as Record<string, unknown>;
            const emailRequired = (features.emailRequiredCategories || []) as string[];
            const photoRequired = (features.photoRequiredCategories || []) as string[];
            const gdprRequired = (features.gdprRequiredCategories || []) as string[];

            if (photoRequired.includes(tid)) {
                event.node.res.statusCode = 400;
                return renderHtml(t('submit_error_title'), `
          <h1>${escapeHtml(t('submit_error_title'))}</h1>
          <div class="box">Selected category requires a photo. Please use the full site to upload a photo.</div>
        `, locale);
            }

            if (emailRequired.includes(tid) && !form.email) {
                event.node.res.statusCode = 400;
                return renderHtml(t('submit_error_title'), `
          <h1>${escapeHtml(t('submit_error_title'))}</h1>
          <div class="box">Email is required for the selected category.</div>
          <p>Please go back and enter your email address.</p>
        `, locale);
            }

            if (gdprRequired.includes(tid) && !form.gdpr) {
                event.node.res.statusCode = 400;
                return renderHtml(t('submit_error_title'), `
          <h1>${escapeHtml(t('submit_error_title'))}</h1>
          <div class="box">Data processing consent is required for the selected category.</div>
          <p>Please go back and agree to the data processing terms.</p>
        `, locale);
            }
        }
    } catch {
        // If category lookup fails, continue without category-specific enforcement.
    }

    // Build JSON:API payload (same shape as main app).
    const payload = {
        data: {
            type: 'node--service_request',
            attributes: {
                title: `Report ${new Date().toISOString()}`,
                body: { value: form.description, format: 'plain_text' },
                ...(form.email ? { field_e_mail: form.email } : {}),
                ...(form.gdpr != null ? { field_gdpr: Boolean(form.gdpr) } : {}),
                field_geolocation: { lat: Number(form.lat), lng: Number(form.lng) }
            },
            relationships: {
                field_category: { data: { type: 'taxonomy_term--service_category', id: String(form.category) } }
            }
        }
    };

    try {
        const token = await $fetch<string>(`/api/session/token`, { headers: { 'cache-control': 'no-store' } });

        interface CreateResponse { data?: { attributes?: { drupal_internal__nid?: number }, id?: string } }
        const response = await $fetch<CreateResponse>(`/api/jsonapi/node/service_request?fields[node--service_request]=drupal_internal__nid,id`, {
            method: 'POST',
            headers: {
                'content-type': 'application/vnd.api+json',
                'x-csrf-token': token || ''
            },
            body: payload
        });

        const nodeId = response?.data?.attributes?.drupal_internal__nid;
        const rawId = nodeId ? `#${nodeId}` : String(response?.data?.id || '');
        const requestId = escapeHtml(rawId);
        return renderHtml(t('submit_success_title'), `
      <h1>${escapeHtml(t('submit_success_title'))}</h1>
      <p>${escapeHtml(t('submit_success_body'))}</p>
      <div class="box">${escapeHtml(t('submit_request_id'))}: <strong>${requestId}</strong></div>
    `, locale);
    } catch (err: unknown) {
        // Log full error details server-side for debugging.
        console.error('[lite.post] submission failed:', err instanceof Error ? err.message : String(err));
        // Return only a generic localized message to the citizen; no Drupal
        // constraint details, stack traces, or internal error shapes.
        event.node.res.statusCode = 500;
        return renderHtml(t('submit_error_title'), `
      <h1>${escapeHtml(t('submit_error_title'))}</h1>
      <p>${escapeHtml(t('submit_error_generic'))}</p>
    `, locale);
    }
});
