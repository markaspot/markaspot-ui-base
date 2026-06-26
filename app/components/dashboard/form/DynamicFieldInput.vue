<script setup lang="ts">
/**
 * DynamicFieldInput - Renders a single form input based on a Drupal form-mode
 * field config (`field_type`, `widget`, `settings`).
 *
 * Lives in the OSS layer so both `DynamicFieldGroup` (OSS) and
 * `DashboardEditForm` (pro layer) can auto-import it.
 *
 * Branch order:
 *   1. email                       -> UInput type="email"
 *   2. telephone                   -> UInput type="tel"
 *   3. text_long / text_with_summary -> UTextarea
 *   4. boolean | widget=boolean_checkbox -> USwitch (uses on_label / off_label
 *      from Drupal field settings; coerces stringy "false" to real boolean)
 *   5. list_string / list_integer  -> USelectMenu (handles both array and
 *      keyed-object `allowed_values`)
 *   6. entity_reference + selectItems -> USelectMenu with passed-in items
 *   7. fallback                    -> UInput
 *
 * @example
 *   <DynamicFieldInput
 *     :field-name="fieldName"
 *     :field-config="fieldConfig"
 *     v-model="formState[fieldName]"
 *   />
 */
import { humanizeFieldName } from '~/utils/humanizeFieldName';

interface AllowedValueObject {
    value: string | number
    label: string
}

interface FieldConfig {
    field_type: string
    widget?: string
    label?: string
    description?: string
    required?: boolean
    settings?: {
        on_label?: string
        off_label?: string
        allowed_values?: Record<string, string> | AllowedValueObject[]
        [key: string]: unknown
    }
}

interface SelectItem {
    value: string | number
    label: string
}

interface Props {
    fieldName: string
    fieldConfig: FieldConfig
    modelValue: unknown
    /**
     * Items for entity_reference selects (used when no allowed_values).
     * MUST be `SelectItem[]` (`{value, label}` shape). Passing arbitrary
     * objects breaks the USelectMenu render. Callers that historically
     * forwarded `Record<string, unknown>` need to map first.
     */
    selectItems?: SelectItem[]
    /** Loading flag passed to entity_reference select menus. */
    selectLoading?: boolean
    /** Optional placeholder override; falls back to fieldConfig.description. */
    placeholder?: string
    /** Optional rows override for textarea branches. Default 3. */
    rows?: number
    /** Optional class string forwarded to the underlying input. */
    inputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    selectItems: () => [],
    selectLoading: false,
    placeholder: undefined,
    rows: 3,
    inputClass: 'w-full'
});

const emit = defineEmits<{
    'update:modelValue': [value: unknown]
}>();

const isBoolean = computed(() =>
    props.fieldConfig.field_type === 'boolean' ||
    props.fieldConfig.widget === 'boolean_checkbox'
);

const isTextarea = computed(() =>
    props.fieldConfig.field_type === 'text_long' ||
    props.fieldConfig.field_type === 'text_with_summary'
);

const isListField = computed(() =>
    props.fieldConfig.field_type === 'list_string' ||
    props.fieldConfig.field_type === 'list_integer'
);

const isEntityReferenceWithItems = computed(() =>
    props.fieldConfig.field_type === 'entity_reference' &&
    Array.isArray(props.selectItems) &&
    props.selectItems.length > 0
);

// Coerce model value for text-style inputs only. Boolean branches must keep
// real booleans intact (don't fall back to '' which would render as empty
// string and lose unchecked state).
const textValue = computed<string>(() => {
    const v = props.modelValue;
    if (v === null || v === undefined) return '';
    return String(v);
});

// Opt-in boolean coercion: only explicit truthy tokens count.
// Anything unknown (`"FALSE"`, `"null"`, whitespace, `"foo"`) collapses to
// false. JSON:API and Drupal serialize booleans inconsistently across field
// plugins; defaulting to false avoids systemic false-positive "on" states.
const TRUTHY_STRING_TOKENS = new Set(['true', '1']);

const booleanValue = computed<boolean>(() => {
    const v = props.modelValue;
    if (typeof v === 'string') {
        return TRUTHY_STRING_TOKENS.has(v.trim().toLowerCase());
    }
    if (typeof v === 'number') return v === 1;
    return !!v;
});

const { t, te } = useI18n();

// Accessible name for USwitch when no surrounding UFormField label exists.
// In the dashboard the wrapping UFormField provides the visible label, so
// the switch itself stays unlabeled visually. The aria-label here is the
// last-resort screen-reader fallback so the control is never nameless.
const switchAriaLabel = computed<string>(() => {
    if (props.fieldConfig.label && props.fieldConfig.label.trim().length > 0) {
        return props.fieldConfig.label;
    }
    const humanized = humanizeFieldName(props.fieldName);
    if (humanized.trim().length > 0) return humanized;
    return te('common.toggle') ? t('common.toggle') : 'Toggle';
});

const listItems = computed<SelectItem[]>(() => {
    const allowed = props.fieldConfig.settings?.allowed_values;
    if (!allowed) return [];
    const coerceValue = (value: string | number) =>
        props.fieldConfig.field_type === 'list_integer' ? Number(value) : value;

    if (Array.isArray(allowed)) {
        return allowed.map(v => ({ value: coerceValue(v.value), label: v.label }));
    }
    return Object.entries(allowed).map(([value, label]) => ({
        value: coerceValue(value),
        label: String(label)
    }));
});

const resolvedPlaceholder = computed<string | undefined>(() =>
    props.placeholder ?? props.fieldConfig.description
);

const onTextUpdate = (value: string | undefined) => {
    emit('update:modelValue', value ?? '');
};

const onBooleanUpdate = (value: boolean | unknown) => {
    emit('update:modelValue', !!value);
};

const onSelectUpdate = (value: unknown) => {
    emit('update:modelValue', value);
};
</script>

<template>
  <UInput
    v-if="fieldConfig.field_type === 'email'"
    :model-value="textValue"
    type="email"
    :placeholder="resolvedPlaceholder"
    :class="inputClass"
    @update:model-value="onTextUpdate"
  />
  <UInput
    v-else-if="fieldConfig.field_type === 'telephone'"
    :model-value="textValue"
    type="tel"
    :placeholder="resolvedPlaceholder"
    :class="inputClass"
    @update:model-value="onTextUpdate"
  />
  <UTextarea
    v-else-if="isTextarea"
    :model-value="textValue"
    :rows="rows"
    :placeholder="resolvedPlaceholder"
    :class="inputClass"
    @update:model-value="onTextUpdate"
  />
  <div
    v-else-if="isBoolean"
    class="flex items-center gap-2 min-h-[44px]"
  >
    <USwitch
      :model-value="booleanValue"
      :aria-label="switchAriaLabel"
      @update:model-value="onBooleanUpdate"
    />
    <span
      aria-hidden="true"
      data-testid="boolean-state-text"
      class="text-sm cursor-pointer select-none"
      :class="booleanValue ? 'text-default' : 'text-muted'"
      @click="onBooleanUpdate(!booleanValue)"
    >
      {{ booleanValue ? t('common.on') : t('common.off') }}
    </span>
  </div>
  <USelectMenu
    v-else-if="isListField"
    :model-value="modelValue"
    :items="listItems"
    value-key="value"
    label-key="label"
    :placeholder="resolvedPlaceholder"
    :class="inputClass"
    @update:model-value="onSelectUpdate"
  />
  <USelectMenu
    v-else-if="isEntityReferenceWithItems"
    :model-value="modelValue"
    :items="selectItems"
    value-key="value"
    label-key="label"
    :loading="selectLoading"
    :placeholder="resolvedPlaceholder"
    :class="inputClass"
    @update:model-value="onSelectUpdate"
  />
  <UInput
    v-else
    :model-value="textValue"
    :placeholder="resolvedPlaceholder"
    :class="inputClass"
    @update:model-value="onTextUpdate"
  />
</template>
