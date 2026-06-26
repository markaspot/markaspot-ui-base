<template>
  <div
    v-if="attributes.length > 0"
    class="space-y-4"
  >
    <div
      v-for="attr in attributes"
      :key="attr.code"
      :data-attribute-code="attr.code"
    >
      <!-- imagelist: selectable image grid from media entities -->
      <UFormField
        v-if="attr.datatype === 'imagelist' && attr.media_type"
        :label="attr.description || attr.code"
        :required="attr.required"
        :error="getError(attr.code)"
      >
        <ImageListSelector
          :media-type="attr.media_type"
          :media-group="attr.media_group"
          :model-value="String(modelValue[attr.code] || '')"
          :aria-label="attr.description || attr.code"
          @update:model-value="updateValue(attr.code, $event)"
        />
      </UFormField>

      <!-- singlevaluelist: radio group for <= 5 options -->
      <div
        v-else-if="attr.datatype === 'singlevaluelist' && attr.values?.length && attr.values.length <= 5"
        class="space-y-1"
      >
        <URadioGroup
          :model-value="modelValue[attr.code] || ''"
          :items="getItems(attr)"
          :legend="attr.description || attr.code"
          :required="attr.required"
          :aria-describedby="getError(attr.code) ? attributeErrorId(attr.code) : undefined"
          value-key="value"
          label-key="label"
          :orientation="(attr.values?.length ?? 0) <= 3 ? 'horizontal' : 'vertical'"
          @update:model-value="updateValue(attr.code, $event)"
        />
        <p
          v-if="getError(attr.code)"
          :id="attributeErrorId(attr.code)"
          class="text-sm text-error-600 dark:text-error-400"
          role="alert"
        >
          {{ getError(attr.code) }}
        </p>
      </div>

      <!-- singlevaluelist: dropdown for > 5 options -->
      <UFormField
        v-else-if="attr.datatype === 'singlevaluelist' && attr.values?.length"
        :label="attr.description || attr.code"
        :required="attr.required"
        :error="getError(attr.code)"
      >
        <USelectMenu
          :model-value="modelValue[attr.code] || ''"
          :items="getItems(attr)"
          value-key="value"
          label-key="label"
          :placeholder="attr.description || attr.code"
          class="w-full max-w-md"
          @update:model-value="updateValue(attr.code, $event)"
        />
      </UFormField>

      <!-- multivaluelist -->
      <div
        v-else-if="attr.datatype === 'multivaluelist' && attr.values?.length"
        class="space-y-1"
      >
        <UCheckboxGroup
          :model-value="toArray(modelValue[attr.code])"
          :items="getItems(attr)"
          :legend="attr.description || attr.code"
          :required="attr.required"
          :aria-describedby="getError(attr.code) ? attributeErrorId(attr.code) : undefined"
          value-key="value"
          label-key="label"
          @update:model-value="updateValue(attr.code, $event)"
        />
        <p
          v-if="getError(attr.code)"
          :id="attributeErrorId(attr.code)"
          class="text-sm text-error-600 dark:text-error-400"
          role="alert"
        >
          {{ getError(attr.code) }}
        </p>
      </div>

      <!-- text (multiline) -->
      <UFormField
        v-else-if="attr.datatype === 'text'"
        :label="attr.description || attr.code"
        :required="attr.required"
        :error="getError(attr.code)"
      >
        <UTextarea
          :model-value="modelValue[attr.code] || ''"
          :placeholder="attr.description"
          :rows="3"
          class="w-full max-w-md"
          @update:model-value="updateValue(attr.code, $event)"
        />
      </UFormField>

      <!-- number -->
      <UFormField
        v-else-if="attr.datatype === 'number'"
        :label="attr.description || attr.code"
        :required="attr.required"
        :error="getError(attr.code)"
      >
        <UInputNumber
          :model-value="toNumber(modelValue[attr.code])"
          :placeholder="attr.description"
          :min="attr.validation?.min"
          :max="attr.validation?.max"
          class="w-full max-w-md"
          @update:model-value="updateValue(attr.code, $event)"
        />
      </UFormField>

      <!-- datetime -->
      <UFormField
        v-else-if="attr.datatype === 'datetime'"
        :label="attr.description || attr.code"
        :required="attr.required"
        :error="getError(attr.code)"
      >
        <UInputDate
          :model-value="toCalendarDateTime(modelValue[attr.code])"
          granularity="minute"
          class="w-full max-w-md"
          @update:model-value="handleDateTimeUpdate(attr.code, $event)"
        />
      </UFormField>

      <!-- string (default) -->
      <UFormField
        v-else
        :label="attr.description || attr.code"
        :required="attr.required"
        :error="getError(attr.code)"
      >
        <UInput
          :model-value="modelValue[attr.code] || ''"
          type="text"
          :placeholder="attr.description"
          :maxlength="attr.validation?.max ?? 255"
          :pattern="attr.validation?.pattern"
          :title="attr.validation?.pattern_message"
          class="w-full max-w-md"
          @update:model-value="updateValue(attr.code, $event)"
        />
      </UFormField>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ServiceAttributes - Renders Open311 service definition attributes as form fields.
 *
 * Uses native Nuxt UI 4 components:
 * - URadioGroup / UCheckboxGroup with legend (no UFormField wrapper)
 * - UFormField only for inputs that lack their own label mechanism
 */

import { type CalendarDateTime, parseDateTime } from '@internationalized/date';
import type { ServiceDefinitionAttribute } from '~~/types/category';

const props = defineProps<{
    attributes: ServiceDefinitionAttribute[]
    modelValue: Record<string, any>
    errors?: Record<string, string>
}>();

const emit = defineEmits<{
    'update:modelValue': [value: Record<string, any>]
}>();

const getError = (code: string): string | undefined => {
    if (props.errors?.[code]) return props.errors[code];

    // JS-level pattern validation (native pattern attr only fires on native form submit)
    const attr = props.attributes.find(a => a.code === code);
    const val = props.modelValue[code];
    if (attr?.validation?.pattern && val) {
        try {
            if (!new RegExp(attr.validation.pattern).test(String(val))) {
                return attr.validation.pattern_message || `Invalid format`;
            }
        } catch { /* invalid regex in definition, skip */ }
    }
};

const attributeErrorId = (code: string): string =>
    `service-attribute-error-${code.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

const updateValue = (code: string, value: any) => {
    emit('update:modelValue', { ...props.modelValue, [code]: value });
};

// Shared item mapper for RadioGroup, CheckboxGroup, and SelectMenu
const getItems = (attr: ServiceDefinitionAttribute) => {
    return (attr.values || []).map(v => ({ label: v.name, value: v.key }));
};

// Ensure multivaluelist model is always an array
const toArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (val) return [val];
    return [];
};

// Number helper
const toNumber = (val: any): number | undefined => {
    if (val === '' || val === undefined || val === null) return undefined;
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
};

// DateTime helpers
const toCalendarDateTime = (val: any): CalendarDateTime | undefined => {
    if (!val || typeof val !== 'string') return undefined;
    try {
        return parseDateTime(val);
    } catch {
        return undefined;
    }
};

const handleDateTimeUpdate = (code: string, value: CalendarDateTime | null) => {
    updateValue(code, value?.toString() ?? '');
};
</script>
