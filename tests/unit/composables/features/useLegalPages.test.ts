/**
 * Unit Tests for useLegalPages Composable
 *
 * Tests legal page generation (Impressum, Privacy, Terms) with XSS prevention,
 * email sanitization, address formatting, and operator detection.
 *
 * @see /app/composables/features/useLegalPages.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { clearMockState } from '../../__mocks__/nuxt';
import { useLegalPages } from '@/composables/features/useLegalPages';

// ============================================================================
// Mock Dependencies
// ============================================================================

const mockOperator = ref<{
    name?: string
    email?: string
    address?: {
        organization?: string
        address_line1?: string
        locality?: string
        postal_code?: string
        country_code?: string
    }
} | null>(null);

globalThis.useMarkASpotConfig = () => ({
    currentJurisdictionId: computed(() => ''),
    features: computed(() => ({})),
    config: computed(() => null),
    isReady: computed(() => true),
    isPending: computed(() => false),
    error: computed(() => null),
    jurisdiction: computed(() => null),
    taxonomyJurisdictionId: computed(() => null),
    client: computed(() => null),
    theme: computed(() => null),
    ui: computed(() => null),
    media: computed(() => null),
    operator: computed(() => mockOperator.value),
    fetchConfig: vi.fn(),
    clearCache: vi.fn()
});

// ============================================================================
// Tests
// ============================================================================

beforeEach(() => {
    clearMockState();
    mockOperator.value = null;
});

describe('useLegalPages', () => {
    // ========================================================================
    // escapeHtml (tested indirectly through getLegalPage output)
    // ========================================================================
    describe('escapeHtml (via operator name in getLegalPage)', () => {
        it('escapes & in operator name', () => {
            mockOperator.value = { name: 'Tom & Jerry GmbH', email: 'test@example.com' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            expect(page.attributes.body.value).toContain('Tom &amp; Jerry GmbH');
            expect(page.attributes.body.value).not.toContain('Tom & Jerry');
        });

        it('escapes < and > in operator name', () => {
            mockOperator.value = { name: '<script>alert(1)</script>', email: 'test@example.com' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            expect(page.attributes.body.value).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
            expect(page.attributes.body.value).not.toContain('<script>');
        });

        it('escapes " in operator name', () => {
            mockOperator.value = { name: 'Company "Best"', email: 'test@example.com' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            expect(page.attributes.body.value).toContain('Company &quot;Best&quot;');
        });

        it('escapes combined special characters', () => {
            mockOperator.value = { name: 'A & B <"test">', email: 'test@example.com' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            expect(page.attributes.body.value).toContain('A &amp; B &lt;&quot;test&quot;&gt;');
        });
    });

    // ========================================================================
    // sanitizeEmail (tested indirectly through getLegalPage output)
    // ========================================================================
    describe('sanitizeEmail (via operator email in getLegalPage)', () => {
        it('includes valid email as mailto link', () => {
            mockOperator.value = { name: 'Operator', email: 'contact@example.com' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            expect(page.attributes.body.value).toContain('mailto:contact@example.com');
            expect(page.attributes.body.value).toContain('>contact@example.com</a>');
        });

        it('omits email with spaces', () => {
            mockOperator.value = { name: 'Operator', email: 'invalid email@example.com' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            // Invalid operator email should not appear as a mailto link
            expect(page.attributes.body.value).not.toContain('mailto:invalid');
            // Only the platform mailto should be present
            const body = page.attributes.body.value;
            const mailtoCount = (body.match(/mailto:/g) || []).length;
            expect(mailtoCount).toBe(1);
        });

        it('omits email missing TLD', () => {
            mockOperator.value = { name: 'Operator', email: 'user@localhost' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            // Platform mailto is always present, but the invalid operator email should not appear
            expect(page.attributes.body.value).not.toContain('mailto:user@localhost');
            expect(page.attributes.body.value).not.toContain('>user@localhost</a>');
        });

        it('omits email with protocol injection', () => {
            mockOperator.value = { name: 'Operator', email: 'javascript:alert(1)' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            expect(page.attributes.body.value).not.toContain('javascript:');
            expect(page.attributes.body.value).not.toContain('mailto:javascript');
        });

        it('handles empty email string', () => {
            mockOperator.value = { name: 'Operator', email: '' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            // Only the platform mailto should be present, not an empty operator mailto
            const body = page.attributes.body.value;
            const mailtoCount = (body.match(/mailto:/g) || []).length;
            // Exactly one mailto: the platform email
            expect(mailtoCount).toBe(1);
            expect(body).toContain('mailto:info@civicpatches.de');
        });
    });

    // ========================================================================
    // formatAddress (tested indirectly through getLegalPage output)
    // ========================================================================
    describe('formatAddress (via operator address in getLegalPage)', () => {
        it('returns no address block when address is null', () => {
            mockOperator.value = { name: 'Operator', email: 'op@example.com' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            // The operator block should have name and email but no address line
            const body = page.attributes.body.value;
            // Check there is no standalone address paragraph between name and email
            const operatorHeadingIdx = body.indexOf('legal.operator.heading');
            const emailIdx = body.indexOf('mailto:', operatorHeadingIdx);
            const nameIdx = body.indexOf('<strong>Operator</strong>', operatorHeadingIdx);
            // There should be no extra <p> between name and email for address
            const betweenNameAndEmail = body.slice(nameIdx, emailIdx);
            // Only the closing </p> and the email <p> tag, no address paragraph
            expect(betweenNameAndEmail).not.toMatch(/, /);
        });

        it('formats partial address filtering empty parts', () => {
            mockOperator.value = {
                name: 'Operator',
                email: 'op@example.com',
                address: {
                    organization: 'Org GmbH',
                    address_line1: '',
                    locality: 'Berlin',
                    postal_code: '10115',
                    country_code: 'DE'
                }
            };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            const body = page.attributes.body.value;
            // Should contain address with empty parts filtered out
            expect(body).toContain('Org GmbH');
            expect(body).toContain('10115 Berlin');
            // address_line1 is empty, so no extra comma between org and postal
        });

        it('formats full address with all parts', () => {
            mockOperator.value = {
                name: 'Operator',
                email: 'op@example.com',
                address: {
                    organization: 'Org GmbH',
                    address_line1: 'Hauptstr. 1',
                    locality: 'Berlin',
                    postal_code: '10115',
                    country_code: 'DE'
                }
            };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            const body = page.attributes.body.value;
            expect(body).toContain('Org GmbH, Hauptstr. 1, 10115 Berlin');
        });
    });

    // ========================================================================
    // getLegalPage('impressum')
    // ========================================================================
    describe('getLegalPage - impressum', () => {
        it('returns correct structure', () => {
            mockOperator.value = { name: 'City Admin', email: 'admin@city.de' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');

            expect(page.id).toBe('legal-impressum');
            expect(page.type).toBe('legal');
            expect(page.attributes.title).toBe('legal.impressum.title');
            expect(page.attributes.body.value).toBe(page.attributes.body.processed);
        });

        it('contains platform and operator sections separated by hr', () => {
            mockOperator.value = { name: 'City Admin', email: 'admin@city.de' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            const body = page.attributes.body.value;

            // Platform section
            expect(body).toContain('legal.platform.heading');
            expect(body).toContain('legal.platform.name');
            expect(body).toContain('info@civicpatches.de');

            // Separator
            expect(body).toContain('<hr');

            // Operator section
            expect(body).toContain('legal.operator.heading');
            expect(body).toContain('City Admin');

            // Responsible section (only when operator exists)
            expect(body).toContain('legal.impressum.responsible_heading');
            expect(body).toContain('legal.impressum.responsible_text');
        });

        it('omits responsible section when operator not configured', () => {
            mockOperator.value = null;
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            const body = page.attributes.body.value;

            expect(body).not.toContain('legal.impressum.responsible_heading');
            expect(body).toContain('legal.operator.not_configured');
        });
    });

    // ========================================================================
    // getLegalPage('privacy')
    // ========================================================================
    describe('getLegalPage - privacy', () => {
        it('returns correct structure with GDPR headings', () => {
            mockOperator.value = { name: 'City Admin', email: 'admin@city.de' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('privacy');

            expect(page.id).toBe('legal-privacy');
            expect(page.type).toBe('legal');
            expect(page.attributes.title).toBe('legal.privacy.title');

            const body = page.attributes.body.value;
            expect(body).toContain('legal.privacy.heading');
            expect(body).toContain('legal.privacy.intro');
            expect(body).toContain('legal.privacy.controller_heading');
            expect(body).toContain('legal.privacy.data_heading');
            expect(body).toContain('legal.privacy.rights_heading');
        });

        it('contains platform and operator sections separated by hr', () => {
            mockOperator.value = { name: 'City Admin', email: 'admin@city.de' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('privacy');
            const body = page.attributes.body.value;

            expect(body).toContain('legal.platform.heading');
            expect(body).toContain('info@civicpatches.de');
            expect(body).toContain('<hr');
            expect(body).toContain('legal.operator.heading');
        });

        it('includes contact email in rights section when operator has email', () => {
            mockOperator.value = { name: 'City Admin', email: 'dpo@city.de' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('privacy');
            const body = page.attributes.body.value;

            expect(body).toContain('mailto:dpo@city.de');
        });
    });

    // ========================================================================
    // getLegalPage('terms')
    // ========================================================================
    describe('getLegalPage - terms', () => {
        it('returns correct structure with terms headings', () => {
            mockOperator.value = { name: 'City Admin', email: 'admin@city.de' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('terms');

            expect(page.id).toBe('legal-terms');
            expect(page.type).toBe('legal');
            expect(page.attributes.title).toBe('legal.terms.title');

            const body = page.attributes.body.value;
            expect(body).toContain('legal.terms.heading');
            expect(body).toContain('legal.terms.intro');
            expect(body).toContain('legal.terms.purpose_heading');
            expect(body).toContain('legal.terms.obligations_heading');
            expect(body).toContain('legal.terms.liability_heading');
        });

        it('contains platform and operator sections separated by hr', () => {
            mockOperator.value = { name: 'City Admin', email: 'admin@city.de' };
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('terms');
            const body = page.attributes.body.value;

            expect(body).toContain('legal.platform.heading');
            expect(body).toContain('info@civicpatches.de');
            expect(body).toContain('<hr');
            expect(body).toContain('legal.operator.heading');
        });
    });

    // ========================================================================
    // hasOperator
    // ========================================================================
    describe('hasOperator', () => {
        it('returns true when operator has name', () => {
            mockOperator.value = { name: 'City Admin' };
            const { hasOperator } = useLegalPages();
            expect(hasOperator.value).toBe(true);
        });

        it('returns true when operator has email', () => {
            mockOperator.value = { email: 'admin@city.de' };
            const { hasOperator } = useLegalPages();
            expect(hasOperator.value).toBe(true);
        });

        it('returns true when operator has address.organization', () => {
            mockOperator.value = { address: { organization: 'City GmbH' } };
            const { hasOperator } = useLegalPages();
            expect(hasOperator.value).toBe(true);
        });

        it('returns false when operator is null', () => {
            mockOperator.value = null;
            const { hasOperator } = useLegalPages();
            expect(hasOperator.value).toBe(false);
        });

        it('returns false when operator has no name, email, or organization', () => {
            mockOperator.value = { address: { locality: 'Berlin' } };
            const { hasOperator } = useLegalPages();
            expect(hasOperator.value).toBe(false);
        });

        it('returns false when operator is empty object', () => {
            mockOperator.value = {};
            const { hasOperator } = useLegalPages();
            expect(hasOperator.value).toBe(false);
        });
    });

    // ========================================================================
    // Platform section always present
    // ========================================================================
    describe('platform section', () => {
        it('always contains Civic Patches GmbH reference', () => {
            mockOperator.value = null;
            const { getLegalPage } = useLegalPages();

            for (const type of ['impressum', 'privacy', 'terms'] as const) {
                const page = getLegalPage(type);
                expect(page.attributes.body.value).toContain('legal.platform.name');
                expect(page.attributes.body.value).toContain('info@civicpatches.de');
            }
        });
    });

    // ========================================================================
    // Operator not configured
    // ========================================================================
    describe('operator not configured', () => {
        it('shows not_configured text when no operator data', () => {
            mockOperator.value = null;
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            expect(page.attributes.body.value).toContain('legal.operator.not_configured');
        });

        it('does not show responsible section on impressum when no operator', () => {
            mockOperator.value = null;
            const { getLegalPage } = useLegalPages();
            const page = getLegalPage('impressum');
            expect(page.attributes.body.value).not.toContain('legal.impressum.responsible_heading');
        });
    });
});
