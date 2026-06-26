<script setup lang="ts">
/**
 * ReportFlagButton
 *
 * Allows citizens to flag/report inappropriate content on a service request.
 * Uses localStorage to track whether the current user has already flagged.
 */
import type { Report } from '~~/types';
import { useFlag } from '~/composables/features/useFlag';

const { t } = useI18n();
const toast = useToast();

const props = defineProps<{
    report: Report
}>();

const { isFlagged, submitFlag, isSubmitting } = useFlag(() => props.report.service_request_id);

const isModalOpen = ref(false);

const handleClick = () => {
    if (isFlagged.value) {
        toast.add({
            id: 'already-flagged',
            title: t('flag.already_flagged'),
            icon: 'i-heroicons-flag-20-solid',
            color: 'warning',
            duration: 3000
        });
        return;
    }
    isModalOpen.value = true;
};

const handleFlagSubmitted = () => {
    isModalOpen.value = false;
};
</script>

<template>
  <UTooltip :text="isFlagged ? t('report.buttons.flag_submitted') : t('report.buttons.flag')">
    <UButton
      :icon="isFlagged ? 'i-heroicons-flag-20-solid' : 'i-heroicons-flag'"
      variant="ghost"
      :color="isFlagged ? 'warning' : 'neutral'"
      size="sm"
      :aria-label="`${t('report.buttons.flag')}: ${props.report.service_name} #${props.report.service_request_id}`"
      @click="handleClick"
    />
  </UTooltip>

  <ReportFlagModal
    v-model:open="isModalOpen"
    :report="report"
    :submit-flag="submitFlag"
    :is-submitting="isSubmitting"
    @flagged="handleFlagSubmitted"
  />
</template>
