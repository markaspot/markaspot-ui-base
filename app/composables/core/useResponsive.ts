/**
 * Global responsive detection composable
 *
 * Provides consistent mobile/desktop detection across all components
 * Aligned with Tailwind CSS breakpoints for proper responsive behavior
 */

// Tailwind CSS breakpoints
const BREAKPOINTS = {
    'sm': 640, // Small devices and up
    'md': 768, // Medium devices and up
    'lg': 1024, // Large devices and up
    'xl': 1280, // Extra large devices and up
    '2xl': 1536 // 2X large devices and up
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

export function useResponsive() {
    // Initialize with default desktop values to prevent mobile-first flashing
    const getInitialWidth = () => {
        if (typeof window !== 'undefined') {
            return window.innerWidth;
        }
        // Assume desktop by default during SSR to prevent mobile-first flash
        return 1024;
    };

    // Reactive state for current screen size
    const screenWidth = ref(getInitialWidth());
    const isMobile = ref(screenWidth.value < BREAKPOINTS.sm);
    const isTablet = ref(screenWidth.value >= BREAKPOINTS.sm && screenWidth.value < BREAKPOINTS.lg);
    const isDesktop = ref(screenWidth.value >= BREAKPOINTS.lg);

    // Check if screen size matches breakpoint
    const isBreakpoint = (breakpoint: Breakpoint) => {
        return screenWidth.value >= BREAKPOINTS[breakpoint];
    };

    // Update screen size and computed values
    const updateScreenSize = () => {
        if (typeof window !== 'undefined') {
            screenWidth.value = window.innerWidth;

            // Update computed values - aligned with Tailwind CSS breakpoints
            isMobile.value = screenWidth.value < BREAKPOINTS.sm; // < 640px
            isTablet.value = screenWidth.value >= BREAKPOINTS.sm && screenWidth.value < BREAKPOINTS.lg; // 640px - 1024px
            isDesktop.value = screenWidth.value >= BREAKPOINTS.lg; // >= 1024px
        }
    };

    // Setup resize listener
    onMounted(() => {
    // Immediately update to get correct client-side dimensions
        updateScreenSize();
        window.addEventListener('resize', updateScreenSize);
    });

    onUnmounted(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', updateScreenSize);
        }
    });

    return {
    // Reactive values
        screenWidth,
        isMobile,
        isTablet,
        isDesktop,

        // Utility functions
        isBreakpoint,

        // Convenience methods aligned with Tailwind
        isSm: () => isBreakpoint('sm'),
        isMd: () => isBreakpoint('md'),
        isLg: () => isBreakpoint('lg'),
        isXl: () => isBreakpoint('xl'),
        is2xl: () => isBreakpoint('2xl'),

        // Modal-specific helpers that work immediately
        shouldUseDesktopModal: () => {
            // If we're on client-side, use actual screen width
            if (typeof window !== 'undefined') {
                return window.innerWidth >= BREAKPOINTS.sm;
            }
            // Default to desktop during SSR
            return true;
        },
        shouldUseMobileDrawer: () => {
            // If we're on client-side, use actual screen width
            if (typeof window !== 'undefined') {
                return window.innerWidth < BREAKPOINTS.sm;
            }
            // Default to desktop during SSR
            return false;
        }
    };
}
