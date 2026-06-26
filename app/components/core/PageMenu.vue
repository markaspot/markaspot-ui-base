<template>
  <nav
    class="border-t border-[var(--ui-border)]"
    :aria-label="$t('navigation.pages')"
  >
    <div
      v-if="loading"
      class="flex justify-center items-center py-4"
    >
      <AppSpinner
        size="md"
        class="text-neutral-400"
      />
    </div>

    <div
      v-else
      :class="pageGridClass"
    >
      <UButton
        v-for="(page, index) in filteredPages"
        :key="page.id"
        color="neutral"
        variant="ghost"
        :class="[
          'relative h-auto p-4 flex flex-col items-center gap-2 rounded-none hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-r border-[var(--ui-border)] last:border-r-0',
          { 'col-span-2': !showContactButton && lastItemSpansFull && index === filteredPages.length - 1 },
        ]"
        :role="'button'"
        :aria-selected="undefined"
        :aria-controls="undefined"
        :aria-label="page.attributes.title"
        :title="page.attributes.title"
        @click="handleClick(page as any)"
      >
        <UIcon
          :name="resolvePageMenuIcon((page.attributes as any).field_page_icon, page.attributes.title)"
          class="w-5 h-5"
          aria-hidden="true"
        />
        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {{ page.attributes.title }}
        </span>
      </UButton>

      <!-- Contact button (when feature enabled and no Kontakt page exists) -->
      <UButton
        v-if="showContactButton"
        color="neutral"
        variant="ghost"
        :class="[
          'relative h-auto p-4 flex flex-col items-center gap-2 rounded-none hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-r border-[var(--ui-border)] last:border-r-0',
          { 'col-span-2': lastItemSpansFull },
        ]"
        :aria-label="$t('contact.title')"
        :title="$t('contact.title')"
        @click="emit('open-contact')"
      >
        <UIcon
          name="i-lucide-mail"
          class="w-5 h-5"
          aria-hidden="true"
        />
        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {{ $t('contact.title') }}
        </span>
      </UButton>
    </div>
  </nav>
</template>

<script setup lang="ts">
/**
 * PageMenu Component
 *
 * Interactive button component with styling and event handling.
 * Filters CMS pages based on jurisdiction-specific feature flags.
 */

import { resolvePageMenuIcon } from '~/utils/pageMenuIcons';

interface Page {
    id: string
    attributes: {
        title: string
        field_page_icon?: string
        sticky?: boolean
        body: {
            processed: string
        }
    }
}

const emit = defineEmits<{
    'select-page': [page: Page]
    'open-contact': []
}>();

const { pages, loading, fetchPages } = usePages();
const { features } = useMarkASpotConfig();
const { locale } = useI18n();

const isContactPage = (title: string): boolean => {
    const lower = title.toLowerCase().trim();
    return lower === 'kontakt' || lower === 'contact';
};

const contactFormEnabled = computed(() => features.value?.contactForm);
const hasContactPage = computed(() => pages.value.some((p: any) => isContactPage(p.attributes.title)));
const showContactButton = computed(() => contactFormEnabled.value && !hasContactPage.value);

// Map page titles (keywords) to feature flags
// Pages containing these keywords are hidden when the feature is disabled
const PAGE_FEATURE_MAP: Record<string, keyof typeof features.value> = {
    statistik: 'statistics',
    statistics: 'statistics',
    stats: 'statistics'
};

// Filter pages based on runtime feature flags
const filteredPages = computed(() => {
    if (!pages.value) return [];

    return pages.value.filter((page) => {
        // Skip sticky pages (shown as start content in info panel)
        if (page.attributes?.sticky) return false;

        const title = page.attributes.title?.toLowerCase() || '';

        // Check if this page matches any feature-gated keywords
        for (const [keyword, featureKey] of Object.entries(PAGE_FEATURE_MAP)) {
            if (title.includes(keyword)) {
                // If the feature is explicitly disabled, hide this page
                if (features.value?.[featureKey] === false) {
                    return false;
                }
            }
        }

        return true;
    });
});

const totalItems = computed(() => filteredPages.value.length + (showContactButton.value ? 1 : 0));
const gridCols = computed(() => {
    const count = totalItems.value;
    if (count <= 1) return 1;
    if (count % 3 === 0) return 3;
    return 2;
});
const pageGridClass = computed(() => {
    if (gridCols.value === 1) return 'grid grid-cols-1';
    if (gridCols.value === 3) return 'grid grid-cols-3';
    return 'grid grid-cols-2';
});
const lastItemSpansFull = computed(() => gridCols.value === 2 && totalItems.value % 2 === 1);

const handleClick = (page: Page) => {
    if (contactFormEnabled.value && isContactPage(page.attributes.title)) {
        emit('open-contact');
        return;
    }
    emit('select-page', page);
};

// Watch locale changes - store cleanup function
let stopLocaleWatch: (() => void) | undefined;

onMounted(async () => {
    await fetchPages();

    // Refetch pages when locale changes
    stopLocaleWatch = watch(locale, async (newLocale, oldLocale) => {
        if (newLocale !== oldLocale) {
            if (import.meta.dev) {
                console.log('[PageMenu] Locale changed:', oldLocale, '→', newLocale);
            }
            await fetchPages();
        }
    });
});

onUnmounted(() => {
    stopLocaleWatch?.();
});
</script>
