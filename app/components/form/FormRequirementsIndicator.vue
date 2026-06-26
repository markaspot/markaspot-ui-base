<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="shouldShow"
      ref="indicatorEl"
      class="requirements-indicator rounded-lg border p-4 mb-4"
      :class="[
        allComplete
          ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
        highlight && 'attention-pulse',
      ]"
      role="status"
      aria-live="polite"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <UIcon
            :name="headerIcon"
            :class="[
              'w-5 h-5',
              allComplete
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-500 dark:text-neutral-400',
            ]"
          />
          <span
            class="font-medium text-sm"
            :class="[
              allComplete
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-neutral-700 dark:text-neutral-300',
            ]"
          >
            {{ headerText }}
          </span>
        </div>
        <span
          class="text-xs font-medium px-2 py-0.5 rounded-full"
          :class="[
            allComplete
              ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400',
          ]"
        >
          {{ completedCount }}/{{ totalCount }}
        </span>
      </div>

      <!-- Requirements List -->
      <ul class="space-y-2">
        <li
          v-for="req in visibleRequirements"
          :key="req.field"
          class="flex items-center gap-2 text-sm"
        >
          <UIcon
            :name="req.complete ? 'i-heroicons-check-circle-solid' : 'i-heroicons-exclamation-circle'"
            :class="[
              'w-4 h-4 flex-shrink-0 transition-colors duration-200',
              req.complete
                ? 'text-green-500 dark:text-green-400'
                : 'text-neutral-500 dark:text-neutral-400',
            ]"
          />
          <span
            :class="[
              'transition-all duration-200',
              req.complete
                ? 'text-neutral-400 dark:text-neutral-400'
                : 'text-neutral-700 dark:text-neutral-300',
            ]"
          >
            {{ req.label }}
            <span
              v-if="req.conditional"
              class="text-xs text-neutral-400 dark:text-neutral-500 ml-1"
            >
              ({{ t('form.requirements.conditional') }})
            </span>
          </span>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * FormRequirementsIndicator Component
 *
 * Displays a live checklist of required form fields with visual completion status.
 * Helps users understand what fields need to be filled before submission.
 */

export interface Requirement {
    /** Unique field identifier */
    field: string
    /** Display label for the requirement */
    label: string
    /** Whether the requirement has been completed */
    complete: boolean
    /** Whether this requirement is conditional (e.g., category-dependent) */
    conditional?: boolean
}

interface Props {
    /** Array of requirements to display */
    requirements: Requirement[]
    /** Whether to show the indicator when all requirements are complete */
    showWhenComplete?: boolean
    /** Whether to show the indicator (controlled by parent) */
    visible?: boolean
    /** Whether the indicator should pulse to draw attention */
    highlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showWhenComplete: true,
    visible: false,
    highlight: false
});

const { t } = useI18n();

// All requirements passed from parent should be visible
const visibleRequirements = computed(() => props.requirements);

// Count completed requirements
const completedCount = computed(() =>
    visibleRequirements.value.filter(req => req.complete).length
);

// Total count of requirements
const totalCount = computed(() => visibleRequirements.value.length);

// Check if all requirements are complete
const allComplete = computed(() =>
    completedCount.value === totalCount.value && totalCount.value > 0
);

// Determine if we should show the indicator
const shouldShow = computed(() => {
    // Must be explicitly visible (controlled by parent)
    if (!props.visible) return false;
    // Don't show if no requirements
    if (totalCount.value === 0) return false;
    // Hide when complete if showWhenComplete is false
    if (allComplete.value && !props.showWhenComplete) return false;
    return true;
});

// Header text based on completion state
const headerText = computed(() =>
    allComplete.value
        ? t('form.requirements.ready_to_submit')
        : t('form.requirements.title')
);

// Header icon based on completion state
const headerIcon = computed(() =>
    allComplete.value
        ? 'i-heroicons-check-badge-solid'
        : 'i-heroicons-clipboard-document-list'
);

// Ref to the indicator element for scrolling
const indicatorEl = ref<HTMLElement | null>(null);

// Method to scroll the indicator into view
const scrollIntoView = () => {
    indicatorEl.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
};

// Expose the scrollIntoView method for parent components
defineExpose({
    scrollIntoView,
    el: indicatorEl
});
</script>

<style scoped>
.requirements-indicator {
  /* Smooth transitions for state changes */
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* Attention pulse animation for drawing user attention */
@keyframes attention-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.attention-pulse {
  animation: attention-pulse 0.6s ease-out 2;
}
</style>
