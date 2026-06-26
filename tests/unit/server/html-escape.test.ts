import { describe, expect, it } from 'vitest';
import { escapeHtml } from '~/server/utils/html-escape';

describe('escapeHtml', () => {
    it('encodes ampersands', () => {
        expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('encodes less-than signs', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('encodes greater-than signs', () => {
        expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('encodes double quotes', () => {
        expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    });

    it('encodes single quotes', () => {
        expect(escapeHtml('it\'s')).toBe('it&#x27;s');
    });

    it('encodes all five characters together', () => {
        expect(escapeHtml('<a href="url" title=\'test\'>hello & world</a>')).toBe(
            '&lt;a href=&quot;url&quot; title=&#x27;test&#x27;&gt;hello &amp; world&lt;/a&gt;'
        );
    });

    it('returns empty string unchanged', () => {
        expect(escapeHtml('')).toBe('');
    });

    it('returns plain strings unchanged', () => {
        expect(escapeHtml('hello world')).toBe('hello world');
    });

    it('handles strings with only special chars', () => {
        expect(escapeHtml('&<>"\'&<>\'"')).toBe('&amp;&lt;&gt;&quot;&#x27;&amp;&lt;&gt;&#x27;&quot;');
    });
});
