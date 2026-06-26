/**
 * useFailedSubmissionEdit Composable (Stub)
 *
 * Base app stub - returns no-op functions.
 * The pro-layer provides the full implementation for offline queue editing.
 */

export function useFailedSubmissionEdit() {
    const editingItem = ref(null);
    const shouldOpenForm = ref(false);
    const isEditing = computed(() => false);

    return {
        // State (readonly)
        editingItem: readonly(editingItem),
        shouldOpenForm: readonly(shouldOpenForm),
        isEditing,

        // Actions (no-op in base app)
        startEdit: async () => false,
        formOpened: () => {},
        completeEdit: async () => {},
        cancelEdit: () => {}
    };
}
