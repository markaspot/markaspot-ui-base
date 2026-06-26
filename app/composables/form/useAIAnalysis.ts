/**
 * Composable for AI-powered photo analysis in the PhotoReportForm.
 *
 * Handles: triggering AI analysis, animated text typing for description,
 * smooth category selection, processing step tracking, and location detection.
 */

import type { Ref } from 'vue';
import type { ServiceDefinitionAttribute } from '~~/types/category';

export interface AIAnalysisResult {
    category?: number | string
    description?: string
    privacy_flag?: boolean
    privacy_issues?: string[]
    privacy_handled_by_blur?: boolean
    is_reportable_issue?: boolean
    blurred_previews?: Record<string, string>
    attributes?: Array<{ code: string, value: string | null }>
}

interface ProcessingStep {
    field: string
    status: 'pending' | 'complete' | 'warning'
    message: string
}

interface CategoryItem {
    id: string
    attributes: {
        name: string
        drupal_internal__tid?: number
        [key: string]: any
    }
}

interface LocationValue {
    lat: string
    lng: string
    address: any
    displayName: string
}

interface MediaItem {
    id: string
    isUploading: boolean
    error?: string | { key: string, params?: Record<string, any> }
    [key: string]: any
}

type PrivacyWarningInput = Pick<
    AIAnalysisResult,
    'privacy_flag' | 'privacy_issues' | 'privacy_handled_by_blur'
>;

interface UseAIAnalysisOptions {
    description: Ref<string>
    category: Ref<string>
    location: Ref<LocationValue>
    uploadedMedia: Ref<MediaItem[]>
    categories: Ref<CategoryItem[]>
    onFieldValidation?: (fieldName: string, isValid: boolean) => void
    attributeValues?: Record<string, any>
    visibleAttributes?: Ref<ServiceDefinitionAttribute[]>
}

/**
 * Validates and applies AI-suggested attribute values with type-specific checks.
 * Uses a convergence loop to handle conditional attributes at any chain depth:
 * each pass applies attributes whose trigger fields were set in a prior pass,
 * stopping when no more progress can be made.
 */
export function applyAIAttributes(
    attributes: Array<{ code: string, value: string | null }>,
    attributeValues: Record<string, any>,
    visibleAttributes?: Ref<ServiceDefinitionAttribute[]>
): number {
    let filledCount = 0;

    const applyOne = (attr: { code: string, value: string | null }): boolean => {
        if (!attr.code || attr.value == null || attr.value === '') return false;

        const def = visibleAttributes?.value?.find(a => a.code === attr.code);
        if (!def) return false;

        const validKeys = (def.values || []).map(v => v.key);
        const stripped = typeof attr.value === 'string'
            ? attr.value.replace(/<[^>]*>/g, '').trim()
            : attr.value;

        switch (def.datatype) {
            case 'singlevaluelist':
                if (!validKeys.includes(stripped)) return false;
                attributeValues[attr.code] = stripped;
                break;
            case 'multivaluelist': {
                const filtered = stripped.split(',')
                    .map((v: string) => v.trim())
                    .filter(v => validKeys.includes(v));
                if (filtered.length === 0) return false;
                attributeValues[attr.code] = filtered;
                break;
            }
            case 'number': {
                const n = Number(stripped);
                if (Number.isNaN(n)) return false;
                const v = def.validation;
                if (v?.min !== undefined && n < v.min) return false;
                if (v?.max !== undefined && n > v.max) return false;
                attributeValues[attr.code] = n;
                break;
            }
            case 'datetime':
                if (!/^\d{4}-\d{2}-\d{2}/.test(stripped)) return false;
                attributeValues[attr.code] = stripped;
                break;
            case 'imagelist':
                // AI cannot select images, skip
                return false;
            default:
                // string, text
                attributeValues[attr.code] = stripped;
                break;
        }
        return true;
    };

    // Convergence loop: keep iterating until no more attributes can be applied.
    // Each pass may unlock conditional attributes whose triggers were set in a prior pass.
    // Safe against cycles: no progress = immediate termination.
    let remaining = attributes.filter(a => a.code && a.value != null && a.value !== '');
    let madeProgress = true;

    while (madeProgress && remaining.length > 0) {
        madeProgress = false;
        const stillDeferred: typeof attributes = [];

        for (const attr of remaining) {
            if (applyOne(attr)) {
                filledCount++;
                madeProgress = true;
            } else {
                stillDeferred.push(attr);
            }
        }

        remaining = stillDeferred;
    }

    return filledCount;
}

export function shouldShowPrivacyWarning(aiData: PrivacyWarningInput): boolean {
    return aiData.privacy_flag === true &&
      aiData.privacy_handled_by_blur !== true &&
      (aiData.privacy_issues?.length ?? 0) > 0;
}

/**
 * Whether to ask the citizen to pick a category manually.
 *
 * The backend forces the model to return a category, so off-domain images
 * (a portrait, an unrelated object) get a confabulated one. When the model
 * reports the image is not a reportable issue, we skip the AI suggestions and
 * prompt the citizen to choose. Uses `=== false` so an omitted field (older
 * backend) keeps the previous auto-fill behaviour.
 */
export function shouldRequestManualCategory(
    aiData: Pick<AIAnalysisResult, 'is_reportable_issue'>
): boolean {
    return aiData.is_reportable_issue === false;
}

/**
 * The blurred (privacy-protected) preview data URL for a media, if any.
 *
 * The backend returns blurred thumbnails (data URLs) keyed by media id for
 * images where it actually blurred faces/plates. Guarded to a `data:` URL so a
 * malformed value can never be set as an image src.
 */
export function resolveBlurredPreview(
    mediaId: string,
    blurredPreviews: Record<string, string> | undefined
): string | null {
    const url = blurredPreviews?.[mediaId];
    return typeof url === 'string' && url.startsWith('data:') ? url : null;
}

export function useAIAnalysis(options: UseAIAnalysisOptions) {
    const { t, locale } = useI18n();
    const { fetchAIResults } = useServiceRequest();
    const { isAIBudgetExhausted, incrementUsage } = useAIBudget();

    const {
        description,
        category,
        location,
        uploadedMedia,
        categories,
        onFieldValidation
    } = options;

    // State
    const isAIProcessing = ref(false);
    const aiAnalysisComplete = ref(false);
    const aiSkippedBudget = ref(false);
    const activeField = ref<string | null>(null);
    const processingSteps = ref<ProcessingStep[]>([]);
    const privacyWarning = ref<{ flag: boolean, issues: string[] } | null>(null);
    const needsManualCategory = ref(false);
    const aiAnalysisFailed = ref(false);

    const updateProcessingStep = (field: string, status: 'pending' | 'complete' | 'warning', message: string) => {
        const stepIndex = processingSteps.value.findIndex(step => step.field === field);
        if (stepIndex > -1) {
            processingSteps.value[stepIndex] = { field, status, message };
        } else {
            processingSteps.value.push({ field, status, message });
        }
    };

    const typeText = async (text: string) => {
        activeField.value = 'description';
        description.value = '';

        const typingSpeed = 15;
        const words = text.split(' ');

        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];

            for (let charIndex = 0; charIndex < word.length; charIndex++) {
                description.value += word[charIndex];
                const variation = Math.random() * 8 - 4;
                await new Promise(resolve => setTimeout(resolve, typingSpeed + variation));
            }

            if (wordIndex < words.length - 1) {
                description.value += ' ';
                await new Promise(resolve => setTimeout(resolve, typingSpeed + 10));
            }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        activeField.value = null;
    };

    const selectCategorySmoothly = async (categoryOption: CategoryItem) => {
        activeField.value = 'category';
        await new Promise(resolve => setTimeout(resolve, 150));
        category.value = categoryOption.id;
        await new Promise(resolve => setTimeout(resolve, 100));
        activeField.value = null;
    };

    const runAIAnalysis = async () => {
        if (isAIProcessing.value) return;
        if (aiAnalysisComplete.value) {
            console.log('⏭️ AI: Skipping analysis - already complete');
            return;
        }

        // Skip AI analysis when budget is exhausted (report proceeds without AI)
        if (isAIBudgetExhausted.value) {
            console.log('⏭️ AI: Skipping analysis - budget exhausted');
            aiSkippedBudget.value = true;
            aiAnalysisComplete.value = true;
            return;
        }

        isAIProcessing.value = true;
        processingSteps.value = [];
        updateProcessingStep('ai_analysis', 'pending', t('report.ai.processing.analyzing'));

        try {
            const mediaIds = uploadedMedia.value
                .filter(media => !media.isUploading && !media.error)
                .map(media => media.id);

            if (!mediaIds.length) {
                throw new Error(t('report.errors.no_media'));
            }

            const aiData: AIAnalysisResult = await fetchAIResults(mediaIds, locale.value);

            // Swap the upload thumbnail to the privacy-blurred version so the
            // citizen sees their photo protected (the local preview is the
            // unblurred original). Backend sends data: URLs of the user's own
            // already-anonymised bytes; revoke the old blob URLs.
            if (aiData.blurred_previews) {
                for (const media of uploadedMedia.value) {
                    const blurred = resolveBlurredPreview(media.id, aiData.blurred_previews);
                    if (blurred) {
                        const oldPreview = media.preview;
                        media.preview = blurred;
                        if (typeof oldPreview === 'string' && oldPreview.startsWith('blob:')) {
                            URL.revokeObjectURL(oldPreview);
                        }
                    }
                }
            }

            // User feedback is only needed when privacy findings were not already remediated by blur preprocessing.
            const hasPrivacyConcern = shouldShowPrivacyWarning(aiData);
            if (hasPrivacyConcern) {
                const issuesText = aiData.privacy_issues!.join(', ');
                updateProcessingStep('privacy', 'warning', `${t('report.ai.processing.privacy_warning')}: ${issuesText}`);
                privacyWarning.value = { flag: true, issues: aiData.privacy_issues! };
            }

            // Off-domain image: the model could not tie it to a reportable issue.
            // Skip the confabulated category/description/attributes and ask the
            // citizen to choose. Non-blocking: they can still fill and submit.
            needsManualCategory.value = shouldRequestManualCategory(aiData);
            if (needsManualCategory.value) {
                updateProcessingStep('category', 'warning', t('report.ai.category_hint'));
            }

            if (!needsManualCategory.value && aiData.category) {
                updateProcessingStep('category', 'pending', t('report.ai.processing.category'));
                await new Promise(resolve => setTimeout(resolve, 500));

                const categoryIdStr = aiData.category.toString();
                const matchingCategory = categories.value?.find(
                    cat => cat.id === categoryIdStr ||
                      cat.id === aiData.category ||
                      (cat.attributes as any).drupal_internal__tid === aiData.category
                );

                if (matchingCategory) {
                    await selectCategorySmoothly(matchingCategory);
                    onFieldValidation?.('field_category', true);
                    updateProcessingStep('category', 'complete',
                        `${t('report.ai.processing.category_found')} ${matchingCategory.attributes.name}`
                    );
                } else {
                    console.warn('Category ID not found in available categories:', aiData.category);
                    updateProcessingStep('category', 'complete',
                        `${t('report.ai.processing.category_not_matched')}`
                    );
                }
            }

            // Use AI description - backend generates privacy-safe text when PII is detected.
            const aiDescription = aiData.description;
            if (!needsManualCategory.value && aiDescription) {
                updateProcessingStep('description', 'pending', t('report.ai.processing.description'));
                await typeText(aiDescription);
                updateProcessingStep('description', 'complete', t('report.ai.processing.description_complete'));
            }

            // Apply AI-suggested service definition attribute values
            if (!needsManualCategory.value && aiData.attributes?.length && options.attributeValues) {
                await nextTick();

                const filledCount = applyAIAttributes(
                    aiData.attributes,
                    options.attributeValues,
                    options.visibleAttributes
                );

                if (filledCount > 0) {
                    updateProcessingStep('attributes', 'complete',
                        t('report.ai.processing.attributes_filled', { count: filledCount })
                    );
                }
            }

            updateProcessingStep('ai_analysis', 'complete', t('report.ai.processing.complete'));
            aiAnalysisComplete.value = true;
            incrementUsage();
        } catch (error) {
            aiAnalysisFailed.value = true;
            const message = error instanceof Error ? error.message : t('report.errors.ai_processing');
            processingSteps.value.push({ field: 'error', status: 'complete', message });
        } finally {
            isAIProcessing.value = false;
        }
    };

    const dismissPrivacyWarning = () => {
        privacyWarning.value = null;
    };

    const resetAIState = () => {
        processingSteps.value = [];
        aiAnalysisComplete.value = false;
        aiAnalysisFailed.value = false;
        aiSkippedBudget.value = false;
        activeField.value = null;
        privacyWarning.value = null;
        needsManualCategory.value = false;
    };

    return {
        // State
        isAIProcessing: readonly(isAIProcessing),
        aiAnalysisComplete,
        aiAnalysisFailed: readonly(aiAnalysisFailed),
        aiSkippedBudget: readonly(aiSkippedBudget),
        activeField: readonly(activeField),
        processingSteps: readonly(processingSteps),
        privacyWarning: readonly(privacyWarning),
        needsManualCategory: readonly(needsManualCategory),

        // Actions
        runAIAnalysis,
        resetAIState,
        dismissPrivacyWarning
    };
}
