/**
 * BottomSheetDrawer Component
 *
 * Uses Nuxt UI Drawer with native snapPoints for multi-level height positioning.
 * Provides the same functionality as the custom drawer with native mobile gestures.
 */
<template>
  <UDrawer
    :open="drawerOpen"
    direction="bottom"
    :handle="false"
    :overlay="hasOverlay"
    :modal="isModal"
    :dismissible="isDismissible"
    :should-scale-background="shouldScaleBackground"
    :set-background-color-on-scale="setBackgroundColorOnScale"
    :ui="{ content: 'z-[60] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_20px_-4px_rgba(255,255,255,0.1)]' }"
  >
    <!-- Accessible title/description for the drawer (used by underlying Dialog) -->
    <template #title>
      <span class="sr-only">{{ $t('common.navigation') }}</span>
    </template>
    <template #description>
      <span class="sr-only">{{ $t('common.drawer_description') }}</span>
    </template>
    <!-- Trigger slot - invisible but allows programmatic control -->
    <template #default>
      <!-- Hidden trigger - drawer is controlled programmatically -->
      <div class="hidden" />
    </template>

    <!-- Main content -->
    <template #content>
      <div
        class="flex flex-col relative transform-gpu overflow-hidden"
        :style="containerStyles"
        @focusin="$emit('focus-in')"
        @focusout="$emit('focus-out')"
      >
        <!-- Custom Drag Handle -->
        <!--
          Stays a native <button> so AT users keep the click affordance and
          implicit "button" role. The accessible name is stable ("Resize
          panel") so AT does not re-read it on every keypress; position
          changes are routed through the aria-live="polite" sibling below.
          Arrow/Home/End/PgUp/PgDn are advertised via aria-keyshortcuts.
        -->
        <button
          v-if="showHandle"
          ref="dragHandle"
          type="button"
          class="flex w-full justify-center py-5 cursor-grab active:cursor-grabbing select-none bg-transparent border-none focus-visible:ring-2 focus-visible:ring-[var(--ui-color-primary)] focus-visible:ring-offset-2 rounded-t-lg"
          :aria-label="handleAriaLabel"
          :aria-expanded="resolvedSnapPoints.length === 2 ? isSheetAtTop : undefined"
          aria-keyshortcuts="ArrowUp ArrowDown Home End PageUp PageDown"
          @mousedown="onDragStart"
          @touchstart.passive="onTouchStart"
          @click.stop="toggleHeight"
          @keydown.up.prevent="stepSnap(1)"
          @keydown.down.prevent="stepSnap(-1)"
          @keydown.home.prevent="snapToIndex(0)"
          @keydown.end.prevent="snapToIndex(resolvedSnapPoints.length - 1)"
          @keydown.page-up.prevent="stepSnap(1)"
          @keydown.page-down.prevent="stepSnap(-1)"
        >
          <div
            class="w-12 h-1.5 bg-neutral-400/70 dark:bg-neutral-200/25 rounded-full hover:bg-neutral-400 dark:hover:bg-neutral-200/35 transition-colors"
            aria-hidden="true"
          />
        </button>
        <!--
          Polite live region: announces position changes ("position 2 of 3")
          on every snap step. Sibling to the button so it isn't part of the
          accessible name; keeps the label stable while still giving AT
          users the same delta info that role=slider would have provided.
          Renders empty on SSR/initial mount by design — live regions only
          announce on mutation after they exist, so an empty initial value
          is the recommended pattern (do not "fix" by removing v-if/empty).
        -->
        <span
          v-if="showHandle"
          class="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >{{ positionAnnouncement }}</span>

        <!-- Content Container - Always show MainNavigation.
             overscroll-contain prevents scroll chaining to the map on iOS at scroll boundaries. -->
        <div class="flex-1 overflow-hidden [overscroll-behavior:contain]">
          <MainNavigation
            :requests="requests"
            :store-total="storeTotal"
            :global-total="globalTotal"
            :filter-stats="filterStats"
            :shared-filter-system="sharedFilterSystem"
            :search-system="searchSystem"
            :enable-header-drag="true"
            :data-loading="dataLoading"
            :visible-tabs="visibleTabs"
            @select-report="handleReportSelect"
            @select-page="handlePageSelect"
            @header-height-change="handleHeaderHeightChange"
            @expand-sheet="handleExpandSheet"
            @header-drag-start="onDragStart"
            @header-touch-start="onTouchStart"
            @header-click="toggleHeight"
            @tab-change="(tabId) => emit('tab-change', tabId)"
            @add-report="(type) => emit('add-report', type)"
            @fit-bounds="() => emit('fit-bounds')"
          />
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';
import type { ClientConfig } from '~~/types/clientConfig';

/** Type of the bottomSheet config block from ClientConfig.theme.ui.bottomSheet */
type BottomSheetConfig = NonNullable<NonNullable<NonNullable<ClientConfig['theme']['ui']>['bottomSheet']>>;

interface Props {
    requests: Array<any>
    storeTotal: number
    globalTotal?: number | null
    filterStats?: { total: number, filtered: number, hiddenByFilters: number, filterCount: number, boundsActive?: boolean }
    sharedFilterSystem?: any
    searchSystem?: any
    modelValue?: boolean
    /** Optional snap points e.g. ["140px", "40vh", "80vh"] or [140, 320, 600] */
    snapPoints?: Array<string | number>
    /** v-model index for active snap point */
    activeSnap?: number
    /** External loading state for skeleton display */
    dataLoading?: boolean
    /** Form-first mode - shows back button when expanded */
    formFirstMode?: boolean
    /** Filter tabs to only show these (by value key). Passed through to MainNavigation. */
    visibleTabs?: string[]
}

interface Emits {
    'select-report': [report: any]
    'select-page': [page: any]
    'update:modelValue': [value: boolean]
    'update:activeSnap': [value: number]
    'focus-in': []
    'focus-out': []
    'dragging-change': [value: boolean]
    'tab-change': [tabId: string]
    'minimum-height-change': [height: number]
    'snap-count-change': [count: number]
    /** Issue #404: Info-tab shortcut requested a new report (photo or classic). */
    'add-report': [type: 'photo' | 'classic']
    /** Issue #404: Info-tab "Explore" shortcut: fit map to all requests. */
    'fit-bounds': []
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    snapPoints: undefined,
    activeSnap: undefined,
    formFirstMode: false
});

const emit = defineEmits<Emits>();

const { clientConfig } = useMarkASpotConfig();
const { t } = useI18n();

// No explicit IDs needed; UDrawer provides ARIA title/description slots

// Internal state
const headerHeight = ref(120);
const isOpen = ref(true);
const isInitialized = ref(false);

// Config hooks
const bottomSheetConfig = computed<Partial<BottomSheetConfig>>(() => clientConfig.value?.theme?.ui?.bottomSheet || {});
const showHandle = computed(() => bottomSheetConfig.value?.showHandle ?? true);
const isDismissible = computed(() => bottomSheetConfig.value?.dismissible ?? false);
const hasOverlay = computed(() => bottomSheetConfig.value?.overlay ?? false);
const isModal = computed(() => bottomSheetConfig.value?.modal ?? false);
const shouldScaleBackground = computed(() => bottomSheetConfig.value?.scaleBackground ?? false);
const setBackgroundColorOnScale = computed(() => bottomSheetConfig.value?.setBackgroundColorOnScale ?? false);

// Height management
const parseSnapPoint = (pt: string | number, winH: number) => {
    if (typeof pt === 'number') return pt;
    const s = String(pt).trim();
    if (s.endsWith('vh')) return (parseFloat(s) / 100) * winH;
    if (s.endsWith('dvh')) return (parseFloat(s) / 100) * winH; // approximate
    if (s.endsWith('px')) return parseFloat(s);
    // default to px number parse
    const n = Number(s);
    return isNaN(n) ? 0 : n;
};

const parsePixelValue = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const MINIMUM_SHEET_HEIGHT = 140;
const HANDLE_CLEARANCE = 56;
const TABS_CLEARANCE = 64;

const minimumHeight = computed(() => {
    const configuredMin = parsePixelValue(bottomSheetConfig.value?.minimumHeight) ?? 0;
    const contentMin = headerHeight.value + (showHandle.value ? HANDLE_CLEARANCE : 0) + TABS_CLEARANCE;
    return Math.max(configuredMin, contentMin, MINIMUM_SHEET_HEIGHT);
});
const currentHeight = ref<number>(minimumHeight.value);
const isAnimating = ref(false);
// Single tracked timer id for all isAnimating flips — prevents stacking
let animationTimer: ReturnType<typeof setTimeout> | null = null;
// Track transition direction for directional easing
const transitionDirection = ref<'collapse' | 'expand' | 'snap'>('snap');

// Honor prefers-reduced-motion (WCAG 2.3.3). When set, transitions are
// dropped entirely so vestibular-sensitive users don't feel the height
// animations on every keyboard step or auto-collapse.
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

// UX-optimized transition config (per UX specialist recommendations)
const transitionConfig = {
    collapse: { duration: 250, easing: 'cubic-bezier(0.4, 0, 1, 1)' }, // ease-in: accelerates down
    expand: { duration: 320, easing: 'cubic-bezier(0, 0, 0.2, 1)' }, // ease-out: decelerates up
    snap: { duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' } // sharp snap after drag
};

// Resolve snap points (from props or client config)
const resolvedSnapPoints = computed<number[]>(() => {
    // SSR doesn't know window height — fall back to a value that matches
    // the client-side computation closely enough that the deduped array
    // length matches between SSR render and CSR hydrate. We only run the
    // near-duplicate filter on the client; on SSR we keep raw values.
    const isClient = typeof window !== 'undefined';
    const winH = isClient ? window.innerHeight : 800;
    // 1) From explicit props (use as-is, don't inject minimumHeight)
    if (props.snapPoints && props.snapPoints.length) {
        const pts = props.snapPoints.map(p => parseSnapPoint(p, winH));
        return [...pts].sort((a, b) => a - b);
    }

    // 2) From client config
    const cfg = bottomSheetConfig.value;
    const cfgSnap = cfg?.snapPoints;
    if (Array.isArray(cfgSnap) && cfgSnap.length) {
        const pts = cfgSnap.map(p => parseSnapPoint(p, winH));
        const normalized = [...pts].sort((a, b) => a - b);
        // Skip dedup on SSR so MapSection's fallback (raw cfg length) and
        // the rendered count agree until client hydration replaces both.
        return isClient
            ? normalized.filter((v, i, arr) => i === 0 || Math.abs(v - arr[i - 1]) > 1)
            : normalized;
    }

    // 3) Derive from `height` and defaults
    const min = minimumHeight.value;
    const mid = (() => {
        const h = cfg?.height;
        if (h != null) return Math.max(min, parseSnapPoint(h, winH));
        return Math.min(winH * 0.4, 320);
    })();
    const high = Math.min(winH * 0.8, winH - 100);
    return [min, mid, high].sort((a, b) => a - b);
});

// active snap index with optional v-model
const activeSnapIndex = computed<number>({
    get() {
        if (typeof props.activeSnap === 'number') return Math.min(Math.max(props.activeSnap, 0), resolvedSnapPoints.value.length - 1);
        // derive based on current height
        const cur = currentHeight.value;
        let nearest = 0, best = Infinity;
        resolvedSnapPoints.value.forEach((h, i) => {
            const d = Math.abs(h - cur);
            if (d < best) {
                best = d;
                nearest = i;
            }
        });
        return nearest;
    },
    set(val: number) {
        emit('update:activeSnap', val);
    }
});

// When explicit snapPoints are provided, allow heights below minimumHeight
const hasExplicitSnaps = computed(() => {
    const cfgSnap = bottomSheetConfig.value?.snapPoints;
    return !!(props.snapPoints && props.snapPoints.length) || (Array.isArray(cfgSnap) && cfgSnap.length > 0);
});

// True only when the sheet is at its highest snap. Only meaningful for
// 2-snap configs (binary expanded/collapsed); 3+ snaps suppress
// aria-expanded entirely since collapsed/expanded is ambiguous.
const isSheetAtTop = computed(() => {
    const total = resolvedSnapPoints.value.length;
    if (total <= 1) return false;
    return activeSnapIndex.value >= total - 1;
});

// Stable accessible name. NVDA/VoiceOver re-read aria-label on every
// attribute change to the focused element, so we keep this static and
// route position deltas through the polite live region below.
const handleAriaLabel = computed(() => t('common.resize_drawer', 'Resize panel'));

// Live-region announcement (polite). Empty string on SSR/initial render
// so AT does not announce on hydration; populated post-mount and on
// every snap change so AT speaks just the delta ("position 2 of 3").
//
// `isMounted` and `isInitialized` (declared above) are NOT redundant:
//   - `isMounted` flips synchronously in onMounted so the live region
//     populates with the current position on the very first hydrate tick.
//   - `isInitialized` flips inside nextTick AFTER the start-snap
//     initializer runs, so it can suppress the snap watcher's first run.
// They serve different ordering needs; do not unify.
const isMounted = ref(false);
onMounted(() => {
    isMounted.value = true;
});
const positionAnnouncement = computed(() => {
    if (!isMounted.value) return '';
    const total = resolvedSnapPoints.value.length;
    if (total <= 1) return '';
    return t('common.drawer_position_n_of_total', 'position {idx} of {total}', {
        idx: activeSnapIndex.value + 1,
        total
    });
});

// Programmatic jump to a specific snap (used by Home/End keys).
const snapToIndex = (idx: number) => {
    const total = resolvedSnapPoints.value.length;
    if (total === 0) return;
    activeSnapIndex.value = Math.min(Math.max(idx, 0), total - 1);
};

watch(minimumHeight, (height) => {
    emit('minimum-height-change', height);
}, { immediate: true });

// Surface the actual (post-dedup) snap count so MapSection's
// highestSheetSnapIndex stays in sync with what we render here.
// Fixes drift where MapSection counted raw cfg.snapPoints.length while
// resolvedSnapPoints filters near-duplicates (>1px apart).
//
// Deferred to onMounted (no `immediate: true`) so that SSR renders use
// MapSection's pre-hydration fallback (raw cfg.snapPoints.length); after
// hydration the client reports the deduped value and MapSection clamps
// if needed. Avoids a Vue hydration-attr-mismatch on aria-* descendants.
watch(() => resolvedSnapPoints.value.length, (count) => {
    emit('snap-count-change', count);
});
onMounted(() => {
    emit('snap-count-change', resolvedSnapPoints.value.length);
});

const containerStyles = computed(() => {
    const config = transitionConfig[transitionDirection.value];
    const animating = isAnimating.value && !prefersReducedMotion.value;
    return {
        height: `${currentHeight.value}px`,
        minHeight: hasExplicitSnaps.value ? '0px' : `${minimumHeight.value}px`,
        maxHeight: '90vh',
        transition: animating ? `height ${config.duration}ms ${config.easing}` : 'none',
        willChange: (animating || isDragging.value) ? 'height' : 'auto'
    } as Record<string, string>;
});

// Open binding: always true when not dismissible; otherwise use isOpen
const drawerOpen = computed(() => isDismissible.value ? isOpen.value : true);

// Initialize height
onMounted(() => {
    const snaps = resolvedSnapPoints.value;
    // Initial index order: props.activeSnap -> config.position -> default mid
    let initIdx: number | undefined;
    if (typeof props.activeSnap === 'number') {
        initIdx = Math.min(Math.max(props.activeSnap, 0), snaps.length - 1);
    } else {
        const pos = bottomSheetConfig.value?.position;
        if (pos === 'low') initIdx = 0;
        else if (pos === 'high') initIdx = snaps.length - 1;
        else initIdx = Math.min(1, snaps.length - 1);
    }
    activeSnapIndex.value = initIdx!;
    currentHeight.value = snaps[initIdx!];

    // Mark as initialized after next tick to ignore expand-sheet events
    // triggered by MainNavigation's initial tab setup
    nextTick(() => {
        isInitialized.value = true;
    });
});

// v-model compatibility: emit expanded state based on height
watch(currentHeight, (newHeight) => {
    const expanded = newHeight > minimumHeight.value + 50;
    emit('update:modelValue', expanded);
});

// Sync height when active snap index changes externally (via v-model:active-snap)
// or when resolvedSnapPoints itself shifts (e.g. SSR→CSR dedup, viewport
// resize). Gate on isInitialized so the SSR→CSR boundary doesn't re-apply
// a height while the onMounted initializer is still picking the start
// snap; the ref initializer already pins currentHeight to minimumHeight.
watch([activeSnapIndex, resolvedSnapPoints], ([idx]) => {
    if (!isInitialized.value) return;
    const snaps = resolvedSnapPoints.value;
    const clamped = Math.min(Math.max(Number(idx) || 0, 0), snaps.length - 1);
    if (snaps[clamped] != null) {
        const targetHeight = snaps[clamped];
        const prevHeight = currentHeight.value;

        // Determine direction and animate if height is changing.
        // Skip the animation entirely under prefers-reduced-motion.
        if (Math.abs(targetHeight - prevHeight) > 5 && !prefersReducedMotion.value) {
            transitionDirection.value = targetHeight < prevHeight ? 'collapse' : 'expand';
            isAnimating.value = true;
            currentHeight.value = targetHeight;

            const duration = transitionDirection.value === 'collapse'
                ? transitionConfig.collapse.duration
                : transitionConfig.expand.duration;
            if (animationTimer !== null) clearTimeout(animationTimer);
            animationTimer = setTimeout(() => {
                isAnimating.value = false;
                animationTimer = null;
            }, duration + 20);
        } else {
            currentHeight.value = targetHeight;
        }
    }
});

// Event handlers
const handleReportSelect = (report: any) => {
    emit('select-report', report);
};

const handlePageSelect = (page: any) => {
    emit('select-page', page);
};

const handleHeaderHeightChange = (height: number) => {
    headerHeight.value = height;
};

const handleExpandSheet = () => {
    // Ignore expand events during initialization (e.g. MainNavigation tab setup)
    if (!isInitialized.value) return;

    // Jump to highest snap point
    const snaps = resolvedSnapPoints.value;
    const last = Math.max(0, snaps.length - 1);
    activeSnapIndex.value = last;
    transitionDirection.value = 'expand';
    isAnimating.value = true;
    currentHeight.value = snaps[last];
    if (animationTimer !== null) clearTimeout(animationTimer);
    animationTimer = setTimeout(() => {
        isAnimating.value = false;
        animationTimer = null;
    }, transitionConfig.expand.duration + 20);
};

// Drag logic
const dragHandle = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(0);

const onDragStart = (e: MouseEvent) => {
    isDragging.value = true;
    isAnimating.value = false;
    emit('dragging-change', true);
    startY.value = e.clientY;
    startHeight.value = currentHeight.value;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onDragEnd);
};

const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDragging.value = true;
    isAnimating.value = false;
    emit('dragging-change', true);
    startY.value = touch.clientY;
    startHeight.value = currentHeight.value;
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
};

const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;
    onDragMove(e.clientY);
};

const onTouchMove = (e: TouchEvent) => {
    if (!isDragging.value) return;
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    onDragMove(touch.clientY);
};

const onDragMove = (clientY: number) => {
    const delta = startY.value - clientY;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const maxH = Math.min(winH * 0.9, winH - 100);
    // When explicit snap points are provided, allow dragging to the lowest snap point
    const dragMin = hasExplicitSnaps.value
        ? Math.max(resolvedSnapPoints.value[0] ?? 0, 40)
        : minimumHeight.value;
    let next = Math.max(dragMin, Math.min(maxH, startHeight.value + delta));
    // slight dampening near min
    if (next < dragMin + 30) {
        const d = (next - dragMin) / 30;
        next = dragMin + d * 30;
    }
    currentHeight.value = next;
};

const onDragEnd = () => {
    if (!isDragging.value) return;
    isDragging.value = false;
    emit('dragging-change', false);

    // snap to nearest of [min, mid, high]
    const cur = currentHeight.value;
    const candidates = resolvedSnapPoints.value;
    // Guard against empty candidates (e.g. all snap points collapsed by dedup)
    if (!candidates.length) return;
    const nearest = candidates.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a));

    // Set direction based on snap target vs current position
    transitionDirection.value = 'snap';
    isAnimating.value = true;
    currentHeight.value = nearest;

    // update active snap index
    const idx = candidates.findIndex(h => h === nearest);
    if (idx >= 0) activeSnapIndex.value = idx;

    if (animationTimer !== null) clearTimeout(animationTimer);
    animationTimer = setTimeout(() => {
        isAnimating.value = false;
        animationTimer = null;
    }, transitionConfig.snap.duration + 20);

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onDragEnd);
};

// Step snap index by direction (keyboard: Arrow Up = expand, Arrow Down = collapse)
const stepSnap = (direction: number) => {
    const snaps = resolvedSnapPoints.value;
    const idx = activeSnapIndex.value;
    const nextIdx = Math.min(Math.max(idx + direction, 0), snaps.length - 1);
    if (nextIdx === idx) return;

    transitionDirection.value = direction > 0 ? 'expand' : 'collapse';
    isAnimating.value = true;
    activeSnapIndex.value = nextIdx;
    currentHeight.value = snaps[nextIdx];

    const duration = direction > 0 ? transitionConfig.expand.duration : transitionConfig.collapse.duration;
    if (animationTimer !== null) clearTimeout(animationTimer);
    animationTimer = setTimeout(() => {
        isAnimating.value = false;
        animationTimer = null;
    }, duration + 20);
};

// Toggle between min -> mid -> high
const toggleHeight = () => {
    const snaps = resolvedSnapPoints.value;
    const idx = activeSnapIndex.value;
    const nextIdx = (idx + 1) % snaps.length;

    // Determine direction: expanding (going up in index) or collapsing (wrapping to 0)
    const isExpanding = nextIdx > idx;
    transitionDirection.value = isExpanding ? 'expand' : 'collapse';
    isAnimating.value = true;

    activeSnapIndex.value = nextIdx;
    currentHeight.value = snaps[nextIdx];

    const duration = isExpanding ? transitionConfig.expand.duration : transitionConfig.collapse.duration;
    if (animationTimer !== null) clearTimeout(animationTimer);
    animationTimer = setTimeout(() => {
        isAnimating.value = false;
        animationTimer = null;
    }, duration + 20);
};

onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onDragEnd);
    if (animationTimer !== null) {
        clearTimeout(animationTimer);
        animationTimer = null;
    }
});

// Simple public API
defineExpose({
    isOpen: computed(() => isOpen.value)
});
</script>

<style scoped>
/* Smooth transitions */
.transition-transform {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Mobile optimizations */
.overflow-hidden {
  overscroll-behavior: none;
}

/* GPU acceleration for smooth animations */
.transform-gpu {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* iOS specific optimizations */
@supports (-webkit-touch-callout: none) {
  .max-h-[90vh] {
    max-height: -webkit-fill-available;
    max-height: 90dvh;
  }
}

/* Ensure proper safe area handling */
@supports (padding: max(0px)) {
  .rounded-t-3xl {
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}
</style>
