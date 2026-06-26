<template>
  <Teleport to="body">
    <UModal
      v-model:open="isOpen"
      :title="$t('contact.title')"
      :close="true"
      :ui="{
        content: 'z-[70] pt-safe pb-safe',
        overlay: 'fixed inset-0',
      }"
      @close="handleClose({ _closeAction: true })"
    >
      <template #description>
        <p class="sr-only">
          {{ $t('contact.dialog_description') }}
        </p>
      </template>

      <template #body>
        <div class="p-6 pt-2">
          <ClientOnly>
            <ContactForm
              @success="handleClose({ success: true })"
              @error="(msg) => console.error('Contact form error:', msg)"
              @close="handleClose({ _closeAction: true })"
            />
          </ClientOnly>
        </div>
      </template>
    </UModal>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * ContactModal Component
 *
 * Modal wrapper for the contact form, following the FeedbackModal pattern.
 */

// Lazy load the form component
const ContactForm = defineAsyncComponent(() => import('~/components/form/ContactForm.vue'));

interface Props {
    modelValue?: boolean
}

interface Emits {
    'close': [data?: { success?: boolean, _closeAction?: boolean }]
    'update:modelValue': [value: boolean]
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false
});

const emit = defineEmits<Emits>();

// Two-way model for Nuxt UI 3 (v-model:open)
const isOpen = computed({
    get: () => props.modelValue,
    set: (val: boolean) => {
        emit('update:modelValue', val);
        if (!val) {
            emit('close', { _closeAction: true });
        }
    }
});

const handleClose = (data?: { success?: boolean, _closeAction?: boolean }) => {
    emit('close', data);
};
</script>
