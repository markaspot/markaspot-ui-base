<template>
  <component
    :is="fieldComponent"
    v-if="fieldComponent && shouldRender"
    :model-value="modelValue"
    v-bind="fieldProps"
    @validation="handleValidation"
    @update:model-value="handleUpdate"
    @update:media="handleUpdate"
    @pick-on-map="emit('pick-on-map')"
  />
</template>

<script setup lang="ts">
import { useDynamicFormFields } from '@/composables/form/useDynamicFormFields';

// Component imports - using defineAsyncComponent for better performance
const AutoResizeTextarea = defineAsyncComponent(() => import('@/components/form/AutoResizeTextarea.vue'));
const BodyField = defineAsyncComponent(() => import('@/components/form/BodyField.vue'));
const CategoryFieldWrapper = defineAsyncComponent(() => import('@/components/form/CategoryFieldWrapper.vue'));
const LocationInput = defineAsyncComponent(() => import('@/components/form/LocationInput.vue'));
const EmailField = defineAsyncComponent(() => import('@/components/form/EmailField.vue'));
const FirstNameField = defineAsyncComponent(() => import('@/components/form/FirstNameField.vue'));
const LastNameField = defineAsyncComponent(() => import('@/components/form/LastNameField.vue'));
const PhoneField = defineAsyncComponent(() => import('@/components/form/PhoneField.vue'));
const GdprField = defineAsyncComponent(() => import('@/components/form/GdprField.vue'));
const MediaUploadField = defineAsyncComponent(() => import('@/components/form/MediaUploadField.vue'));
const ObjectIdField = defineAsyncComponent(() => import('@/components/form/ObjectIdField.vue'));
const PartySelect = defineAsyncComponent(() => import('@/components/form/PartySelect.vue'));
const OktoberfestSelect = defineAsyncComponent(() => import('@/components/form/OktoberfestSelect.vue'));
const AddDataField = defineAsyncComponent(() => import('@/components/form/AddDataField.vue'));
const AIProcessingStatus = defineAsyncComponent(() => import('@/components/form/AIProcessingStatus.vue'));
const GenericConditionalField = defineAsyncComponent(() => import('@/components/form/GenericConditionalField.vue'));

interface Props {
    fieldName: string
    modelValue: any
    disabled?: boolean
    [key: string]: any // Allow additional props to be passed through
}

interface Emits {
    'update:modelValue': [value: any]
    'validation': [isValid: boolean]
    'pick-on-map': []
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { shouldRenderField, getFieldConfig, getFieldComponent } = useDynamicFormFields();

// Check if field should be rendered
const shouldRender = shouldRenderField(props.fieldName);

// Get field configuration from API
const fieldConfig = getFieldConfig(props.fieldName);

// Get the component name (with override support)
const fieldComponentName = computed(() => {
    // Check if field-specific props specify a custom component
    const customComponent = props.component;
    if (customComponent) {
        return customComponent;
    }

    // Use default component mapping
    return getFieldComponent(props.fieldName);
});

// Map component names to actual components
const componentMap = {
    AutoResizeTextarea,
    BodyField,
    CategoryFieldWrapper,
    LocationInput,
    EmailField,
    FirstNameField,
    LastNameField,
    PhoneField,
    GdprField,
    MediaUploadField,
    ObjectIdField,
    PartySelect,
    OktoberfestSelect,
    AddDataField,
    AIProcessingStatus,
    GenericConditionalField
};

// Get the actual component
const fieldComponent = computed(() => {
    const componentName = fieldComponentName.value;
    return componentName ? componentMap[componentName as keyof typeof componentMap] : null;
});

// Compute field props based on API configuration
const fieldProps = computed(() => {
    const config = fieldConfig.value;
    if (!config) return { disabled: props.disabled };

    const baseProps: Record<string, any> = {
        disabled: props.disabled,
        required: config.required,
        fieldName: props.fieldName
    };

    // Add label if available
    if (config.label) {
        baseProps.label = config.label;
    }

    // Add description/help text if available
    if (config.description) {
        baseProps.helpText = config.description;
    }

    // Add widget-specific settings
    if (config.widget_settings) {
        Object.assign(baseProps, config.widget_settings);
    }

    // Add any additional props passed from parent
    const additionalProps = { ...props };
    delete additionalProps.fieldName;
    delete additionalProps.modelValue;
    delete additionalProps.disabled;

    return { ...baseProps, ...additionalProps };
});

// Handle validation events
const handleValidation = (isValid: boolean) => {
    emit('validation', isValid);
};

// Handle model updates
const handleUpdate = (value: any) => {
    emit('update:modelValue', value);
};
</script>
