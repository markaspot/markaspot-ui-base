/**
 * MediaUploadField privacy hard-block tests (#473).
 *
 * The component renders an AI privacy warning when `privacyWarning.flag` is set
 * (no-blur fallback). When the tenant opts into the hard-block via the
 * `privacyBlockActive` prop:
 *   - the "continue with this photo" button is hidden (only "replace" remains)
 *   - the sharpened `report.ai.privacy.required` text is shown
 *
 * With the flag off the legacy behavior is byte-identical: both buttons render
 * and the standard `report.ai.privacy.description` text is shown.
 *
 * The upload composable is mocked: this test only exercises the privacy-banner
 * template branch, not the file-handling pipeline.
 */
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

// Mock vue-i18n: the component imports useI18n directly, bypassing the global
// stub. Render the key (with params spelled out) so assertions can match.
vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string, params?: Record<string, unknown>) =>
            params ? `${key}:${JSON.stringify(params)}` : key
    })
}));

// Mock the upload composable: the privacy banner branch does not depend on any
// of its behavior, only on its presence. Return minimal reactive stand-ins.
vi.mock('@/composables/form/useMediaUpload', () => ({
    UPLOAD_ERRORS: { LIMIT_REACHED: 'errors.upload.limit_reached' },
    useMediaUpload: () => ({
        fileInput: ref(null),
        uploadArea: ref(null),
        isDragging: ref(false),
        uploadedMedia: ref([]),
        errors: ref([]),
        hasUserInteracted: ref(false),
        rateLimitMessage: ref(''),
        isUploading: ref(false),
        overallProgress: ref(0),
        isAIEnabled: ref(false),
        isAndroid: ref(false),
        uploadStatusAnnouncement: ref(''),
        aiStatusAnnouncement: ref(''),
        finalResultsAnnouncement: ref(''),
        maxFiles: ref(3),
        uploadAreaId: ref('upload-area-test'),
        fileInputId: ref('file-input-test'),
        handleDragEnter: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragLeave: vi.fn(),
        handleDrop: vi.fn(),
        handleFileSelect: vi.fn(),
        triggerFileInput: vi.fn(),
        removeImage: vi.fn(),
        retryUpload: vi.fn(),
        announceAIStart: vi.fn(),
        announceAIComplete: vi.fn(),
        announceUploadResult: vi.fn()
    })
}));

const { default: MediaUploadField } = await import('../../../../app/components/form/MediaUploadField.vue');

// Stub Nuxt UI components. UButton renders its default slot inside a real
// <button> so we can count/find the continue vs. replace actions.
const UButton = defineComponent({
    name: 'UButton',
    emits: ['click'],
    setup(_props, { slots, emit }) {
        return () => h('button', { type: 'button', onClick: () => emit('click') }, slots.default?.());
    }
});

const UAlert = defineComponent({
    name: 'UAlert',
    props: {
        color: { type: String, default: '' },
        role: { type: String, default: undefined }
    },
    setup(props, { slots }) {
        return () => h('div', {
            'class': 'u-alert',
            'data-color': props.color,
            'role': props.role
        }, [slots.title?.(), slots.description?.()]);
    }
});

const passthrough = (name: string) => defineComponent({
    name,
    setup(_props, { slots }) {
        return () => h('div', slots.default?.());
    }
});

const UFormField = defineComponent({
    name: 'UFormField',
    setup(_props, { slots }) {
        return () => h('div', [slots.default?.(), slots.error?.()]);
    }
});

const stubs = {
    UButton,
    UAlert,
    UFormField,
    UIcon: passthrough('UIcon'),
    UPopover: passthrough('UPopover'),
    AppSpinner: passthrough('AppSpinner'),
    Transition: false
};

const mountField = (props: Record<string, unknown>) =>
    mount(MediaUploadField, {
        props: {
            uploadedMedia: [],
            ...props
        },
        global: {
            stubs,
            mocks: {
                useMediaUpload: undefined
            }
        }
    });

// Auto-imported helpers used in <script setup> that are not provided by the
// test runtime.
vi.stubGlobal('toRef', (obj: any, key: string) => computed(() => obj[key]));

const activeWarning = { flag: true, issues: ['face'] };

describe('MediaUploadField privacy hard-block (#473)', () => {
    it('shows both replace and continue buttons when not blocking', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: false
        });
        const buttons = wrapper.findAll('button');
        const labels = buttons.map(b => b.text());
        expect(labels).toContain('report.ai.privacy.replace');
        expect(labels).toContain('report.ai.privacy.understood');
        // Legacy description text, not the sharpened required text.
        expect(wrapper.text()).toContain('report.ai.privacy.description');
        expect(wrapper.text()).not.toContain('report.ai.privacy.required');
    });

    it('hides the continue button when blocking', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: true
        });
        const labels = wrapper.findAll('button').map(b => b.text());
        expect(labels).toContain('report.ai.privacy.replace');
        expect(labels).not.toContain('report.ai.privacy.understood');
    });

    it('uses the sharpened required text when blocking', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: true
        });
        expect(wrapper.text()).toContain('report.ai.privacy.required');
        expect(wrapper.text()).not.toContain('report.ai.privacy.description');
    });

    it('does not emit dismiss-privacy when blocking (no continue button to click)', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: true
        });
        const continueButton = wrapper.findAll('button').find(b => b.text() === 'report.ai.privacy.understood');
        expect(continueButton).toBeUndefined();
        expect(wrapper.emitted('dismiss-privacy')).toBeUndefined();
    });

    it('shows a remove-photo recovery button when blocking and emits remove-media', async () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: true
        });
        const removeButton = wrapper.findAll('button').find(b => b.text() === 'report.ai.privacy.removePhoto');
        expect(removeButton).toBeDefined();
        await removeButton!.trigger('click');
        expect(wrapper.emitted('remove-media')).toBeTruthy();
    });

    it('does not show the remove-photo button in advisory (non-block) mode', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: false
        });
        const labels = wrapper.findAll('button').map(b => b.text());
        expect(labels).not.toContain('report.ai.privacy.removePhoto');
    });

    it('escalates the banner to error color and role=alert when blocking (U3)', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: true
        });
        const alert = wrapper.find('.u-alert');
        expect(alert.attributes('data-color')).toBe('error');
        expect(alert.attributes('role')).toBe('alert');
    });

    it('keeps the advisory banner at warning color without role=alert', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: false
        });
        const alert = wrapper.find('.u-alert');
        expect(alert.attributes('data-color')).toBe('warning');
        expect(alert.attributes('role')).toBeUndefined();
    });

    it('swaps the sr-only live region to required text and assertive in block mode', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: true
        });
        const region = wrapper.find('#privacy-warning-announcements');
        expect(region.exists()).toBe(true);
        expect(region.attributes('aria-live')).toBe('assertive');
        expect(region.attributes('role')).toBe('alert');
        expect(region.text()).toContain('report.ai.privacy.required');
    });

    it('keeps the sr-only live region polite with advisory text when not blocking', () => {
        const wrapper = mountField({
            privacyWarning: activeWarning,
            privacyBlockActive: false
        });
        const region = wrapper.find('#privacy-warning-announcements');
        expect(region.attributes('aria-live')).toBe('polite');
        expect(region.attributes('role')).toBe('status');
        expect(region.text()).toContain('report.ai.privacy.description');
    });

    it('renders no privacy banner when there is no active warning', () => {
        const wrapper = mountField({
            privacyWarning: null,
            privacyBlockActive: true
        });
        expect(wrapper.text()).not.toContain('report.ai.privacy.replace');
        expect(wrapper.text()).not.toContain('report.ai.privacy.required');
    });
});
