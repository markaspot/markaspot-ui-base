// Base edition stub (FastMap layer not included).
// Must mirror every export of the real fastmap-layer/lib/locale-routing.ts —
// the 1c drift guard below fails the build if it falls behind.
export const FASTMAP_DEFAULT_LOCALE = 'en';
export const FASTMAP_MARKETING_PATHS = new Set<string>();
export const FASTMAP_RESERVED_PATHS_WITHOUT_PAGE = new Set<string>();
export const FASTMAP_RESERVED_NAMESPACES_WITHOUT_PAGE: string[] = [];
export function normalizeFastmapPath(p: string): string { return p; }
export function getFastmapLocaleFromPath(_p: string): string | null { return null; }
export function stripFastmapLocalePrefix(p: string): string { return p; }
export function isFastmapMarketingPath(_p: string): boolean { return false; }
export function isFastmapReservedPathWithoutPage(_p: string): boolean { return false; }
export function buildFastmapLocalePath(p: string, _locale: string, _defaultLocale?: string): string { return p; }
