<template>
  <LegalPageLayout page-type="privacy" />
</template>

<script setup lang="ts">
defineI18nRoute(false);

const { t } = useI18n();

useSeoMeta({
    title: t('legal.privacy.title'),
    description: t('legal.privacy.heading')
});
</script>
