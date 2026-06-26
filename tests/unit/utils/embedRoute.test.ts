import { describe, expect, it } from 'vitest';
import { isEmbedRoutePath } from '~/utils/embedRoute';

describe('isEmbedRoutePath', () => {
    it('detects root embed routes', () => {
        expect(isEmbedRoutePath('/embed')).toBe(true);
        expect(isEmbedRoutePath('/embed/map')).toBe(true);
    });

    it('detects jurisdiction-prefixed embed routes', () => {
        expect(isEmbedRoutePath('/wbd/embed/map')).toBe(true);
        expect(isEmbedRoutePath('/duisburg/embed')).toBe(true);
        expect(isEmbedRoutePath('/embed/embed/map')).toBe(true);
    });

    it('does not match ordinary non-embed routes', () => {
        expect(isEmbedRoutePath('/')).toBe(false);
        expect(isEmbedRoutePath('/dashboard/settings/embed')).toBe(false);
        expect(isEmbedRoutePath('/de/dashboard/settings/embed')).toBe(false);
        expect(isEmbedRoutePath('/not-embedded/map')).toBe(false);
    });
});
