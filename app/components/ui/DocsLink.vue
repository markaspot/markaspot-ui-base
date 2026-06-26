<template>
  <UButton
    :to="href"
    target="_blank"
    rel="noopener noreferrer"
    :variant="variant"
    :color="color"
    :size="size"
    :icon="icon"
    trailing-icon="i-heroicons-arrow-top-right-on-square"
    :label="iconOnly ? undefined : (label || t('common.learn_more'))"
    :aria-label="accessibleName"
  />
</template>

<script setup lang="ts">
/**
 * DocsLink
 *
 * Standardised contextual link into the end-user documentation (issue #191).
 * Renders a UButton that opens the docs in a new tab with the safe
 * `noopener noreferrer` rel and a screen-reader-only "(opens in new tab)"
 * announcement (the generic `common.opens_in_new_tab` key, reused across all
 * external links — distinct from the facility-specific
 * `form.field.facility_opens_in_new_tab`).
 *
 * Pass an absolute URL via `href` (build it with useDocsLinks). Defaults to a
 * subtle "Learn more" link styling so it reads as a secondary helper, not a
 * primary action.
 *
 * Accessibility (WCAG 2.4.4): when several DocsLinks share a page, a bare
 * "Learn more" gives a screen-reader links-list a row of identical names. Pass
 * `ariaLabel` with a contextual name (e.g. "Learn more about categories") so
 * each link is distinguishable out of context. `iconOnly` drops the visible
 * text (e.g. tight mobile headers) but the link still needs an `ariaLabel`.
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(defineProps<{
    href: string
    label?: string
    ariaLabel?: string
    iconOnly?: boolean
    icon?: string
    variant?: 'link' | 'ghost' | 'soft' | 'outline' | 'solid' | 'subtle'
    color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'info' | 'warning' | 'error'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
    label: '',
    ariaLabel: '',
    iconOnly: false,
    icon: 'i-heroicons-book-open',
    variant: 'link',
    color: 'primary',
    size: 'sm'
});

const { t } = useI18n();

// Accessible name precedence: explicit ariaLabel > visible label > default.
// The sr-only "(opens in new tab)" suffix is appended once here so screen
// readers announce both the topic and the new-tab behaviour without the
// visible label and the suffix being read twice.
const accessibleName = computed(() => {
    const base = props.ariaLabel || props.label || t('common.learn_more');
    return `${base} ${t('common.opens_in_new_tab')}`;
});
</script>
