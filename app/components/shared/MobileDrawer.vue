/**
 * MobileDrawer
 *
 * A mobile-optimized content container using Nuxt UI's UDrawer with horizontal
 * gesture support. Provides fullscreen coverage with swipe-to-close functionality
 * that follows standard mobile UX patterns. Supports forms, content, and any type
 * of drawer content.
 */
<template>
  <UDrawer
    v-model:open="isOpen"
    :direction="direction"
    :handle="false"
    :overlay="true"
    :modal="true"
    :dismissible="true"
    :should-scale-background="false"
    :set-background-color-on-scale="false"
    :title="title || 'Form'"
    :ui="{ content: 'z-[70]' }"
    @close="handleClose"
    @open="handleOpen"
  >
    <!-- Trigger slot (optional) -->
    <template #default>
      <slot name="trigger" />
    </template>

    <!-- Main content -->
    <template #content>
      <div class="flex flex-col h-full bg-[var(--ui-bg)] w-screen max-w-full overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-4 pt-safe bg-[var(--ui-bg)] border-b border-[var(--ui-border)] shadow-sm flex-shrink-0">
          <!-- Back button -->
          <button
            class="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            :aria-label="$t('common.back')"
            @click="handleClose"
          >
            <UIcon
              :name="direction === 'left' ? 'i-heroicons-arrow-right' : 'i-heroicons-arrow-left'"
              class="w-5 h-5"
            />
            <span class="font-medium">{{ $t('common.back') }}</span>
          </button>

          <!-- Title -->
          <h2 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 text-center flex-1 mx-4 truncate">
            <slot name="title">
              {{ title }}
            </slot>
          </h2>

          <!-- Spacer for centering -->
          <div class="w-16" />
        </div>

        <!-- Content area -->
        <div
          class="flex-1 overflow-y-auto w-full max-w-full drawer-content"
        >
          <slot />
        </div>

        <!-- Footer (optional) -->
        <div
          v-if="$slots.footer"
          class="bg-[var(--ui-bg)] border-t border-[var(--ui-border)] p-4 flex-shrink-0 mt-auto pb-safe"
        >
          <slot name="footer" />
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
    /**
     * Whether the drawer is open
     */
    modelValue: boolean

    /**
     * Title to display in the header
     */
    title?: string

    /**
     * Direction from which the drawer slides in
     * - 'left': Slides in from left (swipe right to close)
     * - 'right': Slides in from right (swipe left to close)
     * @default 'right'
     */
    direction?: 'left' | 'right'
}

interface Emits {
    /**
     * Emitted when the drawer visibility changes
     */
    'update:modelValue': [value: boolean]

    /**
     * Emitted when the drawer is closed
     */
    'close': []

    /**
     * Emitted when the drawer is opened
     */
    'open': []
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    direction: 'right'
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

// Two-way binding for v-model
const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
});

/**
 * Handle drawer close event
 */
const handleClose = () => {
    emit('update:modelValue', false);
    emit('close');
};

/**
 * Handle drawer open event
 */
const handleOpen = () => {
    emit('open');
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

/* Ensure smooth scrolling for content and prevent mobile swipe-back */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  overscroll-behavior-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Content area with optimized touch handling for swipe gestures */
.drawer-content {
  /* Allow horizontal swipe for drawer dismissal while preventing overscroll */
  touch-action: pan-y pinch-zoom;
  overscroll-behavior-x: none;
  /* Disable text selection on content containers but allow on form elements */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* Restore normal interaction for form elements */
.drawer-content input,
.drawer-content textarea,
.drawer-content select,
.drawer-content button,
.drawer-content a,
.drawer-content [role="button"],
.drawer-content [tabindex] {
  touch-action: manipulation !important;
  -webkit-touch-callout: default !important;
  -webkit-user-select: auto !important;
  user-select: auto !important;
  pointer-events: auto !important;
}

/* Allow text selection in content areas but preserve swipe */
.drawer-content .prose,
.drawer-content p,
.drawer-content span:not([role]),
.drawer-content div:not([role]):not(.flex):not(.grid) {
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
