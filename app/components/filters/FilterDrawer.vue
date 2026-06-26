<template>
  <Teleport to="body">
    <UModal
      v-model:open="isOpen"
      :title="$t('filters.drawer.title')"
      :fullscreen="true"
      prevent-close
    >
      <template #description>
        <p class="sr-only">
          {{ $t('filters.drawer.description') || 'Filter options dialog' }}
        </p>
      </template>

      <template #body>
        <FilterBar
          :filter-groups="filterGroups"
          :has-active-filters="hasActiveFilters"
          @toggle-filter="$emit('toggleFilter', $event)"
          @clear-filter="$emit('clearFilter', $event)"
          @clear-all-filters="$emit('clearAllFilters')"
        />
      </template>
    </UModal>
  </Teleport>
</template>

<script setup lang="ts">
import type { FilterGroup } from '~/composables/features/useReportsFilter';

interface Props {
    modelValue: boolean
    filterGroups: FilterGroup[]
    hasActiveFilters: boolean
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'toggleFilter': [filterId: string]
    'clearFilter': [filterId: string]
    'clearAllFilters': []
}>();

const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
});
</script>
