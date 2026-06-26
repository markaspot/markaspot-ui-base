import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { useFeatureFlags } from '@/composables/useFeatureFlags';

const mockClientConfig = ref<any>({});
const mockJurisdiction = ref<any>(null);

vi.mock('@/composables/core/useMarkASpotConfig', () => ({
    useMarkASpotConfig: () => ({
        clientConfig: computed(() => mockClientConfig.value),
        jurisdiction: computed(() => mockJurisdiction.value)
    })
}));

describe('useFeatureFlags', () => {
    beforeEach(() => {
        mockClientConfig.value = {};
        mockJurisdiction.value = null;
        globalThis.useRuntimeConfig = () => ({
            public: {
                pro: true,
                fastmap: false
            }
        });
    });

    it('fails open for passwordless when the tenant flag is missing', () => {
        mockClientConfig.value = {
            features: {}
        };

        const { passwordlessEnabled } = useFeatureFlags();

        expect(passwordlessEnabled.value).toBe(true);
    });

    it('respects an explicitly disabled passwordless flag', () => {
        mockClientConfig.value = {
            features: {
                passwordless: false
            }
        };

        const { passwordlessEnabled } = useFeatureFlags();

        expect(passwordlessEnabled.value).toBe(false);
    });

    it('supports object-style passwordless flags', () => {
        mockClientConfig.value = {
            features: {
                passwordless: {
                    enabled: true
                }
            }
        };

        const { passwordlessEnabled } = useFeatureFlags();

        expect(passwordlessEnabled.value).toBe(true);
    });

    it('defaults status attributes to disabled', () => {
        mockClientConfig.value = {
            features: {}
        };

        const { statusAttributesEnabled } = useFeatureFlags();

        expect(statusAttributesEnabled.value).toBe(false);
    });

    it('defaults aiProcessing to disabled when the flag is missing', () => {
        mockClientConfig.value = {
            features: {
                aiAnalysis: true
            }
        };

        const { aiProcessingEnabled } = useFeatureFlags();

        expect(aiProcessingEnabled.value).toBe(false);
    });

    it('enables aiProcessing only when pro layer and the flag are active', () => {
        mockClientConfig.value = {
            features: {
                aiProcessing: true
            }
        };

        const { aiProcessingEnabled } = useFeatureFlags();
        expect(aiProcessingEnabled.value).toBe(true);

        globalThis.useRuntimeConfig = () => ({
            public: {
                pro: false,
                fastmap: false
            }
        });

        const disabledByBuild = useFeatureFlags();
        expect(disabledByBuild.aiProcessingEnabled.value).toBe(false);
    });

    it('defaults privacy block to disabled when the flag is missing', () => {
        mockClientConfig.value = {
            features: {}
        };

        const { privacyBlockEnabled } = useFeatureFlags();

        expect(privacyBlockEnabled.value).toBe(false);
    });

    it('enables privacy block when the tenant flag is true', () => {
        mockClientConfig.value = {
            features: {
                privacyBlockOnFlag: true
            }
        };

        const { privacyBlockEnabled } = useFeatureFlags();

        expect(privacyBlockEnabled.value).toBe(true);
    });

    it('respects an explicitly disabled privacy block flag', () => {
        mockClientConfig.value = {
            features: {
                privacyBlockOnFlag: false
            }
        };

        const { privacyBlockEnabled } = useFeatureFlags();

        expect(privacyBlockEnabled.value).toBe(false);
    });

    it('defaults aiDuplicates to disabled when the flag is missing', () => {
        mockClientConfig.value = {
            features: {
                aiAnalysis: true
            }
        };

        const { aiDuplicatesEnabled } = useFeatureFlags();

        expect(aiDuplicatesEnabled.value).toBe(false);
    });

    it('enables aiDuplicates when the backend flag is true and pro layer is active', () => {
        mockClientConfig.value = {
            features: {
                aiDuplicates: true
            }
        };

        const { aiDuplicatesEnabled } = useFeatureFlags();
        expect(aiDuplicatesEnabled.value).toBe(true);
    });

    it('disables aiDuplicates when pro layer is absent even if flag is true', () => {
        mockClientConfig.value = {
            features: {
                aiDuplicates: true
            }
        };

        globalThis.useRuntimeConfig = () => ({
            public: {
                pro: false,
                fastmap: false
            }
        });

        const { aiDuplicatesEnabled } = useFeatureFlags();
        expect(aiDuplicatesEnabled.value).toBe(false);
    });

    it('disables aiDuplicates when the backend sets it to false (markaspot_ai absent)', () => {
        // Simulates a vision-only tenant: aiAnalysis is true, aiDuplicates is false
        mockClientConfig.value = {
            features: {
                aiAnalysis: true,
                aiDuplicates: false
            }
        };

        const { aiDuplicatesEnabled, aiAnalysisEnabled } = useFeatureFlags();

        expect(aiDuplicatesEnabled.value).toBe(false);
        expect(aiAnalysisEnabled.value).toBe(true);
    });

    it('enables Photo Report only when photoReporting and AI analysis are both active', () => {
        mockClientConfig.value = {
            features: {
                photoReporting: true,
                aiAnalysis: true
            }
        };

        const { photoReportAvailable } = useFeatureFlags();

        expect(photoReportAvailable.value).toBe(true);
    });

    it('disables Photo Report when AI analysis is disabled even if photoReporting is true', () => {
        mockClientConfig.value = {
            features: {
                photoReporting: true,
                aiAnalysis: false
            }
        };

        const { photoReportingEnabled, photoReportAvailable } = useFeatureFlags();

        expect(photoReportingEnabled.value).toBe(true);
        expect(photoReportAvailable.value).toBe(false);
    });

    it('keeps Photo Report off when photoReporting is missing', () => {
        mockClientConfig.value = {
            features: {
                aiAnalysis: true
            }
        };

        const { photoReportingEnabled, photoReportAvailable } = useFeatureFlags();

        expect(photoReportingEnabled.value).toBe(false);
        expect(photoReportAvailable.value).toBe(false);
    });

    it('defaults AI analysis to enabled when the Vision flag is missing', () => {
        mockClientConfig.value = {
            features: {
                photoReporting: true
            }
        };

        const { aiAnalysisEnabled, photoReportAvailable } = useFeatureFlags();

        expect(aiAnalysisEnabled.value).toBe(true);
        expect(photoReportAvailable.value).toBe(true);
    });

    it('enables status attributes only when pro layer and operator flag are active', () => {
        mockClientConfig.value = {
            features: {
                statusAttributes: {
                    enabled: true
                }
            }
        };

        const { statusAttributesEnabled } = useFeatureFlags();
        expect(statusAttributesEnabled.value).toBe(true);

        globalThis.useRuntimeConfig = () => ({
            public: {
                pro: false,
                fastmap: false
            }
        });

        const disabledByBuild = useFeatureFlags();
        expect(disabledByBuild.statusAttributesEnabled.value).toBe(false);
    });

    it('fails open for dashboard request creation in Pro when the tenant flag is missing', () => {
        mockClientConfig.value = {
            features: {}
        };

        const { dashboardRequestCreateEnabled } = useFeatureFlags();

        expect(dashboardRequestCreateEnabled.value).toBe(true);
    });

    it('respects an explicitly disabled dashboard request creation flag', () => {
        mockClientConfig.value = {
            features: {
                dashboardRequestCreate: false
            }
        };

        const { dashboardRequestCreateEnabled } = useFeatureFlags();

        expect(dashboardRequestCreateEnabled.value).toBe(false);
    });

    it('disables dashboard request creation when the Pro layer is absent', () => {
        mockClientConfig.value = {
            features: {
                dashboardRequestCreate: true
            }
        };
        globalThis.useRuntimeConfig = () => ({
            public: {
                pro: false,
                fastmap: false
            }
        });

        const { dashboardRequestCreateEnabled } = useFeatureFlags();

        expect(dashboardRequestCreateEnabled.value).toBe(false);
    });
});
