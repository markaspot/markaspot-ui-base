<template>
  <!-- AI Processing Status - Shows only when AI is enabled and processing -->
  <div
    v-if="isAIEnabled && isAIProcessing"
    class="bg-primary-50 dark:bg-neutral-800 border border-primary-100 dark:border-neutral-700 rounded-lg p-4"
  >
    <div class="flex items-center gap-2">
      <UIcon
        name="i-heroicons-cpu-chip"
        class="w-5 h-5 text-neutral-500 dark:text-neutral-400"
      />
      <span class="text-sm font-medium text-primary-700 dark:text-primary-400">{{ t('report.ai.analyzing') }}</span>
    </div>
    <div class="mt-3 space-y-2">
      <div
        v-for="step in processingSteps"
        :key="step.field"
        class="flex items-center gap-2 text-sm pl-7"
      >
        <AppSpinner
          v-if="step.status === 'pending'"
          size="sm"
          class="text-neutral-500 dark:text-neutral-400"
        />
        <UIcon
          v-else-if="step.status === 'warning'"
          name="i-heroicons-exclamation-triangle"
          class="w-4 h-4 text-amber-500 dark:text-amber-400"
        />
        <UIcon
          v-else
          name="i-heroicons-check-circle"
          class="w-4 h-4 text-green-500 dark:text-green-400"
        />
        <span
          :class="[
            step.status === 'complete' ? 'text-green-700 dark:text-green-400' : '',
            step.status === 'warning' ? 'text-amber-700 dark:text-amber-400' : '',
            step.status === 'pending' ? 'text-neutral-600 dark:text-neutral-300' : '',
          ]"
          :aria-live="step.status === 'complete' || step.status === 'warning' ? 'polite' : 'off'"
        >
          {{ step.message }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
    modelValue?: any // Not used, but required for consistency
    isAIEnabled?: boolean
    isAIProcessing?: boolean
    processingSteps?: Array<{ field: string, status: 'pending' | 'complete' | 'warning', message: string }>
}

interface Emits {
    'update:modelValue': [value: any]
    'validation': [isValid: boolean]
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// This component doesn't need to emit any model updates since it's just a status display
</script>
