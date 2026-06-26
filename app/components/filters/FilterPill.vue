<template>
  <button
    type="button"
    :aria-pressed="active"
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
      'focus:outline-none transition-colors duration-200',
      pillClasses,
    ]"
    :style="pillStyles"
    @click="$emit('toggle')"
  >
    <!-- Icon with dynamic color -->
    <UIcon
      :name="icon"
      :class="iconClasses"
      :style="iconStyles"
    />

    <!-- Label -->
    <span>{{ label }}</span>

    <!-- Count (if provided) -->
    <span
      v-if="count !== undefined"
      :class="[
        'ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold',
        countClasses,
      ]"
    >
      {{ count }}
    </span>

    <!-- Close button for active filters -->
    <UIcon
      v-if="active && showClose"
      name="i-heroicons-x-mark"
      class="w-3 h-3 ml-1 hover:scale-110 transition-transform"
      @click.stop="$emit('clear')"
    />
  </button>
</template>

<script setup lang="ts">
/**
 * FilterPill Component
 *
 * Reusable pill-shaped filter button with icon, label, count, and close functionality.
 * Supports different states (active/inactive) and color variants.
 */

interface Props {
    label: string
    icon: string
    active?: boolean
    count?: number
    color?: string // Accept any hex color or Tailwind color name
    showClose?: boolean
    size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
    active: false,
    color: 'gray',
    showClose: true,
    size: 'md'
});

defineEmits<{
    toggle: []
    clear: []
}>();

// Check if color is a hex color
const isHexColor = computed(() => {
    return props.color?.startsWith('#') || false;
});

// Dynamic classes for pill (neutral styling)
const pillClasses = computed(() => {
    const baseClasses = 'border transition-all duration-200';

    if (props.active) {
        // Active state - primary color, no border/glow
        return `${baseClasses} bg-primary-500 text-inverted border-transparent hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500`;
    } else {
        // Inactive state - neutral styling with subtle border
        return `${baseClasses} bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-600 dark:hover:bg-neutral-700`;
    }
});

// Dynamic classes for icon only
const iconClasses = computed(() => {
    const baseClasses = 'w-3.5 h-3.5';

    if (props.active) {
        // Active state - white icon on primary background
        return `${baseClasses} text-white`;
    } else if (isHexColor.value) {
        // For hex colors, we'll use inline styles
        return baseClasses;
    } else {
        // Fallback to neutral icon color
        return `${baseClasses} text-neutral-500 dark:text-neutral-400`;
    }
});

// Dynamic inline styles for icon (hex colors only)
const pillStyles = computed(() => {
    // No styles needed for pill - color only applied to icon
    return {};
});

// Separate styles for icon color
const iconStyles = computed(() => {
    // Don't apply hex color when active (use white instead)
    if (props.active || !isHexColor.value) return {};

    return {
        color: props.color
    };
});

const countClasses = computed(() => {
    if (props.active) {
        // Count on active pill - white with primary text for contrast
        return 'bg-white/90 text-primary-700 dark:bg-white/20 dark:text-white';
    } else {
        // Count on inactive pill - light background
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
    }
});
</script>
