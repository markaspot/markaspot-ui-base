<template>
  <div class="app-select">
    <USelect
      v-bind="$attrs"
      :id="id"
      :model-value="(modelValue as any)"
      :options="options"
      :placeholder="placeholder"
      :state="state"
      :color="(color as any)"
      :size="size"
      :variant="variant"
      :ui="mergedUi"
      @update:model-value="onUpdate"
      @change="$emit('change', $event)"
    >
      <slot />
    </USelect>
  </div>
</template>

<script setup lang="ts">
interface SelectOption {
    label: string
    value: string | number
    disabled?: boolean
    [key: string]: unknown
}

const props = defineProps<{
    modelValue: string | number | boolean | Record<string, unknown> | null | undefined
    options?: SelectOption[]
    placeholder?: string
    state?: string
    color?: string
    id?: string
    size?: 'xs' | 'sm' | 'md' | 'lg'
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
    ui?: Record<string, unknown>
}>();

// Set defaults
const variant = computed(() => props.variant || 'soft');

const emit = defineEmits<{
    'update:modelValue': [value: unknown]
    'change': [evt: unknown]
}>();

const size = computed(() => props.size || 'md');

const mergedUi = computed(() => ({
    wrapper: 'z-[120] fixed',
    container: 'z-[120]',
    content: 'z-[120] text-base',
    placeholder: 'text-base',
    ...(props.ui || {})
}));

const onUpdate = (val: unknown) => emit('update:modelValue', val);
</script>

<style scoped>
/* Ensure option items match placeholder/trigger size */
.app-select :deep([role="listbox"] [role="option"]) {
  font-size: 1rem; /* text-base */
  line-height: 1.5rem; /* leading-6 */
}
</style>
