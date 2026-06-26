<template>
  <div class="w-full">
    <AppTextarea
      ref="textareaRef"
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :rows="minRows"
      :maxlength="maxlength"
      :autofocus="autofocus"
      :resize="autoResize"
      class="w-full"
      :name="id || 'textarea'"
      :aria-label="ariaLabel || placeholder"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="!!error"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- Character counter -->
    <div
      v-if="showCounter && maxlength"
      class="mt-1 text-right text-xs"
      :class="counterClasses"
    >
      {{ characterCount }} / {{ maxlength }}
    </div>

    <!-- Typing indicator -->
    <div
      v-if="isTyping && showTypingIndicator"
      class="absolute top-2 right-2 pointer-events-none"
    >
      <span class="typing-cursor">|</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core';

// Types
interface Props {
    modelValue: string
    id?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    minRows?: number
    maxRows?: number
    maxlength?: number
    autofocus?: boolean
    autoResize?: boolean
    showCounter?: boolean
    showTypingIndicator?: boolean
    isTyping?: boolean
    error?: boolean | string
    ariaLabel?: string
    ariaDescribedby?: string
}

// Props & Emits
const props = withDefaults(defineProps<Props>(), {
    placeholder: '',
    disabled: false,
    readonly: false,
    required: false,
    minRows: 3,
    maxRows: 10,
    autofocus: false,
    autoResize: true,
    showCounter: false,
    showTypingIndicator: false,
    isTyping: false,
    error: false
});

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'focus': [event: FocusEvent]
    'blur': [event: FocusEvent]
}>();

// Composables
// Removed usePrimaryClasses; rely on Nuxt UI color + theme tokens

// Refs
const textareaRef = ref<{ $el: HTMLTextAreaElement }>();
const isFocused = ref(false);

// Computed
const characterCount = computed(() => props.modelValue?.length || 0);

const counterClasses = computed(() => {
    if (!props.maxlength) return 'text-neutral-600 dark:text-neutral-300';

    const percentage = (characterCount.value / props.maxlength) * 100;

    if (percentage >= 100) {
        return 'text-red-600 dark:text-red-400 font-medium';
    } else if (percentage >= 90) {
        return 'text-amber-600 dark:text-amber-400';
    }

    return 'text-neutral-600 dark:text-neutral-300';
});

const computedClasses = computed(() => {
    const baseClasses = [
        'block w-full rounded-md shadow-sm transition-all duration-200',
        'placeholder:text-neutral-400 dark:placeholder:text-neutral-400',
        'resize-none overflow-hidden'
    ];

    if (props.error) {
        baseClasses.push(
            'border-red-300 dark:border-red-700',
            'focus:ring-red-500 focus:border-red-500'
        );
    } else {
        baseClasses.push(
            'border-[var(--ui-border)]',
            'focus:ring-primary-500 focus:border-primary-500'
        );
    }

    if (props.disabled) {
        baseClasses.push('opacity-50 cursor-not-allowed');
    }

    if (props.readonly) {
        baseClasses.push('bg-[var(--ui-bg-elevated)]');
    }

    return baseClasses.join(' ');
});

// Methods
const handleInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    emit('update:modelValue', target.value);

    if (props.autoResize) {
        nextTick(() => adjustHeight());
    }
};

const handleFocus = (event: FocusEvent) => {
    isFocused.value = true;
    emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
    isFocused.value = false;
    emit('blur', event);
};

const adjustHeight = () => {
    if (!props.autoResize) return;

    // Try to find the textarea element from UTextarea component
    let textarea = textareaRef.value?.$el;

    // If $el is not the textarea itself, look for it inside
    if (textarea && textarea.tagName !== 'TEXTAREA') {
        textarea = textarea.querySelector('textarea');
    }

    if (!textarea) return;

    // Reset height to recalculate
    textarea.style.height = 'auto';

    // Remove any conflicting classes
    textarea.classList.remove('resize-none');

    // Calculate new height
    const scrollHeight = textarea.scrollHeight;
    const minHeight = props.minRows * 24; // Approximate line height
    const maxHeight = props.maxRows ? props.maxRows * 24 : Infinity;

    // Set new height within bounds
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;

    // Add or remove scrollbar based on content
    if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.overflowY = 'hidden';
    }
};

// Auto-resize on content change
watch(() => props.modelValue, () => {
    if (props.autoResize) {
        nextTick(() => adjustHeight());
    }
});

// Use ResizeObserver for responsive resizing
if (props.autoResize) {
    useResizeObserver(textareaRef as any, () => {
        adjustHeight();
    });
}

// Initialize height on mount
onMounted(() => {
    if (props.autoResize) {
        nextTick(() => adjustHeight());
    }

    if (props.autofocus) {
        textareaRef.value?.$el?.focus();
    }
});

// Expose focus method for parent components
defineExpose({
    focus: () => textareaRef.value?.$el?.focus(),
    blur: () => textareaRef.value?.$el?.blur()
});
</script>

<style scoped>
/* Typing cursor animation */
.typing-cursor {
  color: var(--color-primary-500);
  font-weight: 700;
  font-size: 1.125rem;
  line-height: 1.75rem;
  animation: blink 1s step-end infinite;
}

@media (prefers-color-scheme: dark) {
  .typing-cursor {
    color: var(--color-primary-400);
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Custom scrollbar for textarea */
:deep(textarea::-webkit-scrollbar) {
  width: 6px;
}

:deep(textarea::-webkit-scrollbar-track) {
  background-color: var(--color-gray-100);
  border-radius: 0.25rem;
}

@media (prefers-color-scheme: dark) {
  :deep(textarea::-webkit-scrollbar-track) {
    background-color: var(--color-gray-800);
  }
}

:deep(textarea::-webkit-scrollbar-thumb) {
  background-color: var(--color-gray-300);
  border-radius: 0.25rem;
}

@media (prefers-color-scheme: dark) {
  :deep(textarea::-webkit-scrollbar-thumb) {
    background-color: var(--color-gray-600);
  }
}

:deep(textarea::-webkit-scrollbar-thumb:hover) {
  background-color: var(--color-gray-400);
}

@media (prefers-color-scheme: dark) {
  :deep(textarea::-webkit-scrollbar-thumb:hover) {
    background-color: var(--color-gray-500);
  }
}

/* Firefox scrollbar */
:deep(textarea) {
  scrollbar-width: thin;
  scrollbar-color: var(--color-gray-300) var(--color-gray-100);
}

@media (prefers-color-scheme: dark) {
  :deep(textarea) {
    scrollbar-color: var(--color-gray-600) var(--color-gray-800);
  }
}
</style>
