<script setup lang="ts">
import type { Report } from '~~/types';
import { useShare } from '~/composables/features/useShare';

const { t } = useI18n();
const toast = useToast();

const props = defineProps<{
    report: Report
}>();

const {
    canNativeShare,
    detectNativeShare,
    buildReportUrl,
    shareNative,
    shareWhatsApp,
    shareX,
    shareFacebook,
    shareEmail
} = useShare();

onMounted(() => {
    detectNativeShare();
});

const handleNativeShare = async () => {
    await shareNative(props.report);
};

const handleCopyLink = async () => {
    const url = buildReportUrl(props.report);
    try {
        await navigator.clipboard.writeText(url);
        toast.add({
            id: 'link-copied',
            title: t('report.buttons.link_copied'),
            icon: 'i-heroicons-check-circle',
            color: 'success',
            duration: 2000
        });
    } catch {
        // Clipboard API not available or denied
    }
};

const dropdownItems = computed(() => [
    [
        {
            label: t('report.buttons.copy_link'),
            icon: 'i-heroicons-link',
            onSelect: handleCopyLink
        }
    ],
    [
        {
            label: 'WhatsApp',
            icon: 'i-simple-icons-whatsapp',
            to: shareWhatsApp(props.report),
            target: '_blank',
            external: true
        },
        {
            label: 'X',
            icon: 'i-simple-icons-x',
            to: shareX(props.report),
            target: '_blank',
            external: true
        },
        {
            label: 'Facebook',
            icon: 'i-simple-icons-facebook',
            to: shareFacebook(props.report),
            target: '_blank',
            external: true
        },
        {
            label: t('report.buttons.email', 'Email'),
            icon: 'i-heroicons-envelope',
            to: shareEmail(props.report),
            target: '_blank',
            external: true
        }
    ]
]);
</script>

<template>
  <!-- Mobile: native share API -->
  <UTooltip
    v-if="canNativeShare"
    :text="t('report.buttons.share')"
  >
    <UButton
      icon="i-heroicons-share"
      variant="ghost"
      color="neutral"
      size="sm"
      :aria-label="t('report.buttons.share')"
      @click="handleNativeShare"
    />
  </UTooltip>

  <!-- Desktop: dropdown with share options -->
  <UDropdownMenu
    v-else
    :items="dropdownItems"
    :content="{ align: 'start' }"
  >
    <UButton
      icon="i-heroicons-share"
      variant="ghost"
      color="neutral"
      size="sm"
      :aria-label="t('report.buttons.share')"
    />
  </UDropdownMenu>
</template>
