<template>
  <div class="flex flex-col h-full">
    <div ref="scrollContainer" class="flex-1 overflow-y-auto">
      <div class="p-6 space-y-6">
        <!-- Success Message -->
        <UAlert
          v-if="successMessage"
          color="green"
          variant="soft"
          icon="i-heroicons-check-circle"
        >
          {{ t('success.report_submitted') }}
        </UAlert>

        <!-- Error Messages -->
        <FormErrorDisplay
          v-if="errorState.isVisible"
          :error-state="errorState"
          ref="errorContainer"
          @clear="clearErrors"
        />

        <form ref="form" @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Description -->
          <AutoResizeTextarea
            v-model="description"
            :label="t('report.form.description.label')"
            required
            :placeholder="t('report.form.description.placeholder')"
            :help-text="t('report.form.description.help')"
          />

          <!-- Category Selection -->
          <CategorySelect
            v-model="category"
            required
          />

          <!-- Media Upload -->
          <MediaUploadField
            :uploaded-media="uploadedMedia"
            @update:media="handleMediaUpdate"
            @files-selected="handleFilesSelected"
            :enableAI="false"
            :label="t('report.form.media.label')"
            :upload-text="t('report.form.media.upload.button')"
            :drag-text="t('report.form.media.upload.drag')"
            :restrictions-text="t('report.form.media.upload.restrictions')"
            class="block w-full"
          />

          <!-- Location -->
          <LocationInput
            v-model="location"
            required
            :map-center="mapCenterData"
          />

          <EmailField v-model="email" />
          <GdprField v-model="gdprAccepted" />
        </form>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="p-4 bg-white dark:bg-gray-800 border-t sticky bottom-0">
      <UButton
        type="submit"
        variant="solid"
        color="primary"
        size="lg"
        :loading="loading"
        :disabled="loading || !isFormValid"
        @click="handleSubmit"
        block
      >
        <template #loading>
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        </template>
        {{ submitButtonText }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

interface MapCenter {
  lat: number;
  lng: number;
  address?: string;
}

const props = defineProps<{
  mapCenter?: MapCenter | null;
}>();

const emit = defineEmits<{
  success: [response: any];
}>();

const { t } = useI18n();
const { createServiceRequest, uploadMedia } = useServiceRequest();
const { errorState, processApiErrors, clearErrors } = useErrorHandler();


const form = ref<HTMLFormElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const errorContainer = ref<HTMLElement | null>(null);


const description = ref('');
const category = ref('');
const email = ref('');
const gdprAccepted = ref(false);
const uploadedMedia = ref<Array<{ id: string; preview: string; progress?: number; error?: string }>>([]);
const location = ref({ lat: '', lng: '' });
const successMessage = ref('');
const loading = ref(false);

// Computed map center data to handle null case
const mapCenterData = computed(() => {
  if (!props.mapCenter) return undefined;
  return {
    lat: props.mapCenter.lat,
    lng: props.mapCenter.lng,
    address: props.mapCenter.address,
  };
});

// Computed
const errorMessages = computed(() =>
  errorState.value.errors.map((error) => error.message)
);

const isFormValid = computed(() =>
  description.value.trim() &&
  category.value &&
  location.value.lat &&
  location.value.lng &&
  gdprAccepted.value
);

const submitButtonText = computed(() => {
  if (loading.value) return t('report.form.submit.submitting');
  return t('report.form.submit.button');
});


const scrollToError = () => {
  if (scrollContainer.value && errorContainer.value) {
    scrollContainer.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
};

const handleMediaUpdate = (media: Array<{ id: string; preview: string; progress?: number; error?: string }>) => {
  uploadedMedia.value = media;
};

const handleFilesSelected = (count: number) => {
   selected.`);
};

const resetForm = () => {
  description.value = '';
  category.value = '';
  email.value = '';
  gdprAccepted.value = false;
  location.value = { lat: '', lng: '' };
  uploadedMedia.value = [];
  clearErrors();
  successMessage.value = '';
};

const handleSubmit = async () => {
  if (!isFormValid.value) {
    processApiErrors({
      response: {
        data: {
          errors: [{
            status: '400',
            title: 'Validation Error',
            detail: t('errors.validation.required_fields'),
          }],
        },
      },
    });
    scrollToError();
    return;
  }

  loading.value = true;
  clearErrors();
  errorState.value.isVisible = false; // Ensure errors are hidden before new request

  try {
    const requestData = {
      title: `Report ${new Date().toISOString()}`,
      body: {
        value: description.value,
        format: 'plain_text',
      },
      field_category: category.value,
      field_e_mail: email.value,
      field_gdpr: gdprAccepted.value,
      field_geolocation: {
        lat: parseFloat(location.value.lat),
        lng: parseFloat(location.value.lng),
      },
      field_request_media: uploadedMedia.value.map((media) => media.id),
    };

    const response = await createServiceRequest(requestData);
    successMessage.value = t('success.report_submitted');
    resetForm();
    emit('success', response);
  } catch (e: any) {
    console.error('Failed to submit report:', e);
    processApiErrors(e);
    scrollToError();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (props.mapCenter?.lat != null && props.mapCenter?.lng != null) {
    location.value = {
      lat: props.mapCenter.lat.toString(),
      lng: props.mapCenter.lng.toString(),
    };
  }
});
</script>

<style scoped>
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

.overflow-y-auto::-webkit-scrollbar {
  display: none;
}

.overflow-y-auto {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sticky {
  position: -webkit-sticky;
  position: sticky;
}
</style>
