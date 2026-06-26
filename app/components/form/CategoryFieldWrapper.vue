<template>
  <div class="category-field-wrapper">
    <!-- Category Selection -->
    <div class="category-select-container relative z-50">
      <CategorySelect
        :model-value="modelValue"
        :required="required"
        :use-searchable="useSearchable"
        :disabled="disabled"
        :allow-parent-selection="allowParentSelection"
        :has-interacted="hasInteracted"
        @update:model-value="handleUpdate"
        @validation="handleValidation"
      />
    </div>

    <!-- Category Information Display -->
    <div v-if="modelValue">
      <!-- Warning notice when form is disabled -->
      <div
        v-if="formDisabled"
        class="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400"
      >
        <UIcon
          name="i-heroicons-exclamation-circle"
          class="w-5 h-5"
        />
        <span class="font-bold">{{ $t('form.category_disabled_notice') }}</span>
      </div>

      <!-- Single CategoryDescription instance with conditional styling -->
      <div
        v-if="showCategoryDescription"
        :class="{ 'category-info-highlighted': formDisabled }"
      >
        <CategoryDescription
          :category-id="modelValue"
          @update:disabled="$emit('update:form-disabled', $event)"
          @update:disable-media-upload="$emit('update:disable-media-upload', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
    modelValue: string
    required?: boolean
    useSearchable?: boolean
    disabled?: boolean
    formDisabled?: boolean
    allowParentSelection?: boolean
    showDescriptions?: boolean // New prop to control category descriptions
    hasInteracted?: boolean // Whether user has interacted with the field (for submit validation)
}

interface Emits {
    'update:modelValue': [value: string]
    'validation': [isValid: boolean]
    'update:form-disabled': [disabled: boolean]
    'update:disable-media-upload': [disabled: boolean]
}

const props = withDefaults(defineProps<Props>(), {
    required: false,
    useSearchable: true,
    disabled: false,
    formDisabled: false,
    allowParentSelection: false,
    showDescriptions: true, // Default to true for backward compatibility
    hasInteracted: false
});

const emit = defineEmits<Emits>();

// Computed property to determine if category descriptions should be shown
const showCategoryDescription = computed(() => {
    return props.modelValue && (props.showDescriptions || props.formDisabled);
});

const handleUpdate = (value: string) => {
    emit('update:modelValue', value);
};

const handleValidation = (isValid: boolean) => {
    emit('validation', isValid);
};
</script>

<style scoped>
/* Highlighted category description when form is disabled */
.category-info-highlighted {
  padding: 0.5rem;
  margin: -0.5rem -0.5rem 0.5rem;
  border-radius: 0.5rem;
  background-color: var(--color-primary-50);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: info-box-pulse 2s infinite;
  transition: all 0.3s ease;
}

@keyframes info-box-pulse {
  0% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(var(--color-primary-500-rgb), 0.3), 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: scale(1.01);
  }
  100% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: scale(1);
  }
}

.dark .category-info-highlighted {
  background-color: var(--color-primary-900);
  border-color: var(--color-primary-700);
}
</style>
