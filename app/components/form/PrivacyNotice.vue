<template>
  <p
    v-if="isEnabled"
    class="text-sm text-[var(--ui-text-muted)] mb-4"
  >
    {{ t('privacy.notice_text') }}&nbsp;<PrivacyModal v-if="isModalMode">
      <button
        type="button"
        class="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline cursor-pointer"
      >
        {{ t('privacy.notice_link_text') }}
      </button>
    </PrivacyModal><NuxtLink
      v-else
      :to="privacyLink"
      class="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline"
      :external="isExternalLink"
      :target="isExternalLink ? '_blank' : undefined"
      :rel="isExternalLink ? 'noopener noreferrer' : undefined"
    >{{ t('privacy.notice_link_text') }}</NuxtLink>
  </p>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import PrivacyModal from '@/components/form/PrivacyModal.vue';

const { t } = useI18n();
const { privacyNoticeEnabled, privacyNoticeModal, privacyNoticeLink } = useFeatureFlags();

const isEnabled = privacyNoticeEnabled;

const isModalMode = privacyNoticeModal;

const privacyLink = computed(() => privacyNoticeLink.value || '/datenschutz');

// Check if link is external (starts with http/https)
const isExternalLink = computed(() => {
    return privacyLink.value.startsWith('http');
});
</script>
