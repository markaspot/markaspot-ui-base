<template>
  <div class="space-y-4">
    <UFormField
      :id="uploadAreaId + '-label'"
      :label="t('report.form.media.label')"
      :required="isRequired && !props.hideRequiredLabeling"
      :error="uploadRequiredError"
    >
      <template #help>
        <!-- Category requirement hint moved below upload area -->
      </template>

      <!-- Error Display (blocking) -->
      <UAlert
        v-if="errors.length > 0"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        class="mb-4"
      >
        <template #title>
          {{ t('errors.upload.title') || 'Fehler' }}
        </template>
        <template #description>
          <ul class="list-disc pl-5 space-y-1">
            <li
              v-for="(error, index) in errors"
              :key="index"
            >
              {{ typeof error === 'string' ? t(error) : t(error.key, error.params) }}
            </li>
          </ul>
        </template>
      </UAlert>

      <!-- Non-blocking rate limit note -->
      <div
        v-if="rateLimitMessage"
        class="mt-4 mb-4 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400"
        role="status"
        aria-live="polite"
      >
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <span>{{ rateLimitMessage }}</span>
      </div>

      <!-- Accessible description for upload area (screen readers) -->
      <p
        :id="`${uploadAreaId}-description`"
        class="sr-only"
      >
        {{ t('report.form.media.upload.description') || 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.' }}
      </p>

      <!-- Upload Area - Hide when photos uploaded and limit reached -->
      <div
        v-if="mediaList.length < maxFiles"
        :id="uploadAreaId"
        :ref="(el) => { uploadArea = el as HTMLElement }"
        :class="[
          'relative rounded-md ring-1 ring-inset p-4 md:p-4 transition-colors duration-200',
          isDragging ? 'ring-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'ring-[var(--ui-border)] bg-[var(--ui-bg)]',
          uploadRequiredError ? 'ring-red-500 dark:ring-red-400 bg-red-50/40 dark:bg-red-950/20' : '',
        ]"
        :aria-describedby="`${uploadAreaId}-description`"
        :aria-invalid="Boolean(uploadRequiredError)"
        @dragenter.prevent="!props.disabled && handleDragEnter($event)"
        @dragover.prevent="!props.disabled && handleDragOver($event)"
        @dragleave.prevent="!props.disabled && handleDragLeave($event)"
        @drop.prevent="!props.disabled && handleDrop($event)"
      >
        <!-- Drag overlay cue -->
        <div
          v-if="isDragging"
          class="pointer-events-none absolute inset-0 rounded-md border-2 border-dashed border-primary-500 bg-primary-100/95 dark:bg-primary-950/95 flex items-center justify-center backdrop-blur-md z-10"
        >
          <div class="text-center">
            <UIcon
              name="i-heroicons-cloud-arrow-up"
              class="w-8 h-8 mx-auto mb-2 text-primary-600 dark:text-primary-400"
            />
            <span class="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--ui-bg)] text-primary-700 dark:text-primary-300 shadow-lg border border-primary-200 dark:border-primary-800">
              {{ t('report.form.media.upload.drop_here') || 'Zum Hochladen hier ablegen' }}
            </span>
          </div>
        </div>

        <input
          :id="fileInputId"
          :ref="(el) => { fileInput = el as HTMLInputElement }"
          type="file"
          :multiple="!isAndroid"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only text-neutral-900"
          :disabled="props.disabled || mediaList.length >= maxFiles"
          :aria-hidden="true"
          tabindex="-1"
          @change="onFileInputChange"
        >

        <div
          v-if="mediaList.length < maxFiles"
          class="flex flex-col items-center gap-2"
        >
          <!-- Upload Button -->
          <UButton
            variant="soft"
            color="primary"
            size="lg"
            block
            class="!text-primary-700 dark:!text-primary-300"
            :disabled="props.disabled || mediaList.length >= maxFiles"
            :aria-label="t('report.form.media.upload.button')"
            :aria-describedby="`${uploadAreaId}-description`"
            @click="triggerFileInput"
          >
            <template #leading>
              <UIcon
                name="i-heroicons-camera"
                class="w-5 h-5"
              />
            </template>
            {{ t('report.form.media.upload.button') }}
          </UButton>

          <!-- Drag Hint (desktop only) + Counter -->
          <p class="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            <span class="hidden pointer-fine:inline">
              {{ t('report.form.media.upload.or') }} {{ t('report.form.media.upload.drag') }} ·
            </span>
            {{ mediaList.length }}/{{ maxFiles }}
          </p>

          <!-- Privacy Notice -->
          <div class="text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <div>{{ t('report.form.media.privacy_notice') }}</div>
            <!-- AI Analysis Notice -->
            <div
              v-if="showAINotice"
              class="flex items-center justify-center gap-1"
            >
              <span>{{ t('report.form.media.ai_analysis') }}</span>
              <UPopover
                mode="click"
                :popper="{
                  strategy: 'fixed',
                  teleport: 'body',
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, 8],
                      },
                    },
                  ],
                }"
                :ui="{
                  content: 'z-[10000] bg-[var(--ui-bg)] shadow-xl border border-[var(--ui-border)]',
                }"
              >
                <template #content>
                  <div class="w-72 p-3 text-xs leading-relaxed overflow-hidden">
                    <div class="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">
                      {{ t('report.form.media.ai_analysis_tooltip') }}
                    </div>
                  </div>
                </template>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-300 cursor-pointer"
                  :aria-label="t('report.form.media.ai_analysis')"
                >
                  <UIcon
                    name="i-heroicons-information-circle"
                    class="w-4 h-4 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100"
                    aria-hidden="true"
                  />
                </button>
              </UPopover>
            </div>
          </div>

          <!-- Overall Upload Progress -->
          <div
            v-if="isUploading"
            class="w-full max-w-md mt-4"
          >
            <div class="flex justify-between text-sm text-neutral-600 dark:text-neutral-300 mb-1">
              <span>{{ t('report.form.media.upload.overall_progress') }}</span>
              <span>{{ overallProgress }}%</span>
            </div>
            <div class="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
                :style="{ width: `${overallProgress}%` }"
                role="progressbar"
                :aria-valuenow="overallProgress"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`Upload progress: ${overallProgress}%`"
              />
            </div>
            <div
              id="upload-progress-announcements"
              aria-live="polite"
              aria-atomic="true"
              class="sr-only"
            >
              {{ uploadStatusAnnouncement }}
            </div>
          </div>
        </div>
      </div>

      <template #error>
        <div
          :id="`${uploadAreaId}-error`"
          role="alert"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ uploadRequiredError }}
        </div>
      </template>

      <!-- AI Processing with smooth fade transitions -->
      <Transition
        name="ai-processing"
        mode="out-in"
        appear
      >
        <div
          v-if="isAIEnabled && isAIProcessing"
          ref="aiProcessingSection"
          class="bg-primary-50 dark:bg-primary-950 rounded-lg p-4 mt-3"
          role="status"
          aria-live="polite"
          aria-label="AI analysis progress"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-cpu-chip"
              class="w-5 h-5 text-neutral-600 dark:text-neutral-300"
              aria-hidden="true"
            />
            <span class="text-sm font-medium text-primary-700 dark:text-primary-400">{{ t('report.ai.analyzing') }}</span>
          </div>
          <div class="mt-3 space-y-2">
            <div
              v-for="step in processingSteps"
              :key="step.field"
              class="flex items-center gap-2 text-sm pl-7"
            >
              <AppSpinner
                v-if="step.status === 'pending'"
                size="sm"
                class="text-neutral-600 dark:text-neutral-300"
                aria-hidden="true"
              />
              <UIcon
                v-else-if="step.status === 'warning'"
                name="i-heroicons-exclamation-triangle"
                class="w-4 h-4 text-amber-500 dark:text-amber-400"
                aria-hidden="true"
              />
              <UIcon
                v-else
                name="i-heroicons-check-circle"
                class="w-4 h-4 text-green-500 dark:text-green-400"
                aria-hidden="true"
              />
              <span
                :class="[
                  step.status === 'complete' ? 'text-green-700 dark:text-green-400' : '',
                  step.status === 'warning' ? 'text-amber-700 dark:text-amber-400' : '',
                  step.status === 'pending' ? 'text-neutral-600 dark:text-neutral-300' : '',
                ]"
                :aria-live="step.status === 'complete' || step.status === 'warning' ? 'polite' : 'off'"
              >
                {{ step.message }}
              </span>
            </div>
          </div>
          <div
            id="ai-results-announcements"
            aria-live="assertive"
            aria-atomic="true"
            class="sr-only"
            role="status"
          >
            {{ aiStatusAnnouncement }}
          </div>
        </div>
      </Transition>

      <!-- AI Analysis Failed Banner -->
      <Transition name="ai-processing">
        <UAlert
          v-if="props.aiAnalysisFailed && !props.isAIProcessing"
          color="warning"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          class="mt-3"
        >
          <template #title>
            {{ t('report.ai.failed.title') }}
          </template>
          <template #description>
            {{ t('report.ai.failed.description') }}
          </template>
        </UAlert>
      </Transition>

      <!-- Privacy Warning Banner.
           Advisory variant stays amber/warning. The hard-block variant (#473)
           escalates to error color + role="alert" so it is announced
           assertively and reads as a real blocker, not a dismissible hint. -->
      <Transition name="ai-processing">
        <UAlert
          v-if="props.privacyWarning?.flag"
          :color="props.privacyBlockActive ? 'error' : 'warning'"
          variant="soft"
          icon="i-heroicons-eye-slash"
          class="mt-3"
          :role="props.privacyBlockActive ? 'alert' : undefined"
        >
          <template #title>
            {{ t('report.ai.privacy.title') }}
          </template>
          <template #description>
            <p class="mb-3">
              {{ props.privacyBlockActive
                ? t('report.ai.privacy.required')
                : t('report.ai.privacy.description', { issues: props.privacyWarning.issues.join(', ') }) }}
            </p>
            <!-- Action row wraps and goes full-width on small screens so the
                 sole recovery action is a solid touch target (#473 U5). -->
            <div class="flex flex-wrap gap-2">
              <UButton
                :color="props.privacyBlockActive ? 'error' : 'warning'"
                variant="solid"
                size="sm"
                class="w-full sm:w-auto"
                @click="handleReplaceMedia"
              >
                {{ t('report.ai.privacy.replace') }}
              </UButton>
              <!-- Remove-photo is the second recovery path in block mode:
                   clearing the media resets AI state and lifts the block
                   (#473). Only shown when blocking. -->
              <UButton
                v-if="props.privacyBlockActive"
                color="neutral"
                variant="outline"
                size="sm"
                class="w-full sm:w-auto"
                @click="emit('remove-media')"
              >
                {{ t('report.ai.privacy.removePhoto') }}
              </UButton>
              <!-- Continue-with-photo is hidden when the tenant hard-blocks
                   privacy-critical photos (#473); only replace/remove remain. -->
              <UButton
                v-if="!props.privacyBlockActive"
                color="neutral"
                variant="outline"
                size="sm"
                class="w-full sm:w-auto"
                @click="emit('dismiss-privacy')"
              >
                {{ t('report.ai.privacy.understood') }}
              </UButton>
            </div>
          </template>
        </UAlert>
      </Transition>

      <!-- Off-domain hint: AI could not tie the image to a category.
           aria-hidden: the dedicated sr-only region below owns the screen-reader
           announcement (UAlert's role=alert would announce a second time). -->
      <Transition name="ai-processing">
        <UAlert
          v-if="props.needsManualCategory && !props.isAIProcessing"
          color="info"
          variant="soft"
          icon="i-heroicons-information-circle"
          class="mt-3"
          aria-hidden="true"
        >
          <template #description>
            {{ t('report.ai.category_hint') }}
          </template>
        </UAlert>
      </Transition>

      <!-- Max files warning -->
      <UAlert
        v-if="mediaList.length >= maxFiles && errors.length === 0"
        color="warning"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        class="mt-3"
      >
        <template #description>
          {{ t(UPLOAD_ERRORS.LIMIT_REACHED, { count: maxFiles }) }} — {{ t('errors.upload.remove_to_add') }}
        </template>
      </UAlert>

      <!-- Thumbnail Slots (appear after first upload with smooth transition) -->
      <Transition name="preview-strip">
        <div
          v-if="mediaList.length"
          class="mt-3"
          role="region"
          :aria-label="t('report.form.media.preview')"
        >
          <div
            class="grid gap-2"
            :style="{ gridTemplateColumns: `repeat(${maxFiles}, 1fr)` }"
            role="list"
            :aria-label="t('report.form.media.preview')"
          >
            <template
              v-for="slotIndex in maxFiles"
              :key="slotIndex"
            >
              <!-- Filled slot: thumbnail with remove button -->
              <div
                v-if="mediaList[slotIndex - 1]"
                class="relative group"
                role="listitem"
              >
                <div
                  class="relative aspect-square rounded-lg overflow-hidden bg-[var(--ui-bg-muted)]"
                  :class="{ 'cursor-pointer': canClickThumbnail(mediaList[slotIndex - 1]) }"
                  :role="canClickThumbnail(mediaList[slotIndex - 1]) ? 'button' : undefined"
                  :tabindex="canClickThumbnail(mediaList[slotIndex - 1]) ? 0 : undefined"
                  @click="canClickThumbnail(mediaList[slotIndex - 1]) && emit('thumbnail-click', mediaList[slotIndex - 1])"
                  @keydown.enter="canClickThumbnail(mediaList[slotIndex - 1]) && emit('thumbnail-click', mediaList[slotIndex - 1])"
                >
                  <img
                    :src="mediaList[slotIndex - 1].preview"
                    :alt="t('report.form.media.preview')"
                    class="w-full h-full object-cover transition-all duration-300 ease-out"
                    :class="{
                      'opacity-50 scale-[0.98] blur-[1px]': mediaList[slotIndex - 1].isUploading || mediaList[slotIndex - 1].error,
                      'grayscale opacity-60': props.showStatusIndicators && mediaList[slotIndex - 1].status === false,
                    }"
                  >

                  <!-- Upload Progress -->
                  <div
                    v-if="mediaList[slotIndex - 1].isUploading"
                    class="absolute inset-0 bg-black/50 flex items-center justify-center"
                    role="progressbar"
                    :aria-valuenow="mediaList[slotIndex - 1].progress || 0"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`${t('report.form.media.upload.progress')}: ${Math.round(mediaList[slotIndex - 1].progress || 0)}%`"
                  >
                    <div class="w-10 h-10 relative">
                      <svg
                        class="w-full h-full -rotate-90"
                        viewBox="0 0 36 36"
                      >
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
                          :stroke-dasharray="`${mediaList[slotIndex - 1].progress || 0}, 100`"
                        />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center text-white font-semibold text-[10px]">
                        {{ Math.round(mediaList[slotIndex - 1].progress || 0) }}%
                      </div>
                    </div>
                  </div>

                  <!-- Error State -->
                  <div
                    v-if="mediaList[slotIndex - 1].error"
                    class="absolute inset-0 bg-red-500/75 flex items-center justify-center p-1"
                    role="alert"
                  >
                    <UIcon
                      name="i-heroicons-exclamation-circle"
                      class="w-5 h-5 text-white"
                      aria-hidden="true"
                    />
                  </div>

                  <!-- Offline Cached Indicator -->
                  <div
                    v-if="mediaList[slotIndex - 1].isOfflineCached && !mediaList[slotIndex - 1].isUploading && !mediaList[slotIndex - 1].error"
                    class="absolute bottom-0.5 left-0.5 bg-amber-500/90 text-white rounded-full p-0.5"
                    :title="t('report.form.media.offline_cached') || 'Wird offline gespeichert'"
                  >
                    <UIcon
                      name="i-heroicons-cloud-arrow-up"
                      class="w-2.5 h-2.5"
                      aria-hidden="true"
                    />
                  </div>

                  <!-- Unpublished Indicator -->
                  <div
                    v-if="props.showStatusIndicators && mediaList[slotIndex - 1].status === false"
                    class="absolute bottom-0 inset-x-0 bg-neutral-800/80 text-white text-[9px] font-medium text-center py-0.5 leading-tight"
                  >
                    {{ props.unpublishedLabel }}
                  </div>

                  <!-- Privacy Warning Badge -->
                  <div
                    v-if="props.privacyWarning?.flag && !mediaList[slotIndex - 1].isUploading && !mediaList[slotIndex - 1].error"
                    class="absolute bottom-0.5 right-0.5 bg-amber-500/90 text-white rounded-full p-0.5"
                    :title="t('report.ai.privacy.title')"
                    :aria-label="t('report.ai.privacy.title')"
                    role="img"
                  >
                    <UIcon
                      name="i-heroicons-eye-slash"
                      class="w-2.5 h-2.5"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <!-- Remove Button -->
                <button
                  type="button"
                  class="absolute -top-1.5 -right-1.5 bg-[var(--ui-bg)] rounded-full p-1
                   shadow-md transition-opacity duration-200
                   opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  :aria-label="t('report.form.media.remove')"
                  :disabled="props.disabled"
                  :class="{ 'cursor-not-allowed opacity-50': props.disabled }"
                  @click.stop="!props.disabled && removeImage(mediaList[slotIndex - 1].id)"
                >
                  <UIcon
                    name="i-heroicons-x-mark"
                    class="w-3.5 h-3.5 text-[var(--ui-text-muted)]"
                  />
                </button>
              </div>

              <!-- Next empty slot: active upload trigger -->
              <button
                v-else-if="slotIndex - 1 === mediaList.length"
                type="button"
                class="aspect-square rounded-lg border-2 border-dashed border-[var(--ui-border)]
                 flex items-center justify-center transition-colors duration-200
                 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/30
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                :disabled="props.disabled"
                :aria-label="t('report.form.media.upload.button')"
                @click="!props.disabled && triggerFileInput()"
              >
                <UIcon
                  name="i-heroicons-plus"
                  class="w-5 h-5 text-[var(--ui-text-dimmed)]"
                  aria-hidden="true"
                />
              </button>

              <!-- Remaining empty slots: passive placeholder -->
              <div
                v-else
                class="aspect-square rounded-lg border-2 border-dashed border-[var(--ui-border)] opacity-40"
                aria-hidden="true"
              />
            </template>
          </div>
        </div>
      </Transition>

      <!-- Category requirement hint below upload area -->
      <div
        v-if="categoryRequired && !props.hideRequiredLabeling"
        class="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2 mt-3"
      >
        <UIcon
          name="i-heroicons-information-circle"
          class="w-4 h-4"
        />
        {{ t('report.form.media.required') }}
      </div>

      <!-- Privacy warning announcement (persistent sr-only region for reliable
           screen reader support). Block mode escalates to assertive so the
           hard-block reason interrupts and is not queued behind other polite
           updates (#473 U3). -->
      <div
        id="privacy-warning-announcements"
        :aria-live="props.privacyBlockActive ? 'assertive' : 'polite'"
        aria-atomic="true"
        class="sr-only"
        :role="props.privacyBlockActive ? 'alert' : 'status'"
      >
        {{ props.privacyWarning?.flag
          ? (props.privacyBlockActive
            ? t('report.ai.privacy.required')
            : t('report.ai.privacy.description', { issues: props.privacyWarning.issues.join(', ') }))
          : '' }}
      </div>

      <!-- Off-domain category hint announcement (persistent sr-only region for reliable screen reader support) -->
      <div
        id="category-hint-announcements"
        aria-live="polite"
        aria-atomic="true"
        class="sr-only"
        role="status"
      >
        {{ props.needsManualCategory && !props.isAIProcessing ? t('report.ai.category_hint') : '' }}
      </div>

      <!-- Final AI results announcement area -->
      <div
        v-if="finalResultsAnnouncement"
        id="final-results-announcements"
        aria-live="assertive"
        aria-atomic="true"
        class="sr-only"
        role="alert"
      >
        {{ finalResultsAnnouncement }}
      </div>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useMediaUpload, UPLOAD_ERRORS } from '@/composables/form/useMediaUpload';
import type { UploadedMedia } from '@/composables/form/useMediaUpload';

const { t } = useI18n();

const props = defineProps<{
    uploadedMedia: UploadedMedia[]
    enableAI?: boolean
    isRequired?: boolean
    categoryRequired?: boolean
    hideRequiredLabeling?: boolean
    disabled?: boolean
    hasInteracted?: boolean
    showAINotice?: boolean
    scrollContainer?: HTMLElement
    isAIProcessing?: boolean
    aiAnalysisFailed?: boolean
    processingSteps?: Array<{ field: string, status: 'pending' | 'complete' | 'warning', message: string }>
    aiResults?: { category?: string, description?: string, location?: string }
    privacyWarning?: { flag: boolean, issues: string[] } | null
    /** #473: hard-block mode — hide "continue with photo", sharpen the text. */
    privacyBlockActive?: boolean
    needsManualCategory?: boolean
    showStatusIndicators?: boolean
    unpublishedLabel?: string
}>();

const emit = defineEmits<{
    'update:media': [media: UploadedMedia[]]
    'files-selected': [count: number]
    'ai-complete': []
    'location-detected': [location: { lat: number, lng: number }]
    'thumbnail-click': [media: UploadedMedia]
    'dismiss-privacy': []
    'replace-media': []
    'remove-media': []
}>();

const aiProcessingSection = ref<HTMLElement | null>(null);

const {
    fileInput,
    uploadArea,
    isDragging,
    uploadedMedia: mediaList,
    errors,
    hasUserInteracted,
    rateLimitMessage,
    isUploading,
    overallProgress,
    isAIEnabled,
    isAndroid,
    uploadStatusAnnouncement,
    aiStatusAnnouncement,
    finalResultsAnnouncement,
    maxFiles,
    uploadAreaId,
    fileInputId,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    triggerFileInput,
    removeImage,
    uploadedMedia: composableMedia,
    announceAIStart,
    announceAIComplete,
    announceUploadResult
} = useMediaUpload(
    {
        enableAI: toRef(props, 'enableAI'),
        disabled: toRef(props, 'disabled'),
        hasInteracted: toRef(props, 'hasInteracted'),
        initialMedia: toRef(props, 'uploadedMedia')
    },
    {
        updateMedia: media => emit('update:media', media),
        filesSelected: count => emit('files-selected', count),
        locationDetected: location => emit('location-detected', location)
    }
);

const canClickThumbnail = (media: UploadedMedia) =>
    !media.isUploading && !media.error && !media.isOfflineCached;

const uploadRequiredError = computed(() => {
    if (!props.isRequired || !hasUserInteracted.value || mediaList.value.length > 0) {
        return undefined;
    }

    return t('errors.validation.required_field', { field: t('fields.field_request_media') });
});

// Deferred replace: only clear media when new files are actually selected
const pendingReplace = ref(false);

const handleReplaceMedia = () => {
    pendingReplace.value = true;
    triggerFileInput();
};

const onFileInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (pendingReplace.value && input.files?.length) {
        // Clear composable's internal media BEFORE handleFileSelect adds the new file.
        // Without this, handleFiles() appends to the still-populated internal array.
        for (const m of composableMedia.value) {
            if (m.preview?.startsWith('blob:')) URL.revokeObjectURL(m.preview);
        }
        composableMedia.value = [];
        emit('replace-media');
        pendingReplace.value = false;
    }
    handleFileSelect(event);
};

// Scroll to AI processing section
const scrollToAIProcessing = () => {
    nextTick(() => {
        setTimeout(() => {
            aiProcessingSection.value?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    });
};

// Watch for AI processing state changes
watch(() => props.isAIProcessing, (isProcessing, wasProcessing) => {
    if (isProcessing) {
        announceAIStart();
        scrollToAIProcessing();
    }
    if (wasProcessing && !isProcessing) {
        announceAIComplete();
        setTimeout(() => emit('ai-complete'), 1000);
    }
});

// Watch for AI results to announce them
watch(() => props.aiResults, (newResults) => {
    if (newResults) {
        setTimeout(() => announceUploadResult(newResults), 1000);
    }
}, { deep: true });
</script>

<style scoped>
.aspect-square {
  aspect-ratio: 1 / 1;
}

.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: none;
}

[id^="upload-area"] {
  touch-action: auto;
  overscroll-behavior-x: auto;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

[id^="upload-area"] input[type="file"],
[id^="upload-area"] button {
  touch-action: manipulation;
  -webkit-touch-callout: default;
  pointer-events: auto;
}

button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* AI Processing Transitions */
.ai-processing-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-processing-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-processing-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  filter: blur(2px);
}

.ai-processing-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
  filter: blur(1px);
}

.ai-processing-enter-to,
.ai-processing-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.ai-processing-enter-active,
.ai-processing-leave-active {
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              margin 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-processing-leave-active {
  transition-duration: 0.6s;
}

.ai-processing-enter-from,
.ai-processing-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

/* Preview Strip Transition - smooth entry after first upload */
.preview-strip-enter-active {
  transition: opacity 0.3s ease-out, max-height 0.3s ease-out, margin-top 0.3s ease-out;
  overflow: hidden;
}

.preview-strip-leave-active {
  transition: opacity 0.2s ease-in, max-height 0.2s ease-in, margin-top 0.2s ease-in;
  overflow: hidden;
}

.preview-strip-enter-from,
.preview-strip-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.preview-strip-enter-to,
.preview-strip-leave-from {
  opacity: 1;
  max-height: 50vw;
  margin-top: 0.75rem;
}
</style>
