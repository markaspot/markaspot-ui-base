// composables/useLayout.ts

/**
 * Layout Composable
 *
 * Provides responsive layout utilities and viewport detection.
 *
 * @returns Reactive state and methods for layout functionality
 */

export function useLayout() {
    // Start with null to prevent flash
    const isDesktop = ref<boolean | null>(null);

    const updateLayout = () => {
        isDesktop.value = window.innerWidth >= 768;
    };

    onMounted(() => {
        updateLayout();
        window.addEventListener('resize', updateLayout);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', updateLayout);
    });

    return {
        isDesktop,
        // Helper computed to only show content when layout is determined
        isLayoutReady: computed(() => isDesktop.value !== null)
    };
}
