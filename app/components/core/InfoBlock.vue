<script setup lang="ts">
/**
 * InfoBlock Component
 *
 * InfoBlock component providing user interface functionality.
 */

import { sanitizeRichHtml } from '~/utils/sanitize';

const props = defineProps({
    apiEndpoint: {
        type: String,
        required: true
    },
    title: String,
    showInfo: Boolean,
    showOnFirstVisit: Boolean
});

const { infoBlock, loading, error, fetchInfoBlock } = useInfoBlock(props.apiEndpoint);
const { locale } = useI18n();

// Watch locale changes - store cleanup function
let stopLocaleWatch: (() => void) | undefined;

onMounted(() => {
    fetchInfoBlock();

    // Refetch info block when locale changes
    stopLocaleWatch = watch(locale, async (newLocale, oldLocale) => {
        if (newLocale !== oldLocale) {
            if (import.meta.dev) {
                console.log('[InfoBlock] Locale changed:', oldLocale, '→', newLocale);
            }
            await fetchInfoBlock();
        }
    });
});

onUnmounted(() => {
    stopLocaleWatch?.();
});
</script>

<template>
  <div>
    <!-- Skeleton loader -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <div class="space-y-2">
        <USkeleton class="h-6 w-3/4" />
        <USkeleton class="h-4 w-full" />
      </div>
      <div class="space-y-3">
        <USkeleton class="h-12 w-full rounded-lg" />
        <USkeleton class="h-12 w-full rounded-lg" />
        <USkeleton class="h-12 w-full rounded-lg" />
      </div>
    </div>

    <!-- Error message -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      :title="error"
      icon="i-heroicons-exclamation-triangle"
    />

    <!-- Info block -->
    <div
      v-else
      class="info-block-content"
      v-html="sanitizeRichHtml(infoBlock?.attributes?.body?.processed)"
    />
  </div>
</template>

<style scoped>
:deep(h2) {
  font-weight: 600;
  color: var(--ui-text);
  margin: 0 0 0.25rem 0;
}

:deep(p) {
  color: var(--ui-text-muted);
  margin: 0 0 1rem 0;
}

:deep(dl) {
  margin: 0;
}

:deep(dt) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--ui-text);
  margin: 0.5rem 0 0 0;
}

:deep(dt:first-of-type) {
  margin-top: 0;
}

:deep(dt .icon) {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  color: var(--ui-text-muted);
}

:deep(dd) {
  color: var(--ui-text-muted);
  margin: 0.125rem 0 0 1.5rem;
}
</style>
