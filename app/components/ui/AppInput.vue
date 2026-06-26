<template>
  <UInput
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
  </UInput>
</template>

<script setup lang="ts">
/**
 * AppInput - Centralized Input wrapper with soft variant default
 *
 * Usage: <AppInput v-model="value" placeholder="..." />
 * Override: <AppInput variant="outline" v-model="value" />
 */

defineOptions({
    inheritAttrs: false
});

type AppInputProps = {
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
};

withDefaults(
    defineProps<AppInputProps>(),
    {
        variant: 'soft'
    }
);
</script>
