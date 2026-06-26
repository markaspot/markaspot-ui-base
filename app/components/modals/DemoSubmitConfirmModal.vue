<template>
  <Teleport
    v-if="isDemoMode"
    to="body"
  >
    <UModal
      v-model:open="open"
      :title="modalTitle"
      :close="false"
      :ui="{
        content: 'z-[80] pt-safe pb-safe',
        overlay: 'fixed inset-0',
      }"
    >
      <template #body>
        <div
          class="space-y-6 p-6 pt-2"
          data-testid="demo-mode-modal"
        >
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-triangle-alert"
              class="h-6 w-6 flex-shrink-0 text-warning"
              aria-hidden="true"
            />
            <p class="text-[var(--ui-text)]">
              {{ modalBody }}
            </p>
          </div>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              data-testid="demo-submit-cancel"
              @click="onCancel"
            >
              {{ cancelLabel }}
            </UButton>
            <UButton
              color="primary"
              data-testid="demo-submit-confirm"
              @click="onConfirm"
            >
              {{ confirmLabel }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * DemoSubmitConfirmModal
 *
 * Blocking pre-submit gate shown only on the demo instance. The modal
 * intercepts every GeoReport `create_request` POST and forces an explicit
 * "Submit demo report" click before the submission proceeds.
 *
 * Cancel semantics (issue #432):
 *  - The Cancel button resolves the gate as `false`.
 *  - ESC and backdrop clicks are treated as Cancel (NOT Continue), so an
 *    accidental dismiss preserves the form data and never submits a real-
 *    looking report. UModal's default close affordance is suppressed via
 *    `:close="false"`; the v-model `set` handler below catches the
 *    framework-driven close paths and routes them through `resolveModal`.
 *  - Production tenants (demoMode === false) never mount the markup at all.
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/432
 */

import { useDemoMode } from '~/composables/core/useDemoMode';

const { t } = useI18n();
const { isDemoMode, isModalOpen, resolveModal } = useDemoMode();

const modalTitle = computed(() => t('demo_mode.modal.title'));
const modalBody = computed(() => t('demo_mode.modal.body'));
const confirmLabel = computed(() => t('demo_mode.modal.confirm_label'));
const cancelLabel = computed(() => t('demo_mode.modal.cancel_label'));

// Two-way binding for UModal's v-model:open. Opening is driven by the gate
// (confirmDemoSubmission). Any framework-driven close (ESC, backdrop click,
// programmatic close) maps to Cancel — see component-level JSDoc for the
// rationale.
const open = computed({
    get: () => isModalOpen.value,
    set: (value: boolean) => {
        if (!value && isModalOpen.value) {
            resolveModal(false);
        }
    }
});

const onCancel = () => resolveModal(false);
const onConfirm = () => resolveModal(true);
</script>
