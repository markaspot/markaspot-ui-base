import { describe, expect, it, beforeEach, vi } from 'vitest';
import { clearMockState, mockRouteData, mockUseState } from '../../__mocks__/nuxt';
import { expandJurisdictionWithDescendants, stripTrailingSlash, useJurisdictions } from '../../../../app/composables/core/useJurisdictions';

describe('expandJurisdictionWithDescendants', () => {
    // Mirrors the dev reference instance: Amsterdam(1) -> Noord(4);
    // BCP(8) -> Bournemouth(9) -> Queens Park(10); Rotterdam(5)/Utrecht(7) flat roots.
    const tree = [
        { id: 1, parentId: null },
        { id: 4, parentId: 1 },
        { id: 5, parentId: null },
        { id: 7, parentId: null },
        { id: 8, parentId: null },
        { id: 9, parentId: 8 },
        { id: 10, parentId: 9 }
    ];

    it('returns [self] for a flat root with no children', () => {
        expect(expandJurisdictionWithDescendants(tree, 5)).toEqual([5]);
    });

    it('includes a direct child jurisdiction (Amsterdam -> Noord)', () => {
        expect(expandJurisdictionWithDescendants(tree, 1).sort()).toEqual([1, 4]);
    });

    it('walks a multi-level chain (BCP -> Bournemouth -> Queens Park)', () => {
        expect(expandJurisdictionWithDescendants(tree, 8).sort((a, b) => a - b)).toEqual([8, 9, 10]);
    });

    it('returns only the subtree from a mid-level node', () => {
        expect(expandJurisdictionWithDescendants(tree, 9).sort((a, b) => a - b)).toEqual([9, 10]);
    });

    it('returns [id] for an id absent from the list', () => {
        expect(expandJurisdictionWithDescendants(tree, 999)).toEqual([999]);
    });

    it('returns [self] when the list is empty (not yet loaded)', () => {
        expect(expandJurisdictionWithDescendants([], 1)).toEqual([1]);
    });

    it('does not loop on a self-parent cycle', () => {
        const cyclic = [{ id: 1, parentId: 1 }, { id: 2, parentId: 1 }];
        expect(expandJurisdictionWithDescendants(cyclic, 1).sort((a, b) => a - b)).toEqual([1, 2]);
    });

    it('does not loop on a mutual parent cycle', () => {
        const cyclic = [{ id: 1, parentId: 2 }, { id: 2, parentId: 1 }];
        const result = expandJurisdictionWithDescendants(cyclic, 1);
        expect(result).toContain(1);
        expect(result).toContain(2);
        expect(new Set(result).size).toBe(result.length);
    });

    it('returns [] for a non-finite id', () => {
        expect(expandJurisdictionWithDescendants(tree, Number.NaN)).toEqual([]);
    });
});

describe('useJurisdictions buildPath', () => {
    beforeEach(() => {
        clearMockState();
    });

    it('uses an explicit slug before the jurisdiction list is loaded', () => {
        const { buildPath } = useJurisdictions();

        expect(buildPath('/auth/login', 'riverside-school-route-safety')).toBe(
            '/riverside-school-route-safety/auth/login'
        );
    });

    it('keeps single-tenant paths unprefixed even when a slug is supplied', () => {
        mockUseState<boolean>('jurisdiction-single-tenant').value = true;
        const { buildPath } = useJurisdictions();

        expect(buildPath('/auth/login', 'amsterdam')).toBe('/auth/login');
    });

    it('singleTenantFlagImmutable', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const singleTenantFlag = mockUseState<boolean>('jurisdiction-single-tenant', () => false);
        singleTenantFlag.value = true;

        const { isSingleTenant } = useJurisdictions();

        expect(isSingleTenant.value).toBe(true);
        (isSingleTenant as { value: boolean }).value = false;
        expect(singleTenantFlag.value).toBe(true);
        expect(isSingleTenant.value).toBe(true);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    it('falls back to the route slug for multi-jurisdiction paths without an explicit slug', () => {
        mockRouteData.params = { jurisdiction: 'noord' };
        mockUseState<boolean>('jurisdictions-state').value = {
            jurisdictions: [],
            count: 2,
            hasMultiple: true,
            loaded: true,
            loading: false,
            error: null
        };

        const { buildPath } = useJurisdictions();

        expect(buildPath('/dashboard')).toBe('/noord/dashboard');
    });

    it('uses the current route slug before the jurisdiction list is loaded', () => {
        mockRouteData.params = { jurisdiction: 'riverside-school-route-safety' };
        const { buildPath } = useJurisdictions();

        expect(buildPath('/auth/login')).toBe('/riverside-school-route-safety/auth/login');
    });

    // a11y bug #18: trailing slashes break NuxtLink's `isActive` for built
    // paths -- Reka UI's NavigationMenuLink then never stamps
    // `aria-current="page"` and the dashboard sidebar's active styling
    // (which is keyed off `aria-[current=page]:text-highlighted`) silently
    // disappears. `buildPath` must therefore return the same path string
    // that Vue Router resolves the page record to.
    describe('a11y: aria-current matching', () => {
        it('does not append a trailing slash when prefixing the root path', () => {
            const { buildPath } = useJurisdictions();

            expect(buildPath('/', 'amsterdam')).toBe('/amsterdam');
        });

        it('keeps the root path as `/` when no prefix is needed', () => {
            // No slug in route, single-jurisdiction (hasMultiple: false) fallback.
            const { buildPath } = useJurisdictions();

            expect(buildPath('/')).toBe('/');
        });

        it('returns paths without a trailing slash for nested routes', () => {
            const { buildPath } = useJurisdictions();

            expect(buildPath('/dashboard/requests/', 'amsterdam'))
                .toBe('/amsterdam/dashboard/requests');
        });

        it('strips a trailing slash inherited from the caller in single-tenant mode', () => {
            mockUseState<boolean>('jurisdiction-single-tenant').value = true;
            const { buildPath } = useJurisdictions();

            expect(buildPath('/auth/login/')).toBe('/auth/login');
        });
    });
});

describe('stripTrailingSlash', () => {
    it('removes a single trailing slash from a non-root path', () => {
        expect(stripTrailingSlash('/amsterdam/')).toBe('/amsterdam');
        expect(stripTrailingSlash('/amsterdam/dashboard/')).toBe('/amsterdam/dashboard');
    });

    it('leaves the bare root path untouched', () => {
        expect(stripTrailingSlash('/')).toBe('/');
    });

    it('is a no-op for paths without a trailing slash', () => {
        expect(stripTrailingSlash('/amsterdam')).toBe('/amsterdam');
        expect(stripTrailingSlash('/amsterdam/dashboard')).toBe('/amsterdam/dashboard');
    });
});
