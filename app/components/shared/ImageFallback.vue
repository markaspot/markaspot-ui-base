<template>
  <div class="relative h-48 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800">
    <div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
      <UIcon
        name="i-heroicons-photo"
        class="w-12 h-12 text-neutral-400 mb-3"
      />
      <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {{ $t('report.form.media.no_image_available') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple fallback component for missing/removed images
</script>
