<template>
  <UFormField
    :label="label"
    :required="required"
    :error="error"
  >
    <div class="flex items-stretch gap-2">
      <AppSelectMenu
        id="field_facility"
        name="field_facility"
        data-field="field_facility"
        class="flex-1 min-w-0"
        :model-value="selectedOption"
        :items="items"
        :disabled="disabled"
        size="lg"
        :placeholder="placeholder"
        :search-placeholder="searchPlaceholder"
        searchable
        :option-attribute="'label'"
        :value-attribute="'value'"
        :by="'value'"
        :aria-required="required ? 'true' : undefined"
        :aria-describedby="selectedFacilityAddressDisplay ? addressDescId : undefined"
        @update:model-value="selectedOption = $event"
      >
        <template #empty>
          <div class="p-2 text-sm text-(--ui-text-muted)">
            {{ t('form.facility_no_match') }}
          </div>
        </template>
      </AppSelectMenu>

      <UButton
        v-if="showLocateButton"
        data-testid="facility-locate-button"
        icon="i-heroicons-map-pin"
        :loading="isLocating"
        :disabled="disabled"
        color="neutral"
        variant="subtle"
        size="lg"
        :aria-label="isLocating ? t('form.facility_locating') : t('form.facility_use_my_location')"
        :title="isLocating ? t('form.facility_locating') : t('form.facility_use_my_location')"
        @click="emit('locate-me')"
      />
    </div>

    <div
      v-if="selectedFacilityAddressDisplay || selectedFacilityIcon || selectedFacilityDescription || selectedFacilityUrl"
      :id="addressDescId"
      class="mt-2 text-sm text-(--ui-text-muted) space-y-1"
    >
      <p
        v-if="selectedFacilityAddressDisplay"
        class="flex items-center gap-2"
      >
        <UIcon
          v-if="selectedFacilityIcon"
          :name="selectedFacilityIcon"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        <span>{{ selectedFacilityAddressDisplay }}</span>
      </p>
      <p
        v-if="selectedFacilityDescription"
        class="facility-select__description"
      >
        {{ selectedFacilityDescription }}
      </p>
      <a
        v-if="selectedFacilityUrl"
        :href="selectedFacilityUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 text-(--ui-primary) hover:underline"
      >
        <UIcon
          name="i-lucide-external-link"
          class="size-3.5"
          aria-hidden="true"
        />
        <span>{{ selectedFacilityUrlLabel }}</span>
        <span class="sr-only">{{ t('form.facility_opens_in_new_tab') }}</span>
      </a>
    </div>
  </UFormField>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import type { FacilityConfigItem } from '~~/types/clientConfig';
import { formatFacilityAddress } from '~/utils/facilityAddress';
import { toUIconName } from '~/utils/iconUtils';

const { t, locale } = useI18n();

const props = defineProps<{
    modelValue: string
    items: Array<{ label: string, value: string }>
    facilities: FacilityConfigItem[]
    label: string
    placeholder: string
    searchPlaceholder: string
    required?: boolean
    disabled?: boolean
    error?: string
    showLocateButton?: boolean
    isLocating?: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'locate-me': []
}>();

const addressDescId = `facility-address-${useId()}`;

const selectedFacility = computed(() =>
    props.facilities.find(item => item.id === props.modelValue) || null
);

const selectedFacilityAddressDisplay = computed(() =>
    formatFacilityAddress(selectedFacility.value?.address, locale.value)
);

const selectedFacilityIcon = computed(() => {
    const raw = selectedFacility.value?.icon;
    return raw ? toUIconName(raw) : '';
});

const selectedFacilityDescription = computed(() => selectedFacility.value?.description || '');

/**
 * Validated outbound URL for the selected facility.
 *
 * Drops anything that isn't `http(s)` so a stale/hand-edited config can't
 * mount a `javascript:` link from the citizen-facing dropdown.
 */
const selectedFacilityUrl = computed(() => {
    const raw = selectedFacility.value?.url;
    if (!raw) return '';
    try {
        const parsed = new URL(raw);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
            return parsed.toString();
        }
    } catch {
        // Invalid URL — fall through to empty string.
    }
    return '';
});

const selectedFacilityUrlLabel = computed(() => {
    if (!selectedFacilityUrl.value) return '';
    try {
        return new URL(selectedFacilityUrl.value).hostname.replace(/^www\./, '');
    } catch {
        return selectedFacilityUrl.value;
    }
});

const selectedOption = computed({
    get: () => props.items.find(item => item.value === props.modelValue) || null,
    set: (value: { label: string, value: string } | null) => {
        emit('update:modelValue', value?.value || '');
    }
});
</script>
