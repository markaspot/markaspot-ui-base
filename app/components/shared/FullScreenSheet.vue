<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="transform translate-y-full opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-full opacity-0"
    >
      <div
        v-if="modelValue"
        ref="sheetRef"
        class="fixed inset-0 z-[100] bg-[var(--ui-bg)] flex flex-col"
        tabindex="0"
        @keydown.esc="handleClose"
      >
        <!-- Header -->
        <div class="flex items-center px-4 py-4 bg-[var(--ui-bg)] border-b border-[var(--ui-border)] shadow-sm flex-shrink-0">
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

          <!-- Title - Now takes available space -->
          <h2 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 flex-1 truncate">
            <slot name="title">
              {{ title }}
            </slot>
          </h2>

          <!-- Close button (X) on the right -->
          <UButton
            v-if="showCloseButton"
            :icon="closeIcon"
            :color="closeButtonProps.color"
            :variant="closeButtonProps.variant"
            :size="closeButtonProps.size"
            :class="closeButtonProps.class"
            :aria-label="$t('common.close')"
            @click="handleClose"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          <slot />
        </div>

        <!-- Footer (optional) -->
        <div
          v-if="$slots.footer"
          class="sticky bottom-0 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] p-4 flex-shrink-0"
        >
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
    modelValue: boolean
    title?: string
    /**
     * Whether to show the back button (for navigation context)
     * @default false
     */
    showBackButton?: boolean
    /**
     * Whether to show the close button (X) on the right
     * @default true
     */
    showCloseButton?: boolean
    /**
     * Configuration for the close button
     * @default { color: 'gray', variant: 'ghost', size: 'sm' }
     */
    closeButton?: Record<string, any>
    /**
     * Icon for the close button
     * @default 'i-heroicons-x-mark'
     */
    closeIcon?: string
}

interface Emits {
    'update:modelValue': [value: boolean]
    'close': []
    'back': []
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    showBackButton: false,
    showCloseButton: true,
    closeButton: () => ({}),
    closeIcon: 'i-heroicons-x-mark'
});

const emit = defineEmits<Emits>();

const sheetRef = ref<HTMLElement>();

// Close button configuration
const closeButtonProps = computed(() => ({
    color: 'neutral' as const,
    variant: 'ghost' as const,
    size: 'sm' as const,
    class: 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
    ...props.closeButton
}));

const handleClose = () => {
    emit('update:modelValue', false);
    emit('close');
};

const handleBack = () => {
    emit('back');
};

const handleGlobalKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.modelValue) {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
    }
};

// Handle body scroll lock when sheet is open
onMounted(() => {
    if (props.modelValue) {
        document.body.style.overflow = 'hidden';
    }
});

onBeforeUnmount(() => {
    document.body.style.overflow = '';
    // Clean up global event listener
    document.removeEventListener('keydown', handleGlobalKeydown);
});

// Watch for modelValue changes to lock/unlock body scroll and manage focus
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        document.body.style.overflow = 'hidden';
        // Focus the sheet for ESC key handling
        nextTick(() => {
            sheetRef.value?.focus();
        });
        // Add global ESC key listener
        document.addEventListener('keydown', handleGlobalKeydown);
    } else {
        document.body.style.overflow = '';
        // Remove global ESC key listener
        document.removeEventListener('keydown', handleGlobalKeydown);
    }
});
</script>

<style scoped>
/* Ensure the sheet covers everything including modals */
.z-\[100\] {
  z-index: 100;
}

/* Smooth scrolling for content */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
</style>
