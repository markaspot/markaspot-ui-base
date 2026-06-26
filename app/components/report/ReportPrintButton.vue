<script setup lang="ts">
/**
 * ReportPrintButton
 *
 * Triggers the shared print flow (static OSM tile → QR → print) for the
 * current citizen report detail modal. Renders the shared ReportPrintSheet
 * (Teleported to <body>) so it escapes the surrounding modal's position-fixed
 * / overflow constraints at print time.
 *
 * The citizen detail modal never exposes the MapLibre canvas, so the print
 * sheet always falls back to the OSM static tile. The dashboard entry points
 * do pass a live map element and may get a higher-fidelity capture.
 */
import type { Report } from '~~/types';
import { useI18n } from 'vue-i18n';
import ReportPrintSheet from '@/components/print/ReportPrintSheet.vue';

const props = defineProps<{
    report: Report
}>();

const { t } = useI18n();
const { mapImageUrl, qrCodeUrl, isPreparing, printRequest } = usePrintSheet();

// Citizen report prop exposes lat + long (number | string). Normalise into
// the composable's expected { lat, lon } shape. Fall back to `lng` alias.
const printLocation = computed(() => {
    const r = props.report;
    const lat = r.lat != null ? Number(r.lat) : NaN;
    const lonRaw = r.long ?? r.lng;
    const lon = lonRaw != null ? Number(lonRaw) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { lat, lon };
    }
    return null;
});

const handlePrint = async () => {
    if (!import.meta.client) return;
    await printRequest(null, printLocation.value);
};
</script>

<template>
  <UTooltip :text="t('report.buttons.print')">
    <UButton
      icon="i-heroicons-printer"
      variant="ghost"
      color="neutral"
      size="sm"
      :loading="isPreparing"
      :disabled="isPreparing"
      :aria-busy="isPreparing"
      :aria-label="`${t('report.buttons.print')}: ${props.report.service_name} #${props.report.service_request_id}`"
      @click="handlePrint"
    />
  </UTooltip>

  <!-- The print sheet needs to live in the Vue tree to be rendered; it
       Teleports itself to <body> at render time. Hidden here so screen
       layout is unaffected. -->
  <ClientOnly>
    <div
      aria-hidden="true"
      style="display: none"
    >
      <ReportPrintSheet
        :request="report"
        :map-image-url="mapImageUrl"
        :qr-code-url="qrCodeUrl"
      />
    </div>
  </ClientOnly>
</template>
