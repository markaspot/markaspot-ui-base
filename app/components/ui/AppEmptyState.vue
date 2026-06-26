<template>
  <div
    :class="[
      'flex flex-col items-center justify-center text-center p-8',
      fullHeight ? 'flex-1' : '',
    ]"
  >
    <UIcon
      v-if="icon"
      :name="icon"
      :class="['mb-4', iconClass]"
    />
    <h3
      v-if="title"
      class="text-lg font-medium text-[var(--ui-text)] mb-2"
    >
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="text-[var(--ui-text-muted)] max-w-sm"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.action"
      class="mt-4"
    >
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    icon?: string
    iconClass?: string
    title?: string
    description?: string
    fullHeight?: boolean
}>(), {
    icon: 'i-lucide-inbox',
    iconClass: 'w-12 h-12 text-[var(--ui-text-muted)]',
    fullHeight: false
});
</script>
