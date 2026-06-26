<template>
  <div
    v-if="categoryDescriptionsEnabled && (loading || (description && typeof description === 'string' && description.trim() !== ''))"
    class="category-description mt-1"
  >
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center space-x-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm"
    >
      <AppSpinner
        size="sm"
        class="text-primary-500"
      />
      <span>{{ $t('form.category_description_loading') }}</span>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md text-sm text-red-500"
    >
      {{ $t('form.category_description_error') }}
    </div>

    <!-- Description Content -->
    <div
      v-else
      class="flex items-start gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md"
    >
      <UIcon
        name="i-heroicons-information-circle"
        class="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
      />
      <div class="flex-1 min-w-0">
        <div
          ref="contentRef"
          :class="[
            'text-sm text-[var(--ui-text)] font-medium',
            'category-description-content',
            { 'line-clamp-3': !isExpanded && isLongDescription },
          ]"
          v-html="description"
        />
        <button
          v-if="isLongDescription"
          type="button"
          class="mt-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors inline-flex items-center gap-1"
          @click="isExpanded = !isExpanded"
        >
          <span>{{ isExpanded ? $t('common.show_less') : $t('common.show_more') }}</span>
          <UIcon
            :name="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
            class="w-3 h-3"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CategoryDescription Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';
import { sanitizeRichHtml } from '~/utils/sanitize';

const props = defineProps<{
    categoryId: string
}>();

const emit = defineEmits<{
    'update:disabled': [value: boolean]
    'update:disableMediaUpload': [value: boolean]
}>();

const { t } = useI18n();
const description = ref('');
const loading = ref(false);
const error = ref(false);
const apiClient = useApiClient();
const { clientConfig } = useMarkASpotConfig();

// Collapsible state
const isExpanded = ref(false);
const isLongDescription = ref(false);
const contentRef = ref<HTMLElement | null>(null);

// Track current request to prevent duplicate requests (shared across instances)
let currentRequest: Promise<any> | null = null;
let currentCategoryId: string | null = null;

// Check if category descriptions are enabled in client config
const categoryDescriptionsEnabled = computed(() => {
    return clientConfig.value.features?.categoryDescriptions?.enabled === true;
});

// Get the configured endpoint or use default (without /api prefix as apiClient adds it)
const categoryDescriptionsEndpoint = computed(() => {
    const endpoint = clientConfig.value.features?.categoryDescriptions?.endpoint || '/api/markaspotshstweak';
    // Remove /api prefix if present since apiClient.get() adds it automatically
    return endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
});

// Check if description text is long enough to need collapsing (> 3 lines)
const checkDescriptionLength = () => {
    if (!contentRef.value) {
        isLongDescription.value = false;
        return;
    }

    const lineHeight = parseFloat(getComputedStyle(contentRef.value).lineHeight);
    const height = contentRef.value.scrollHeight;
    const lines = Math.round(height / lineHeight);

    // If more than 3 lines, enable collapsing
    isLongDescription.value = lines > 3;
};

// This component now uses the UUID directly with the backend

// HTML sanitization delegated to shared DOMPurify utility (sanitizeRichHtml)

// Decode JSON-escaped HTML entities
const decodeHTMLEntities = (text: string): string => {
    if (typeof text !== 'string') return String(text);

    return text
        .replace(/\\u003C/g, '<')
        .replace(/\\u003E/g, '>')
        .replace(/\\u0026/g, '&')
        .replace(/\\"/g, '"')
        .replace(/\\\//g, '/');
};

// Process API response and update component state
const processApiResponse = (responseData: any) => {
    try {
        let descriptionText = '';
        let formOptions = null;

        // Normalize response data to extract description and options
        if (typeof responseData === 'object' && responseData !== null) {
            if ('description' in responseData) {
                // New format: { description: string, options?: object }
                descriptionText = responseData.description || '';
                formOptions = responseData.options;
            } else if ('data' in responseData) {
                // Legacy format: { data: string, options?: object }
                descriptionText = responseData.data || '';
                formOptions = responseData.options;
            } else {
                // Unknown object format
                console.warn('CategoryDescription: Unknown response format', responseData);
                descriptionText = JSON.stringify(responseData);
            }
        } else if (typeof responseData === 'string') {
            // Try to parse as JSON first
            try {
                const parsed = JSON.parse(responseData);
                return processApiResponse(parsed); // Recursive call with parsed data
            } catch {
                // Not JSON, treat as HTML content
                descriptionText = responseData;
            }
        } else {
            // Fallback for other types
            descriptionText = String(responseData);
        }

        // Process and sanitize description text
        if (descriptionText) {
            descriptionText = decodeHTMLEntities(descriptionText);
            descriptionText = sanitizeRichHtml(descriptionText);
        }

        description.value = descriptionText;

        // Check if description is long enough to need collapsing
        // Use double nextTick to ensure DOM is fully rendered
        nextTick(() => {
            nextTick(() => {
                checkDescriptionLength();
            });
        });

        // Handle form disable options
        if (formOptions && typeof formOptions === 'object') {
            if (typeof formOptions.disableForm === 'boolean') {
                emit('update:disabled', formOptions.disableForm);
            }

            if (typeof formOptions.disableMediaUpload === 'boolean') {
                emit('update:disableMediaUpload', formOptions.disableMediaUpload);
            } else if (formOptions.disableForm) {
                // Default: disable media upload when form is disabled
                emit('update:disableMediaUpload', true);
            }
        }

        error.value = false;
    } catch (processingError) {
        console.error('CategoryDescription: Error processing API response', processingError);
        description.value = '';
        error.value = true;
        emit('update:disabled', false);
        emit('update:disableMediaUpload', false);
    }
};

// Fetch the category description when the category ID changes
const fetchCategoryDescription = async (categoryId: string) => {
    // Reset state when no category or feature disabled
    if (!categoryId || !categoryDescriptionsEnabled.value) {
        description.value = '';
        loading.value = false;
        error.value = false;
        currentCategoryId = null;
        emit('update:disabled', false);
        emit('update:disableMediaUpload', false);
        return;
    }

    // Prevent duplicate requests for the same category
    if (currentCategoryId === categoryId && currentRequest) {
        try {
            await currentRequest; // Wait for existing request to complete
            return;
        } catch (existingError) {
            // If existing request failed, proceed with new request
            console.warn('CategoryDescription: Previous request failed, retrying for category', categoryId);
        }
    }

    currentCategoryId = categoryId;
    loading.value = true;
    error.value = false;

    // Clear previous description but keep form enabled during loading
    description.value = '';
    emit('update:disabled', false);
    emit('update:disableMediaUpload', false);

    try {
        const endpoint = `${categoryDescriptionsEndpoint.value}/${categoryId}/0`;

        // Create request with timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        currentRequest = apiClient.get(endpoint, {
            signal: controller.signal as any
        });

        const responseData = await currentRequest;
        clearTimeout(timeoutId);

        // Process successful response
        processApiResponse(responseData);
    } catch (fetchError: unknown) {
        console.error('CategoryDescription: Failed to fetch description for category', categoryId, fetchError);

        // Handle different error types
        if (fetchError && typeof fetchError === 'object' && 'name' in fetchError && fetchError.name === 'AbortError') {
            console.warn('CategoryDescription: Request timeout for category', categoryId);
            error.value = false; // Don't show error UI for timeouts
        } else if (fetchError && typeof fetchError === 'object' && 'status' in fetchError && fetchError.status === 404) {
            // Category description not found - this is normal, don't show error
            error.value = false;
        } else if (fetchError && typeof fetchError === 'object' && 'status' in fetchError && typeof fetchError.status === 'number' && fetchError.status >= 500) {
            // Server error - show error state
            error.value = true;
        } else {
            // Client error or network error - handle gracefully
            error.value = false;
        }

        // Clear description and ensure form remains usable
        description.value = '';
        emit('update:disabled', false);
        emit('update:disableMediaUpload', false);
    } finally {
        loading.value = false;
        currentRequest = null;
    }
};

// Fetch description on component mount if a category ID is provided and feature is enabled
onMounted(() => {
    if (props.categoryId && categoryDescriptionsEnabled.value) {
        fetchCategoryDescription(props.categoryId);
    }
});

// Watch for changes to categoryId when feature is enabled
watch(() => props.categoryId, (newCategoryId) => {
    if (newCategoryId && categoryDescriptionsEnabled.value) {
        fetchCategoryDescription(newCategoryId);
    } else {
        description.value = '';
        loading.value = false;
        error.value = false;
        // Ensure form is enabled when no category ID
        emit('update:disabled', false);
        emit('update:disableMediaUpload', false);
    }
}, { immediate: false }); // Changed to false since we handle the initial fetch in onMounted

// Cleanup on component unmount
onUnmounted(() => {
    currentRequest = null;
    currentCategoryId = null;
});
</script>

<style scoped>
.category-description :deep(p) {
  margin-bottom: 0.5rem;
}

.category-description :deep(p:last-child) {
  margin-bottom: 0;
}

.category-description :deep(a) {
  color: var(--color-primary-600);
  text-decoration: underline;
}

.category-description :deep(a:hover) {
  text-decoration: none;
}

.category-description :deep(ul),
.category-description :deep(ol) {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.category-description :deep(li) {
  margin-bottom: 0.25rem;
}
</style>
