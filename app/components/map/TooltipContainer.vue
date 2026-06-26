<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="tooltipRef"
      class="absolute z-[50] bg-[var(--ui-bg)] rounded-lg shadow-lg p-3 w-56 tooltip-with-arrow"
      :style="computedTooltipStyle"
      role="dialog"
      :aria-label="ariaLabel || t('map.tooltip.label')"
      tabindex="-1"
      @keydown.escape="handleClose"
      @click.stop
      @mousedown.stop
      @pointerdown.stop
    >
      <!-- Close button -->
      <button
        class="absolute top-1 right-1 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
        :aria-label="t('common.buttons.close')"
        @click="handleClose"
      >
        <UIcon
          name="i-heroicons-x-mark"
          class="w-4 h-4 text-neutral-500 dark:text-neutral-400"
        />
      </button>

      <!-- Tooltip Content -->
      <div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
    visible: boolean
    x: number
    y: number
    ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
    ariaLabel: ''
});

const emit = defineEmits<{
    close: []
}>();

const tooltipRef = ref<HTMLElement>();

// Store the element that had focus before the tooltip opened,
// so we can restore focus when it closes (WCAG 2.4.3 / ARIA dialog pattern).
let previouslyFocusedElement: Element | null = null;

const handleClose = () => {
    emit('close');
    // Restore focus to the trigger element that opened the tooltip
    if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
    }
};

// Compute the tooltip style based on position
const computedTooltipStyle = computed(() => {
    return {
        left: props.x + 'px',
        top: props.y + 'px',
        transform: 'translate(-50%, -110%)',
        marginBottom: '20px'
    };
});

// Focus the tooltip when it becomes visible; restore focus on close
watch(() => props.visible, async (isVisible) => {
    if (isVisible) {
        // Capture focus origin before moving focus into the dialog
        if (import.meta.client) {
            previouslyFocusedElement = document.activeElement;
        }
        await nextTick();
        tooltipRef.value?.focus();
    } else {
        // Restore focus to the element that triggered the tooltip
        if (previouslyFocusedElement instanceof HTMLElement) {
            previouslyFocusedElement.focus();
        }
        previouslyFocusedElement = null;
    }
});

onUnmounted(() => {
    // Restore focus on unmount in case close was triggered externally
    if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
    }
    previouslyFocusedElement = null;
});
</script>

<style>
.tooltip-with-arrow::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 10px 10px 0;
  border-style: solid;
  /* Use the same surface token as the bubble so the arrow matches the theme */
  border-color: var(--ui-bg) transparent transparent;
  pointer-events: none;
}
</style>
