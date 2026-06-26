/**
 * Composable for keyboard navigation in lists
 * Provides arrow key navigation, home/end functionality, and selection handling
 */
export function useKeyboardListNavigation() {
    /**
   * Handle keyboard navigation for individual list items
   * @param event - The keyboard event
   * @param item - The current item data
   * @param index - The current item index
   * @param items - The complete list of items
   * @param onSelect - Callback function when item is selected (Enter/Space)
   * @param canSelect - Optional function to check if item can be selected
   */
    const handleListItemKeydown = <T = unknown>(
        event: KeyboardEvent,
        item: T,
        index: number,
        items: T[],
        onSelect: (item: T) => void,
        canSelect?: (item: T) => boolean
    ) => {
        if (items.length === 0) return;

        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                // Focus next item
                const nextIndex = Math.min(index + 1, items.length - 1);
                if (nextIndex !== index) {
                    const nextElement = document.querySelector(`[data-index="${nextIndex}"]`) as HTMLElement;
                    if (nextElement) {
                        nextElement.focus();
                    }
                }
                break;
            }
            case 'ArrowUp': {
                event.preventDefault();
                // Focus previous item
                const prevIndex = Math.max(index - 1, 0);
                if (prevIndex !== index) {
                    const prevElement = document.querySelector(`[data-index="${prevIndex}"]`) as HTMLElement;
                    if (prevElement) {
                        prevElement.focus();
                    }
                }
                break;
            }
            case 'Home': {
                event.preventDefault();
                // Focus first item
                const firstElement = document.querySelector(`[data-index="0"]`) as HTMLElement;
                if (firstElement) {
                    firstElement.focus();
                }
                break;
            }
            case 'End': {
                event.preventDefault();
                // Focus last item
                const lastElement = document.querySelector(`[data-index="${items.length - 1}"]`) as HTMLElement;
                if (lastElement) {
                    lastElement.focus();
                }
                break;
            }
            case 'Enter':
            case ' ':
                event.preventDefault();
                // Check if item can be selected (if canSelect function provided)
                if (canSelect && !canSelect(item)) {
                    return;
                }
                onSelect(item);
                break;
        }
    };

    return {
        handleListItemKeydown
    };
}
