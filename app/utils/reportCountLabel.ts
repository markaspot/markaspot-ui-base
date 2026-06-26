export type ReportCountLabelTranslate = (
    key: string,
    params: Record<string, number>
) => string;

export interface ReportCountLabelOptions {
    visible: number
    scopedTotal: number
    globalTotal?: number | null
    boundsActive?: boolean
    hasActiveFilters?: boolean
    isSearchActive?: boolean
}

export function formatReportCountLabel(
    options: ReportCountLabelOptions,
    t: ReportCountLabelTranslate
): string {
    const {
        visible,
        scopedTotal,
        globalTotal,
        boundsActive,
        hasActiveFilters,
        isSearchActive
    } = options;
    const showAreaScope = boundsActive && !hasActiveFilters && !isSearchActive;

    if (showAreaScope && typeof globalTotal === 'number' && globalTotal > 0) {
        return t('list.showing_in_area', {
            visible,
            total: globalTotal
        });
    }

    if (showAreaScope) {
        return t('list.showing_area_only', { visible });
    }

    // Defensive: some surfaces (e.g. the embed map, which loads markers purely
    // via bounds updates) never fetch a store total, leaving scopedTotal at 0.
    // Rendering "X von 0" is misleading, so when we clearly have results but no
    // meaningful total, fall back to the area-scoped label instead.
    if (visible > 0 && scopedTotal <= 0 && (typeof globalTotal !== 'number' || globalTotal <= 0)) {
        return t('list.showing_area_only', { visible });
    }

    return t('list.showing', {
        visible,
        total: scopedTotal
    });
}
