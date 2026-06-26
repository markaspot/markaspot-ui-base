<template>
  <div
    v-if="statisticsEnabled"
    class="bg-[var(--ui-bg)]/95 p-3 py-6 overflow-y-auto h-full space-y-8"
  >
    <!-- Total Reports -->
    <div class="flex items-center gap-4 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg shadow transition-transform hover:scale-105">
      <div class="w-6 h-6 rounded-full bg-primary-500" />
      <div>
        <div class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {{ totalReports }}
        </div>
        <div class="text-lg text-[var(--ui-text-muted)]">
          {{ t('stats.total_reports') }}
        </div>
      </div>
    </div>

    <!-- Status Grid -->
    <div class="space-y-6">
      <h2 class="text-lg font-bold text-neutral-800 dark:text-neutral-300">
        {{ t('stats.status_overview') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="status in statusStats"
          :key="status.status"
          class="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg shadow transition-transform hover:scale-105"
        >
          <div
            class="w-6 h-6 rounded-full flex-shrink-0"
            :style="{ backgroundColor: status.color }"
          />
          <div>
            <div class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {{ status.count }}
            </div>
            <div class="text-lg text-[var(--ui-text-muted)]">
              {{ status.status }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pie Chart -->
    <div
      v-if="totalReports > 0"
      class="flex flex-col items-center space-y-4"
    >
      <h2 class="text-lg font-bold text-neutral-800 dark:text-neutral-300">
        {{ t('stats.pie_chart') }}
      </h2>
      <svg
        class="shadow-md rounded-lg"
        width="200"
        height="200"
        viewBox="0 0 200 200"
      >
        <g transform="translate(100, 100)">
          <path
            v-for="(slice, index) in computedPieSlices"
            :key="index"
            :d="slice.path"
            :fill="slice.status_hex"
            class="pie-slice transition-transform hover:scale-105"
          >
            <title>{{ slice.status }}: {{ slice.count }}</title>
          </path>
        </g>
      </svg>
      <div class="flex flex-col gap-2 text-[var(--ui-text-muted)]">
        <div
          v-for="slice in computedPieSlices"
          :key="slice.status"
          class="flex items-center gap-2"
        >
          <div
            class="w-4 h-4 rounded-full"
            :style="{ backgroundColor: slice.status_hex }"
          />
          <div>
            {{ slice.status }} ({{ calculatePercentage(slice.count) }}%)
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="text-[var(--ui-text-muted)]"
    >
      {{ t('stats.no_data_available') }}
    </div>

    <!-- Category Distribution -->
    <div>
      <h2 class="text-lg font-bold text-neutral-800 dark:text-neutral-300 mb-4">
        {{ t('stats.category_distribution') }}
      </h2>
      <div class="space-y-4">
        <div
          v-for="category in categoryStats"
          :key="category.tid || category.color"
          class="flex flex-col p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg shadow transition-transform hover:scale-105"
        >
          <!-- Parent Category -->
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: category.color }"
              />
              <div class="text-lg font-semibold text-[var(--ui-text)]">
                {{ category.category || t('stats.uncategorized') }}
              </div>
            </div>
            <div class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {{ category.count }}
            </div>
          </div>

          <!-- Child Categories (if expanded) -->
          <div
            v-if="expandedCategories[category.tid] && category.children && category.children.length > 0"
            class="mt-3 pl-6 space-y-2"
          >
            <div
              v-for="child in category.children"
              :key="child.tid"
              class="flex justify-between items-center p-2 bg-neutral-200 dark:bg-neutral-600 rounded"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: child.color || category.color }"
                />
                <div class="text-md text-[var(--ui-text-muted)]">
                  {{ child.category }}
                </div>
              </div>
              <div class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                {{ child.count }}
              </div>
            </div>
          </div>

          <!-- Expand/Collapse Button -->
          <div
            v-if="category.children && category.children.length > 0"
            class="mt-2 text-center"
          >
            <button
              class="text-sm text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              @click="toggleCategory(category.tid)"
            >
              {{ expandedCategories[category.tid] ? t('stats.collapse') : t('stats.expand') }}
              ({{ category.children.length }} {{ category.children.length === 1 ? t('stats.subcategory') : t('stats.subcategories') }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * EnhancedStats Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

import { useI18n } from 'vue-i18n';
import { NEUTRAL_FALLBACKS } from '~/utils/colorUtils';

const { t, locale } = useI18n();
const { features, jurisdiction, currentJurisdictionId } = useMarkASpotConfig();
const { public: { fastmap: isFastmap } } = useRuntimeConfig();

// Runtime feature flag (from API, jurisdiction-specific)
const statisticsEnabled = computed(() => features.value?.statistics === true);
const api = useApiClient();

const statusStats = ref<Array<{ status: string, count: number, color: string }>>([]);
const categoryStats = ref([]);
const loading = ref(true);
const expandedCategories = reactive<Record<string, boolean>>({});

// Total Reports
const totalReports = computed(() =>
    statusStats.value.reduce((sum, status) => sum + Number(status.count || 0), 0)
);

// Calculate Pie Slices
const computedPieSlices = computed(() => {
    const total = totalReports.value;
    if (!total) return [];

    let currentAngle = 0;
    return statusStats.value.map((status) => {
        const count = Number(status.count || 0);
        const percentage = count / total;
        const angle = percentage * 360;
        const startRad = ((currentAngle - 90) * Math.PI) / 180;
        currentAngle += angle;
        const endRad = ((currentAngle - 90) * Math.PI) / 180;

        const radius = 80;
        const [x1, y1] = [radius * Math.cos(startRad), radius * Math.sin(startRad)];
        const [x2, y2] = [radius * Math.cos(endRad), radius * Math.sin(endRad)];

        const largeArcFlag = angle > 180 ? 1 : 0;

        return {
            path: `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
            status_hex: status.color || NEUTRAL_FALLBACKS.SOFT,
            count,
            status: status.status
        };
    });
});

// Fetch Data
const fetchStats = async () => {
    loading.value = true;
    try {
        const params: Record<string, string> = { _format: 'json' };
        if (isFastmap && currentJurisdictionId.value) {
            params.jurisdiction = currentJurisdictionId.value;
        } else if (jurisdiction.value?.id) {
            params.jurisdiction = String(jurisdiction.value.id);
        }

        const [statusRes, categoryRes] = await Promise.all([
            api.get('/stats/status', params),
            api.get('/stats/categories/hierarchical', params)
        ]) as [any[], any[]];

        // Normalize counts as numbers (backend now returns only current language)
        statusStats.value = statusRes.map(status => ({
            ...status,
            count: Number(status.count || 0)
        }));

        categoryStats.value = categoryRes.map(category => ({
            ...category,
            count: Number(category.count || 0)
        }));
    } catch (err) {
        console.error('Error fetching stats:', err);
        // Fallback to original endpoint if hierarchical fails
        try {
            const fallbackParams: Record<string, string> = { _format: 'json' };
            if (isFastmap && currentJurisdictionId.value) {
                fallbackParams.jurisdiction = currentJurisdictionId.value;
            } else if (jurisdiction.value?.id) {
                fallbackParams.jurisdiction = String(jurisdiction.value.id);
            }
            const categoryRes = await api.get('/stats/categories', fallbackParams) as any[];
            categoryStats.value = categoryRes.map(category => ({
                ...category,
                count: Number(category.count || 0)
            }));
        } catch (fallbackErr) {
            console.error('Error fetching fallback stats:', fallbackErr);
        }
    } finally {
        loading.value = false;
    }
};

// Toggle category expansion
const toggleCategory = (tid) => {
    expandedCategories[tid] = !expandedCategories[tid];
};

// Helper: Calculate Percentage
const calculatePercentage = (count) => {
    const total = totalReports.value;
    if (total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
};

// Fetch data on mount
onMounted(() => {
    if (statisticsEnabled.value) {
        fetchStats();
    }
});

// Refetch when locale changes (e.g., bootstrap sets locale after config loads)
watch(locale, () => {
    if (statisticsEnabled.value) {
        fetchStats();
    }
});
</script>

<style scoped>
.pie-slice {
  transition: transform 0.3s ease;
}
.pie-slice:hover {
  transform: scale(1.05);
}
</style>
