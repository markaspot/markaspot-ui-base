<template>
  <div
    :class="[
      'category-select-wrapper transition-all duration-300',
      { 'category-flash': isFlashing },
    ]"
  >
    <UFormField
      :label="label"
      :error="error"
      :required="isRequired"
    >
      <AppSelectMenu
        :id="`category-field-${fieldId}`"
        v-model="selectedCategory"
        :items="(selectOptions as any)"
        :loading="loading"
        :disabled="loading || disabled"
        :placeholder="placeholder"
        :search-placeholder="t('common.search')"
        searchable
        class="w-full pointer-events-auto"
        :state="error ? 'error' : undefined"
        :option-attribute="'label'"
        :value-attribute="'value'"
        :by="'value'"
        @change="handleInteraction"
      >
        <template #empty>
          <span class="text-neutral-600 dark:text-neutral-300">{{ t('form.category_empty') }}</span>
        </template>
        <template #loading>
          <span class="text-neutral-600 dark:text-neutral-300">{{ t('form.category_loading') }}</span>
        </template>
      </AppSelectMenu>

      <!-- Error message -->
      <template #error>
        <div
          :id="`${fieldId}-error`"
          role="alert"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ error }}
        </div>
      </template>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import AppSelectMenu from '@/components/ui/AppSelectMenu.vue';
import { useI18n } from 'vue-i18n';

// Types
interface CategoryOption {
    label: string
    value: string
    disabled?: boolean
}

interface Props {
    modelValue: string
    useSearchable?: boolean
    required?: boolean
    disabled?: boolean
    hasInteracted?: boolean
    allowParentSelection?: boolean
}

// Props & Emits
const props = withDefaults(defineProps<Props>(), {
    useSearchable: true,
    required: false,
    disabled: false,
    hasInteracted: false,
    allowParentSelection: false
});

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'validation': [isValid: boolean]
}>();

// Composables
const { t } = useI18n();
const { settings } = useFormSettings();
const { loading, categoryOptions, fetchCategories } = useCategories(toRef(props, 'allowParentSelection'));

// State
const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted);
const isFlashing = ref(false);
const lastUserInteraction = ref(0);

// Generate unique field ID
const fieldId = `category-select-${Math.random().toString(36).substr(2, 9)}`;

// Computed properties
const config = computed(() => settings.value?.fields.field_category);
const isRequired = computed(() => props.required || config.value?.required || false);

const label = computed(() => t('form.category'));

const placeholder = computed(() => t('form.category_placeholder'));

const selectOptions = computed<CategoryOption[]>(() => categoryOptions.value);

const selectedCategory = computed({
    get: () => {
        if (!props.modelValue) return null;
        // Find the matching option object from selectOptions
        const matchingOption = selectOptions.value.find(option => option.value === props.modelValue);
        return matchingOption || null;
    },
    set: (value: CategoryOption | null) => {
        hasUserInteracted.value = true;
        lastUserInteraction.value = Date.now(); // Track when user manually changes
        const stringValue = value?.value || '';
        emit('update:modelValue', stringValue);
        validate(stringValue);
    }
});

// Methods
const triggerFlash = () => {
    isFlashing.value = true;
    setTimeout(() => {
        isFlashing.value = false;
    }, 600); // Flash duration
};

const handleInteraction = () => {
    hasUserInteracted.value = true;
    lastUserInteraction.value = Date.now(); // Track user interaction
};

const validate = (value: string) => {
    const isValid = !isRequired.value || !!value;

    if (!isValid && hasUserInteracted.value) {
        error.value = t('validation.category_required') ||
          t('validation.required_field', { field: t('form.category') }) ||
          t('common.required');
    } else {
        error.value = null;
    }

    emit('validation', isValid);
    return isValid;
};

// Watchers
watch(() => props.modelValue, (newVal, oldVal) => {
    validate(newVal);

    // Trigger flash effect when value changes programmatically (not from user interaction)
    if (newVal && newVal !== oldVal) {
        const timeSinceLastUserInteraction = Date.now() - lastUserInteraction.value;

        // Only flash if change was NOT from recent user interaction (> 200ms ago)
        if (timeSinceLastUserInteraction > 200) {
            setTimeout(() => {
                triggerFlash();
            }, 50);
        }
    }
});

watch(() => props.hasInteracted, (newValue) => {
    if (newValue) {
        hasUserInteracted.value = true;
        validate(props.modelValue);
    }
});

// Initialize
onMounted(async () => {
    await fetchCategories();
});

// Expose methods for parent components
defineExpose({
    triggerFlash
});
</script>

<style scoped>
/* Category selection flash effect - target Nuxt UI components specifically */
.category-flash :deep(.app-select-menu) button,
.category-flash :deep([role="combobox"]),
.category-flash :deep(.relative) button {
  animation: category-selection-flash 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative;
  z-index: 1;
}

@keyframes category-selection-flash {
  0% {
    background-color: rgba(79, 70, 229, 0.1) !important;
    border-color: rgba(79, 70, 229, 0.3) !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
    transform: scale(1.02);
  }
  50% {
    background-color: rgba(79, 70, 229, 0.2) !important;
    border-color: rgba(79, 70, 229, 0.5) !important;
    box-shadow: 0 0 0 6px rgba(79, 70, 229, 0.25) !important;
    transform: scale(1.03);
  }
  100% {
    background-color: transparent !important;
    border-color: rgb(209, 213, 219) !important;
    box-shadow: none !important;
    transform: scale(1);
  }
}

/* Dark mode support */
.dark .category-flash :deep(.app-select-menu) button,
.dark .category-flash :deep([role="combobox"]),
.dark .category-flash :deep(.relative) button {
  animation: category-selection-flash-dark 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

@keyframes category-selection-flash-dark {
  0% {
    background-color: rgba(99, 102, 241, 0.15) !important;
    border-color: rgba(99, 102, 241, 0.4) !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
    transform: scale(1.02);
  }
  50% {
    background-color: rgba(99, 102, 241, 0.25) !important;
    border-color: rgba(99, 102, 241, 0.6) !important;
    box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.3) !important;
    transform: scale(1.03);
  }
  100% {
    background-color: transparent !important;
    border-color: rgb(75, 85, 99) !important;
    box-shadow: none !important;
    transform: scale(1);
  }
}

/* Flash effect applied to wrapper - ensure it's visible */
.category-flash {
  border-radius: 0.375rem;
}
</style>
