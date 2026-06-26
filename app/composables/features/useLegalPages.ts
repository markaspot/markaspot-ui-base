/**
 * useLegalPages - Legal page template composable
 *
 * Generates legal pages (Impressum, Privacy, Terms) from i18n plain-text keys,
 * assembling HTML in code (not in i18n strings, which unplugin-vue-i18n rejects).
 * Each page shows two sections:
 *   1. Platform Operator (Civic Patches GmbH, from i18n - always present)
 *   2. Map Operator (tenant-specific, from Drupal jurisdiction group entity)
 * Returns page objects compatible with PageContent.vue.
 *
 * ## Backend dependency
 *
 * Operator data (name, email, address) is read from the jurisdiction group entity
 * via `useMarkASpotConfig().operator`. This data originates from Drupal fields on
 * the `jur` group type (e.g. `field_jurisdiction_e_mail`, `field_jurisdiction_address`,
 * and the operator block in `field_nuxt_config`).
 *
 * This composable does **not** depend on the `markaspot_privacy` Drupal module.
 * The `field_privacy_policy` and `field_legal_notice` fields on the group entity
 * are not consumed here. All legal page content is generated from i18n keys and
 * the operator metadata.
 *
 * ## Graceful degradation
 *
 * If operator data is missing or partially absent in the API response, the composable
 * falls back gracefully: missing name/email/address fields resolve to empty strings,
 * and the "not configured" i18n message is shown in place of operator details.
 */
import type { LegalPageType } from '~~/types';

/**
 * Escape HTML special characters to prevent XSS.
 * Operator data is admin-editable and rendered via v-html.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Validate and sanitize email for safe use in mailto: href
 */
function sanitizeEmail(email: string): string {
    const cleaned = escapeHtml(email.trim());
    // Basic email format check - reject anything with protocol or script
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        return cleaned;
    }
    return '';
}

export function useLegalPages() {
    const { t } = useI18n();
    const { operator } = useMarkASpotConfig();

    /**
     * Check if operator data is configured
     */
    const hasOperator = computed(() => {
        const op = operator.value;
        return !!(op?.name || op?.email || op?.address?.organization);
    });

    /**
     * Format operator address as a single-line string
     */
    const formatAddress = (address?: { organization?: string, address_line1?: string, locality?: string, postal_code?: string, country_code?: string }): string => {
        if (!address) return '';
        const parts = [
            address.organization,
            address.address_line1,
            [address.postal_code, address.locality].filter(Boolean).join(' ')
        ].filter(Boolean);
        return escapeHtml(parts.join(', '));
    };

    /**
     * Build platform operator block (Civic Patches GmbH, from i18n - trusted data)
     * Email hardcoded to avoid vue-i18n @ symbol parsing issues.
     */
    const PLATFORM_EMAIL = 'info@civicpatches.de';

    const buildPlatformOperatorBlock = (): string => {
        const lines = [
            `<h2>${t('legal.platform.heading')}</h2>`,
            `<p>${t('legal.platform.intro')}</p>`,
            `<p><strong>${t('legal.platform.name')}</strong></p>`,
            `<p>${t('legal.platform.address')}</p>`,
            `<p>${t('legal.email_label')}: <a href="mailto:${PLATFORM_EMAIL}">${PLATFORM_EMAIL}</a></p>`,
            `<p>Web: <a href="${t('legal.platform.web')}" target="_blank" rel="noopener">${t('legal.platform.web')}</a></p>`,
            `<p>${t('legal.platform.description')}</p>`
        ];
        return lines.join('');
    };

    /**
     * Build map operator block (tenant-specific, from Drupal - needs escaping)
     */
    const buildMapOperatorBlock = (name: string, address: string, email: string): string => {
        const lines = [`<h2>${t('legal.operator.heading')}</h2>`];

        if (hasOperator.value) {
            lines.push(`<p><strong>${name}</strong></p>`);
            if (address) lines.push(`<p>${address}</p>`);
            if (email) lines.push(`<p>${t('legal.email_label')}: <a href="mailto:${email}">${email}</a></p>`);
        } else {
            lines.push(`<p>${t('legal.operator.not_configured')}</p>`);
        }

        return lines.join('');
    };

    /**
     * Build HTML for a specific legal page type
     */
    const buildContent = (type: LegalPageType, name: string, address: string, email: string): string => {
        const platformBlock = buildPlatformOperatorBlock();
        const mapOperatorBlock = buildMapOperatorBlock(name, address, email);
        const separator = '<hr class="my-6">';

        if (type === 'impressum') {
            return [
                `<h2>${t('legal.impressum.heading')}</h2>`,
                platformBlock,
                separator,
                mapOperatorBlock,
                ...(hasOperator.value
                    ? [
                        `<h2>${t('legal.impressum.responsible_heading')}</h2>`,
                        `<p>${t('legal.impressum.responsible_text', { name })}</p>`
                    ]
                    : [])
            ].join('');
        }

        if (type === 'privacy') {
            const contactLine = email
                ? `${t('legal.contact_label')}: <a href="mailto:${email}">${email}</a>`
                : '';
            return [
                `<h2>${t('legal.privacy.heading')}</h2>`,
                `<p>${t('legal.privacy.intro')}</p>`,
                platformBlock,
                separator,
                mapOperatorBlock,
                `<h2>${t('legal.privacy.controller_heading')}</h2>`,
                hasOperator.value
                    ? `<p><strong>${name}</strong></p>`
                    : `<p>${t('legal.operator.not_configured')}</p>`,
                `<h2>${t('legal.privacy.data_heading')}</h2>`,
                `<p>${t('legal.privacy.data_text')}</p>`,
                `<h2>${t('legal.privacy.rights_heading')}</h2>`,
                `<p>${t('legal.privacy.rights_text')}${contactLine ? ` ${contactLine}` : ''}</p>`
            ].join('');
        }

        // terms
        return [
            `<h2>${t('legal.terms.heading')}</h2>`,
            `<p>${t('legal.terms.intro')}</p>`,
            platformBlock,
            separator,
            mapOperatorBlock,
            `<h2>${t('legal.terms.purpose_heading')}</h2>`,
            `<p>${t('legal.terms.purpose_text')}</p>`,
            `<h2>${t('legal.terms.obligations_heading')}</h2>`,
            `<p>${t('legal.terms.obligations_text')}</p>`,
            `<h2>${t('legal.terms.liability_heading')}</h2>`,
            `<p>${t('legal.terms.liability_text', { name })}</p>`
        ].join('');
    };

    /**
     * Get a legal page object compatible with PageContent.vue
     */
    const getLegalPage = (type: LegalPageType) => {
        const op = operator.value;

        const name = escapeHtml(op?.name || op?.address?.organization || '');
        const email = sanitizeEmail(op?.email || '');
        const address = formatAddress(op?.address);

        const title = t(`legal.${type}.title`);
        const content = buildContent(type, name, address, email);

        return {
            id: `legal-${type}`,
            type: 'legal',
            attributes: {
                title,
                body: {
                    value: content,
                    processed: content
                }
            }
        };
    };

    return {
        getLegalPage,
        hasOperator
    };
}
