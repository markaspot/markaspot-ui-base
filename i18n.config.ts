/**
 * vue-i18n runtime configuration.
 *
 * Registers custom pluralization rules for languages whose plural forms
 * differ from the simple English n===1 split:
 *
 * - Czech (cs):       3 forms — one (1), few (2-4), other (0, 5+)
 * - Polish (pl):      3 forms — one (1), few (2-4 except 12-14), many (rest)
 * - Ukrainian (uk):   3 forms — one (ends 1 except 11), few (ends 2-4 except 12-14), many (rest)
 * - Arabic (ar):      6 forms — zero, one, two, few (3-10), many (11-99), other (100+)
 *
 * Each rule maps a count to an index into the choices array supplied to
 * `$t('key', n)` with pipe-separated forms: 'one|few|other'.
 *
 * Reference: Unicode CLDR plural rules
 * https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
 */

const czech = (choice: number, choicesLength: number): number => {
    if (choice === 1) return choicesLength === 3 ? 0 : 0;
    if (choice >= 2 && choice <= 4) return choicesLength === 3 ? 1 : 1;
    return choicesLength === 3 ? 2 : 1;
};

const polish = (choice: number, choicesLength: number): number => {
    if (choice === 1) return 0;
    const lastTwo = choice % 100;
    const last = choice % 10;
    const isFew = last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14);
    if (isFew) return 1;
    return choicesLength === 3 ? 2 : 1;
};

const ukrainian = (choice: number, choicesLength: number): number => {
    const lastTwo = choice % 100;
    const last = choice % 10;
    if (last === 1 && lastTwo !== 11) return 0;
    if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 1;
    return choicesLength === 3 ? 2 : 1;
};

const arabic = (choice: number, choicesLength: number): number => {
    if (choice === 0) return 0;
    if (choice === 1) return Math.min(1, choicesLength - 1);
    if (choice === 2) return Math.min(2, choicesLength - 1);
    const lastTwo = choice % 100;
    if (lastTwo >= 3 && lastTwo <= 10) return Math.min(3, choicesLength - 1);
    if (lastTwo >= 11 && lastTwo <= 99) return Math.min(4, choicesLength - 1);
    return Math.min(5, choicesLength - 1);
};

export default defineI18nConfig(() => ({
    legacy: false,
    pluralRules: {
        cs: czech,
        pl: polish,
        uk: ukrainian,
        ar: arabic
    }
}));
