/**
 * FullScreenModal
 *
 * A full-screen modal component using Nuxt UI's UModal that provides
 * a complete viewport coverage with proper navigation, safe area handling,
 * and mobile-optimized interactions. Replaces drawer functionality with
 * standard modal patterns while maintaining mobile UX standards.
 */
<template>
  <UModal
    v-model:open="isOpen"
    :prevent-close="!isDismissible"
    :aria-label="title || $t('common.dialog')"
    fullscreen
    :ui="({
      content: 'z-[70]',
      overlay: 'fixed inset-0 bg-neutral-900/75 transition-opacity',
      container: 'fixed inset-0 w-screen h-screen',
      width: 'w-full h-full max-w-none',
      height: 'h-full max-h-none',
      inner: 'relative overflow-hidden w-full h-full',
      header: 'px-4 py-4 pt-safe bg-[var(--ui-bg)] border-b border-[var(--ui-border)] shadow-sm flex-shrink-0',
      body: 'p-0 flex-1 overflow-y-auto bg-[var(--ui-bg)]',
      footer: 'px-4 py-4 pb-safe bg-[var(--ui-bg)] border-t border-[var(--ui-border)] flex-shrink-0',
    } as any)"
    @close="handleClose"
  >
    <!-- Hidden trigger -->
    <template #default>
      <div style="display: none;" />
    </template>

    <!-- Header -->
    <template #header>
      <div
        class="flex items-center w-full"
        data-modal-header
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend.passive="onTouchEnd"
        @click="onHeaderTap"
      >
        <!-- Back button (optional, for navigation context) -->
        <button
          v-if="showBackButton"
          class="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-2"
          :aria-label="$t('common.back')"
          @click="handleBack"
        >
          <UIcon
            name="i-heroicons-arrow-left"
            class="w-5 h-5"
          />
          <span class="font-medium text-sm">{{ $t('common.back') }}</span>
        </button>

        <!-- Title - Now takes available space between back and close button -->
        <h2 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 flex-1 truncate mx-2">
          <slot name="title">
            {{ title }}
          </slot>
        </h2>

        <!-- Close button (X) on the right -->
        <UButton
          v-if="showCloseButton"
          icon="i-heroicons-x-mark"
          :color="closeButtonConfig.color"
          :variant="closeButtonConfig.variant"
          :size="closeButtonConfig.size"
          :class="closeButtonConfig.class"
          :aria-label="$t('common.close')"
          @click="handleClose"
        />
      </div>
    </template>

    <!-- Main content in body -->
    <template #body>
      <div
        class="flex flex-col h-full"
        data-modal-body
      >
        <div
          class="flex-1 overflow-y-auto modal-content"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend.passive="onTouchEnd"
        >
          <slot />
        </div>
      </div>
    </template>

    <!-- Footer -->
    <template #footer>
      <div
        v-if="$slots.footer"
        class="w-full"
      >
        <slot name="footer" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
    /**
     * Whether the modal is open
     */
    modelValue: boolean

    /**
     * Title to display in the header
     */
    title?: string

    /**
     * Whether the modal can be dismissed by clicking overlay or pressing ESC
     * @default true
     */
    isDismissible?: boolean

    /**
     * Whether to show the back button (for navigation context)
     * @default false
     */
    showBackButton?: boolean

    /**
     * Configuration for the close button
     * Set to false to hide, or pass Button props to customize
     * @default true
     */
    closeButton?: boolean | Record<string, any>
}

interface Emits {
    /**
     * Emitted when the modal visibility changes
     */
    'update:modelValue': [value: boolean]

    /**
     * Emitted when the modal is closed
     */
    'close': []

    /**
     * Emitted when the modal is opened
     */
    'open': []

    /**
     * Emitted when the back button is clicked
     */
    'back': []
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    isDismissible: true,
    showBackButton: false,
    closeButton: true
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

// Close button visibility
const showCloseButton = computed(() => props.closeButton !== false);

// Close button configuration with proper Nuxt UI types
type ButtonColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
type ButtonVariant = 'link' | 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CloseButtonConfig {
    color: ButtonColor
    variant: ButtonVariant
    size: ButtonSize
    class: string
}

const closeButtonConfig = computed<CloseButtonConfig>(() => {
    const defaults: CloseButtonConfig = {
        color: 'neutral',
        variant: 'ghost',
        size: 'sm',
        class: 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
    };
    if (typeof props.closeButton === 'object') {
        return { ...defaults, ...props.closeButton } as CloseButtonConfig;
    }
    return defaults;
});

// Swipe gesture state
const startX = ref(0);
const startY = ref(0);
const isDragging = ref(false);
const swipeThreshold = 80; // pixels

// Two-way binding for v-model
const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => {
        emit('update:modelValue', value);
        if (value) {
            emit('open');
        } else {
            emit('close');
        }
    }
});

/**
 * Handle swipe gestures for closing modal - left half of screen
 */
const onTouchStart = (e: TouchEvent) => {
    if (!props.isDismissible) return;
    const touch = e.touches[0];
    startX.value = touch.clientX;
    startY.value = touch.clientY;

    // Only track if starting from left half of screen
    const screenWidth = window.innerWidth;
    if (touch.clientX <= screenWidth * 0.5) {
        isDragging.value = true;
    }
};

const onTouchMove = (e: TouchEvent) => {
    if (!isDragging.value || !props.isDismissible) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.value;
    const deltaY = Math.abs(currentY - startY.value);

    // If user is scrolling vertically, stop tracking the swipe
    if (deltaY > 20 && deltaY > Math.abs(deltaX)) {
        isDragging.value = false;
        return;
    }

    // Only allow rightward swipes that are more horizontal than vertical
    if (deltaX > 0 && deltaX > swipeThreshold && deltaX > deltaY * 1.5) {
        handleClose();
        isDragging.value = false;
    }
};

const onTouchEnd = () => {
    isDragging.value = false;
};

// Close on simple tap anywhere on the header (title area), matching sheet UX
const onHeaderTap = (e: MouseEvent) => {
    if (!props.isDismissible) return;
    // If the tap originated on an interactive element (button), let that handler run
    const target = e.target as HTMLElement | null;
    if (target && (target.closest('button') || target.closest('[role="button"]'))) return;
    handleClose();
};

/**
 * Handle modal close event
 */
const handleClose = () => {
    emit('update:modelValue', false);
    emit('close');
};

/**
 * Handle back button click
 */
const handleBack = () => {
    emit('back');
};
</script>

<style scoped>
/* Safe area support handled by global safe-area.css */

/* Ensure full viewport coverage */
.h-screen {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for better mobile support */
}

.w-screen {
  width: 100vw;
  width: 100dvw; /* Dynamic viewport width */
}

/* Ensure smooth scrolling for content */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  overscroll-behavior-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Content area with optimized touch handling */
.modal-content {
  /* Allow vertical scrolling while preventing overscroll */
  touch-action: pan-y pinch-zoom;
  overscroll-behavior-x: none;
  /* Disable text selection on content containers but allow on form elements */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* Restore normal interaction for interactive elements */
.modal-content input,
.modal-content textarea,
.modal-content select,
.modal-content button,
.modal-content a,
.modal-content [role="button"],
.modal-content [tabindex] {
  touch-action: manipulation !important;
  -webkit-touch-callout: default !important;
  -webkit-user-select: auto !important;
  user-select: auto !important;
  pointer-events: auto !important;
}

/* Allow text selection in content areas */
.modal-content .prose,
.modal-content p,
.modal-content span:not([role]),
.modal-content div:not([role]):not(.flex):not(.grid) {
  -webkit-user-select: text !important;
  user-select: text !important;
}

.overflow-y-auto::-webkit-scrollbar {
  display: none;
}

/* Prevent overscroll on the main container */
.overflow-hidden {
  overscroll-behavior: none;
}

/* Ensure proper button tap highlighting on mobile */
button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation; /* Improve touch responsiveness */
}

/* Smooth transitions */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Improve mobile performance */
.flex {
  transform: translateZ(0); /* Force GPU acceleration */
}

/* Notch device support handled by global safe-area.css */

/* iOS specific optimizations */
@supports (-webkit-touch-callout: none) {
  .h-screen {
    height: -webkit-fill-available;
  }
}
</style>
