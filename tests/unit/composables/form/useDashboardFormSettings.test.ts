import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import {
    DASHBOARD_BACKEND_WORKFLOW_FIELDS,
    DASHBOARD_EXPLICITLY_RENDERED_FIELDS,
    isDashboardDynamicFallbackField,
    useDashboardFormSettings
} from '@/composables/form/useDashboardFormSettings';
import { useFormSettingsStore } from '@/stores/formSettings';

const loadSettings = (
    fields: Record<string, { display_settings?: { region?: string } }>,
    fieldGroups: Record<string, { region?: string, parent?: string | null, children?: string[] }> = {}
) => {
    const store = useFormSettingsStore();
    store.$patch({
        configs: {
            'node.service_request.management': {
                entity_type: 'node',
                bundle: 'service_request',
                form_mode: 'management',
                fields,
                field_groups: fieldGroups
            }
        }
    });
};

describe('useDashboardFormSettings.isFieldVisible', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('returns true when field exists with region content', () => {
        loadSettings({ field_priority: { display_settings: { region: 'content' } } });
        const { isFieldVisible } = useDashboardFormSettings();
        expect(isFieldVisible('field_priority')).toBe(true);
    });

    it('returns false when field exists in hidden region', () => {
        loadSettings({ field_district: { display_settings: { region: 'hidden' } } });
        const { isFieldVisible } = useDashboardFormSettings();
        expect(isFieldVisible('field_district')).toBe(false);
    });

    it('returns false when the field does not exist in the form mode', () => {
        loadSettings({ field_priority: { display_settings: { region: 'content' } } });
        const { isFieldVisible } = useDashboardFormSettings();
        expect(isFieldVisible('field_unknown')).toBe(false);
    });

    it('returns true when region is missing (defaults to visible)', () => {
        loadSettings({ field_category: { display_settings: {} } });
        const { isFieldVisible } = useDashboardFormSettings();
        expect(isFieldVisible('field_category')).toBe(true);
    });

    it('returns false when the field belongs to a hidden group', () => {
        loadSettings(
            { field_sp_attachment: { display_settings: { region: 'content' } } },
            {
                group_service_provider: {
                    region: 'hidden',
                    parent: null,
                    children: ['field_sp_attachment']
                }
            }
        );
        const { isFieldVisible } = useDashboardFormSettings();
        expect(isFieldVisible('field_sp_attachment')).toBe(false);
    });

    it('returns false when the field belongs to a child group under a hidden parent group', () => {
        loadSettings(
            { field_sp_attachment: { display_settings: { region: 'content' } } },
            {
                group_administration: {
                    region: 'hidden',
                    parent: null,
                    children: ['group_service_provider']
                },
                group_service_provider: {
                    region: 'content',
                    parent: 'group_administration',
                    children: ['field_sp_attachment']
                }
            }
        );
        const { isFieldVisible } = useDashboardFormSettings();
        expect(isFieldVisible('field_sp_attachment')).toBe(false);
    });

    it('returns false when settings are not loaded yet', () => {
        const { isFieldVisible } = useDashboardFormSettings();
        expect(isFieldVisible('field_priority')).toBe(false);
    });
});

describe('useDashboardFormSettings.hasAnyVisibleField', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('returns true when at least one field is visible', () => {
        loadSettings({
            field_a: { display_settings: { region: 'hidden' } },
            field_b: { display_settings: { region: 'content' } },
            field_c: { display_settings: { region: 'hidden' } }
        });
        const { hasAnyVisibleField } = useDashboardFormSettings();
        expect(hasAnyVisibleField(['field_a', 'field_b', 'field_c'])).toBe(true);
    });

    it('returns false when every field is hidden', () => {
        loadSettings({
            field_a: { display_settings: { region: 'hidden' } },
            field_b: { display_settings: { region: 'hidden' } }
        });
        const { hasAnyVisibleField } = useDashboardFormSettings();
        expect(hasAnyVisibleField(['field_a', 'field_b'])).toBe(false);
    });

    it('returns false when every field is missing', () => {
        loadSettings({});
        const { hasAnyVisibleField } = useDashboardFormSettings();
        expect(hasAnyVisibleField(['field_a', 'field_b'])).toBe(false);
    });

    it('returns false when every field is inside a hidden group', () => {
        loadSettings(
            {
                field_service_provider: { display_settings: { region: 'content' } },
                field_sp_attachment: { display_settings: { region: 'content' } }
            },
            {
                group_service_provider: {
                    region: 'hidden',
                    parent: null,
                    children: ['field_service_provider', 'field_sp_attachment']
                }
            }
        );
        const { hasAnyVisibleField } = useDashboardFormSettings();
        expect(hasAnyVisibleField(['field_service_provider', 'field_sp_attachment'])).toBe(false);
    });

    it('returns false for an empty field list', () => {
        loadSettings({ field_a: { display_settings: { region: 'content' } } });
        const { hasAnyVisibleField } = useDashboardFormSettings();
        expect(hasAnyVisibleField([])).toBe(false);
    });
});

describe('dashboard dynamic fallback exclusions', () => {
    it('marks explicitly rendered dashboard fields as non-dynamic fallback fields', () => {
        expect(DASHBOARD_EXPLICITLY_RENDERED_FIELDS).toContain('field_priority');
        expect(isDashboardDynamicFallbackField('field_priority')).toBe(false);
    });

    it('marks backend workflow fields as non-dynamic fallback fields', () => {
        expect(DASHBOARD_BACKEND_WORKFLOW_FIELDS).toContain('field_escalation');
        expect(isDashboardDynamicFallbackField('field_escalation')).toBe(false);
    });

    it('keeps regular internal fields available for the generic fallback renderer', () => {
        expect(isDashboardDynamicFallbackField('field_notes')).toBe(true);
    });
});
