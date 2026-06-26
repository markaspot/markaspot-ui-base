/**
 * useFormFirstMode - Form-first mobile UX (issue #61)
 *
 * When enabled, mobile users see report forms first with map loading on demand.
 * This provides a faster initial experience by deferring map initialization
 * until the user explicitly needs to refine their location.
 *
 * Two layout modes:
 * - 'bottomSheet': Traditional bottom sheet with form inside (default)
 * - 'tabs': Top tabs for Photo/Classic with form-first experience
 */

import { useWindowSize } from '@vueuse/core';

export type FormFirstTab = 'photo' | 'classic';
export type MobileLayout = 'bottomSheet' | 'tabs';

export interface FormFirstConfig {
    enabled: boolean
    mobileLayout: MobileLayout
    defaultTab: FormFirstTab
    map: {
        deferLoad: boolean
        refinementHeight: string
    }
    collapseOnFocus: boolean
}

// Module-level state for singleton pattern (shared across components)
const activeTab = ref<FormFirstTab>('photo');
const activeTabSource = ref<'default' | 'manual'>('default');
const mapLoaded = ref(false);
const mapRefinementOpen = ref(false);
const formFocused = ref(false);
const hasLeftFormView = ref(false);

export function useFormFirstMode() {
    // Use dynamically merged config from API, not static build-time config
    const { clientConfig } = useMarkASpotConfig();
    const { photoReportAvailable } = useFeatureFlags();
    const resolveTab = (tab?: FormFirstTab): FormFirstTab => {
        const fallback = photoReportAvailable.value ? 'photo' : 'classic';
        return tab === 'photo' && !photoReportAvailable.value ? 'classic' : (tab ?? fallback);
    };

    // Get form-first config from client config
    const formFirstConfig = computed<FormFirstConfig>(() => {
        const rawFormFirst = clientConfig.value?.features?.formFirst;
        const ff = typeof rawFormFirst === 'object' && rawFormFirst !== null
            ? rawFormFirst
            : {};
        const defaultTab = ff.defaultTab === 'classic' || ff.defaultTab === 'photo'
            ? ff.defaultTab
            : undefined;
        return {
            enabled: typeof rawFormFirst === 'boolean' ? rawFormFirst : ff.enabled ?? false,
            mobileLayout: ff.mobileLayout ?? 'bottomSheet',
            defaultTab: resolveTab(defaultTab),
            map: {
                deferLoad: ff.map?.deferLoad ?? true,
                refinementHeight: ff.map?.refinementHeight ?? '50vh'
            },
            collapseOnFocus: ff.collapseOnFocus ?? true
        };
    });

    // Use VueUse's useWindowSize - no manual cleanup needed
    const { width } = useWindowSize();
    const isDesktop = computed(() => width.value >= 768);

    // Check if form-first mode is active (enabled + mobile)
    const isFormFirstActive = computed(() => {
        return formFirstConfig.value.enabled && !isDesktop.value;
    });

    // Check if using tabs layout
    const isTabsLayout = computed(() => {
        return isFormFirstActive.value && formFirstConfig.value.mobileLayout === 'tabs';
    });

    watch(
        () => formFirstConfig.value.defaultTab,
        (defaultTab) => {
            if (activeTabSource.value === 'default') {
                activeTab.value = defaultTab;
            }
        },
        { immediate: true }
    );

    watch(photoReportAvailable, (enabled) => {
        if (!enabled && activeTab.value === 'photo') {
            activeTab.value = 'classic';
            activeTabSource.value = 'default';
        }
    }, { immediate: true });

    // Actions
    function setActiveTab(tab: FormFirstTab) {
        activeTab.value = resolveTab(tab);
        activeTabSource.value = 'manual';
    }

    function openMapRefinement() {
        mapRefinementOpen.value = true;
        if (!mapLoaded.value) {
            mapLoaded.value = true;
        }
    }

    function closeMapRefinement() {
        mapRefinementOpen.value = false;
    }

    function setFormFocused(focused: boolean) {
        formFocused.value = focused;
    }

    function markAsLeftFormView() {
        hasLeftFormView.value = true;
    }

    function returnToFormView() {
        hasLeftFormView.value = false;
    }

    // Determine if map should be initialized
    const shouldInitializeMap = computed(() => {
        if (!isFormFirstActive.value) {
            return true;
        }
        if (!formFirstConfig.value.map.deferLoad) {
            return true;
        }
        return mapLoaded.value;
    });

    // Determine bottom sheet collapse state
    const shouldCollapseBottomSheet = computed(() => {
        if (!isFormFirstActive.value) return false;
        if (!formFirstConfig.value.collapseOnFocus) return false;
        return formFocused.value;
    });

    // Semantic reset methods for different scenarios
    function resetForNewReport() {
        activeTabSource.value = 'default';
        activeTab.value = formFirstConfig.value.defaultTab;
        mapRefinementOpen.value = false;
        formFocused.value = false;
        hasLeftFormView.value = false;
    }

    function resetOnClose() {
        activeTabSource.value = 'default';
        activeTab.value = formFirstConfig.value.defaultTab;
        mapRefinementOpen.value = false;
        formFocused.value = false;
        hasLeftFormView.value = false;
    }

    function resetOnSuccess() {
        activeTabSource.value = 'default';
        activeTab.value = formFirstConfig.value.defaultTab;
        mapRefinementOpen.value = false;
        formFocused.value = false;
        hasLeftFormView.value = false;
    }

    // Generic reset (backwards compatibility)
    function reset() {
        resetOnClose();
    }

    // Full reset including map state (e.g., on route change)
    function fullReset() {
        reset();
        mapLoaded.value = false;
    }

    return {
        // Config
        formFirstConfig,

        // Computed state
        isFormFirstActive,
        isTabsLayout,
        isDesktop,
        shouldInitializeMap,
        shouldCollapseBottomSheet,

        // State
        activeTab: readonly(activeTab),
        mapLoaded: readonly(mapLoaded),
        mapRefinementOpen: readonly(mapRefinementOpen),
        formFocused: readonly(formFocused),
        hasLeftFormView: readonly(hasLeftFormView),

        // Actions
        setActiveTab,
        openMapRefinement,
        closeMapRefinement,
        setFormFocused,
        markAsLeftFormView,
        returnToFormView,
        reset,
        resetForNewReport,
        resetOnClose,
        resetOnSuccess,
        fullReset
    };
}
