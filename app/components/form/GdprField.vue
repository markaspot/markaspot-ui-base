<template>
  <div
    v-if="config"
    class="mb-4 overflow-hidden"
  >
    <!-- Use the standard UFormField structure but with proper labels -->
    <UFormField
      :error="error"
    >
      <div class="space-y-2">
        <UCheckbox
          :id="checkboxId"
          :model-value="modelValue"
          :required="isRequired"
          :label="`${t('form.gdpr') || config.label}${isRequired ? '*' : ''}`"
          :aria-describedby="descriptionId"
          @update:model-value="handleInput"
        />

        <!-- Use v-html for description now that the HTML comes pre-formatted correctly from Drupal -->
        <div
          :id="descriptionId"
          class="text-sm text-[var(--ui-text-muted)] ml-6"
          @click="handleLinkClick($event)"
          v-html="processedDescription"
        />
      </div>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
/**
 * GdprField Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';
import { sanitizeHtml } from '~/utils/sanitize';

const { t } = useI18n();

// Generate unique IDs for accessibility
const checkboxId = `gdpr-checkbox-${Math.random().toString(36).slice(2)}`;
const descriptionId = `gdpr-desc-${Math.random().toString(36).slice(2)}`;

const props = defineProps<{
    modelValue: boolean
    hasInteracted?: boolean
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'validation': [isValid: boolean]
}>();

const { settings } = useFormSettings();
const error = ref<string | null>(null);
const hasUserInteracted = ref(props.hasInteracted || false);

const config = computed(() => settings.value?.fields.field_gdpr);
const isRequired = computed(() => config.value?.required ?? false);

// Debug log

// Let's troubleshoot what properties are available
const availableFields = computed(() => {
    const fields = [];
    if (config.value) {
        for (const key in config.value) {
            fields.push(key);
        }
    }
    return fields;
});

// Process the description to make sure any links work properly
const processedDescription = computed(() => {
    // Prioritize i18n over config values
    const description = t('form.gdpr_description') || config.value?.description;

    return description ? sanitizeHtml(description) : '';
});

// Handle clicks on links with data-page attributes
const handleLinkClick = (event: MouseEvent) => {
    // Check if the click was on a link with data-page attribute
    const target = event.target as HTMLElement;

    if (target && target.tagName === 'A') {
    // Prevent default link behavior
        event.preventDefault();

        // Get the data-page attribute
        const pageName = target.getAttribute('data-page');

        if (pageName) {
            // Find the page with this name
            showPageByName(pageName);
        }
    }
};

const validate = (value: boolean) => {
    const isValid = !(isRequired.value && !value);

    // Only show errors if user has interacted with the field
    if (!isValid && hasUserInteracted.value) {
        error.value = t('validation.gdpr_required') || config.value?.validation_message;
    } else {
        error.value = null;
    }

    emit('validation', isValid);
    return isValid;
};

const handleInput = (value: boolean) => {
    hasUserInteracted.value = true; // Mark as interacted when user clicks checkbox
    emit('update:modelValue', value);
    validate(value);
};

// Create a reactive reference to store the page we want to show
const pageToShow = ref<any>(null);

// Try to inject the showPage method from index.vue
const showPageDirectly = inject<(page: any) => void>('showPage');
const emitter = useEmitter();

// Create a function to show page by name
const showPageByName = async (pageName: string) => {
    // First, search for the page
    const { pages, fetchPages } = usePages();

    // Make sure pages are loaded
    if (pages.value.length === 0) {
        await fetchPages();
    }

    // Search criteria based on the pageName
    let searchTerms: string[] = [];

    // Map common page names to potential title matches
    if (pageName === 'privacy') {
        searchTerms = ['privacy', 'datenschutz', 'datenschutzerkl'];
    } else if (pageName === 'terms') {
        searchTerms = ['terms', 'term', 'agb', 'bedingung'];
    } else {
        searchTerms = [pageName];
    }

    // Look for the page based on search terms
    const page = pages.value.find((page) => {
        const title = page.attributes.title.toLowerCase();
        return searchTerms.some(term => title.includes(term.toLowerCase()));
    });

    if (page) {
    // First try the direct method if available
        if (showPageDirectly) {
            showPageDirectly(page);
            return;
        }

        // Fallback to emitter
        emitter.emit('show-page', page);
    } else {
        console.warn(`Page with name '${pageName}' not found`);
        // Maybe show first page as fallback?
        if (pages.value.length > 0) {
            const firstPage = pages.value[0];

            if (showPageDirectly) {
                showPageDirectly(firstPage);
            } else {
                emitter.emit('show-page', firstPage);
            }
        }
    }
};

// Watch for external changes to hasInteracted
watch(() => props.hasInteracted, (newValue) => {
    if (newValue) {
        hasUserInteracted.value = true;
        validate(props.modelValue);
    }
});

// Watch for value changes and validate
watch(() => props.modelValue, (newValue) => {
    validate(newValue);
});
</script>

<style scoped>
/* Add some styling for proper display of the checkbox with rich HTML content */
:deep(a), :deep(.page-link) {
  color: var(--color-primary-500, #4f46e5);
  text-decoration: underline;
  cursor: pointer;
}

:deep(a:hover), :deep(.page-link:hover) {
  text-decoration: none;
}

/* Ensure proper alignment of the checkbox and text */
:deep(.form-checkbox-container) {
  align-items: flex-start;
}

:deep(.form-checkbox-label) {
  padding-top: 0;
}
</style>
