/**
 * Embed Composable (MIT stub)
 *
 * Embed features are part of the pro-layer. This stub provides the isEmbed
 * flag so app.vue can check embed mode without pro-layer being present.
 */
export function useEmbed() {
    const isEmbed = computed(() => false);

    return {
        isEmbed,
        postToHost: () => {},
        signalResize: () => {},
        onHostMessage: () => {},
        startAutoResize: () => {},
        openInParent: () => {}
    };
}
