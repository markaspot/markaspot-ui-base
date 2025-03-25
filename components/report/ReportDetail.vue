<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { invertColor } from '@/utils/colorUtils'

const { t, locale } = useI18n()
const runtimeConfig = useRuntimeConfig();

const isVotingEnabled = computed(() => runtimeConfig.public.clientConfig.features?.voting)

const geoReportApiBase = runtimeConfig.public.geoReportApiBase;
const props = defineProps<{
  report: Report
  mapInstance?: maplibregl.Map
}>()

const emit = defineEmits<{
  close: []
  subscribe: []
  'follow-changed': [reportId: string, isFollowing: boolean]
}>()

const shouldRenderMap = ref(false)
const show = ref(false)
const isUpdatingFollow = ref(false)
const selectedImage = ref<string | null>(null)
const showGallery = ref(false)
const galleryIndex = ref(0)

const mapMarker = computed(() => {
  const lat = Number(props.report.lat)
  const long = Number(props.report.long)

  if (isNaN(lat) || isNaN(long)) {
    console.warn('Invalid coordinates in report:', props.report)
    return null
  }

  return {
    lat,
    long
  }
})

const { toggleFollow, isFollowing } = useFollows()

const following = computed(() => isFollowing(props.report.service_request_id))
const followButtonText = computed(() => {
  if (isUpdatingFollow.value) return t('detail.follow.updating')
  return following.value ? t('detail.follow.following') : t('detail.follow.button')
})

const iconColor = computed(() => invertColor(props.report.status_hex, true));
const currentStatus = computed(() => ({
  status_descriptive_name: props.report.extended_attributes.markaspot.status_descriptive_name,
  status_hex: props.report.extended_attributes.markaspot.status_hex
}))


const categoryIcon = computed(() => {
  return props.report.category_icon || props.report.extended_attributes?.markaspot?.category_icon || undefined;
});

const categoryHex = computed(() => {
  return props.report.category_hex || props.report.extended_attributes?.markaspot?.category_hex || '#cccccc';
});

const sortedStatusNotes = computed(() => {
  return [...(props.report.extended_attributes.markaspot.status_notes || [])].sort(
    (a, b) => new Date(b.updated_datetime).getTime() - new Date(a.updated_datetime).getTime()
  )
})
const mediaUrls = computed(() => {
  if (!props.report.media_url) {
    return [];
  }

  
  
  return props.report.media_url.split(',').map(url => url.trim());
});





const openGallery = (url: string) => {
  
  const index = mediaUrls.value.findIndex(item => item === url);
  if (index !== -1) {
    galleryIndex.value = index;
    selectedImage.value = url;
    showGallery.value = true;
  }
}

const closeGallery = () => {
  showGallery.value = false;
}

const nextImage = () => {
  if (mediaUrls.value.length <= 1) return;
  galleryIndex.value = (galleryIndex.value + 1) % mediaUrls.value.length;
  selectedImage.value = mediaUrls.value[galleryIndex.value];
}

const prevImage = () => {
  if (mediaUrls.value.length <= 1) return;
  galleryIndex.value = (galleryIndex.value - 1 + mediaUrls.value.length) % mediaUrls.value.length;
  selectedImage.value = mediaUrls.value[galleryIndex.value];
}

const handleFollowToggle = async () => {
  isUpdatingFollow.value = true
  try {
    const isNowFollowing = toggleFollow(props.report)
    emit('follow-changed', props.report.service_request_id, isNowFollowing)
  } catch (error) {
    console.error('Error toggling follow:', error)
  } finally {
    isUpdatingFollow.value = false
  }
}

const formatDate = (datetime: string) => {
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(datetime))
}


const handleMapTransition = (zoom: number, padding = { top: 0, bottom: 0, left: 0, right: 0 }) => {
  if (!props.mapInstance || !mapMarker.value) return

  props.mapInstance.flyTo({
    center: [mapMarker.value.long, mapMarker.value.lat],
    zoom,
    duration: 1000,
    padding
  })
}


const handleKeydown = (event: KeyboardEvent) => {
  if (!showGallery.value) return;
  
  if (event.key === 'Escape') {
    closeGallery();
  } else if (event.key === 'ArrowRight') {
    nextImage();
  } else if (event.key === 'ArrowLeft') {
    prevImage();
  }
}

onMounted(() => {
  setTimeout(() => {
    show.value = true
    if (mapMarker.value) {
      shouldRenderMap.value = true
      handleMapTransition(16, { top: 50, bottom: 50, left: 50, right: 50 })
    }
  }, 50)
  
  
  window.addEventListener('keydown', handleKeydown);
})

onBeforeUnmount(() => {
  shouldRenderMap.value = false

  if (props.mapInstance?.loaded()) {
    handleMapTransition(13)
    setTimeout(() => props.mapInstance?.resize(), 100)
  }
  
  
  window.removeEventListener('keydown', handleKeydown);
})
</script>

<template>
  <div
    class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
    @click="$emit('close')"
    v-show="show"
    :class="{'opacity-0': !show}"
  >
    <div
      class="bg-white dark:bg-gray-800 w-full sm:w-[480px] sm:rounded-2xl max-h-[90vh] flex flex-col"
      :class="[show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0']"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center transform hover:scale-105 transition-transform"
              :style="{ backgroundColor: categoryHex }"
            >
              <!-- Use computed properties for cleaner code -->
              <DynamicIcon
                v-if="categoryIcon"
                :icon-name="categoryIcon"
                class-name="w-5 h-5"
                :color="invertColor(categoryHex, true)"
              />
              <UIcon
                v-else
                name="i-heroicons-document-text"
                class="w-5 h-5"
                :class="invertColor(categoryHex, true) === '#ffffff' ? 'text-white' : 'text-black'"
              />
            </div>
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-gray-200">
                {{ report.service_request_id }} {{ report.service_name }}
              </h2>
              <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-200">
                <div
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: currentStatus?.status_hex }"
                />
                <span>{{ currentStatus?.status_descriptive_name }}</span>
              </div>
            </div>
          </div>
          <button
            @click="$emit('close')"
            :aria-label="t('common.close')"
            class="text-gray-400 hover:text-gray-600 dark:text-gray-100 transform hover:rotate-90 transition-transform"
          >
            <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="divide-y divide-gray-100">
          <!-- Map and Photos Grid -->
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Map Section -->
              <div class="space-y-1">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-100 mb-2">
                  {{ t('detail.location') }}
                </div>
                <div class="relative h-48 rounded-xl overflow-hidden mb-2 hover:shadow-lg transition-shadow">
                  <div class="absolute inset-0 bg-gray-100">
                    <ClientOnly>
                      <div ref="mapContainer" class="absolute inset-0">
                        <Map
                          v-if="shouldRenderMap && mapMarker"
                          :markers="[mapMarker]"
                          :center-lat="Number(report.lat)"
                          :center-lng="Number(report.long)"
                          :is-detail-map="true"
                          class="w-full h-full"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                          {{ t('detail.location_unavailable') }}
                        </div>
                      </div>
                    </ClientOnly>
                  </div>
                </div>
                <div class="flex items-center gap-2 space-y-5 text-gray-900 dark:text-gray-200">
                  <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400" />
                  <span>{{ report.address_string }}</span>
                </div>
              </div>

              <!-- Photos Section -->
              <div v-if="mediaUrls.length" class="space-y-1">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-100 mb-2">
                  {{ t('detail.photos') }}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    v-for="(url, index) in mediaUrls"
                    :key="index"
                    class="group relative aspect-square rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    @click="openGallery(url)"
                  >
                    <img
                      :src="url"
                      :alt="report.service_name"
                      class="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Description -->
          <div class="p-6 space-y-3">
            <div class="text-sm font-medium text-gray-500 dark:text-gray-100">
              {{ t('detail.description') }}
            </div>
            <p class="text-gray-700 dark:text-gray-400">{{ report.description }}</p>
          </div>

          <!-- Status Timeline -->
          <div class="p-6 space-y-3">
            <div class="text-sm font-medium text-gray-500 dark:text-gray-100">
              {{ t('detail.status_history') }}
            </div>
            <div class="status-log space-y-4">
              <div v-if="sortedStatusNotes.length === 0" class="text-gray-500 text-sm">
                {{ t('detail.no_updates') }}
              </div>
              <div v-else v-for="(status, index) in sortedStatusNotes"
                  :key="status.updated_datetime"
                  class="flex items-start gap-3">
                <div class="relative">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center"
                      :style="{ backgroundColor: status.status_hex }">
                    <DynamicIcon
                      :icon-name="status.status_icon"
                      class-name="w-3 h-3"
                      :color="invertColor(status.status_hex, true)"
                    />
                  </div>
                  <!-- Changed condition to show line for all except first entry -->
                  <div v-if="index > 0"
                      class="absolute w-0.5 bg-gray-200 dark:bg-gray-600 h-full top-0 left-3 -translate-y-6"></div>
                </div>
                <div class="flex-1 pb-6">
                  <div class="text-sm font-medium">{{ status.status_descriptive_name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(status.updated_datetime) }}</div>
                  <div v-if="status.status_note"
                      class="mt-1 text-xs text-gray-500 dark:text-gray-400 prose prose-sm max-w-none"
                      v-html="status.status_note"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-6 border-t flex gap-3 justify-end flex-shrink-0">
        <VoteButton v-if="isVotingEnabled" :report-id="report.service_request_id" />
        <div class="flex gap-3">
          <UButton
            variant="outline"
            @click="$emit('close')"
            class="hover:scale-105 transition-transform"
          >
            {{ t('common.close') }}
          </UButton>

          <UButton
            :color="following ? 'gray' : 'primary'"
            @click="handleFollowToggle"
            :disabled="isUpdatingFollow"
            class="hover:scale-105 transition-transform"
          >
            <template #leading>
              <UIcon
                v-if="isUpdatingFollow"
                name="i-heroicons-arrow-path"
                class="w-4 h-4 animate-spin"
              />
              <UIcon
                v-else
                :name="following ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                class="w-4 h-4"
              />
            </template>
            {{ followButtonText }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Lightbox Gallery -->
    <div 
      v-if="showGallery && selectedImage" 
      class="fixed inset-0 z-60 bg-black/90 flex items-center justify-center"
      @click="closeGallery"
    >
      <div class="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-10">
        <!-- Close button -->
        <button 
          @click="closeGallery" 
          class="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          aria-label="Close gallery"
        >
          <UIcon name="i-heroicons-x-mark" class="w-8 h-8" />
        </button>
        
        <!-- Image counter -->
        <div class="absolute top-4 left-4 text-white text-sm">
          {{ galleryIndex + 1 }} / {{ mediaUrls.length }}
        </div>
        
        <!-- Previous button -->
        <button 
          v-if="mediaUrls.length > 1"
          @click.stop="prevImage" 
          class="absolute left-4 text-white hover:text-gray-300 transform transition-transform hover:scale-110"
          aria-label="Previous image"
        >
          <UIcon name="i-heroicons-chevron-left" class="w-10 h-10" />
        </button>
        
        <!-- Image container -->
        <div class="relative max-w-full max-h-full overflow-hidden">
          <img 
            :src="selectedImage" 
            :alt="report.service_name" 
            class="max-w-full max-h-[85vh] object-contain"
            @click.stop
          >
        </div>
        
        <!-- Next button -->
        <button 
          v-if="mediaUrls.length > 1"
          @click.stop="nextImage" 
          class="absolute right-4 text-white hover:text-gray-300 transform transition-transform hover:scale-110"
          aria-label="Next image"
        >
          <UIcon name="i-heroicons-chevron-right" class="w-10 h-10" />
        </button>
      </div>
    </div>
  </div>
</template>