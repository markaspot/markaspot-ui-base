
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormSettings } from '~/composables/form/useFormSettings'
import { useServiceRequest } from '~/composables/features/useServiceRequest'
import { optimizeImage } from '~/utils/imageUtils'

const MAX_CONCURRENT_UPLOADS = 3;
const { t } = useI18n();

const UPLOAD_ERRORS = {
  INVALID_TYPE: 'errors.upload.invalid_type',
  FILE_TOO_LARGE: 'errors.upload.file_too_large',
  DIMENSIONS_TOO_LARGE: 'errors.upload.dimensions_too_large',
  INVALID_IMAGE: 'errors.upload.invalid_image',
  UPLOAD_FAILED: 'errors.upload.failed',
  LIMIT_REACHED: 'errors.upload.limit_reached'
} as const;


interface UploadedMedia {
  id: string;
  preview: string;
  error?: string;
  progress?: number;
  isUploading: boolean;
}

const props = defineProps<{
  uploadedMedia: UploadedMedia[];
  enableAI?: boolean;
}>();

const emit = defineEmits<{
  'update:media': [media: UploadedMedia[]];
  'files-selected': [count: number];
}>();


const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const uploadedMedia = ref<UploadedMedia[]>(props.uploadedMedia);
const uploadQueue = ref<Array<{ file: File, tempId: string }>>([]);
const activeUploads = ref(new Set<string>());
const errors = ref<string[]>([]);
const { settings } = useFormSettings();
const { uploadMedia } = useServiceRequest();
const config = useRuntimeConfig();

const uploadAreaId = `upload-area-${Math.random().toString(36).slice(2, 9)}`;
const uploadArea = ref<HTMLElement | null>(null);


const mediaConfig = computed(() => ({
  maxFiles: 4,
  maxFileSize: 10 * 1024 * 1024, 
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxDimensions: {
    width: 4096,
    height: 4096
  },
  optimize: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'jpeg' as const
  },
  ...config.public.clientConfig?.features?.media
}));


const maxFiles = computed(() => mediaConfig.value.maxFiles);
const maxFileSize = computed(() => mediaConfig.value.maxFileSize);
const allowedTypes = computed(() => mediaConfig.value.allowedTypes);
const maxDimensions = computed(() => mediaConfig.value.maxDimensions);
const optimizeConfig = computed(() => mediaConfig.value.optimize);

const isUploading = computed(() => uploadedMedia.value.some(m => m.isUploading));
const overallProgress = computed(() => {
  const totalMedia = uploadedMedia.value.length;
  if (!totalMedia) return 0;

  
  const weightPerMedia = 100 / totalMedia;

  
  const totalProgress = uploadedMedia.value.reduce((sum, media) => {
    if (!media.isUploading) return sum + weightPerMedia;
    return sum + ((media.progress || 0) * weightPerMedia / 100);
  }, 0);

  return Math.round(totalProgress);
});


const triggerFileInput = () => {
  if (!fileInput.value?.disabled) {
    fileInput.value?.click();
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};


const quickValidateFile = (file: File): boolean => {
  const isValidType = allowedTypes.value.includes(file.type);
  const isValidSize = file.size <= maxFileSize.value;
  
  if (!isValidType) {
    errors.value.push(UPLOAD_ERRORS.INVALID_TYPE);
    return false;
  }
  
  if (!isValidSize) {
    errors.value.push(UPLOAD_ERRORS.FILE_TOO_LARGE);
    return false;
  }
  
  return true;
};

const validateFile = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(img.src); 
      
      if (img.width > maxDimensions.value.width || img.height > maxDimensions.value.height) {
        reject(new Error(UPLOAD_ERRORS.DIMENSIONS_TOO_LARGE));
      }
      
      resolve(true);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src); 
      reject(new Error(UPLOAD_ERRORS.INVALID_IMAGE));
    };
    
    img.src = URL.createObjectURL(file);
  });
};


const handleDragOver = (event: DragEvent) => {
  isDragging.value = true;
  event.dataTransfer!.dropEffect = 'copy';
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files) {
    handleFiles(event.dataTransfer.files);
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    handleFiles(input.files);
  }
  input.value = '';
};

// File processing
const handleFiles = async (files: FileList) => {
  errors.value = []; // Clear previous errors
  
  const remainingSlots = maxFiles.value - uploadedMedia.value.length;
  if (remainingSlots <= 0) {
    errors.value.push(UPLOAD_ERRORS.LIMIT_REACHED);
    return;
  }

  // Quick initial validation and create previews
  const validFiles = Array.from(files).slice(0, remainingSlots)
    .filter(quickValidateFile);

  if (validFiles.length === 0) {
    return; // All files failed validation
  }

  // Show all previews immediately in one batch
  const newMedia: UploadedMedia[] = validFiles.map(file => ({
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    preview: URL.createObjectURL(file),
    isUploading: true,
    progress: 0
  }));

  // Update state in one go
  uploadedMedia.value = [...uploadedMedia.value, ...newMedia];
  emit('update:media', uploadedMedia.value);
  emit('files-selected', validFiles.length);

  
  newMedia.forEach(({ id: tempId }, index) => {
    const file = validFiles[index];
    queueMicrotask(async () => {
      try {
        await validateFile(file);
        const optimizedFile = await optimizeImage(file, optimizeConfig.value);
        uploadQueue.value.push({ file: optimizedFile, tempId });
        processUploadQueue();
      } catch (error) {
        handleProcessingError(tempId, error);
      }
    });
  });
};

const processUploadQueue = async () => {
  while (uploadQueue.value.length > 0 && activeUploads.value.size < MAX_CONCURRENT_UPLOADS) {
    const { file, tempId } = uploadQueue.value.shift()!;
    activeUploads.value.add(tempId);
    uploadFile(file, tempId).catch(err => {
      console.error('Upload error:', err);
      handleUploadError(tempId, err);
    });
  }
};

const uploadFile = async (file: File, tempId: string) => {
  try {
    const onProgress = (progress: number) => {
      const mediaIndex = uploadedMedia.value.findIndex(m => m.id === tempId);
      if (mediaIndex !== -1) {
        
        const normalizedProgress = Math.max(0, Math.min(100, progress));
        uploadedMedia.value[mediaIndex].progress = normalizedProgress;

        
        uploadedMedia.value = [...uploadedMedia.value];
        emit('update:media', uploadedMedia.value);
      }
    };

    const response = await uploadMedia(file, onProgress);

    
    uploadedMedia.value = uploadedMedia.value.map(media =>
      media.id === tempId ? {
        ...media,
        id: response.data.id,
        isUploading: false,
        progress: 100
      } : media
    );

    emit('update:media', uploadedMedia.value);
  } catch (error) {
    handleUploadError(tempId, error);
  } finally {
    activeUploads.value.delete(tempId);
    processUploadQueue();
  }
};

const handleProcessingError = (tempId: string, error: any) => {
  const mediaIndex = uploadedMedia.value.findIndex(m => m.id === tempId);
  if (mediaIndex !== -1) {
    uploadedMedia.value[mediaIndex] = {
      ...uploadedMedia.value[mediaIndex],
      error: error.message || UPLOAD_ERRORS.INVALID_IMAGE,
      isUploading: false
    };
    
    emit('update:media', uploadedMedia.value);
  }
};

const handleUploadError = (tempId: string, error: any) => {
  console.error('Upload error:', error);
  const mediaIndex = uploadedMedia.value.findIndex(m => m.id === tempId);
  if (mediaIndex !== -1) {
    uploadedMedia.value[mediaIndex] = {
      ...uploadedMedia.value[mediaIndex],
      error: UPLOAD_ERRORS.UPLOAD_FAILED,
      isUploading: false
    };
    
    emit('update:media', uploadedMedia.value);
  }
  
  errors.value.push(UPLOAD_ERRORS.UPLOAD_FAILED);
};

const removeImage = (mediaId: string) => {
  const media = uploadedMedia.value.find(m => m.id === mediaId);
  
  
  if (media?.preview && media.preview.startsWith('blob:')) {
    URL.revokeObjectURL(media.preview);
  }
  
  
  uploadedMedia.value = uploadedMedia.value.filter(item => item.id !== mediaId);
  emit('update:media', uploadedMedia.value);
};

const retryUpload = async (media: UploadedMedia) => {
  removeImage(media.id);
  
  
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = allowedTypes.value.join(',');
  fileInput.onchange = (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) {
      handleFiles(files);
    }
  };
  fileInput.click();
};


onMounted(() => {
  
  uploadArea.value?.focus();
});

onUnmounted(() => {
  
  uploadedMedia.value.forEach(media => {
    if (media.preview && media.preview.startsWith('blob:')) {
      URL.revokeObjectURL(media.preview);
    }
  });
  
  
  uploadQueue.value = [];
  activeUploads.value.clear();
});


watch(() => props.uploadedMedia, (newVal) => {
  uploadedMedia.value = newVal;
}, { deep: true });
</script>
<template>
  <div class="space-y-4">
    <label
      :id="uploadAreaId + '-label'"
      class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
    >
      {{ t('report.form.media.label') }}
    </label>

    <!-- Upload Limit Warning -->
    <div
      v-if="uploadedMedia.length >= maxFiles"
      class="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2 mb-2"
      role="alert"
      aria-live="polite"
    >
      <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
      {{ t(UPLOAD_ERRORS.LIMIT_REACHED) }}
    </div>

    <!-- Error Display -->
    <div v-if="errors.length > 0" class="space-y-2">
      <div 
        class="relative overflow-hidden rounded-lg border bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20"
        role="alert"
        aria-live="assertive"
      >
        <div class="flex items-start gap-3">
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <div class="flex-1">
            <h3 id="upload-error-heading" class="mb-2 font-medium text-red-800 dark:text-red-200">
              {{ t('errors.upload.title') }}
            </h3>
            <ul 
              class="space-y-2 pl-4 text-sm text-red-700 dark:text-red-300"
              aria-labelledby="upload-error-heading"
            >
              <li v-for="(error, index) in errors" :key="index">
                {{ t(error) }}
              </li>
            </ul>
          </div>
          <button
            @click="errors = []"
            class="rounded p-1 text-red-600 hover:bg-red-100 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-200"
            aria-label="Dismiss error message"
          >
            <UIcon name="i-heroicons-x-mark" class="h-4 w-4" aria-hidden="true" />
            <span class="sr-only">Dismiss</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Area -->
    <div
      ref="uploadArea"
      :id="uploadAreaId"
      tabindex="0"
      role="button"
      :aria-labelledby="`${uploadAreaId}-label`"
      :aria-describedby="`${uploadAreaId}-description`"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
      @keydown.space.prevent="triggerFileInput"
      @keydown.enter.prevent="triggerFileInput"
      :class="[
        'relative rounded-lg border-2 border-dashed p-6 transition-colors duration-200 cursor-pointer',
        isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600',
        uploadedMedia.length >= maxFiles ? 'opacity-50 pointer-events-none' : ''
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="sr-only"
        @change="handleFileSelect"
        :disabled="uploadedMedia.length >= maxFiles"
        :aria-label="t('report.form.media.upload.button')"
      />

      <div class="flex flex-col items-center gap-2" aria-hidden="uploadedMedia.length > 0">
        <div class="p-4 bg-primary-500 dark:bg-primary-800 rounded-full aspect-square">
          <UIcon name="i-heroicons-camera" class="w-6 text-white dark:text-white" />
        </div>
        <div class="text-center">
          <span class="text-gray-600 dark:text-gray-400 hover:text-gray-600 font-medium">
            {{ t('report.form.media.upload.button') }}
          </span>
          <span class="text-gray-500 dark:text-gray-400">
            {{ t('report.form.media.upload.or') }} {{ t('report.form.media.upload.drag') }}
          </span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400" :id="`${uploadAreaId}-description`">
          {{ t('report.form.media.upload.restrictions', {
            count: maxFiles,
            size: formatFileSize(maxFileSize),
            types: allowedTypes.map(type => type.replace('image/', '')).join(', ')
          }) }}
        </p>

        <!-- Overall Upload Progress -->
        <div v-if="isUploading" class="w-full max-w-md mt-4">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
            <span>{{ t('report.form.media.upload.overall_progress') }}</span>
            <span>{{ overallProgress }}%</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
              :style="{ width: `${overallProgress}%` }"
              role="progressbar"
              :aria-valuenow="overallProgress"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Grid -->
    <div
      v-if="uploadedMedia.length"
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      role="list"
      aria-label="Uploaded images"
    >
      <div
        v-for="media in uploadedMedia"
        :key="media.id"
        class="relative group"
        role="listitem"
      >
        <!-- Image Preview -->
        <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            :src="media.preview"
            :alt="t('report.form.media.preview')"
            class="w-full h-full object-cover"
            :class="{ 'opacity-50': media.isUploading || media.error }"
          />
        </div>

        <!-- Upload Progress -->
        <div
          v-if="media.isUploading"
          class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
          role="progressbar"
          :aria-valuenow="media.progress || 0"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="w-20 h-20 relative">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                stroke-width="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#fff"
                stroke-width="3"
                :stroke-dasharray="`${media.progress || 0}, 100`"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center text-white font-medium">
              {{ Math.round(media.progress || 0) }}%
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-if="media.error"
          class="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center rounded-lg"
          role="alert"
        >
          <div class="text-white text-center p-4">
            <UIcon name="i-heroicons-exclamation-circle" class="w-6 h-6 mx-auto mb-2" />
            <p class="text-sm mb-3">{{ t(media.error) }}</p>
            <button
              @click.stop="retryUpload(media)"
              class="mt-2 px-4 py-2 bg-white text-red-600 rounded-lg text-sm
                     font-medium hover:bg-red-50 transition-colors w-full"
            >
              {{ t('common.retry') }}
            </button>
          </div>
        </div>

        <!-- Remove Button -->
        <button
          type="button"
          @click.stop="removeImage(media.id)"
          class="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2
                 shadow-lg transition-opacity duration-200
                 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          :aria-label="t('report.form.media.remove')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aspect-square {
  aspect-ratio: 1 / 1;
}

.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: none;
}

button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

@keyframes progress-spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: progress-spin 1s linear infinite;
}

@media (max-width: 640px) {
  .remove-button {
    padding: 0.5rem;
  }

  .retry-button {
    min-height: 44px;
  }
}
</style>