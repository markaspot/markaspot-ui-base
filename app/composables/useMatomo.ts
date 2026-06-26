// composables/useMatomo.ts
export const useMatomo = () => {
    const { $matomo } = useNuxtApp();
    const runtimeConfig = useRuntimeConfig();
    const { clientConfig } = useMarkASpotConfig();

    // Dynamic config from API takes priority
    const isEnabled = computed(() => {
        return clientConfig.value?.features?.analytics?.matomo?.enabled ??
          runtimeConfig.public.clientConfig?.features?.analytics?.matomo?.enabled ?? false;
    });

    /**
   * Track a custom event
   */
    const trackEvent = (category: string, action: string, name?: string, value?: number) => {
        if (!isEnabled.value || !$matomo) return;
        $matomo.trackEvent(category, action, name, value);
    };

    /**
   * Track a page view
   */
    const trackPageView = (title?: string) => {
        if (!isEnabled.value || !$matomo) return;
        $matomo.trackPageView(title);
    };

    /**
   * Track site search
   */
    const trackSiteSearch = (keyword: string, category?: string, resultsCount?: number) => {
        if (!isEnabled.value || !$matomo) return;
        $matomo.trackSiteSearch(keyword, category, resultsCount);
    };

    /**
   * Set a custom variable
   */
    const setCustomVariable = (index: number, name: string, value: string, scope?: 'visit' | 'page') => {
        if (!isEnabled.value || !$matomo) return;
        $matomo.setCustomVariable(index, name, value, scope);
    };

    /**
   * Track form submissions
   */
    const trackFormSubmission = (formType: 'photo' | 'classic', category?: string) => {
        trackEvent('Form', 'Submit', `${formType}_report`, category ? parseInt(category) : undefined);
    };

    /**
   * Track map interactions
   */
    const trackMapInteraction = (action: string, value?: string | number) => {
        trackEvent('Map', action, typeof value === 'string' ? value : undefined, typeof value === 'number' ? value : undefined);
    };

    /**
   * Track photo analysis events
   */
    const trackPhotoAnalysis = (action: 'start' | 'success' | 'error', category?: string) => {
        trackEvent('AI', `photo_analysis_${action}`, category);
    };

    /**
   * Track language changes
   */
    const trackLanguageChange = (newLanguage: string, previousLanguage?: string) => {
        setCustomVariable(1, 'Language', newLanguage, 'visit');
        trackEvent('User', 'Language Change', `${previousLanguage || 'unknown'}_to_${newLanguage}`);
    };

    /**
   * Track theme changes
   */
    const trackThemeChange = (newTheme: 'light' | 'dark') => {
        setCustomVariable(2, 'Theme', newTheme, 'visit');
        trackEvent('User', 'Theme Change', newTheme);
    };

    /**
   * Track report following/unfollowing
   */
    const trackReportFollow = (action: 'follow' | 'unfollow', reportId: string) => {
        trackEvent('Report', action, reportId);
    };

    return {
        isEnabled: readonly(isEnabled),
        trackEvent,
        trackPageView,
        trackSiteSearch,
        setCustomVariable,
        trackFormSubmission,
        trackMapInteraction,
        trackPhotoAnalysis,
        trackLanguageChange,
        trackThemeChange,
        trackReportFollow
    };
};
