<template>
  <FullScreenModal
    v-model="isOpen"
    :title="title || page?.attributes?.title"
    :close-button="true"
    @close="handleClose"
  >
    <!-- Content -->
    <div class="p-4">
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
    </div>

    <!-- Footer (optional) -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          @click="handleClose"
        >
          {{ t('common.close') }}
        </UButton>
      </div>
    </template>
  </FullScreenModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import FullScreenModal from '@/components/shared/FullScreenModal.vue';
import { sanitizeRichHtml } from '~/utils/sanitize';

const { t } = useI18n();

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
    modelValue: boolean
    page?: Page
    title?: string
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'close': []
}>();

// Two-way model binding for sheet open/close state
const isOpen = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit('update:modelValue', val)
});

const handleClose = () => {
    emit('close');
};

// Expose openSheet method for parent components
defineExpose({
    openSheet: () => {
        emit('update:modelValue', true);
    }
});
</script>
