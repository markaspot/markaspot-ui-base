<template>
  <!-- Loading state -->
  <span
    v-if="isLoading"
    class="inline-block bg-neutral-300 rounded animate-pulse"
    :class="sizeClass"
  />

  <!-- Nuxt UI Icon -->
  <UIcon
    v-else-if="resolvedIcon"
    :name="resolvedIcon"
    :class="[sizeClass, colorClass]"
    :style="colorStyle"
    v-bind="$attrs"
  />

  <!-- Fallback placeholder -->
  <span
    v-else
    class="inline-block bg-neutral-400 rounded"
    :class="sizeClass"
    :title="`Icon not found: ${iconName}`"
  />
</template>

<script setup lang="ts">
interface Props {
    iconName: string
    className?: string
    color?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    fallback?: string
}

const props = withDefaults(defineProps<Props>(), {
    size: 'md',
    fallback: 'i-lucide-help-circle'
});

const resolvedIcon = ref<string | null>(null);
const isLoading = ref(false);

/**
 * Convert icon format from i-collection-icon to i-collection:icon
 * UIcon expects colon format (i-lucide:hand) not hyphen format (i-lucide-hand)
 *
 * Assumes format: i-{collection}-{icon-name} where collection is single word
 * Examples: i-lucide-hand → i-lucide:hand, i-heroicons-check → i-heroicons:check
 */
const normalizeIconFormat = (iconName: string): string => {
    // Already has colon format (i-lucide:hand)
    if (iconName.includes(':')) {
        return iconName;
    }

    // Match pattern: i-{collection}-{icon}
    // Collection is assumed to be the first segment after i-
    const match = iconName.match(/^i-([a-z]+)-(.+)$/);
    if (match) {
        const [, collection, icon] = match;
        return `i-${collection}:${icon}`;
    }

    // Unknown format, return as-is
    return iconName;
};

// Size classes mapping
const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
};

const sizeClass = computed(() => {
    if (!props.className) {
        return sizeClasses[props.size];
    }
    // If className contains size classes (w-* or h-*), use className only
    // Otherwise combine default size with className
    const hasCustomSize = /\bw-\d|h-\d|size-/.test(props.className);
    return hasCustomSize ? props.className : `${sizeClasses[props.size]} ${props.className}`;
});

const colorClass = computed(() => {
    if (props.color) {
        // Handle direct color values (hex, rgb, etc.)
        if (props.color.startsWith('#') || props.color.startsWith('rgb')) {
            return '';
        }
        // Handle Tailwind color classes
        return `text-${props.color}`;
    }
    return 'text-current';
});

const colorStyle = computed(() => {
    if (props.color && (props.color.startsWith('#') || props.color.startsWith('rgb'))) {
        return { color: props.color };
    }
    return {};
});

/**
 * Load icon - normalize format for UIcon
 */
const loadIcon = () => {
    if (!props.iconName) {
        resolvedIcon.value = props.fallback;
        return;
    }

    isLoading.value = true;

    try {
        // Icons should be in i-{collection}-{name} format from Drupal
        if (props.iconName.startsWith('i-')) {
            resolvedIcon.value = normalizeIconFormat(props.iconName);
        } else {
            // Fallback for unknown formats
            resolvedIcon.value = props.fallback;
        }
    } catch (error) {
        console.error('Error loading icon:', error);
        resolvedIcon.value = props.fallback;
    } finally {
        isLoading.value = false;
    }
};

// Watch for changes in props to reload icon
watch(() => [props.iconName, props.className, props.color, props.size], loadIcon);

// Load icon on mount
onMounted(loadIcon);
</script>

<script lang="ts">
export default {
    name: 'DynamicIcon',
    inheritAttrs: false
};
</script>
