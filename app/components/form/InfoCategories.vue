<template>
  <div
    v-if="infoContent"
    class="mb-4 p-4 border rounded-md bg-neutral-50 dark:bg-neutral-800"
  >
    <div v-html="infoContent" />
  </div>
</template>

<script setup lang="ts">
/**
 * InfoCategories Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';
import { useRuntimeConfig } from '#app';

const { t } = useI18n();

const props = defineProps<{
    categoryId: string
}>();

const emit = defineEmits<{
    'update:disabled': [value: boolean]
}>();

const { clientConfig } = useMarkASpotConfig();
const { categories, fetchCategories } = useCategories();
const shouldDisableForm = ref(false);

// Handle form disabled state independently of computed
function updateDisabledState(disabled: boolean): void {
    if (shouldDisableForm.value !== disabled) {
        shouldDisableForm.value = disabled;
        emit('update:disabled', disabled);
    }
}

// Ensure categories are fetched when component mounts
onMounted(async () => {
    if (categories.value.length === 0) {
        await fetchCategories();
    }
});

// Also re-fetch when categoryId changes
watch(() => props.categoryId, async () => {
    if (categories.value.length === 0) {
        await fetchCategories();
    }
});

// Get the infoCategories config from the client config
const infoCategories =
    (clientConfig.value.features as any)?.infoCategories || [];

// Find the info text for the current category
const infoContent = computed(() => {
    if (!props.categoryId) {
        // Reset disabled state if no category
        updateDisabledState(false);
        return null;
    }

    // Find the category to get the term ID
    const cat = categories.value.find(c => c.id === props.categoryId);
    if (!cat) return null;

    // Get the internal taxonomy term ID
    const tid = (cat.attributes as any)?.drupal_internal__tid;
    if (tid == null) return null;

    // Try to get i18n info content for this category first
    const i18nKey = `categories.${tid}.info`;
    const translatedInfo = t(i18nKey);

    // If we have a valid translation (not the same as the key), use it
    if (translatedInfo !== i18nKey) {
        // Also check for disabled state from i18n
        const disableFormKey = `categories.${tid}.disableForm`;
        const disableForm = t(disableFormKey) === 'true';
        updateDisabledState(disableForm);
        return translatedInfo;
    }

    // Fallback to runtime config if no translation
    const categoryInfo = infoCategories.find(item => item[0] === String(tid));

    if (!categoryInfo) {
        // Reset disabled state if no info found
        updateDisabledState(false);
        return null;
    }

    // Check if this category should disable the form
    const disableForm = categoryInfo[2]?.disableForm || false;

    // Update disabled state
    updateDisabledState(disableForm);

    return categoryInfo[1];
});
</script>
