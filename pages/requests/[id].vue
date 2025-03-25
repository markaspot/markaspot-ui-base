<template>
  <div class="relative h-screen w-full bg-slate-100 flex">
    <Index :initial-request-id="route.params.id" />
  </div>
</template>

<script setup lang="ts">
import Index from '../index.vue'

defineI18nRoute(false)

const route = useRoute()


</script>
