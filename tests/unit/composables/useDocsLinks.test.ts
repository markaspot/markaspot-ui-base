/**
 * Unit Tests for useDocsLinks Composable
 *
 * Locks the documentation-link contract used by the contextual help links
 * (issue #191):
 * - the default base URL is the product-wide docs host;
 * - settings-page keys resolve to the verified (200) doc paths, undocumented
 *   keys resolve to null so no "Learn more" link is rendered;
 * - named deep links point at the verified create-report / getting-started
 *   pages.
 *
 * @see /app/composables/useDocsLinks.ts
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { useDocsLinks, SETTINGS_DOC_PATHS } from '@/composables/useDocsLinks';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useDocsLinks', () => {
    it('defaults to the product-wide docs host', () => {
        const { baseUrl } = useDocsLinks();
        expect(baseUrl).toBe('https://docs.mark-a-spot.com');
    });

    it('builds absolute URLs and tolerates leading slashes', () => {
        const { docUrl } = useDocsLinks();
        expect(docUrl('settings/categories')).toBe('https://docs.mark-a-spot.com/settings/categories');
        expect(docUrl('/settings/categories')).toBe('https://docs.mark-a-spot.com/settings/categories');
        expect(docUrl('')).toBe('https://docs.mark-a-spot.com');
    });

    it('resolves documented settings keys and returns null for undocumented ones', () => {
        const { settingsDocUrl } = useDocsLinks();
        expect(settingsDocUrl('categories')).toBe('https://docs.mark-a-spot.com/settings/categories');
        expect(settingsDocUrl('map-layers')).toBe('https://docs.mark-a-spot.com/settings/map-area');
        expect(settingsDocUrl('members')).toBe('https://docs.mark-a-spot.com/settings/team-members');
        // No published doc page → no link.
        expect(settingsDocUrl('features')).toBeNull();
        expect(settingsDocUrl('navigation')).toBeNull();
    });

    it('exposes verified named deep links', () => {
        const { links } = useDocsLinks();
        expect(links.createReport).toBe('https://docs.mark-a-spot.com/reports/create-report');
        expect(links.gettingStarted).toBe('https://docs.mark-a-spot.com/getting-started');
    });

    it('honours a runtime-config override for the base URL', () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: { docsBaseUrl: 'https://docs.example.test/' }
        }));
        const { baseUrl, docUrl } = useDocsLinks();
        expect(baseUrl).toBe('https://docs.example.test');
        expect(docUrl('getting-started')).toBe('https://docs.example.test/getting-started');
    });

    it('every settings doc path uses the prefix-stripped route convention', () => {
        for (const path of Object.values(SETTINGS_DOC_PATHS)) {
            // No numeric Nuxt Content prefixes (e.g. "4.settings/1.categories").
            expect(path).not.toMatch(/\d+\./);
            expect(path.startsWith('/')).toBe(false);
        }
    });
});
