const FALLBACK_PAGE_ICON = 'i-lucide-file-text';

const TITLE_ICON_RULES: Array<{ matches: RegExp[], icon: string }> = [
    { matches: [/datenschutz/, /privacy/], icon: 'i-lucide-shield-check' },
    { matches: [/barrierefreiheit/, /accessibility/], icon: 'i-lucide-accessibility' },
    { matches: [/\bfaq\b/, /fragen/, /questions/], icon: 'i-lucide-circle-question-mark' },
    { matches: [/impressum/, /imprint/, /anbieterkennzeichnung/], icon: 'i-lucide-building-2' },
    { matches: [/kontakt/, /contact/], icon: 'i-lucide-mail' },
    { matches: [/melderegeln?/, /nutzungsregeln?/, /\bregeln?\b/, /\brules?\b/], icon: 'i-lucide-list-checks' },
    { matches: [/statistik/, /statistics/], icon: 'i-lucide-chart-column' },
    { matches: [/information/], icon: 'i-lucide-info' }
];

const normalizeTitle = (title?: string | null): string =>
    (title || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/ß/g, 'ss')
        .toLowerCase();

export const resolvePageMenuIcon = (configuredIcon?: string | null, title?: string | null): string => {
    const trimmedIcon = configuredIcon?.trim();
    if (trimmedIcon) {
        return trimmedIcon;
    }

    const normalizedTitle = normalizeTitle(title);
    const rule = TITLE_ICON_RULES.find(({ matches }) =>
        matches.some(match => match.test(normalizedTitle))
    );

    return rule?.icon || FALLBACK_PAGE_ICON;
};
