/**
 * Form Draft Persistence Composable (Stub)
 *
 * Base app stub - returns no-op functions.
 * The pro-layer provides the full implementation for offline draft persistence.
 */

interface FormStateRefs {
    description: Ref<string>
    category: Ref<string>
    facilityId?: Ref<string>
    email: Ref<string>
    phone: Ref<string>
    name: Ref<string>
    prename: Ref<string>
    gdprAccepted: Ref<boolean>
    uploadedMedia: Ref<unknown[]>
    location: Ref<unknown>
}

export function useFormDraftPersistence(_formRefs: FormStateRefs) {
    // State (all readonly refs with default values)
    const draftId = ref<string | null>(null);
    const isSaving = ref(false);
    const isLoading = ref(false);
    const lastSaved = ref<number | null>(null);
    const hasUnsavedChanges = ref(false);
    const saveError = ref<string | null>(null);

    return {
        // State
        draftId: readonly(draftId),
        isSaving: readonly(isSaving),
        isLoading: readonly(isLoading),
        lastSaved: readonly(lastSaved),
        hasUnsavedChanges: readonly(hasUnsavedChanges),
        saveError: readonly(saveError),

        // Core operations (no-op in base app)
        saveDraft: async () => null,
        loadDraft: async () => false,
        clearDraft: async () => {},

        // Media operations (no-op in base app)
        cacheMediaFile: async () => null,
        removeCachedMedia: async () => {},

        // Lifecycle (no-op in base app)
        initialize: async () => false,
        runCleanup: async () => ({ drafts: 0, media: 0 }),

        // Manual trigger (no-op in base app)
        triggerAutoSave: () => {}
    };
}
