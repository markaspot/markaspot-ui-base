<template>
  <div class="mx-4 mb-3 pt-2 border-t border-[var(--ui-border)] text-xs text-neutral-600 dark:text-neutral-300 text-center">
    <template v-if="hasOperator && isFastmap">
      <NuxtLink
        :to="buildPath('/impressum')"
        class="hover:text-neutral-700 dark:hover:text-neutral-200 focus-visible:text-neutral-700 dark:focus-visible:text-neutral-200 focus-visible:underline focus-visible:outline-none transition-colors"
      >
        {{ $t('legal.footer.impressum') }}
      </NuxtLink>
      <span aria-hidden="true"> · </span>
      <NuxtLink
        :to="buildPath('/privacy')"
        class="hover:text-neutral-700 dark:hover:text-neutral-200 focus-visible:text-neutral-700 dark:focus-visible:text-neutral-200 focus-visible:underline focus-visible:outline-none transition-colors"
      >
        {{ $t('legal.footer.privacy') }}
      </NuxtLink>
      <span aria-hidden="true"> · </span>
      <NuxtLink
        :to="buildPath('/terms')"
        class="hover:text-neutral-700 dark:hover:text-neutral-200 focus-visible:text-neutral-700 dark:focus-visible:text-neutral-200 focus-visible:underline focus-visible:outline-none transition-colors"
      >
        {{ $t('legal.footer.terms') }}
      </NuxtLink>
    </template>
    <span
      v-if="hasOperator && isFastmap && showLoginLink"
      aria-hidden="true"
    > · </span>
    <NuxtLink
      v-if="showLoginLink"
      :to="loginPath"
      class="hover:text-neutral-700 dark:hover:text-neutral-200 focus-visible:text-neutral-700 dark:focus-visible:text-neutral-200 focus-visible:underline focus-visible:outline-none transition-colors"
    >
      {{ $t('auth.welcome.sign_in') }}
    </NuxtLink>
    <div class="mt-1 flex flex-wrap justify-center">
      <a
        :href="markASpotUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-neutral-700 dark:hover:text-neutral-200 focus-visible:text-neutral-700 dark:focus-visible:text-neutral-200 focus-visible:underline focus-visible:outline-none transition-colors"
      >
        Powered by Mark-a-Spot v{{ pkgVersion }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
    showLoginLink: boolean
    loginPath: string
    pkgVersion: string
}>();

const { locale } = useI18n();
const { hasOperator } = useLegalPages();
const { buildPath } = useJurisdictions();
// Legal links (Impressum/Datenschutz/Nutzungsbedingungen) gehören nur in den
// FastMap/CivicSpot-Self-Service-Modus. Enterprise-Tenants pflegen ihre
// Rechtsseiten als eigene Seiten (Kacheln), daher hier ausgeblendet.
const { public: { fastmap: isFastmap } } = useRuntimeConfig();

// Mark-a-Spot uses different domains per locale (differentDomains routing).
// Visitors land on the same locale they're already reading.
const markASpotDomain: Record<string, string> = {
    de: 'www.markaspot.de',
    en: 'www.mark-a-spot.com',
    fr: 'www.mark-a-spot.info',
    es: 'www.mark-a-spot.eu'
};
const markASpotUrl = computed(() => {
    // Extract primary subtag so de-ls maps to the German domain rather
    // than falling through to the EN default. Locales without a target
    // domain (ar, it, nl, ...) still fall through to EN intentionally.
    const primary = (locale.value || 'en').split('-')[0] ?? 'en';
    return `https://${markASpotDomain[primary] ?? markASpotDomain.en}`;
});
</script>
