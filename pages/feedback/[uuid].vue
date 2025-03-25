<template>
  <div class="relative h-screen w-full bg-slate-100 flex">
    <Index :initial-feedback-uuid="route.params.uuid" />
  </div>
</template>

<script setup lang="ts">
import Index from '../index.vue'

defineI18nRoute(false)

const route = useRoute()

</script>