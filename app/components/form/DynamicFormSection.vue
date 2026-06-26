<template>
  <div class="dynamic-form-section space-y-6">
    <DynamicFieldRenderer
      v-for="field in visibleFields"
      v-show="shouldShowField(field.name)"
      :key="field.name"
      :field-name="field.name"
      :model-value="getFieldValue(field.name)"
      :disabled="disabled"
      v-bind="getFieldSpecificProps(field.name)"
      @update:model-value="updateFieldValue(field.name, $event)"
      @validation="handleFieldValidation(field.name, $event)"
      @update:form-disabled="handleCategoryFormDisabled"
      @update:disable-media-upload="handleCategoryDisableMediaUpload"
      @pick-on-map="emit('pick-on-map')"
    />
  </div>
</template>

<script setup lang="ts">
import { useDynamicFormFields } from '@/composables/form/useDynamicFormFields';

interface Props {
    modelValue: Record<string, unknown>
    disabled?: boolean
    region?: string
    excludeFields?: string[]
    includeOnlyFields?: string[]
    // Special field props
    fieldSpecificProps?: Record<string, Record<string, unknown>>
}

interface Emits {
    'update:modelValue': [value: Record<string, unknown>]
    'field-validation': [fieldName: string, isValid: boolean]
    'category-form-disabled': [disabled: boolean]
    'category-disable-media-upload': [disabled: boolean]
    'pick-on-map': []
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    region: 'content',
    excludeFields: () => [],
    includeOnlyFields: () => [],
    fieldSpecificProps: () => ({})
});

const emit = defineEmits<Emits>();

const { getFieldsByRegion } = useDynamicFormFields();

// Get fields for the specified region
const regionFields = getFieldsByRegion(props.region);

// Filter fields based on include/exclude lists
const visibleFields = computed(() => {
    let fields = regionFields.value;

    // If includeOnlyFields is specified, only show those fields
    if (props.includeOnlyFields.length > 0) {
        fields = fields.filter(field => props.includeOnlyFields.includes(field.name));
    }

    // Always respect excludeFields
    if (props.excludeFields.length > 0) {
        fields = fields.filter(field => !props.excludeFields.includes(field.name));
    }

    return fields;
});

// Get field value from model
const getFieldValue = (fieldName: string) => {
    return props.modelValue[fieldName];
};

// Update field value in model
const updateFieldValue = (fieldName: string, value: unknown) => {
    const newModel = { ...props.modelValue, [fieldName]: value };
    emit('update:modelValue', newModel);
};

// Handle field validation
const handleFieldValidation = (fieldName: string, isValid: boolean) => {
    emit('field-validation', fieldName, isValid);
};

// Get field-specific props
const getFieldSpecificProps = (fieldName: string) => {
    return props.fieldSpecificProps[fieldName] || {};
};

// Check if field should be shown (handles conditional visibility)
const shouldShowField = (fieldName: string) => {
    const fieldProps = props.fieldSpecificProps[fieldName];
    // If field has a visible prop, use it, otherwise default to true
    return fieldProps?.visible !== false;
};

// Handle category events
const handleCategoryFormDisabled = (disabled: boolean) => {
    emit('category-form-disabled', disabled);
};

const handleCategoryDisableMediaUpload = (disabled: boolean) => {
    emit('category-disable-media-upload', disabled);
};
</script>

<style scoped>
.dynamic-form-section {
  /* Ensure consistent spacing */
}
</style>
