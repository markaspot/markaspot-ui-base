<template>
  <div class="bg-white/95 dark:bg-gray-800/95 p-6 overflow-y-auto h-full space-y-8">
    <!-- Total Reports -->
    <div class="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow transition-transform hover:scale-105">
      <div class="w-6 h-6 rounded-full bg-blue-500"></div>
      <div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ totalReports }}</div>
        <div class="text-lg text-gray-600 dark:text-gray-400">{{ t('stats.total_reports') }}</div>
      </div>
    </div>

    <!-- Status Grid -->
    <div class="space-y-6">
      <h2 class="text-lg font-bold text-gray-800 dark:text-gray-300">{{ t('stats.status_overview') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
            v-for="status in statusStats"
            :key="status.status"
            class="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow transition-transform hover:scale-105"
        >
          <div class="w-6 h-6 rounded-full flex-shrink-0" :style="{ backgroundColor: status.color }"></div>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ status.count }}</div>
            <div class="text-lg text-gray-600 dark:text-gray-400">{{ status.status }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pie Chart -->
    <div v-if="totalReports > 0" class="flex flex-col items-center space-y-4">
      <h2 class="text-lg font-bold text-gray-800 dark:text-gray-300">{{ t('stats.pie_chart') }}</h2>
      <svg class="shadow-md rounded-lg" width="200" height="200" viewBox="0 0 200 200">
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
      <div class="flex flex-col gap-2 text-gray-600 dark:text-gray-400">
        <div v-for="slice in computedPieSlices" :key="slice.status" class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: slice.status_hex }"></div>
          <div>
            {{ slice.status }} ({{ calculatePercentage(slice.count) }}%)
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-gray-600 dark:text-gray-400">{{ t('stats.no_data_available') }}</div>

    <!-- Category Distribution -->
    <div>
      <h2 class="text-lg font-bold text-gray-800 dark:text-gray-300 mb-4">{{ t('stats.category_distribution') }}</h2>
      <div class="space-y-4">
        <div
            v-for="category in categoryStats"
            :key="category.tid || category.color"
            class="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow transition-transform hover:scale-105"
        >
          <div class="flex items-center gap-3">
            <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: category.color }"></div>
            <div class="text-lg text-gray-600 dark:text-gray-400">
              {{ category.category || t('stats.uncategorized') }}
            </div>
          </div>
          <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ category.count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const api = useApiClient();

const statusStats = ref([]);
const categoryStats = ref([]);
const loading = ref(true);


const totalReports = computed(() =>
  statusStats.value.reduce((sum, status) => sum + Number(status.count || 0), 0)
);


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
      status_hex: status.color || '#cccccc',
      count,
      status: status.status,
    };
  });
});


const fetchStats = async () => {
  loading.value = true;
  try {
    const [statusRes, categoryRes] = await Promise.all([
      api.get('/stats/status', { _format: 'json' }),
      api.get('/stats/categories', { _format: 'json' }),
    ]);

    
    statusStats.value = statusRes.map((status) => ({
      ...status,
      count: Number(status.count || 0),
    }));
    categoryStats.value = categoryRes.map((category) => ({
      ...category,
      count: Number(category.count || 0),
    }));
  } catch (err) {
    console.error('Error fetching stats:', err);
  } finally {
    loading.value = false;
  }
};


const calculatePercentage = (count) => {
  const total = totalReports.value;
  if (total === 0) return 0;
  return ((count / total) * 100).toFixed(1);
};


onMounted(() => {
  fetchStats();
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
