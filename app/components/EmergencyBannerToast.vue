<template>
  <div>
    <!-- This component manages emergency banner display using Nuxt UI toasts -->
  </div>
</template>

<script setup lang="ts">
import type { EmergencyStatusResponse } from '~~/types';

const toast = useToast();

// Shared state across component instances.
const bannerDismissed = useState('emergency-banner-dismissed', () => false);
const isToastActive = useState('emergency-toast-active', () => false);

// Map Drupal banner semantic types to Nuxt UI toast semantic colors.
// Nuxt UI supports: primary, secondary, success, info, warning, error, neutral
type NuxtUIColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

const mapBannerTypeToColor = (bannerType: string): NuxtUIColor => {
    const typeColorMap: Record<string, NuxtUIColor> = {
        extreme: 'error',
        critical: 'error',
        severe: 'error',
        emergency: 'error',
        alert: 'error',
        error: 'error',
        warning: 'warning',
        info: 'info',
        success: 'success',
        advisory: 'warning',
        watch: 'info',
        moderate: 'warning',
        minor: 'info'
    };
    return typeColorMap[bannerType?.toLowerCase()] || 'info';
};

const mapBannerTypeToIcon = (bannerType: string) => {
    const typeIconMap: Record<string, string> = {
        extreme: 'i-heroicons-shield-exclamation',
        critical: 'i-heroicons-shield-exclamation',
        severe: 'i-heroicons-exclamation-circle',
        emergency: 'i-heroicons-shield-exclamation',
        error: 'i-heroicons-x-circle',
        warning: 'i-heroicons-exclamation-triangle',
        info: 'i-heroicons-information-circle',
        success: 'i-heroicons-check-circle',
        alert: 'i-heroicons-exclamation-circle',
        advisory: 'i-heroicons-exclamation-triangle',
        watch: 'i-heroicons-eye',
        moderate: 'i-heroicons-exclamation-triangle',
        minor: 'i-heroicons-information-circle'
    };
    return typeIconMap[bannerType?.toLowerCase()] || 'i-heroicons-information-circle';
};

/**
 * Returns true when the banner for this level was dismissed within the last
 * hour. The dismiss key is written by `showEmergencyToast` on toast callback.
 */
const wasRecentlyDismissed = (level: string): boolean => {
    try {
        const prefix = `emergency-banner-dismissed-${level}-`;
        const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
        return keys.some((key) => {
            const timestamp = parseInt(key.slice(prefix.length), 10);
            return !isNaN(timestamp) && Date.now() - timestamp < 3_600_000; // 1 hour
        });
    } catch {
        return false;
    }
};

/**
 * Write a dismiss timestamp to localStorage so wasRecentlyDismissed works
 * on subsequent polls/page loads.
 */
const writeDismissKey = (level: string): void => {
    try {
        const key = `emergency-banner-dismissed-${level}-${Date.now()}`;
        localStorage.setItem(key, '1');
        // Prune older keys for the same level to avoid unbounded growth.
        const prefix = `emergency-banner-dismissed-${level}-`;
        Object.keys(localStorage)
            .filter(k => k.startsWith(prefix) && k !== key)
            .forEach(k => localStorage.removeItem(k));
    } catch {
        // localStorage may be unavailable in private-browsing contexts.
    }
};

// Show emergency banner as a persistent toast.
const showEmergencyToast = (bannerData: NonNullable<EmergencyStatusResponse['banner']>) => {
    if (!bannerData || bannerDismissed.value || isToastActive.value) return;

    const bannerType = bannerData.level || 'info';

    if (wasRecentlyDismissed(bannerType)) return;

    try {
        isToastActive.value = true;
        toast.add({
            title: bannerData.title || 'Emergency Notice',
            description: bannerData.message,
            color: mapBannerTypeToColor(bannerType),
            icon: mapBannerTypeToIcon(bannerType),
            duration: 15000,
            onUpdate: () => {
                // Toast dismissed by user: record it so subsequent polls skip.
                writeDismissKey(bannerType);
                bannerDismissed.value = true;
                isToastActive.value = false;
            }
        });
    } catch (error) {
        console.error('Failed to create emergency toast:', error);
        isToastActive.value = false;
    }
};

// Fetch emergency banner data from the cached status endpoint.
const fetchEmergencyData = async () => {
    try {
        const data = await $fetch<EmergencyStatusResponse>('/api/emergency-mode/status');

        // Only show banner when emergency_mode is active (not null/false).
        if (data?.banner?.message && data.emergency_mode === true) {
            showEmergencyToast(data.banner);
        }
    } catch (error) {
        console.warn('Failed to fetch emergency banner:', error);
    }
};

let pollInterval: ReturnType<typeof setInterval> | null = null;

const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !isToastActive.value) {
        fetchEmergencyData();
    }
};

onMounted(() => {
    if (!import.meta.client) return;

    // Fetch immediately (await next tick so UToaster is initialized).
    nextTick(() => {
        fetchEmergencyData();
    });

    // Re-fetch when the tab becomes visible again (user returns after a while).
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Poll every 60 s. The server-side defineCachedEventHandler (maxAge 20 s)
    // makes this cheap: most polls are served from Nitro cache without hitting
    // Drupal.
    pollInterval = setInterval(fetchEmergencyData, 60_000);
});

onUnmounted(() => {
    if (!import.meta.client) return;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (pollInterval !== null) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
});
</script>
