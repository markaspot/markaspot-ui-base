import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { computed, ref } from 'vue';
import { useInternalStatus } from '~/composables/features/useInternalStatus';
import { useFormSettingsStore } from '~/stores/formSettings';

const mockGet = vi.fn();
const mockCurrentJurisdictionId = ref<string>('');
const mockTaxonomyJurisdictionId = ref<number | null>(null);
const mockJurisdiction = ref<{ id?: number, slug?: string } | null>(null);

vi.mock('~/composables/api/useApiClient', () => ({
    useApiClient: () => ({
        get: mockGet
    })
}));

globalThis.useMarkASpotConfig = () => ({
    currentJurisdictionId: computed(() => mockCurrentJurisdictionId.value),
    taxonomyJurisdictionId: computed(() => mockTaxonomyJurisdictionId.value),
    jurisdiction: computed(() => mockJurisdiction.value),
    features: computed(() => ({})),
    config: computed(() => null),
    isReady: computed(() => true),
    isPending: computed(() => false),
    error: computed(() => null),
    client: computed(() => null),
    theme: computed(() => null),
    ui: computed(() => null),
    media: computed(() => null),
    fetchConfig: vi.fn(),
    clearCache: vi.fn()
});

const makeFormModeConfig = (fields: Record<string, any>) => ({
    entity_type: 'node',
    bundle: 'service_request',
    form_mode: 'management',
    fields,
    field_groups: {}
});

describe('useInternalStatus', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.restoreAllMocks();
        mockGet.mockReset();
        mockCurrentJurisdictionId.value = '';
        mockTaxonomyJurisdictionId.value = null;
        mockJurisdiction.value = null;
    });

    it('uses taxonomy-backed internal status terms when management exposes the entity reference field', async () => {
        const store = useFormSettingsStore();
        mockTaxonomyJurisdictionId.value = 19;
        const managementConfig = makeFormModeConfig({
            field_status_internal_term: {
                field_type: 'entity_reference'
            }
        });

        vi.spyOn(store, 'fetchManagementFormMode')
            .mockImplementation(async () => {
                store.$patch({
                    configs: {
                        'node.service_request.management': managementConfig
                    }
                });
                return managementConfig;
            });
        mockGet.mockResolvedValueOnce({
            data: [
                {
                    id: 'term-uuid-1',
                    attributes: {
                        name: 'Bitte um Prüfung',
                        field_internal_status_code: 'review',
                        field_status_definition: '[{"code":"system_sketch"}]'
                    }
                }
            ]
        });

        const {
            fetchInternalStatus,
            internalStatusOptions,
            internalStatusFieldName,
            internalStatusDefinitions,
            internalStatusLoadedTermIds,
            usesTaxonomyInternalStatus
        } = useInternalStatus();
        await fetchInternalStatus();

        expect(usesTaxonomyInternalStatus.value).toBe(true);
        expect(internalStatusFieldName.value).toBe('field_status_internal_term');
        expect(mockGet).toHaveBeenCalledWith(
            '/jsonapi/taxonomy_term/internal_status',
            expect.objectContaining({
                'filter[field_jurisdiction.meta.drupal_internal__target_id]': '19'
            })
        );
        expect(internalStatusOptions.value).toEqual([
            {
                value: 'term-uuid-1',
                label: 'Bitte um Prüfung',
                statusDefinition: '[{"code":"system_sketch"}]'
            }
        ]);
        expect(internalStatusDefinitions.value.get('term-uuid-1')).toBe('[{"code":"system_sketch"}]');
        expect(internalStatusLoadedTermIds.value.has('term-uuid-1')).toBe(true);
    });

    it('tracks loaded taxonomy terms even when they have no status definitions', async () => {
        const store = useFormSettingsStore();
        mockTaxonomyJurisdictionId.value = 19;
        const managementConfig = makeFormModeConfig({
            field_status_internal_term: {
                field_type: 'entity_reference'
            }
        });

        vi.spyOn(store, 'fetchManagementFormMode')
            .mockImplementation(async () => {
                store.$patch({
                    configs: {
                        'node.service_request.management': managementConfig
                    }
                });
                return managementConfig;
            });
        mockGet.mockResolvedValueOnce({
            data: [
                {
                    id: 'term-uuid-empty',
                    attributes: {
                        name: 'Leer',
                        field_internal_status_code: 'empty'
                    }
                }
            ]
        });

        const {
            fetchInternalStatus,
            internalStatusDefinitions,
            internalStatusLoadedTermIds
        } = useInternalStatus();
        await fetchInternalStatus();

        expect(internalStatusDefinitions.value.has('term-uuid-empty')).toBe(false);
        expect(internalStatusLoadedTermIds.value.has('term-uuid-empty')).toBe(true);
    });

    it('uses the dashboard management form mode before the legacy nuxt form mode', async () => {
        const store = useFormSettingsStore();
        const managementConfig = makeFormModeConfig({
            field_status_internal: {
                settings: {
                    allowed_values: {
                        waiting: 'Waiting'
                    }
                }
            }
        });

        const fetchManagement = vi.spyOn(store, 'fetchManagementFormMode')
            .mockImplementation(async () => {
                store.$patch({
                    configs: {
                        'node.service_request.management': managementConfig
                    }
                });
                return managementConfig;
            });
        const fetchNuxt = vi.spyOn(store, 'fetchNuxtFormMode')
            .mockResolvedValue(makeFormModeConfig({}));

        const { fetchInternalStatus, internalStatusOptions, internalStatusFieldName } = useInternalStatus();
        await fetchInternalStatus();

        expect(fetchManagement).toHaveBeenCalledOnce();
        expect(fetchNuxt).not.toHaveBeenCalled();
        expect(internalStatusFieldName.value).toBe('field_status_internal');
        expect(internalStatusOptions.value).toEqual([
            { value: 'waiting', label: 'Waiting' }
        ]);
    });

    it('falls back to the legacy nuxt form mode when management has no internal status field', async () => {
        const store = useFormSettingsStore();
        const emptyManagementConfig = makeFormModeConfig({});
        const nuxtConfig = {
            ...makeFormModeConfig({
                field_status_internal: {
                    settings: {
                        allowed_values: {
                            planned: 'Planned'
                        }
                    }
                }
            }),
            form_mode: 'nuxt'
        };

        vi.spyOn(store, 'fetchManagementFormMode')
            .mockImplementation(async () => {
                store.$patch({
                    configs: {
                        'node.service_request.management': emptyManagementConfig
                    }
                });
                return emptyManagementConfig;
            });
        const fetchNuxt = vi.spyOn(store, 'fetchNuxtFormMode')
            .mockImplementation(async () => {
                store.$patch({
                    configs: {
                        'node.service_request.nuxt': nuxtConfig
                    }
                });
                return nuxtConfig;
            });

        const { fetchInternalStatus, internalStatusOptions } = useInternalStatus();
        await fetchInternalStatus();

        expect(fetchNuxt).toHaveBeenCalledOnce();
        expect(internalStatusOptions.value).toEqual([
            { value: 'planned', label: 'Planned' }
        ]);
    });

    it('falls back to the legacy nuxt form mode when management form settings fail', async () => {
        const store = useFormSettingsStore();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const nuxtConfig = {
            ...makeFormModeConfig({
                field_status_internal: {
                    settings: {
                        allowed_values: {
                            emergency: 'Emergency'
                        }
                    }
                }
            }),
            form_mode: 'nuxt'
        };

        vi.spyOn(store, 'fetchManagementFormMode')
            .mockRejectedValue(new Error('management unavailable'));
        const fetchNuxt = vi.spyOn(store, 'fetchNuxtFormMode')
            .mockImplementation(async () => {
                store.$patch({
                    configs: {
                        'node.service_request.nuxt': nuxtConfig
                    }
                });
                return nuxtConfig;
            });

        const { fetchInternalStatus, internalStatusOptions, error } = useInternalStatus();
        await fetchInternalStatus();

        expect(fetchNuxt).toHaveBeenCalledOnce();
        expect(warn).toHaveBeenCalledWith(
            '[InternalStatus] Management form mode unavailable, trying nuxt form mode',
            expect.any(Error)
        );
        expect(error.value).toBeNull();
        expect(internalStatusOptions.value).toEqual([
            { value: 'emergency', label: 'Emergency' }
        ]);
    });
});
