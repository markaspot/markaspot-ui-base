/**
 * InfoShortcuts unit tests (issue #404)
 *
 * Verifies that the four Info-tab list items render as real, focusable
 * <button> elements (not StaticText), expose locale-reactive aria-labels,
 * and emit the correct typed `shortcut` event when clicked. Also covers the
 * feature-flag gating: each shortcut hides when its corresponding *Enabled
 * prop is false.
 */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';

import InfoShortcuts from '../../../../app/components/core/InfoShortcuts.vue';

const UIcon = defineComponent({
    name: 'UIcon',
    props: { name: { type: String, default: '' } },
    setup(props) {
        return () => h('span', { 'data-icon': props.name });
    }
});

const mountShortcuts = (props: Record<string, unknown> = {}) =>
    mount(InfoShortcuts, {
        props,
        global: { stubs: { UIcon } }
    });

describe('InfoShortcuts (#404)', () => {
    it('renders four real <button> elements by default', () => {
        const wrapper = mountShortcuts();
        const buttons = wrapper.findAll('button');
        expect(buttons).toHaveLength(4);
        // Each button is a real <button> (focusable, has type="button"),
        // not a StaticText / div.
        buttons.forEach((btn) => {
            expect(btn.element.tagName).toBe('BUTTON');
            expect(btn.attributes('type')).toBe('button');
        });
    });

    it('exposes a locale-reactive aria-label on each shortcut', () => {
        const wrapper = mountShortcuts();
        const buttons = wrapper.findAll('button');
        // Stub useI18n echoes the key, so we can assert which key drives each
        // aria-label without coupling to actual translation strings.
        expect(buttons[0]!.attributes('aria-label')).toBe('info.shortcuts.photo.aria_label');
        expect(buttons[1]!.attributes('aria-label')).toBe('info.shortcuts.classic.aria_label');
        expect(buttons[2]!.attributes('aria-label')).toBe('info.shortcuts.following.aria_label');
        expect(buttons[3]!.attributes('aria-label')).toBe('info.shortcuts.list.aria_label');
    });

    it('uses native <ul>/<li> markup with a localized list aria-label', () => {
        const wrapper = mountShortcuts();
        const list = wrapper.find('ul.info-shortcuts');
        expect(list.exists()).toBe(true);
        // The list aria-label keeps the four shortcuts grouped semantically.
        expect(list.attributes('aria-label')).toBe('info.shortcuts.aria_label');
        // Keeping native list markup means each <button> retains its
        // implicit button role for AT users (vs. role="listitem" override).
        expect(wrapper.findAll('ul.info-shortcuts > li')).toHaveLength(4);
    });

    it('tags each button with data-action so e2e/click handlers can target it', () => {
        const wrapper = mountShortcuts();
        const ids = wrapper.findAll('button').map(b => b.attributes('data-action'));
        expect(ids).toEqual(['photo', 'classic', 'following', 'list']);
    });

    it('emits shortcut("photo") when the Foto button is clicked', async () => {
        const wrapper = mountShortcuts();
        await wrapper.find('button[data-action="photo"]').trigger('click');
        expect(wrapper.emitted('shortcut')).toEqual([['photo']]);
    });

    it('emits shortcut("classic") when the Klassisch button is clicked', async () => {
        const wrapper = mountShortcuts();
        await wrapper.find('button[data-action="classic"]').trigger('click');
        expect(wrapper.emitted('shortcut')).toEqual([['classic']]);
    });

    it('emits shortcut("following") when the Verfolgen button is clicked', async () => {
        const wrapper = mountShortcuts();
        await wrapper.find('button[data-action="following"]').trigger('click');
        expect(wrapper.emitted('shortcut')).toEqual([['following']]);
    });

    it('emits shortcut("list") when the Erkunden button is clicked', async () => {
        const wrapper = mountShortcuts();
        await wrapper.find('button[data-action="list"]').trigger('click');
        expect(wrapper.emitted('shortcut')).toEqual([['list']]);
    });

    it('hides the photo shortcut when photoEnabled is false', () => {
        const wrapper = mountShortcuts({ photoEnabled: false });
        const ids = wrapper.findAll('button').map(b => b.attributes('data-action'));
        expect(ids).toEqual(['classic', 'following', 'list']);
    });

    it('hides the classic shortcut when classicEnabled is false', () => {
        const wrapper = mountShortcuts({ classicEnabled: false });
        const ids = wrapper.findAll('button').map(b => b.attributes('data-action'));
        expect(ids).toEqual(['photo', 'following', 'list']);
    });

    it('hides the following shortcut when followingEnabled is false', () => {
        const wrapper = mountShortcuts({ followingEnabled: false });
        const ids = wrapper.findAll('button').map(b => b.attributes('data-action'));
        expect(ids).toEqual(['photo', 'classic', 'list']);
    });

    it('hides the explore shortcut when listEnabled is false', () => {
        const wrapper = mountShortcuts({ listEnabled: false });
        const ids = wrapper.findAll('button').map(b => b.attributes('data-action'));
        expect(ids).toEqual(['photo', 'classic', 'following']);
    });

    it('renders nothing when every shortcut is disabled', () => {
        const wrapper = mountShortcuts({
            photoEnabled: false,
            classicEnabled: false,
            followingEnabled: false,
            listEnabled: false
        });
        expect(wrapper.findAll('button')).toHaveLength(0);
    });
});
