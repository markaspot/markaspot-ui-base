<template>
  <FullScreenModal
    v-model="isOpen"
    :title="`#${report.service_request_id} ${report.service_name}`"
    :close-button="{ color: 'gray', variant: 'ghost', size: 'sm' }"
    @close="handleClose"
  >
    <!-- Content -->
    <div class="p-4">
      <div class="space-y-4">
        <!-- Location with Mini Map (first) -->
        <div class="bg-[var(--ui-bg-accented)]/50 rounded-lg overflow-hidden border border-[var(--ui-border)]">
          <!-- Mini Map Preview -->
          <div class="h-32 w-full">
            <ClientOnly>
              <MiniMap
                :lat="Number(report.lat)"
                :lng="Number(report.long)"
                :zoom="15"
                :marker-color="currentStatus.status_hex || '#3b82f6'"
              />
              <template #fallback>
                <div class="h-full w-full bg-[var(--ui-bg-elevated)] animate-pulse" />
              </template>
            </ClientOnly>
          </div>

          <!-- Address Info -->
          <div class="p-4">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                  <UIcon
                    name="i-heroicons-map-pin"
                    class="w-4 h-4 text-primary-600 dark:text-primary-400"
                  />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div
                  v-if="formattedAddress?.hasStructuredData"
                  class="space-y-1"
                >
                  <div class="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-tight">
                    {{ formattedAddress.street }}
                  </div>
                  <div class="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-300">
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
                >
                  {{ formattedAddress?.fullAddress || report.address_string }}
                </div>
                <div class="flex items-center gap-1 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <UIcon
                    name="i-heroicons-globe-alt"
                    class="w-3 h-3 flex-shrink-0"
                  />
                  <span class="font-mono">{{ Number(report.lat).toFixed(6) }}, {{ Number(report.long).toFixed(6) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Photos (after map) -->
        <div v-if="mediaUrls.length">
          <div class="text-sm font-medium text-neutral-500 dark:text-neutral-100 mb-2">
            {{ t('detail.photos') }}
          </div>
          <div
            class="relative h-48 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          >
            <img
              :src="mediaUrls[0]"
              :alt="getAltTextForUrl(mediaUrls[0])"
              class="w-full h-full object-cover transition-transform hover:scale-105"
            >
            <div
              v-if="mediaUrls.length > 1"
              class="absolute top-3 right-3 rtl:right-auto rtl:left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full"
            >
              1 / {{ mediaUrls.length }}
            </div>
          </div>
        </div>

        <!-- Jurisdiction / Organisation metadata -->
        <div
          v-if="report.jurisdiction?.label || (organisationsEnabled && (report.organisations?.length || report.organisation?.label))"
          class="flex flex-wrap gap-3 text-sm text-neutral-600 dark:text-neutral-400"
        >
          <div
            v-if="report.jurisdiction?.label"
            class="flex items-center gap-1.5"
          >
            <UIcon
              name="i-heroicons-map"
              class="w-4 h-4"
            />
            <span v-if="report.jurisdiction.chain?.length && clientConfig?.responseVisibility?.jurisdictionDisplay === 'chain'">
              <template
                v-for="(jur, idx) in report.jurisdiction.chain"
                :key="jur.id"
              >
                <template v-if="idx > 0"> &rsaquo; </template>{{ jur.label }}
              </template>
            </span>
            <span v-else>{{ report.jurisdiction.label }}</span>
          </div>
          <div
            v-if="organisationsEnabled && (report.organisations?.length || report.organisation?.label)"
            class="flex items-center gap-1.5"
          >
            <UIcon
              name="i-heroicons-building-office-2"
              class="w-4 h-4"
            />
            <span>{{ report.organisations?.map(o => o.label).join(', ') || report.organisation?.label }}</span>
          </div>
        </div>

        <!-- Description -->
        <div>
          <div class="text-sm font-medium text-neutral-500 dark:text-neutral-100 mb-2">
            {{ t('detail.description') }}
          </div>
          <p class="text-neutral-700 dark:text-neutral-400">
            {{ report.description }}
          </p>
        </div>

        <!-- Status Timeline -->
        <div>
          <div class="text-sm font-medium text-neutral-500 dark:text-neutral-100 mb-2">
            {{ t('detail.status_history') }}
          </div>
          <div class="space-y-4">
            <div
              v-if="sortedStatusNotes.length === 0"
              class="text-neutral-500 text-sm"
            >
              {{ t('detail.no_updates') }}
            </div>
            <div
              v-for="(status, index) in sortedStatusNotes"
              v-else
              :key="status.updated_datetime"
              class="flex items-start gap-3"
            >
              <div class="relative">
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center"
                  :style="{ backgroundColor: status.status_hex }"
                >
                  <DynamicIcon
                    :icon-name="status.status_icon"
                    class-name="w-3 h-3"
                    :color="invertColor(status.status_hex, true)"
                  />
                </div>
                <div
                  v-if="index > 0"
                  class="absolute w-0.5 bg-neutral-200 dark:bg-neutral-600 h-full top-0 left-3 rtl:left-auto rtl:right-3 -translate-y-6"
                />
              </div>
              <div class="flex-1 pb-6">
                <div class="text-sm font-medium">
                  {{ status.status_descriptive_name }}
                </div>
                <div class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ formatDate(status.updated_datetime) }}
                </div>
                <div
                  v-if="status.status_note"
                  class="mt-1 text-xs text-neutral-500 dark:text-neutral-400 prose prose-sm max-w-none"
                  v-html="sanitizeHtml(status.status_note)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer with actions -->
    <template #footer>
      <div class="flex items-center justify-between">
        <ReportActions :report="report" />
        <div class="flex items-center gap-3">
          <!-- Open in parent page (embed context) -->
          <UButton
            v-if="externalUrl"
            color="neutral"
            variant="soft"
            icon="i-heroicons-arrow-top-right-on-square"
            @click="$emit('open-external', externalUrl)"
          >
            {{ t('common.details', 'Details') }}
          </UButton>
          <UButton
            :color="following ? 'neutral' : 'primary'"
            :variant="following ? 'soft' : 'solid'"
            :disabled="isUpdatingFollow"
            :aria-pressed="following"
            :aria-busy="isUpdatingFollow"
            @click="handleFollowToggle"
          >
            <template #leading>
              <AppSpinner
                v-if="isUpdatingFollow"
                size="sm"
                aria-hidden="true"
              />
              <UIcon
                v-else
                :name="following ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                class="w-4 h-4"
                aria-hidden="true"
              />
            </template>
            {{ followButtonText }}
          </UButton>
        </div>
      </div>
    </template>
  </FullScreenModal>
</template>

<script setup lang="ts">
import type { Report } from '~~/types';
import { useI18n } from 'vue-i18n';
import { useFollows } from '@/composables/features/useFollows';
import { invertColor, NEUTRAL_FALLBACKS } from '@/utils/colorUtils';
import FullScreenModal from '@/components/shared/FullScreenModal.vue';
import MiniMap from '@/components/map/MiniMap.vue';

const { t } = useI18n();
const { formatDateTimeLong } = useFormatters();
// Use dynamic config from API for per-jurisdiction feature flags
const { clientConfig } = useMarkASpotConfig();
const { organisationsEnabled } = useFeatureFlags();
const { toggleFollow, isFollowing } = useFollows();


const props = defineProps<{
    modelValue: boolean
    report: Report
    /** When set, shows an "Open Details" button that calls this handler (used in embed context) */
    externalUrl?: string
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'follow-changed': [reportId: string, isFollowing: boolean]
    'open-external': [url: string]
    'close': []
}>();

// State
const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
});

const isUpdatingFollow = ref(false);


// Report data computed properties
const categoryIcon = computed(() => {
    return props.report.category_icon || props.report.extended_attributes?.markaspot?.category_icon || undefined;
});

const categoryHex = computed(() => {
    return props.report.category_hex || props.report.extended_attributes?.markaspot?.category_hex || NEUTRAL_FALLBACKS.SOFT;
});

const currentStatus = computed(() => ({
    status_descriptive_name: props.report.extended_attributes?.markaspot?.status_descriptive_name || props.report.status_descriptive_name,
    status_hex: props.report.extended_attributes?.markaspot?.status_hex || props.report.status_hex
}));

const sortedStatusNotes = computed(() => {
    return [...(props.report.extended_attributes?.markaspot?.status_notes || [])].sort(
        (a, b) => new Date(b.updated_datetime).getTime() - new Date(a.updated_datetime).getTime()
    );
});

const formattedAddress = computed(() => {
    const addressString = props.report.address_string;
    if (!addressString) return null;

    const parts = addressString.split(',').map(part => part.trim());

    if (parts.length === 2) {
        const [locationPart, streetPart] = parts;
        const locationMatch = locationPart.match(/^(\d{5})\s+(.+)$/);

        if (locationMatch) {
            const [, postalCode, city] = locationMatch;
            return {
                street: streetPart,
                postalCode,
                city,
                fullAddress: addressString,
                hasStructuredData: true
            };
        }
    }

    return {
        fullAddress: addressString,
        hasStructuredData: false
    };
});

const mediaUrls = computed(() => {
    if (!props.report.media_url) {
        return [];
    }
    return props.report.media_url.split(',').map(url => url.trim());
});

const mediaAltTexts = computed(() => {
    const altTexts = props.report.extended_attributes?.markaspot?.media_alt_text || [];
    const fallbackText = 'Im Bild dokumentierte Situation analog der Beschreibung';

    return mediaUrls.value.map((_, index) => {
        return altTexts[index] || fallbackText;
    });
});

// Follow functionality
const following = computed(() => isFollowing(props.report.service_request_id));
const followButtonText = computed(() => {
    if (isUpdatingFollow.value) return t('detail.follow.updating');
    return following.value ? t('detail.follow.following') : t('detail.follow.button');
});

// Methods
const handleClose = () => {
    emit('close');
};

const handleFollowToggle = async () => {
    isUpdatingFollow.value = true;
    try {
        const isNowFollowing = toggleFollow(props.report);
        emit('follow-changed', props.report.service_request_id, isNowFollowing);
    } catch (error) {
        console.error('Error toggling follow:', error);
    } finally {
        isUpdatingFollow.value = false;
    }
};

const getAltTextForUrl = (url: string): string => {
    const index = mediaUrls.value.findIndex(item => item === url);
    return mediaAltTexts.value[index] || 'Im Bild dokumentierte Situation analog der Beschreibung';
};

const formatDate = formatDateTimeLong;

// Expose openSheet method for parent components
defineExpose({
    openSheet: () => {
        emit('update:modelValue', true);
    }
});
</script>
