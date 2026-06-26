<template>
  <div class="space-y-2">
    <!-- Search Input -->
    <div
      class="relative"
      @focusin="handleFocusIn"
      @focusout="handleFocusOut"
    >
      <AppInput
        :model-value="searchQuery"
        :placeholder="$t('search.placeholder')"
        icon="i-heroicons-magnifying-glass"
        :loading="isClientSearching || isServerSearching"
        size="md"
        class="w-full"
        @update:model-value="handleInput"
      >
        <template #trailing>
          <UButton
            v-if="searchQuery"
            color="neutral"
            variant="link"
            icon="i-heroicons-x-mark"
            :padded="false"
            @click="handleClear"
          />
        </template>
      </AppInput>
    </div>

    <!-- No Results Message + Expand Button -->
    <div
      v-if="hasNoResults && !isServerSearching"
      class="space-y-2"
    >
      <p class="text-sm text-[var(--ui-text-muted)] px-1">
        {{ $t('search.no_results_local') }}
      </p>
      <UButton
        v-if="showExpandButton"
        variant="solid"
        color="primary"
        size="sm"
        icon="i-heroicons-globe-alt"
        class="w-full"
        @click="handleExpand"
      >
        {{ $t('search.expand_to_server') }}
      </UButton>
    </div>

    <!-- Few Results + Soft Suggestion -->
    <div
      v-else-if="showExpandButton && !hasNoResults && !isServerSearching"
      class="pt-1"
    >
      <UButton
        variant="soft"
        color="primary"
        size="sm"
        icon="i-heroicons-magnifying-glass-circle"
        class="w-full"
        @click="handleExpand"
      >
        {{ $t('search.expand_hint') }}
      </UButton>
    </div>

    <!-- Server Search Loading -->
    <div
      v-if="isServerSearching"
      class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
    >
      <AppSpinner size="sm" />
      <span>{{ $t('search.searching_server') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SearchInput Component
 *
 * Provides search input with:
 * - Client-side search (debounced)
 * - Optional server-side search expansion
 * - Clear visual feedback for each state
 */

interface Props {
    searchQuery: string
    isClientSearching: boolean
    isServerSearching: boolean
    showExpandButton: boolean
    hasNoResults: boolean
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:searchQuery': [value: string]
    'expand': []
    'clear': []
    'focus-in': []
    'focus-out': []
}>();

const handleInput = (value: string) => {
    emit('update:searchQuery', value);
};

const handleExpand = () => {
    emit('expand');
};

const handleClear = () => {
    emit('clear');
};

const handleFocusIn = () => {
    emit('focus-in');
};

const handleFocusOut = () => {
    emit('focus-out');
};
</script>
