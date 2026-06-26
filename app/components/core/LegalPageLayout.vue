<template>
  <div class="min-h-dvh bg-[var(--ui-bg)] flex flex-col">
    <header class="sticky top-0 z-10 bg-[var(--ui-bg)]/95 backdrop-blur border-b border-[var(--ui-border)]">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <UButton
          :to="backPath"
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          :aria-label="$t('common.back')"
        />
        <h1 class="text-lg font-semibold text-[var(--ui-text)] truncate">
          {{ page?.attributes?.title }}
        </h1>
      </div>
    </header>
    <main class="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
      <div
        v-if="page?.attributes?.body?.processed"
        class="prose prose-sm dark:prose-invert max-w-none"
        v-html="sanitizeRichHtml(page.attributes.body.processed)"
      />
      <div
        v-else
        class="text-neutral-500 dark:text-neutral-400"
      >
        {{ $t('legal.not_configured') }}
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { LegalPageType } from '~/types';
import { sanitizeRichHtml } from '~/utils/sanitize';

const props = defineProps<{
    pageType: LegalPageType
}>();

const { getLegalPage } = useLegalPages();
const { buildPath } = useJurisdictions();

const page = computed(() => getLegalPage(props.pageType));
const backPath = computed(() => buildPath('/'));
</script>
