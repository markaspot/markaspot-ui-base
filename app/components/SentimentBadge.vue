<script setup lang="ts">
/**
 * SentimentBadge Component
 *
 * Displays a color-coded badge indicating the sentiment of a service request.
 * Sentiment is determined by AI analysis of the request description.
 * Supports: frustrated, neutral, positive
 */

interface Props {
    /** Sentiment value from backend analysis */
    sentiment: 'frustrated' | 'neutral' | 'positive' | null
    /** Badge size */
    size?: 'xs' | 'sm' | 'md'
    /** Whether to show text label */
    showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    size: 'sm',
    showLabel: false
});

/**
 * Configuration for each sentiment
 */
const { t } = useI18n();

type NuxtUIColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

const config = computed(() => {
    const configs: Record<string, { labelKey: string, color: NuxtUIColor, icon: string }> = {
        frustrated: {
            labelKey: 'sentiment.frustrated',
            color: 'error',
            icon: 'i-lucide-frown'
        },
        neutral: {
            labelKey: 'sentiment.neutral',
            color: 'neutral',
            icon: 'i-lucide-meh'
        },
        positive: {
            labelKey: 'sentiment.positive',
            color: 'success',
            icon: 'i-lucide-smile'
        }
    };

    if (!props.sentiment) {
        return null;
    }

    const cfg = configs[props.sentiment];
    if (!cfg) {
        return null;
    }

    return {
        ...cfg,
        label: t(cfg.labelKey)
    };
});
</script>

<template>
  <UBadge
    v-if="config"
    :color="config.color"
    variant="soft"
    :size="size"
    class="gap-1"
  >
    <UIcon
      :name="config.icon"
      :class="{
        'size-3': size === 'xs',
        'size-3.5': size === 'sm',
        'size-4': size === 'md',
      }"
    />
    <span v-if="showLabel">{{ config.label }}</span>
  </UBadge>
</template>
