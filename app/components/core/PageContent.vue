<template>
  <!-- Desktop Modal -->
  <UModal
    v-if="shouldUseDesktopModal()"
    v-model:open="isModalOpen"
    :title="title || page?.attributes?.title"
    :close="true"
    aria-modal="true"
    :ui="{
      content: 'z-[500]',
      overlay: 'z-[400] fixed inset-0 bg-neutral-900/30 transition-opacity',
    }"
    @open="handleModalOpen"
    @update:open="handleUpdateOpen"
    @close="closeModal"
  >
    <template #description>
      <p class="sr-only">
        {{ t('pages.dialog_description') || 'Page content dialog' }}
      </p>
    </template>
    <!-- Hidden trigger - modal auto-opens programmatically -->
    <slot>
      <button
        type="button"
        style="display: none;"
        aria-hidden="true"
        @click="openModal"
      >
        {{ title || page?.attributes?.title || t('common.open') }}
      </button>
    </slot>

    <!-- Modal content using structured layout -->
    <template #body>
      <!-- Custom slot content -->
      <slot name="content">
        <!-- Fallback to page content -->
        <div
          v-if="page?.attributes?.body?.processed"
          class="prose prose-sm dark:prose-invert max-w-none"
          v-html="sanitizeRichHtml(page.attributes.body.processed)"
        />
        <div
          v-else
          class="text-neutral-500 dark:text-neutral-400"
        >
          No content available
        </div>
      </slot>
    </template>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          @click="closeModal"
        >
          {{ t('common.close') }}
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Mobile Full-Screen Sheet -->
  <PageContentSheet
    v-if="!shouldUseDesktopModal()"
    v-model="isSheetOpen"
    :page="page"
    :title="title"
    @close="closeSheet"
  >
    <template #content>
      <slot name="content" />
    </template>
  </PageContentSheet>
</template>

<script setup lang="ts">
/**
 * PageContent Component
 *
 * Responsive modal component for displaying page content using Nuxt UI components.
 * Uses desktop modal or mobile fullscreen sheet based on screen size.
 */

import { useI18n } from 'vue-i18n';
import { useResponsive } from '@/composables/core/useResponsive';
import { sanitizeRichHtml } from '~/utils/sanitize';

const { t } = useI18n();
const { shouldUseDesktopModal, screenWidth } = useResponsive();

interface Page {
    id: string
    attributes: {
        title: string
        field_page_icon?: string
        body: {
            value: string
            processed: string
            format?: string
        }
    }
}

const props = defineProps<{
    page?: Page
    title?: string
}>();

const emit = defineEmits<{
    close: []
}>();

// Separate state for desktop modal and mobile sheet
const isModalOpen = ref(false);
const isSheetOpen = ref(false);
const isClosing = ref(false);

const openModal = () => {
    // Reset both states first
    isModalOpen.value = false;
    isSheetOpen.value = false;

    if (shouldUseDesktopModal()) {
        // Desktop: Use modal
        isModalOpen.value = true;
    } else {
        // Mobile: Use full-screen sheet
        isSheetOpen.value = true;
    }
};

const handleModalOpen = () => {
    // Modal opened - any initialization logic can go here
    if (import.meta.client) {
        setTimeout(() => {
            const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')) as HTMLElement[];
            const dialog = dialogs[dialogs.length - 1];
            if (dialog) dialog.setAttribute('aria-modal', 'true');
        }, 0);
    }
};

const closeModal = () => {
    // Trigger modal close, but delay parent unmount until transition ends
    isModalOpen.value = false;
    isSheetOpen.value = false; // Ensure sheet is also closed
    setTimeout(() => {
        emit('close');
    }, 220);
};

// Ensure overlay/Escape closures route through the same delayed close
const handleUpdateOpen = (val: boolean) => {
    if (val === false && !isClosing.value) {
        isClosing.value = true;
        closeModal();
        setTimeout(() => {
            isClosing.value = false;
        }, 300);
    }
};

const closeSheet = () => {
    isSheetOpen.value = false;
    isModalOpen.value = false; // Ensure modal is also closed
    emit('close');
};

// Auto-open the modal after component mounts (like ReportDetail)
onMounted(() => {
    // Use same timing as ReportDetail to avoid interference with bottom sheet drawer
    setTimeout(() => {
        openModal();
    }, 50);
});

// Expose openModal method for parent components
defineExpose({
    openModal
});
</script>
