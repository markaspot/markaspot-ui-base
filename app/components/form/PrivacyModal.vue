<template>
  <UModal
    v-model:open="isOpen"
    :title="content?.title || $t('privacy.modal.title')"
    :content="{ 'aria-describedby': 'privacy-modal-content' }"
    :ui="{
      header: 'p-4 sm:p-6 pb-2',
      body: 'p-0 flex-1 overflow-y-auto',
      footer: 'sticky bottom-0 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] p-4 sm:p-6',
      overlay: 'z-[75] bg-neutral-900/50',
      content: 'z-[80]',
    }"
  >
    <slot>
      <UButton
        variant="outline"
        color="primary"
      >
        {{ $t('privacy.modal.title') }}
      </UButton>
    </slot>

    <template #body>
      <div
        id="privacy-modal-content"
        class="p-6 pt-2"
      >
        <AppLoadingState
          v-if="loading"
          :text="$t('privacy.modal.loading')"
          size="md"
          class="py-8"
        />

        <AppErrorState
          v-else-if="error"
          icon="i-heroicons-exclamation-triangle"
          :description="error"
          :retry-text="$t('privacy.modal.retry')"
          class="py-8"
          @retry="fetchPrivacyContent"
        />

        <div v-else-if="hasContent">
          <div
            class="prose prose-sm dark:prose-invert max-w-none"
            v-html="content.content"
          />
          <div
            v-if="content.lastModified"
            class="mt-4 pt-4 border-t text-xs text-neutral-500 dark:text-neutral-400"
          >
            {{ $t('privacy.modal.lastUpdated') }}: {{ formatDate(content.lastModified) }}
          </div>
        </div>

        <AppEmptyState
          v-else
          icon="i-heroicons-document-text"
          :title="$t('privacy.modal.noContent')"
          class="py-8"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <UButton
          variant="outline"
          @click="isOpen = false"
        >
          {{ $t('common.close') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { usePrivacyContent } from '~/composables/usePrivacyContent';

const isOpen = ref(false);

const { content, loading, error, hasContent, fetchPrivacyContent } = usePrivacyContent();
const { formatDateOnly } = useFormatters();

// Lazy-load on first open. Watching isOpen is more reliable than UModal's
// @open event in Nuxt UI 4 when the trigger is the default slot.
watch(isOpen, (open) => {
    if (open && !hasContent.value && !loading.value) {
        fetchPrivacyContent();
    }
});

const formatDate = (dateString: string) => {
    return formatDateOnly(dateString) || dateString;
};
</script>
