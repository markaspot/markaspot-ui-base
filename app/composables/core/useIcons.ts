/**
 * Icons Composable
 *
 * Provides  icons functionality for the application.
 *
 * @returns Reactive state and methods for icons functionality
 */

import { normalizeIconName, getDefaultIconName } from '@/utils/iconUtils';

export function useIcons() {
    const cleanIconName = (iconName: string): string => {
        const name = iconName && iconName.trim().length > 0 ? iconName : getDefaultIconName();
        return normalizeIconName(name);
    };

    return { cleanIconName, getDefaultIconName };
}
