<template>
  <div class="app-select-menu">
    <USelectMenu
      v-bind="$attrs"
      :id="id"
      :model-value="modelValue"
      :items="(items as any)"
      :loading="loading"
      :disabled="disabled"
      :placeholder="placeholder"
      :color="(color as any)"
      :size="size"
      :variant="variant"
      :option-attribute="optionAttribute"
      :value-attribute="valueAttribute"
      :by="by || valueAttribute"
      :search-input="searchInputConfig"
      @update:model-value="onUpdate"
      @change="$emit('change', $event)"
    >
      <slot />
    </USelectMenu>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface SelectMenuItem {
    label: string
    value: string | number
    disabled?: boolean
    [key: string]: unknown
}

const props = defineProps<{
    modelValue: unknown
    items?: SelectMenuItem[]
    loading?: boolean
    disabled?: boolean
    placeholder?: string
    searchPlaceholder?: string
    color?: string
    id?: string
    size?: 'xs' | 'sm' | 'md' | 'lg'
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
    optionAttribute?: string
    valueAttribute?: string
    by?: string
}>();

const emit = defineEmits<{
    'update:modelValue': [value: unknown]
    'change': [evt: unknown]
}>();

const size = computed(() => props.size || 'md');
const variant = computed(() => props.variant || 'soft');
const optionAttribute = computed(() => props.optionAttribute || 'label');
const valueAttribute = computed(() => props.valueAttribute || 'value');

const searchInputConfig = computed(() => ({
    placeholder: props.searchPlaceholder || t('common.search') || 'Suchen...'
}));

const onUpdate = (val: unknown) => emit('update:modelValue', val);
</script>

<style scoped>
/* Ensure option items match placeholder/trigger size */
.app-select-menu :deep([role="listbox"] [role="option"]) {
  font-size: 1rem; /* text-base */
  line-height: 1.5rem; /* leading-6 */
}
</style>
