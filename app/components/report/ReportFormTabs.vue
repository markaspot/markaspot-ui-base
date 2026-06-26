<template>
  <div class="report-form-tabs">
    <!-- Tab Header: Tabs + Language Switcher (visually separated) -->
    <div class="flex items-center justify-between gap-4">
      <!-- Tab Buttons - Segmented Control -->
      <div
        role="tablist"
        :aria-label="t('report.form_types')"
        class="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg"
      >
        <button
          v-for="(tab, index) in tabItems"
          :id="`tab-${tab.value}`"
          ref="tabRefs"
          :key="tab.value"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.value"
          :aria-controls="`tabpanel-${tab.value}`"
          :tabindex="activeTab === tab.value ? 0 : -1"
          class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="[
            activeTab === tab.value
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
          ]"
          @click="setActiveTab(tab.value)"
          @keydown.arrow-right.prevent="focusNextTab(index)"
          @keydown.arrow-left.prevent="focusPrevTab(index)"
          @keydown.home.prevent="focusFirstTab"
          @keydown.end.prevent="focusLastTab"
        >
          <UIcon
            :name="tab.icon"
            class="w-4 h-4"
          />
          <span class="truncate">{{ tab.label }}</span>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <!-- Contextual help: how to create a report (issue #191).
        Icon-only on mobile (where citizens most need it but space is tight),
        full label from sm: up. Both carry the same accessible name. -->
        <DocsLink
          :href="docsLinks.links.createReport"
          :aria-label="t('report.how_to_help')"
          icon-only
          icon="i-heroicons-question-mark-circle"
          color="neutral"
          size="xs"
          class="sm:hidden opacity-70 hover:opacity-100 transition-opacity"
        />
        <DocsLink
          :href="docsLinks.links.createReport"
          :label="t('report.how_to_help')"
          icon="i-heroicons-question-mark-circle"
          color="neutral"
          size="xs"
          class="hidden sm:inline-flex opacity-70 hover:opacity-100 transition-opacity"
        />

        <!-- Language Switcher - Utility style, visually distinct from tabs -->
        <LanguageSwitcherCompact class="opacity-70 hover:opacity-100 transition-opacity" />
      </div>
    </div>

    <!-- Tab Content -->
    <div
      :id="`tabpanel-${activeTab}`"
      role="tabpanel"
      :aria-labelledby="`tab-${activeTab}`"
      tabindex="0"
      class="pt-4"
    >
      <PhotoReportForm
        v-if="activeTab === 'photo' && photoReportAvailable"
        :map-center="mapCenter"
        :auto-trigger-geolocation="autoTriggerGeolocation"
        :saved-state="photoFormState"
        @success="(response) => emit('success', response)"
        @close="emit('close')"
        @bottom-focus="emit('bottom-focus')"
      />
      <ClassicReportForm
        v-if="activeTab === 'classic' || !photoReportAvailable"
        :map-center="mapCenter"
        :auto-trigger-geolocation="autoTriggerGeolocation"
        :saved-state="classicFormState"
        @success="(response) => emit('success', response)"
        @bottom-focus="emit('bottom-focus')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { FormFirstTab } from '@/composables/features/useFormFirstMode';

interface MapCenter {
    lat: number
    lng: number
    address?: string
    addressObj?: Record<string, unknown>
}

const props = defineProps<{
    defaultTab?: FormFirstTab
    mapCenter?: MapCenter | null
    autoTriggerGeolocation?: boolean
    photoFormState?: Record<string, unknown>
    classicFormState?: Record<string, unknown>
}>();

const emit = defineEmits<{
    'success': [response: unknown]
    'close': []
    'tab-change': [tab: FormFirstTab]
    'bottom-focus': []
}>();

const { t } = useI18n();
const docsLinks = useDocsLinks();
const { aiAnalysisEnabled, photoReportAvailable } = useFeatureFlags();

// Tab button refs for keyboard navigation
const tabRefs = ref<HTMLButtonElement[]>([]);

// Active tab state
const resolveTab = (tab?: FormFirstTab): FormFirstTab => {
    const fallback = photoReportAvailable.value ? 'photo' : 'classic';
    return tab === 'photo' && !photoReportAvailable.value ? 'classic' : (tab ?? fallback);
};
const activeTab = ref<FormFirstTab>(resolveTab(props.defaultTab));
const activeTabSource = ref<'default' | 'manual'>('default');

// Watch for external defaultTab changes (with immediate for initial sync)
watch(() => props.defaultTab, (newTab) => {
    const resolvedTab = resolveTab(newTab);
    if (activeTabSource.value === 'default' && resolvedTab !== activeTab.value) {
        activeTab.value = resolvedTab;
    }
}, { immediate: true });
watch(photoReportAvailable, (enabled) => {
    if (!enabled && activeTab.value === 'photo') {
        activeTab.value = 'classic';
        activeTabSource.value = 'default';
    } else if (enabled && activeTabSource.value === 'default') {
        activeTab.value = resolveTab(props.defaultTab);
    }
}, { immediate: true });

// Set active tab and emit change
function setActiveTab(tab: string) {
    if (tab !== 'photo' && tab !== 'classic') {
        return;
    }
    const resolvedTab = resolveTab(tab);
    activeTab.value = resolvedTab;
    activeTabSource.value = 'manual';
    emit('tab-change', resolvedTab);
}

// Keyboard navigation helpers
function focusNextTab(currentIndex: number) {
    const nextIndex = (currentIndex + 1) % tabItems.value.length;
    setActiveTab(tabItems.value[nextIndex].value);
    nextTick(() => tabRefs.value[nextIndex]?.focus());
}

function focusPrevTab(currentIndex: number) {
    const prevIndex = currentIndex === 0 ? tabItems.value.length - 1 : currentIndex - 1;
    setActiveTab(tabItems.value[prevIndex].value);
    nextTick(() => tabRefs.value[prevIndex]?.focus());
}

function focusFirstTab() {
    setActiveTab(tabItems.value[0].value);
    nextTick(() => tabRefs.value[0]?.focus());
}

function focusLastTab() {
    const lastIndex = tabItems.value.length - 1;
    setActiveTab(tabItems.value[lastIndex].value);
    nextTick(() => tabRefs.value[lastIndex]?.focus());
}

// Tab configuration
const tabItems = computed(() => {
    const photoLabel = aiAnalysisEnabled.value
        ? `${t('report.buttons.photo')} (${t('report.ai.label')})`
        : t('report.buttons.photo');

    const items: Array<{ value: FormFirstTab, label: string, icon: string }> = [];
    if (photoReportAvailable.value) {
        items.push({
            value: 'photo' as const,
            label: photoLabel,
            icon: 'i-heroicons-camera'
        });
    }
    items.push(
        {
            value: 'classic' as const,
            label: t('report.buttons.classic'),
            icon: 'i-heroicons-document-text'
        }
    );
    return items;
});
</script>

<style scoped>
.report-form-tabs {
    @apply flex flex-col h-full;
}
</style>
