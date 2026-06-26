/**
 * Escape a string for safe interpolation into HTML attribute values and text
 * content. Encodes the five characters that can break out of HTML context,
 * including single-quote (`'`) which `escapeHtml` in lite.get.ts previously
 * left unencoded.
 *
 * Use this everywhere Drupal-sourced strings are interpolated into raw HTML
 * templates (lite.get.ts, lite.post.ts, splash-generator, etc.).
 */
export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
