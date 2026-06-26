<script setup lang="ts">
import type { Report } from '~~/types';
import { useI18n } from 'vue-i18n';
import { useResponsive } from '@/composables/core/useResponsive';
import { useReportFocus } from '@/composables/core/useReportFocus';
import { invertColor, NEUTRAL_FALLBACKS } from '@/utils/colorUtils';
import ImageFallback from '@/components/shared/ImageFallback.vue';

const { t } = useI18n();
const { formatDateTimeLong } = useFormatters();
const { shouldUseDesktopModal } = useResponsive();
// Use dynamic config from API for per-jurisdiction feature flags
const { clientConfig } = useMarkASpotConfig();
const { organisationsEnabled } = useFeatureFlags();


const props = defineProps<{
    report: Report
    mapInstance?: maplibregl.Map
}>();

// Always use modal mode - panel modes removed for consistency

const emit = defineEmits<{
    'close': []
    'subscribe': []
    'follow-changed': [reportId: string, isFollowing: boolean]
}>();

const modalTrigger = ref<HTMLElement>();
const isModalOpen = ref(false);
const isSheetOpen = ref(false);

const isUpdatingFollow = ref(false);
const selectedImage = ref<string | null>(null);
const showGallery = ref(false);
const suppressModalClose = ref(false);
const galleryIndex = ref(0);
const isClosing = ref(false);

const { toggleFollow, isFollowing } = useFollows();
const { restoreFocus } = useReportFocus();

const following = computed(() => isFollowing(props.report.service_request_id));
const followButtonText = computed(() => {
    if (isUpdatingFollow.value) return t('detail.follow.updating');
    return following.value ? t('detail.follow.following') : t('detail.follow.button');
});


const iconColor = computed(() => invertColor(props.report.status_hex, true));
const currentStatus = computed(() => ({
    status_descriptive_name: props.report.extended_attributes?.markaspot?.status_descriptive_name || props.report.status_descriptive_name,
    status_hex: props.report.extended_attributes?.markaspot?.status_hex || props.report.status_hex
}));

// Helper computed props for accessing category data correctly
const categoryIcon = computed(() => {
    return props.report.category_icon || props.report.extended_attributes?.markaspot?.category_icon || undefined;
});

const categoryHex = computed(() => {
    return props.report.category_hex || props.report.extended_attributes?.markaspot?.category_hex || NEUTRAL_FALLBACKS.SOFT;
});

const sortedStatusNotes = computed(() => {
    return [...(props.report.extended_attributes?.markaspot?.status_notes || [])].sort(
        (a, b) => new Date(b.updated_datetime).getTime() - new Date(a.updated_datetime).getTime()
    );
});

// Enhanced address formatting
const formattedAddress = computed(() => {
    const addressString = props.report.address_string;
    if (!addressString) return null;

    // Try to parse the address string for better formatting
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

// Determine gallery columns from form/media settings
const maxMediaFiles = computed(() => clientConfig.value?.features?.media?.maxFiles || 4);
// Use columns = min(maxFiles, number of images) for a tighter layout
const gridTemplateColumnsStyle = computed(() => {
    const cols = Math.max(1, Math.min(maxMediaFiles.value, mediaUrls.value.length));
    return { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
});

const mediaAltTexts = computed(() => {
    const altTexts = props.report.extended_attributes?.markaspot?.media_alt_text || [];
    const fallbackText = 'Im Bild dokumentierte Situation analog der Beschreibung';

    // Ensure we have alt text for each media URL
    return mediaUrls.value.map((_, index) => {
        return altTexts[index] || fallbackText;
    });
});

const getAltTextForUrl = (url: string): string => {
    const index = mediaUrls.value.findIndex(item => item === url);
    return mediaAltTexts.value[index] || 'Im Bild dokumentierte Situation analog der Beschreibung';
};

const openGallery = (url: string, event?: Event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    const index = mediaUrls.value.findIndex(item => item === url);
    if (index !== -1) {
        galleryIndex.value = index;
        selectedImage.value = url;
        // Defer opening to avoid outside-click race with modal
        setTimeout(() => {
            showGallery.value = true;
        }, 0);
    }
};

const onThumbPointerDown = (event: Event) => {
    // Prevent modal from interpreting this as an outside click during lightbox open
    event.stopPropagation?.();
    event.preventDefault?.();
    suppressModalClose.value = true;
    setTimeout(() => {
        suppressModalClose.value = false;
    }, 300);
};

const closeGallery = () => {
    console.log('[ReportDetail] closeGallery');
    showGallery.value = false;
};

const nextImage = () => {
    if (mediaUrls.value.length <= 1) return;
    galleryIndex.value = (galleryIndex.value + 1) % mediaUrls.value.length;
    selectedImage.value = mediaUrls.value[galleryIndex.value];
};

const prevImage = () => {
    if (mediaUrls.value.length <= 1) return;
    galleryIndex.value = (galleryIndex.value - 1 + mediaUrls.value.length) % mediaUrls.value.length;
    selectedImage.value = mediaUrls.value[galleryIndex.value];
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

const formatDate = formatDateTimeLong;

const openModal = () => {
    if (shouldUseDesktopModal()) {
        // Desktop: Use modal
        isModalOpen.value = true;
    } else {
        // Mobile: Use full-screen covering sheet
        isSheetOpen.value = true;
    }
};

const hasOpenedOnce = ref(false);
const handleModalOpen = () => {
    console.log('[ReportDetail] UModal @open');
    hasOpenedOnce.value = true;
    // Modal opened - any initialization logic can go here
    if (import.meta.client) {
        setTimeout(() => {
            const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')) as HTMLElement[];
            const dialog = dialogs[dialogs.length - 1];
            if (dialog) dialog.setAttribute('aria-modal', 'true');
        }, 0);
    }
};

const closeModal = () => {
    console.log('[ReportDetail] closeModal called');
    // Trigger modal close, but delay parent unmount until transition ends
    isModalOpen.value = false;
    setTimeout(() => {
        console.log('[ReportDetail] emitting close to parent');
        emit('close');
        // Restore focus to the list item after parent updates
        nextTick(() => {
            setTimeout(() => {
                restoreFocus();
            }, 100);
        });
    }, 220);
};

// Ensure overlay/Escape closures route through the same delayed close
const handleUpdateOpen = (val: boolean) => {
    console.log('[ReportDetail] UModal @update:open', { val, hasOpenedOnce: hasOpenedOnce.value, showGallery: showGallery.value, suppressModalClose: suppressModalClose.value });
    // Ignore initial false before the modal has actually opened
    if (!hasOpenedOnce.value) return;
    // While lightbox is opening/visible, never close the modal
    if (showGallery.value || suppressModalClose.value) return;
    if (val === false && !isClosing.value) {
        isClosing.value = true;
        closeModal();
        setTimeout(() => {
            isClosing.value = false;
        }, 300);
    }
};

const closeSheet = () => {
    isSheetOpen.value = false;
    emit('close');
    // Restore focus to the list item after a short delay
    nextTick(() => {
        setTimeout(() => {
            restoreFocus();
        }, 100);
    });
};

// Handle keyboard navigation for gallery
const handleKeydown = (event: KeyboardEvent) => {
    // Gallery navigation only - UModal handles modal Escape key
    if (!showGallery.value) return;

    if (event.key === 'ArrowRight') {
        nextImage();
    } else if (event.key === 'ArrowLeft') {
        prevImage();
    } else if (event.key === 'Escape') {
        closeGallery();
    }
};

// Expose openModal method for parent components
defineExpose({
    openModal
});

// Watch for prop changes to handle modal state properly
watch(() => props.report, (newReport, oldReport) => {
    if (newReport && newReport.service_request_id !== oldReport?.service_request_id) {
        // Different report selected - ensure modal is properly opened
        if (shouldUseDesktopModal()) {
            isModalOpen.value = true;
        } else {
            isSheetOpen.value = true;
        }
    }
}, { immediate: false });

onMounted(() => {
    console.log('[ReportDetail] mounted');
    // Open as soon as DOM is ready to reduce race window
    nextTick(() => openModal());

    window.addEventListener('keydown', handleKeydown);
    watch(showGallery, () => {});
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <!-- Desktop Modal -->
  <UModal
    v-if="shouldUseDesktopModal()"
    v-model:open="isModalOpen"
    :title="`${report.service_request_id} ${report.service_name}`"
    :description="$t('detail.dialog_description') || 'Report details dialog'"
    :close="true"
    :prevent-close="showGallery || suppressModalClose"
    aria-modal="true"
    :ui="{
      // Ensure modal content is above the overlay
      content: 'z-[500]',
      overlay: 'z-[400] fixed inset-0 bg-neutral-900/30 transition-opacity',
    }"
    @open="handleModalOpen"
    @update:open="handleUpdateOpen"
    @close="closeModal"
  >
    <template #description>
      <p class="sr-only">
        {{ $t('detail.dialog_description') || 'Report details dialog' }}
      </p>
    </template>
    <!-- Trigger element - hidden since this modal opens programmatically -->
    <slot>
      <button
        ref="modalTrigger"
        type="button"
        style="display: none;"
        @click="openModal"
      >
        Open Report Details
      </button>
    </slot>

    <!-- Modal content -->
    <template #body>
      <div class="space-y-4">
        <!-- Photos or Fallback -->
        <div>
          <div class="text-sm font-medium text-neutral-500 dark:text-neutral-100 mb-2">
            {{ t('detail.photos') }}
          </div>
          <div v-if="mediaUrls.length > 1">
            <!-- Column layout based on max upload setting -->
            <div
              class="grid gap-2"
              :style="gridTemplateColumnsStyle"
            >
              <button
                v-for="(url, idx) in mediaUrls"
                :key="url"
                type="button"
                class="relative aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary-500"
                :aria-label="`${t('detail.photos')} ${idx + 1} / ${mediaUrls.length}`"
                @mousedown.stop="onThumbPointerDown"
                @click.stop="openGallery(url, $event)"
              >
                <img
                  :src="url"
                  :alt="getAltTextForUrl(url)"
                  class="w-full h-full object-cover transition-transform group-hover:scale-105"
                >
                <div class="absolute inset-0 ring-1 ring-inset ring-white/10 group-hover:ring-white/20" />
              </button>
            </div>
          </div>
          <div v-else-if="mediaUrls.length === 1">
            <div
              class="relative h-48 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              @mousedown.stop="onThumbPointerDown"
              @click.stop="openGallery(mediaUrls[0], $event)"
            >
              <img
                :src="mediaUrls[0]"
                :alt="getAltTextForUrl(mediaUrls[0])"
                class="w-full h-full object-cover transition-transform hover:scale-105"
              >
            </div>
          </div>
          <ImageFallback v-else />
        </div>

        <!-- Address -->
        <div class="bg-[var(--ui-bg-accented)]/50 rounded-lg p-4 border border-[var(--ui-border)]">
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
                    size="xs"
                    :color="invertColor(status.status_hex, true)"
                  />
                </div>
                <div
                  v-if="index > 0"
                  class="absolute w-0.5 bg-neutral-200 dark:bg-neutral-600 h-full top-0 left-3 -translate-y-6"
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
    </template>

    <!-- Footer -->
    <template #footer>
      <div class="flex items-center justify-between">
        <ReportActions :report="report" />
        <div class="flex items-center gap-3">
          <UButton
            variant="outline"
            @click="closeModal"
          >
            {{ t('common.close') }}
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
  </UModal>

  <!-- Lightbox Gallery -->
  <Teleport to="body">
    <div
      v-if="showGallery && selectedImage"
      class="fixed inset-0 bg-black/90 flex items-center justify-center"
      :style="{ zIndex: 99999 }"
      @click.self="closeGallery"
    >
      <div class="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-10">
        <button
          class="absolute top-4 right-4 text-white hover:text-neutral-300 z-10"
          aria-label="Close gallery"
          @click="closeGallery"
        >
          <UIcon
            name="i-heroicons-x-mark"
            class="w-8 h-8"
          />
        </button>

        <div class="absolute top-4 left-4 text-white text-sm">
          {{ galleryIndex + 1 }} / {{ mediaUrls.length }}
        </div>

        <button
          v-if="mediaUrls.length > 1"
          class="absolute left-4 text-white hover:text-neutral-300 transform transition-transform hover:scale-110"
          aria-label="Previous image"
          @click.stop="prevImage"
        >
          <UIcon
            name="i-heroicons-chevron-left"
            class="w-10 h-10"
          />
        </button>

        <div class="relative max-w-full max-h-full overflow-hidden">
          <img
            :src="selectedImage"
            :alt="getAltTextForUrl(selectedImage)"
            class="max-w-full max-h-[85vh] object-contain"
            @click.stop
          >
        </div>

        <button
          v-if="mediaUrls.length > 1"
          class="absolute right-4 text-white hover:text-neutral-300 transform transition-transform hover:scale-110"
          aria-label="Next image"
          @click.stop="nextImage"
        >
          <UIcon
            name="i-heroicons-chevron-right"
            class="w-10 h-10"
          />
        </button>
      </div>
    </div>
  </Teleport>

  <!-- Mobile Full-Screen Sheet -->
  <ReportDetailSheet
    v-if="!shouldUseDesktopModal()"
    v-model="isSheetOpen"
    :report="report"
    @close="closeSheet"
    @follow-changed="(reportId: string, isFollowing: boolean) => $emit('follow-changed', reportId, isFollowing)"
  />
</template>
