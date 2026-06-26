import { defineStore } from 'pinia';

/**
 * ServiceRequest Store
 *
 * State management for serviceRequest with reactive data and computed properties.
 *
 * Manages state using Pinia for reactive data management.
 */

export const useServiceRequestStore = defineStore('serviceRequest', {
    state: () => ({
        requests: [],
        loading: false,
        error: null,
        // Form draft state - persists when dialog closes for location picking
        formDraft: null as any
    }),
    actions: {
        saveFormDraft(draft: any) {
            this.formDraft = draft;
        },
        clearFormDraft() {
            this.formDraft = null;
        }
    }
});

// Enable Pinia HMR in development to prevent "getActivePinia()" errors
// when Vite hot-reloads this store module
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useServiceRequestStore, import.meta.hot));
}
