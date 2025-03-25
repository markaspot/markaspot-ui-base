<script setup lang="ts">
import { useRequestsStore } from '~/stores/requests'
import type { BoundsType } from '~/types'




const api = useApiClient()
const requestsStore = useRequestsStore()
const router = useRouter()
const { locale, messages } = useI18n()


const emitter = useEmitter()


onMounted(() => {
  
  
  emitter.on('show-page', (page) => {
    
    
    
    
    selectedPage.value = page;
    
    
    
  })
})


onUnmounted(() => {
  
  emitter.off('show-page')
})


const props = defineProps<{
  initialRequestId?: string,
  initialFeedbackUuid?: string
}>()


const mainMapInstance = ref<maplibregl.Map | null>(null)
const selectedReport = ref<any>(null)
const showDialog = ref(false)
const reportType = ref('classic')
const showInfo = ref(false)
const selectedPage = ref<any>(null)
const geolocatedCoords = ref<{lat: number, lng: number} | null>(null)
const mapRef = ref<InstanceType<typeof Map> | null>(null)
const mapCenter = ref<{
  lat: number;
  lng: number;
  address?: string;
} | null>(null)
const showFeedbackModal = ref(false)
const feedbackUuid = ref<string | null>(null)


const { isDesktop } = useLayout()
const requests = computed(() => requestsStore.filteredRequests)
const recentRequests = computed(() => requests.value ?? [])
const { initialRequestId, initialFeedbackUuid } = toRefs(props)


watch(
  [() => mainMapInstance.value, () => initialRequestId.value],
  async ([map, id]) => {
    if (!id) return

    let request = requestsStore.getRequestById(id)

    if (!request) {
      request = await requestsStore.fetchRequestById(id)
    }

    if (request) {
      selectedReport.value = request

      if (map) {
        await nextTick()
        map.flyTo({
          center: [Number(request.long), Number(request.lat)],
          zoom: 16
        })
      }
    }
  },
  { immediate: true }
)


watch(
  () => initialFeedbackUuid.value,
  (uuid) => {
    if (!uuid) return
    
    
    feedbackUuid.value = uuid
    showFeedbackModal.value = true
  },
  { immediate: true }
)


const handleMapInit = (instance: maplibregl.Map) => {
  mainMapInstance.value = instance
}

const handleBoundsUpdate = async (bounds: BoundsType, isDetailView = false) => {
  await requestsStore.handleBoundsUpdate(bounds, isDetailView)
}

const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
  mapCenter.value = location
}

const handleReport = (type: string, location?: { lat: number; lng: number; address?: string }) => {
  reportType.value = 'classic'
  mapCenter.value = location && location.lat !== undefined && location.lng !== undefined ? location : null
  showDialog.value = true
}

const handleReportSelect = ({ report }: { report: any }) => {
  selectedReport.value = report
}

const handlePageSelect = (page: any) => {
  
  selectedPage.value = page
}


provide('showPage', handlePageSelect)

const handleClose = () => {
  selectedReport.value = null
  if (!props.initialRequestId && window?.location.pathname.includes('/requests/')) {
    router.push('/')
  }
}

const handleFeedbackClose = () => {
  showFeedbackModal.value = false
  feedbackUuid.value = null
  if (!props.initialFeedbackUuid && window?.location.pathname.includes('/feedback/')) {
    router.push('/')
  }
}

const handleFollowChange = (reportId: string, isFollowing: boolean) => {
  
}

const handleSuccess = () => {
  showDialog.value = false
}

const handleGeolocate = (coords: {lat: number, lng: number}) => {
  geolocatedCoords.value = coords
}

const toggleInfo = () => {
  showInfo.value = !showInfo.value
}

const handleLanguageToggle = () => {
  console.warn('Language toggle is disabled in open source version')
}
</script>

<template>
  <div class="relative h-screen w-full bg-slate-100 flex">
    <!-- Keep accessibility navigation and action buttons immediate -->
    <div class="sr-only" role="navigation" aria-labelledby="hidden-nav-title">
      <h1 id="hidden-nav-title" class="text-xl font-bold mb-4">
        {{ $t('header.app_name') }}
      </h1>
      <p class="mb-4">{{ $t('hiddenSection.description') }}</p>
      <nav>
        <ul class="space-y-2">
          <li>
            <a href="#report-actions" class="text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500">
              {{ $t('hiddenSection.action_button') }}
            </a>
          </li>
          <li>
            <a href="#map-section" class="text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500">
              {{ $t('hiddenSection.map') }}
            </a>
          </li>
          <li>
            <a href="#main-navigation" class="text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500">
              {{ $t('hiddenSection.main_navigation') }}
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <ActionButtons
      :mapInstance="mainMapInstance"
      @report="handleReport"
      @geolocate="handleGeolocate"
      @update:location="handleLocationSelect"
      @toggle-language="handleLanguageToggle"
    />

    <!-- Main Layout -->
    <ClientOnly>
      <Suspense>
        <template #default>
          <div class="flex flex-1">
            <!-- Desktop Sidebar -->
            <template v-if="isDesktop">
              <div id="main-navigation" tabindex="-1">
                <Suspense>
                  <template #default>
                    <LazyLeftSidebar
                      hydrate-on-visible
                      :requests="recentRequests"
                      @select-report="handleReportSelect"
                      @select-page="handlePageSelect"
                      :showInfo="showInfo"
                      @toggle-info="toggleInfo"
                    />
                  </template>
                  <template #fallback>
                    <div class="w-96 h-full bg-white dark:bg-gray-800"></div>
                  </template>
                </Suspense>
              </div>
            </template>

            <!-- Map Section -->
            <div id="map-section" class="flex-1" tabindex="-1">
              <!-- Use standard Map instead of LazyMap to avoid hydration issues -->
              <ClientOnly>
                <Map
                  ref="mapRef"
                  :markers="recentRequests"
                  @update:bounds="handleBoundsUpdate"
                  @select-report="handleReportSelect"
                  @map-init="handleMapInit"
                  @add-report="handleReport"
                  class="w-full h-full"
                />
              </ClientOnly>

              <!-- Mobile Bottom Sheet -->
              <template v-if="!isDesktop">
                <LazyBottomSheet
                  hydrate-on-interaction="swipe"
                  :requests="recentRequests"
                  @select-report="handleReportSelect"
                  @select-page="handlePageSelect"
                />
              </template>
            </div>
          </div>
        </template>
        <template #fallback>
          <div class="flex-1 flex items-center justify-center">
            <span class="text-gray-500">{{ $t('common.loading') }}</span>
          </div>
        </template>
      </Suspense>
    </ClientOnly>

    <!-- Modals -->
    <LazyReportDetail
      v-if="selectedReport"
      hydrate-on-idle
      :report="selectedReport"
      :mapInstance="mainMapInstance"
      @close="handleClose"
      @follow-changed="handleFollowChange"
    />

    <LazyServiceRequestFormDialog
      v-if="showDialog"
      hydrate-on-interaction="click"
      :type="reportType"
      :map-center="mapCenter"
      :geolocated-coords="geolocatedCoords"
      @close="showDialog = false"
      @success="handleSuccess"
    />

    <LazyPageContent
      v-if="selectedPage"
      :hydrate-after="500"
      :page="selectedPage"
      @close="handlePageSelect(null)"
    />
    
    <!-- Feedback Modal -->
    <ClientOnly>
      <Teleport to="body">
        <div 
          v-if="showFeedbackModal && feedbackUuid"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          @click="handleFeedbackClose"
        >
        <div 
          class="bg-white dark:bg-gray-800 w-full sm:w-[480px] sm:rounded-2xl max-h-[90vh] flex flex-col animate-slide-up-fade"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-gray-200">
                  {{ $t('feedback.page_title') || 'Feedback zur Serviceanfrage' }}
                </h2>
              </div>
              <button
                @click="handleFeedbackClose"
                :aria-label="$t('common.close')"
                class="text-gray-400 hover:text-gray-600 dark:text-gray-100 transform hover:rotate-90 transition-transform"
              >
                <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
              </button>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto p-4">
            <ClientOnly>
              <Suspense>
                <template #default>
                  <FeedbackForm
                    v-if="feedbackUuid"
                    :uuid="feedbackUuid"
                    :feedback-editable="true"
                    @error="(msg) => console.error('Feedback form error:', msg)"
                    @success="handleFeedbackClose"
                  />
                </template>
                <template #fallback>
                  <div class="flex items-center justify-center p-8">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p class="ml-3">{{ $t('feedback.loading') || 'Loading...' }}</p>
                  </div>
                </template>
              </Suspense>
            </ClientOnly>
          </div>
        </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.animate-slide-up-fade {
  animation: slide-up-fade 0.3s ease-out;
}

@keyframes slide-up-fade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
