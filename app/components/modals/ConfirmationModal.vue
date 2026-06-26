<template>
  <Teleport to="body">
    <UModal
      v-model:open="isOpen"
      :title="t('confirm.page.title')"
      :close="true"
      aria-modal="true"
      :ui="{
        content: 'z-[70] pt-safe pb-safe',
        overlay: 'fixed inset-0',
      }"
      @open="handleModalOpen"
      @close="handleClose"
    >
      <template #description>
        <p class="sr-only">
          {{ t('confirm.page.description') }}
        </p>
      </template>

      <!-- Modal content -->
      <template #body>
        <div class="p-6 pt-2">
          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="text-center py-8"
          >
            <AppSpinner
              size="xl"
              class="mx-auto text-primary-500 mb-4"
            />
            <p class="text-[var(--ui-text-muted)]">
              {{ t('confirm.loading.message') }}
            </p>
          </div>

          <!-- Success State -->
          <div
            v-else-if="confirmationResult === 'success'"
            class="text-center py-8"
          >
            <UIcon
              name="i-heroicons-check-circle"
              class="w-12 h-12 mx-auto text-green-500 mb-4"
            />
            <p class="text-[var(--ui-text-muted)]">
              {{ successMessage || t('confirm.success.message') }}
            </p>

            <div class="flex justify-center mt-6">
              <UButton
                color="primary"
                size="lg"
                @click="handleClose"
              >
                {{ t('confirm.success.button') }}
              </UButton>
            </div>
          </div>

          <!-- Error State -->
          <div
            v-else-if="confirmationResult === 'error'"
            class="text-center py-8"
          >
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-12 h-12 mx-auto text-red-500 mb-4"
            />
            <p class="text-[var(--ui-text-muted)]">
              {{ errorMessage || t('confirm.error.message') }}
            </p>

            <div class="flex justify-center mt-6">
              <UButton
                color="neutral"
                size="lg"
                @click="handleClose"
              >
                {{ t('common.close') }}
              </UButton>
            </div>
          </div>

          <!-- Not Found State -->
          <div
            v-else-if="confirmationResult === 'not_found'"
            class="text-center py-8"
          >
            <UIcon
              name="i-heroicons-question-mark-circle"
              class="w-12 h-12 mx-auto text-neutral-400 mb-4"
            />
            <p class="text-[var(--ui-text-muted)]">
              {{ t('confirm.not_found.message') }}
            </p>

            <div class="flex justify-center mt-6">
              <UButton
                color="neutral"
                size="lg"
                @click="handleClose"
              >
                {{ t('common.close') }}
              </UButton>
            </div>
          </div>

          <!-- Confirmation Form -->
          <div
            v-else
            class="space-y-6"
          >
            <p class="text-[var(--ui-text)]">
              {{ t('confirm.page.description') }}
            </p>

            <!-- Confirmation Checkbox -->
            <UCheckbox
              v-model="isConfirmed"
              :label="t('confirm.checkbox.label')"
              :description="t('confirm.checkbox.description')"
              required
            />

            <!-- Submit Button -->
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                @click="handleClose"
              >
                {{ t('common.cancel') }}
              </UButton>
              <UButton
                :disabled="!isConfirmed || isLoading"
                :loading="isLoading"
                color="primary"
                @click="performConfirmation"
              >
                {{ isLoading ? t('confirm.submitting') : t('confirm.submit') }}
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
    uuid: string | null
    modelValue?: boolean
}

interface Emits {
    'close': [data?: {
        success: boolean
        message: string
        _closeAction?: boolean
    }]
    'update:modelValue': [value: boolean]
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

// Debug logging
console.log('ConfirmationModal: Component loaded');
console.log('ConfirmationModal: Initial props:', { uuid: props.uuid, modelValue: props.modelValue });

// Two-way model for Nuxt UI 3 (v-model:open)
const isOpen = computed({
    get: () => props.modelValue,
    set: (val: boolean) => {
        emit('update:modelValue', val);
        if (!val) {
            handleClose();
        }
    }
});

// State
const isLoading = ref(false);
const confirmationResult = ref<'success' | 'error' | 'not_found' | null>(null);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isConfirmed = ref(false);

const handleModalOpen = async () => {
    console.log('Modal opened with UUID:', props.uuid);

    // Reset state when modal opens
    isLoading.value = true;
    confirmationResult.value = null;
    errorMessage.value = null;
    successMessage.value = null;
    isConfirmed.value = false;

    if (import.meta.client) {
        setTimeout(() => {
            const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')) as HTMLElement[];
            const dialog = dialogs[dialogs.length - 1];
            if (dialog) dialog.setAttribute('aria-modal', 'true');
        }, 0);
    }

    // Auto-check confirmation status when modal opens
    await checkConfirmationStatus();
};

// Check confirmation status without requiring user interaction
const checkConfirmationStatus = async () => {
    if (!props.uuid) {
        confirmationResult.value = 'not_found';
        isLoading.value = false;
        return;
    }

    isLoading.value = true;
    confirmationResult.value = null;
    errorMessage.value = null;
    successMessage.value = null;

    try {
        // Call our API endpoint which handles the Drupal communication
        const response = await $fetch(`/api/confirm/${props.uuid}`);

        console.log('Confirmation status check response:', response);

        if (response && response.success) {
            if (response.status === 'already_confirmed') {
                // Show already confirmed state
                console.log('Request already confirmed, showing success state');
                confirmationResult.value = 'success';
                const translatedMessage = t('confirm.already_confirmed.message');
                console.log('Translation result:', translatedMessage);
                console.log('Backend message:', response.message);
                successMessage.value = translatedMessage || response.message;
                errorMessage.value = null;

                // Auto-close after 3 seconds for already confirmed
                setTimeout(() => {
                    emit('close', {
                        success: true,
                        message: t('confirm.already_confirmed.message') || response.message,
                        _closeAction: true
                    });
                }, 3000);
            } else {
                // Show form for new confirmation
                console.log('Request not yet confirmed, showing form');
                confirmationResult.value = null;
                isLoading.value = false;
            }
        } else {
            console.log('API response indicates failure:', response);
            confirmationResult.value = 'error';
            errorMessage.value = t('confirm.error.message') || response?.message;
        }
    } catch (error: unknown) {
        console.error('Confirmation status check failed:', error);

        if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            confirmationResult.value = 'not_found';
        } else {
            // For network errors, show the form anyway
            confirmationResult.value = null;
            isLoading.value = false;
        }
    }

    if (confirmationResult.value !== null) {
        isLoading.value = false;
    }
};

// Perform confirmation
const performConfirmation = async () => {
    if (!props.uuid) {
        confirmationResult.value = 'not_found';
        isLoading.value = false;
        return;
    }

    isLoading.value = true;
    confirmationResult.value = null;
    errorMessage.value = null;
    successMessage.value = null;

    try {
    // Call our API endpoint which handles the Drupal communication
        const response = await $fetch(`/api/confirm/${props.uuid}`);

        if (response && response.success) {
            confirmationResult.value = 'success';
            successMessage.value = t('confirm.success.message') || response.message;

            // Auto-close after 2 seconds on success
            setTimeout(() => {
                emit('close', {
                    success: true,
                    message: t('confirm.success.message') || response.message
                });
            }, 2000);
        } else {
            confirmationResult.value = 'error';
            errorMessage.value = t('confirm.error.message') || response?.message;
        }
    } catch (error: unknown) {
        console.error('Confirmation failed:', error);

        if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            confirmationResult.value = 'not_found';
        } else {
            confirmationResult.value = 'error';
            errorMessage.value = t('confirm.error.network') || (error instanceof Error ? error.message : String(error));
        }
    } finally {
        isLoading.value = false;
    }
};

// Handle close
const handleClose = () => {
    emit('close', {
        success: confirmationResult.value === 'success',
        message: successMessage.value || errorMessage.value || '',
        _closeAction: true
    });
};

// Watch for modal opening and trigger status check
watch(() => props.modelValue, async (newValue, oldValue) => {
    if (newValue && !oldValue && props.uuid) {
        console.log('Modal opened via watcher with UUID:', props.uuid);
        await handleModalOpen();
    }
}, { immediate: false });

// Handle initial load when modal is already open
onMounted(async () => {
    console.log('ConfirmationModal: onMounted called');
    if (props.modelValue && props.uuid) {
        console.log('Modal already open on mount, checking status for UUID:', props.uuid);
        await handleModalOpen();
    }
});
</script>
