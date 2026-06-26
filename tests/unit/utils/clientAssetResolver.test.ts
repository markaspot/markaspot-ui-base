import { describe, expect, it } from 'vitest';
import { DEFAULT_BRANDING_ASSETS, resolveClientAssetPath } from '@/utils/clientAssetResolver';

describe('resolveClientAssetPath', () => {
    it('passes through absolute public paths unchanged', () => {
        expect(resolveClientAssetPath('/favicon.svg', 'fallback')).toBe('/favicon.svg');
    });

    it('proxies Drupal file paths through the image endpoint', () => {
        expect(resolveClientAssetPath('/sites/default/files/logo.svg', 'fallback')).toBe('/api/images/sites/default/files/logo.svg');
    });

    it('rejects unsafe external or traversal paths', () => {
        expect(resolveClientAssetPath('https://example.com/logo.svg', 'fallback')).toBe('fallback');
        expect(resolveClientAssetPath('../secrets/logo.svg', 'fallback')).toBe('fallback');
        expect(resolveClientAssetPath('//example.com/logo.svg', 'fallback')).toBe('fallback');
    });
});

describe('DEFAULT_BRANDING_ASSETS', () => {
    it('exposes usable defaults for the shared frontend', () => {
        expect(DEFAULT_BRANDING_ASSETS.logoLight).toBe('/images/logo-light.svg');
        expect(DEFAULT_BRANDING_ASSETS.logoDark).toBe('/images/logo-dark.svg');
        expect(DEFAULT_BRANDING_ASSETS.favicon).toBe('/favicon.svg');
        expect(DEFAULT_BRANDING_ASSETS.icon192).toBe('/images/pwa-icon-192.png');
        expect(DEFAULT_BRANDING_ASSETS.icon512).toBe('/images/pwa-icon-512.png');
    });
});
