<template>
  <UTextarea
    v-bind="$attrs"
    :variant="variant"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotData"
    >
      <slot
        :name="name"
        v-bind="slotData"
      />
    </template>
  </UTextarea>
</template>

<script setup lang="ts">
/**
 * AppTextarea - Centralized Textarea wrapper with soft variant default
 *
 * Usage: <AppTextarea v-model="value" placeholder="..." />
 * Override variant: <AppTextarea variant="outline" v-model="value" />
 */

defineOptions({
    inheritAttrs: false
});

type AppTextareaProps = {
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
};

withDefaults(
    defineProps<AppTextareaProps>(),
    {
        variant: 'soft'
    }
);
</script>
