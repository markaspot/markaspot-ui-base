/**
 * ServiceRequestFormDialog unit tests.
 *
 * Target: handleSuccess, the terminal node of every citizen report. It parses
 * the create-response (legacy GeoReport shape, modern JSON:API shape, or a bare
 * id) into three pieces of UI state:
 *   1. currentRequestId  -> the moderation-notice id shown to the citizen
 *   2. hasVisibilityLimitations -> whether the "limited visibility" notice shows
 *   3. competition vs. success branch -> CompetitionForm only when the feature
 *      is enabled AND the citizen opted in (field_add_data) AND a uuid exists;
 *      otherwise the success state is shown and `success` is re-emitted upward.
 *
 * handleSuccess is component-internal (`<script setup>`), so we drive it by
 * emitting the child form's `success` event (the exact wiring the template uses:
 * `@success="handleSuccess"`). We then assert on the rendered success view
 * (request id text + visibility notice) and on the re-emitted `success` event,
 * which is the observable terminal contract. The four response shapes from the
 * audit are each fed in: (a) JSON:API data.attributes.request_id, (b) legacy
 * service_request_id, (c) data.id only, (d) empty object (N/A fallback).
 */
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { clearMockState } from '../../__mocks__/nuxt';

// The component imports useI18n directly from 'vue-i18n' (not the auto-import),
// which bypasses the global stub in setup.ts and would otherwise demand an
// installed i18n plugin. Mock the module so `t`/`te` return the key.
vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
        te: (_key: string) => true
    })
}));

// Import AFTER the vue-i18n mock so the component picks up the stub.
const { default: ServiceRequestFormDialog } = await import('../../../../app/components/report/ServiceRequestFormDialog.vue');

// ---------------------------------------------------------------------------
// Nuxt UI / child component stubs.
//
// UModal renders its #body slot inline (no Teleport-to-body in the assertion
// path) so wrapper.find() sees the success view. The child report forms are
// reduced to a button that re-emits `success` with the payload we hand it via a
// module-level holder; this is how we feed handleSuccess each response shape.
// ---------------------------------------------------------------------------
let pendingSuccessPayload: unknown = {};

const stubModal = defineComponent({
    name: 'UModal',
    props: { open: { type: Boolean, default: false } },
    emits: ['update:open', 'after:enter', 'after:leave'],
    setup(_props, { slots }) {
        return () => h('div', { 'data-testid': 'modal' }, [
            slots.body?.(),
            slots.footer?.()
        ]);
    }
});

const stubReportForm = (name: string) => defineComponent({
    name,
    emits: ['success', 'close'],
    setup(_props, { emit }) {
        return () => h('button', {
            'data-testid': 'emit-success',
            'onClick': () => emit('success', pendingSuccessPayload)
        });
    }
});

const stubPassthrough = (name: string) => defineComponent({
    name,
    setup(_props, { slots }) {
        return () => h('div', slots.default?.());
    }
});

const stubButton = defineComponent({
    name: 'UButton',
    emits: ['click'],
    setup(_props, { slots, emit }) {
        return () => h('button', { onClick: () => emit('click') }, slots.default?.());
    }
});

const stubIcon = defineComponent({ name: 'UIcon', setup: () => () => h('span') });

// Competition feature flag, toggled per test before mount.
let competitionEnabled = false;

function setCompetitionEnabled(enabled: boolean) {
    competitionEnabled = enabled;
}

function mountDialog() {
    return mount(ServiceRequestFormDialog, {
        props: { modelValue: true, type: 'classic' },
        global: {
            stubs: {
                UModal: stubModal,
                UButton: stubButton,
                UIcon: stubIcon,
                ClassicReportForm: stubReportForm('ClassicReportForm'),
                PhotoReportForm: stubReportForm('PhotoReportForm'),
                CompetitionForm: stubReportForm('CompetitionForm'),
                PrivacyNotice: stubPassthrough('PrivacyNotice'),
                ErrorBoundary: stubPassthrough('ErrorBoundary'),
                AppSpinner: stubIcon,
                Teleport: true
            }
        }
    });
}

/**
 * Feed `payload` into handleSuccess by clicking the stubbed report form's
 * success button, then wait a tick so the success view re-renders.
 */
async function fireSuccess(wrapper: ReturnType<typeof mountDialog>, payload: unknown) {
    pendingSuccessPayload = payload;
    await wrapper.find('[data-testid="emit-success"]').trigger('click');
    await wrapper.vm.$nextTick();
    return wrapper;
}

describe('ServiceRequestFormDialog handleSuccess (response parsing)', () => {
    beforeEach(() => {
        clearMockState();
        setActivePinia(createPinia());
        competitionEnabled = false;
        pendingSuccessPayload = {};

        // useMarkASpotConfig: only clientConfig.features.competition.enabled is read.
        vi.stubGlobal('useMarkASpotConfig', () => ({
            clientConfig: computed(() => ({
                features: {
                    competition: { enabled: competitionEnabled },
                    aiAnalysis: { enabled: false }
                }
            }))
        }));

        // useWorkspaceVisibility pulls in usePasswordlessAuth transitively; stub it
        // flat so canSubmit stays true and the open-guard watcher never closes us.
        vi.stubGlobal('useWorkspaceVisibility', () => ({
            canSubmit: computed(() => true)
        }));

        // useServiceRequestStore is auto-imported; the component reads formDraft
        // and calls saveFormDraft/clearFormDraft. A flat stub is enough.
        vi.stubGlobal('useServiceRequestStore', () => ({
            formDraft: null,
            saveFormDraft: vi.fn(),
            clearFormDraft: vi.fn()
        }));
    });

    // (a) Modern JSON:API shape: id lives in data.attributes.request_id.
    it('resolves the request id from JSON:API data.attributes.request_id', async () => {
        const wrapper = mountDialog();
        await fireSuccess(wrapper, {
            data: { id: 'uuid-1', attributes: { request_id: 'JSONAPI-123' } }
        });

        // Success branch reached -> id rendered in the moderation notice.
        expect(wrapper.text()).toContain('JSONAPI-123');
        // success re-emitted upward (terminal contract for the parent map).
        const emitted = wrapper.emitted('success');
        expect(emitted).toBeTruthy();
        expect(emitted?.at(-1)?.[0]).toMatchObject({
            data: { attributes: { request_id: 'JSONAPI-123' } }
        });
    });

    // (b) Legacy GeoReport shape: top-level service_request_id.
    it('resolves the request id from the legacy service_request_id field', async () => {
        const wrapper = mountDialog();
        await fireSuccess(wrapper, { service_request_id: 'LEGACY-77' });

        expect(wrapper.text()).toContain('LEGACY-77');
        expect(wrapper.emitted('success')).toBeTruthy();
    });

    // (c) Bare resource: only data.id present, no attributes / request_id.
    it('falls back to data.id when no request_id is present', async () => {
        const wrapper = mountDialog();
        await fireSuccess(wrapper, { data: { id: 'BARE-ID-9' } });

        expect(wrapper.text()).toContain('BARE-ID-9');
        expect(wrapper.emitted('success')).toBeTruthy();
    });

    // (d) Empty object: every id source missing -> "N/A" placeholder.
    it('uses the N/A fallback for an empty response object', async () => {
        const wrapper = mountDialog();
        await fireSuccess(wrapper, {});

        expect(wrapper.text()).toContain('N/A');
        expect(wrapper.emitted('success')).toBeTruthy();
    });

    // hasVisibilityLimitations: true branch (limited-visibility notice shows).
    it('shows the visibility-limitation notice when the flag is set', async () => {
        const wrapper = mountDialog();
        await fireSuccess(wrapper, {
            service_request_id: 'VIS-1',
            has_visibility_limitations: true
        });

        // i18n stub returns the key; the notice copy key is rendered only when
        // hasVisibilityLimitations resolved truthy.
        expect(wrapper.text()).toContain('success.visibility_limitation_notice');
    });

    // hasVisibilityLimitations: false branch. handleSuccess defaults the value
    // to `false` (not the initial ref(true)) when the response omits the flag,
    // so the notice must NOT render for a plain success response.
    it('hides the visibility-limitation notice when the flag is absent', async () => {
        const wrapper = mountDialog();
        await fireSuccess(wrapper, { service_request_id: 'VIS-2' });

        expect(wrapper.text()).not.toContain('success.visibility_limitation_notice');
    });

    // hasVisibilityLimitations sourced from the JSON:API attributes object.
    it('reads has_visibility_limitations from JSON:API attributes', async () => {
        const wrapper = mountDialog();
        await fireSuccess(wrapper, {
            data: {
                id: 'uuid-vis',
                attributes: { request_id: 'VIS-3', has_visibility_limitations: true }
            }
        });

        expect(wrapper.text()).toContain('success.visibility_limitation_notice');
    });

    // competition branch: feature OFF -> success path even if the citizen opted
    // in. CompetitionForm must NOT mount; success IS re-emitted.
    it('takes the success branch when the competition feature is disabled', async () => {
        setCompetitionEnabled(false);
        const wrapper = mountDialog();
        await fireSuccess(wrapper, {
            data: { id: 'uuid-c1', attributes: { request_id: 'COMP-OFF', field_add_data: true } }
        });

        expect(wrapper.findComponent({ name: 'CompetitionForm' }).exists()).toBe(false);
        expect(wrapper.emitted('success')).toBeTruthy();
    });

    // competition branch: feature ON + opted in (field_add_data) + uuid present
    // -> CompetitionForm mounts and `success` is deliberately withheld from the
    // parent (the dialog owns the next step).
    it('shows the competition form when enabled, opted in, and a uuid exists', async () => {
        setCompetitionEnabled(true);
        const wrapper = mountDialog();
        await fireSuccess(wrapper, {
            data: {
                id: 'uuid-comp',
                attributes: { request_id: 'COMP-ON', field_add_data: true, uuid: 'uuid-comp' }
            }
        });

        expect(wrapper.findComponent({ name: 'CompetitionForm' }).exists()).toBe(true);
        // Success is NOT emitted while the competition form is in flight.
        expect(wrapper.emitted('success')).toBeFalsy();
    });

    // competition branch: feature ON but the citizen did NOT opt in
    // (field_add_data falsy) -> success path, no competition form.
    it('skips the competition form when the citizen did not opt in', async () => {
        setCompetitionEnabled(true);
        const wrapper = mountDialog();
        await fireSuccess(wrapper, {
            data: { id: 'uuid-noopt', attributes: { request_id: 'COMP-NOOPT', field_add_data: false } }
        });

        expect(wrapper.findComponent({ name: 'CompetitionForm' }).exists()).toBe(false);
        expect(wrapper.emitted('success')).toBeTruthy();
    });
});
