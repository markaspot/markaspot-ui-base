<template>
  <div class="bg-[var(--ui-bg-elevated)] max-h-[60vh] overflow-y-auto">
    <div class="px-6 py-3 space-y-3">
      <!-- Search Input (if enabled) -->
      <SearchInput
        v-if="searchEnabled"
        :search-query="searchQuery"
        :is-client-searching="isClientSearching"
        :is-server-searching="isServerSearching"
        :show-expand-button="showExpandButton"
        :has-no-results="hasNoResults"
        @update:search-query="$emit('updateSearch', $event)"
        @expand="$emit('expandSearch')"
        @clear="$emit('clearSearch')"
        @focus-in="$emit('searchFocusIn')"
        @focus-out="$emit('searchFocusOut')"
      />

      <!-- Primary Filters - Status (Always visible — most relevant filter for citizens) -->
      <div
        v-if="(statusGroup?.options?.length || 0) > 0"
        class="space-y-2"
      >
        <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {{ statusGroup?.label }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <FilterPill
            v-for="filter in statusGroup?.options"
            :key="filter.id"
            :label="filter.label"
            :icon="filter.icon"
            :active="filter.active"
            :count="filter.count"
            :color="filter.color"
            @toggle="$emit('toggleFilter', filter.id)"
            @clear="$emit('clearFilter', filter.id)"
          />
        </div>
      </div>

      <!-- Primary Filters - Category (Always visible; gated on options like Status for symmetry) -->
      <div
        v-if="(categoryGroup?.options?.length || 0) > 0"
        class="space-y-2"
      >
        <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {{ categoryGroup?.label }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <FilterPill
            v-for="filter in categoryGroup?.options"
            :key="filter.id"
            :label="filter.label"
            :icon="filter.icon"
            :active="filter.active"
            :count="filter.count"
            :color="filter.color || 'gray'"
            @toggle="$emit('toggleFilter', filter.id)"
            @clear="$emit('clearFilter', filter.id)"
          />
        </div>
      </div>

      <!-- More Filters Button -->
      <div
        v-if="secondaryFilterCount > 0"
        class="pt-2"
      >
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--ui-text)] bg-[var(--ui-bg)] border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200"
          :aria-expanded="isExpanded"
          aria-controls="filter-secondary-panel"
          @click="isExpanded = !isExpanded"
        >
          <UIcon
            name="i-heroicons-funnel"
            class="w-4 h-4"
          />
          <span>{{ isExpanded ? $t('filters.actions.collapse') : $t('filters.actions.more') }}</span>
          <span
            v-if="!isExpanded && secondaryFilterCount > 0"
            class="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-[var(--ui-text-muted)] bg-neutral-100 dark:bg-neutral-700 rounded"
          >
            +{{ secondaryFilterCount }}
          </span>
          <UIcon
            :name="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
            class="w-4 h-4"
          />
        </button>
      </div>

      <!-- Secondary Filters - Time (Expandable; Status is now primary above) -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-[500px]"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 max-h-[500px]"
        leave-to-class="opacity-0 max-h-0"
      >
        <div
          v-if="isExpanded"
          id="filter-secondary-panel"
          class="space-y-2"
        >
          <!-- Time Group -->
          <div
            v-if="(timeGroup?.options?.length || 0) > 0"
            class="space-y-2"
          >
            <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {{ timeGroup?.label }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <FilterPill
                v-for="filter in timeGroup?.options"
                :key="filter.id"
                :label="filter.label"
                :icon="filter.icon"
                :active="filter.active"
                :count="filter.count"
                :color="filter.color"
                @toggle="$emit('toggleFilter', filter.id)"
                @clear="$emit('clearFilter', filter.id)"
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Clear all button -->
      <div
        v-if="hasActiveFilters"
        class="pt-3 border-t border-[var(--ui-border)]"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-medium rounded-md border border-red-200 dark:border-red-800"
          @click="$emit('clearAllFilters')"
        >
          <UIcon
            name="i-heroicons-x-circle"
            class="w-4 h-4"
          />
          <span>{{ $t('filters.actions.clear_all') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * FilterBar Component
 *
 * Primary filters (Status, Category) always visible — Status is the most
 * relevant filter for citizens, so it must not be hidden behind a toggle.
 * Secondary filters (Time) behind "More Filters" button
 * Scrollable on small screens with max-height
 * Optional search input at top
 */

import type { FilterGroup } from '~/composables/features/useReportsFilter';
import SearchInput from '~/components/filters/SearchInput.vue';

interface Props {
    filterGroups: FilterGroup[]
    hasActiveFilters: boolean
    expandByDefault?: boolean // Auto-expand for mobile modal
    // Search props
    searchEnabled?: boolean
    searchQuery?: string
    isClientSearching?: boolean
    isServerSearching?: boolean
    showExpandButton?: boolean
    hasNoResults?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    searchEnabled: false,
    searchQuery: '',
    isClientSearching: false,
    isServerSearching: false,
    showExpandButton: false,
    hasNoResults: false
});

defineEmits<{
    toggleFilter: [filterId: string]
    clearFilter: [filterId: string]
    clearAllFilters: []
    // Search emits
    updateSearch: [query: string]
    expandSearch: []
    clearSearch: []
    searchFocusIn: []
    searchFocusOut: []
}>();

// Expansion state for "More Filters"
const isExpanded = ref(props.expandByDefault || false);

// Watch for expandByDefault changes (when switching between mobile/desktop)
watch(() => props.expandByDefault, (newVal) => {
    if (newVal !== undefined) {
        isExpanded.value = newVal;
    }
});

// Resolve the filter groups once instead of repeating `filterGroups.find(...)`
// across the template (Status + Category are always-visible primary groups,
// Time is the only secondary group behind "More Filters").
const statusGroup = computed(() => props.filterGroups.find(g => g.id === 'status'));
const categoryGroup = computed(() => props.filterGroups.find(g => g.id === 'category'));
const timeGroup = computed(() => props.filterGroups.find(g => g.id === 'time'));

// Count of secondary filters (Time only — Status is now a primary, always-visible group)
const secondaryFilterCount = computed(() => timeGroup.value?.options?.length || 0);
</script>
