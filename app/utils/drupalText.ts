/**
 * Drupal Text Utilities
 *
 * Standardized handling of text content from Drupal's text fields.
 * Drupal text fields have: { value: string, format: string, processed?: string }
 */

export interface DrupalTextField {
    value?: string
    format?: string
    processed?: string
}

/**
 * Strip HTML tags and decode entities for plain text display
 * Uses DOMParser on client for accuracy, regex fallback for SSR
 */
export const stripHtml = (html: string | undefined | null): string => {
    if (!html) return '';

    // Insert spaces after block-level closing tags so adjacent text doesn't merge.
    // "<h2>Title</h2><p>Text</p>" -> "Title Text" instead of "TitleText"
    const spaced = html
        .replace(/<\/(h[1-6]|p|div|li|tr|blockquote|section|article|header|footer|figcaption)>/gi, ' ')
        .replace(/<br\s*\/?>/gi, ' ');

    // Use DOMParser on client for accurate parsing
    if (import.meta.client && typeof DOMParser !== 'undefined') {
        const doc = new DOMParser().parseFromString(spaced, 'text/html');
        return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
    }

    // SSR fallback: regex-based stripping
    return spaced
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Get plain text from a Drupal text field
 * Prefers 'processed' (sanitized by Drupal) over raw 'value'
 *
 * @example
 * const description = getPlainText(item.attributes.body);
 */
export const getPlainText = (field: DrupalTextField | string | undefined | null): string => {
    if (!field) return '';

    // Handle string directly
    if (typeof field === 'string') {
        return stripHtml(field);
    }

    // Prefer processed (Drupal-sanitized) over raw value
    const html = field.processed || field.value || '';
    return stripHtml(html);
};

/**
 * Get HTML content from a Drupal text field (for v-html usage)
 * Always uses 'processed' for security - never raw 'value'
 *
 * @example
 * <div v-html="getSafeHtml(item.attributes.body)" />
 */
export const getSafeHtml = (field: DrupalTextField | string | undefined | null): string => {
    if (!field) return '';

    if (typeof field === 'string') {
        // Can't trust raw strings - strip them
        return stripHtml(field);
    }

    // Only use processed (Drupal-sanitized) HTML, never raw value
    return field.processed || stripHtml(field.value) || '';
};

/**
 * Get raw value from a Drupal text field (use with caution)
 * Only for cases where you need the exact input value
 */
export const getRawValue = (field: DrupalTextField | string | undefined | null): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.value || '';
};
