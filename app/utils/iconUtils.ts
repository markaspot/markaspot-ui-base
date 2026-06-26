// app/utils/iconUtils.ts
import { useRuntimeConfig } from '#imports';

/**
 * Normalize an icon name coming from various sources (FontAwesome, Iconify, custom, etc.)
 *
 * Supports multiple icon formats for backwards compatibility:
 * - iconify_field format: lucide:tree-pine → lucide-tree-pine
 * - fa_icon_class format: i-lucide-tree-pine → lucide-tree-pine
 * - FontAwesome format: fa-trash → trash
 *
 * The normalized format is used for SVG file lookup in /public/icons/
 */
export function normalizeIconName(iconName: string): string {
    // Handle iconify_field format: lucide:tree-pine → lucide-tree-pine
    if (iconName.includes(':')) {
        const [collection, name] = iconName.split(':');
        return `${collection}-${name}`.toLowerCase();
    }

    // Handle fa_icon_class format: i-lucide-tree-pine → lucide-tree-pine
    if (iconName.startsWith('i-')) {
        return iconName.replace(/^i-/, '').toLowerCase();
    }

    // Handle FontAwesome format (legacy)
    return iconName
        .replace(/^fa:/, '')
        .replace(/^(far|fas|fab)\s/, '')
        .replace('fa-', '')
        .replace(/-o$/, '')
        .replace(/\s/g, '-')
        .toLowerCase();
}

/**
 * Convert icon name to UIcon format (i-{collection}-{name})
 *
 * Supports multiple input formats:
 * - iconify_field format: lucide:tree-pine → i-lucide-tree-pine
 * - fa_icon_class format: i-lucide-tree-pine → i-lucide-tree-pine (unchanged)
 * - FontAwesome format: fa-trash → i-lucide-trash (with fallback)
 *
 * Used by Vue components with <UIcon :name="..." />
 */
export function toUIconName(iconName: string): string {
    // Already in UIcon format
    if (iconName.startsWith('i-')) {
        return iconName.toLowerCase();
    }

    // Handle iconify_field format: lucide:tree-pine → i-lucide-tree-pine
    if (iconName.includes(':')) {
        const [collection, name] = iconName.split(':');
        return `i-${collection}-${name}`.toLowerCase();
    }

    // Handle FontAwesome format - convert to lucide fallback
    const normalized = iconName
        .replace(/^fa:/, '')
        .replace(/^(far|fas|fab)\s/, '')
        .replace('fa-', '')
        .replace(/-o$/, '')
        .replace(/\s/g, '-')
        .toLowerCase();

    return `i-lucide-${normalized}`;
}

/**
 * Resolve the default icon name from configuration, with a safe fallback.
 * Allows clients to override via client config without code changes.
 */
export function getDefaultIconName(): string {
    const config = useRuntimeConfig();
    const client = (config.public as any)?.clientConfig ?? {};
    // Prefer a client-defined default if present; otherwise fallback
    return (
        client?.features?.map?.defaultIcon ||
        client?.features?.categories?.defaultIcon ||
        'question-circle'
    );
}
