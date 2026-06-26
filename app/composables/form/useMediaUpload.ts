import { useI18n } from 'vue-i18n';
import type { OptimizationOptions } from '@/utils/imageUtils';
import { optimizeImage } from '@/utils/imageUtils';
import { extractGeodata } from '@/utils/exif-helper';
import { MEDIA_DEFAULTS } from '~/constants/media';
import type { UploadedMedia } from '@/types/form';

export type { UploadedMedia };

const MAX_CONCURRENT_UPLOADS = 3;
const MAX_CONCURRENT_PROCESSING = 1;

type ResolvedMediaConfig = {
    maxFiles: number
    maxRawFileSize?: number
    maxOptimizedFileSize?: number
    maxFileSize?: number
    allowedTypes: string[]
    maxDimensions: {
        width: number
        height: number
    }
    optimize: {
        maxWidth: number
        maxHeight: number
        quality: number
        format: NonNullable<OptimizationOptions['format']>
    }
};

export const UPLOAD_ERRORS = {
    INVALID_TYPE: 'errors.upload.invalid_type',
    FILE_TOO_LARGE: 'errors.upload.file_too_large',
    FILE_TOO_LARGE_RAW: 'errors.upload.file_too_large_raw',
    OPTIMIZATION_FAILED: 'errors.upload.optimization_failed',
    DIMENSIONS_TOO_LARGE: 'errors.upload.dimensions_too_large',
    INVALID_IMAGE: 'errors.upload.invalid_image',
    UPLOAD_FAILED: 'errors.upload.failed',
    LIMIT_REACHED: 'errors.upload.limit_reached',
    RATE_LIMIT_EXCEEDED: 'errors.rate_limit.title'
} as const;

interface UseMediaUploadOptions {
    enableAI?: Ref<boolean | undefined>
    disabled?: Ref<boolean | undefined>
    hasInteracted?: Ref<boolean | undefined>
    initialMedia: Ref<UploadedMedia[]>
}

interface UseMediaUploadEmits {
    updateMedia: (media: UploadedMedia[]) => void
    filesSelected: (count: number) => void
    locationDetected: (location: { lat: number, lng: number }) => void
}

export function useMediaUpload(options: UseMediaUploadOptions, emits: UseMediaUploadEmits) {
    const { t } = useI18n();
    const { settings } = useFormSettings();
    const { uploadMedia } = useServiceRequest();
    const { clientConfig } = useMarkASpotConfig();
    const { isOnline } = useOnlineStatus();
    const { offlineEnabled } = useFeatureFlags();
    const offlineDb = useOfflineDb();
    const runtimeConfig = useRuntimeConfig();
    // Shared geolocation acquisition (dedup + shared lastPosition state) instead
    // of a second direct navigator.geolocation path.
    const { getCurrentPosition: getDeviceLocation } = useGeolocation();

    // State
    const fileInput = ref<HTMLInputElement | null>(null);
    const uploadArea = ref<HTMLElement | null>(null);
    const isDragging = ref(false);
    const uploadedMedia = ref<UploadedMedia[]>(options.initialMedia.value);
    const uploadQueue = ref<Array<{ file: File, tempId: string }>>([]);
    const activeUploads = ref(new Set<string>());
    const processingQueue = ref<Array<{ file: File, tempId: string }>>([]);
    const activeProcessing = ref(new Set<string>());
    const errors = ref<Array<string | { key: string, params?: Record<string, any> }>>([]);
    const hasUserInteracted = ref(options.hasInteracted?.value || false);
    const rateLimitMessage = ref('');
    const processedFileKeys = new Set<string>();

    // Screen reader announcement state
    const lastAnnouncedProgress = ref(0);
    const uploadStatusAnnouncement = ref('');
    const aiStatusAnnouncement = ref('');
    const finalResultsAnnouncement = ref('');

    // IDs
    const uploadAreaId = `upload-area-${Math.random().toString(36).slice(2, 9)}`;
    const fileInputId = `${uploadAreaId}-input`;

    // Platform detection
    const isAndroid = computed(() => {
        if (import.meta.server) return false;
        return /Android/i.test(navigator.userAgent);
    });

    // AI enabled check
    const isAIEnabled = computed(() =>
        options.enableAI?.value === true
    );

    // Config
    const fieldConfig = computed(() => settings.value?.fields?.field_request_media || {});
    const fieldCardinality = computed(() => Number(fieldConfig.value?.cardinality) || -1);

    const mediaConfig = computed<ResolvedMediaConfig>(() => {
        const mediaClientConfig = clientConfig.value?.features?.media ||
          runtimeConfig.public.clientConfig?.features?.media || {};
        const optimizeFormat = mediaClientConfig.optimize?.format;
        const configWithClientOverrides: ResolvedMediaConfig = {
            ...MEDIA_DEFAULTS,
            ...mediaClientConfig,
            allowedTypes: [...(mediaClientConfig.allowedTypes || MEDIA_DEFAULTS.allowedTypes)],
            maxDimensions: {
                ...MEDIA_DEFAULTS.maxDimensions,
                ...(mediaClientConfig.maxDimensions || {})
            },
            optimize: {
                ...MEDIA_DEFAULTS.optimize,
                ...(mediaClientConfig.optimize || {}),
                format: optimizeFormat === 'png' || optimizeFormat === 'webp' || optimizeFormat === 'jpeg'
                    ? optimizeFormat
                    : MEDIA_DEFAULTS.optimize.format
            }
        };
        if (fieldCardinality.value > 0) {
            configWithClientOverrides.maxFiles = fieldCardinality.value;
        }
        return configWithClientOverrides;
    });

    const maxFiles = computed(() => mediaConfig.value.maxFiles);
    const maxRawFileSize = computed(() => mediaConfig.value.maxRawFileSize || mediaConfig.value.maxFileSize || 100 * 1024 * 1024);
    const maxOptimizedFileSize = computed(() => mediaConfig.value.maxOptimizedFileSize || 5 * 1024 * 1024);
    const allowedTypes = computed(() => mediaConfig.value.allowedTypes);
    const maxDimensions = computed(() => mediaConfig.value.maxDimensions);
    const optimizeConfig = computed(() => mediaConfig.value.optimize);

    const isUploading = computed(() => uploadedMedia.value.some(m => m.isUploading));
    const overallProgress = computed(() => {
        const totalMedia = uploadedMedia.value.length;
        if (!totalMedia) return 0;
        const weightPerMedia = 100 / totalMedia;
        return Math.round(uploadedMedia.value.reduce((sum, media) => {
            if (!media.isUploading) return sum + weightPerMedia;
            return sum + ((media.progress || 0) * weightPerMedia / 100);
        }, 0));
    });

    // --- Screen reader announcements ---

    const announceUploadProgress = (progress: number) => {
        const milestones = [50, 100];
        const currentMilestone = milestones.find(m => progress >= m && lastAnnouncedProgress.value < m);
        if (currentMilestone) {
            lastAnnouncedProgress.value = currentMilestone;
            uploadStatusAnnouncement.value = currentMilestone === 100
                ? t('report.form.media.upload.success_sr')
                : t('report.form.media.upload.progress_sr', { progress: currentMilestone });
            setTimeout(() => {
                uploadStatusAnnouncement.value = '';
            }, 1500);
        }
    };

    const announceUploadStart = () => {
        lastAnnouncedProgress.value = 0;
        uploadStatusAnnouncement.value = t('report.form.media.upload.started_sr');
        setTimeout(() => {
            uploadStatusAnnouncement.value = '';
        }, 2000);
    };

    const announceUploadError = (errorMessage: string) => {
        uploadStatusAnnouncement.value = t('report.form.media.upload.error_sr', { error: errorMessage });
        setTimeout(() => {
            uploadStatusAnnouncement.value = '';
        }, 3000);
    };

    const announceAIStart = () => {
        aiStatusAnnouncement.value = t('report.ai.started_sr');
        setTimeout(() => {
            aiStatusAnnouncement.value = '';
        }, 2000);
    };

    const announceAIComplete = () => {
        aiStatusAnnouncement.value = t('report.ai.complete_sr');
        setTimeout(() => {
            aiStatusAnnouncement.value = '';
        }, 2000);
    };

    const announceUploadResult = (results: { category?: string, description?: string, location?: string }) => {
        let announcement = t('report.form.media.upload.complete_sr');
        if (results.category || results.description) {
            announcement += ` ${t('report.ai.analysis_complete_sr')}`;
            if (results.category) {
                announcement += ` ${t('report.ai.category_result_sr', { category: results.category })}`;
            }
            if (results.description) {
                const shortDescription = results.description.length > 100
                    ? results.description.substring(0, 100) + '...'
                    : results.description;
                announcement += ` ${t('report.ai.description_result_sr', { description: shortDescription })}`;
            }
        }
        finalResultsAnnouncement.value = announcement;
        setTimeout(() => {
            finalResultsAnnouncement.value = '';
        }, 10000);
    };

    // --- Helpers ---

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    // --- Validation ---

    const quickValidateFile = (file: File): boolean => {
        const isValidType = allowedTypes.value.includes(file.type);
        const isValidRawSize = file.size <= maxRawFileSize.value;

        if (!isValidType) {
            errors.value.push(UPLOAD_ERRORS.INVALID_TYPE);
            return false;
        }
        if (!isValidRawSize) {
            errors.value.push({
                key: UPLOAD_ERRORS.FILE_TOO_LARGE_RAW,
                params: { size: formatFileSize(maxRawFileSize.value) }
            });
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
                    reject(new Error(JSON.stringify({
                        key: UPLOAD_ERRORS.DIMENSIONS_TOO_LARGE,
                        params: { width: maxDimensions.value.width, height: maxDimensions.value.height }
                    })));
                    return;
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

    // --- Location extraction ---

    const extractLocationData = async (file: File): Promise<void> => {
        try {
            const exifData = await extractGeodata(file);
            if (exifData?.lat && exifData?.lng) {
                emits.locationDetected({ lat: exifData.lat, lng: exifData.lng });
                return;
            }
            // No EXIF geotag: fall back to the device location via the shared
            // geolocation composable. silent:true keeps this a soft fallback (no
            // error toast) — a missing/denied location here is expected, not a
            // user-facing failure.
            const coords = await getDeviceLocation({ timeout: 10000 }, { silent: true });
            emits.locationDetected({ lat: coords.lat, lng: coords.lng });
        } catch (error) {
            // Soft failure: neither EXIF nor device location available. Stay silent.
            if (import.meta.dev) {
                console.warn('[useMediaUpload] No location from EXIF or device:', error);
            }
        }
    };

    // --- Drag & drop ---

    const handleDragEnter = (event: DragEvent) => {
        hasUserInteracted.value = true;
        if (event.dataTransfer?.types.includes('Files')) {
            isDragging.value = true;
            event.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDragOver = (event: DragEvent) => {
        if (event.dataTransfer?.types.includes('Files')) {
            isDragging.value = true;
            event.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDragLeave = (event: DragEvent) => {
        const uploadAreaElement = uploadArea.value;
        if (uploadAreaElement && event.relatedTarget instanceof Node) {
            if (!uploadAreaElement.contains(event.relatedTarget)) {
                isDragging.value = false;
            }
        } else {
            setTimeout(() => {
                if (!uploadArea.value?.matches(':hover')) {
                    isDragging.value = false;
                }
            }, 100);
        }
    };

    const handleDrop = (event: DragEvent) => {
        isDragging.value = false;
        if (event.dataTransfer?.files) {
            handleFiles(event.dataTransfer.files);
        }
    };

    // --- File handling ---

    const triggerFileInput = () => {
        if (!options.disabled?.value && fileInput.value) {
            hasUserInteracted.value = true;
            fileInput.value.click();
        }
    };

    const handleFileSelect = (event: Event) => {
        hasUserInteracted.value = true;
        const input = event.target as HTMLInputElement;
        if (input.files) {
            handleFiles(input.files);
            const fileCount = input.files?.length || 0;
            if (fileCount > 0) {
                uploadStatusAnnouncement.value = t('report.form.media.upload.files_selected_sr', { count: fileCount });
                setTimeout(() => {
                    uploadStatusAnnouncement.value = '';
                }, 2000);
            }
        }
        input.value = '';
    };

    const handleFiles = async (files: FileList) => {
        if (options.disabled?.value) return;
        errors.value = [];

        const remainingSlots = maxFiles.value - uploadedMedia.value.length;
        if (remainingSlots <= 0) return;

        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        for (const file of filesToProcess) {
            // Deduplicate by file fingerprint (prevents double-adds on Android)
            const fileKey = `${file.name}:${file.size}:${file.lastModified}`;
            if (processedFileKeys.has(fileKey)) continue;
            processedFileKeys.add(fileKey);

            if (!quickValidateFile(file)) continue;

            const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const newMedia: UploadedMedia = {
                id: tempId,
                preview: URL.createObjectURL(file),
                isUploading: true,
                progress: 0
            };

            uploadedMedia.value = [...uploadedMedia.value, newMedia];
            emits.updateMedia(uploadedMedia.value);
            emits.filesSelected(1);
            announceUploadStart();
            processingQueue.value.push({ file, tempId });
        }
        processFileQueue();
    };

    // --- Processing & upload queues ---

    const processFileQueue = async () => {
        while (processingQueue.value.length > 0 && activeProcessing.value.size < MAX_CONCURRENT_PROCESSING) {
            const item = processingQueue.value.shift();
            if (!item) continue;

            const { file, tempId } = item;
            activeProcessing.value.add(tempId);

            try {
                await validateFile(file);
                await extractLocationData(file);
                const optimizedFile = await optimizeImage(file, optimizeConfig.value);

                if (optimizedFile.size > maxOptimizedFileSize.value) {
                    throw new Error(JSON.stringify({
                        key: UPLOAD_ERRORS.OPTIMIZATION_FAILED,
                        params: { size: formatFileSize(maxOptimizedFileSize.value) }
                    }));
                }

                const mediaIndex = uploadedMedia.value.findIndex(m => m.id === tempId);
                if (mediaIndex !== -1) {
                    const oldPreview = uploadedMedia.value[mediaIndex].preview;
                    const newPreview = URL.createObjectURL(optimizedFile);
                    requestAnimationFrame(() => {
                        uploadedMedia.value[mediaIndex].preview = newPreview;
                        setTimeout(() => {
                            if (oldPreview?.startsWith('blob:')) URL.revokeObjectURL(oldPreview);
                        }, 350);
                    });
                }

                uploadQueue.value.push({ file: optimizedFile, tempId });
                processUploadQueue();
            } catch (error) {
                handleProcessingError(tempId, error);
            } finally {
                activeProcessing.value.delete(tempId);
                if (processingQueue.value.length > 0) {
                    setTimeout(() => processFileQueue(), 50);
                }
            }
        }
    };

    const processUploadQueue = async () => {
        while (uploadQueue.value.length > 0 && activeUploads.value.size < MAX_CONCURRENT_UPLOADS) {
            const { file, tempId } = uploadQueue.value.shift()!;
            activeUploads.value.add(tempId);
            uploadFile(file, tempId).catch((err) => {
                console.error('Upload error:', err);
                handleUploadError(tempId, err);
            });
        }
    };

    /**
     * Try to cache media to IndexedDB for offline use.
     * Returns true if caching succeeded, false otherwise.
     */
    const tryCacheMediaOffline = async (file: File, tempId: string): Promise<boolean> => {
        if (!offlineEnabled.value || !offlineDb.isAvailable) return false;

        try {
            const cachedId = await offlineDb.cacheMedia(file, file.name);
            uploadedMedia.value = uploadedMedia.value.map(media =>
                media.id === tempId
                    ? { ...media, cachedId, isOfflineCached: true, isUploading: false, progress: 100 }
                    : media
            );
            emits.updateMedia(uploadedMedia.value);
            announceUploadProgress(100);
            return true;
        } catch (cacheError) {
            if (import.meta.dev) console.warn('[MediaUpload] Offline cache failed:', cacheError);
            return false;
        }
    };

    const uploadFile = async (file: File, tempId: string) => {
        try {
            // Offline-first: cache to IndexedDB instead of uploading
            if (!isOnline.value && await tryCacheMediaOffline(file, tempId)) {
                return;
            }

            const onProgress = (progress: number) => {
                const mediaIndex = uploadedMedia.value.findIndex(m => m.id === tempId);
                if (mediaIndex !== -1) {
                    const normalizedProgress = Math.max(0, Math.min(100, progress));
                    uploadedMedia.value[mediaIndex].progress = normalizedProgress;
                    emits.updateMedia(uploadedMedia.value);
                    announceUploadProgress(normalizedProgress);
                }
            };

            const response = await uploadMedia(file, onProgress);
            const mediaId = response.data?.id;
            if (!mediaId) throw new Error('No media ID found in response');

            uploadedMedia.value = uploadedMedia.value.map(media =>
                media.id === tempId
                    ? { ...media, id: mediaId, isUploading: false, progress: 100 }
                    : media
            );
            emits.updateMedia(uploadedMedia.value);
        } catch (error) {
            // Fallback: if online upload failed and we're now offline, try caching
            if (!isOnline.value && await tryCacheMediaOffline(file, tempId)) {
                return;
            }
            handleUploadError(tempId, error);
        } finally {
            activeUploads.value.delete(tempId);
            processUploadQueue();
        }
    };

    // --- Error handling ---

    const handleProcessingError = (tempId: string, error: any) => {
        const mediaIndex = uploadedMedia.value.findIndex(m => m.id === tempId);
        if (mediaIndex !== -1) {
            let errorMessage = error.message || UPLOAD_ERRORS.INVALID_IMAGE;
            try {
                const parsedError = JSON.parse(errorMessage);
                if (parsedError.key && parsedError.params) errorMessage = parsedError;
            } catch { /* use as string */ }

            uploadedMedia.value[mediaIndex] = {
                ...uploadedMedia.value[mediaIndex],
                error: errorMessage,
                isUploading: false
            };
            emits.updateMedia(uploadedMedia.value);
        }
    };

    const handleUploadError = (tempId: string, error: any) => {
        console.error('Upload error:', error);

        let displayError: string = UPLOAD_ERRORS.UPLOAD_FAILED;
        const isRateLimit = error?.response?.status === 429 ||
          error?.status === 429 ||
          error?.message?.includes('Rate limit exceeded') ||
          error?.message?.includes('Too Many Requests');

        if (isRateLimit) {
            const waitTimeMatch = error?.message?.match(/(\d+)\s*seconds?/);
            displayError = waitTimeMatch
                ? t('errors.rate_limit.with_time', { seconds: waitTimeMatch[1] })
                : t('errors.rate_limit.general');
        }

        const mediaIndex = uploadedMedia.value.findIndex(m => m.id === tempId);
        if (mediaIndex !== -1) {
            uploadedMedia.value[mediaIndex] = {
                ...uploadedMedia.value[mediaIndex],
                error: isRateLimit ? UPLOAD_ERRORS.RATE_LIMIT_EXCEEDED : UPLOAD_ERRORS.UPLOAD_FAILED,
                isUploading: false
            };
            emits.updateMedia(uploadedMedia.value);
        }

        if (isRateLimit) {
            rateLimitMessage.value = typeof displayError === 'string' ? displayError : t(displayError);
            setTimeout(() => {
                rateLimitMessage.value = '';
            }, 60000);
        } else {
            errors.value.push(displayError);
        }
        announceUploadError(t(displayError));
    };

    // --- Remove & retry ---

    const removeImage = async (mediaId: string) => {
        const media = uploadedMedia.value.find(m => m.id === mediaId);
        if (media?.preview?.startsWith('blob:')) URL.revokeObjectURL(media.preview);

        if (media?.cachedId && offlineDb.isAvailable) {
            try {
                await offlineDb.deleteMedia(media.cachedId);
            } catch (error) {
                console.error('[MediaUpload] Failed to delete cached media:', error);
            }
        }

        uploadedMedia.value = uploadedMedia.value.filter(item => item.id !== mediaId);
        // Allow re-adding the same file after removal
        processedFileKeys.clear();
        emits.updateMedia(uploadedMedia.value);
    };

    const retryUpload = async (media: UploadedMedia) => {
        if (options.disabled?.value || uploadedMedia.value.length >= maxFiles.value) return;
        const mediaIdToRemove = media.id;
        errors.value = [];

        if (fileInput.value) {
            const originalOnChange = fileInput.value.onchange;
            fileInput.value.onchange = (event) => {
                const input = event.target as HTMLInputElement;
                const selectedFiles = input.files;
                if (selectedFiles && selectedFiles.length > 0) removeImage(mediaIdToRemove);
                if (selectedFiles) handleFiles(selectedFiles);
                input.value = '';
                fileInput.value!.onchange = originalOnChange;
            };
            fileInput.value.click();
        }
    };

    // --- Watchers ---

    watch(overallProgress, (newProgress, oldProgress) => {
        if (newProgress > oldProgress) announceUploadProgress(newProgress);
    });

    watch(() => options.initialMedia.value, (newVal) => {
        uploadedMedia.value = newVal;
    }, { deep: true });

    watch(() => options.hasInteracted?.value, (newValue) => {
        if (newValue) hasUserInteracted.value = true;
    });

    // --- Cleanup ---

    onBeforeUnmount(() => {
        // Do NOT revoke blob preview URLs here. Form state persistence
        // needs them alive for async base64 serialization (getFormState).
        // The browser garbage-collects blob URLs on page navigation.
        processingQueue.value = [];
        activeProcessing.value.clear();
        uploadQueue.value = [];
        activeUploads.value.clear();
        processedFileKeys.clear();
    });

    return {
        // Refs (for template binding)
        fileInput,
        uploadArea,

        // State
        isDragging,
        uploadedMedia,
        errors,
        hasUserInteracted,
        rateLimitMessage,
        isUploading,
        overallProgress,
        isAIEnabled,
        isAndroid,

        // Announcements
        uploadStatusAnnouncement,
        aiStatusAnnouncement,
        finalResultsAnnouncement,

        // Config
        maxFiles,
        uploadAreaId,
        fileInputId,

        // Handlers
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileSelect,
        triggerFileInput,
        removeImage,
        retryUpload,

        // Announcement helpers (for parent AI watchers)
        announceAIStart,
        announceAIComplete,
        announceUploadResult
    };
}
