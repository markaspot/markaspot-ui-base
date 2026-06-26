<template>
  <div class="p-6">
    <FormErrorDisplay
      v-if="errorState.isVisible"
      :error-state="errorState"
      @clear="clearErrors"
    />

    <!-- Competition Info Text -->
    <div class="mb-6 text-sm text-[var(--ui-text)]">
      <h3 class="text-lg font-medium mb-2 text-neutral-900 dark:text-white">
        {{ t('competition.title') }}
      </h3>
      <p class="mb-2">
        {{ t('competition.intro') }}
      </p>
      <p class="text-xs italic">
        {{ t('competition.disclaimer') }}
      </p>
    </div>

    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <!-- Full Name -->
      <div class="grid grid-cols-2 gap-4">
        <!-- First Name -->
        <UFormField
          :label="t('fields.field_first_name')"
          :error="firstNameError ? t('errors.validation.required_field', { field: t('fields.field_first_name') }) : undefined"
          required
        >
          <AppInput
            id="firstName"
            v-model="firstName"
            size="lg"
            color="primary"
            class="w-full"
            :placeholder="t('fields.field_first_name_placeholder')"
            @blur="touched.firstName = true"
          />
        </UFormField>

        <!-- Last Name -->
        <UFormField
          :label="t('fields.field_last_name')"
          :error="lastNameError ? t('errors.validation.required_field', { field: t('fields.field_last_name') }) : undefined"
          required
        >
          <AppInput
            id="lastName"
            v-model="lastName"
            size="lg"
            color="primary"
            class="w-full"
            :placeholder="t('fields.field_last_name_placeholder')"
            @blur="touched.lastName = true"
          />
        </UFormField>
      </div>

      <!-- Street Address -->
      <UFormField
        :label="t('fields.street_address')"
        required
      >
        <AppInput
          id="address"
          v-model="streetAddress"
          size="lg"
          color="primary"
          class="w-full"
          :placeholder="t('fields.street_address_placeholder')"
        />
      </UFormField>

      <!-- Postal Code -->
      <UFormField
        :label="t('fields.postal_code')"
        :error="(!postalCodeValid && postalCode) ? t('errors.validation.invalid_format', { field: t('fields.postal_code') }) : undefined"
        required
      >
        <AppInput
          id="postalCode"
          v-model="postalCode"
          size="lg"
          maxlength="5"
          :placeholder="t('fields.postal_code_placeholder')"
          color="primary"
          class="w-full"
        />
      </UFormField>

      <!-- City -->
      <UFormField
        :label="t('fields.city')"
        :error="(!city.trim() && loading) ? t('errors.validation.required_field', { field: t('fields.city') }) : undefined"
        required
      >
        <AppInput
          id="city"
          v-model="city"
          size="lg"
          :placeholder="t('fields.city_placeholder')"
          color="primary"
          class="w-full"
        />
      </UFormField>

      <!-- Terms of Use -->
      <UFormField
        :error="(!termsAccepted && loading) ? t('errors.validation.required_field', { field: t('competition.terms') }) : undefined"
        required
      >
        <UCheckbox
          id="terms"
          v-model="termsAccepted"
          :required="true"
        >
          <template #label>
            <span
              class="text-sm leading-snug"
              v-html="t('fields.field_terms_of_use')"
            />
          </template>
        </UCheckbox>
      </UFormField>

      <!-- Submit -->
      <UButton
        type="submit"
        :loading="loading"
        :disabled="loading || !isFormValid"
        block
        class="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        {{ t('common.submit') }}
      </UButton>
    </form>
  </div>
</template>

<script setup lang="ts">
/**
 * CompetitionForm Component
 *
 * Form component with validation, error handling, and user interaction.
 */

import { useI18n } from 'vue-i18n';

const props = defineProps<{ serviceRequestId: string, serviceRequestUuid: string }>();
const emit = defineEmits<{ success: [response: any] }>();

const { t, locale } = useI18n();
const api = useApiClient();
const { errorState, processApiErrors, clearErrors } = useErrorHandler();

const termsAccepted = ref(false);
const firstName = ref('');
const lastName = ref('');
const streetAddress = ref('');
const city = ref('');
const postalCode = ref('');
const loading = ref(false);

// Track which fields have been touched
const touched = ref({
    firstName: false,
    lastName: false
});

const firstNameError = computed(() => {
    return touched.value.firstName && firstName.value.trim() === '';
});

const lastNameError = computed(() => {
    return touched.value.lastName && lastName.value.trim() === '';
});

const postalCodeValid = computed(() => {
    return !postalCode.value || /^\d{5}$/.test(postalCode.value);
});

const isFormValid = computed(() => (
    termsAccepted.value &&
    firstName.value.trim() !== '' &&
    lastName.value.trim() !== '' &&
    streetAddress.value.trim() &&
    city.value.trim() &&
    postalCode.value.trim() && postalCodeValid.value
));

async function handleSubmit() {
    // Mark all fields as touched on submit attempt
    touched.value.firstName = true;
    touched.value.lastName = true;

    if (!isFormValid.value) {
        return;
    }
    loading.value = true;
    clearErrors();

    try {
        const currentLanguage = locale.value.startsWith('de') ? 'de' : 'en';

        // Create a clean JSON payload for our custom REST endpoint
        const payload = {
            serviceRequestUuid: props.serviceRequestUuid,
            termsAccepted: termsAccepted.value,
            address: {
                langcode: currentLanguage,
                country_code: 'DE',
                locality: city.value,
                postal_code: postalCode.value.trim(),
                address_line1: streetAddress.value.trim(),
                given_name: firstName.value.trim(),
                family_name: lastName.value.trim()
            }
        };

        // Use the correct endpoint path format
        const _res = await api.post('/api/competition', payload);

        emit('success', { success: true });
    } catch (e: unknown) {
        console.error('Competition submission failed:', e);

        // Special handling for specific error codes
        if (e && typeof e === 'object' && 'status' in e && e.status === 409) {
            // 409 Conflict - Already exists
            processApiErrors({
                message: t('competition.errors.already_exists'),
                response: {
                    data: {
                        errors: [{
                            title: t('competition.errors.duplicate_found'),
                            detail: t('competition.errors.duplicate_detail')
                        }]
                    }
                }
            });
        } else if (e && typeof e === 'object' && 'status' in e && e.status === 404) {
            // 404 Not Found - Service request not found
            processApiErrors({
                message: t('competition.errors.not_found'),
                response: {
                    data: {
                        errors: [{
                            title: t('competition.errors.not_found'),
                            detail: t('competition.errors.not_found_detail')
                        }]
                    }
                }
            });
        } else {
            // General error
            processApiErrors({
                message: t('competition.errors.save_failed'),
                response: {
                    data: {
                        errors: [{
                            title: t('competition.errors.submission_error'),
                            detail: t('competition.errors.submission_error_detail')
                        }]
                    }
                }
            });
        }

        // Even if there's an error, consider the submission "successful" from the user's perspective
        // as the service request was already created successfully - this is just the competition entry
        emit('success', { success: false, error: (e as Error).message });
    } finally {
        loading.value = false;
    }
}
</script>
