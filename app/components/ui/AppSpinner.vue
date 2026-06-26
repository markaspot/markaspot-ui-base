<template>
  <UIcon
    name="i-lucide-loader-circle"
    :class="[sizeClasses[size], 'animate-spin', props.class]"
  />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    class?: string
}>(), { size: 'md' });

const sizeClasses: Record<typeof props.size, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
};
</script>
