<template>
  <div class="mt-3 flex flex-col gap-1.5">
    <!-- Show Confirm Location Button when in pick mode -->
    <div v-if="showConfirmLocation">
      <TooltipButton
        type="confirm"
        :icon="'i-heroicons-check'"
        :label="t('map.confirm_location')"
        :disabled="!isValid || isLoading"
        @click="$emit('confirm-location')"
      />
    </div>

    <!-- Show Add Report Buttons when not in pick mode -->
    <div
      v-else
      class="space-y-2"
    >
      <TooltipButton
        v-if="photoEnabled && showPhotoButton"
        type="photo"
        :icon="'i-heroicons-camera'"
        :label="photoLabel"
        :disabled="!isValid || isLoading"
        color="blue"
        @click="$emit('add', 'photo')"
      />

      <TooltipButton
        v-if="showClassicButton"
        type="classic"
        :icon="'i-heroicons-document-text'"
        :label="classicLabel"
        :disabled="!isValid || isLoading"
        color="purple"
        @click="$emit('add', 'classic')"
      />

      <!-- Context hint: form above (mobile) or modal (desktop) -->
      <p class="text-xs text-center text-[var(--ui-text-muted)] mt-1">
        {{ isFormFirstActive ? t('map.tooltip.opens_form_above') : t('map.tooltip.opens_modal') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
    showConfirmLocation?: boolean
    photoEnabled: boolean
    isValid: boolean
    isLoading?: boolean
}

defineProps<Props>();

const { t } = useI18n();

// Embed config: button visibility + custom labels
const embedConfig = inject<Ref<{ photoButton?: boolean, classicButton?: boolean, photoLabel?: string, classicLabel?: string }> | null>('embedConfig', null);

// Client config label overrides (from Drupal field_nuxt_config)
const { clientConfig } = useMarkASpotConfig();
const actionButtonsConfig = computed(() =>
    clientConfig.value.features?.actionButtons || {}
);

const photoLabel = computed(() =>
    embedConfig?.value?.photoLabel || actionButtonsConfig.value.photo?.label || t('report.buttons.photo')
);

const classicLabel = computed(() =>
    embedConfig?.value?.classicLabel || actionButtonsConfig.value.classic?.label || t('report.buttons.classic')
);

const showPhotoButton = computed(() => embedConfig?.value?.photoButton !== false);
const showClassicButton = computed(() =>
    embedConfig?.value?.classicButton !== false && clientConfig.value.features?.classicReporting !== false
);

// Get form-first mode state to show appropriate hint
const { isFormFirstActive } = useFormFirstMode();

defineEmits<{
    'add': [type: 'photo' | 'classic']
    'confirm-location': []
}>();
</script>
