<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    type="button"
    :aria-label="label"
    :title="label"
    @click="$emit('click')"
  >
    <UIcon
      :name="icon"
      :class="iconClasses"
    />
    <span class="font-medium text-sm">
      {{ label }}
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
    type: 'photo' | 'classic' | 'confirm'
    icon: string
    label: string
    disabled?: boolean
    color?: 'blue' | 'purple' | 'green' | 'gray'
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    color: 'gray'
});

defineEmits<{
    click: []
}>();

const buttonClasses = computed(() => {
    const baseClasses = 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full';

    if (props.type === 'confirm') {
        return `${baseClasses} border-neutral-300 dark:border-neutral-600 bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:ring-gray-300 dark:focus:ring-gray-600`;
    }

    const colorClasses = {
        blue: 'border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-blue-300 dark:hover:border-blue-500 focus:ring-blue-300 dark:focus:ring-blue-600',
        purple: 'border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-purple-300 dark:hover:border-purple-500 focus:ring-purple-300 dark:focus:ring-purple-600',
        green: 'border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-green-300 dark:hover:border-green-500 focus:ring-green-300 dark:focus:ring-green-600',
        gray: 'border-neutral-300 dark:border-neutral-600 bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:ring-gray-300 dark:focus:ring-gray-600'
    };

    return `${baseClasses} ${colorClasses[props.color]}`;
});

const iconClasses = computed(() => {
    if (props.type === 'confirm') {
        return 'w-3 h-3 text-green-600 dark:text-green-400';
    }

    const colorClasses = {
        blue: 'w-4 h-4 text-blue-600 dark:text-blue-400',
        purple: 'w-4 h-4 text-purple-600 dark:text-purple-400',
        green: 'w-4 h-4 text-green-600 dark:text-green-400',
        gray: 'w-4 h-4 text-[var(--ui-text-muted)]'
    };

    return colorClasses[props.color];
});
</script>
