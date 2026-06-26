<template>
  <div
    :class="[
      'flex items-center justify-center',
      fullScreen ? 'h-dvh w-full' : 'flex-1',
      'bg-[var(--ui-bg)]',
    ]"
  >
    <div class="text-center">
      <AppSpinner
        :size="size"
        class="mx-auto mb-4"
        :class="spinnerClass"
      />
      <p
        v-if="text"
        class="text-[var(--ui-text-muted)]"
      >
        {{ text }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    text?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    fullScreen?: boolean
    spinnerClass?: string
}>(), {
    size: 'lg',
    fullScreen: false,
    spinnerClass: 'text-[var(--ui-primary)]'
});
</script>
