<script setup lang="ts">
import { getContrastingTextColor } from '@/utils/colorUtils';

/**
 * ReportPrintSheet
 *
 * Shared print component used by the citizen detail modal AND the dashboard
 * request pages. Renders an A4-optimised service request report (header,
 * map + photos, description, attributes, status timeline, internal fields).
 *
 * The template is Teleported to <body> so it escapes any parent modal /
 * flex / overflow constraints at print time. Hidden on screen via CSS
 * (display: none) — in print every direct child of <body> is hidden
 * except the element carrying `data-print-sheet`, so the sheet flows
 * naturally at document level even when a UModal sits as a body sibling.
 *
 * Prop types are intentionally loose to accept both the citizen `Report`
 * (aka `Request`) shape and the dashboard `DashboardRequest` shape. Both
 * share the fields actually read here: service_request_id, created /
 * requested_datetime, description, location, media / media_url,
 * extended_attributes, status*, category.
 */

// Shape actually consumed by this component. Both `Report` and
// `DashboardRequest` satisfy this structural type at the call sites.
interface PrintableRequest {
    service_request_id: string
    created?: string
    requested_datetime?: string
    description: string
    status?: string
    statusLabel?: string
    statusColor?: string
    category?: {
        id?: string
        name?: string
        color?: string
        icon?: string
    }
    location?: {
        lat: number | string
        lon?: number | string
        lng?: number | string
        address?: string
    } | null
    media?: Array<{
        uuid?: string
        url?: string
        fallbackUrl?: string
        alt?: string
    }>
    media_url?: string | string[]
    organisation?: { label?: string }
    organisations?: Array<{ label?: string }>
    extended_attributes?: Record<string, any>
}

interface PrintableManagementField {
    key: string
    label: string
    value: string
}

const props = withDefaults(defineProps<{
    request: PrintableRequest
    mapImageUrl: string | null
    qrCodeUrl: string
    resolvedAttributes?: Array<{ label: string, value: string }>
    managementFields?: PrintableManagementField[]
    /**
     * Whether to render staff-only sections (internal fields).
     * Citizens pass `false` (default); dashboard passes `isModerator || isAdmin`.
     */
    showInternalFields?: boolean
}>(), {
    resolvedAttributes: () => [],
    managementFields: () => [],
    showInternalFields: false
});

// Typed accessors for loosely-typed extended_attributes.
const extMarkaspot = computed(() =>
    props.request.extended_attributes?.markaspot as Record<string, any> | undefined);
const extDrupal = computed(() =>
    props.request.extended_attributes?.drupal as Record<string, any> | undefined);

const { t } = useI18n();
const { formatDateTimeLong, formatDateTime } = useFormatters();
const { logoLight } = useClientAssets();
const { clientConfig } = useMarkASpotConfig();

const clientName = computed(() => clientConfig.value?.client?.name || '');

// `created` used by dashboard, `requested_datetime` by citizen Open311 payload.
const createdAt = computed(() =>
    props.request.created || props.request.requested_datetime || ''
);

const formatDate = (dateString: string) => {
    return formatDateTimeLong(dateString);
};

const formatDateShort = (dateString: string) => {
    return formatDateTime(dateString);
};

// Fresh timestamp each time the print component receives a new QR code
const printTimestamp = computed(() => {
    if (!props.qrCodeUrl) return '';
    return formatDateTime(new Date());
});

const sortedStatusNotes = computed(() => {
    const notes = extMarkaspot.value?.status_notes || [];
    return [...notes].sort(
        (a: any, b: any) => new Date(b.updated_datetime).getTime() - new Date(a.updated_datetime).getTime()
    );
});

const mediaBasename = (url?: string): string => {
    if (!url) return '';
    const cleanUrl = url.split('?')[0]?.split('#')[0] || '';
    return cleanUrl.split('/').filter(Boolean).pop() || '';
};

type PrintableMediaItem = {
    uuid?: string
    url?: string
    fallbackUrl?: string
    alt?: string
};

const mediaAltTexts = computed(() =>
    props.request.extended_attributes?.markaspot?.media_alt_text as string[] | undefined ?? []
);

const safePrintMediaUrl = (value?: string): string | undefined => {
    const url = value?.trim();
    if (!url) return undefined;
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    if (/^(?:\.\.?\/)?api\/images\//.test(url)) return url;
    if (typeof window === 'undefined') return undefined;

    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.origin === window.location.origin ? parsed.href : undefined;
    } catch {
        return undefined;
    }
};

const normalizeMediaUrlList = (value?: string | string[]): PrintableMediaItem[] => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values
        .flatMap(item => item.split(','))
        .map(item => item.trim())
        .filter(Boolean)
        .map((url, index) => ({
            url: safePrintMediaUrl(url),
            alt: mediaAltTexts.value[index] || `${t('print.media')} ${index + 1}`
        }));
};

const media = computed(() => {
    const entityMedia = props.request?.media ?? [];
    const open311Media = normalizeMediaUrlList(props.request?.media_url);
    if (entityMedia.length > 0) {
        const merged = entityMedia.map((item, index) => {
            const fallback = open311Media[index];
            const itemUrl = safePrintMediaUrl(item.url);
            const itemFallbackUrl = safePrintMediaUrl(item.fallbackUrl);
            const primaryUrl = itemUrl || fallback?.url;
            return {
                ...item,
                url: primaryUrl,
                fallbackUrl: itemUrl && fallback?.url && fallback.url !== itemUrl ? fallback.url : itemFallbackUrl,
                alt: item.alt || fallback?.alt || `${t('print.media')} ${index + 1}`
            };
        });
        if (open311Media.length > entityMedia.length) {
            merged.push(...open311Media.slice(entityMedia.length));
        }
        return merged;
    }
    return open311Media;
});
const failedMapImage = ref(false);
const failedMediaUrls = ref(new Set<string>());

watch(() => props.mapImageUrl, () => {
    failedMapImage.value = false;
});

watch(media, () => {
    failedMediaUrls.value = new Set();
});

const visibleMapImageUrl = computed(() =>
    failedMapImage.value ? null : props.mapImageUrl
);

const visibleMedia = computed(() => media.value);

const hasPhotos = computed(() => visibleMedia.value.length > 0);
const visiblePhotoCount = computed(() => visibleMedia.value.length);

const markMediaImageFailed = (url: string) => {
    failedMediaUrls.value = new Set([...failedMediaUrls.value, url]);
};

const mediaImageUrl = (item: PrintableMediaItem): string | null => {
    if (item.url && !failedMediaUrls.value.has(item.url)) {
        return item.url;
    }
    if (item.fallbackUrl && !failedMediaUrls.value.has(item.fallbackUrl)) {
        return item.fallbackUrl;
    }
    return null;
};

const mediaLabel = (item: { alt?: string, url?: string }, index: number): string =>
    item.alt || mediaBasename(item.url) || `${t('print.media')} ${index + 1}`;

const mediaAlt = (item: PrintableMediaItem, index: number): string =>
    item.alt || `${t('print.media')} ${index + 1}`;

// Static OSM tile fallback needs attribution (canvas captures don't)
const isStaticTile = computed(() => props.mapImageUrl?.startsWith('https://tile.openstreetmap.org') ?? false);

const pageUrl = computed(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
});

const { organisationsEnabled } = useFeatureFlags();

// Internal fields from extended_attributes.drupal
const organisation = computed(() => {
    if (!organisationsEnabled.value) return undefined;
    if (props.request?.organisations?.length) {
        return props.request.organisations.map(o => o.label).filter(Boolean).join(', ');
    }
    return props.request?.organisation?.label;
});
const hazardLevel = computed(() =>
    extDrupal.value?.field_hazard_level?.[0]?.value
);
const sentiment = computed(() =>
    extDrupal.value?.field_ai_sentiment?.[0]?.value
);
const hazardCategory = computed(() =>
    extDrupal.value?.field_ai_hazard_category?.[0]?.value
);

// Coordinates accessor handles both lon (dashboard) and lng (citizen) keys.
const coordLon = computed(() => {
    const loc = props.request.location;
    if (!loc) return undefined;
    return loc.lon ?? loc.lng;
});
</script>

<template>
  <Teleport to="body">
    <div
      class="report-print-sheet"
      data-print-sheet
      aria-hidden="true"
    >
      <div class="print-page">
        <!-- Header -->
        <header class="print-header">
          <div class="print-header-left">
            <img
              v-if="logoLight"
              :src="logoLight"
              :alt="clientName"
              class="print-logo"
            >
            <div>
              <div class="print-client-name">
                {{ clientName }}
              </div>
              <div class="print-subtitle">
                {{ t('print.title') }}
              </div>
            </div>
          </div>
          <div class="print-header-right">
            <div class="print-request-id">
              {{ request.service_request_id }}
            </div>
            <div class="print-header-date">
              {{ formatDateShort(createdAt) }}
            </div>
          </div>
        </header>

        <!-- Badges -->
        <div class="print-badges">
          <span
            class="print-badge"
            :style="{
              backgroundColor: request.category?.color || '#6b7280',
              color: request.category?.color ? getContrastingTextColor(request.category.color) : '#fff',
            }"
          >
            {{ request.category?.name || 'N/A' }}
          </span>
          <span
            class="print-badge"
            :style="{
              backgroundColor: request.statusColor || '#3b82f6',
              color: request.statusColor ? getContrastingTextColor(request.statusColor) : '#fff',
            }"
          >
            {{ request.statusLabel || request.status }}
          </span>
          <span
            v-if="hazardLevel && showInternalFields"
            class="print-badge print-badge-outline"
          >
            {{ t('print.hazard_level') }}: {{ hazardLevel }}
          </span>
        </div>

        <!-- Visual Zone: Map + Photos -->
        <div class="print-visual-zone">
          <!-- Map -->
          <div :class="hasPhotos ? 'print-map-with-photos' : 'print-map-full'">
            <img
              v-if="visibleMapImageUrl"
              :src="visibleMapImageUrl"
              alt="Map"
              class="print-map-image"
              @error="failedMapImage = true"
            >
            <div
              v-else
              class="print-map-placeholder"
            >
              {{ t('print.location') }}
            </div>
            <div
              v-if="request.location"
              class="print-address-bar"
            >
              <span v-if="request.location.address">{{ request.location.address }}</span>
              <span class="print-address-right">
                <code class="print-coords">
                  {{ Number(request.location.lat).toFixed(6) }},
                  {{ coordLon !== undefined ? Number(coordLon).toFixed(6) : '' }}
                </code>
                <span
                  v-if="isStaticTile"
                  class="print-attribution"
                >&copy; OpenStreetMap</span>
              </span>
            </div>
          </div>

          <!-- Photos -->
          <div
            v-if="hasPhotos"
            class="print-photos"
          >
            <div :class="visiblePhotoCount === 1 ? 'print-photo-single' : 'print-photo-grid'">
              <div
                v-for="(item, index) in visibleMedia"
                :key="item.uuid || item.url || item.fallbackUrl || index"
                class="print-photo-frame"
              >
                <img
                  v-if="mediaImageUrl(item)"
                  :src="mediaImageUrl(item)!"
                  :alt="mediaAlt(item, index)"
                  class="print-photo"
                  @error="markMediaImageFailed(mediaImageUrl(item)!)"
                >
                <div
                  v-else
                  class="print-photo-missing"
                >
                  <span class="print-photo-missing-title">{{ t('print.image_unavailable') }}</span>
                  <span class="print-photo-missing-url">{{ mediaLabel(item, index) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <section class="print-section print-description">
          <h2 class="print-section-heading">
            {{ t('print.description') }}
          </h2>
          <p class="print-body-text">
            {{ request.description }}
          </p>
        </section>

        <!-- Service Attributes -->
        <section
          v-if="resolvedAttributes?.length"
          class="print-section"
        >
          <h2 class="print-section-heading">
            {{ t('print.attributes') }}
            <span class="print-count">({{ resolvedAttributes.length }})</span>
          </h2>
          <dl class="print-attributes-grid">
            <template
              v-for="attr in resolvedAttributes"
              :key="attr.label"
            >
              <dt>{{ attr.label }}</dt>
              <dd>{{ attr.value }}</dd>
            </template>
          </dl>
        </section>

        <!-- Status Timeline -->
        <section
          v-if="sortedStatusNotes.length > 0"
          class="print-section"
        >
          <h2 class="print-section-heading">
            {{ t('print.status_history') }}
            <span class="print-count">({{ sortedStatusNotes.length }})</span>
          </h2>
          <div class="print-timeline">
            <div
              v-for="status in sortedStatusNotes"
              :key="status.updated_datetime"
              class="print-timeline-entry"
            >
              <span
                class="print-timeline-dot"
                :style="{ backgroundColor: status.status_hex }"
              />
              <div class="print-timeline-content">
                <span class="print-timeline-status">{{ status.status_descriptive_name }}</span>
                <span class="print-timeline-date">{{ formatDate(status.updated_datetime) }}</span>
                <span
                  v-if="status.status_note"
                  class="print-timeline-note"
                  v-html="sanitizeHtml(status.status_note)"
                />
                <dl
                  v-if="showInternalFields && status.resolved_status_attributes?.length"
                  class="print-timeline-attributes"
                >
                  <template
                    v-for="attr in status.resolved_status_attributes"
                    :key="attr.code || attr.label"
                  >
                    <dt>{{ attr.label }}</dt>
                    <dd>{{ attr.value }}</dd>
                  </template>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <!-- Internal Fields (Manager only) -->
        <section
          v-if="showInternalFields && (organisation || hazardLevel || sentiment || hazardCategory || managementFields.length)"
          class="print-section print-internal"
        >
          <h2 class="print-section-heading">
            {{ t('print.internal_fields') }}
          </h2>
          <dl
            v-if="organisation || hazardLevel || sentiment || hazardCategory"
            class="print-metadata-grid"
          >
            <template v-if="organisation">
              <dt>{{ t('print.organisation') }}</dt>
              <dd>{{ organisation }}</dd>
            </template>
            <template v-if="hazardLevel">
              <dt>{{ t('print.hazard_level') }}</dt>
              <dd>{{ hazardLevel }}</dd>
            </template>
            <template v-if="sentiment">
              <dt>{{ t('print.sentiment') }}</dt>
              <dd>{{ sentiment }}</dd>
            </template>
            <template v-if="hazardCategory">
              <dt>{{ t('print.hazard_category') }}</dt>
              <dd>{{ hazardCategory }}</dd>
            </template>
          </dl>
          <dl
            v-if="managementFields.length"
            class="print-management-grid"
          >
            <div
              v-for="field in managementFields"
              :key="field.key"
              class="print-management-row"
            >
              <dt>{{ field.label }}</dt>
              <dd>{{ field.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- Footer: uses position:fixed to appear at the bottom of every printed page.
             Chrome/Edge: repeats on every page. Firefox/Safari: first page only (acceptable). -->
        <footer class="print-footer">
          <div class="print-footer-left">
            <div class="print-footer-line">
              {{ t('print.printed_at') }}: {{ printTimestamp }}
            </div>
            <div class="print-footer-line print-footer-url">
              {{ pageUrl }}
            </div>
          </div>
          <div
            v-if="qrCodeUrl"
            class="print-qr"
          >
            <img
              :src="qrCodeUrl"
              alt="QR Code"
              class="print-qr-image"
            >
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<!--
  UNSCOPED print rules: @page + global visibility guarantees.
  @page is a CSS at-rule that cannot be scoped to a component; the #__nuxt
  hide has to apply globally so the teleported sheet is the only thing
  rendered in print.
-->
<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm 18mm;
  }

  /* Hide every direct child of <body> in print except the print sheet.
     This covers both the Nuxt app root (#__nuxt) AND any teleported overlay
     like UModal, which opens as its own body sibling. Without this, the
     citizen detail modal would print on top of the sheet. */
  body > *:not([data-print-sheet]) {
    display: none !important;
  }

  /* Force light color scheme for the entire page in print */
  html {
    color-scheme: light !important;
  }

  html.dark,
  html.dark body {
    background: white !important;
    color: #111 !important;
  }
}
</style>

<style scoped>
/* ─── Hidden on screen, visible in print ─── */
.report-print-sheet {
  display: none;
}

@media print {
  .report-print-sheet {
    display: block;
    background: white;
    color: #111;
    color-scheme: light;
  }

  .print-page {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    color: #111;
    font-size: 10pt;
    line-height: 1.4;
    background: white;
    /* Clearance for the fixed-position footer (footer height + border + padding) */
    padding-bottom: 80pt;
    position: relative;
    width: 100%;
    min-height: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ─── Header ─── */
  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 8pt;
    border-bottom: 1.5pt solid #222;
    margin-bottom: 10pt;
  }

  .print-header-left {
    display: flex;
    align-items: center;
    gap: 10pt;
  }

  .print-logo {
    height: 28pt;
    width: auto;
    object-fit: contain;
  }

  .print-client-name {
    font-size: 12pt;
    font-weight: 700;
  }

  .print-subtitle {
    font-size: 8pt;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
  }

  .print-header-right {
    text-align: right;
  }

  .print-request-id {
    font-size: 14pt;
    font-weight: 700;
    font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  }

  .print-header-date {
    font-size: 8pt;
    color: #555;
    margin-top: 2pt;
  }

  /* ─── Badges ─── */
  .print-badges {
    display: flex;
    gap: 6pt;
    margin-bottom: 10pt;
    flex-wrap: wrap;
  }

  .print-badge {
    display: inline-block;
    padding: 2pt 8pt;
    border-radius: 3pt;
    font-size: 8pt;
    font-weight: 600;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-badge-outline {
    background: transparent !important;
    color: #333 !important;
    border: 0.75pt solid #555;
  }

  /* ─── Visual Zone ─── */
  .print-visual-zone {
    display: block;
    margin-bottom: 10pt;
    break-inside: auto;
  }

  .print-map-with-photos {
    width: 100%;
  }

  .print-map-full {
    width: 100%;
  }

  .print-map-image {
    width: 100%;
    height: auto;
    max-height: 180pt;
    object-fit: cover;
    border: 0.5pt solid #ccc;
    border-radius: 3pt;
  }

  .print-map-placeholder {
    height: 120pt;
    background: #f3f4f6;
    border: 0.5pt solid #ccc;
    border-radius: 3pt;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 9pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-address-bar {
    margin-top: 4pt;
    font-size: 8pt;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8pt;
  }

  .print-address-right {
    display: flex;
    align-items: baseline;
    gap: 6pt;
    flex-shrink: 0;
  }

  .print-coords {
    font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
    font-size: 7pt;
    color: #777;
    white-space: nowrap;
    /* Reset any inherited background from dark mode <code> styling */
    background: none;
  }

  .print-attribution {
    font-size: 6pt;
    color: #999;
    white-space: nowrap;
  }

  /* ─── Photos ─── */
  .print-photos {
    margin-top: 8pt;
    min-width: 0;
  }

  .print-photo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4pt;
    max-height: none;
  }

  .print-photo-single {
    max-height: none;
  }

  .print-photo {
    width: 100%;
    height: 100%;
    max-height: 180pt;
    object-fit: cover;
    border-radius: 2pt;
    border: 0.5pt solid #ccc;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-photo-single .print-photo {
    aspect-ratio: 3 / 2;
    height: auto;
  }

  .print-photo-grid .print-photo {
    max-height: 120pt;
    height: auto;
  }

  .print-photo-frame {
    min-width: 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-photo-missing {
    min-height: 44pt;
    padding: 5pt;
    border: 0.75pt dashed #aaa;
    border-radius: 2pt;
    color: #555;
    background: #f8f8f8;
    font-size: 7pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-photo-missing-title {
    display: block;
    font-weight: 700;
  }

  .print-photo-missing-url {
    display: block;
    margin-top: 2pt;
    overflow-wrap: anywhere;
  }

  /* ─── Sections ─── */
  .print-section {
    margin-bottom: 10pt;
  }

  .print-section-heading {
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    color: #333;
    margin-bottom: 4pt;
    padding-bottom: 3pt;
    border-bottom: 0.5pt solid #ddd;
    break-after: avoid;
  }

  .print-count {
    font-weight: 400;
    color: #999;
  }

  .print-body-text {
    white-space: pre-wrap;
    line-height: 1.5;
  }

  /* ─── Attributes ─── */
  .print-attributes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2pt 16pt;
    font-size: 9pt;
  }

  .print-attributes-grid div,
  .print-timeline-entry {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-attributes-grid dt {
    font-size: 8pt;
    color: #777;
  }

  .print-attributes-grid dd {
    margin: 0 0 4pt;
    font-weight: 600;
  }

  /* ─── Timeline ─── */
  .print-timeline {
    padding-left: 4pt;
  }

  .print-timeline-entry {
    display: flex;
    align-items: flex-start;
    gap: 8pt;
    margin-bottom: 6pt;
    break-inside: avoid;
  }

  .print-timeline-dot {
    flex-shrink: 0;
    width: 8pt;
    height: 8pt;
    border-radius: 50%;
    margin-top: 3pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-timeline-content {
    display: flex;
    flex-wrap: wrap;
    gap: 2pt 8pt;
    align-items: baseline;
    min-width: 0;
  }

  .print-timeline-status {
    font-weight: 600;
    font-size: 9pt;
  }

  .print-timeline-date {
    font-size: 8pt;
    color: #777;
  }

  .print-timeline-note {
    flex-basis: 100%;
    font-size: 8pt;
    color: #555;
    margin-top: 1pt;
  }

  .print-timeline-attributes {
    flex-basis: 100%;
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 35%) minmax(0, 1fr);
    gap: 1pt 6pt;
    margin: 2pt 0 0;
    padding: 4pt 6pt;
    background: #f5f5f5;
    border-radius: 3pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-timeline-attributes dt {
    min-width: 0;
    font-size: 7pt;
    color: #555;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .print-timeline-attributes dd {
    min-width: 0;
    margin: 0;
    font-size: 8pt;
    color: #111;
    overflow-wrap: anywhere;
  }

  .print-timeline-truncated {
    font-size: 8pt;
    color: #999;
    font-style: italic;
    margin-top: 4pt;
  }

  /* ─── Internal ─── */
  .print-internal {
    border: 0.75pt dashed #aaa;
    padding: 6pt 8pt;
    border-radius: 3pt;
    background: #fafafa;
    break-inside: auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-metadata-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2pt 12pt;
    font-size: 9pt;
  }

  .print-metadata-grid dt {
    font-weight: 600;
    color: #555;
  }

  .print-metadata-grid dd {
    margin: 0;
  }

  .print-management-grid {
    margin: 6pt 0 0;
    font-size: 8pt;
  }

  .print-management-row {
    display: grid;
    grid-template-columns: minmax(0, 32%) minmax(0, 1fr);
    gap: 3pt 10pt;
    break-inside: auto;
  }

  .print-management-grid dt {
    min-width: 0;
    font-weight: 600;
    color: #555;
    overflow-wrap: anywhere;
  }

  .print-management-grid dd {
    min-width: 0;
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  /* ─── Footer ──────────────────────────────────────────────────────────
     position:fixed in print CSS places the element at the bottom of every
     page in Chrome/Edge (Blink). Firefox and Safari render it on the first
     page only, which is acceptable for a single-page dispatch sheet.
     ──────────────────────────────────────────────────────────────────── */
  .print-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 8pt;
    border-top: 0.5pt solid #ccc;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-footer-left {
    flex: 1;
  }

  .print-footer-line {
    font-size: 7pt;
    color: #999;
  }

  .print-footer-url {
    word-break: break-all;
    max-width: 80%;
  }

  .print-qr {
    flex-shrink: 0;
  }

  .print-qr-image {
    width: 56pt;
    height: 56pt;
  }

  /* ─── B/W Fallback ─── */
  @media (monochrome) {
    .print-badge {
      background: transparent !important;
      border: 0.75pt solid #333;
      color: #111 !important;
    }

    .print-timeline-dot {
      background: #444 !important;
    }

    .print-internal {
      background: transparent;
    }
  }
}
</style>
