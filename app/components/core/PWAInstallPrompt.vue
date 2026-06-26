<template>
  <div
    v-if="showPrompt"
    class="fixed bottom-0 left-0 right-0 p-4 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] shadow-lg z-30 fade-in"
    role="dialog"
    aria-labelledby="pwa-install-title"
  >
    <div class="container mx-auto flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <!-- Platform specific icon -->
        <UIcon
          :name="platformIcon"
          class="w-6 h-6 text-neutral-600 dark:text-neutral-300"
        />
        <div>
          <h3
            id="pwa-install-title"
            class="font-medium text-neutral-900 dark:text-neutral-100"
          >
            {{ isIOS ? $t('pwa.install.ios.title') : $t('pwa.install.title') }}
          </h3>
          <p class="text-sm text-[var(--ui-text-muted)]">
            <template v-if="isIOS">
              {{ isIOSSafari
                ? $t('pwa.install.ios.safari_instructions', { icon: '️↑' })
                : $t('pwa.install.ios.other_instructions', { browser: $t('pwa.install.open_safari') })
              }}
            </template>
            <template v-else>
              {{ $t(`pwa.install.${browserType}.instructions`, {
                icon: browserType === 'firefox' ? '🏠' : '⊕',
              }) }}
            </template>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          aria-label="Dismiss PWA install prompt"
          @click="closePrompt"
        >
          {{ $t('pwa.install.not_now') }}
        </UButton>
        <UButton
          v-if="!isIOS"
          color="primary"
          aria-label="Install PWA"
          @click="handleInstall"
        >
          {{ $t('pwa.install.button') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PWAInstallPrompt Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const isMobile = ref(false);
const { clientConfig } = useRuntimeConfig().public;

// State variables
const showPrompt = ref(false);
const deferredPrompt = ref<any>(null);
const isIOS = ref(false);
const isIOSSafari = ref(false);
const browserType = ref('chrome'); // Default to chrome

const platformIcon = computed(() => {
    if (isIOS.value) {
        return 'i-heroicons-share';
    }

    const isMac = /macintosh|macintel/i.test(window.navigator.userAgent);

    switch (browserType.value) {
        case 'firefox':
            return 'i-heroicons-home';
        case 'edge':
            return 'i-heroicons-plus-circle';
        case 'chrome':
            return isMac ? 'i-heroicons-square-2-stack' : 'i-heroicons-computer-desktop'; // Using square-2-stack to better match the Chrome macOS install icon
        default:
            return 'i-heroicons-computer-desktop';
    }
});

// Helper function to detect browser
const detectBrowser = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('firefox')) {
        browserType.value = 'firefox';
    } else if (ua.includes('edg/')) {
        browserType.value = 'edge';
    } else {
        browserType.value = 'chrome';
    }
};

// Helper function for cleanup
const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    deferredPrompt.value = e;
    showPrompt.value = true;
};

// Lifecycle hooks
onMounted(() => {
    // Check if PWA install prompt is enabled
    const pwaConfig = clientConfig?.features?.pwaInstallPrompt;
    if (!pwaConfig?.enabled) return;

    // Check if we should only show on mobile
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
    if (pwaConfig.showOnMobile && !isMobile.value) return;

    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) return;

    // Check if recently dismissed
    const lastDismissed = localStorage.getItem('pwaPromptDismissed');
    if (lastDismissed) {
        const dismissedDate = new Date(lastDismissed);
        const daysSinceDismissed = (new Date().getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        const dismissalDuration = pwaConfig.dismissalDuration ?? 7;
        if (daysSinceDismissed < dismissalDuration) {
            return;
        }
    }

    // Detect platform and browser
    const userAgent = window.navigator.userAgent.toLowerCase();
    isIOS.value = /iphone|ipad|ipod/.test(userAgent);
    isIOSSafari.value = isIOS.value && /safari/.test(userAgent) && !/chrome/.test(userAgent);
    detectBrowser();

    // Show prompt after a delay for better UX
    const showDelay = pwaConfig.showDelay ?? 2000;
    setTimeout(() => {
        showPrompt.value = true;
    }, showDelay);

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
});

onUnmounted(() => {
    // Clean up event listeners
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
});

// Methods
const handleInstall = async () => {
    if (!deferredPrompt.value) return;

    try {
        deferredPrompt.value.prompt();
        const { outcome } = await deferredPrompt.value.userChoice;

        if (outcome === 'accepted') {
            showPrompt.value = false;
        }
    } catch (error) {
        console.error('Error installing PWA:', error);
    } finally {
        deferredPrompt.value = null;
    }
};

const closePrompt = () => {
    showPrompt.value = false;
    localStorage.setItem('pwaPromptDismissed', new Date().toISOString());
};
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
