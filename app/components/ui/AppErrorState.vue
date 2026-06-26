<template>
  <div
    :class="[
      'flex flex-col items-center justify-center text-center p-8',
      fullHeight ? 'flex-1' : '',
    ]"
  >
    <UIcon
      :name="icon"
      :class="['mb-4', iconClass]"
    />
    <h3
      v-if="title"
      class="text-lg font-medium text-[var(--ui-text)] mb-2"
    >
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="text-[var(--ui-text-muted)] max-w-sm mb-4"
    >
      {{ description }}
    </p>
    <UButton
      v-if="showRetry"
      color="primary"
      variant="soft"
      :loading="retrying"
      @click="$emit('retry')"
    >
      <template #leading>
        <UIcon
          name="i-lucide-refresh-cw"
          class="w-4 h-4"
        />
      </template>
      {{ retryText || defaultRetryText }}
    </UButton>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

withDefaults(defineProps<{
    icon?: string
    iconClass?: string
    title?: string
    description?: string
    showRetry?: boolean
    retrying?: boolean
    retryText?: string
    fullHeight?: boolean
}>(), {
    icon: 'i-lucide-alert-circle',
    iconClass: 'w-12 h-12 text-red-600 dark:text-red-400',
    showRetry: true,
    retrying: false,
    retryText: undefined,
    fullHeight: false
});

defineEmits<{
    retry: []
}>();

const defaultRetryText = computed(() => t('errors.page.action_retry'));
</script>
