const GENERIC_META_DESCRIPTIONS = new Set([
    'mark-a-spot',
    'mark a spot',
    'markaspot',
    'mark-a-spot frontend',
    'mark a spot frontend',
    'frontend mark a spot',
    'frontend de mark-a-spot',
    'frontend de mark a spot',
    'frontend di mark a spot',
    'mark a spot kayttoliittyma',
    'mark a spot granssnitt',
    'mark a spot grensesnitt'
]);

const normalizeMetaDescription = (value?: string | null): string =>
    String(value || '').replace(/\s+/g, ' ').trim();

const isGenericMetaDescription = (value: string): boolean => {
    const normalized = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[-._:]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return GENERIC_META_DESCRIPTIONS.has(normalized);
};

export interface TenantMetaDescriptionInput {
    translatedDescription?: string | null
    name?: string | null
    tagline?: string | null
}

export type TenantI18nOverrides = Record<string, Record<string, string | undefined> | undefined>;

export const resolveTenantMetaOverride = (
    overrides?: TenantI18nOverrides | null,
    locales: Array<string | null | undefined> = []
): string | undefined => {
    if (!overrides) return undefined;

    const localeCandidates = new Set<string>();
    for (const locale of locales) {
        const cleanLocale = String(locale || '').trim();
        if (!cleanLocale) continue;

        localeCandidates.add(cleanLocale);
        const baseLocale = cleanLocale.split('-')[0];
        if (baseLocale) localeCandidates.add(baseLocale);
    }

    for (const locale of localeCandidates) {
        const description = normalizeMetaDescription(overrides[locale]?.['meta.description']);
        if (description) return description;
    }

    return undefined;
};

export const resolveTenantMetaDescription = ({
    translatedDescription,
    name,
    tagline
}: TenantMetaDescriptionInput): string => {
    const translated = normalizeMetaDescription(translatedDescription);
    if (translated && !isGenericMetaDescription(translated)) {
        return translated;
    }

    const cleanName = normalizeMetaDescription(name);
    const cleanTagline = normalizeMetaDescription(tagline);
    if (cleanName && cleanTagline) {
        return `${cleanTagline} - ${cleanName}`;
    }

    if (cleanName) {
        return `Citizen Reporting - ${cleanName}`;
    }

    return 'Mark-a-Spot';
};
