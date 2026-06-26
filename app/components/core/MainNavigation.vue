<template>
  <div class="flex flex-col h-full">
    <HeaderLogo
      :enable-drag="props.enableHeaderDrag"
      @header-height-change="onHeaderHeightChange"
      @drag-start="onHeaderDragStart"
      @touch-start="onHeaderTouchStart"
      @drag-click="onHeaderClick"
    />
    <CompactWelcomeBanner />
    <!-- Offline status banner - shows above navigation when offline/syncing -->
    <OfflineBanner />
    <div class="px-3 pt-1 pb-2 flex-shrink-0 w-full">
      <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-1 shadow-sm">
        <UTabs
          ref="tabsRef"
          v-model="activeTab"
          :items="tabItems"
          variant="pill"
          color="primary"
          :content="false"
          :ui="{
            list: 'w-full justify-between',
            trigger: 'flex-col sm:flex-row text-xs gap-0.5 sm:gap-1 px-1 sm:px-2 data-[state=inactive]:text-[var(--ui-text)]',
            label: 'whitespace-nowrap',
            leadingIcon: 'size-5 sm:size-4 shrink-0',
          }"
          @update:model-value="onTabChange"
        >
          <template #leading="{ item }">
            <span
              v-if="item.value === 'following'"
              class="relative inline-flex"
            >
              <UIcon
                :name="item.icon"
                class="size-5"
              />
              <span
                v-if="updateCount > 0"
                class="absolute -top-0.5 -right-0.5 rtl:-right-auto rtl:-left-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-[var(--ui-bg-elevated)]"
                role="status"
                aria-label="New updates available"
              />
            </span>
            <UIcon
              v-else-if="item.icon"
              :name="item.icon"
              class="size-5"
            />
          </template>
        </UTabs>
      </div>
    </div>

    <div class="flex-1 relative">
      <div
        v-show="activeTab === 'list'"
        id="panel-list"
        :aria-hidden="activeTab !== 'list'"
        role="tabpanel"
        aria-labelledby="tab-list"
        tabindex="-1"
        class="absolute inset-0 flex flex-col"
      >
        <ReportsList
          :requests="requests"
          :store-total="storeTotal"
          :global-total="globalTotal"
          :filter-stats="filterStats"
          :shared-filter-system="sharedFilterSystem"
          :search-system="searchSystem"
          :external-loading="dataLoading"
          @select-report="$emit('select-report', $event)"
        />
      </div>

      <div
        v-show="activeTab === 'info'"
        id="panel-info"
        :aria-hidden="activeTab !== 'info'"
        role="tabpanel"
        aria-labelledby="tab-info"
        tabindex="-1"
        class="absolute inset-0"
      >
        <div
          class="h-full overflow-y-auto scrollbar-hide"
          role="region"
          tabindex="0"
          :aria-label="$t('navigation.panel.scrollable')"
        >
          <div class="bg-[var(--ui-bg)]/95 p-4">
            <!-- Loading skeleton -->
            <div
              v-if="pagesLoading"
              class="space-y-3"
            >
              <div class="space-y-2">
                <USkeleton class="h-6 w-3/4" />
                <USkeleton class="h-4 w-full" />
              </div>
              <div class="space-y-3">
                <USkeleton class="h-12 w-full rounded-lg" />
                <USkeleton class="h-12 w-full rounded-lg" />
                <USkeleton class="h-12 w-full rounded-lg" />
              </div>
            </div>
            <!-- Error state -->
            <UAlert
              v-else-if="pagesError"
              color="warning"
              variant="subtle"
              icon="i-heroicons-exclamation-triangle"
              :title="$t('errors.loadError', 'Failed to load content')"
            />
            <!-- Start page content (sticky page) -->
            <template v-else-if="startPage?.attributes?.body?.processed">
              <h1 class="sr-only">
                {{ startPage.attributes.title }}
              </h1>
              <div
                class="info-block-content"
                role="article"
                :aria-label="startPage.attributes.title"
                v-html="startPageBodyWithoutShortcutList"
              />
            </template>
            <!-- Welcome fallback when no start page exists -->
            <div
              v-else
              class="space-y-3"
            >
              <h2 class="text-base font-semibold">
                {{ workspaceName ? $t('info.welcome.heading', { name: workspaceName }) : $t('info.welcome.headingGeneric') }}
              </h2>
              <p class="text-sm text-muted">
                {{ $t('info.welcome.body') }}
              </p>
            </div>
            <!-- Real, focusable shortcuts into the four primary flows.
                 Replaces the inert <dl> StaticText pattern that looked
                 clickable but had no handlers (issue #404). -->
            <InfoShortcuts
              v-if="!pagesLoading && !pagesError"
              :photo-enabled="photoShortcutEnabled"
              :classic-enabled="classicShortcutEnabled"
              :following-enabled="followingShortcutEnabled"
              :list-enabled="listShortcutEnabled"
              @shortcut="onShortcut"
            />
          </div>
        </div>
      </div>

      <div
        v-show="activeTab === 'following'"
        id="panel-following"
        :aria-hidden="activeTab !== 'following'"
        role="tabpanel"
        aria-labelledby="tab-following"
        tabindex="-1"
        class="absolute inset-0"
      >
        <div
          class="h-full overflow-y-auto scrollbar-hide"
          role="region"
          tabindex="0"
          :aria-label="$t('navigation.panel.scrollable')"
        >
          <div class="bg-[var(--ui-bg)]/95">
            <FollowedReports
              @select-report="$emit('select-report', $event)"
              @update-count="localUpdateCount = $event"
            />
          </div>
        </div>
      </div>

      <div
        v-show="activeTab === 'stats'"
        id="panel-stats"
        :aria-hidden="activeTab !== 'stats'"
        role="tabpanel"
        aria-labelledby="tab-stats"
        tabindex="-1"
        class="absolute inset-0"
      >
        <div
          class="h-full overflow-y-auto scrollbar-hide"
          role="region"
          tabindex="0"
          :aria-label="$t('navigation.panel.scrollable')"
        >
          <div class="bg-[var(--ui-bg)]/95">
            <EnhancedStats />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="activeTab === 'info' && showPages"
      class="mt-auto flex-shrink-0"
    >
      <PageMenu @select-page="$emit('select-page', $event)" />
    </div>
    <div
      v-if="showFooter"
      class="mt-auto flex-shrink-0"
    >
      <LegalFooter
        :show-login-link="showLoginLink"
        :login-path="loginPath"
        :pkg-version="pkgVersion"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * MainNavigation Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { sanitizeRichHtml } from '~/utils/sanitize';

const { t } = useI18n();
const config = useRuntimeConfig();
const route = useRoute();
const { features: runtimeFeatures, jurisdiction, clientConfig } = useMarkASpotConfig();
const workspaceName = computed(() => jurisdiction.value?.name || '');
const pkgVersion = import.meta.env.PKG_VERSION || '';
const { startPolling, stopPolling, updateCount: followsUpdateCount, followedReports } = useFollows();
const { startPage, loading: pagesLoading, error: pagesError } = usePages();
const { passwordlessEnabled, photoReportAvailable } = useFeatureFlags();

// Sanitized start-page body with the legacy "shortcut" <dl> stripped out:
// the admin-authored start page renders a <dl><dt>icon + title</dt><dd>desc</dd>...</dl>
// list that looks clickable but has no handlers (issue #404). We strip that
// list here and render real, focusable buttons via <InfoShortcuts/> below.
const startPageBodyWithoutShortcutList = computed(() => {
    const raw = startPage.value?.attributes?.body?.processed;
    if (!raw) return '';
    // Remove every <dl>...</dl> block from the body (case-insensitive,
    // multi-line) before sanitization to keep the heading/intro paragraph.
    const stripped = raw.replace(/<dl[\s\S]*?<\/dl>/gi, '');
    return sanitizeRichHtml(stripped);
});
const { isAuthenticated } = usePasswordlessAuth();
const { buildPath } = useJurisdictions();

// Embed config for visibility control (login button, pages menu, legal footer).
// Outside the embed context this inject resolves to null, so every flag defaults
// to "shown" — the main app is unaffected.
const embedConfig = inject<Ref<{ loginButton?: boolean, pages?: boolean, footer?: boolean }> | null>('embedConfig', null);
const hasSsoProviders = computed(() => (clientConfig.value?.sso?.providers ?? [])
    .some(provider => Boolean(provider?.id && provider?.label)));

const showLoginLink = computed(() => {
    if (isAuthenticated.value) return false;
    if (!passwordlessEnabled.value && !hasSsoProviders.value) return false;
    if (embedConfig?.value?.loginButton === false) return false;
    return true;
});

// Embed hosts can hide the CMS pages menu and the legal footer to get a
// chrome-free map widget. Only `false` hides them, so null/undefined (the
// non-embed app) keeps both visible.
// Caveats for embed hosts:
// - `pages` only affects the Info tab (PageMenu never renders elsewhere), and
//   is moot if `visibleTabs` already excludes 'info'.
// - `footer: false` also removes the login link, since showLoginLink lives
//   inside LegalFooter — there is no other login entry point in the nav.
const showPages = computed(() => embedConfig?.value?.pages !== false);
const showFooter = computed(() => embedConfig?.value?.footer !== false);

const loginPath = computed(() => {
    const currentPath = route.fullPath;
    const base = buildPath('/auth/login');
    return currentPath && currentPath !== '/' ? `${base}?redirect=${encodeURIComponent(currentPath)}` : base;
});
// Navigation colors no longer needed - using Nuxt UI color system

const props = defineProps<{
    requests: Array<any>
    storeTotal: number
    globalTotal?: number | null
    filterStats?: { total: number, filtered: number, hiddenByFilters: number, filterCount: number, boundsActive?: boolean }
    sharedFilterSystem: any
    searchSystem?: any
    modalOpen?: boolean
    enableHeaderDrag?: boolean
    /** External loading state for skeleton display */
    dataLoading?: boolean
    /** Filter tabs to only show these (by value key). Undefined = show all enabled tabs. */
    visibleTabs?: string[]
}>();

const emit = defineEmits<{
    'select-report': [report: any]
    'select-page': [page: any]
    'header-height-change': [height: number]
    'expand-sheet': [instant?: boolean]
    'header-drag-start': [event: MouseEvent]
    'header-touch-start': [event: TouchEvent]
    'header-click': []
    'tab-change': [tabId: string]
    /** Issue #404: a real shortcut button in the Info tab was clicked.
     * 'photo' / 'classic' open the matching report modal; 'following' /
     * 'list' switch the active tab via setActiveTab() locally. */
    'add-report': [type: 'photo' | 'classic']
    /** Issue #404: Info-tab "Explore" shortcut: fit map to all requests. */
    'fit-bounds': []
}>();

// Per-jurisdiction shortcut visibility — mirrors the gating used by the
// red Foto-Meldung / classic buttons on the map (ReportButtons.vue).
const photoShortcutEnabled = computed(() => {
    if (!photoReportAvailable.value) return false;
    const cfg = clientConfig.value?.features as any;
    if (cfg?.actionButtons?.photo?.enabled === false) return false;
    return true;
});

const classicShortcutEnabled = computed(() => {
    const cfg = clientConfig.value?.features as any;
    if (cfg?.classicReporting === false) return false;
    if (cfg?.actionButtons?.classic?.enabled === false) return false;
    return true;
});

const followingShortcutEnabled = computed(() =>
    navigationConfig.value.tabs.following?.enabled !== false
);

const listShortcutEnabled = computed(() =>
    navigationConfig.value.tabs.list?.enabled !== false
);

const onShortcut = (id: 'photo' | 'classic' | 'following' | 'list') => {
    if (id === 'photo' || id === 'classic') {
        // Bubble to the page-level handleReport which opens the matching modal.
        emit('add-report', id);
        return;
    }
    if (id === 'following') {
        setActiveTab('following');
        return;
    }
    if (id === 'list') {
        setActiveTab('list');
        // Ask the parent map to fit bounds to all visible requests so users
        // see the full extent (the "Erkunden / Explore" affordance).
        emit('fit-bounds');
    }
};

// Pass the header height to parent components
const onHeaderHeightChange = (height: number) => {
    emit('header-height-change', height);
};

// Header drag handlers
const onHeaderDragStart = (event: MouseEvent) => {
    if (props.enableHeaderDrag) {
        emit('header-drag-start', event);
    }
};

const onHeaderTouchStart = (event: TouchEvent) => {
    if (props.enableHeaderDrag) {
        emit('header-touch-start', event);
    }
};

const onHeaderClick = () => {
    if (props.enableHeaderDrag) {
        emit('header-click');
    }
};

const showInfo = ref(false);
const showOnFirstVisit = ref(false);
// Initialize with a placeholder - we'll set the real value in onMounted
const activeTab = ref('');
// Ref for UTabs to fix aria-controls
const tabsRef = ref<{ $el: HTMLElement } | null>(null);
// Use a local ref to track updates
const localUpdateCount = ref(0);

// Compute the total update count from both sources:
// 1. The shared updateCount from useFollows
// 2. Any local updates captured from child components
const updateCount = computed(() => {
    // Using Math.max to ensure we always show the highest count available
    return Math.max(followsUpdateCount.value, localUpdateCount.value);
});

const navigationConfig = computed(() => {
    // Use runtime features from backend API (jurisdiction-specific) with fallback to static config
    const staticFeatures = config.public.clientConfig.features || {} as any;
    const features = runtimeFeatures.value;

    const navConfig = staticFeatures.navigation || {};
    const staticTabs = navConfig.tabs || {};

    // Determine stats enabled:
    // 1. If runtime features exist and has explicit statistics value, use that (OVERRIDES static)
    // 2. Otherwise, fall back to static config
    const statsEnabled = features?.statistics !== undefined
        ? features.statistics === true
        : staticTabs.stats?.enabled !== false;

    // Merge static config with runtime feature overrides
    const tabsConfig = {
        info: { enabled: staticTabs.info?.enabled !== false, weight: staticTabs.info?.weight || 10 },
        list: { enabled: staticTabs.list?.enabled !== false, weight: staticTabs.list?.weight || 20 },
        following: { enabled: staticTabs.following?.enabled !== false, weight: staticTabs.following?.weight || 30 },
        // Stats tab: runtime features.statistics takes precedence over static config
        stats: {
            enabled: statsEnabled,
            weight: staticTabs.stats?.weight || 40
        }
    };

    return {
        activeTab: navConfig.activeTab || 'list',
        tabs: tabsConfig
    };
});

// Tab items for UTabs component
const tabItems = computed(() => {
    const enabledTabs = [];

    // Define all possible tabs with their properties
    const allTabs = {
        info: {
            value: 'info',
            label: t('navigation.tabs.info.label'),
            icon: 'i-heroicons-information-circle',
            weight: navigationConfig.value.tabs.info?.weight || 10
        },
        list: {
            value: 'list',
            label: t('navigation.tabs.list.label'),
            icon: 'i-heroicons-list-bullet',
            weight: navigationConfig.value.tabs.list?.weight || 20
        },
        following: {
            value: 'following',
            label: t('navigation.tabs.following.label'),
            icon: 'i-heroicons-star',
            weight: navigationConfig.value.tabs.following?.weight || 30
        },
        stats: {
            value: 'stats',
            label: t('navigation.tabs.stats.label'),
            icon: 'i-heroicons-chart-pie',
            weight: navigationConfig.value.tabs.stats?.weight || 40
        }
    };

    // Add enabled tabs to the result array
    if (navigationConfig.value.tabs.info?.enabled !== false) enabledTabs.push(allTabs.info);
    if (navigationConfig.value.tabs.list?.enabled !== false) enabledTabs.push(allTabs.list);
    if (navigationConfig.value.tabs.following?.enabled !== false) enabledTabs.push(allTabs.following);
    if (navigationConfig.value.tabs.stats?.enabled !== false) enabledTabs.push(allTabs.stats);

    // Filter by visibleTabs prop if provided (used by embed to restrict tabs)
    const filtered = props.visibleTabs?.length
        ? enabledTabs.filter(tab => props.visibleTabs!.includes(tab.value))
        : enabledTabs;

    // Sort by weight
    return filtered.sort((a, b) => a.weight - b.weight);
});

// Handler for UTabs change event
const onTabChange = (tabId: string) => {
    // Emit tab change event (used to trigger map loading on list tab)
    emit('tab-change', tabId);

    // Expand sheet instantly when tab is clicked (no animation delay)
    emit('expand-sheet', true);

    if (tabId === 'info' && !localStorage.getItem('hasSeenInfo')) {
        localStorage.setItem('hasSeenInfo', 'true');
    }
};

const setActiveTab = (tabId: string) => {
    // Make sure the tab exists in our enabled tabs
    if (tabItems.value.some(tab => tab.value === tabId)) {
        activeTab.value = tabId;
        onTabChange(tabId);
    } else if (tabItems.value.length > 0) {
        // If the selected tab is not enabled, default to the first enabled tab
        activeTab.value = tabItems.value[0].value;
    }
};

// Imperatively patch tab DOM attributes that UTabs does not expose as props.
// Only `id` and `aria-controls` are patched here: UTabs already renders the
// label text node inside the trigger, which provides the accessible name, so
// we deliberately do NOT set `aria-label`/`title` (that would be a redundant
// "useless tooltip" and a Label-in-Name risk per WCAG 2.5.3). If an icon-only
// collapsed mode ever ships, re-introduce `aria-label` reactively via a Vue
// binding for that mode only, not via this imperative patch.
const syncTabAriaAttrs = () => {
    if (!tabsRef.value?.$el) return;
    const tabButtons = tabsRef.value.$el.querySelectorAll('[role="tab"]');
    tabButtons.forEach((btn: Element, index: number) => {
        const tabItem = tabItems.value[index];
        if (!tabItem) return;
        const panelId = `panel-${tabItem.value}`;
        btn.setAttribute('id', `tab-${tabItem.value}`);
        if (document.getElementById(panelId)) {
            btn.setAttribute('aria-controls', panelId);
        } else {
            btn.removeAttribute('aria-controls');
        }
    });
};

// `flush: 'post'` already runs the watcher after the DOM patch, so the
// callback can sync attributes directly without an extra nextTick microtask.
watch(tabItems, syncTabAriaAttrs, { flush: 'post' });

onMounted(() => {
    // Make sure we are polling for report updates
    startPolling();

    // Fix UTabs aria-controls and add IDs to tab buttons
    // UTabs with :content="false" generates invalid aria-controls references
    // and doesn't add IDs that our custom panels reference via aria-labelledby.
    // The watch above re-applies these IDs whenever the tab set re-renders
    // (e.g. on locale change, when UTabs rebuilds the trigger nodes).
    nextTick(syncTabAriaAttrs);

    // Check if user has seen info before
    const hasSeenInfo = localStorage.getItem('hasSeenInfo');

    // Determine the initial active tab based on configuration and conditions
    let initialTab = '';

    // Priority 1: Show info tab on first visit if enabled
    if (!hasSeenInfo && navigationConfig.value.tabs.info?.enabled !== false) {
        showInfo.value = true;
        showOnFirstVisit.value = true;
        initialTab = 'info';
    } else if (navigationConfig.value.activeTab &&
      tabItems.value.some(tab => tab.value === navigationConfig.value.activeTab)) {
        // Priority 2: Use the configured activeTab if it exists and is enabled
        initialTab = navigationConfig.value.activeTab;
    } else if (tabItems.value.length > 0) {
        // Priority 3: Default to the first enabled tab
        initialTab = tabItems.value[0].value;
    }

    // Set the active tab (uses setActiveTab to respect visibleTabs filtering)
    setActiveTab(initialTab);
});

onUnmounted(() => {
    stopPolling();
});
</script>

<style scoped>
:deep(.info-block-content h2) {
  font-weight: 600;
  color: var(--ui-text);
  margin: 0 0 0.25rem 0;
}

:deep(.info-block-content p) {
  color: var(--ui-text-muted);
  margin: 0 0 1rem 0;
}

:deep(.info-block-content dl) {
  margin: 0;
}

:deep(.info-block-content dt) {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--ui-text);
  margin: 0.5rem 0 0 0;
}

:deep(.info-block-content dt:first-of-type) {
  margin-top: 0;
}

:deep(.info-block-content dt .icon) {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  color: var(--ui-text-muted);
}

:deep(.info-block-content dd) {
  color: var(--ui-text-muted);
  margin: 0.125rem 0 0 1.5rem;
}
</style>
