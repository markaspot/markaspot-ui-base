<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div
      v-if="message"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      class="mt-2 px-2 py-1.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-md"
    >
      <div class="flex items-start gap-1.5">
        <UIcon
          name="i-heroicons-information-circle"
          class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p class="text-xs text-amber-900 dark:text-amber-200 leading-snug">
          {{ message }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
    message?: string
}

defineProps<Props>();
</script>
