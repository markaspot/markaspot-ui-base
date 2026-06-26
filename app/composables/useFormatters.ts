type DateInput = string | number | Date | null | undefined;

const normalizeFormatterLocale = (value?: string): string => {
    const localeCode = (value || 'de-DE').replace('_', '-');

    if (localeCode.toLowerCase() === 'de-ls') {
        return 'de-DE';
    }

    try {
        return Intl.getCanonicalLocales(localeCode)[0] || 'de-DE';
    } catch {
        return 'de-DE';
    }
};

const parseDateInput = (input: DateInput): Date | null => {
    if (!input) return null;
    const date = input instanceof Date ? input : new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Formatting composable for dates and other common formats
 */
export const useFormatters = () => {
    const { locale } = useI18n();
    const formatterLocale = computed(() => normalizeFormatterLocale(locale.value));

    /**
   * Format a date string to localized format with time
   */
    const formatDate = (dateInput: DateInput) => {
        const date = parseDateInput(dateInput);
        if (!date) return '';
        return new Intl.DateTimeFormat(formatterLocale.value, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatDateTime = formatDate;

    const formatDateTimeLong = (dateInput: DateInput) => {
        const date = parseDateInput(dateInput);
        if (!date) return '';
        return new Intl.DateTimeFormat(formatterLocale.value, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    /**
   * Format a date string to short format (dd.mm.yy)
   */
    const formatDateShort = (dateInput: DateInput) => {
        const date = parseDateInput(dateInput);
        if (!date) return '';
        return new Intl.DateTimeFormat(formatterLocale.value, {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    };

    const formatDateOnly = (dateInput: DateInput) => {
        const date = parseDateInput(dateInput);
        if (!date) return '';
        return new Intl.DateTimeFormat(formatterLocale.value, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    /**
   * Format a relative date (e.g., "2 days ago")
   */
    const formatRelativeDate = (dateInput: DateInput) => {
        const date = parseDateInput(dateInput);
        if (!date) return '';
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        const rtf = new Intl.RelativeTimeFormat(formatterLocale.value, { numeric: 'auto' });

        if (diffInSeconds < 60) {
            return rtf.format(-diffInSeconds, 'second');
        } else if (diffInSeconds < 3600) {
            return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
        } else if (diffInSeconds < 86400) {
            return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
        } else if (diffInSeconds < 2592000) {
            return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
        } else if (diffInSeconds < 31536000) {
            return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
        } else {
            return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
        }
    };

    return {
        formatDate,
        formatDateTime,
        formatDateTimeLong,
        formatDateOnly,
        formatDateShort,
        formatRelativeDate
    };
};
