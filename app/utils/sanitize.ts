import DOMPurify from 'isomorphic-dompurify';

// Enforce rel="noopener noreferrer" on target="_blank" links
// to prevent reverse tabnapping (CWE-1022)
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
    }
});

/**
 * Sanitize HTML content for safe v-html rendering.
 * Defense-in-depth: Drupal sanitizes server-side via check_markup,
 * this adds a frontend DOMPurify layer.
 */
export const sanitizeHtml = (html: string | undefined | null): string => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'span', 'b', 'i'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
    });
};

/**
 * Sanitize rich HTML content (Drupal body.processed, category descriptions).
 * Allows block-level elements needed for admin-authored content.
 */
export const sanitizeRichHtml = (html: string | undefined | null): string => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'span', 'b', 'i',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'section', 'article',
            'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'blockquote', 'pre', 'code', 'hr', 'img', 'figure', 'figcaption',
            'svg', 'path', 'circle'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'width', 'height',
            'xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'cx', 'cy', 'r'
        ]
    });
};
