<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">
    <h1 class="text-2xl font-bold mb-6">
      {{ title }}
    </h1>

    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * PageContainer Component
 *
 * PageContainer component providing user interface functionality.
 */

defineProps<{
    title: string
}>();
</script>

<style scoped>
.container {
  min-height: 80vh;
}
</style>
