<template>
  <LegalPageLayout page-type="terms" />
</template>

<script setup lang="ts">
defineI18nRoute(false);

const { t } = useI18n();

useSeoMeta({
    title: t('legal.terms.title'),
    description: t('legal.terms.heading')
});
</script>
