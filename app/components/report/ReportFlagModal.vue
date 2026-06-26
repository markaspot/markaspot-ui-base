<script setup lang="ts">
/**
 * ReportFlagModal
 *
 * Modal form for submitting a flag/report on a service request.
 * Provides reason selection and optional details textarea.
 */
import type { Report } from '~~/types';

const { t } = useI18n();
const toast = useToast();

const props = defineProps<{
    report: Report
    submitFlag: (reason: string, details?: string) => Promise<boolean>
    isSubmitting: boolean
}>();

const emit = defineEmits<{
    flagged: []
}>();

const isOpen = defineModel<boolean>('open', { default: false });

// Form state
const selectedReason = ref('');
const details = ref('');

const reasons = computed(() => [
    { label: t('flag.reason_spam'), value: 'spam' },
    { label: t('flag.reason_offensive'), value: 'offensive' },
    { label: t('flag.reason_personal'), value: 'personal' },
    { label: t('flag.reason_location'), value: 'location' },
    { label: t('flag.reason_other'), value: 'other' }
]);

const isDetailsRequired = computed(() => selectedReason.value === 'other');

const canSubmit = computed(() => {
    if (!selectedReason.value) return false;
    if (isDetailsRequired.value && !details.value.trim()) return false;
    return true;
});

const resetForm = () => {
    selectedReason.value = '';
    details.value = '';
};

// Reset form when modal closes
watch(isOpen, (open) => {
    if (!open) {
        resetForm();
    }
});

const handleSubmit = async () => {
    if (!canSubmit.value) return;

    const success = await props.submitFlag(
        selectedReason.value,
        details.value.trim() || undefined
    );

    if (success) {
        toast.add({
            id: 'flag-success',
            title: t('flag.success'),
            icon: 'i-heroicons-check-circle',
            color: 'success',
            duration: 3000
        });
        emit('flagged');
    } else {
        toast.add({
            id: 'flag-error',
            title: t('flag.error'),
            icon: 'i-heroicons-exclamation-triangle',
            color: 'error',
            duration: 4000
        });
    }
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('flag.title')"
    :close="true"
    :ui="{
      content: 'z-[600] pt-safe pb-safe',
      overlay: 'z-[550] fixed inset-0',
    }"
  >
    <template #description>
      <p class="text-[var(--ui-text-muted)]">
        {{ t('flag.description') }}
      </p>
    </template>

    <template #body>
      <div class="p-6 pt-2 space-y-5">
        <!-- Reason selection -->
        <URadioGroup
          v-model="selectedReason"
          :items="reasons"
          :legend="t('flag.reason_label')"
          value-key="value"
          label-key="label"
          orientation="vertical"
        />

        <!-- Additional details -->
        <UFormField
          :label="t('flag.details_label')"
          :required="isDetailsRequired"
          :error="isDetailsRequired && !details.trim() ? t('flag.details_required') : undefined"
        >
          <UTextarea
            v-model="details"
            :placeholder="t('flag.details_placeholder')"
            autoresize
            :rows="3"
            :maxlength="500"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          @click="isOpen = false"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          color="error"
          :disabled="!canSubmit || isSubmitting"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          {{ t('flag.submit') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
