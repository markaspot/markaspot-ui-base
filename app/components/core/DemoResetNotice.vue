<template>
  <div
    data-testid="demo-db-reset-notice"
    class="px-4 py-3 print:hidden"
  >
    <div
      v-if="isMinimized"
      data-testid="demo-db-reset-notice-minimized"
      class="inline-flex max-w-full items-center gap-2 rounded-lg border border-info-500/25 bg-info-50 px-3 py-2 text-info-900 shadow-sm dark:bg-info-950/40 dark:text-info-100"
    >
      <button
        type="button"
        data-testid="demo-db-reset-expand"
        :aria-label="expandLabel"
        :title="expandLabel"
        class="inline-flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-xs font-medium transition hover:bg-info-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 dark:hover:bg-info-900"
        @click="isMinimized = false"
      >
        <UIcon
          name="i-heroicons-chevron-down"
          class="size-3.5 shrink-0"
          aria-hidden="true"
        />
        <span class="truncate">{{ title }}</span>
      </button>

      <div
        data-testid="demo-db-reset-countdown"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-current/20 bg-(--ui-bg)/70 px-2 py-1 text-xs font-medium"
        :aria-label="resetCountdownAria"
        :title="resetCountdownAria"
      >
        <UIcon
          name="i-heroicons-clock"
          class="size-3.5"
          aria-hidden="true"
        />
        <span class="hidden sm:inline">{{ countdownLabel }}</span>
        <span class="font-mono tabular-nums">{{ resetCountdown }}</span>
      </div>
    </div>

    <div
      v-else
      class="relative overflow-hidden rounded-lg border border-info-500/25 bg-info-50 px-4 py-3 text-info-950 shadow-sm dark:bg-info-950/40 dark:text-info-100"
    >
      <button
        type="button"
        data-testid="demo-db-reset-minimize"
        :aria-label="minimizeLabel"
        :title="minimizeLabel"
        class="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md text-info-700 transition hover:bg-info-100 hover:text-info-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 dark:text-info-200 dark:hover:bg-info-900 dark:hover:text-white"
        @click="isMinimized = true"
      >
        <UIcon
          name="i-heroicons-chevron-up"
          class="size-4"
          aria-hidden="true"
        />
      </button>

      <div class="flex min-w-0 items-start gap-3 pr-9">
        <UIcon
          name="i-heroicons-arrow-path"
          class="mt-0.5 size-5 shrink-0 text-info-500"
          aria-hidden="true"
        />

        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold leading-5 text-info-800 dark:text-info-200">
            {{ title }}
          </h2>
          <p class="mt-1 max-w-4xl text-sm leading-5 text-info-900/80 dark:text-info-100/85">
            {{ notice }}
          </p>

          <div
            data-testid="demo-db-reset-countdown"
            class="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-md border border-current/20 bg-(--ui-bg)/70 px-2 py-1 text-xs font-medium"
            :aria-label="resetCountdownAria"
            :title="resetCountdownAria"
          >
            <UIcon
              name="i-heroicons-clock"
              class="size-3.5"
              aria-hidden="true"
            />
            <span>{{ countdownLabel }}</span>
            <span class="font-mono tabular-nums">{{ resetCountdown }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const { clientConfig } = useMarkASpotConfig();
const now = ref(Date.now());
const isMinimized = ref(false);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const resetConfig = computed(() => clientConfig.value?.demoMode?.reset);
const resolveConfigText = (value: unknown, fallback: string): string =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

const title = computed(() => resolveConfigText(resetConfig.value?.title, t('demo_mode.reset.title')));
const notice = computed(() => resolveConfigText(resetConfig.value?.notice, t('demo_mode.reset.notice')));
const countdownLabel = computed(() => resolveConfigText(resetConfig.value?.countdownLabel, t('demo_mode.reset.countdown_label')));
const minimizeLabel = computed(() => t('demo_mode.banner.minimize_label'));
const expandLabel = computed(() => t('demo_mode.banner.expand_label'));

const msUntilNextHourlyReset = computed(() => {
    const current = new Date(now.value);
    const next = new Date(current);
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
    return Math.max(0, next.getTime() - now.value);
});

const resetCountdown = computed(() => {
    const totalSeconds = Math.ceil(msUntilNextHourlyReset.value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const resetCountdownAria = computed(() =>
    t('demo_mode.reset.countdown_aria', { time: resetCountdown.value })
);

onMounted(() => {
    now.value = Date.now();
    countdownTimer = setInterval(() => {
        now.value = Date.now();
    }, 1000);
});

onUnmounted(() => {
    if (countdownTimer) clearInterval(countdownTimer);
});
</script>
