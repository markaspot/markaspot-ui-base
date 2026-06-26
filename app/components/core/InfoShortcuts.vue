<template>
  <ul
    v-if="actions.length"
    class="info-shortcuts grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 list-none p-0"
    :aria-label="t('info.shortcuts.aria_label')"
  >
    <li
      v-for="action in actions"
      :key="action.id"
      class="h-full"
    >
      <button
        type="button"
        class="info-shortcut group w-full h-full flex items-start gap-3 text-left p-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] hover:border-[var(--ui-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors cursor-pointer"
        :aria-label="action.ariaLabel"
        :data-action="action.id"
        @click="handleClick(action.id)"
      >
        <UIcon
          :name="action.icon"
          class="size-5 shrink-0 text-[var(--ui-primary)] mt-0.5"
          aria-hidden="true"
        />
        <span class="flex flex-col min-w-0 flex-1">
          <span class="text-sm font-medium text-[var(--ui-text)] truncate">
            {{ action.title }}
          </span>
          <span class="text-xs text-[var(--ui-text-muted)] mt-0.5">
            {{ action.description }}
          </span>
        </span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * InfoShortcuts Component
 *
 * Real, focusable shortcut buttons inside the Info tab. Replaces the inert
 * StaticText list pattern that suggested interactivity but had no click
 * handlers. Each item dispatches a typed shortcut event so the parent can
 * wire it to the matching flow (open report modal / switch tabs).
 *
 * Closes #404.
 */

const { t } = useI18n();

interface Props {
    /** Disable photo shortcut (e.g. when photoReporting feature flag is off) */
    photoEnabled?: boolean
    /** Disable classic shortcut (e.g. when classicReporting feature flag is off) */
    classicEnabled?: boolean
    /** Disable explore (list) shortcut */
    listEnabled?: boolean
    /** Disable follow shortcut (e.g. when following tab is disabled) */
    followingEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    photoEnabled: true,
    classicEnabled: true,
    listEnabled: true,
    followingEnabled: true
});

type ShortcutId = 'photo' | 'classic' | 'following' | 'list';

const emit = defineEmits<{
    shortcut: [id: ShortcutId]
}>();

interface Action {
    id: ShortcutId
    icon: string
    title: string
    description: string
    ariaLabel: string
}

const actions = computed<Action[]>(() => {
    const all: Array<Action & { enabled: boolean }> = [
        {
            id: 'photo',
            icon: 'i-heroicons-camera',
            title: t('info.shortcuts.photo.title'),
            description: t('info.shortcuts.photo.description'),
            ariaLabel: t('info.shortcuts.photo.aria_label'),
            enabled: props.photoEnabled
        },
        {
            id: 'classic',
            icon: 'i-heroicons-pencil-square',
            title: t('info.shortcuts.classic.title'),
            description: t('info.shortcuts.classic.description'),
            ariaLabel: t('info.shortcuts.classic.aria_label'),
            enabled: props.classicEnabled
        },
        {
            id: 'following',
            icon: 'i-heroicons-star',
            title: t('info.shortcuts.following.title'),
            description: t('info.shortcuts.following.description'),
            ariaLabel: t('info.shortcuts.following.aria_label'),
            enabled: props.followingEnabled
        },
        {
            id: 'list',
            icon: 'i-heroicons-map',
            title: t('info.shortcuts.list.title'),
            description: t('info.shortcuts.list.description'),
            ariaLabel: t('info.shortcuts.list.aria_label'),
            enabled: props.listEnabled
        }
    ];
    return all.filter(a => a.enabled);
});

const handleClick = (id: ShortcutId) => {
    emit('shortcut', id);
};
</script>
