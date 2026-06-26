import { describe, expect, it } from 'vitest';
import { formatReportCountLabel } from '@/utils/reportCountLabel';

const t = (key: string, params: Record<string, number>) =>
    `${key}:${Object.entries(params).map(([name, value]) => `${name}=${value}`).join(',')}`;

describe('formatReportCountLabel', () => {
    it('shows area and jurisdiction totals when map bounds are active', () => {
        expect(formatReportCountLabel({
            visible: 20,
            scopedTotal: 20,
            globalTotal: 334,
            boundsActive: true
        }, t)).toBe('list.showing_in_area:visible=20,total=334');
    });

    it('keeps area-scope wording when the global total is unavailable', () => {
        expect(formatReportCountLabel({
            visible: 20,
            scopedTotal: 20,
            globalTotal: null,
            boundsActive: true
        }, t)).toBe('list.showing_area_only:visible=20');
    });

    it('uses the normal total when filters or search own the list scope', () => {
        expect(formatReportCountLabel({
            visible: 3,
            scopedTotal: 20,
            globalTotal: 334,
            boundsActive: true,
            hasActiveFilters: true
        }, t)).toBe('list.showing:visible=3,total=20');

        expect(formatReportCountLabel({
            visible: 5,
            scopedTotal: 20,
            globalTotal: 334,
            boundsActive: true,
            isSearchActive: true
        }, t)).toBe('list.showing:visible=5,total=20');
    });

    it('avoids the misleading "X von 0" when results exist but no total is available (embed map)', () => {
        // Embed map loads markers via bounds updates and never fetches a store
        // total, so scopedTotal stays 0 while results are visible.
        expect(formatReportCountLabel({
            visible: 23,
            scopedTotal: 0,
            globalTotal: null,
            boundsActive: false
        }, t)).toBe('list.showing_area_only:visible=23');
    });

    it('still shows the normal total when one is genuinely available', () => {
        expect(formatReportCountLabel({
            visible: 12,
            scopedTotal: 40,
            globalTotal: null,
            boundsActive: false
        }, t)).toBe('list.showing:visible=12,total=40');
    });

    it('keeps "0 von 0" when there are genuinely no results', () => {
        expect(formatReportCountLabel({
            visible: 0,
            scopedTotal: 0,
            globalTotal: null,
            boundsActive: false
        }, t)).toBe('list.showing:visible=0,total=0');
    });
});
