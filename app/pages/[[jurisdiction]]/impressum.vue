<template>
  <LegalPageLayout page-type="impressum" />
</template>

<script setup lang="ts">
defineI18nRoute(false);

const { t } = useI18n();

useSeoMeta({
    title: t('legal.impressum.title'),
    description: t('legal.impressum.heading')
});
</script>
