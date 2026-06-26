<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="relative h-dvh w-full bg-[var(--ui-bg)] flex">
    <Index :initial-request-id="route.params.id as string" />
  </div>
</template>

<script setup lang="ts" name="RequestDetailPage">
// Component name explicitly set with the name attribute above

import { useRoute } from 'vue-router';
import Index from '../index.vue';
// Auto-imported by Nuxt
// Auto-imported Nuxt routing helper
defineI18nRoute(false);

const route = useRoute();
const runtimeConfig = useRuntimeConfig();

// Fetch request data for OG meta tags (SSR-only fetch, lightweight)
const requestId = computed(() => route.params.id as string);

const { data: requestData } = await useAsyncData(
    `og-request-${requestId.value}`,
    async () => {
        if (!requestId.value) return null;

        try {
            const baseUrl = import.meta.server ? (runtimeConfig.public.apiBase || '') : '';
            const response = await $fetch<any>(
                `${baseUrl}/api/georeport/v2/requests/${requestId.value}.json`,
                { params: { extensions: 'true' } }
            );

            // Handle wrapped or array response formats
            if (response?.requests?.[0]) return response.requests[0];
            if (Array.isArray(response)) return response[0];
            return response;
        } catch {
            return null;
        }
    },
    { server: true, lazy: true }
);

// Dynamic OG meta tags for the report detail page
const ogTitle = computed(() => {
    const req = requestData.value;
    if (!req) return 'Report Detail';
    const parts = [req.service_name, req.address_string].filter(Boolean);
    return parts.join(' - ') || `Report ${requestId.value}`;
});

const ogDescription = computed(() => {
    const req = requestData.value;
    if (!req?.description) return '';
    // Truncate to 160 characters for OG description
    const desc = String(req.description);
    return desc.length > 160 ? desc.slice(0, 157) + '...' : desc;
});

const ogImage = computed(() => {
    const req = requestData.value;
    if (req?.media_url) {
        const url = String(req.media_url);
        // If media_url is a relative path, it will be resolved by the browser
        // For absolute URLs (from Drupal), use as-is
        if (url.startsWith('http')) return url;
        // Relative URLs need the API base for crawlers to resolve
        return url;
    }
    return '/images/og-image.webp';
});

useServerSeoMeta({
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard: 'summary_large_image'
});
</script>
