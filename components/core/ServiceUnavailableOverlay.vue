<template>
  <Teleport to="body">    
    <Transition name="fade">
      <div 
        v-if="isServiceDown" 
        class="service-unavailable-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70"
      >
        <div class="bg-white dark:bg-gray-800 max-w-md w-full mx-4 p-6 rounded-lg shadow-xl">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <UIcon 
                name="i-heroicons-server" 
                class="h-8 w-8 text-red-500 dark:text-red-400" 
                aria-hidden="true" 
              />
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                Service Temporarily Unavailable
              </h3>
              <div class="mt-2 text-gray-600 dark:text-gray-300">
                <p>{{ serviceDownMessage }}</p>
              </div>
              
              <!-- Retry button with countdown -->
              <div v-if="retryAfter && retryCountdown > 0" class="mt-4">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Retrying in {{ retryCountdown }} seconds...
                </p>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    class="bg-blue-600 dark:bg-blue-500 h-2" 
                    :style="{ width: `${(retryCountdown / 30) * 100}%` }"
                  ></div>
                </div>
              </div>
              
              <div class="mt-4 flex">
                <UButton 
                  @click="retry"
                  :disabled="retryLoading"
                  :loading="retryLoading"
                >
                  Retry Now
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useApiClient } from '~/composables/api/useApiClient'
import { useServiceStatus } from '~/composables/core/useServiceStatus'

const serviceStatus = useServiceStatus()
const isServiceDown = computed(() => serviceStatus.isServiceDown.value)
const retryAfter = computed(() => serviceStatus.retryAfter.value)
const retryCountdown = ref(0)
const retryLoading = ref(false)
const api = useApiClient()
let countdownTimer: ReturnType<typeof setInterval> | null = null


const serviceDownMessage = computed(() => serviceStatus.getServiceDownMessage())


watch([isServiceDown, retryAfter], ([down, after]) => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  if (down && after) {
    retryCountdown.value = 30 
    
    countdownTimer = setInterval(() => {
      retryCountdown.value--
      
      if (retryCountdown.value <= 0) {
        if (countdownTimer) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
        
        retry()
      }
    }, 1000)
  } else {
    retryCountdown.value = 0
  }
}, { immediate: true })


const retry = async () => {
  
  retryLoading.value = true;
  
  try {
    
    await api.refreshCsrfToken()
    
    serviceStatus.registerServiceSuccess()
    
    setTimeout(() => {
      window.location.reload()
    }, 300)
  } catch (error) {
    console.error('Retry failed:', error)
    
  } finally {
    retryLoading.value = false
  }
}


onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

[data-teleport-root] > .fixed,
body > .fixed,
body > div > .service-unavailable-overlay,
#__nuxt .service-unavailable-overlay,
[data-teleport-root] .service-unavailable-overlay {
  z-index: 99999 !important;
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
}

.service-unavailable-overlay {
  z-index: 99999 !important;
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background-color: rgba(0, 0, 0, 0.7) !important;
  pointer-events: auto !important;
  visibility: visible !important;
  opacity: 1 !important;
}

body > .service-unavailable-overlay,
body > div > .service-unavailable-overlay {
  visibility: visible !important;
  display: flex !important;
  opacity: 1 !important;
}
</style>