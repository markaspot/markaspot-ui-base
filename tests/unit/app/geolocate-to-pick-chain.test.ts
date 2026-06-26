/**
 * Regression guard: the `geolocate-to-pick` event must survive the full chain
 * from `useMapGeolocation` through `Map` and `MapLazy` up to `MapSection`.
 *
 * Background:
 * `useMapGeolocation.handleGeolocate()` emits `geolocate-to-pick` as the
 * canonical trigger for facility-nearest-snap (see `useFacilityNearestSnap`
 * watcher on `geolocatedCoords`). If any intermediate component drops the
 * event, locate-me silently fails to snap and Vue warns in the console:
 *
 *   Component emitted event "geolocate-to-pick" but it is neither declared
 *   in the emits option nor as an "onGeolocateToPick" prop.
 *
 * This test enforces the contract at the source-file level: cheaper than
 * mounting maplibregl, faster than a Playwright round-trip, and catches the
 * exact drift that broke #372 snap in the dev instance.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const repoRoot = resolve(__dirname, '../../..');
const read = (relative: string) => readFileSync(resolve(repoRoot, relative), 'utf8');

const extractDefineEmits = (source: string): string => {
    const match = source.match(/defineEmits<\{([\s\S]*?)\}>/);
    return match?.[1] ?? '';
};

describe('geolocate-to-pick event chain', () => {
    it('useMapGeolocation emits geolocate-to-pick from handleGeolocate', () => {
        const src = read('app/composables/useMapGeolocation.ts');
        expect(src).toMatch(/emit\(\s*['"]geolocate-to-pick['"]/);
    });

    it('Map.vue declares geolocate-to-pick in defineEmits', () => {
        const emits = extractDefineEmits(read('app/components/map/Map.vue'));
        expect(emits).toMatch(/['"]geolocate-to-pick['"]\s*:\s*\[coords:\s*\{\s*lat:\s*number,\s*lng:\s*number\s*\}\]/);
    });

    it('MapLazy.vue declares geolocate-to-pick in defineEmits', () => {
        const emits = extractDefineEmits(read('app/components/map/MapLazy.vue'));
        expect(emits).toMatch(/['"]geolocate-to-pick['"]\s*:\s*\[coords:\s*\{\s*lat:\s*number,\s*lng:\s*number\s*\}\]/);
    });

    it('MapLazy.vue template forwards geolocate-to-pick up from the child Map', () => {
        const src = read('app/components/map/MapLazy.vue');
        expect(src).toMatch(/@geolocate-to-pick=["'](?:\(coords(?::\s*\{\s*lat:\s*number,\s*lng:\s*number\s*\})?\)\s*=>\s*)?emit\(\s*['"]geolocate-to-pick['"]\s*,\s*coords\s*\)/);
    });

    it('MapSection.vue subscribes @geolocate-to-pick on its child map and routes it to handleGeolocateToPick', () => {
        const src = read('app/components/layout/MapSection.vue');
        expect(src).toMatch(/@geolocate-to-pick=["']handleGeolocateToPick["']/);
    });

    it('MapSection.vue passes the resulting coords down as :geolocated-coords to the facility-snap consumer', () => {
        const src = read('app/components/layout/MapSection.vue');
        expect(src).toMatch(/:geolocated-coords=["']geolocatedCoords["']/);
        expect(src).toMatch(/function\s+handleGeolocateToPick\s*\(/);
    });
});
