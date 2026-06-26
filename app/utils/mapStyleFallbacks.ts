export type MapStyleServiceType = 'primary' | 'fallback';

export interface MapStyleSettings {
    mapbox_style?: string | null
    mapbox_style_dark?: string | null
    fallback_style?: string | null
    fallback_style_dark?: string | null
}

export interface MapStyleCandidate {
    styleUrl: string
    serviceType: MapStyleServiceType
}

const addCandidate = (
    candidates: MapStyleCandidate[],
    seenStyles: Set<string>,
    styleUrl: string | null | undefined,
    serviceType: MapStyleServiceType
) => {
    if (!styleUrl || seenStyles.has(styleUrl)) return;

    candidates.push({ styleUrl, serviceType });
    seenStyles.add(styleUrl);
};

export const getThemedMapStyleCandidates = (
    settings: MapStyleSettings,
    isDark: boolean
): MapStyleCandidate[] => {
    const candidates: MapStyleCandidate[] = [];
    const seenStyles = new Set<string>();

    if (isDark) {
        addCandidate(candidates, seenStyles, settings.mapbox_style_dark, 'primary');
        addCandidate(candidates, seenStyles, settings.fallback_style_dark, 'fallback');
        addCandidate(candidates, seenStyles, settings.mapbox_style, 'primary');
        addCandidate(candidates, seenStyles, settings.fallback_style, 'fallback');
    } else {
        addCandidate(candidates, seenStyles, settings.mapbox_style, 'primary');
        addCandidate(candidates, seenStyles, settings.fallback_style, 'fallback');
        addCandidate(candidates, seenStyles, settings.mapbox_style_dark, 'primary');
        addCandidate(candidates, seenStyles, settings.fallback_style_dark, 'fallback');
    }

    return candidates;
};

export const getPreferredMapStyle = (
    settings: MapStyleSettings,
    isDark: boolean
): string | undefined => getThemedMapStyleCandidates(settings, isDark)[0]?.styleUrl;

export const getPreferredFallbackStyle = (
    settings: MapStyleSettings,
    isDark: boolean
): string | undefined => {
    if (isDark) {
        return settings.fallback_style_dark || settings.fallback_style || undefined;
    }

    return settings.fallback_style || settings.fallback_style_dark || undefined;
};
