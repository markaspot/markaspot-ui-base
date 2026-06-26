<script setup lang="ts">
/**
 * ErrorBoundary Component
 *
 * Catches errors in child components and displays a fallback UI.
 * Prevents entire application crashes from form component errors.
 */

interface Props {
    /**
   * Custom fallback message to display when an error occurs
   */
    fallbackMessage?: string
    /**
   * Whether to show error details in development mode
   */
    showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    fallbackMessage: 'An error occurred. Please try refreshing the page.',
    showDetails: true
});

const emit = defineEmits<{
    error: [error: Error]
}>();

const hasError = ref(false);
const error = ref<Error | null>(null);

/**
 * Check if we're in development mode
 */
const isDev = computed(() => import.meta.dev);

/**
 * Check if error details should be shown
 */
const shouldShowErrorDetails = computed(() => {
    return props.showDetails && isDev.value && error.value;
});

/**
 * Capture errors from child components
 */
onErrorCaptured((err: Error, instance, info) => {
    console.error('ErrorBoundary caught error:', err);
    console.error('Component info:', info);

    hasError.value = true;
    error.value = err;

    // Emit error event for parent handling
    emit('error', err);

    // Prevent error from propagating further
    return false;
});

/**
 * Reset error state
 */
const resetError = () => {
    hasError.value = false;
    error.value = null;
};

// Expose reset method for external access
defineExpose({
    resetError
});
</script>

<template>
  <div>
    <!-- Error Fallback UI -->
    <div
      v-if="hasError"
      class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-start gap-3">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
        />
        <div class="flex-1">
          <h3 class="font-medium text-red-900 dark:text-red-100 mb-2">
            {{ props.fallbackMessage }}
          </h3>

          <!-- Show error details in development -->
          <div
            v-if="shouldShowErrorDetails"
            class="mt-3 p-3 bg-red-100 dark:bg-red-950 rounded text-sm font-mono text-red-800 dark:text-red-200 overflow-auto max-h-40"
          >
            <div class="font-bold mb-1">
              {{ error.name }}
            </div>
            <div>{{ error.message }}</div>
            <div
              v-if="error.stack"
              class="mt-2 text-xs opacity-75"
            >
              {{ error.stack }}
            </div>
          </div>

          <UButton
            color="error"
            variant="outline"
            size="sm"
            class="mt-4"
            @click="resetError"
          >
            {{ $t('common.try_again') || 'Try Again' }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Normal content when no error -->
    <slot v-else />
  </div>
</template>
