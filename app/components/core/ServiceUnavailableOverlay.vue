<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isServiceDown"
        class="service-unavailable-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70"
      >
        <div class="bg-[var(--ui-bg)] max-w-md w-full mx-4 p-6 rounded-lg shadow-xl">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <UIcon
                name="i-heroicons-server"
                class="h-8 w-8 text-red-500 dark:text-red-400"
                aria-hidden="true"
              />
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {{ $t('service_unavailable.title') }}
              </h3>
              <div class="mt-2 text-neutral-600 dark:text-neutral-300">
                <p>{{ $t('service_unavailable.try_later') }}</p>
              </div>

              <div class="mt-4 flex">
                <UButton
                  :loading="retryLoading"
                  @click="retry"
                >
                  {{ $t('service_unavailable.reload') }}
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
/**
 * ServiceUnavailableOverlay Component
 *
 * Shows a modal when the backend service is unavailable (5xx errors).
 * Does NOT show when user is simply offline - that's handled by OfflineBanner.
 */

const serviceStatus = useServiceStatus();
const { isOnline } = useOnlineStatus();

// Only show overlay for server errors, NOT when offline
// When offline, the OfflineBanner handles the UX
const isServiceDown = computed(() =>
    serviceStatus.isServiceDown.value && isOnline.value
);
const retryLoading = ref(false);
const api = useApiClient();

// Manual retry attempt
const retry = async () => {
    retryLoading.value = true;

    try {
    // Try to refresh the CSRF token which will check the server status
        await api.refreshCsrfToken();
        // If successful, the service is available
        serviceStatus.registerServiceSuccess();
        // Reload the page to ensure a fresh state
        setTimeout(() => {
            window.location.reload();
        }, 300);
    } catch (error) {
        console.error('Retry failed:', error);
    // Service is still down
    } finally {
        retryLoading.value = false;
    }
};
</script>

<style>
/* Using non-scoped styles to ensure they apply globally */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure our overlay appears above everything else (target only the overlay) */
body > .service-unavailable-overlay,
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

/* Make the overlay container impossible to hide */
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

/* Specifically target the Vue Teleport location for the overlay */
body > .service-unavailable-overlay,
body > div > .service-unavailable-overlay {
  visibility: visible !important;
  display: flex !important;
  opacity: 1 !important;
}
</style>
