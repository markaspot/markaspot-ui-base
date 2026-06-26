<template>
  <div class="relative h-dvh w-full bg-[var(--ui-bg)] flex">
    <Index :initial-confirmation-uuid="uuid" />
  </div>
</template>

<script setup lang="ts" name="ConfirmDetailPage">
// Component name explicitly set with the name attribute above
import { useRoute } from 'vue-router';
import Index from '../index.vue';

// Auto-imported Nuxt routing helper
defineI18nRoute(false);

const route = useRoute();
const uuid = route.params.uuid as string;
</script>
