<script setup lang="ts">
/**
 * StatusBadge Component
 *
 * Displays a status badge with dynamic text color for WCAG AA compliance.
 * Automatically calculates the best contrast text color (black/white)
 * based on the background color using getContrastingTextColor utility.
 */
import { getContrastingTextColor } from '@/utils/colorUtils';

interface Props {
    /** Status label text */
    label: string
    /** Background color in hex format (e.g., '#FF0000') */
    color?: string
    /** Badge size */
    size?: 'xs' | 'sm' | 'md'
    /** Optional icon name */
    icon?: string
}

const props = withDefaults(defineProps<Props>(), {
    color: '#6B7280',
    size: 'sm'
});

const colorMode = useColorMode();

/**
 * Computed text color based on background for WCAG AA compliance.
 * Passes dark mode context so medium-luminance backgrounds (e.g. gray archived
 * statuses) get white text in dark mode instead of black.
 */
const textColor = computed(() => {
    return getContrastingTextColor(props.color, { isDark: colorMode.value === 'dark' });
});

/**
 * Size-based classes
 */
const sizeClasses = computed(() => {
    switch (props.size) {
        case 'xs':
            return 'px-1.5 py-0.5 text-xs';
        case 'md':
            return 'px-2.5 py-1 text-sm';
        case 'sm':
        default:
            return 'px-2 py-0.5 text-xs';
    }
});
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full font-medium"
    :class="sizeClasses"
    :style="{
      backgroundColor: color,
      color: textColor,
    }"
  >
    <UIcon
      v-if="icon"
      :name="icon"
      class="size-3.5"
    />
    {{ label }}
  </span>
</template>
