import { defineEventHandler, getQuery, sendRedirect } from 'h3';
import { useRuntimeConfig } from '#imports';
import clientConfig from '../../config/clients';
import { DEFAULT_BRANDING_ASSETS, resolveClientAssetPath } from '../../app/utils/clientAssetResolver';
import { getTranslator, getTextDirection, type LocaleKey } from '../utils/lite/l10n';
import { escapeHtml } from '../utils/html-escape';
import { handleDemoLiteShortCircuit } from '../utils/demo-mode';
import type { BannerData, CategoryTerm, JsonApiListResponse } from '../types/proxy';

// Serialize a value for embedding inside an inline <script> block. Escaping `<`
// (and the JS line separators) prevents a Drupal-sourced value from breaking out
// of the script with `</script>` or a raw U+2028/U+2029.
const jsonForScript = (value: unknown): string =>
    JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// Ultra-light HTML for low-bandwidth environments.
// No Nuxt runtime, no client-side JS, minimal inline CSS.
export default defineEventHandler(async (event) => {
    // Demo-mode short-circuit (#432). The lite form bypasses the client-side
    // submission gate entirely (no JS); on the demo instance we must refuse
    // it before rendering the form HTML, because cached page HTML would
    // otherwise still POST.
    const demoBlock = handleDemoLiteShortCircuit(event);
    if (demoBlock) return demoBlock;

    const config = useRuntimeConfig();

    // Availability gate: the LIVE emergency status decides, not the build-time
    // client config (which is empty in multi-tenant mode -- same bug class as
    // the middleware's removed feature-flag early-exit, B3). Serve /lite when:
    //  - the live status reports an active emergency or lite_ui, OR
    //  - the status endpoint is unreachable / fail-open (emergency_mode null):
    //    a backend outage is exactly the low-bandwidth scenario /lite exists for, OR
    //  - a single-tenant install opted in via the build-time feature flag.
    // Otherwise redirect to the full app instead of serving a permanently open
    // submission path on tenants that do not use the feature.
    const clientCfg = (config.public?.clientConfig ?? {}) as Record<string, unknown>;
    const features = (clientCfg.features ?? {}) as Record<string, unknown>;
    const emergencyEnabled = Boolean((features.emergency as Record<string, unknown> | undefined)?.enabled);

    const liteQuery = getQuery(event);
    const rawLiteJid = liteQuery.jurisdiction_id as string | undefined;
    const liteJid = rawLiteJid && /^\d+$/.test(rawLiteJid) ? rawLiteJid : undefined;
    const liteStatusPath: string = liteJid
        ? `/api/emergency-mode/status?jurisdiction_id=${encodeURIComponent(liteJid)}`
        : '/api/emergency-mode/status';

    type LiteStatus = { emergency_mode?: boolean | null, lite_ui?: boolean, banner?: BannerData | null };
    let liveStatus: LiteStatus | null = null;
    try {
        liveStatus = await event.$fetch<LiteStatus>(liteStatusPath);
    } catch {
        liveStatus = null; // Treat as unreachable: fail-open below.
    }

    const statusUnreachable = liveStatus === null || liveStatus.emergency_mode === null || liveStatus.emergency_mode === undefined;
    const liveActive = liveStatus?.emergency_mode === true || liveStatus?.lite_ui === true;
    if (!liveActive && !statusUnreachable && !emergencyEnabled) {
        return sendRedirect(event, '/', 302);
    }

    // Same-origin POST target as a RELATIVE path. Building it from the request
    // Host/origin (getRequestURL) let a spoofed Host header break out of the
    // action="" attribute or be cache-poisoned into the form action.
    const action = '/lite';
    const clientName = (config.public?.clientName as string) || 'MasCity';
    const clientTheme = (clientCfg.theme ?? {}) as Record<string, unknown>;
    const logoLightCfg = clientTheme.logoLight as string | undefined;
    const logoDarkCfg = clientTheme.logoDark as string | undefined;
    const faviconCfg = clientTheme.favicon as string | undefined;
    const logoLight = resolveClientAssetPath(logoLightCfg, DEFAULT_BRANDING_ASSETS.logoLight);
    const logoDark = resolveClientAssetPath(logoDarkCfg, DEFAULT_BRANDING_ASSETS.logoDark);
    const favicon = resolveClientAssetPath(faviconCfg, DEFAULT_BRANDING_ASSETS.favicon);
    const COLOR_MAP: Record<string, string> = {
        cello: '#1f3a5f',
        magenta: '#a21caf',
        primary: '#0f766e',
        blue: '#2563eb',
        violet: '#7c3aed',
        slate: '#334155',
        gray: '#6b7280'
    };
    const themeColors = (clientTheme.colors ?? {}) as Record<string, unknown>;
    const primaryToken = (themeColors.primary as string) || 'primary';
    const brandColor = COLOR_MAP[primaryToken] || COLOR_MAP.primary;
    const secondaryToken = (themeColors.secondary as string) || 'magenta';
    const secondaryColor = COLOR_MAP[secondaryToken] || COLOR_MAP.magenta;
    const grayToken = (themeColors.gray as string) || 'slate';
    const grayColor = COLOR_MAP[grayToken] || COLOR_MAP.slate;

    // Browser language detection with fallbacks
    const detectBrowserLanguage = (acceptLanguageHeader?: string): LocaleKey => {
        if (!acceptLanguageHeader) return 'en';

        // Parse Accept-Language header (e.g., "de-DE,de;q=0.9,en;q=0.8,fr;q=0.7")
        const languages = acceptLanguageHeader
            .toLowerCase()
            .split(',')
            .map((lang) => {
                const [code, qStr = 'q=1'] = lang.trim().split(';');
                const quality = parseFloat(qStr.split('=')[1] || '1');
                return { code: code.split('-')[0], quality }; // Extract language code (de from de-DE)
            })
            .sort((a, b) => b.quality - a.quality); // Sort by preference quality

        // Find first supported language
        const supportedLanguages = Object.keys(L10N) as LocaleKey[];
        for (const lang of languages) {
            if (supportedLanguages.includes(lang.code as LocaleKey)) {
                return lang.code as LocaleKey;
            }
        }

        return 'en'; // Fallback
    };

    const acceptLanguage = event.node.req.headers['accept-language'];
    const languages = (clientCfg.languages ?? {}) as Record<string, unknown>;
    const fallbackLocale = (languages.defaultLocale || 'en') as LocaleKey;

    // Priority: ENV override > Browser detection > Client config > 'en'
    const locale = (process.env.LITE_LOCALE as LocaleKey) ||
      detectBrowserLanguage(acceptLanguage) ||
      fallbackLocale ||
      'en';

    // Banner comes from the live status already fetched for the gate above
    // (single cached request via event.$fetch, 20s SWR).
    const bannerData: BannerData | null = liveStatus?.banner || null;
    const t = getTranslator(locale);

    // International danger level standards (based on CAP, EU-Alert, and WHO standards)
    const getDangerLevel = (level: string | number) => {
        const levelMap: Record<string, { type: string, icon: string, priority: number, isCAP?: boolean }> = {
            // CAP/Common Alerting Protocol standards (Heroicons for consistency)
            minor: { type: 'info', icon: 'information-circle', priority: 1, isCAP: true },
            moderate: { type: 'warning', icon: 'exclamation-triangle', priority: 2, isCAP: true },
            severe: { type: 'error', icon: 'exclamation-circle', priority: 3, isCAP: true },
            extreme: { type: 'critical', icon: 'shield-exclamation', priority: 4, isCAP: true },
            // WHO/Health emergency levels
            watch: { type: 'info', icon: 'eye', priority: 1 },
            advisory: { type: 'warning', icon: 'exclamation-triangle', priority: 2 },
            alert: { type: 'error', icon: 'exclamation-circle', priority: 3 },
            emergency: { type: 'critical', icon: 'shield-exclamation', priority: 4 },
            // General levels
            info: { type: 'info', icon: 'information-circle', priority: 1 },
            warning: { type: 'warning', icon: 'exclamation-triangle', priority: 2 },
            error: { type: 'error', icon: 'x-circle', priority: 3 },
            critical: { type: 'critical', icon: 'shield-exclamation', priority: 4 },
            success: { type: 'success', icon: 'check-circle', priority: 0 }
        };

        const normalizedLevel = String(level).toLowerCase();
        return levelMap[normalizedLevel] || levelMap['info'];
    };

    // Convert Heroicon names to SVG elements
    const getHeroicon = (iconName: string) => {
        const icons: Record<string, string> = {
            'information-circle': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>',
            'exclamation-triangle': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>',
            'exclamation-circle': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>',
            'shield-exclamation': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" /></svg>',
            'eye': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>',
            'x-circle': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>',
            'check-circle': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>'
        };
        return icons[iconName] || icons['information-circle'];
    };

    // Generate banner HTML
    const generateBannerHtml = (banner: BannerData) => {
        if (!banner || !banner.message) return '';

        const level = getDangerLevel(banner.level || 'info');
        const title = banner.title || (level.priority >= 3 ? 'Emergency Alert' : level.priority >= 2 ? 'Warning' : 'Information');
        const capClass = level.isCAP ? ' cap-alert' : '';

        return `
      <div class="banner ${level.type}${capClass}" role="alert" aria-live="${level.priority >= 2 ? 'assertive' : 'polite'}">
        <div class="banner-icon">${getHeroicon(level.icon)}</div>
        <div class="banner-content">
          <div class="banner-title">${escapeHtml(title)}</div>
          <p class="banner-message">${escapeHtml(banner.message)}</p>
        </div>
      </div>
    `;
    };

    // Load required fields and geolocation widget settings
    // This respects Drupal configuration (required flags) without loading the main app
    interface FormField { required?: boolean, widget_settings?: Record<string, unknown> }
    interface FormModeSettings { fields?: Record<string, FormField> }
    let required: Record<string, FormField> = {};
    let geoWidget: Record<string, unknown> | null = null;
    try {
        const settings = await $fetch<FormModeSettings>(`/api/mark-a-spot-form-mode-settings/node/service_request/default`);
        required = settings?.fields || {};
        geoWidget = settings?.fields?.field_geolocation?.widget_settings || null;
    } catch {
        required = {};
    }

    // Fetch center point from Mark-a-Spot settings (for proximity bias)
    let centerLat: string | null = null;
    let centerLng: string | null = null;
    try {
        const mas = await $fetch<{ center_lat?: string, center_lng?: string }>(`/api/mark-a-spot-settings`);
        centerLat = mas?.center_lat || null;
        centerLng = mas?.center_lng || null;
    } catch {
        // Silently ignore settings fetch errors
    }

    // Fetch categories (two pages max, like the composable)
    const fetchCategories = async () => {
        const all: CategoryTerm[] = [];
        const offset = 0;
        const limit = 50;
        const query = new URLSearchParams({
            'fields[taxonomy_term--service_category]': 'name,weight,parent,drupal_internal__tid',
            'include': 'parent',
            'filter[status][value]': '1',
            'sort': 'name',
            'page[offset]': String(offset),
            'page[limit]': String(limit)
        });
        const first = await $fetch<JsonApiListResponse<CategoryTerm>>(`/api/jsonapi/taxonomy_term/service_category?${query.toString()}`);
        if (first?.data) {
            all.push(...first.data);
            if (first.links?.next) {
                const secondQuery = new URLSearchParams({
                    'fields[taxonomy_term--service_category]': 'name,weight,parent,drupal_internal__tid',
                    'include': 'parent',
                    'filter[status][value]': '1',
                    'sort': 'name',
                    'page[offset]': String(limit),
                    'page[limit]': String(limit)
                });
                const second = await $fetch<JsonApiListResponse<CategoryTerm>>(`/api/jsonapi/taxonomy_term/service_category?${secondQuery.toString()}`);
                if (second?.data) all.push(...second.data);
            }
        }
        return all;
    };

    let categories: CategoryTerm[] = [];
    try {
        categories = await fetchCategories();
    } catch {
        categories = [];
    }

    // Build hierarchical options (flat with indentation)
    const catMap = new Map(categories.map(c => [c.id, c]));
    const childrenMap = new Map<string, CategoryTerm[]>();
    categories.forEach((c) => {
        const parent = c.relationships?.parent?.data?.[0]?.id;
        if (parent && parent !== 'virtual') {
            if (!childrenMap.has(parent)) childrenMap.set(parent, []);
            childrenMap.get(parent)!.push(c);
        }
    });
    const sortCats = (a: CategoryTerm, b: CategoryTerm) => {
        const wa = a.attributes?.weight || 0;
        const wb = b.attributes?.weight || 0;
        return wa === wb ? a.attributes?.name.localeCompare(b.attributes?.name) : wa - wb;
    };
    const buildOptions = (roots: CategoryTerm[], level = 0): string => {
        return roots.sort(sortCats).map((cat) => {
            const label = `${'\u2003'.repeat(level)}${escapeHtml(cat.attributes?.name ?? '')}`;
            const tid = cat.attributes?.drupal_internal__tid != null ? String(cat.attributes.drupal_internal__tid) : '';
            const opt = `<option value="${cat.id}" data-tid="${tid}">${label}</option>`;
            const kids = childrenMap.get(cat.id) || [];
            return opt + buildOptions(kids, level + 1);
        }).join('');
    };
    const roots = categories.filter((c) => {
        const parent = c.relationships?.parent?.data?.[0]?.id;
        return !parent || parent === 'virtual' || !catMap.has(parent);
    });
    const optionsHtml = buildOptions(roots);
    const categoryHtml = optionsHtml
        ? `
          <label for="category">${t('category')}${required.field_category?.required ? ' *' : ''}</label>
          <select id="category" name="category" required>
            <option value="">${t('category_placeholder')}</option>
            ${optionsHtml}
          </select>
      `
        : `
          <label for="category">${t('category')} *</label>
          <input id="category" name="category" type="text" inputmode="text" placeholder="service_category UUID" required />
          <p class="muted">Categories could not be loaded. Enter a category UUID manually or use the full site.</p>
      `;

    const dir = getTextDirection(locale);
    const html = `<!doctype html>
  <html lang="${locale}"${dir === 'rtl' ? ' dir="rtl"' : ''}>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <title>${escapeHtml(clientName)} — ${t('title')}</title>
      <meta name="robots" content="noindex" />
      <link rel="icon" href="${escapeHtml(favicon)}" type="image/svg+xml" />
      <style>
        :root {
          color-scheme: light dark;
          --brand-primary: ${brandColor};
          --brand-secondary: ${secondaryColor};
          --brand-gray: ${grayColor};
          --color-text: #1e293b;
          --color-text-muted: #64748b;
          --color-bg: #ffffff;
          --color-border: #d1d5db;
          --color-border-muted: #e2e8f0;
          --color-input-bg: #ffffff;
          --color-input-text: #111827;
          --color-input-placeholder: #6b7280;
          --color-input-focus-bg: #ffffff;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          background: var(--color-bg);
          color: var(--color-text);
        }
        .wrap {
          max-width: 640px;
          margin: 0 auto;
          padding: 12px 16px;
        }
        .brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 12px;
          border-bottom: 2px solid;
          border-image: linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-secondary) 100%) 1;
          margin-bottom: 16px;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand img {
          height: 24px;
          width: auto;
          display: block;
        }
        .brand-name {
          font-weight: 600;
          font-size: 1.125rem;
          color: var(--color-text);
        }
        .full-site-link {
          color: var(--brand-primary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 6px 12px;
          border: 1px solid var(--brand-primary);
          border-radius: 6px;
          transition: all 0.2s ease;
          margin-left: auto;
        }
        .full-site-link:hover {
          background: var(--brand-primary);
          color: white;
        }
        h1 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 8px;
          color: var(--color-text);
        }
        p {
          margin: 0 0 16px;
          color: var(--color-text-muted);
          font-size: 0.875rem;
          line-height: 1.4;
        }
        .link {
          color: var(--brand-primary);
          text-decoration: none;
          font-weight: 500;
        }
        .link:hover {
          text-decoration: underline;
        }
        form {
          margin-top: 20px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        label {
          display: block;
          font-weight: 500;
          margin: 0 0 6px;
          font-size: 0.875rem;
          color: var(--color-text);
        }
        input, textarea, select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-input-bg);
          color: var(--color-input-text);
          font-size: 16px; /* Prevents zoom on iOS */
          transition: border-color 0.15s, box-shadow 0.15s;
          -webkit-appearance: none;
          appearance: none;
        }
        select {
          background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iIzY2NiI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJtMTkuNSA4LjI1LTcuNSA3LjUtNy41LTcuNSIgLz48L3N2Zz4=');
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 36px;
          cursor: pointer;
        }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05), inset 0 1px 2px rgba(0, 0, 0, 0.05);
          background: var(--color-input-focus-bg);
        }
        textarea {
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }
        .input-group {
          position: relative;
          display: flex;
          gap: 8px;
          align-items: stretch;
        }
        .input-group input {
          flex: 1;
        }
        .muted {
          color: #64748b;
          font-size: 0.8125rem;
          line-height: 1.4;
        }
        .btn {
          appearance: none;
          border: 0;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          background: var(--brand-primary);
          color: #fff;
          width: 100%;
          margin-top: 20px;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .btn:hover:not(:disabled) {
          opacity: 0.9;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        .btn:active:not(:disabled) {
          transform: scale(0.98);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .checkbox-group {
          background: linear-gradient(135deg, #f8fafc 0%, rgba(248, 250, 252, 0.8) 100%);
          border: 1px solid var(--brand-secondary);
          padding: 12px;
          border-radius: 8px;
          margin-top: 16px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin-top: 2px;
        }
        .checkbox-group label {
          margin: 0;
          font-weight: 400;
          font-size: 0.875rem;
        }
        .icon-btn {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: var(--brand-primary);
          cursor: pointer;
          transition: background-color 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .icon-btn:hover {
          background: #f9fafb;
          border-color: var(--brand-primary);
        }
        .icon-btn:active {
          background: #f3f4f6;
        }
        .icon-btn img {
          width: 20px;
          height: 20px;
          display: block;
        }
        .suggest {
          list-style: none;
          margin: 4px 0 0;
          padding: 0;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          max-height: 200px;
          overflow-y: auto;
          background: #fff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .suggest li {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          font-size: 0.875rem;
          color: #475569;
          transition: background-color 0.1s;
        }
        .suggest li:last-child {
          border-bottom: 0;
        }
        .suggest li:hover {
          background: #f8fafc;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
        details {
          margin-top: 16px;
        }
        summary {
          cursor: pointer;
          color: var(--brand-primary);
          font-size: 0.875rem;
          font-weight: 500;
          padding: 8px 0;
          user-select: none;
        }
        summary:hover {
          text-decoration: underline;
        }
        details[open] summary {
          margin-bottom: 12px;
        }
        .note {
          margin-top: 24px;
          padding: 12px;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          font-size: 0.8125rem;
          line-height: 1.4;
          color: #78350f;
        }
        .banner {
          margin: 16px 0;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          line-height: 1.4;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-left: 4px solid;
          position: relative;
          overflow: hidden;
        }
        /* .cap-alert modifier reserved for CAP-sourced alerts; no external
           badge icon to avoid loading a third-party resource during an emergency
           (bandwidth, privacy). */
        .banner-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          margin-top: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .banner-icon svg {
          width: 20px;
          height: 20px;
          display: block;
        }
        .banner-content {
          flex: 1;
        }
        .banner-title {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .banner-message {
          margin: 0;
        }
        .banner.info {
          background: #eff6ff;
          border-left-color: #3b82f6;
          color: #1e40af;
        }
        .banner.warning {
          background: #fffbeb;
          border-left-color: #f59e0b;
          color: #92400e;
        }
        .banner.error {
          background: #fef2f2;
          border-left-color: #ef4444;
          color: #991b1b;
        }
        .banner.success {
          background: #f0fdf4;
          border-left-color: #22c55e;
          color: #166534;
        }
        .banner.critical {
          background: #7c2d12;
          border-left-color: #dc2626;
          color: #fecaca;
          font-weight: 500;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --color-text: #f1f5f9;
            --color-text-muted: #94a3b8;
            --color-bg: #0f172a;
            --color-border: #475569;
            --color-border-muted: #334155;
            --color-input-bg: #334155;
            --color-input-text: #f8fafc;
            --color-input-placeholder: #94a3b8;
            --color-input-focus-bg: #475569;
          }
          body {
            background: var(--color-bg);
            color: var(--color-text);
          }
          .brand {
            border-image: linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-secondary) 100%) 1;
          }
          .brand-name {
            color: var(--color-text);
          }
          .full-site-link {
            color: var(--brand-primary);
            border-color: var(--brand-primary);
          }
          .full-site-link:hover {
            background: var(--brand-primary);
            color: white;
          }
          h1 {
            color: var(--color-text);
          }
          p {
            color: var(--color-text-muted);
          }
          label {
            color: var(--color-text);
            font-weight: 500;
          }
          input, textarea, select {
            background: var(--color-input-bg);
            color: var(--color-input-text);
            border-color: var(--color-border);
          }
          input::placeholder,
          textarea::placeholder {
            color: var(--color-input-placeholder);
          }
          select {
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iI2Y4ZmFmYyI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJtMTkuNSA4LjI1LTcuNSA3LjUtNy41LTcuNSIgLz48L3N2Zz4=');
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 16px;
          }
          input:focus, textarea:focus, select:focus {
            border-color: var(--brand-primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
            background: var(--color-input-focus-bg);
            color: var(--color-input-text);
          }
          .checkbox-group {
            background: linear-gradient(135deg, var(--color-input-bg) 0%, rgba(51, 65, 85, 0.9) 100%);
            border-color: var(--brand-secondary);
          }
          .checkbox-group label {
            color: var(--color-text);
          }
          .muted {
            color: var(--color-text-muted);
          }
          .suggest {
            background: #1e293b;
            border-color: #334155;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          }
          .suggest li {
            color: #cbd5e1;
            border-bottom-color: #334155;
          }
          .suggest li:hover {
            background: #334155;
          }
          .icon-btn {
            background: #334155;
            border-color: #475569;
            color: #e2e8f0;
          }
          .icon-btn:hover {
            background: #475569;
            border-color: var(--brand-primary);
          }
          .icon-btn:active {
            background: #64748b;
          }
          .icon-btn img {
            filter: invert(1);
          }
          .note {
            background: #422006;
            border-color: #92400e;
            color: #fef3c7;
          }
          .banner.info {
            background: #1e3a8a;
            border-left-color: #60a5fa;
            color: #dbeafe;
          }
          .banner.warning {
            background: #92400e;
            border-left-color: #fbbf24;
            color: #fef3c7;
          }
          .banner.error {
            background: #991b1b;
            border-left-color: #f87171;
            color: #fecaca;
          }
          .banner.success {
            background: #166534;
            border-left-color: #4ade80;
            color: #dcfce7;
          }
          .banner.critical {
            background: #7f1d1d;
            border-left-color: #ef4444;
            color: #fecaca;
          }
          /* cap-alert dark-mode overrides removed; no external badge resource. */
        }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="brand">
          <div class="brand-logo">
            <picture>
              <source srcset="${escapeHtml(logoDark)}" media="(prefers-color-scheme: dark)">
              <img src="${escapeHtml(logoLight)}" alt="${escapeHtml(clientName)}" />
            </picture>
          </div>
          <a href="/?full=1" class="full-site-link">${t('switch_to_full_site')}</a>
        </div>
        <h1>${t('title')}</h1>

        ${bannerData ? generateBannerHtml(bannerData) : ''}

        <form method="post" action="${action}" enctype="application/x-www-form-urlencoded">
          <div class="form-group">
            <label for="addr">${t('location_search')}</label>
            <div class="input-group">
              <input id="addr" name="addr" type="text" placeholder="${t('location_search')}" autocomplete="street-address" autocapitalize="off" />
              <button type="button" id="useCurrent" class="icon-btn" aria-label="${t('use_current_location')}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span class="sr-only">${t('use_current_location')}</span>
              </button>
            </div>
            <ul id="suggest" class="suggest" hidden></ul>
          </div>

          <div class="form-group">
            ${categoryHtml}
          </div>

          <div class="form-group">
            <label for="description">${t('description')}${required.body?.required ? ' *' : ''}</label>
            <textarea id="description" name="description" placeholder="${t('description_placeholder')}" ${required.body?.required ? 'required' : ''}></textarea>
            <input id="lat" name="lat" type="hidden" />
            <input id="lng" name="lng" type="hidden" />
            <p id="locPreview" class="muted"></p>
          </div>

          ${required.field_e_mail?.required
                ? `
            <div class="form-group">
              <label for="email">${t('email')} *</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
          `
                : ''}

          <div id="gdprWrap" class="checkbox-group" style="display:none">
            <input id="gdpr" type="checkbox" name="gdpr" value="1" />
            <label for="gdpr" id="gdprLabel">${t('gdpr')}</label>
          </div>

          <button class="btn" type="submit">${t('submit')}</button>
        </form>

      </div>
      <script>
      (function(){
        const addr = document.getElementById('addr');
        const sugg = document.getElementById('suggest');
        const useCurrent = document.getElementById('useCurrent');
        const lat = document.getElementById('lat');
        const lng = document.getElementById('lng');
        const locale = ${jsonForScript(locale)};
        const bbox = ${jsonForScript(geoWidget?.limit_viewbox || '')};
        const center = ${jsonForScript({ lat: centerLat ? parseFloat(centerLat) : null, lng: centerLng ? parseFloat(centerLng) : null })};
        const gdprRequired = ${jsonForScript((features.gdprRequiredCategories as string[]) || [])};
        const geocodingProvider = ${jsonForScript(clientConfig.features?.geocoding?.default || 'photon')};
        let tmr;
        function clearSuggest(){ sugg.innerHTML=''; sugg.hidden = true; }
        function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
        function render(items){
          if(!items || !items.length){ return clearSuggest(); }
          sugg.innerHTML = items.map(it => (
            '<li data-lat="'+esc(it.lat)+'" data-lng="'+esc(it.lng)+'">'+
            esc(it.displayName || (it.lat+','+it.lng)) +
            '</li>'
          )).join('');
          sugg.hidden = false;
        }
        function pick(e){
          const li = e.target.closest('li');
          if(!li) return;
          lat.value = li.getAttribute('data-lat');
          lng.value = li.getAttribute('data-lng');
          addr.value = li.textContent.trim();
          clearSuggest();
        }
        sugg.addEventListener('click', pick);
        addr.addEventListener('input', function(){
          const q = addr.value.trim();
          if (tmr) clearTimeout(tmr);
          if (q.length < 3){ clearSuggest(); return; }
          tmr = setTimeout(async function(){
            try {
              const params = new URLSearchParams({ query:q, limit:'5', lang: locale });
              if (bbox && typeof bbox === 'string' && bbox.includes(',')) params.set('bbox', bbox);
              if (center && center.lat && center.lng){
                params.set('lat', String(center.lat));
                params.set('lon', String(center.lng));
                // Optional: small radius bias in meters
                params.set('radius', '5000');
              }
              const url = '/api/geocoding/'+geocodingProvider+'/search?'+params.toString();
              const res = await fetch(url);
              const data = await res.json();
              const items = Array.isArray(data) ? data.filter(it => it?.address?.postcode) : [];
              render(items);
            } catch { clearSuggest(); }
          }, 250);
        });
        useCurrent.addEventListener('click', async function(){
          if (!navigator.geolocation) return;
          try {
            await new Promise((resolve,reject)=>{
              navigator.geolocation.getCurrentPosition(resolve,reject,{ enableHighAccuracy:true, timeout:5000, maximumAge:0 });
            }).then(async (pos)=>{
              const { latitude, longitude } = pos.coords;
              lat.value = latitude.toFixed(6);
              lng.value = longitude.toFixed(6);
              try {
                const url = '/api/geocoding/'+geocodingProvider+'/reverse?'+new URLSearchParams({ lat:lat.value, lng:lng.value, lang: locale });
                const res = await fetch(url);
                const data = await res.json();
                if (data && data.displayName) addr.value = data.displayName;
              } catch {}
              // Show small preview
              document.getElementById('locPreview').textContent = lat.value+','+lng.value;
            });
          } catch {}
        });
        // If user picks a suggestion, show preview
        sugg.addEventListener('click', function(){
          if (lat.value && lng.value){ document.getElementById('locPreview').textContent = lat.value+','+lng.value; }
        });
      })();
      (function(){
        const cat = document.getElementById('category');
        const wrap = document.getElementById('gdprWrap');
        const box = document.getElementById('gdpr');
        const lbl = document.getElementById('gdprLabel');
        if (!(cat instanceof HTMLSelectElement) || !(wrap instanceof HTMLLabelElement) || !(box instanceof HTMLInputElement) || !(lbl instanceof HTMLSpanElement)) return;
        function update(){
          const sel = cat.selectedOptions && cat.selectedOptions[0] ? cat.selectedOptions[0] : null;
          const tid = sel ? sel.getAttribute('data-tid') : '';
          const req = tid && Array.isArray(gdprRequired) && gdprRequired.includes(String(tid));
          if (req){
            wrap.style.display = '';
            box.required = true;
            if (!(lbl.textContent || '').includes('*')) lbl.textContent = (lbl.textContent || '') + ' *';
          } else {
            box.required = false;
            box.checked = false;
            wrap.style.display = 'none';
            lbl.textContent = (lbl.textContent || '').replace(' *','');
          }
        }
        cat.addEventListener('change', update);
        update();
      })();
      </script>
    </body>
  </html>`;

    event.node.res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Avoid caching form HTML to always serve latest copy
    event.node.res.setHeader('Cache-Control', 'no-store');
    // Defense-in-depth backstop for this no-framework SSR page. It uses inline
    // <style> and one inline <script>, so those need 'unsafe-inline'; everything
    // else is locked down. form-action 'self' also stops the form posting to a
    // foreign origin, and base-uri 'none' blocks <base> hijacking.
    event.node.res.setHeader(
        'Content-Security-Policy',
        'default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; ' +
        'img-src \'self\' data: https:; font-src \'self\' data:; connect-src \'self\'; ' +
        'form-action \'self\'; base-uri \'none\'; frame-ancestors \'none\''
    );
    return html;
});
