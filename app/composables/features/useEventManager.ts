import { useEmitter } from '~/composables/core/useEmitter';
import { useLanguage } from '~/composables/core/useLanguage';

/**
 * Composable for managing global events and language switching
 */
export function useEventManager(modalManager: {
    handlePageSelect: (page: Record<string, unknown>) => void
}) {
    const emitter = useEmitter();
    const { getNextLocale, switchLanguage } = useLanguage();

    /**
   * Handle language toggle with rotation through available locales
   */
    const handleLanguageToggle = async () => {
        await switchLanguage(getNextLocale());
    };

    /**
   * Setup global event listeners
   */
    const setupEventListeners = () => {
        emitter.on('show-page', (page: any) => {
            modalManager.handlePageSelect(page as Record<string, unknown>);
        });
    };

    /**
   * Clean up event listeners
   */
    const cleanupEventListeners = () => {
        emitter.off('show-page');
    };

    /**
   * Initialize event management
   */
    const initializeEvents = () => {
        onMounted(setupEventListeners);
        onUnmounted(cleanupEventListeners);
    };

    return {
        handleLanguageToggle,
        initializeEvents,
        setupEventListeners,
        cleanupEventListeners
    };
}
