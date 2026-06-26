import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, ref } from 'vue';

const mockClientConfig = ref<any>({});
const mockPhotoReportAvailable = ref(false);

vi.mock('@vueuse/core', () => ({
    useWindowSize: () => ({ width: ref(390) })
}));

describe('useFormFirstMode', () => {
    beforeEach(() => {
        vi.resetModules();
        mockPhotoReportAvailable.value = false;
        mockClientConfig.value = {
            features: {
                formFirst: {
                    enabled: true,
                    mobileLayout: 'tabs',
                    defaultTab: 'photo'
                }
            }
        };

        vi.stubGlobal('useMarkASpotConfig', () => ({
            clientConfig: computed(() => mockClientConfig.value)
        }));
        vi.stubGlobal('useFeatureFlags', () => ({
            photoReportAvailable: computed(() => mockPhotoReportAvailable.value)
        }));
    });

    it('syncs the default tab when Photo Report becomes available after config hydration', async () => {
        const { useFormFirstMode } = await import('@/composables/features/useFormFirstMode');
        const formFirst = useFormFirstMode();

        expect(formFirst.formFirstConfig.value.defaultTab).toBe('classic');
        expect(formFirst.activeTab.value).toBe('classic');

        mockPhotoReportAvailable.value = true;
        await nextTick();

        expect(formFirst.formFirstConfig.value.defaultTab).toBe('photo');
        expect(formFirst.activeTab.value).toBe('photo');
    });

    it('keeps a manual Classic selection when Photo Report becomes available later', async () => {
        const { useFormFirstMode } = await import('@/composables/features/useFormFirstMode');
        const formFirst = useFormFirstMode();

        formFirst.setActiveTab('classic');
        mockPhotoReportAvailable.value = true;
        await nextTick();

        expect(formFirst.formFirstConfig.value.defaultTab).toBe('photo');
        expect(formFirst.activeTab.value).toBe('classic');
    });
});
