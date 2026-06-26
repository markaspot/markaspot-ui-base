<template>
  <aside
    role="complementary"
    :aria-label="$t('hiddenSection.main_navigation')"
    :inert="modalOpen || undefined"
  >
    <Suspense>
      <template #default>
        <LazyLeftSidebar
          hydrate-on-visible
          :requests="requests"
          :store-total="storeTotal"
          :global-total="globalTotal"
          :filter-stats="filterStats"
          :show-info="showInfo"
          :shared-filter-system="sharedFilterSystem"
          :search-system="searchSystem"
          :modal-open="modalOpen"
          @select-report="$emit('selectReport', $event)"
          @select-page="$emit('selectPage', $event)"
          @toggle-info="$emit('toggleInfo')"
          @add-report="$emit('addReport', $event)"
          @fit-bounds="$emit('fitBounds')"
        />
      </template>
      <template #fallback>
        <div
          :style="{ width: sidebarWidth }"
          class="h-full bg-[var(--ui-bg)]"
        />
      </template>
    </Suspense>
  </aside>
</template>

<script setup lang="ts">
/**
 * DesktopSidebar Component
 *
 * Navigation component for user interface and routing.
 */

import type { Request } from '~~/types';

interface Props {
    requests: Request[]
    storeTotal: number
    globalTotal?: number | null
    filterStats?: { total: number, filtered: number, hiddenByFilters: number, filterCount: number, boundsActive?: boolean }
    showInfo: boolean
    sidebarWidth: string
    sharedFilterSystem: unknown
    searchSystem?: unknown
    modalOpen?: boolean
}

defineProps<Props>();

defineEmits<{
    selectReport: [event: { report: Record<string, unknown> }]
    selectPage: [page: Record<string, unknown>]
    toggleInfo: []
    /** Issue #404: Info-tab shortcut requested a new report (photo or classic). */
    addReport: [type: 'photo' | 'classic']
    /** Issue #404: Info-tab "Explore" shortcut: fit map to all requests. */
    fitBounds: []
}>();
</script>
