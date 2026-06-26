<script setup lang="ts">
/**
 * HazardBadge Component
 *
 * Displays a color-coded badge indicating the hazard level of a service request.
 * Supports levels 0-4 with appropriate icons and colors.
 */

interface Props {
    /** Hazard level (0-4) */
    level: number
    /** Badge size */
    size?: 'xs' | 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
    size: 'md'
});

/**
 * Configuration for each hazard level
 * Uses CAP (Common Alerting Protocol) severity terminology:
 * https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html
 */
const { t } = useI18n();

type NuxtUIColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

const config = computed(() => {
    const configs: Record<number, { labelKey: string, color: NuxtUIColor, icon: string }> = {
        0: { labelKey: 'hazard.levels.unknown', color: 'neutral', icon: '' },
        1: { labelKey: 'hazard.levels.minor', color: 'info', icon: 'i-heroicons-information-circle' },
        2: { labelKey: 'hazard.levels.moderate', color: 'warning', icon: 'i-heroicons-exclamation-triangle' },
        3: { labelKey: 'hazard.levels.severe', color: 'error', icon: 'i-heroicons-exclamation-circle' },
        4: { labelKey: 'hazard.levels.extreme', color: 'error', icon: 'i-heroicons-fire' }
    };
    const cfg = configs[props.level] ?? configs[0];
    return {
        ...cfg,
        label: t(cfg.labelKey)
    };
});
</script>

<template>
  <UBadge
    v-if="level > 0"
    :color="config.color"
    variant="soft"
    :size="size"
    class="gap-1"
  >
    <UIcon
      v-if="config.icon"
      :name="config.icon"
      class="size-4"
    />
    {{ config.label }}
  </UBadge>
</template>
