<!-- components/StaticContentPanel.vue -->
<template>
  <div class="absolute inset-0 bg-[var(--ui-bg)] z-20 flex flex-col">
    <div class="flex items-center justify-between p-6 border-b">
      <h2 class="text-xl font-semibold text-neutral-900">
        {{ title }}
      </h2>
      <UButton
        icon="i-heroicons-x-mark"
        color="neutral"
        variant="ghost"
        @click="$emit('close')"
      />
    </div>
    <div class="flex-1 overflow-y-auto p-6">
      <template v-if="title === 'FAQ'">
        <div class="space-y-6">
          <div class="space-y-2">
            <h3 class="text-lg font-medium text-neutral-900">
              How do I report an issue?
            </h3>
            <p class="text-neutral-600 dark: text-neutral-100">
              Click the "Report Issue" button, select the category, and fill in the details.
            </p>
          </div>
          <div class="space-y-2">
            <h3 class="text-lg font-medium text-neutral-900">
              What happens after I submit?
            </h3>
            <p class="text-neutral-600 dark: text-neutral-100">
              City officials will review and assign your report to the appropriate department.
            </p>
          </div>
        </div>
      </template>
      <template v-else-if="title === 'Imprint'">
        <div class="space-y-6">
          <div class="space-y-2">
            <h3 class="text-lg font-medium text-neutral-900">
              Legal Information
            </h3>
            <p class="text-neutral-600 dark: text-neutral-100">
              City•Map is operated by the City Administration.
            </p>
          </div>
          <div class="space-y-2">
            <h3 class="text-lg font-medium text-neutral-900">
              Contact
            </h3>
            <p class="text-neutral-600 dark: text-neutral-100">
              City Administration<br>123 Main Street<br>12345 City
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * StaticContentPanel Component
 *
 * Form component with validation, error handling, and user interaction.
 */

defineProps<{
    title: string
}>();

defineEmits<{
    close: []
}>();
</script>
