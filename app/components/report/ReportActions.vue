<script setup lang="ts">
import type { Report } from '~~/types';

defineProps<{
    report: Report
}>();

const { moderationEnabled } = useFeatureFlags();
</script>

<template>
  <div
    class="flex items-center gap-1"
    data-no-print
  >
    <ReportShareButton :report="report" />
    <ReportPrintButton :report="report" />
    <ReportFlagButton
      v-if="moderationEnabled"
      :report="report"
    />
  </div>
</template>
