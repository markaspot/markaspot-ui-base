// Base edition stub (workspace visibility gating is a commercial SaaS feature).
// The MIT base edition has no workspace tiers, so all access is permissive.
export type WorkspaceVisibility = 'public';

export function useWorkspaceVisibility() {
    const open = computed(() => true);
    const closed = computed(() => false);
    return {
        visibility: computed<WorkspaceVisibility>(() => 'public'),
        isBlocked: closed,
        canViewMap: open,
        canSubmit: open,
        requiresAuthForMap: closed,
        requiresAuthForSubmission: closed,
    };
}
