<template>
  <div class="space-y-4">
    <!-- Success State -->
    <div
      v-if="hasSubmitted"
      role="status"
      aria-live="polite"
      class="text-center space-y-4 py-4"
    >
      <UIcon
        name="i-heroicons-check-circle"
        class="w-12 h-12 text-green-500 mx-auto"
      />
      <h3 class="text-lg font-medium">
        {{ $t('contact.success_title') }}
      </h3>
      <p class="text-sm text-[var(--ui-text-muted)]">
        {{ $t('contact.success_message') }}
      </p>
      <div class="flex justify-center gap-3 pt-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="emit('close')"
        >
          {{ $t('contact.close') }}
        </UButton>
        <UButton
          color="primary"
          @click="handleNewMessage"
        >
          {{ $t('contact.new_message') }}
        </UButton>
      </div>
    </div>

    <!-- Form State -->
    <form
      v-else
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <!-- Name -->
      <UFormField
        :label="$t('contact.name')"
        required
      >
        <UInput
          v-model="formData.name"
          :placeholder="$t('contact.name_placeholder')"
          class="w-full"
          autocomplete="name"
        />
        <template
          v-if="errors.name"
          #error
        >
          {{ errors.name }}
        </template>
      </UFormField>

      <!-- Email -->
      <UFormField
        :label="$t('contact.email')"
        required
      >
        <UInput
          v-model="formData.mail"
          type="email"
          :placeholder="$t('contact.email_placeholder')"
          class="w-full"
          autocomplete="email"
        />
        <template
          v-if="errors.mail"
          #error
        >
          {{ errors.mail }}
        </template>
      </UFormField>

      <!-- Message -->
      <UFormField
        :label="$t('contact.message')"
        required
      >
        <UTextarea
          v-model="formData.message"
          :placeholder="$t('contact.message_placeholder')"
          :rows="5"
          class="w-full"
        />
        <template
          v-if="errors.message"
          #error
        >
          {{ errors.message }}
        </template>
      </UFormField>

      <!-- Honeypot - hidden from humans, bots fill it -->
      <div
        class="absolute overflow-hidden"
        style="left: -9999px; top: -9999px; height: 0; width: 0;"
        aria-hidden="true"
        tabindex="-1"
      >
        <label for="website">Website</label>
        <input
          id="website"
          v-model="formData.website"
          type="text"
          name="website"
          autocomplete="off"
          tabindex="-1"
        >
      </div>

      <!-- Copy to self -->
      <UCheckbox
        v-model="formData.copy"
        :label="$t('contact.copy_label')"
      />

      <!-- GDPR Checkbox -->
      <UFormField>
        <UCheckbox
          v-model="formData.gdpr"
          :label="$t('contact.gdpr_label')"
        />
        <template
          v-if="errors.gdpr"
          #error
        >
          {{ errors.gdpr }}
        </template>
      </UFormField>

      <!-- Submission Error -->
      <div
        v-if="submissionError"
        class="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
      >
        {{ submissionError }}
      </div>

      <!-- Submit Button -->
      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        :disabled="loading"
      >
        {{ loading ? $t('contact.sending') : $t('contact.submit') }}
      </UButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { loading, hasSubmitted, submissionError, submitContactForm, resetState } = useContactForm();

const emit = defineEmits<{
    success: []
    error: [message: string]
    close: []
}>();

const formOpenedAt = ref(Math.floor(Date.now() / 1000));

const formData = reactive({
    name: '',
    mail: '',
    message: '',
    copy: false,
    gdpr: false,
    website: ''
});

const errors = reactive({
    name: '',
    mail: '',
    message: '',
    gdpr: ''
});

const validate = (): boolean => {
    let valid = true;

    errors.name = '';
    errors.mail = '';
    errors.message = '';
    errors.gdpr = '';

    if (!formData.name.trim()) {
        errors.name = t('contact.required_field', { field: t('contact.name') });
        valid = false;
    }

    if (!formData.mail.trim()) {
        errors.mail = t('contact.required_field', { field: t('contact.email') });
        valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) {
        errors.mail = t('contact.invalid_email');
        valid = false;
    }

    if (!formData.message.trim()) {
        errors.message = t('contact.required_field', { field: t('contact.message') });
        valid = false;
    }

    if (!formData.gdpr) {
        errors.gdpr = t('contact.gdpr_required');
        valid = false;
    }

    return valid;
};

const handleSubmit = async () => {
    if (!validate()) return;

    const result = await submitContactForm({
        name: formData.name,
        mail: formData.mail,
        message: formData.message,
        copy: formData.copy,
        gdpr: formData.gdpr,
        website: formData.website,
        form_token: btoa(String(formOpenedAt.value))
    });

    if (result.success) {
        emit('success');
    } else if (result.error) {
        emit('error', result.error);
    }
};

const resetForm = () => {
    resetState();
    formData.name = '';
    formData.mail = '';
    formData.message = '';
    formData.copy = false;
    formData.gdpr = false;
    formData.website = '';
};

const handleNewMessage = () => {
    resetForm();
    formOpenedAt.value = Math.floor(Date.now() / 1000);
};
</script>
