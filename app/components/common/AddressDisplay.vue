<template>
  <div>
    <div
      v-if="isLoading"
      class="flex items-center justify-center gap-2"
    >
      <AppSpinner
        size="sm"
        class="text-neutral-500"
      />
      <p class="text-sm text-[var(--ui-text-muted)]">
        {{ t('map.loading_address') }}
        <span v-if="retryCount && retryCount > 0">({{ t('map.retry_attempt', { count: retryCount }) }})</span>
      </p>
    </div>
    <div v-else>
      <!-- Address Layout exactly like in Detail Card -->
      <div
        v-if="formattedAddress.hasStructuredData"
        class="space-y-1"
        :class="centerAlign ? 'text-center' : ''"
      >
        <div class="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-tight">
          {{ formattedAddress.street }}
        </div>
        <div
          class="flex gap-1 text-sm text-neutral-600 dark:text-neutral-300"
          :class="centerAlign ? 'items-center justify-center' : 'items-center'"
        >
          <UIcon
            name="i-heroicons-building-office-2"
            class="w-3 h-3 flex-shrink-0"
          />
          <span class="whitespace-nowrap">
            <span class="font-medium">{{ formattedAddress.postalCode }}</span>
            {{ ' ' }}{{ formattedAddress.city }}
          </span>
        </div>
      </div>
      <div
        v-else
        class="font-medium text-neutral-900 dark:text-neutral-100 text-sm leading-snug"
        :class="centerAlign ? 'text-center' : ''"
      >
        {{ formattedAddress.fullAddress }}
      </div>

      <!-- Coordinates Display exactly like in Detail Card -->
      <div
        v-if="showCoordinates && lat !== undefined && lng !== undefined"
        class="flex gap-1 mt-2 text-xs text-neutral-500 dark:text-neutral-400"
        :class="centerAlign ? 'items-center justify-center' : 'items-center'"
      >
        <UIcon
          name="i-heroicons-globe-alt"
          class="w-3 h-3 flex-shrink-0"
        />
        <span class="font-mono">{{ lat.toFixed(6) }}, {{ lng.toFixed(6) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
    address?: string
    addressObj?: any
    isLoading?: boolean
    retryCount?: number
    lat?: number
    lng?: number
    showCoordinates?: boolean
    centerAlign?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showCoordinates: false,
    centerAlign: false
});

const { t } = useI18n();

// Format address exactly like in Detail Card
const formattedAddress = computed(() => {
    // Try to use structured data from addressObj first
    if (props.addressObj) {
        const hasStreet = props.addressObj.street;
        const hasCity = props.addressObj.city;
        const hasPostalCode = props.addressObj.postcode;

        if (hasStreet && (hasCity || hasPostalCode)) {
            return {
                hasStructuredData: true,
                street: props.addressObj.street + (props.addressObj.housenumber ? ' ' + props.addressObj.housenumber : ''),
                city: props.addressObj.city,
                postalCode: props.addressObj.postcode
            };
        }
    }

    // Fallback to simple address display if no structured data
    if (props.address) {
        return {
            hasStructuredData: false,
            fullAddress: props.address
        };
    }

    // Final fallback
    return {
        hasStructuredData: false,
        fullAddress: t('map.add_report_here')
    };
});
</script>
