<template>
  <TooltipContainer
    :visible="visible"
    :x="x"
    :y="y"
    aria-label="Add report tooltip"
    @close="$emit('close')"
  >
    <AddressDisplay
      :address="address"
      :address-obj="addressObj"
      :is-loading="isLoading"
      :retry-count="retryCount"
      :lat="lat"
      :lng="lng"
      :show-coordinates="true"
      :center-align="true"
    />

    <TooltipErrorMessage :message="msg" />

    <TooltipActions
      :show-confirm-location="showConfirmLocation"
      :photo-enabled="photoEnabled"
      :is-valid="isValid"
      :is-loading="isLoading"
      @add="$emit('add', $event)"
      @confirm-location="$emit('confirm-location')"
    />
  </TooltipContainer>
</template>

<script setup lang="ts">
/**
 * MapTooltip Component
 *
 * Interactive map component with MapLibre GL integration and user controls.
 */

const props = defineProps<{
    visible: boolean
    x: number
    y: number
    address?: string
    addressObj?: any
    msg?: string
    isValid: boolean
    photoEnabled: boolean
    isLoading?: boolean
    retryCount?: number
    showConfirmLocation?: boolean
    lat?: number
    lng?: number
}>();

// Declare the events to avoid extraneous listener warnings
const emit = defineEmits<{
    'add': [type: 'photo' | 'classic']
    'close': []
    'confirm-location': []
}>();
</script>
